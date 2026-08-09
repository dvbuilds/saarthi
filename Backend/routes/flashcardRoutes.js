import express from "express";
import { generateFlashcards } from "../controllers/flashcardController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { aiGenerationLimiter } from "../middlewares/aiRateLimiter.js";

const router = express.Router();

router.post('/:id', protect, aiGenerationLimiter, generateFlashcards);

export default router;
