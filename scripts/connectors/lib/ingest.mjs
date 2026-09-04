import { envOr } from "./env.mjs";

const DEFAULT_WEBHOOK = "/webhooks/github";

/**
 * POST a normalized event payload to ingestion.
 * @param {object} payload - Normalized team event fields
 * @param {{ webhook?: string, dryRun?: boolean }} opts
 */
export async function postEvent(payload, opts = {}) {
  const base = envOr("INGESTION_URL", "http://127.0.0.1:8081");
  const webhook = opts.webhook ?? DEFAULT_WEBHOOK;
  const url = `${base.replace(/\/$/, "")}${webhook}`;

  if (opts.dryRun) {
    console.log("[dry-run]", JSON.stringify(payload));
    return { accepted: true, dryRun: true };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ingestion ${response.status}: ${text}`);
  }

  return response.json();
}
