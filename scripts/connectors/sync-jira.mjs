#!/usr/bin/env node
/** Stub — Jira issue/comment sync. See scripts/connectors/README.md */
import { loadEnv } from "./lib/env.mjs";

loadEnv();

console.log(`
Jira connector (stub)

Setup:
  1. Create an API token at https://id.atlassian.com/manage-profile/security/api-tokens
  2. Add JIRA_EMAIL, JIRA_API_TOKEN, JIRA_SITE to .env.local
  3. Add project keys to config/team-sources.json → jira.projects
  4. Map jira_account_id in config/direct-reports.json

When implemented, this will poll recent issues/comments and post to:
  ${process.env.INGESTION_URL ?? "http://127.0.0.1:8081"}/webhooks/hello

See ~/.claude/plans/millipede-local-team-connectors.md for event mapping.
`);
