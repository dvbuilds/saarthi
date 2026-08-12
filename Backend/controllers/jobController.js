import { GenerationJob } from "../models/GenerationJob.js";
import { handleServerError } from "../utils/handleServerError.js";
import { logger } from "../utils/logger.js";
import { sanitizeGenerationResult, sanitizeQuizItem } from "../utils/sanitizeGenerationResult.js";
import { subscribeToGenerationEvents } from "../services/generationEvents.js";

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

        return res.status(200).json({
            status: job.status,
            type: job.type,
            result: sanitizeGenerationResult(job.type, job.result),
            completedChunks: job.completedChunks,
            totalChunks: job.totalChunks,
            progressPercent,
            error: job.status === "failed" ? job.error : null,
        });
    } catch (error) {
        return handleServerError(res, error, "Couldn't fetch job status.");
    }
}

const TERMINAL_STATUSES = ["completed", "failed", "cancelled"];

// Real-time companion to getJobStatus above — same auth/ownership check
// and the exact same quiz-answer stripping, but pushed to the client as
// Server-Sent Events instead of requiring a poll. The worker process
// (workers/startWorkers.js) publishes events over Redis as it streams
// each chunk's Groq response; this handler relays them to the browser as
// they arrive, so generated items appear one at a time while the model is
// still writing the rest — see services/generationEvents.js for why a
// pub/sub relay is needed (worker and API run in separate processes).
export const streamJobEvents = async (req, res) => {
    let job;
    try {
        job = await GenerationJob.findOne({
            _id: req.params.jobId,
            requestedBy: req.user._id,
        });
    } catch (error) {
        return handleServerError(res, error, "Couldn't open the generation stream.");
    }

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        // Disable any intermediary buffering (nginx et al.) that would
        // otherwise hold back chunks until the connection closes, which
        // would silently turn this back into "wait for everything, then
        // reveal it all at once" — exactly what this feature exists to
        // avoid.
        "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();

    const send = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Always send a snapshot first — this is what makes "already generated
    // content stays visible" true even for a client connecting mid-
    // generation (a fresh page load) or reconnecting after a dropped
    // connection, not just one that was live for the whole thing.
    send("snapshot", {
        status: job.status,
        result: sanitizeGenerationResult(job.type, job.result),
        completedChunks: job.completedChunks,
        totalChunks: job.totalChunks,
        error: job.status === "failed" ? job.error : null,
    });

    if (TERMINAL_STATUSES.includes(job.status)) {
        // Nothing further will ever be published for this job — closing
        // now avoids opening a Redis subscription that would sit idle
        // forever.
        return res.end();
    }

    let closed = false;
    let heartbeat = null;

    const cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        unsubscribe();
        res.end();
    };

    const unsubscribe = subscribeToGenerationEvents(job._id.toString(), (event) => {
        if (closed) return;

        switch (event.type) {
            case "item":
                send("item", { item: job.type === "quiz" ? sanitizeQuizItem(event.item) : event.item });
                break;
            case "progress":
                send("progress", { completedChunks: event.completedChunks, totalChunks: event.totalChunks });
                break;
            case "done":
                send("done", { result: sanitizeGenerationResult(job.type, event.result) });
                cleanup();
                break;
            case "error":
                send("error", { message: event.message });
                cleanup();
                break;
            case "cancelled":
                send("cancelled", {});
                cleanup();
                break;
            default:
                break;
        }
    });

    // Keeps proxies/load balancers from treating a quiet gap between
    // batches (the worker's own 1.2s pacing pause, or Groq latency) as an
    // idle connection worth dropping.
    heartbeat = setInterval(() => {
        if (!closed) res.write(": ping\n\n");
    }, 15000);

    req.on("close", () => {
        logger.debug({ jobId: job._id.toString() }, "SSE client disconnected");
        cleanup();
    });
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