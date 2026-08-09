import express from "express";
import { generateSummary } from "../controllers/summaryController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { aiGenerationLimiter } from "../middlewares/aiRateLimiter.js";

const router = express.Router();

router.post("/:id", protect, aiGenerationLimiter, generateSummary);

export default router;
