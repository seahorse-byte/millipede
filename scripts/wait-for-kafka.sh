#!/usr/bin/env bash
# Wait until Kafka accepts connections (used by CI pipeline e2e).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

for i in $(seq 1 60); do
  if docker compose -f infra/docker/docker-compose.yml exec -T kafka \
    /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list >/dev/null 2>&1; then
    echo "Kafka ready"
    exit 0
  fi
  sleep 2
done

echo "Kafka did not become ready in time" >&2
exit 1
