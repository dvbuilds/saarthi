import crypto from "crypto";
import { GenerationJob } from "../models/GenerationJob.js";
import { generationQueue } from "../queues/generationQueue.js";
import { computeSelectionSignature } from "../utils/computeSelectionSignature.js";
import { getCachedResult } from "./aiOutputCache.js";
import { redlock } from "../utils/redlockClient.js";
import { ResourceLockedError } from "redlock";
import { generationCacheHits } from "../utils/metrics.js";

// BullMQ priority: 1 = processed first, higher numbers wait longer.
// Quiz and summary are the most latency-sensitive (short, synchronous-
// feeling interactions); flashcards and notes tolerate more wait since
// users review them progressively as chunks stream in. Notes isn't
// specified in the original guide — placed last since it's the least
// time-sensitive of the four (study notes are typically read later, not
// waited on live).
const QUEUE_PRIORITY_BY_TYPE = {
    quiz: 1,
    summary: 2,
    flashcards: 3,
    notes: 4,
};

// A job in any of these states is still "the job that's handling this
// request" — reuse it instead of queuing a duplicate. "failed" is
// deliberately excluded so a failed job can be retried with a fresh one.
const REUSABLE_STATUSES = ["queued", "processing", "completed"];

/**
 * Creates a new generation job, or returns an existing one if an
 * equivalent request (same user, document, type, and section selection)
 * is already queued/processing/completed. This is what makes a page
 * refresh mid-generation reconnect to the same job instead of restarting
 * it, and stops duplicate jobs firing from double-clicks or React effects
 * re-running.
 */
export const createOrReuseGenerationJob = async ({
    userId,
    documentId,
    type,
    selectedChunkIndexes,
    count,
    fileHash,
}) => {
    const selectionSignature = computeSelectionSignature(selectedChunkIndexes);

    // count only affects quiz output size, but two quiz requests for the
    // same document with different counts ARE different requests — fold
    // it into the key so they don't collide.
    const rawKey = `${userId}:${documentId}:${type}:${selectionSignature}:${count || ""}`;
    const idempotencyKey = crypto.createHash("sha256").update(rawKey).digest("hex");

    const lockResource = `lock:generation-job:${idempotencyKey}`;

    try {
        return await redlock.using([lockResource], 5000, async () => {
            const existingJob = await GenerationJob.findOne({
                idempotencyKey,
                status: { $in: REUSABLE_STATUSES },
            });

            if (existingJob) {
                return { job: existingJob, reused: true, cached: false };
            }

            // Cache check happens AFTER the idempotency check (a job already in
            // flight for this exact user+request takes priority — no point
            // serving a cache hit while their own job is mid-generation) but
            // BEFORE creating a new BullMQ job. A cache hit here means we skip
            // the queue entirely and return an already-"completed" job.
            const cachedResult = await getCachedResult(fileHash, type, selectionSignature, count);

            if (cachedResult) {
                generationCacheHits.labels(type).inc();

                const cachedJob = await GenerationJob.create({
                    document: documentId,
                    requestedBy: userId,
                    type,
                    status: "completed",
                    result: cachedResult,
                    totalChunks: 1,
                    completedChunks: 1,
                    idempotencyKey,
                });

                return { job: cachedJob, reused: false, cached: true };
            }

            const generationJob = await GenerationJob.create({
                document: documentId,
                requestedBy: userId,
                type,
                status: "queued",
                idempotencyKey,
            });

            await generationQueue.add("generate", {
                jobRecordId: generationJob._id.toString(),
                documentId,
                type,
                selectedChunkIndexes,
                count,
            }, {
                priority: QUEUE_PRIORITY_BY_TYPE[type] || 5,
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
            });

            return { job: generationJob, reused: false, cached: false };
        });
    } catch (error) {
        if (error instanceof ResourceLockedError) {
            // Someone else is genuinely creating/checking the exact same
            // job right now and didn't finish within the retry window —
            // rare (needs truly simultaneous identical requests) but real.
            // Surface a clear, specific message rather than the generic
            // fallback the controller's catch-all would otherwise show.
            throw new Error("This request is already being processed — please try again in a moment.");
        }
        throw error;
    }
};
