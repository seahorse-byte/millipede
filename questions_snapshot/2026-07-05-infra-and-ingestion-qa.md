# Infra & Ingestion Q&A — 2026-07-05

Captured from Millipede learning session. Context: local Docker stack running (`postgres`, `redis`, `kafka`), ingestion on `:8081`.

---

## Q1. Why doesn't `kafka-topics.sh --list` show messages? How do I inspect Kafka messages?

**Short answer:** `--list` only lists **topic names**, not messages.

After publishing a webhook you should see a topic:

```bash
docker exec -it docker-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list
# expected: raw-dev-events
```

To **read messages**, use a consumer:

```bash
# All messages from the beginning
docker exec -it docker-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic raw-dev-events \
  --from-beginning
```

Then POST another webhook in another terminal — JSON should appear in the consumer.

**Variants:**

```bash
# Only new messages (no replay)
docker exec -it docker-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic raw-dev-events

# Topic metadata (partitions, offsets)
docker exec -it docker-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --topic raw-dev-events
```

**Mental model:**

| Command | Answers |
|---------|---------|
| `--list` | What mailboxes (topics) exist? |
| `--console-consumer` | What mail (records) is inside? |

Topics = named streams. Messages = records appended to those streams.

If `--list` is empty: no webhook published yet, or Kafka was restarted without a persistence volume (messages lost).

**Sanity check (two terminals):**

```bash
# Terminal 1 — watch messages
docker exec -it docker-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic raw-dev-events --from-beginning

# Terminal 2 — publish
curl -X POST http://localhost:8081/webhooks/hello \
  -H 'Content-Type: application/json' \
  -d '{"action":"opened","source":"github"}'
```

Expect JSON in Terminal 1 and `"kafka_status":"published"` in the curl response.

---

## Q2. `redis-cli -h localhost ping` not working — am I missing redis-cli?

**Yes.** `redis-cli` is not installed on the host Mac by default. Redis runs **inside Docker**; only port `6379` is exposed.

**Option A — use redis-cli inside the container (no install):**

```bash
docker exec -it docker-redis-1 redis-cli ping
# PONG
```

**Option B — install on macOS:**

```bash
brew install redis
redis-cli -h localhost ping
```

**Option C — TCP check without redis-cli:**

```bash
nc -zv localhost 6379
```

Ingestion does not use Redis yet. Redis is for the analyzer + live dashboard (Stage 4).

---

## Q3. Explain ingestion as a concept

**Ingestion** is the **front door** of an event-driven system: it accepts data from the outside world (webhooks, APIs, uploads) and **normalizes + forwards** it into the internal pipeline without heavy processing.

Team Radar ingestion is narrow and fast:

1. **Receive** — GitHub/Jira/Slack hits `POST /webhooks/...`
2. **Validate shape** — parse JSON, assign an ID
3. **Publish** — push to Kafka (`raw-dev-events`) and return acknowledgment

It does **not** enrich with LLM scores, write Postgres, or push to the dashboard. Downstream consumers do that.

**Why separate ingestion from processing?**

| Benefit | Explanation |
|---------|-------------|
| Speed | Webhook callers get a quick response |
| Resilience | If LLM is slow/down, events queue in Kafka instead of failing the webhook |
| Replay | Re-read Kafka from an older offset and reprocess history |

**Analogy:** ingestion = bouncer + label maker at the club entrance — not the bartender or DJ.

---

## Q4. Two-liners — Kafka, Redis, Postgres

| System | Two-liner |
|--------|-----------|
| **Kafka** | A distributed **append-only log** of events — producers write records to topics, consumers read at their own pace; great for decoupling services and replaying history. |
| **Postgres** | A **relational database** — durable tables you query with SQL; Team Radar stores team events and computed metrics for dashboards and reports. |
| **Redis** | An **in-memory data store** — extremely fast reads/writes; here it pub/sub's live metric updates to the dashboard without hammering Postgres. |

**Compose stack analogy:**

- **Kafka** = async nervous system (events in motion)
- **Postgres** = long-term memory (queryable history)
- **Redis** = short-term reflexes (live UI push)

---

## Q5. High-level overview — Rust ingestion (`services/ingestion`)

`services/ingestion` is a small **Axum HTTP server** that acts as a Kafka **producer**.

```
HTTP POST /webhooks/hello
    → parse JSON
    → wrap in envelope { id, source, payload }
    → publish to Kafka topic raw-dev-events
    → return { accepted, event_id, kafka_status }
```

### Key pieces

| Piece | Role |
|-------|------|
| Axum `Router` | HTTP routing — `/health`, `/webhooks/github`, `/webhooks/hello` |
| `AppState` | Shared state: optional Kafka producer + topic name |
| `FutureProducer` (rdkafka) | Async Kafka client that publishes messages |
| Tokio | Async runtime — concurrent webhook handling |

### Startup env defaults

| Variable | Default |
|----------|---------|
| `KAFKA_BROKERS` | `localhost:9092` |
| `KAFKA_TOPIC` | `raw-dev-events` |
| `PORT` | `8081` |

### Producer setup (`main.rs` ~line 106)

```rust
let producer = match ClientConfig::new()
    .set("bootstrap.servers", &kafka_brokers)
    .set("message.timeout.ms", "5000")
    .create::<FutureProducer>()
{
    Ok(p) => Some(Arc::new(p)),
    Err(err) => None,  // accept-only mode if Kafka unreachable at startup
};
```

- **`bootstrap.servers`** — where to find Kafka (`localhost:9092` = Docker container)
- **`message.timeout.ms: 5000`** — give up after 5s if publish can't complete
- **`FutureProducer`** — async producer from `rdkafka`
- **`Option` + `Arc`** — share producer across handlers; `None` if Kafka unavailable at startup

**Note:** producer **creation** can succeed even when Kafka isn't reachable; first **`send()`** may still fail (`kafka_status: "unavailable"`). Once Docker is up, publishes succeed (`"published"`).

### Webhook handler flow

1. Generate unique `event_id` (UUID)
2. Wrap incoming JSON: `{ id, source, payload }`
3. `producer.send()` to `raw-dev-events`, keyed by `event_id`
4. Return immediately — caller does not wait for LLM or Postgres

### End-to-end (current + planned)

```
curl POST :8081/webhooks/hello
        │
        ▼
  millipede-ingestion (Rust/Axum)
        │  FutureProducer.send()
        ▼
  Kafka: raw-dev-events
        │
        ▼  (future: Python LLM worker)
  enriched-dev-events → analyzer → Postgres + Redis → SolidJS dashboard
```

**Source:** `services/ingestion/src/main.rs`
