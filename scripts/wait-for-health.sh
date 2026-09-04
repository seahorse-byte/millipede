#!/usr/bin/env bash
# Wait until ingestion + analyzer health endpoints respond.
set -euo pipefail

INGESTION_URL="${INGESTION_HEALTH_URL:-http://127.0.0.1:8081/health}"
ANALYZER_URL="${ANALYZER_HEALTH_URL:-http://127.0.0.1:8082/health}"
TIMEOUT_SEC="${WAIT_HEALTH_TIMEOUT_SEC:-180}"

wait_url() {
  local name="$1"
  local url="$2"
  local start
  start=$(date +%s)
  while true; do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "$name ready ($url)"
      return 0
    fi
    if (( $(date +%s) - start >= TIMEOUT_SEC )); then
      echo "$name not ready after ${TIMEOUT_SEC}s ($url)" >&2
      return 1
    fi
    sleep 2
  done
}

wait_url "ingestion" "$INGESTION_URL"
wait_url "analyzer" "$ANALYZER_URL"
