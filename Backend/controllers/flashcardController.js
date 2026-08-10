import { Document } from "../models/Document.js";
import { createOrReuseGenerationJob } from "../services/generationJobService.js";
import { handleServerError } from "../utils/handleServerError.js";

export const generateFlashcards = async (req, res) => {
    try {
        const docId = req.params.id;
        const { selectedChunkIndexes } = req.body || {};

        const document = await Document.findOne({
            _id: docId,
            uploadedBy: req.user._id,
        });

        if (!document) {
            return res.status(404).json({ message: "Document Not Found" });
        }

        if (document.status !== 'ready') {
            return res.status(400).json({ message: "Document still processing" });
        }

        const { job, reused, cached } = await createOrReuseGenerationJob({
            userId: req.user._id,
            documentId: document._id,
            type: "flashcards",
            selectedChunkIndexes,
            fileHash: document.fileHash,
        });

        return res.status(202).json({
            message: cached ? "Flashcards ready instantly (matched a cached result)" : reused ? "Reconnected to an in-progress generation" : "Flashcard generation started",
            jobId: job._id,
        });
    } catch (error) {
        return handleServerError(res, error, "Couldn't generate content. Please try again.")
    }
};
