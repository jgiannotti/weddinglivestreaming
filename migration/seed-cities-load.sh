#!/usr/bin/env bash
# Bulk-loads migration/geonames-cache/{cities,zips}.json into Supabase via the
# REST API (service_role key bypasses RLS for the write). Run AFTER
# supabase/migrations/0005_location_intelligence.sql has been applied (the
# cities/zips tables must already exist) and AFTER migration/seed-cities.py
# has produced the cache files.
#
# Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment —
# do not hardcode them here (this file is committed). Get them from
# .credentials.local.md (gitignored) and export before running:
#   export SUPABASE_URL=https://xxxx.supabase.co
#   export SUPABASE_SERVICE_ROLE_KEY=eyJ...
#   ./migration/seed-cities-load.sh

set -euo pipefail

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first (see .credentials.local.md)." >&2
  exit 1
fi

CACHE_DIR="$(dirname "$0")/geonames-cache"
BATCH_SIZE=1000

load_table() {
  local table="$1"
  local file="$2"
  local total
  total=$(python3 -c "import json; print(len(json.load(open('$file'))))")
  echo "Loading $total rows into $table from $file ..."

  python3 - "$file" "$BATCH_SIZE" <<'PYEOF' > "/tmp/${table}_batches.jsonl"
import json, sys
rows = json.load(open(sys.argv[1]))
batch_size = int(sys.argv[2])
for i in range(0, len(rows), batch_size):
    print(json.dumps(rows[i:i+batch_size]))
PYEOF

  local batch_num=0
  while IFS= read -r batch; do
    batch_num=$((batch_num + 1))
    echo "  batch $batch_num..."
    curl -sS -o /dev/null -w "    HTTP %{http_code}\n" \
      -X POST "$SUPABASE_URL/rest/v1/$table" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=minimal" \
      -d "$batch"
  done < "/tmp/${table}_batches.jsonl"

  rm -f "/tmp/${table}_batches.jsonl"
  echo "Done loading $table."
}

load_table "cities" "$CACHE_DIR/cities.json"
load_table "zips" "$CACHE_DIR/zips.json"

echo "Verify counts:"
curl -sS "$SUPABASE_URL/rest/v1/cities?select=id&limit=1" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Prefer: count=exact" -I | grep -i content-range || true
curl -sS "$SUPABASE_URL/rest/v1/zips?select=zip&limit=1" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Prefer: count=exact" -I | grep -i content-range || true
