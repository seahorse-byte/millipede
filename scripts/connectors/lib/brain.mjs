import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { envOr } from "./env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Refresh Team Brain docs after connector ingest (skip with BRAIN_REFRESH=0). */
export async function refreshTeamBrain({ waitMs = 6000 } = {}) {
  if (envOr("BRAIN_REFRESH", "1") === "0") return;

  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const script = resolve(__dirname, "../../brain-writer/run.sh");
  return new Promise((resolve) => {
    const child = spawn("bash", [script], { stdio: "inherit", env: process.env });
    child.on("close", (code) => {
      if (code !== 0) {
        console.warn("Team Brain refresh failed — is analyzer running on :8082?");
      }
      resolve();
    });
  });
}
