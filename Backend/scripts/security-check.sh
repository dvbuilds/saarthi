#!/usr/bin/env bash
# Saarthi — quick security sanity checks
# Usage: BASE_URL=http://localhost:5000 ./security-check.sh
# (defaults to http://localhost:5000 if BASE_URL is unset)
#
# This is NOT a substitute for a real scan (see the OWASP ZAP command at
# the bottom) — it's a fast, no-install way to catch the most common
# misconfigurations before you run a heavier tool.

BASE_URL="${BASE_URL:-http://localhost:5000}"
FAKE_ORIGIN="https://evil-attacker.example.com"

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; }
info() { echo "  → $1"; }

echo "Running security checks against $BASE_URL"
echo "=========================================="

echo -e "\n[1] Response headers on a basic GET (looking for security headers)"
HEADERS=$(curl -s -D - -o /dev/null "$BASE_URL/health")
echo "$HEADERS"
echo "$HEADERS" | grep -qi "x-content-type-options" \
  && pass "X-Content-Type-Options present" \
  || fail "X-Content-Type-Options missing — add the 'helmet' package (app.use(helmet())) to set this + other hardening headers in one line"
echo "$HEADERS" | grep -qi "strict-transport-security" \
  && pass "Strict-Transport-Security present" \
  || fail "HSTS header missing — again, helmet's default config sets this"
echo "$HEADERS" | grep -qi "x-powered-by" \
  && fail "X-Powered-By header leaks 'Express' — helmet removes this by default (info disclosure, low severity but free to fix)" \
  || pass "X-Powered-By not exposed"

echo -e "\n[2] CORS: does the API reflect an arbitrary Origin?"
CORS_HEADER=$(curl -s -D - -o /dev/null -H "Origin: $FAKE_ORIGIN" "$BASE_URL/api/users/me" | grep -i "access-control-allow-origin")
if echo "$CORS_HEADER" | grep -q "$FAKE_ORIGIN"; then
  fail "Server reflects arbitrary Origin ($CORS_HEADER) — should only allow FRONTEND_URL"
elif [ -z "$CORS_HEADER" ]; then
  pass "No Access-Control-Allow-Origin for an unrecognized origin (server.js restricts to FRONTEND_URL — good)"
else
  info "$CORS_HEADER"
fi

echo -e "\n[3] Protected route without a token — should be 401, not a stack trace or 500"
STATUS=$(curl -s -o /tmp/protected_body.json -w "%{http_code}" "$BASE_URL/api/users/me")
if [ "$STATUS" = "401" ]; then
  pass "GET /api/users/me without a cookie correctly returns 401"
else
  fail "GET /api/users/me without a cookie returned $STATUS (expected 401) — check body: $(cat /tmp/protected_body.json)"
fi

echo -e "\n[4] JWT tampering — does a malformed/garbage token get rejected cleanly?"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --cookie "accessToken=not.a.real.jwt" "$BASE_URL/api/users/me")
if [ "$STATUS" = "401" ]; then
  pass "Malformed token correctly rejected with 401"
else
  fail "Malformed token returned $STATUS (expected 401)"
fi

echo -e "\n[5] Unknown route — confirms JSON 404, not Express's default HTML error page (info disclosure)"
BODY=$(curl -s "$BASE_URL/this-route-does-not-exist")
echo "$BODY" | grep -q "Not found" \
  && pass "Unknown routes return the app's JSON 404 handler" \
  || fail "Unexpected 404 body: $BODY"

echo -e "\n[6] Auth rate limiting — hammering /login should trip the limiter (authLimiter: 10 / 15min / IP)"
info "Firing 12 rapid login attempts with a bad password..."
TRIPPED=0
for i in $(seq 1 12); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/users/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"ratelimit-test@example.com","password":"wrongpassword"}')
  if [ "$STATUS" = "429" ]; then
    TRIPPED=1
    info "Got 429 on attempt #$i"
    break
  fi
done
if [ "$TRIPPED" = "1" ]; then
  pass "Rate limiter engaged before 12 attempts, as expected (limit is 10)"
else
  fail "Never got a 429 after 12 rapid attempts — rate limiter may not be wired up correctly, or REDIS_URL isn't reachable"
fi

echo -e "\n[7] Large/oversized upload — does the 30MB multer limit actually reject bigger files cleanly (no crash)?"
info "Skipped by default (would need a real >30MB file + a logged-in cookie). To test manually:"
info "  curl -F 'pdf=@big-file.pdf' --cookie 'accessToken=<real token>' $BASE_URL/api/upload -w '%{http_code}'"
info "  Expect a clean 4xx, not a hung connection or 500."

echo -e "\n=========================================="
echo "Manual checks above cover the cheap, obvious stuff. For real coverage, also run:"
echo ""
echo "  1. npm audit (dependency vulnerabilities) — from Backend/:"
echo "       npm audit"
echo "       npm audit fix        # for auto-fixable ones"
echo ""
echo "  2. OWASP ZAP baseline scan (automated, no account needed, Docker):"
echo "       docker run -t owasp/zap2docker-stable zap-baseline.py -t $BASE_URL -r zap-report.html"
echo ""
echo "  3. Confirm cookie flags in a real browser DevTools > Application > Cookies after login:"
echo "       accessToken / refreshToken should show HttpOnly=true, Secure=true, SameSite=None"
echo "       (SameSite=None + credentials:true CORS means CSRF protection relies entirely on"
echo "        the CORS origin allowlist in server.js being correct — double check FRONTEND_URL"
echo "        in production has no typos and isn't '*')"
echo ""
echo "  4. Secret scanning (make sure no API keys ended up committed):"
echo "       npx gitleaks detect --source . -v"
