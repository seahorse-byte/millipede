import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "./env.mjs";

export function loadDirectReports() {
  const path =
    process.env.DIRECT_REPORTS_CONFIG ??
    resolve(REPO_ROOT, "config/direct-reports.json");
  const data = JSON.parse(readFileSync(path, "utf8"));
  return data.direct_reports ?? [];
}

/**
 * Build lookup maps from direct-reports.json handles → roster entry.
 */
export function buildRosterMaps(reports) {
  const byGithub = new Map();
  const byGitlab = new Map();
  const bySlack = new Map();
  const byJira = new Map();
  const byEmail = new Map();

  for (const person of reports) {
    if (person.github) byGithub.set(person.github.toLowerCase(), person);
    if (person.gitlab) byGitlab.set(person.gitlab.toLowerCase(), person);
    if (person.slack_user_id) bySlack.set(person.slack_user_id, person);
    if (person.jira_account_id)
      byJira.set(person.jira_account_id.toLowerCase(), person);
    if (person.email) byEmail.set(person.email.toLowerCase(), person);
  }

  return { byGithub, byGitlab, bySlack, byJira, byEmail };
}

export function matchGithubLogin(login, byGithub) {
  if (!login) return null;
  return byGithub.get(login.toLowerCase()) ?? null;
}
