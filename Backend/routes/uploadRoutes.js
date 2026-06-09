import express from "express";
import { uploadDocument,fetchAllDocuments, fetchDocumentById, deleteDocument } from "../controllers/uploadController.js";
import upload from "../middlewares/uploadMiddleware.js";
import {protect} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, upload.single("pdf"), uploadDocument );
router.get("/:id",protect, fetchDocumentById);
router.get("/",protect, fetchAllDocuments);
router.delete("/:id",protect, deleteDocument);

export default router;