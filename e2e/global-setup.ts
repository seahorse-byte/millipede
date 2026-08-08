import { type ChildProcess, spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PID_FILE = path.join(ROOT, "e2e", ".pipeline-pids.json");

async function waitForHealth(url: string, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function spawnService(command: string, args: string[], cwd = ROOT): ChildProcess {
  return spawn(command, args, {
    cwd,
    stdio: "pipe",
    env: { ...process.env, RUST_LOG: "warn" },
  });
}

export default async function globalSetup() {
  if (process.env.RUN_PIPELINE_E2E !== "1") return;

  const analyzer = spawnService("cargo", ["run", "-q", "-p", "millipede-analyzer"]);
  const ingestion = spawnService("cargo", ["run", "-q", "-p", "millipede-ingestion"]);
  const llmWorker = spawnService("pnpm", ["llm-worker:dev"], ROOT);

  await waitForHealth("http://127.0.0.1:8082/health");
  await waitForHealth("http://127.0.0.1:8081/health");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  writeFileSync(
    PID_FILE,
    JSON.stringify({
      analyzer: analyzer.pid,
      ingestion: ingestion.pid,
      llmWorker: llmWorker.pid,
    }),
  );
}
