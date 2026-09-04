#!/usr/bin/env bash
# Create Millipede Kafka topics (idempotent).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT/infra/docker/docker-compose.yml"
BOOTSTRAP="${KAFKA_BOOTSTRAP:-localhost:9092}"

create_topic() {
  local topic="$1"
  docker compose -f "$COMPOSE_FILE" exec -T kafka \
    /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server "$BOOTSTRAP" \
    --create --if-not-exists \
    --topic "$topic" \
    --partitions 1 \
    --replication-factor 1
  echo "topic ready: $topic"
}

bash "$ROOT/scripts/wait-for-kafka.sh"

create_topic "raw-dev-events"
create_topic "enriched-dev-events"
