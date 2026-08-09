import express from 'express';
import { generateQuiz } from '../controllers/quizController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { aiGenerationLimiter } from "../middlewares/aiRateLimiter.js";

const router = express.Router();

router.post("/:id", protect, aiGenerationLimiter, generateQuiz);

export default router;
