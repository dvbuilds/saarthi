import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";
import { Document } from "../models/Document.js";
import { documentQueue } from "../queues/documentQueue.js";
import { handleServerError } from "../utils/handleServerError.js";

export const uploadDocument = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "Upload A File" });
        }

        // NEW: hash the raw buffer to detect duplicate content before we touch Cloudinary/OCR
        const fileHash = crypto.createHash("sha256").update(file.buffer).digest("hex");

        // NEW: look for any previously-processed document with identical content
        const cachedDocument = await Document.findOne({
            fileHash,
            status: "ready",
        }).sort({ createdAt: -1 });

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "raw",
                folder: "saarthi",
                flags: "attachment:false",
            },
            async (error, result) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ message: "Upload failed. Please try again." });
                }

                if (cachedDocument) {
                    // NEW: reuse cached extraction — still create a fresh Document record
                    // (each user/upload keeps its own Cloudinary file + chat history),
                    // but skip the extraction queue entirely since we already have the text.
                    const document = await Document.create({
                        fileName: file.originalname,
                        fileUrl: result.secure_url,
                        cloudinaryId: result.public_id,
                        uploadedBy: req.user._id,
                        fileHash,
                        status: "ready",
                        extractedText: cachedDocument.extractedText,
                    });

                    console.log(`[upload] Reused cached extraction for hash ${fileHash.slice(0, 8)}…`);

                    return res.status(201).json({
                        message: "Document uploaded successfully. Using cached extraction.",
                        documentId: document._id,
                    });
                }

                const document = await Document.create({
                    fileName: file.originalname,
                    fileUrl: result.secure_url,
                    cloudinaryId: result.public_id,
                    uploadedBy: req.user._id,
                    fileHash,
                    status: "processing",
                });

                // Extraction now happens in the background worker — this request
                // returns immediately regardless of how many pages the PDF has.
                await documentQueue.add("extract-text", {
                    documentId: document._id.toString(),
                    fileUrl: result.secure_url,
                });

                return res.status(201).json({
                    message: "Document uploaded successfully. Processing in background.",
                    documentId: document._id,
                });
            }
        )

        uploadStream.end(file.buffer);
    } catch (error) {
        return handleServerError(res, error, "Upload failed. Please try again.");
    }
}

export const fetchAllDocuments = async (req, res) => {
    try {
        const documents = await Document.find({
            uploadedBy: req.user._id,
        }).sort({ createdAt: -1 });

        return res.status(200).json({ documents });
    } catch (error) {
        return handleServerError(res, error, "Couldn't load your documents. Please try again.");
    }
}

export const fetchDocumentById = async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            uploadedBy: req.user._id,
        });

        if (!document) {
            return res.status(404).json({ message: "File Not Found" });
        }

        if (document.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Unauthorized"
            })
        }

        return res.status(200).json({ document });

    } catch (error) {
        return handleServerError(res, error, "Couldn't load this document. Please try again.");
    }
}

export const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: "file not found" });
        }

        if (document.uploadedBy.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({
                    message: "Unautheorized",
                })
        }

        await cloudinary.uploader.destroy(
            document.cloudinaryId,
            { resource_type: "raw" }

        );

        await Document.findByIdAndDelete(req.params.id);

        return res.status(200).json({ message: "File deleted succesfully" });
    } catch (error) {
        return handleServerError(res, error, "Couldn't delete this file. Please try again.");
    }
}