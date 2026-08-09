import mongoose from "mongoose";

// TRADE-OFF: the guide says "Dead Letter Queue" — a literal reading would
// mean a second BullMQ queue. I went with a Mongo collection instead:
// it's immediately queryable/inspectable (which is the actual point of a
// DLQ — "so a human can look at what failed") without needing a separate
// consumer or admin tool built around an unconsumed BullMQ queue. If this
// later needs automated reprocessing rather than manual inspection, a real
// second queue would be the better fit — worth revisiting then, not now.
const deadLetterJobSchema = new mongoose.Schema({
    jobRecordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GenerationJob",
        required: true,
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
    },
    type: {
        type: String,
    },
    error: {
        type: String,
    },
    attemptsMade: {
        type: Number,
    },
}, { timestamps: true });

export const DeadLetterJob = mongoose.model("DeadLetterJob", deadLetterJobSchema);
