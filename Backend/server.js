import "dotenv/config";
import express from "express";
import multer from "multer";
import pinoHttp from "pino-http";
import connectDB from "./connect/db.js"
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js";
import chatRoutes from './routes/chatRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';
import notesRoutes from './routes/notesRoute.js';
import jobRoutes from "./routes/jobRoutes.js";
import { logger } from "./utils/logger.js";
import { metricsMiddleware, metricsRegistry } from "./utils/metrics.js";

// Fail fast on missing critical env vars, rather than crashing confusingly
// mid-request the first time someone tries to log in (jwt.sign/verify with
// an undefined secret doesn't throw a clear error at the call site — it
// either throws something cryptic or, worse, silently signs with the
// string "undefined"). Better to refuse to start at all.
const REQUIRED_ENV_VARS = ["JWT_SECRET", "JWT_REFRESH_SECRET", "MONGODB_URI", "GROQ_API_KEY"];

const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
    logger.fatal({ missingEnvVars }, "Missing required environment variables — refusing to start");
    process.exit(1);
}

const app = express();

// Render (like most PaaS hosts) sits behind a reverse proxy — without this,
// req.ip always resolves to the proxy's internal IP, not the real client.
// Only matters where req.ip is actually used (e.g. the rate limiter's
// fallback key for unauthenticated requests), but it's cheap and correct
// to set globally.
app.set("trust proxy", 1);

const startServer = async () => {
    await connectDB();

    // The BullMQ worker runs as its own process now (see worker.js) — not
    // started here. This is what makes it possible to scale API replicas
    // and worker replicas independently (docker-compose --scale worker=N)
    // instead of every API instance also carrying full worker load.
    // Local dev: `npm run dev:full` still runs both together in one
    // terminal via concurrently, so this split doesn't cost you convenience
    // day-to-day — only production deployment topology changes.

    app.use(pinoHttp({
        logger,
        // Skip noisy health-check polling (Docker healthcheck + the
        // keep-alive cron job hit this every few minutes) — everything
        // else still gets a structured log line per request.
        autoLogging: {
            ignore: (req) => req.url === "/health",
        },
    }));
    app.use(metricsMiddleware);

    app.use(cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.use("/api/users", userRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/quiz', quizRoutes);
    app.use('/api/flashcards', flashcardRoutes);
    app.use('/api/summary', summaryRoutes);
    app.use("/api/notes", notesRoutes);
    app.use("/api/jobs", jobRoutes);

    app.get('/', (req, res) => {
        res.json({ message: "Server is running" });
    });

    app.get('/health', (req, res) => {
        res.status(200).send('OK');
    });

    app.get('/metrics', async (req, res) => {
        res.set("Content-Type", metricsRegistry.contentType);
        res.end(await metricsRegistry.metrics());
    });

    // Centralized JSON error handler — catches multer file-filter/limit
    // errors (e.g. non-PDF uploads) and any other errors passed to next(err),
    // so the client always gets a friendly JSON message instead of Express's
    // default HTML 500 page.
    app.use((err, req, res, next) => {
        if (!err) return next();

        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: err.message });
        }

        req.log?.error({ err }, "Unhandled request error") ?? logger.error({ err }, "Unhandled request error");
        return res.status(400).json({ message: err.message || "Something went wrong. Please try again." });
    });

    app.listen(process.env.PORT, () => {
        logger.info(`Server is running at PORT ${process.env.PORT}`);
    });
};

startServer();