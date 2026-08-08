export interface LabDefinition {
  title: string;
  steps: string[];
}

export const labs: Record<string, LabDefinition> = {
  "encode-name-ascii": {
    title: "Encode your name in ASCII",
    steps: [
      "Pick the first letter of your name.",
      "Look up its decimal ASCII value (A = 65).",
      "Toggle bits in BitRegister to match that value.",
      "Write decimal + binary in your journal.",
    ],
  },
  "break-fix-hex-binary": {
    title: "Break/fix hex ↔ binary",
    steps: [
      "Convert `0xFF` to binary using the nibble split.",
      "Convert `10101010` to hex.",
      "Use HexColorMixer — set R=255, G=0, B=0 and read `#FF0000`.",
    ],
  },
  "draw-team-radar-architecture": {
    title: "Draw Team Radar architecture",
    steps: [
      "Draw clients: curl and browser.",
      "Draw servers: ingestion, llm-worker, analyzer, radar dev.",
      "Add Kafka, Postgres, Redis between them.",
      "Mark where HTTP ends and async messaging begins.",
      "Compare to docs/millipede-e2e-map.md.",
    ],
  },
  "curl-v-dissection": {
    title: "curl -v dissection",
    steps: [
      "Run: curl -v -X POST http://localhost:8081/webhooks/hello -H 'Content-Type: application/json' -d '{\"source\":\"github\"}'",
      "Circle the TCP connect lines.",
      "Circle the request headers and body.",
      "Circle the response status and JSON body.",
      "Map each section to PacketJourney hops.",
    ],
  },
  "trace-call-stack": {
    title: "Trace a call stack",
    steps: [
      "Start at main() in the StackFrameVisualizer.",
      "Click Call deeper until kafka_producer.send().",
      "List which frames pop when HTTP 200 returns.",
      "Name one heap allocation that outlives the request.",
    ],
  },
  "inspect-solidjs-devtools": {
    title: "Inspect SolidJS in DevTools",
    steps: [
      "Open http://localhost:5174 with DevTools → Network.",
      "Find /api/metrics/summary polling every ~5s.",
      "Open Elements — locate a metric card updating.",
      "Note: fine-grained DOM updates without full page reload.",
    ],
  },
  "fix-cors-error": {
    title: "Fix a CORS error (thought experiment)",
    steps: [
      "Imagine fetch('http://localhost:8082/health') from :5174 without proxy.",
      "Predict the browser error message.",
      "Name two fixes: CORS header vs same-origin proxy.",
      "Which does millipede use in dev?",
    ],
  },
  "read-cert-chain": {
    title: "Read a cert chain",
    steps: [
      "Run: bash infra/certs/generate-dev-certs.sh",
      "Run: openssl x509 -in infra/certs/dev/gateway.crt -text -noout | head -20",
      "Identify Subject, Issuer, and SAN if present.",
      "Explain why dev uses a local CA.",
    ],
  },
  "capstone-teach-back": {
    title: "Capstone teach-back",
    steps: [
      "Set a 5-minute timer.",
      "Explain Team Radar from webhook to dashboard without notes.",
      "Cover: client/server, Kafka, enrichment, SSE vs poll.",
      "Optional: run millipede-demo while narrating.",
    ],
  },
  "predict-microtask-order": {
    title: "Predict microtask order",
    steps: [
      "Write predicted output for A/D/C/B before using the simulator.",
      "Step through EventLoopSimulator and confirm.",
      "Explain why Promise beat setTimeout in one sentence.",
    ],
  },
  "debug-race-condition": {
    title: "Debug a race condition",
    steps: [
      "Sketch two callbacks mutating the same variable — one Promise, one setTimeout.",
      "Which runs first after sync code finishes?",
      "Name one radar UI scenario where order matters (metrics vs SSE).",
    ],
  },
  "callbacks-to-async-await": {
    title: "Callbacks → async/await",
    steps: [
      "Rewrite the fetch chain in lesson 1.3 as async/await.",
      "Mark each await as a microtask boundary.",
      "Contrast with an Axum async handler (yields task, not browser tab).",
    ],
  },
  "load-wasm-redact": {
    title: "Load WASM redaction",
    steps: [
      "Run pnpm build:wasm from repo root.",
      "Open radar /1on1 and paste text with an email.",
      "Confirm redaction in browser — check Network tab for no POST of raw email.",
    ],
  },
  "read-axum-handler": {
    title: "Read an Axum handler",
    steps: [
      "Open services/ingestion/src/main.rs.",
      "Find github_webhook — trace validate → Kafka publish → JSON response.",
      "Name one Result type that could fail before 200 OK.",
    ],
  },
  "fix-five-borrows": {
    title: "Fix borrow errors",
    steps: [
      "Work through all three BorrowCheckerPanel scenarios.",
      "Explain each error aloud before Apply fix.",
      "Note which fixes use clone vs reorder.",
    ],
  },
  "annotate-lifetimes": {
    title: "Annotate lifetimes (preview)",
    steps: [
      "Read analyzer SQLx query that returns rows.",
      "Identify what owns the database connection.",
      "Why can't a row reference outlive the connection?",
    ],
  },
  "explain-string-move": {
    title: "Explain String move",
    steps: [
      "Write pseudo-Rust: let a = String::from(\"x\"); let b = a;",
      "Is a valid after? Why?",
      "Contrast with let n = 5i32; let m = n;",
    ],
  },
  "channel-playground": {
    title: "Channel in playground",
    steps: [
      "Send three events in ConcurrencyChannels without receiving.",
      "Receive all — confirm order is FIFO.",
      "Explain what backpressure would mean if buffer size were 1.",
    ],
  },
  "service-boundary-rules": {
    title: "Service boundary rules",
    steps: [
      "In SendSyncExplorer, classify String vs Arc<Mutex<T>>.",
      "Name one type in ingestion State — is it Send?",
      "Why can't Rc cross a tokio::spawn boundary?",
    ],
  },
  "trace-one-handler": {
    title: "Trace one handler",
    steps: [
      "Open services/ingestion/src/main.rs.",
      "List every .await in github_webhook.",
      "Step TokioFutureMachine in parallel — match labels to code.",
    ],
  },
  "hello-axum-webhook": {
    title: "Hello Axum webhook",
    steps: [
      "Start stack: pnpm millipede-demo (or docker compose up).",
      "curl -X POST http://localhost:8081/webhooks/hello -H 'Content-Type: application/json' -d '{\"source\":\"github\"}'",
      "Confirm accepted:true in JSON.",
      "Step RequestTimeline while narrating async pipeline.",
    ],
  },
  "reactive-counter": {
    title: "Build a reactive counter",
    steps: [
      "In SolidSignalGraph, increment until doubled ≥ 10.",
      "Read the effect line — what re-ran on each click?",
      "Open apps/radar and find one createSignal in source.",
    ],
  },
  "fetch-mock-metrics": {
    title: "Fetch mock metrics API",
    steps: [
      "Run radar dev — open Network tab.",
      "Find GET /api/metrics/summary on ~5s interval.",
      "Animate TanStackDataFlow and map each step to Network rows.",
    ],
  },
  "docker-compose-kafka": {
    title: "Docker Compose Kafka",
    steps: [
      "cd infra/docker && docker compose up -d kafka",
      "Wait for healthcheck — docker compose ps",
      "List topics: docker exec ... kafka-topics.sh --list --bootstrap-server localhost:9092",
      "Match topic names to KafkaTopicExplorer labels.",
    ],
  },
  "rust-producer-lab": {
    title: "Rust producer",
    steps: [
      "Open services/ingestion — find Kafka producer setup.",
      "POST a test webhook to :8081.",
      "Confirm message on raw-dev-events (kafka console consumer or logs).",
    ],
  },
  "raw-to-enriched-topics": {
    title: "raw → enriched topics",
    steps: [
      "With full stack up, POST one webhook.",
      "Trace llm-worker logs — consumption from raw, publish to enriched.",
      "Verify analyzer consumes enriched-dev-events.",
    ],
  },
  "team-metrics-schema": {
    title: "Team metrics schema",
    steps: [
      "Read infra/docker/init-db.sql.",
      "Toggle tables in PostgresSchemaDiagram.",
      "psql or GUI: SELECT count(*) FROM team_events after a webhook.",
    ],
  },
  "redis-subscribe-terminal": {
    title: "Subscribe in terminal",
    steps: [
      "docker compose up -d redis",
      "redis-cli SUBSCRIBE team-radar:live",
      "In another terminal POST webhook — watch for publish (if analyzer running).",
    ],
  },
  "replay-from-offset-zero": {
    title: "Replay from offset 0",
    steps: [
      "Use KafkaOffsetRewind widget — burst then replay.",
      "Research: kafka-consumer-groups.sh --reset-offsets (dev only).",
      "Explain duplicate risk in Postgres without idempotent keys.",
    ],
  },
  "kafka-pg-redis-stack": {
    title: "Kafka + PG + Redis stack",
    steps: [
      "cd infra/docker && docker compose up -d",
      "Verify postgres :5432, redis :6379, kafka :9092.",
      "Click each node in ComposeNetworkMap and match ports.",
    ],
  },
  "git-to-pages": {
    title: "Git → Pages",
    steps: [
      "Run pnpm build:academy locally.",
      "Push a doc-only commit to main.",
      "Confirm Pages build in Cloudflare dashboard.",
    ],
  },
  "full-compose-running": {
    title: "Full compose running",
    steps: [
      "pnpm millipede-demo (or equivalent compose up).",
      "POST webhook — confirm accepted:true.",
      "Open radar :5174 — metrics + live feed.",
      "Step KafkaPipelineVisualizer while narrating.",
    ],
  },
  "mint-dev-jwt": {
    title: "Mint dev JWT",
    steps: [
      "cargo run -p millipede-gateway --bin mint_dev_jwt",
      "Copy token — decode at jwt.io (dev only).",
      "curl -sk https://localhost:8443/api/metrics/summary -H \"Authorization: Bearer <token>\"",
    ],
  },
  "mtls-curl-gateway": {
    title: "mTLS curl to gateway",
    steps: [
      "bash infra/certs/generate-dev-certs.sh",
      "MILLIPEDE_MTLS=1 — start gateway + backends.",
      "curl -sk --cert infra/certs/dev/gateway.pem --key infra/certs/dev/gateway-key.pem https://localhost:8443/health",
    ],
  },
  "generate-dev-certs": {
    title: "Generate dev certs",
    steps: [
      "Run infra/certs/generate-dev-certs.sh.",
      "openssl verify -CAfile infra/certs/dev/ca.pem infra/certs/dev/ingestion.pem",
      "List SAN in cert: openssl x509 -in gateway.pem -text -noout | grep -A1 SAN",
    ],
  },
  "encryption-key-custody": {
    title: "Encryption key custody",
    steps: [
      "Use FieldEncryptionPanel — encrypt sample note.",
      "Write one paragraph: who holds keys in your org?",
      "Contrast with WASM redaction ship path.",
    ],
  },
  "wasm-redact-1on1": {
    title: "WASM redact on 1:1 portal",
    steps: [
      "pnpm build:wasm && pnpm dev:radar",
      "Open /1on1 — paste text with email.",
      "Submit — confirm [EMAIL:…] token, not raw address.",
    ],
  },
  "pseudonym-mapping-table": {
    title: "Pseudonym mapping table",
    steps: [
      "PseudonymizationDemo — pick two people, note stable labels.",
      "Sketch where HR mapping table would live (not in git).",
      "Explain difference from redact_pii_deterministic.",
    ],
  },
  "slack-signature-verify": {
    title: "Slack signature verify",
    steps: [
      "SlackSignatureVerifier — compute then tamper.",
      "Read Slack docs: signing secret verification.",
      "List order: raw body → HMAC → JSON parse.",
    ],
  },
  "manager-role-gateway": {
    title: "Manager role at gateway",
    steps: [
      "AbacRoleMatrix — try /api/webhooks/hello as guest.",
      "Read require_manager_jwt in gateway main.rs.",
      "Propose team_radar:read scope in your journal.",
    ],
  },
  "mtls-two-services": {
    title: "mTLS between two services",
    steps: [
      "Full Stage 2 stack with MILLIPEDE_MTLS=1.",
      "JWT curl to gateway → metrics.",
      "Confirm gateway logs mTLS upstream to analyzer.",
    ],
  },
  "bff-vs-gateway-reading": {
    title: "BFF vs gateway reading",
    steps: [
      "Toggle BffProxyFlow — compare paths.",
      "Skim docs/work-alignment.md BFF section.",
      "Write when you would add BFF to Team Radar (if ever).",
    ],
  },
  "stage1-compose-up": {
    title: "Stage 1 compose up",
    steps: [
      "pnpm compose:up — wait for healthy kafka/postgres/redis.",
      "MonorepoMap — locate ingestion and analyzer paths.",
      "ComposeNetworkMap — match ports to README quick start.",
    ],
  },
  "design-event-schema": {
    title: "Design an event schema",
    steps: [
      "EventSchemaExplorer — write a fourth source (e.g. GitLab).",
      "Sketch envelope id + source + payload.",
      "POST it to /webhooks/hello and check team_events.source.",
    ],
  },
  "read-ingestion-main": {
    title: "Read ingestion main.rs",
    steps: [
      "Open services/ingestion/src/main.rs.",
      "List routes and AppState fields.",
      "ApiWorkerSplit — list API vs worker responsibilities.",
    ],
  },
  "publish-raw-dev-events": {
    title: "Publish raw-dev-events",
    steps: [
      "compose up + cargo run -p millipede-ingestion.",
      "POST webhook — confirm kafka_status published.",
      "IngestionProducerPanel — simulate broker down case.",
    ],
  },
  "analyzer-consumer-loop": {
    title: "Analyzer consumer loop",
    steps: [
      "ConsumerLoopVisualizer — step through loop.",
      "Read run_consumer in analyzer main.rs.",
      "Note group.id and default topic env var.",
    ],
  },
  "sqlx-pool-connect": {
    title: "SQLx pool connect",
    steps: [
      "Verify init-db.sql tables exist via psql \\dt.",
      "PostgresSchemaDiagram — both tables.",
      "Start analyzer — confirm postgres pool ready log.",
    ],
  },
  "webhook-to-postgres": {
    title: "Webhook to Postgres",
    steps: [
      "Run analyzer + ingestion per README Stage 1.",
      "POST curl webhook.",
      "SELECT from team_events — match event_id in response JSON.",
    ],
  },
  "redis-warm-after-insert": {
    title: "Redis warm after insert",
    steps: [
      "RedisCacheWarmup widget — all three keys.",
      "redis-cli HGETALL team_radar:latest_by_source after webhook.",
      "curl metrics summary — check latest_by_source field.",
    ],
  },
  "trace-webhook-logs": {
    title: "Trace webhook logs",
    steps: [
      "RUST_LOG=info run ingestion + analyzer.",
      "POST one webhook.",
      "Grep same event_id in both terminal outputs.",
    ],
  },
  "stage1-capstone-demo": {
    title: "Stage 1 capstone demo",
    steps: [
      "Full Stage 1 stack from README.",
      "Webhook → psql → metrics summary.",
      "Narrate WebhookToDbFlow without slides.",
    ],
  },
  "radar-dev-server": {
    title: "Radar dev server",
    steps: [
      "pnpm build:wasm && pnpm dev:radar.",
      "Open http://localhost:5174 — confirm sidebar + dashboard.",
      "RadarAppShell — match file tree to repo.",
    ],
  },
  "radar-metrics-poll": {
    title: "Radar metrics poll",
    steps: [
      "Start analyzer + ingestion + compose.",
      "DevTools Network — find /api/metrics/summary every ~5s.",
      "RadarMetricsPanel — explain poll vs SSE split.",
    ],
  },
  "radar-router-nav": {
    title: "Radar router nav",
    steps: [
      "Navigate / and /1on1 in radar.",
      "RadarRouterMap — note components per route.",
      "Confirm active link styling in sidebar.",
    ],
  },
  "radar-1on1-wasm": {
    title: "Radar 1:1 WASM",
    steps: [
      "Open /1on1 — paste note with email.",
      "Run WASM redaction — verify [EMAIL:…] output.",
      "Read apps/radar/src/lib/redact.ts.",
    ],
  },
  "radar-sse-activity": {
    title: "Radar SSE activity",
    steps: [
      "Keep dashboard open — connect shows live badge.",
      "POST webhook — Activity stream row appears.",
      "RadarLiveFeed widget — map to Dashboard.tsx table.",
    ],
  },
  "radar-full-demo": {
    title: "Full Team Radar demo",
    steps: [
      "Full stack: compose + llm-worker + analyzer + ingestion + dev:radar.",
      "POST webhook — metrics + SSE + optional 1:1 redaction.",
      "Animate RadarStage4Diagram while narrating.",
    ],
  },
  "gateway-scaffold-run": {
    title: "Gateway scaffold run",
    steps: [
      "bash infra/certs/generate-dev-certs.sh",
      "MILLIPEDE_MTLS=1 cargo run -p millipede-gateway",
      "curl -sk https://localhost:8443/health",
    ],
  },
  "gateway-jwt-curl": {
    title: "Gateway JWT curl",
    steps: [
      "Mint TOKEN with mint_dev_jwt.",
      "curl /api/metrics/summary with Bearer.",
      "Retry without header — expect 401.",
    ],
  },
  "stage2-mtls-stack": {
    title: "Stage 2 mTLS stack",
    steps: [
      "MILLIPEDE_MTLS=1 — gateway, ingestion, analyzer.",
      "Walk MtlsHandshake widget.",
      "Confirm gateway logs mTLS upstream.",
    ],
  },
  "webhook-via-gateway": {
    title: "Webhook via gateway",
    steps: [
      "POST /api/webhooks/hello through :8443 with JWT.",
      "GatewayProxyFlow — narrate hops.",
      "Verify raw-dev-events consumed by llm-worker.",
    ],
  },
  "llm-worker-setup": {
    title: "LLM worker setup",
    steps: [
      "LlmWorkerContainer steps — venv + pip install -e .",
      "pnpm llm-worker:dev",
      "Watch logs for input/output topics.",
    ],
  },
  "python-kafka-poll": {
    title: "Python Kafka poll",
    steps: [
      "PythonKafkaConsumer — step loop.",
      "Read main.py process_message.",
      "POST webhook — see enriched log line.",
    ],
  },
  "enrichment-graph-trace": {
    title: "Enrichment graph trace",
    steps: [
      "EnrichmentGraph — click each node.",
      "Read graph.py run_graph.",
      "Optional: set OPENAI_API_KEY and compare scores.",
    ],
  },
  "enriched-topic-verify": {
    title: "Enriched topic verify",
    steps: [
      "ChainedConsumerDiagram — llm → enriched topic.",
      "psql — sentiment/risk_score populated.",
      "Match enriched_at timestamp.",
    ],
  },
  "enriched-to-postgres": {
    title: "Enriched to Postgres",
    steps: [
      "ConsumerLoopVisualizer + analyzer logs.",
      "SELECT sentiment from team_events.",
      "Open radar — risk badge on SSE row.",
    ],
  },
  "offset-replay-dev": {
    title: "Offset replay dev",
    steps: [
      "KafkaOffsetRewind widget exercise.",
      "Explain ON CONFLICT idempotency.",
      "Research consumer group reset (dev only).",
    ],
  },
  "slack-pulse-event": {
    title: "Slack pulse event",
    steps: [
      "Design slack pulse JSON payload.",
      "SlackSignatureVerifier — verify flow.",
      "POST equivalent via /webhooks/hello with source slack.",
    ],
  },
  "stage23-full-demo": {
    title: "Stage 2+3 full demo",
    steps: [
      "Full stack: gateway + llm + analyzer + ingestion + radar.",
      "JWT webhook via gateway.",
      "SecuredPipelineCapstone narrated demo.",
    ],
  },
};

