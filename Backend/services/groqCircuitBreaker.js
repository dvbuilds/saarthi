// Simple CLOSED -> OPEN -> HALF_OPEN circuit breaker around Groq calls.
//
// KNOWN LIMITATION: this state is in-process memory, not Redis-backed.
// Fine for a single worker process (today's setup). If/when horizontal
// worker scaling (multiple processes/machines) is added, each process
// would track its own breaker independently rather than sharing one view
// of Groq's health — worth revisiting at that point, not before.
import { logger } from "../utils/logger.js";
import { groqCircuitState } from "../utils/metrics.js";

const FAILURE_THRESHOLD = 5;
const OPEN_DURATION_MS = 60 * 1000; // cooldown before allowing a probe request

const STATE_METRIC_VALUE = { CLOSED: 0, HALF_OPEN: 1, OPEN: 2 };

let state = "CLOSED"; // CLOSED | OPEN | HALF_OPEN
let consecutiveFailures = 0;
let openedAt = null;

const setState = (next) => {
    state = next;
    groqCircuitState.set(STATE_METRIC_VALUE[next]);
};

export const callGroqWithBreaker = async (fn) => {
    if (state === "OPEN") {
        if (Date.now() - openedAt >= OPEN_DURATION_MS) {
            setState("HALF_OPEN");
            logger.info("[circuitBreaker] Cooldown elapsed — allowing a probe request through");
        } else {
            const err = new Error("AI service is temporarily unavailable. Please try again shortly.");
            err.isCircuitBreakerOpen = true;
            throw err;
        }
    }

    try {
        const result = await fn();

        if (state === "HALF_OPEN") {
            logger.info("[circuitBreaker] Probe succeeded — closing circuit");
        }
        setState("CLOSED");
        consecutiveFailures = 0;
        return result;

    } catch (error) {
        consecutiveFailures += 1;

        // A failed probe reopens immediately (don't wait for the threshold
        // again) — the whole point of HALF_OPEN is "we're not sure yet",
        // and this answers that.
        if (state === "HALF_OPEN" || consecutiveFailures >= FAILURE_THRESHOLD) {
            setState("OPEN");
            openedAt = Date.now();
            logger.error({ consecutiveFailures }, "[circuitBreaker] Opening circuit after consecutive Groq failures");
        }

        throw error;
    }
};
