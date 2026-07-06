import express from "express";
import { getJobStatus } from "../controllers/jobController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:jobId", protect, getJobStatus);

export default router;