#!/usr/bin/env bash
# Remove seeded demo / e2e placeholder events from local Postgres.
set -euo pipefail

PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-millipede}"
PGPASSWORD="${PGPASSWORD:-millipede}"
PGDATABASE="${PGDATABASE:-team_radar}"

export PGPASSWORD

echo "Clearing demo / e2e events from ${PGDATABASE}…"
result=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "
DELETE FROM team_events
WHERE
  title ILIKE 'e2e:%'
  OR title ILIKE '%pipeline e2e%'
  OR title = 'ship feature for demo'
  OR actor_id IN (
    'alex-chen', 'sam-patel', 'jordan-lee', 'riley-morgan', 'casey-nguyen'
  )
  OR actor_name IN (
    'Alex Chen', 'Sam Patel', 'Jordan Lee', 'Riley Morgan', 'Casey Nguyen'
  )
  OR repo LIKE 'acme/%'
  OR repo = 'snyk/infra-config';
")
echo "$result"
echo "Run pnpm brain:refresh to update docs."
