import express from "express";
import { getJobStatus, cancelJob } from "../controllers/jobController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:jobId", protect, getJobStatus);
router.post("/:jobId/cancel", protect, cancelJob);

export default router;