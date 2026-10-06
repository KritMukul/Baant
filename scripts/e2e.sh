#!/usr/bin/env bash
# Builds the app, starts it with the stub bill reader (no API keys), runs the end-to-end tests on phone-sized
# browsers, then stops it. By default the app uses an in-memory store; to run the same flows on a real database:
#   E2E_DATABASE_URL=postgres://user:pass@host/db npm run e2e:full   (tables must exist: npm run db:init)
#   npm run e2e:full            (set CHROMIUM_PATH if Playwright cannot find a browser)
set -u
cd "$(dirname "$0")/.."
PORT="${E2E_PORT:-3100}"
PORT2=$((PORT + 1))
[ "${SKIP_BUILD:-}" = "1" ] || npm run build >/tmp/dibs-e2e-build.log 2>&1 || { tail -30 /tmp/dibs-e2e-build.log; exit 1; }
if [ -n "${E2E_DATABASE_URL:-}" ]; then STORE_ENV="DATABASE_URL=$E2E_DATABASE_URL"; else STORE_ENV="DIBS_STORE=memory"; fi
start() { # port, extra env
  setsid env $STORE_ENV BILL_PARSER=stub $2 npx next start -p "$1" >"/tmp/dibs-e2e-server-$1.log" 2>&1 &
  echo $!
}
P1=$(start "$PORT" "")
P2=$(start "$PORT2" "DIBS_STUB_SHOT_AMOUNT=10009")
trap 'kill -- -$P1 -$P2 2>/dev/null' EXIT
for p in "$PORT" "$PORT2"; do
  for _ in $(seq 1 40); do curl -sf -m 2 "localhost:$p/api/health" >/dev/null && break; sleep 1; done
  curl -sf -m 2 "localhost:$p/api/health" >/dev/null || { echo "server on $p did not start"; tail -20 "/tmp/dibs-e2e-server-$p.log"; exit 1; }
done
rc=0
E2E_BASE="http://localhost:$PORT" node e2e/flow.mjs || rc=1
E2E_BASE="http://localhost:$PORT2" node e2e/short-pay.mjs || rc=1
E2E_BASE="http://localhost:$PORT" node e2e/a11y.mjs || rc=1
exit $rc
