import Redlock from "redlock";
import { redisConnection } from "../config/redisConnection.js";

// NOTE: true Redlock is designed to run against multiple independent Redis
// nodes for its fault-tolerance guarantees (a majority-quorum algorithm).
// This app runs a single Redis instance, so this provides the mutual-
// exclusion benefit (no two processes hold the same lock at once) but not
// Redlock's original multi-node crash-fault tolerance. Documented rather
// than silently overstating what single-instance locking actually
// guarantees — if Redis itself goes down, so does the lock, same as any
// other single-instance coordination point in this app already.
export const redlock = new Redlock([redisConnection], {
    retryCount: 10,
    retryDelay: 200, // ms
    retryJitter: 100, // ms
});

redlock.on("error", (error) => {
    // Redlock emits this for every failed *attempt* within its retry loop,
    // not just final failures — logging at warn, not error, to avoid
    // making transient contention look like a hard failure.
    console.warn("[redlock] Lock attempt error (may be a normal retry):", error.message);
});
