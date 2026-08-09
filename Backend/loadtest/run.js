// Usage: npm run loadtest
// Optional env vars:
//   BASE_URL   — target server (default: http://localhost:5000)
//   DURATION   — seconds per benchmark (default: 10)
//   CONNECTIONS — concurrent connections (default: 20)
//
// Benchmarks unauthenticated endpoints only by default (/health, /metrics)
// since those need no setup to run out of the box. To benchmark an
// authenticated route, add an entry to TARGETS below with a `headers`
// object carrying a valid access token cookie — left as a documented
// extension point rather than baked in, since a valid token requires a
// real logged-in user and isn't something this script can generate itself.
//
// Results are saved to loadtest/baseline.json. On the next run, each
// endpoint's average latency and requests/sec are compared against its
// saved baseline — a REGRESSION_THRESHOLD-exceeding drop in throughput or
// increase in latency prints a warning (and exits non-zero, so this can
// gate a CI job) instead of silently passing.

import autocannon from "autocannon";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = join(__dirname, "baseline.json");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const DURATION = Number(process.env.DURATION) || 10;
const CONNECTIONS = Number(process.env.CONNECTIONS) || 20;
const REGRESSION_THRESHOLD = 0.2; // 20% worse than baseline triggers a warning

const TARGETS = [
    { name: "health-check", url: `${BASE_URL}/health` },
    { name: "metrics-endpoint", url: `${BASE_URL}/metrics` },
];

const loadBaseline = () => {
    if (!existsSync(BASELINE_PATH)) return {};
    try {
        return JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
    } catch {
        return {};
    }
};

const compareToBaseline = (name, current, baseline) => {
    if (!baseline?.[name]) {
        console.log(`  (no baseline yet for "${name}" — this run becomes the baseline)`);
        return true;
    }

    const prev = baseline[name];
    const latencyRegression = (current.latencyAvg - prev.latencyAvg) / prev.latencyAvg;
    const throughputRegression = (prev.requestsAvg - current.requestsAvg) / prev.requestsAvg;

    let ok = true;

    if (latencyRegression > REGRESSION_THRESHOLD) {
        console.warn(`  ⚠ Latency regressed ${(latencyRegression * 100).toFixed(1)}% vs baseline (${prev.latencyAvg}ms → ${current.latencyAvg}ms)`);
        ok = false;
    }
    if (throughputRegression > REGRESSION_THRESHOLD) {
        console.warn(`  ⚠ Throughput dropped ${(throughputRegression * 100).toFixed(1)}% vs baseline (${prev.requestsAvg} req/s → ${current.requestsAvg} req/s)`);
        ok = false;
    }
    if (ok) {
        console.log(`  ✓ Within ${REGRESSION_THRESHOLD * 100}% of baseline`);
    }

    return ok;
};

const run = async () => {
    console.log(`Load testing ${BASE_URL} — ${CONNECTIONS} connections, ${DURATION}s per endpoint\n`);

    const baseline = loadBaseline();
    const newBaseline = { ...baseline };
    let allOk = true;

    for (const target of TARGETS) {
        console.log(`→ ${target.name} (${target.url})`);

        let result;
        try {
            result = await autocannon({
                url: target.url,
                connections: CONNECTIONS,
                duration: DURATION,
                headers: target.headers,
            });
        } catch (error) {
            console.error(`  ✗ Failed to reach ${target.url}: ${error.message}`);
            console.error(`    (is the server actually running at ${BASE_URL}?)`);
            allOk = false;
            continue;
        }

        const summary = {
            latencyAvg: Number(result.latency.average.toFixed(2)),
            requestsAvg: Number(result.requests.average.toFixed(2)),
            errors: result.errors,
            timeouts: result.timeouts,
        };

        console.log(`  ${summary.requestsAvg} req/s, ${summary.latencyAvg}ms avg latency, ${summary.errors} errors`);

        if (summary.errors > 0 || summary.timeouts > 0) {
            console.warn(`  ⚠ ${summary.errors} errors / ${summary.timeouts} timeouts during this run`);
            allOk = false;
        }

        const passed = compareToBaseline(target.name, summary, baseline);
        allOk = allOk && passed;

        newBaseline[target.name] = summary;
        console.log("");
    }

    writeFileSync(BASELINE_PATH, JSON.stringify(newBaseline, null, 2));
    console.log(`Baseline saved to ${BASELINE_PATH}`);

    if (!allOk) {
        console.error("\nLoad test detected regressions or errors — see warnings above.");
        process.exit(1);
    }
};

run();
