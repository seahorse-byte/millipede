import { existsSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PID_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), ".pipeline-pids.json");

export default async function globalTeardown() {
  if (!existsSync(PID_FILE)) return;

  const pids = JSON.parse(readFileSync(PID_FILE, "utf8")) as {
    analyzer?: number;
    ingestion?: number;
    llmWorker?: number;
  };

  for (const pid of [pids.analyzer, pids.ingestion, pids.llmWorker]) {
    if (pid) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        // already stopped
      }
    }
  }

  unlinkSync(PID_FILE);
}
