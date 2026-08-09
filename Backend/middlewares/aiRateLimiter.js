import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import IORedis from "ioredis";

// Separate connection from the BullMQ queue/worker connections — keeps
// rate-limit command traffic isolated from job-processing traffic even
// though they'd technically work fine sharing one client.
const rateLimiterRedis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

rateLimiterRedis.on("error", (err) => {
    console.error("[rateLimiter] Redis connection error:", err.message);
});

// Applies to the 4 AI generation trigger endpoints (flashcards, quiz,
// summary, notes) — these are the expensive ones (each spins up multiple
// Groq calls via BullMQ), unlike cheap reads like /me or /jobs/:id which
// aren't limited here.
//
// Keyed per authenticated user, not per IP — these routes all sit behind
// `protect`, so req.user is always populated by the time this runs. IP is
// only a fallback for the theoretical case of a misconfigured route.
export const aiGenerationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20, // 20 generation requests per user per window
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req.ip),
    message: {
        message: "You've hit the generation limit for now. Please wait a bit before trying again.",
    },
    store: new RedisStore({
        sendCommand: (...args) => rateLimiterRedis.call(...args),
        prefix: "ai-rl:",
    }),
});
