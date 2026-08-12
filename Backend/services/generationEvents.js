import IORedis from "ioredis";
import { logger } from "../utils/logger.js";

// The worker (workers/startWorkers.js) and the API server (controllers/
// jobController.js) are separate processes — worker.js explicitly runs no
// HTTP server, and API replicas scale independently of worker replicas
// (see worker.js's comment). That means the worker can't just push an SSE
// chunk directly to a browser; it has no connection to it. Redis pub/sub
// is the relay: the worker publishes each event to a per-job channel, and
// whichever API replica is holding that job's SSE connection subscribes
// and forwards it.
//
// A separate connection from the BullMQ queue/worker connections, same
// reasoning as aiOutputCache.js and the rate limiters — isolates this
// traffic from job-processing traffic. Pub/sub publishing and
// subscribing also each need their own dedicated connection in Redis
// (a subscribed connection can't issue other commands), so publisher and
// subscribers are kept separate below.
const publisher = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

publisher.on("error", (err) => {
    logger.error({ err }, "[generationEvents] publisher connection error");
});

const channelFor = (jobRecordId) => `gen-events:${jobRecordId}`;

/**
 * Publishes one real-time event for a generation job. Best-effort: a
 * publish failure (e.g. a momentary Redis blip) never breaks generation
 * itself — the job's MongoDB record is still the durable source of truth,
 * so a client without a live SSE connection (or one that missed an event)
 * still gets the full result via the snapshot sent when it connects, or
 * via the existing poll-based fallback.
 */
export const publishGenerationEvent = async (jobRecordId, event) => {
    try {
        await publisher.publish(channelFor(jobRecordId), JSON.stringify(event));
    } catch (err) {
        logger.error({ err, jobRecordId }, "[generationEvents] publish failed (non-fatal)");
    }
};

/**
 * Subscribes to a job's live event channel. Opens one dedicated Redis
 * connection per call (per SSE connection) — acceptable at this app's
 * scale (short-lived generation jobs, not long-running chat sockets);
 * worth revisiting with a shared multiplexed subscriber if concurrent
 * generation traffic ever grows large enough for connection count to
 * matter, same spirit as groqCircuitBreaker.js's in-memory-state note.
 *
 * Returns an unsubscribe function — always call it when the SSE
 * connection closes, or the Redis connection leaks.
 */
export const subscribeToGenerationEvents = (jobRecordId, onEvent) => {
    const subscriber = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    const channel = channelFor(jobRecordId);

    subscriber.on("error", (err) => {
        logger.error({ err, jobRecordId }, "[generationEvents] subscriber connection error");
    });

    subscriber.subscribe(channel).catch((err) => {
        logger.error({ err, jobRecordId }, "[generationEvents] subscribe failed");
    });

    subscriber.on("message", (receivedChannel, message) => {
        if (receivedChannel !== channel) return;
        try {
            onEvent(JSON.parse(message));
        } catch (err) {
            logger.error({ err, jobRecordId }, "[generationEvents] failed to parse event message");
        }
    });

    return () => {
        subscriber.unsubscribe(channel).catch(() => {});
        subscriber.disconnect();
    };
};
