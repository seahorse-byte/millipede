# Docker Compose Explained — 2026-07-05

File: `infra/docker/docker-compose.yml`

Local **data plane** for Team Radar Stage 1 — Kafka, Postgres, and Redis for Rust/Python services running on the host.

---

## Architecture role

```
Webhook → Rust ingestion → Kafka (raw-dev-events)
                              → Python LLM → Kafka (enriched-dev-events)
                                              → Rust analyzer → Postgres + Redis
                                                                    → SolidJS dashboard
```

This compose file provides the storage layer only — not gateway, ingestion, or analyzer containers.

| Service | Role |
|---------|------|
| Kafka | Event bus — ingestion publishes; LLM + analyzer consume |
| Postgres | Durable team events + metrics |
| Redis | Live pub/sub for dashboard (Stage 4) |

---

## What `docker compose up -d` does

1. Creates a Docker network — containers reach each other as `kafka`, `postgres`, `redis`
2. Creates named volume `postgres_data` — survives restarts
3. Maps ports to host — `cargo run` on Mac uses `localhost:5432`, `:6379`, `:9092`
4. Runs healthchecks — `(healthy)` in `docker compose ps`

No `depends_on` — services start in parallel; app code should retry or wait for healthy status.

---

## Postgres

```yaml
image: postgres:16-alpine
POSTGRES_USER/PASSWORD/DB: millipede / millipede / team_radar
ports: "5432:5432"
volumes:
  - postgres_data:/var/lib/postgresql/data
  - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
```

- **init-db.sql** runs once on first boot → `team_events`, `team_metrics` tables
- Connection string: `postgres://millipede:millipede@localhost:5432/team_radar`
- `docker compose down -v` wipes persisted data

---

## Redis

```yaml
image: redis:7-alpine
ports: "6379:6379"
```

No password, no volume — ephemeral, fine for local dev. Not used by ingestion yet.

Host `redis-cli` may be missing — use:

```bash
docker exec -it docker-redis-1 redis-cli ping
```

---

## Kafka (apache/kafka:3.9.0)

Uses **KRaft** (no Zookeeper). Bitnami image was removed from Docker Hub.

| Variable | Purpose |
|----------|---------|
| `KAFKA_PROCESS_ROLES: broker,controller` | Single node stores messages + metadata |
| `KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093` | Client port 9092, internal KRaft 9093 |
| `KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092` | Metadata returned to **host** clients (`cargo run`) |
| Replication factor `1` | Required for single-broker dev |

**localhost gotcha:** `ADVERTISED_LISTENERS=localhost:9092` is correct for host-side Rust/Python. Container-only consumers would need a different address.

Topics auto-create on first publish (`raw-dev-events`, later `enriched-dev-events`).

---

## Useful commands

```bash
pnpm compose:up
docker compose -f infra/docker/docker-compose.yml ps
pnpm compose:down

# Kafka topics (names only)
docker exec -it docker-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list

# Kafka messages
docker exec -it docker-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic raw-dev-events --from-beginning

# Postgres
psql postgres://millipede:millipede@localhost:5432/team_radar
```

---

## Intentionally missing (Stage 1 dev)

- Application containers (run Rust locally)
- mTLS / TLS on Kafka (Stage 2)
- Kafka persistence volume
- Production secrets
