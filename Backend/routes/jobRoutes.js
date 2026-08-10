import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getJobStatus, cancelJob, checkQuizAnswer } from "../controllers/jobController.js";

const router = express.Router();

router.post("/:jobId/quiz-answer", protect, checkQuizAnswer);
router.get("/:jobId", protect, getJobStatus);
router.post("/:jobId/cancel", protect, cancelJob);

export default router;