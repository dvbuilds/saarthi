import cloudinary from "../config/cloudinary.js";
import { Document } from "../models/Document.js";
import { extractPdfText } from "../services/extractPdfText.js";

export const uploadDocument = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "Upload A File" });
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "raw",
                folder: "saarthi",
            },
            async (error, result) => {
                if (error) {
                    return res.status(500).json({ message: error.message });
                }

                const document = await Document.create({
                    fileName: file.originalname,
                    fileUrl: result.secure_url,
                    cloudinaryId: result.public_id,
                    uploadedBy: req.user._id,

                });

                try {
                    const pages = await extractPdfText(result.secure_url);

                    document.extractedText = pages;

                    document.status = "ready";
                    await document.save();
                } catch (error) {
                
                    console.log("PDF Extraction Error:", error);
                    
                    document.status = "failed";
                    await document.save();
                }

                return res.status(201).json({ message: "Document Uploaded Successfully" });
            }
        )

        uploadStream.end(file.buffer);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const fetchAllDocuments = async (req, res) => {
    try {
        const documents = await Document.find({
            uploadedBy: req.user._id,
        }).sort({ createdAt: -1 });

        return res.status(200).json({ documents });
    } catch (error) {
        return res.status(500).json({
            message: "No documents found",
            error: error.message,
        });
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
        return res.status(500).json({ message: error.message })
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
            { resource_type: "raw"}

        );

        await Document.findByIdAndDelete(req.params.id);

        return res.status(200).json({ message: "File deleted succesfully" });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}