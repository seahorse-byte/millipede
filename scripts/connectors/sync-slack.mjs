#!/usr/bin/env node
/** Stub — Slack channel history sync. See scripts/connectors/README.md */
import { loadEnv } from "./lib/env.mjs";

loadEnv();

console.log(`
Slack connector (stub)

Setup:
  1. Create a Slack app with bot scopes: channels:history, groups:history, users:read
  2. Install the app to your workspace; invite the bot to allowlisted channels
  3. Add SLACK_BOT_TOKEN to .env.local
  4. Add channel IDs to config/team-sources.json → slack.channels
  5. Map slack_user_id in config/direct-reports.json

Privacy: only allowlisted channels are synced. DMs are off by default (include_dms: false).

When implemented, this will poll conversations.history and post to:
  ${process.env.INGESTION_URL ?? "http://127.0.0.1:8081"}/webhooks/hello

See ~/.claude/plans/millipede-local-team-connectors.md for rate limits and privacy notes.
`);
