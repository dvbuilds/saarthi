import { Schema, model } from 'mongoose';

const questionSchema = new Schema({
    question: {
        type: String,
        required: true,
    },

    correctAnswer: {
        type: String,
        required: true,
    },

    userAnswer: {
        type: String,
    },

    topic: {
        type: String,
        required: true,
    },

    marksPerQuestion: {
        type: Number,
        required: true,
    },

    marksObtained: {
        type: Number,
    },

    feedback: {
        type: String,
    },

})

const attemptSchema = new Schema({
    
    questions: {
        type: [questionSchema],
        required: true,
    },

    totalMarks : {
        type: Number,
    },

    totalMarksObtained:{
        type: Number,
    },

    status: {
        type: String,
        enum: ["created", "in-progress", "submitted", "graded"],
        default: "created",
    },

    attemptedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },

    documentSource: {
        type: Schema.Types.ObjectId,
        ref: "Document",
    }
}, { timestamps: true });

export const Attempt = model("Attempt", attemptSchema);