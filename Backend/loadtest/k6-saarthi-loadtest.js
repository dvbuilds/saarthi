/**
 * Saarthi — full endpoint load test (k6)
 * ---------------------------------------
 * Install k6 first:
 *   macOS:   brew install k6
 *   Linux:   sudo apt install k6   (or see https://k6.io/docs/get-started/installation)
 *   Windows: choco install k6
 *
 * Run:
 *   BASE_URL=http://localhost:5000 k6 run k6-saarthi-loadtest.js
 *
 * Run only the cheap/safe scenarios (skip AI generation + skip destructive delete):
 *   k6 run --env SCENARIOS=smoke,reads k6-saarthi-loadtest.js
 *
 * Why this is split into scenarios instead of one big test:
 *  - /api/quiz, /api/flashcards, /api/summary, /api/notes are rate-limited to
 *    20 requests / 15 min PER USER (see aiRateLimiter.js) and each call costs
 *    real Groq API tokens. Hammering these with 50 VUs will just produce a
 *    wall of 429s and a Groq bill — not useful signal. Keep "ai_generation"
 *    at 1-2 VUs / a handful of iterations.
 *  - /health and /metrics are the two safe-to-blast endpoints — no auth,
 *    no DB writes, no third-party API cost. Good for finding your server's
 *    raw ceiling (event loop / connection handling limits).
 *  - Auth + reads (/me, /api/upload list) are a good middle ground for
 *    realistic concurrent-user simulation.
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

// Custom metrics so you get per-endpoint numbers in the summary, not just
// one blended average across every request the run makes.
const authLatency = new Trend("auth_latency", true);
const uploadLatency = new Trend("upload_latency", true);
const aiGenLatency = new Trend("ai_generation_latency", true);
const rateLimited429 = new Counter("rate_limited_responses");
const serverErrors5xx = new Counter("server_errors");

export const options = {
  scenarios: {
    // 1. Baseline smoke test — confirms the app is even reachable before
    //    you throw real load at it. Always runs.
    smoke: {
      executor: "constant-vus",
      vus: 1,
      duration: "10s",
      exec: "smoke",
    },

    // 2. Blast the cheap, unauthenticated endpoints to find the server's
    //    raw request-handling ceiling.
    reads: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 20 },
        { duration: "40s", target: 50 },
        { duration: "20s", target: 0 },
      ],
      exec: "healthAndMetrics",
      startTime: "12s", // after smoke finishes
    },

    // 3. Simulate concurrent users logging in and hitting authenticated
    //    read endpoints — this is closer to real traffic shape.
    auth_and_browse: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 10 },
        { duration: "40s", target: 25 },
        { duration: "20s", target: 0 },
      ],
      exec: "authAndBrowse",
      startTime: "95s",
    },

    // 4. AI generation endpoints — LOW volume on purpose (see comment above).
    //    This checks correctness + latency under a couple of concurrent
    //    requests, not throughput ceiling.
    ai_generation: {
      executor: "shared-iterations",
      vus: 2,
      iterations: 4,
      maxDuration: "5m",
      exec: "aiGeneration",
      startTime: "180s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"], // flag if 95th percentile exceeds 2s
    http_req_failed: ["rate<0.05"],    // flag if >5% of requests fail
  },
};

// ---------- Scenario functions ----------

export function smoke() {
  const res = http.get(`${BASE_URL}/health`);
  check(res, { "smoke: /health is 200": (r) => r.status === 200 });
  sleep(1);
}

export function healthAndMetrics() {
  group("unauthenticated reads", () => {
    const h = http.get(`${BASE_URL}/health`);
    check(h, { "/health 200": (r) => r.status === 200 });

    const m = http.get(`${BASE_URL}/metrics`);
    check(m, { "/metrics 200": (r) => r.status === 200 });

    if (h.status >= 500) serverErrors5xx.add(1);
    if (m.status >= 500) serverErrors5xx.add(1);
  });
  sleep(0.5);
}

export function authAndBrowse() {
  // Each VU registers a throwaway account once, then re-logs-in each
  // iteration to simulate real login traffic. Cookies are handled
  // automatically per-VU by k6's built-in cookie jar.
  const email = `loadtest_${__VU}_${randomString(6)}@example.com`;
  const password = "LoadTest123!@#";

  group("register", () => {
    const res = http.post(
      `${BASE_URL}/api/users/register`,
      JSON.stringify({ fullName: "Load Test", email, password }),
      { headers: { "Content-Type": "application/json" } }
    );
    authLatency.add(res.timings.duration);
    if (res.status === 429) rateLimited429.add(1);
    check(res, { "register: 201 or already exists (409)": (r) => [201, 409].includes(r.status) });
  });

  let loginRes;
  group("login", () => {
    loginRes = http.post(
      `${BASE_URL}/api/users/login`,
      JSON.stringify({ email, password }),
      { headers: { "Content-Type": "application/json" } }
    );
    authLatency.add(loginRes.timings.duration);
    if (loginRes.status === 429) rateLimited429.add(1);
    check(loginRes, { "login: 200": (r) => r.status === 200 });
  });

  if (loginRes.status !== 200) {
    sleep(1);
    return; // cookies not set — skip authenticated calls this iteration
  }

  group("authenticated reads", () => {
    const me = http.get(`${BASE_URL}/api/users/me`);
    check(me, { "/me: 200": (r) => r.status === 200 });

    const docs = http.get(`${BASE_URL}/api/upload`);
    check(docs, { "/api/upload list: 200": (r) => r.status === 200 });

    if (me.status >= 500) serverErrors5xx.add(1);
    if (docs.status >= 500) serverErrors5xx.add(1);
  });

  group("token refresh", () => {
    const refresh = http.post(`${BASE_URL}/api/users/refresh`);
    check(refresh, { "/refresh: 200 or 401": (r) => [200, 401].includes(r.status) });
  });

  sleep(Math.random() * 2); // stagger requests like real users
}

export function aiGeneration() {
  // NOTE: this needs a real logged-in user with a real uploaded PDF's
  // Mongo _id. Fill these in from a test account before running, or this
  // scenario will just measure 401/404 latency.
  const email = __ENV.TEST_EMAIL;
  const password = __ENV.TEST_PASSWORD;
  const documentId = __ENV.TEST_DOCUMENT_ID;

  if (!email || !password || !documentId) {
    console.warn(
      "ai_generation scenario skipped — set TEST_EMAIL, TEST_PASSWORD, TEST_DOCUMENT_ID env vars " +
      "(a real account with a PDF already uploaded via the UI) to exercise this scenario."
    );
    return;
  }

  const loginRes = http.post(
    `${BASE_URL}/api/users/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } }
  );
  if (loginRes.status !== 200) return;

  group("quiz generation", () => {
    const res = http.post(`${BASE_URL}/api/quiz/${documentId}`, null);
    aiGenLatency.add(res.timings.duration);
    if (res.status === 429) rateLimited429.add(1);
    check(res, { "quiz trigger: 200/202": (r) => [200, 202].includes(r.status) });
  });

  sleep(3); // give the BullMQ worker a moment; don't hammer Groq back-to-back
}
