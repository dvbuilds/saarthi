// Drop this into Backend/loadtest/run-authenticated.js
//
// Extends the existing loadtest/run.js (which only benchmarks /health and
// /metrics) by logging in first and reusing the returned cookies to
// benchmark authenticated GET endpoints too. Reuses the same
// baseline.json + regression-check logic as run.js so results are
// comparable across runs.
//
// Usage:
//   TEST_EMAIL=you@example.com TEST_PASSWORD=yourpassword node loadtest/run-authenticated.js
//
// Optional env vars (same as run.js):
//   BASE_URL, DURATION, CONNECTIONS
//
// Why a separate script instead of editing run.js's TARGETS directly:
// run.js is meant to run with zero setup (e.g. in CI, hitting a fresh
// deploy with no test user yet). This script needs a real account to log
// in with, so it stays opt-in.

import autocannon from "autocannon";
import axios from "axios";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = join(__dirname, "baseline-authenticated.json");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const DURATION = Number(process.env.DURATION) || 10;
const CONNECTIONS = Number(process.env.CONNECTIONS) || 20;
const REGRESSION_THRESHOLD = 0.2;

const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error("Set TEST_EMAIL and TEST_PASSWORD to a real (throwaway) test account before running this.");
  process.exit(1);
}

const login = async () => {
  const res = await axios.post(
    `${BASE_URL}/api/users/login`,
    { email: TEST_EMAIL, password: TEST_PASSWORD },
    { withCredentials: true, validateStatus: () => true }
  );

  if (res.status !== 200) {
    throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.data)}`);
  }

  // axios exposes raw Set-Cookie headers here; forward them verbatim as
  // the Cookie header autocannon will send on every request.
  const setCookies = res.headers["set-cookie"] || [];
  const cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");

  if (!cookieHeader) {
    throw new Error("Login succeeded but no Set-Cookie header was returned — check accessToken cookie config.");
  }

  return cookieHeader;
};

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
  if (ok) console.log(`  ✓ Within ${REGRESSION_THRESHOLD * 100}% of baseline`);
  return ok;
};

const run = async () => {
  console.log(`Logging in as ${TEST_EMAIL} at ${BASE_URL}...`);
  const cookieHeader = await login();
  console.log("Login OK — cookies captured.\n");

  // Set this to a real document _id from your account (grab one from the
  // GET /api/upload response) — required for the two single-document
  // targets below. Left as an env var so you're not hardcoding your own
  // data into a script that might get committed.
  const TEST_DOCUMENT_ID = process.env.TEST_DOCUMENT_ID;

  const TARGETS = [
    { name: "me", url: `${BASE_URL}/api/users/me`, headers: { cookie: cookieHeader } },
    { name: "list-documents", url: `${BASE_URL}/api/upload`, headers: { cookie: cookieHeader } },
  ];

  if (TEST_DOCUMENT_ID) {
    TARGETS.push(
      { name: "get-document", url: `${BASE_URL}/api/upload/${TEST_DOCUMENT_ID}`, headers: { cookie: cookieHeader } },
      { name: "get-document-sections", url: `${BASE_URL}/api/upload/${TEST_DOCUMENT_ID}/sections`, headers: { cookie: cookieHeader } },
    );
  } else {
    console.log("TEST_DOCUMENT_ID not set — skipping get-document and get-document-sections targets.\n");
  }

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
      allOk = false;
      continue;
    }

    const summary = {
      latencyAvg: Number(result.latency.average.toFixed(2)),
      requestsAvg: Number(result.requests.average.toFixed(2)),
      errors: result.errors,
      timeouts: result.timeouts,
      non2xx: result["4xx"] + result["5xx"], // catches silent auth failures (401s) skewing throughput
    };

    console.log(`  ${summary.requestsAvg} req/s, ${summary.latencyAvg}ms avg latency, ${summary.errors} errors, ${summary.non2xx} non-2xx responses`);

    if (summary.errors > 0 || summary.timeouts > 0 || summary.non2xx > 0) {
      console.warn(`  ⚠ Non-2xx responses or errors during this run — check auth cookie is still valid (access tokens expire after 15 min).`);
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
    console.error("\nLoad test detected regressions, errors, or auth failures — see warnings above.");
    process.exit(1);
  }
};

run().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});