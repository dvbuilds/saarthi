import "dotenv/config";
import express from "express";
import connectDB from "./connect/db.js"
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js";
import chatRoutes from './routes/chatRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';

const app = express();

connectDB();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/summary', summaryRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Server is running"});
} )

app.listen(process.env.PORT, () => {
    console.log(`Server is running at PORT ${process.env.PORT}`);
});