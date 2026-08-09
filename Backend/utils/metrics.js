import client from "prom-client";

// Default Node.js process metrics: event loop lag, memory (RSS/heap), GC
// pause duration, active handles — the baseline health signals for any
// Node service, essentially free to collect.
client.collectDefaultMetrics({ prefix: "saarthi_" });

export const httpRequestDuration = new client.Histogram({
    name: "saarthi_http_request_duration_seconds",
    help: "HTTP request duration in seconds, labeled by method/route/status",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
});

export const generationJobsTotal = new client.Counter({
    name: "saarthi_generation_jobs_total",
    help: "Total generation jobs processed, labeled by type and final status",
    labelNames: ["type", "status"], // status: completed | failed | cancelled
});

export const generationJobDuration = new client.Histogram({
    name: "saarthi_generation_job_duration_seconds",
    help: "Time from job creation to completion, labeled by type",
    labelNames: ["type"],
    buckets: [1, 5, 10, 30, 60, 120, 300, 600],
});

export const generationCacheHits = new client.Counter({
    name: "saarthi_generation_cache_hits_total",
    help: "Generation requests served from the fileHash-based Redis cache instead of regenerating",
    labelNames: ["type"],
});

export const groqCircuitState = new client.Gauge({
    name: "saarthi_groq_circuit_state",
    help: "Groq circuit breaker state: 0=closed, 1=half_open, 2=open",
});

// Express middleware — times every request and records it against the
// route PATTERN (e.g. "/api/jobs/:jobId"), not the raw URL. Using the raw
// URL would create a separate metric series per job ID, growing without
// bound (unbounded cardinality is the classic way to quietly kill a
// Prometheus instance's memory).
export const metricsMiddleware = (req, res, next) => {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
        const route = req.route ? `${req.baseUrl}${req.route.path}` : req.path;
        httpRequestDuration.labels(req.method, route, String(res.statusCode)).observe(durationSeconds);
    });

    next();
};

export const metricsRegistry = client.register;
