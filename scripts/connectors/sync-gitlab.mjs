#!/usr/bin/env node
/** Stub — GitLab MR sync. See scripts/connectors/README.md */
import { loadEnv } from "./lib/env.mjs";

loadEnv();

console.log(`
GitLab connector (stub)

Setup:
  1. Create a GitLab personal access token with read_api scope
  2. Add GITLAB_TOKEN and GITLAB_HOST to .env.local
  3. Add project paths to config/team-sources.json → gitlab.projects
  4. Map gitlab usernames in config/direct-reports.json

When implemented, this will poll merge requests and post to:
  ${process.env.INGESTION_URL ?? "http://127.0.0.1:8081"}/webhooks/hello

See ~/.claude/plans/millipede-local-team-connectors.md for event mapping.
`);
