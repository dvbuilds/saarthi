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
    ]
}, { timestamps: true })

export const Document = mongoose.model("Document", documentSchema);