import mongoose from "mongoose";

const generationJobSchema = new mongoose.Schema({
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
    },

    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    type: {
        type: String,
        enum: ["quiz", "flashcards", "summary", "notes"],
        required: true,
    },

    status: {
        type: String,
        enum: ["queued", "processing", "completed", "failed", "cancelled"],
        default: "queued",
    },

    // Deterministic hash of userId+documentId+type+selection. Lets the
    // trigger endpoint return an existing active/completed job instead of
    // creating a duplicate — this is what makes "refresh mid-generation"
    // reconnect to the same job instead of restarting it.
    idempotencyKey: {
        type: String,
        index: true,
    },

    result: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },

    // NEW: progress tracking for streamed/partial results
    totalChunks: {
        type: Number,
        default: 0,
    },

    completedChunks: {
        type: Number,
        default: 0,
    },

    error: {
        type: String,
        default: null,
    },
}, { timestamps: true });

export const GenerationJob = mongoose.model("GenerationJob", generationJobSchema);