export interface QuizQuestion {
  prompt: string;
  choices: string[];
  answerIndex: number;
}

export interface QuizDefinition {
  title: string;
  questions: QuizQuestion[];
}

export const quizzes: Record<string, QuizDefinition> = {
  "book0-lesson1": {
    title: "Lesson 0.1 check",
    questions: [
      {
        prompt: "How many bits in one ASCII byte?",
        choices: ["4", "8", "16", "32"],
        answerIndex: 1,
      },
      {
        prompt: "Letter A is decimal…",
        choices: ["64", "65", "66", "97"],
        answerIndex: 1,
      },
    ],
  },
  "book0-lesson2": {
    title: "Lesson 0.2 check",
    questions: [
      {
        prompt: "0xFF in decimal?",
        choices: ["128", "255", "256", "15"],
        answerIndex: 1,
      },
      {
        prompt: "One hex digit represents how many bits?",
        choices: ["2", "4", "8", "16"],
        answerIndex: 1,
      },
    ],
  },
  "book0-lesson5": {
    title: "Lesson 0.5 check",
    questions: [
      {
        prompt: "Who initiates an HTTP request?",
        choices: ["Server", "Client", "Kafka", "Postgres"],
        answerIndex: 1,
      },
      {
        prompt: "When ingestion returns accepted:true, the full pipeline is…",
        choices: ["Always finished", "Not necessarily finished", "Blocked on Redis", "Waiting for SSE"],
        answerIndex: 1,
      },
    ],
  },
  "book0-lesson3": {
    title: "Lesson 0.3 check",
    questions: [
      {
        prompt: "Stack memory is typically…",
        choices: ["Long-lived", "Tied to call frames", "Only in the browser", "Stored in Kafka"],
        answerIndex: 1,
      },
    ],
  },
  "book0-lesson4": {
    title: "Lesson 0.4 check",
    questions: [
      {
        prompt: "HTTP runs on top of…",
        choices: ["UDP only", "TCP", "DNS", "Postgres"],
        answerIndex: 1,
      },
    ],
  },
  "book0-lesson6": {
    title: "Lesson 0.6 check",
    questions: [
      {
        prompt: "TanStack Query in radar primarily handles…",
        choices: ["Kafka consumption", "Server state fetching", "TLS certs", "WASM compile"],
        answerIndex: 1,
      },
    ],
  },
  "book0-lesson7": {
    title: "Lesson 0.7 check",
    questions: [
      {
        prompt: "CORS headers are sent by…",
        choices: ["The browser", "The server", "Vite only", "Redis"],
        answerIndex: 1,
      },
    ],
  },
  "book0-lesson8": {
    title: "Lesson 0.8 check",
    questions: [
      {
        prompt: "mTLS means…",
        choices: ["Only server has a cert", "Both sides present certs", "No encryption", "JWT in cookie"],
        answerIndex: 1,
      },
    ],
  },
  "book0-capstone": {
    title: "Book 0 capstone",
    questions: [
      {
        prompt: "raw-dev-events is consumed by…",
        choices: ["Analyzer directly", "LLM worker", "Radar UI", "Postgres"],
        answerIndex: 1,
      },
      {
        prompt: "Live feed in radar requires…",
        choices: ["Only Postgres", "Redis SSE while page open", "Webhook retry", "Gateway JWT only"],
        answerIndex: 1,
      },
      {
        prompt: "millipede-ingestion listens on port…",
        choices: ["5174", "8081", "9092", "8443"],
        answerIndex: 1,
      },
    ],
  },
  "book1-lesson1": {
    title: "Lesson 1.1 check",
    questions: [
      {
        prompt: "Classic demo output order?",
        choices: ["A B C D", "A D C B", "A C D B", "D C B A"],
        answerIndex: 1,
      },
    ],
  },
  "book1-lesson2": {
    title: "Lesson 1.2 check",
    questions: [
      {
        prompt: "Microtasks run…",
        choices: ["After each macrotask", "Before the next macrotask", "Only on page load", "On a worker thread"],
        answerIndex: 1,
      },
    ],
  },
  "book1-lesson3": {
    title: "Lesson 1.3 check",
    questions: [
      {
        prompt: "async/await in JS schedules continuations as…",
        choices: ["Macrotasks only", "Microtasks via Promises", "New OS threads", "Rust Tokio jobs"],
        answerIndex: 1,
      },
    ],
  },
  "book1-lesson4": {
    title: "Lesson 1.4 check",
    questions: [
      {
        prompt: "WASM linear memory is…",
        choices: ["Shared with JS GC", "Sandboxed from DOM/network by default", "Same as Postgres", "Only on server"],
        answerIndex: 1,
      },
    ],
  },
  "book1-lesson5": {
    title: "Lesson 1.5 check",
    questions: [
      {
        prompt: "millipede LLM enrichment runs in…",
        choices: ["Rust analyzer", "Python llm-worker", "SolidJS radar", "Cloudflare Pages"],
        answerIndex: 1,
      },
    ],
  },
  "book1-lesson6": {
    title: "Lesson 1.6 check",
    questions: [
      {
        prompt: "After a move, the original owner…",
        choices: ["Can still use the value", "Is invalid unless cloned", "Shares mutably", "Runs GC"],
        answerIndex: 1,
      },
    ],
  },
  "book1-lesson7": {
    title: "Lesson 1.7 check",
    questions: [
      {
        prompt: "&mut T allows…",
        choices: ["Many writers", "One exclusive writer", "No compile checks", "Only WASM"],
        answerIndex: 1,
      },
    ],
  },
  "book1-lesson8": {
    title: "Lesson 1.8 check",
    questions: [
      {
        prompt: "i32 assignment copies because i32 is…",
        choices: ["Move only", "Copy", "Always cloned on heap", "A reference"],
        answerIndex: 1,
      },
    ],
  },
  "book1-lesson9": {
    title: "Lesson 1.9 check",
    questions: [
      {
        prompt: "mpsc channels move data by…",
        choices: ["Shared mutable globals", "Message passing / ownership transfer", "Browser microtasks", "Postgres triggers"],
        answerIndex: 1,
      },
    ],
  },
  "book1-lesson10": {
    title: "Lesson 1.10 check",
    questions: [
      {
        prompt: "Sync means…",
        choices: ["Safe to share &T across threads", "Always async", "Same as JavaScript Promise", "Only for WASM"],
        answerIndex: 0,
      },
    ],
  },
  "book1-lesson11": {
    title: "Lesson 1.11 check",
    questions: [
      {
        prompt: ".await in Tokio…",
        choices: ["Blocks all threads", "Yields the current task cooperatively", "Runs on the browser main thread", "Replaces Kafka"],
        answerIndex: 1,
      },
    ],
  },
  "book1-capstone": {
    title: "Book 1 capstone",
    questions: [
      {
        prompt: "HTTP 200 from ingestion means…",
        choices: ["LLM finished", "Webhook accepted; pipeline may still run", "Radar polled metrics", "Postgres migrated"],
        answerIndex: 1,
      },
      {
        prompt: "Book 1 covered both…",
        choices: ["Only Python", "JS runtime + Rust/Tokio + Solid/TanStack", "Only Kafka", "Only Cloudflare"],
        answerIndex: 1,
      },
    ],
  },
  "book1-lesson13": {
    title: "Lesson 1.13 check",
    questions: [
      {
        prompt: "Solid signals update…",
        choices: ["The entire page every time", "Only subscribed computations/DOM", "Kafka partitions", "Postgres rows"],
        answerIndex: 1,
      },
    ],
  },
  "book1-lesson14": {
    title: "Lesson 1.14 check",
    questions: [
      {
        prompt: "TanStack Query primarily manages…",
        choices: ["TCP routing", "Server/async fetched state", "TLS certificates", "Rust ownership"],
        answerIndex: 1,
      },
    ],
  },
  "book2-lesson1": {
    title: "Lesson 2.1 check",
    questions: [
      {
        prompt: "Event-driven architecture decouples…",
        choices: ["Git from GitLab", "HTTP acceptance from slow downstream work", "Solid from JS", "PDF from MDX"],
        answerIndex: 1,
      },
    ],
  },
  "book2-lesson2": {
    title: "Lesson 2.2 check",
    questions: [
      {
        prompt: "Offsets are scoped to…",
        choices: ["The whole topic globally", "Each partition", "Postgres rows", "Redis channels"],
        answerIndex: 1,
      },
    ],
  },
  "book2-lesson3": {
    title: "Lesson 2.3 check",
    questions: [
      {
        prompt: "After processing, consumers should…",
        choices: ["Delete the topic", "Commit offsets", "Close Postgres", "Stop Kafka"],
        answerIndex: 1,
      },
    ],
  },
  "book2-lesson4": {
    title: "Lesson 2.4 check",
    questions: [
      {
        prompt: "millipede LLM output goes to…",
        choices: ["raw-dev-events", "enriched-dev-events", "Redis only", "Cloudflare Pages"],
        answerIndex: 1,
      },
    ],
  },
  "book2-lesson5": {
    title: "Lesson 2.5 check",
    questions: [
      {
        prompt: "team_metrics stores…",
        choices: ["Raw webhook bytes only", "Aggregated KPI values", "TLS certs", "WASM modules"],
        answerIndex: 1,
      },
    ],
  },
  "book2-lesson6": {
    title: "Lesson 2.6 check",
    questions: [
      {
        prompt: "Redis Pub/Sub messages without subscribers…",
        choices: ["Persist forever", "Are dropped", "Go to Postgres", "Block Kafka"],
        answerIndex: 1,
      },
    ],
  },
  "book2-lesson7": {
    title: "Lesson 2.7 check",
    questions: [
      {
        prompt: "Consumer lag means…",
        choices: ["Browser is slow", "Consumers behind producers", "TLS expired", "WASM failed"],
        answerIndex: 1,
      },
    ],
  },
  "book2-lesson8": {
    title: "Lesson 2.8 check",
    questions: [
      {
        prompt: "Inside compose, Kafka hostname is…",
        choices: ["localhost", "kafka", "127.0.0.1 only", "postgres"],
        answerIndex: 1,
      },
    ],
  },
  "book2-lesson9": {
    title: "Lesson 2.9 check",
    questions: [
      {
        prompt: "Academy on Cloudflare Pages is…",
        choices: ["A Kafka consumer", "Static site from git build", "Postgres host", "mTLS gateway"],
        answerIndex: 1,
      },
    ],
  },
  "book2-capstone": {
    title: "Book 2 capstone",
    questions: [
      {
        prompt: "First Kafka topic a webhook hits…",
        choices: ["enriched-dev-events", "raw-dev-events", "team_metrics", "team-radar:live"],
        answerIndex: 1,
      },
      {
        prompt: "Book 2 focused on…",
        choices: ["React hooks", "Event-driven streaming stack", "Only TLS", "Only WASM"],
        answerIndex: 1,
      },
    ],
  },
  "book3-lesson1": {
    title: "Lesson 3.1 check",
    questions: [
      {
        prompt: "Zero trust means…",
        choices: ["Trust internal VLAN", "Verify every request/hop", "No TLS needed", "Only browser security"],
        answerIndex: 1,
      },
    ],
  },
  "book3-lesson2": {
    title: "Lesson 3.2 check",
    questions: [
      {
        prompt: "millipede manager JWT scope is…",
        choices: ["team_radar:manager", "admin:all", "kafka:write", "postgres:read"],
        answerIndex: 0,
      },
    ],
  },
  "book3-lesson3": {
    title: "Lesson 3.3 check",
    questions: [
      {
        prompt: "mTLS requires…",
        choices: ["Only server certificate", "Both sides present certificates", "JWT in cookie", "Redis password"],
        answerIndex: 1,
      },
    ],
  },
  "book3-lesson4": {
    title: "Lesson 3.4 check",
    questions: [
      {
        prompt: "Dev CA root cert is…",
        choices: ["ca.pem", "gateway-key.pem", "JWT_SECRET", "docker-compose.yml"],
        answerIndex: 0,
      },
    ],
  },
  "book3-lesson5": {
    title: "Lesson 3.5 check",
    questions: [
      {
        prompt: "millipede 1:1 ship path prefers…",
        choices: ["Store raw emails", "WASM redaction client-side", "Plaintext Postgres", "Slack DMs"],
        answerIndex: 1,
      },
    ],
  },
  "book3-lesson6": {
    title: "Lesson 3.6 check",
    questions: [
      {
        prompt: "redact_pii_deterministic is…",
        choices: ["Random each run", "Same input → same token", "Server-only", "Kafka consumer"],
        answerIndex: 1,
      },
    ],
  },
  "book3-lesson7": {
    title: "Lesson 3.7 check",
    questions: [
      {
        prompt: "Pseudonymization maps…",
        choices: ["Random UUID each view", "Stable alias per person", "TLS ciphers", "Kafka offsets"],
        answerIndex: 1,
      },
    ],
  },
  "book3-lesson8": {
    title: "Lesson 3.8 check",
    questions: [
      {
        prompt: "Slack webhooks should verify…",
        choices: ["JSON pretty-print", "Signing secret HMAC before parse", "User agent only", "Postgres schema"],
        answerIndex: 1,
      },
    ],
  },
  "book3-lesson9": {
    title: "Lesson 3.9 check",
    questions: [
      {
        prompt: "Gateway checks JWT…",
        choices: ["scope claim", "Kafka lag", "Redis channel", "WASM size"],
        answerIndex: 0,
      },
    ],
  },
  "book3-lesson11": {
    title: "Lesson 3.11 check",
    questions: [
      {
        prompt: "Team Radar ships…",
        choices: ["Express BFF", "Rust gateway proxy", "MobX BFF", "Cerberus"],
        answerIndex: 1,
      },
    ],
  },
  "book3-capstone": {
    title: "Book 3 capstone",
    questions: [
      {
        prompt: "Stage 2 enables…",
        choices: ["JWT + mTLS mesh", "Only plaintext HTTP", "React 19", "BFF cookies"],
        answerIndex: 0,
      },
      {
        prompt: "Book 3 covered…",
        choices: ["Only Kafka partitions", "Security shell around the pipeline", "Only SolidJS", "Only PDFs"],
        answerIndex: 1,
      },
    ],
  },
  "book4-lesson1": {
    title: "Lesson 4.1 check",
    questions: [
      {
        prompt: "Stage 1 ingestion code lives in…",
        choices: ["apps/radar", "services/ingestion", "infra/certs", "Cloudflare Pages"],
        answerIndex: 1,
      },
    ],
  },
  "book4-lesson2": {
    title: "Lesson 4.2 check",
    questions: [
      {
        prompt: "Kafka envelope includes…",
        choices: ["Only payload bytes", "id, source, and payload", "JWT secret", "TLS cert"],
        answerIndex: 1,
      },
    ],
  },
  "book4-lesson3": {
    title: "Lesson 4.3 check",
    questions: [
      {
        prompt: "LLM enrichment belongs in…",
        choices: ["Webhook handler", "Async worker", "Browser", "Academy MDX"],
        answerIndex: 1,
      },
    ],
  },
  "book4-lesson4": {
    title: "Lesson 4.4 check",
    questions: [
      {
        prompt: "Default ingestion Kafka topic…",
        choices: ["enriched-dev-events", "raw-dev-events", "team_metrics", "team_radar:events"],
        answerIndex: 1,
      },
    ],
  },
  "book4-lesson5": {
    title: "Lesson 4.5 check",
    questions: [
      {
        prompt: "Analyzer consumer group id…",
        choices: ["millipede-analyzer", "llm-worker", "gateway", "postgres"],
        answerIndex: 0,
      },
    ],
  },
  "book4-lesson6": {
    title: "Lesson 4.6 check",
    questions: [
      {
        prompt: "ON CONFLICT on team_events enables…",
        choices: ["Faster TLS", "Idempotent replay", "WASM compile", "CORS"],
        answerIndex: 1,
      },
    ],
  },
  "book4-lesson7": {
    title: "Lesson 4.7 check",
    questions: [
      {
        prompt: "Metrics API is served by…",
        choices: ["ingestion :8081", "analyzer :8082", "kafka :9092", "Academy :4321"],
        answerIndex: 1,
      },
    ],
  },
  "book4-lesson8": {
    title: "Lesson 4.8 check",
    questions: [
      {
        prompt: "Redis PUBLISH channel for live events…",
        choices: ["raw-dev-events", "team_radar:events", "postgres", "jwt"],
        answerIndex: 1,
      },
    ],
  },
  "book4-lesson9": {
    title: "Lesson 4.9 check",
    questions: [
      {
        prompt: "Structured logs use…",
        choices: ["println! only", "tracing with event_id fields", "Kafka headers", "Redis keys"],
        answerIndex: 1,
      },
    ],
  },
  "book4-capstone": {
    title: "Book 4 capstone",
    questions: [
      {
        prompt: "Stage 1 delivers…",
        choices: ["Webhook → Kafka → Postgres (+ Redis)", "Only JWT gateway", "Only LLM", "Only WASM"],
        answerIndex: 0,
      },
      {
        prompt: "Book 4 was…",
        choices: ["Concept-only", "Build-along against real services", "React appendix", "PDF only"],
        answerIndex: 1,
      },
    ],
  },
  "book6-lesson1": {
    title: "Lesson 6.1 check",
    questions: [
      {
        prompt: "Team Radar dev server runs on…",
        choices: [":4321", ":5174", ":8081", ":9092"],
        answerIndex: 1,
      },
    ],
  },
  "book6-lesson2": {
    title: "Lesson 6.2 check",
    questions: [
      {
        prompt: "Stat cards refresh via…",
        choices: ["TanStack Query poll", "Kafka consumer in browser", "Postgres triggers", "WASM only"],
        answerIndex: 0,
      },
    ],
  },
  "book6-lesson3": {
    title: "Lesson 6.3 check",
    questions: [
      {
        prompt: "1:1 portal route is…",
        choices: ["/", "/1on1", "/api/metrics", "/webhooks"],
        answerIndex: 1,
      },
    ],
  },
  "book6-lesson4": {
    title: "Lesson 6.4 check",
    questions: [
      {
        prompt: "PII redaction in radar uses…",
        choices: ["@millipede/redact-wasm", "Express BFF", "Postgres triggers", "JWT"],
        answerIndex: 0,
      },
    ],
  },
  "book6-lesson5": {
    title: "Lesson 6.5 check",
    questions: [
      {
        prompt: "Activity stream uses…",
        choices: ["EventSource SSE", "Only full page reload", "Kafka in browser", "mTLS handshake"],
        answerIndex: 0,
      },
    ],
  },
  "book6-capstone": {
    title: "Book 6 capstone",
    questions: [
      {
        prompt: "Stage 4 ships…",
        choices: ["SolidJS radar dashboard", "React MobX BFF", "Python FastAPI UI", "Academy only"],
        answerIndex: 0,
      },
      {
        prompt: "Live rows vs stat cards…",
        choices: ["Same mechanism", "SSE vs Query poll", "Both from WASM", "Both from JWT"],
        answerIndex: 1,
      },
    ],
  },
  "book5-lesson1": {
    title: "Lesson 5.1 check",
    questions: [{ prompt: "Gateway listens on…", choices: [":8081", ":8443 HTTPS", ":5174", ":9092"], answerIndex: 1 }],
  },
  "book5-lesson2": {
    title: "Lesson 5.2 check",
    questions: [{ prompt: "Protected routes require…", choices: ["Kafka key", "Bearer JWT", "Postgres password", "WASM"], answerIndex: 1 }],
  },
  "book5-lesson3": {
    title: "Lesson 5.3 check",
    questions: [{ prompt: "Gateway to backends uses…", choices: ["Plain HTTP only", "mTLS rustls client", "Slack HMAC", "Redis"], answerIndex: 1 }],
  },
  "book5-lesson4": {
    title: "Lesson 5.4 check",
    questions: [{ prompt: "Webhooks in hardened path go through…", choices: ["Direct :8081", "Gateway /api/webhooks", "Academy", "Pages CDN"], answerIndex: 1 }],
  },
  "book5-lesson5": {
    title: "Lesson 5.5 check",
    questions: [{ prompt: "llm-worker is written in…", choices: ["Rust", "Python", "SolidJS", "Go"], answerIndex: 1 }],
  },
  "book5-lesson6": {
    title: "Lesson 5.6 check",
    questions: [{ prompt: "Default input topic…", choices: ["enriched-dev-events", "raw-dev-events", "team_metrics", "team_radar:events"], answerIndex: 1 }],
  },
  "book5-lesson7": {
    title: "Lesson 5.7 check",
    questions: [{ prompt: "Enrichment pipeline order…", choices: ["stamp → parse → score", "parse → score → stamp", "Kafka → JWT", "WASM only"], answerIndex: 1 }],
  },
  "book5-lesson8": {
    title: "Lesson 5.8 check",
    questions: [{ prompt: "LLM worker publishes to…", choices: ["raw-dev-events", "enriched-dev-events", "Postgres", "Redis only"], answerIndex: 1 }],
  },
  "book5-lesson9": {
    title: "Lesson 5.9 check",
    questions: [{ prompt: "sentiment column filled by…", choices: ["ingestion only", "enrichment pipeline", "Academy quiz", "CORS"], answerIndex: 1 }],
  },
  "book5-lesson10": {
    title: "Lesson 5.10 check",
    questions: [{ prompt: "Safe replay needs…", choices: ["Delete Postgres", "Idempotent writes", "Disable JWT", "Remove Kafka"], answerIndex: 1 }],
  },
  "book5-lesson11": {
    title: "Lesson 5.11 check",
    questions: [{ prompt: "Slack webhooks verify…", choices: ["JWT scope", "Signing secret HMAC", "mTLS cert", "Query cache"], answerIndex: 1 }],
  },
  "book5-capstone": {
    title: "Book 5 capstone",
    questions: [
      { prompt: "Book 5 shipped…", choices: ["Gateway + LLM enrichment", "Only Book 0 bits", "Only radar UI", "BFF only"], answerIndex: 0 },
      { prompt: "Full path includes…", choices: ["JWT → Kafka → enrich → Postgres", "Sync LLM in webhook", "No analyzer", "No gateway"], answerIndex: 0 },
    ],
  },
};
