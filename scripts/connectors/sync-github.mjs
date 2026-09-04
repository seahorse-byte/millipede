#!/usr/bin/env node
/**
 * Poll GitHub for recent PRs and reviews by direct reports.
 * Posts normalized events to ingestion :8081/webhooks/github
 */
import { loadEnv, requireEnv, envOr } from "./lib/env.mjs";
import { loadDirectReports, buildRosterMaps, matchGithubLogin } from "./lib/roster.mjs";
import { loadTeamSources } from "./lib/config.mjs";
import { postEvent } from "./lib/ingest.mjs";
import { refreshTeamBrain } from "./lib/brain.mjs";

loadEnv();

const dryRun = process.argv.includes("--dry-run");
const GITHUB_API = "https://api.github.com";

function prState(pr) {
  if (pr.merged_at) return "merged";
  if (pr.state === "closed") return "closed";
  return "open";
}

function prAction(pr) {
  const state = prState(pr);
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

async function githubFetch(path, token) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (response.status === 404) {
    console.warn(`  ⚠ not found: ${path}`);
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status} for ${path}: ${text}`);
  }

  return response.json();
}

function normalizePr(pr, repo, person) {
  return {
    source: "github",
    event_type: "pr",
    actor_id: person.id,
    actor_name: person.name,
    title: pr.title,
    repo,
    pr_number: pr.number,
    state: prState(pr),
    url: pr.html_url,
    action: prAction(pr),
  };
}

function normalizeReview(review, pr, repo, person) {
  const stateLabel = review.state?.toLowerCase() ?? "reviewed";
  return {
    source: "github",
    event_type: "activity",
    actor_id: person.id,
    actor_name: person.name,
    title: `${review.state} PR #${pr.number}: ${pr.title}`,
    repo,
    pr_number: pr.number,
    url: pr.html_url,
    action: "reviewed",
  };
}

async function syncRepo(repo, token, byGithub, options) {
  const { syncDays, includeReviews } = options;
  let posted = 0;
  let skipped = 0;

  console.log(`\n→ ${repo}`);

  const pulls = await githubFetch(
    `/repos/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=50`,
    token,
  );

  if (!pulls) return { posted, skipped };

  for (const pr of pulls) {
    if (!withinSyncWindow(pr.updated_at, syncDays)) continue;

    const author = matchGithubLogin(pr.user?.login, byGithub);
    if (!author) {
      skipped++;
      continue;
    }

    const payload = normalizePr(pr, repo, author);
    await postEvent(payload, { dryRun });
    posted++;
    console.log(`  ✓ PR #${pr.number} — ${author.name}`);

    if (includeReviews) {
      const reviews = await githubFetch(
        `/repos/${repo}/pulls/${pr.number}/reviews`,
        token,
      );
      if (!reviews) continue;

      for (const review of reviews) {
        const reviewer = matchGithubLogin(review.user?.login, byGithub);
        if (!reviewer) continue;
        if (reviewer.id === author.id && review.state === "COMMENTED") {
          // Author self-comment — skip duplicate noise
          continue;
        }

        const reviewPayload = normalizeReview(review, pr, repo, reviewer);
        await postEvent(reviewPayload, { dryRun });
        posted++;
        console.log(`  ✓ review on #${pr.number} — ${reviewer.name} (${review.state})`);
      }
    }
  }

  return { posted, skipped };
}

async function main() {
  const token = requireEnv("GITHUB_TOKEN");
  const sources = loadTeamSources();
  const githubConfig = sources.github ?? {};
  const repos = githubConfig.repos ?? [];
  const syncDays = githubConfig.sync_days ?? 14;
  const includeReviews = githubConfig.include_reviews ?? true;

  if (repos.length === 0) {
    console.error(
      "No GitHub repos in config/team-sources.json — add repos under github.repos",
    );
    process.exit(1);
  }

  const reports = loadDirectReports();
  const { byGithub } = buildRosterMaps(reports);

  console.log(
    `GitHub sync → ${envOr("INGESTION_URL", "http://127.0.0.1:8081")}/webhooks/github`,
  );
  console.log(`Repos: ${repos.join(", ")} | window: ${syncDays} days`);
  if (dryRun) console.log("(dry-run — no POSTs)");

  let totalPosted = 0;
  let totalSkipped = 0;

  for (const repo of repos) {
    const { posted, skipped } = await syncRepo(repo, token, byGithub, {
      syncDays,
      includeReviews,
    });
    totalPosted += posted;
    totalSkipped += skipped;
  }

  console.log(
    `\nDone. Posted ${totalPosted} event(s), skipped ${totalSkipped} PR(s) from non-roster authors.`,
  );
  if (!dryRun && totalPosted > 0) {
    console.log("Wait ~5s, then open http://127.0.0.1:5174");
    await refreshTeamBrain();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
