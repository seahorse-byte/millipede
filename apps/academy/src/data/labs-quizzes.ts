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
};
