import express from 'express';
import { generateNotes } from '../controllers/notesController.js';
import { protect } from '../middlewares/authMiddleware.js'
import { aiGenerationLimiter } from "../middlewares/aiRateLimiter.js";

const router = express.Router();

router.post("/:id", protect, aiGenerationLimiter, generateNotes);

export default router;
