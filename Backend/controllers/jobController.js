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

        return res.status(200).json({
            status: job.status,
            type: job.type,
            result: job.status === "completed" ? job.result : null,
            error: job.status === "failed" ? job.error : null,
        });
    } catch (error) {
        return handleServerError(res, error, "Couldn't fetch job status.");
    }
}