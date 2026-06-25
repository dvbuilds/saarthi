import express from 'express';
import { chatWithPDF } from "../controllers/chatController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/:id', protect, chatWithPDF);

export default router;