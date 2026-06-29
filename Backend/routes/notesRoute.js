import express from 'express';
import { generateNotes } from '../controllers/notesController.js';
import { protect } from '../middlewares/authMiddleware.js'

const router = express.Router();

router.post("/:id", protect, generateNotes);

export default router;