import { GenerationJob } from "../models/GenerationJob.js";
import { handleServerError } from "../utils/handleServerError.js";

export const getJobStatus = async (req, res) => {
    try {
        const job = await GenerationJob.findOne({
            _id: req.params.jobId,
            requestedBy: req.user._id,
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const progressPercent = job.totalChunks > 0
            ? Math.round((job.completedChunks / job.totalChunks) * 100)
            : 0;

        // Quiz answers/explanations never reach the client here — a student
        // reading the raw network response shouldn't be able to see the
        // answer key before answering. Correctness is checked server-side
        // instead, via POST /:jobId/quiz-answer below.
        let safeResult = job.result;
        if (job.type === "quiz" && Array.isArray(job.result)) {
            safeResult = job.result.map(({ question, options }) => ({ question, options }));
        }

        return res.status(200).json({
            status: job.status,
            type: job.type,
            result: safeResult,
            completedChunks: job.completedChunks,
            totalChunks: job.totalChunks,
            progressPercent,
            error: job.status === "failed" ? job.error : null,
        });
    } catch (error) {
        return handleServerError(res, error, "Couldn't fetch job status.");
    }
}

// Checks one answer against the real (server-only) answer key and reveals
// correctness + explanation only after the student has actually answered.
export const checkQuizAnswer = async (req, res) => {
    try {
        const { questionIndex, selectedAnswer } = req.body;

        if (typeof questionIndex !== "number" || !selectedAnswer) {
            return res.status(400).json({ message: "questionIndex and selectedAnswer are required" });
        }

        const job = await GenerationJob.findOne({
            _id: req.params.jobId,
            requestedBy: req.user._id,
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.type !== "quiz") {
            return res.status(400).json({ message: "This job is not a quiz" });
        }

        if (job.status !== "completed") {
            return res.status(400).json({ message: "Quiz is not ready yet" });
        }

        const question = job.result?.[questionIndex];

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        return res.status(200).json({
            correct: question.answer === selectedAnswer,
            correctAnswer: question.answer,
            explanation: question.explanation,
        });
    } catch (error) {
        return handleServerError(res, error, "Couldn't check your answer. Please try again.");
    }
}

// A job can only be cancelled by the user who requested it, and only while
// it hasn't already reached a terminal state. The worker checks this
// status between batches and stops processing — see startWorkers.js.
export const cancelJob = async (req, res) => {
    try {
        const job = await GenerationJob.findOne({
            _id: req.params.jobId,
            requestedBy: req.user._id,
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (["completed", "failed", "cancelled"].includes(job.status)) {
            return res.status(400).json({ message: `Job is already ${job.status}, nothing to cancel.` });
        }

        job.status = "cancelled";
        await job.save();

        return res.status(200).json({ message: "Job cancelled" });
    } catch (error) {
        return handleServerError(res, error, "Couldn't cancel this job.");
    }
}