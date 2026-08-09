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

        return res.status(200).json({
            status: job.status,
            type: job.type,

            result: job.result,

            completedChunks: job.completedChunks,
            totalChunks: job.totalChunks,
            progressPercent,
            error: job.status === "failed" ? job.error : null,
        });
    } catch (error) {
        return handleServerError(res, error, "Couldn't fetch job status.");
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