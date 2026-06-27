import express from "express";
import { generateSummary } from "../controllers/summaryController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/:id", protect, generateSummary);

export default router;