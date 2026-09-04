import { execSync } from "node:child_process";

/** True when the Stage 3 consumer is running (Kafka → enriched-dev-events). */
export function isLlmWorkerRunning() {
  try {
    execSync("pgrep -f millipede_llm_worker.main", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Warn when connectors posted events but enrichment cannot run.
 * @param {{ posted: number, dryRun?: boolean }} opts
 */
export function warnIfPipelineDown({ posted, dryRun }) {
  if (dryRun || posted <= 0 || isLlmWorkerRunning()) return;

  console.warn(
    "\n⚠ llm-worker is not running — ingestion accepted events into Kafka, but Radar will stay empty until enrichment runs.",
  );
  console.warn("  Start: pnpm llm-worker:dev");
  console.warn(
    "  Pipeline: ingestion (:8081) → raw-dev-events → llm-worker → analyzer (:8082) → Postgres",
  );
}
