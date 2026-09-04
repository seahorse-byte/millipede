#!/usr/bin/env node
/**
 * Poll all configured connectors on an interval while the stack is up.
 */
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, envOr } from "./lib/env.mjs";
import { loadTeamSources } from "./lib/config.mjs";
import { refreshTeamBrain } from "./lib/brain.mjs";

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const minutes = Number(envOr("CONNECTOR_POLL_MINUTES", "5"));
const intervalMs = minutes * 60 * 1000;

function runConnector(name) {
  return new Promise((resolve, reject) => {
    const script = resolve(__dirname, `sync-${name}.mjs`);
    const child = spawn(process.execPath, [script], {
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${name} exited with code ${code}`));
    });
  });
}

function enabledConnectors(sources) {
  const list = [];
  if ((sources.github?.repos ?? []).length > 0 && process.env.GITHUB_TOKEN) {
    list.push("github");
  }
  // Stubs skipped until tokens + config present
  if ((sources.gitlab?.projects ?? []).length > 0 && process.env.GITLAB_TOKEN) {
    list.push("gitlab");
  }
  if ((sources.jira?.projects ?? []).length > 0 && process.env.JIRA_API_TOKEN) {
    list.push("jira");
  }
  if ((sources.slack?.channels ?? []).length > 0 && process.env.SLACK_BOT_TOKEN) {
    list.push("slack");
  }
  return list;
}

async function tick(sources) {
  const connectors = enabledConnectors(sources);
  if (connectors.length === 0) {
    console.warn(
      "No connectors enabled — set tokens in .env.local and repos in team-sources.json",
    );
    return;
  }

  const stamp = new Date().toISOString();
  console.log(`\n[${stamp}] Running: ${connectors.join(", ")}`);

  for (const name of connectors) {
    try {
      await runConnector(name);
    } catch (err) {
      console.error(`[${name}]`, err.message);
    }
  }

  await refreshTeamBrain();
}

async function main() {
  const sources = loadTeamSources();
  console.log(`Connector watch — every ${minutes} minute(s)`);
  console.log("Ctrl+C to stop\n");

  await tick(sources);
  setInterval(() => tick(sources), intervalMs);
}

main();
