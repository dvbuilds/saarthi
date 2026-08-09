import { Document } from "../models/Document.js";
import { createOrReuseGenerationJob } from "../services/generationJobService.js";
import { handleServerError } from "../utils/handleServerError.js";

export const generateQuiz = async (req, res) => {
    try {
        const { count = 10, selectedChunkIndexes } = req.body;
        const docId = req.params.id;

        const document = await Document.findOne({
            _id: docId,
            uploadedBy: req.user._id,
        });

        if (!document) {
            return res.status(404).json({ message: "File not found" });
        }

        if (document.status !== 'ready') {
            return res.status(400).json({ message: "File is still processing" });
        }

        const { job, reused, cached } = await createOrReuseGenerationJob({
            userId: req.user._id,
            documentId: document._id,
            type: "quiz",
            selectedChunkIndexes,
            fileHash: document.fileHash,
            count,
        });

        return res.status(202).json({
            message: cached ? "Quiz ready instantly (matched a cached result)" : reused ? "Reconnected to an in-progress generation" : "Quiz generation started",
            jobId: job._id,
        });
    } catch (error) {
        return handleServerError(res, error, "Couldn't generate content. Please try again");
    }
}
