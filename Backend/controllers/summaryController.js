import { Document } from "../models/Document.js";
import { GenerationJob } from "../models/GenerationJob.js";
import { generationQueue } from "../queues/generationQueue.js";
import { handleServerError } from '../utils/handleServerError.js';

export const generateSummary = async (req, res) => {
    try {
        const docId = req.params.id;

        const document = await Document.findOne({
            _id: docId,
            uploadedBy: req.user._id,
        })

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        if (document.status !== 'ready') {
            return res.status(400).json({ message: "Document still processing" });
        }

        const generationJob = await GenerationJob.create({
            document: document._id,
            requestedBy: req.user._id,
            type: "summary",
            status: "queued",
        });

        await generationQueue.add("generate", {
            jobRecordId: generationJob._id.toString(),
            documentId: document._id.toString(),
            type: "summary",
        });

        return res.status(202).json({
            message: "Summary generation started",
            jobId: generationJob._id,
        });
    } catch (error) {
        return handleServerError(res, error, "Couldn't generate content. Please try again.")
    }
}