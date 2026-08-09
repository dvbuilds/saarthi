import IORedis from "ioredis";

// Separate connection again — same reasoning as the rate limiter: keeps
// cache traffic isolated from BullMQ's queue/worker connections.
const cacheRedis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

cacheRedis.on("error", (err) => {
    console.error("[aiOutputCache] Redis connection error:", err.message);
});

const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

const buildKey = (fileHash, type, selectionSignature, count) =>
    `ai-cache:${fileHash}:${type}:${selectionSignature}:${count || ""}`;

/**
 * Returns the cached result array, or null on a miss. Caching is keyed by
 * the document's content hash (fileHash) rather than its Mongo _id — so
 * this hits across different users/documents that happen to be the exact
 * same PDF, not just repeat requests on one document. Documents without a
 * fileHash (older records, or a hashing failure at upload time) simply
 * never hit the cache — fails safe, not silently wrong.
 */
export const getCachedResult = async (fileHash, type, selectionSignature, count) => {
    if (!fileHash) return null;

    try {
        const raw = await cacheRedis.get(buildKey(fileHash, type, selectionSignature, count));
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        // A cache read failure should never break generation — worst case
        // we regenerate instead of serving from cache.
        console.error("[aiOutputCache] Read failed, treating as cache miss:", error.message);
        return null;
    }
};

export const setCachedResult = async (fileHash, type, selectionSignature, count, result) => {
    if (!fileHash) return;

    try {
        await cacheRedis.set(
            buildKey(fileHash, type, selectionSignature, count),
            JSON.stringify(result),
            "EX",
            CACHE_TTL_SECONDS
        );
    } catch (error) {
        console.error("[aiOutputCache] Write failed (non-fatal):", error.message);
    }
};
