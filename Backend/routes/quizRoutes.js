import express from 'express';
import { generateQuiz } from '../controllers/quizController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/:id", protect, generateQuiz);

export default router;