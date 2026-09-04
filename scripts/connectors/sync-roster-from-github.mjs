#!/usr/bin/env node
/**
 * Sync config/direct-reports.json from a GitHub org team roster.
 * Preserves gitlab / slack / jira / email fields for existing members.
 *
 * Requires GITHUB_TOKEN with read:org (and team visibility for the org).
 * Team org + slug come from config/team-sources.json → github.org / github.team_slug.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv, requireEnv, REPO_ROOT } from "./lib/env.mjs";
import { loadTeamSources } from "./lib/config.mjs";

loadEnv();

const GITHUB_API = "https://api.github.com";
const dryRun = process.argv.includes("--dry-run");

function idFromLogin(login) {
  return login.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

async function githubFetch(path, token) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status} for ${path}: ${text}`);
  }

  return response.json();
}

async function fetchTeamMembers(org, teamSlug, token) {
  const query = `
    query($org: String!, $slug: String!) {
      organization(login: $org) {
        team(slug: $slug) {
          name
          members(first: 100) {
            nodes { login name }
          }
        }
      }
    }
  `;

  const response = await fetch(`${GITHUB_API}/graphql`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query, variables: { org, slug: teamSlug } }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub GraphQL ${response.status}: ${text}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  const team = json.data?.organization?.team;
  if (!team) {
    throw new Error(
      `Team ${org}/${teamSlug} not found or token lacks org access — try: gh auth refresh -h github.com -s read:org`,
    );
  }

  return { teamName: team.name, members: team.members.nodes };
}

async function fetchTeamRepos(org, teamSlug, token) {
  const repos = [];
  let page = 1;

  while (true) {
    const batch = await githubFetch(
      `/orgs/${org}/teams/${teamSlug}/repos?per_page=100&page=${page}`,
      token,
    );
    if (!batch.length) break;
    for (const repo of batch) {
      repos.push(repo.full_name);
    }
    if (batch.length < 100) break;
    page++;
  }

  return repos.sort();
}

function loadManagerGithub() {
  const path = resolve(REPO_ROOT, "config/manager.json");
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    return data.github?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function loadExistingReports() {
  const path = resolve(REPO_ROOT, "config/direct-reports.json");
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    const byGithub = new Map();
    for (const person of data.direct_reports ?? []) {
      if (person.github) {
        byGithub.set(person.github.toLowerCase(), person);
      }
    }
    return { path, byGithub };
  } catch {
    return { path: resolve(REPO_ROOT, "config/direct-reports.json"), byGithub: new Map() };
  }
}

function mergeMember(node, existing) {
  const login = node.login;
  const name = node.name?.trim() || login;
  const base = {
    id: idFromLogin(login),
    name,
    email: "",
    github: login,
    gitlab: "",
    slack_user_id: "",
    jira_account_id: "",
  };

  if (!existing) return base;

  return {
    ...base,
    id: existing.id ?? base.id,
    email: existing.email ?? "",
    gitlab: existing.gitlab ?? "",
    slack_user_id: existing.slack_user_id ?? "",
    jira_account_id: existing.jira_account_id ?? "",
  };
}

async function main() {
  const token = requireEnv("GITHUB_TOKEN");
  const sources = loadTeamSources();
  const githubConfig = sources.github ?? {};
  const org = githubConfig.org ?? process.env.GITHUB_ORG;
  const teamSlug = githubConfig.team_slug ?? process.env.GITHUB_TEAM_SLUG;

  if (!org || !teamSlug) {
    throw new Error(
      "Set github.org and github.team_slug in config/team-sources.json (or GITHUB_ORG / GITHUB_TEAM_SLUG env)",
    );
  }

  console.log(`Fetching roster: ${org}/${teamSlug}`);

  const { teamName, members } = await fetchTeamMembers(org, teamSlug, token);
  const { path, byGithub } = loadExistingReports();
  const managerGithub = loadManagerGithub();

  const direct_reports = members
    .filter((node) => node.login.toLowerCase() !== managerGithub)
    .map((node) => mergeMember(node, byGithub.get(node.login.toLowerCase())))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (managerGithub) {
    const skipped = members.filter((node) => node.login.toLowerCase() === managerGithub);
    if (skipped.length) {
      console.log(`Skipped manager (${skipped[0].login}) — see config/manager.json`);
    }
  }

  const output = { direct_reports };

  if (dryRun) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  writeFileSync(path, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${direct_reports.length} member(s) from "${teamName}" → ${path}`);

  if (process.argv.includes("--sync-repos")) {
    const repos = await fetchTeamRepos(org, teamSlug, token);
    const teamSourcesPath = resolve(REPO_ROOT, "config/team-sources.json");
    const teamSources = loadTeamSources();
    const existing = new Set(teamSources.github?.repos ?? []);
    for (const repo of repos) existing.add(repo);
    teamSources.github.repos = [...existing].sort();
    writeFileSync(teamSourcesPath, `${JSON.stringify(teamSources, null, 2)}\n`);
    console.log(`Updated github.repos (${teamSources.github.repos.length} total) → ${teamSourcesPath}`);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
