import express from "express";
import { getJobStatus } from "../controllers/jobController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/jobs/:jobId", protect, getJobStatus);

export default router;