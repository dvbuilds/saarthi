import { Document } from "../models/Document.js";
import { handleServerError } from "../utils/handleServerError.js";

// GET /api/upload/:id/sections
export const getDocumentSections = async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            uploadedBy: req.user._id,
        }).select("sections status");

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        if (document.status !== "ready") {
            return res.status(409).json({ message: "Document is still processing", status: document.status });
        }

        return res.status(200).json({ sections: document.sections });
    } catch (error) {
        return handleServerError(res, error, "Couldn't fetch document sections.");
    }
};
