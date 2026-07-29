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
};
