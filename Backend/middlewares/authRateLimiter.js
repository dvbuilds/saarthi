import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import IORedis from "ioredis";

const authRateLimitRedis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

authRateLimitRedis.on("error", (err) => {
    console.error("[authRateLimiter] Redis connection error:", err.message);
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.headers["cf-connecting-ip"] || req.ip),
    message: {
        message: "Too many attempts. Please wait a bit before trying again.",
    },
    store: new RedisStore({
        sendCommand: (...args) => authRateLimitRedis.call(...args),
        prefix: "auth-rl:",
    }),
});