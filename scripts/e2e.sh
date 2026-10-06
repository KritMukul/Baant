#!/usr/bin/env bash
# Builds the app, starts it on an in-memory store with the stub bill reader (no API keys, no database),
# runs the end-to-end test on phone-sized browsers, then stops it.
#   npm run e2e:full            (set CHROMIUM_PATH if Playwright cannot find a browser)
set -u
cd "$(dirname "$0")/.."
PORT="${E2E_PORT:-3100}"
[ "${SKIP_BUILD:-}" = "1" ] || npm run build >/tmp/dibs-e2e-build.log 2>&1 || { tail -30 /tmp/dibs-e2e-build.log; exit 1; }
DIBS_STORE=memory BILL_PARSER=stub npx next start -p "$PORT" >/tmp/dibs-e2e-server.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null' EXIT
for _ in $(seq 1 40); do curl -sf -m 2 "localhost:$PORT/api/health" >/dev/null && break; sleep 1; done
curl -sf -m 2 "localhost:$PORT/api/health" >/dev/null || { echo "server did not start"; tail -20 /tmp/dibs-e2e-server.log; exit 1; }
E2E_BASE="http://localhost:$PORT" node e2e/flow.mjs
