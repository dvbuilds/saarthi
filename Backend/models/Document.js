import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
        unique: true,
    },
    cloudinaryId:{
        type: String,
        required: true,
    },
    fileHash: {
        type: String,
        index: true,
    },
    status: {
        type: String,
        enum:["processing", "ready", "failed"],
        default: "processing",
    },
    extractedText: [
        {
            pageNumber: Number,
            content: String,
        }
    ],
    chatHistory: [
        {
            role: {
                type: String,
                enum: ["user", "assistant"],
                required: true,
            },
            content: {
                type: String,
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            }
        }
    ],
}, { timestamps: true })

export const Document = mongoose.model("Document", documentSchema);