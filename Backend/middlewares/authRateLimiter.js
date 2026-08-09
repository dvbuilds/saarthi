import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import IORedis from "ioredis";

// Separate connection again, consistent with aiRateLimiter.js and
// aiOutputCache.js — isolates this traffic from BullMQ's connections.
const authRateLimitRedis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

authRateLimitRedis.on("error", (err) => {
    console.error("[authRateLimiter] Redis connection error:", err.message);
});

// Applies to login, register, and forgot-password — the three endpoints
// reachable WITHOUT already being authenticated, which makes them the
// ones exposed to brute-force credential guessing (login), spam account
// creation (register), and using forgot-password to flood a stranger's
// inbox with reset emails. Keyed by IP since there's no req.user yet at
// this point in the request lifecycle.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    message: {
        message: "Too many attempts. Please wait a bit before trying again.",
    },
    store: new RedisStore({
        sendCommand: (...args) => authRateLimitRedis.call(...args),
        prefix: "auth-rl:",
    }),
});
