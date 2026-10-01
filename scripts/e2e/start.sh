#!/usr/bin/env bash
# Bring up everything the end-to-end tests need, locally and throwaway:
#   1. a fresh Postgres with every migration replayed (rehearse-migrations.sh)
#   2. PostgREST in front of it, the same engine Supabase's REST API runs
#   3. a small proxy so supabase-js can talk to it at /rest/v1
#
#   sudo POSTGREST_BIN=/path/to/postgrest scripts/e2e/start.sh
#   npx tsx --tsconfig scripts/e2e/tsconfig.json scripts/e2e/run.ts
#   sudo scripts/e2e/start.sh --stop
#
# PostgREST is one static binary: github.com/PostgREST/postgrest/releases
# Nothing here touches the real database or sends real email.

set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT=/var/lib/postgresql/wls_rehearsal
PORT=54329
RUN=/tmp/wls-e2e
SECRET="e2e-local-jwt-secret-not-used-anywhere-real-0123456789"

stop_all() {
  [[ -f $RUN/postgrest.pid ]] && kill "$(cat $RUN/postgrest.pid)" 2>/dev/null || true
  [[ -f $RUN/proxy.pid ]] && kill "$(cat $RUN/proxy.pid)" 2>/dev/null || true
  rm -rf "$RUN"
}

if [[ "${1:-}" == "--stop" ]]; then
  stop_all
  bash "$HERE/../rehearse-migrations.sh" --stop
  exit 0
fi

: "${POSTGREST_BIN:?set POSTGREST_BIN to the postgrest binary}"

stop_all
mkdir -p "$RUN"
bash "$HERE/../rehearse-migrations.sh" | grep -v NOTICE | tail -1

psql -q -v ON_ERROR_STOP=1 -h "$ROOT" -p "$PORT" -U postgres wls <<'SQL'
create role authenticator login noinherit;
grant anon, authenticated, service_role to authenticator;
SQL

cat > "$RUN/postgrest.conf" <<CONF
db-uri = "postgres://authenticator@/wls?host=$ROOT&port=$PORT"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$SECRET"
server-host = "127.0.0.1"
server-port = 3055
CONF

"$POSTGREST_BIN" "$RUN/postgrest.conf" > "$RUN/postgrest.log" 2>&1 &
echo $! > "$RUN/postgrest.pid"
node "$HERE/proxy.mjs" > "$RUN/proxy.log" 2>&1 &
echo $! > "$RUN/proxy.pid"

for _ in $(seq 1 40); do
  if curl -sf -o /dev/null http://127.0.0.1:3056/rest/v1/listings?limit=1; then
    echo "e2e stack is up: http://127.0.0.1:3056 (jwt secret in $RUN/postgrest.conf)"
    exit 0
  fi
  sleep 0.5
done
echo "e2e stack did not come up; see $RUN/postgrest.log" >&2
exit 1
