import "dotenv/config";
import express from "express";
import multer from "multer";
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
import { startWorkers } from "./workers/startWorkers.js";

const app = express();

const startServer = async () => {
    await connectDB();

    // Workers need the DB connection ready before they can read/write
    // documents and generation jobs, so this only starts after connectDB resolves.
    startWorkers();

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

    // Centralized JSON error handler — catches multer file-filter/limit
    // errors (e.g. non-PDF uploads) and any other errors passed to next(err),
    // so the client always gets a friendly JSON message instead of Express's
    // default HTML 500 page.
    app.use((err, req, res, next) => {
        if (!err) return next();

        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: err.message });
        }

        console.error(err);
        return res.status(400).json({ message: err.message || "Something went wrong. Please try again." });
    });

    app.listen(process.env.PORT, () => {
        console.log(`Server is running at PORT ${process.env.PORT}`);
    });
};

startServer();