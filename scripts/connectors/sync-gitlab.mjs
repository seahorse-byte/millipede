#!/usr/bin/env node
/**
 * Poll GitLab for recent merge requests by direct reports.
 * Mirrors mr-radar / pr-radar GitLab project coverage; posts to ingestion.
 */
import { loadEnv, requireEnv, envOr } from "./lib/env.mjs";
import {
  loadDirectReports,
  buildRosterMaps,
  matchGitlabUsername,
} from "./lib/roster.mjs";
import { loadTeamSources } from "./lib/config.mjs";
import { postEvent } from "./lib/ingest.mjs";
import { refreshTeamBrain } from "./lib/brain.mjs";
import { warnIfPipelineDown } from "./lib/pipeline.mjs";

loadEnv();

const dryRun = process.argv.includes("--dry-run");

function urlEncodePath(path) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("%2F");
}

function mrState(mr) {
  if (mr.state === "merged") return "merged";
  if (mr.state === "closed") return "closed";
  return "open";
}

function mrAction(mr) {
  const state = mrState(mr);
  if (state === "merged") return "merged";
  if (state === "closed") return "closed";
  return "opened";
}

function withinSyncWindow(isoDate, syncDays) {
  if (!isoDate) return true;
  const updated = new Date(isoDate);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - syncDays);
  return updated >= cutoff;
}

async function gitlabFetch(apiPath, token, host) {
  const base = host.replace(/\/$/, "");
  const response = await fetch(`${base}/api/v4${apiPath}`, {
    headers: {
      "PRIVATE-TOKEN": token,
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    console.warn(`  ⚠ not found: ${apiPath}`);
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitLab API ${response.status} for ${apiPath}: ${text}`);
  }

  return response.json();
}

async function fetchMergeRequests(projectPath, token, host) {
  const encoded = urlEncodePath(projectPath);
  const all = [];
  let page = 1;

  while (page <= 20) {
    const batch = await gitlabFetch(
      `/projects/${encoded}/merge_requests?state=all&order_by=updated_at&sort=desc&per_page=100&page=${page}`,
      token,
      host,
    );
    if (!batch) return all;
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  return all;
}

function mrBlocked(mr) {
  if (mr.blocking_discussions_resolved === false) return true;
  const labels = mr.labels ?? [];
  return labels.some((label) => {
    const name = typeof label === "string" ? label : label?.name;
    return name?.toLowerCase() === "blocked";
  });
}

function normalizeMr(mr, projectPath, person) {
  return {
    source: "gitlab",
    event_type: "pr",
    actor_id: person.id,
    actor_name: person.name,
    title: mr.title,
    repo: projectPath,
    pr_number: mr.iid,
    state: mrState(mr),
    url: mr.web_url,
    action: mrAction(mr),
    merged_at: mr.merged_at ?? null,
    draft: Boolean(mr.draft || mr.work_in_progress),
    blocked: mrBlocked(mr),
    updated_at: mr.updated_at,
  };
}

async function syncProject(projectPath, token, host, byGitlab, options) {
  const { syncDays } = options;
  let posted = 0;
  let skipped = 0;

  console.log(`\n→ ${projectPath}`);

  const mergeRequests = await fetchMergeRequests(projectPath, token, host);

  for (const mr of mergeRequests) {
    if (!withinSyncWindow(mr.updated_at, syncDays)) continue;

    const author = matchGitlabUsername(mr.author?.username, byGitlab);
    if (!author) {
      skipped++;
      continue;
    }

    const payload = normalizeMr(mr, projectPath, author);
    await postEvent(payload, { dryRun });
    posted++;
    console.log(`  ✓ MR !${mr.iid} — ${author.name}`);
  }

  return { posted, skipped };
}

async function main() {
  const token = requireEnv("GITLAB_TOKEN");
  const sources = loadTeamSources();
  const gitlabConfig = sources.gitlab ?? {};
  const projects = gitlabConfig.projects ?? [];
  const host =
    process.env.GITLAB_HOST ?? gitlabConfig.host ?? "https://gitlab.com";
  const syncDays = gitlabConfig.sync_days ?? 14;

  if (projects.length === 0) {
    console.error(
      "No GitLab projects in config/team-sources.json — add paths under gitlab.projects",
    );
    console.error(
      "Tip: pr-radar tracks GitLab repos in ~/.claude/skills/mr-radar/data/config.json → repos[] where platform=gitlab",
    );
    process.exit(1);
  }

  const reports = loadDirectReports();
  const { byGitlab } = buildRosterMaps(reports);

  console.log(
    `GitLab sync → ${envOr("INGESTION_URL", "http://127.0.0.1:8081")}/webhooks/github`,
  );
  console.log(`Host: ${host}`);
  console.log(`Projects: ${projects.join(", ")} | window: ${syncDays} days`);
  if (dryRun) console.log("(dry-run — no POSTs)");

  let totalPosted = 0;
  let totalSkipped = 0;

  for (const project of projects) {
    const { posted, skipped } = await syncProject(
      project,
      token,
      host,
      byGitlab,
      { syncDays },
    );
    totalPosted += posted;
    totalSkipped += skipped;
  }

  console.log(
    `\nDone. Posted ${totalPosted} event(s), skipped ${totalSkipped} MR(s) from non-roster authors.`,
  );
  warnIfPipelineDown({ posted: totalPosted, dryRun });
  if (!dryRun && totalPosted > 0) {
    console.log("Wait ~5s, then open http://127.0.0.1:5174");
    await refreshTeamBrain();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
