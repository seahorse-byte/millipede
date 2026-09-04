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
import { warnIfPipelineDown } from "./lib/pipeline.mjs";

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

class GitHubApiError extends Error {
  constructor(status, path, detail) {
    super(`GitHub API ${status} for ${path}: ${detail}`);
    this.name = "GitHubApiError";
    this.status = status;
    this.path = path;
  }
}

function isAuthDenied(status) {
  return status === 401 || status === 403;
}

function authDeniedHint(repo) {
  const [org] = repo.split("/");
  if (org?.toLowerCase() === "probely") {
    return (
      "Probely org blocks classic PATs — use a fine-grained PAT with access to this repo " +
      "(see scripts/connectors/README.md#fine-grained-pat-probely-org)."
    );
  }
  return (
    "Token lacks access to this repository — check org SSO authorization or use a fine-grained PAT."
  );
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
    throw new GitHubApiError(response.status, path, text);
  }

  return response.json();
}

function prBlocked(pr) {
  // GitHub list pulls endpoint does not include labels; blocked is only set when
  // labels are present (e.g. webhook payloads). Re-sync cannot detect blocked PRs.
  const labels = pr.labels ?? [];
  return labels.some((label) => {
    const name = typeof label === "string" ? label : label?.name;
    return name?.toLowerCase() === "blocked";
  });
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
    merged_at: pr.merged_at ?? null,
    draft: Boolean(pr.draft),
    blocked: prBlocked(pr),
    updated_at: pr.updated_at,
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

  let pulls;
  try {
    pulls = await githubFetch(
      `/repos/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=50`,
      token,
    );
  } catch (err) {
    if (err instanceof GitHubApiError && isAuthDenied(err.status)) {
      console.warn(`  ⚠ access denied (${err.status}) — ${authDeniedHint(repo)}`);
      return { posted, skipped, outcome: "denied" };
    }
    throw err;
  }

  if (!pulls) return { posted, skipped, outcome: "ok" };

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
      let reviews;
      try {
        reviews = await githubFetch(
          `/repos/${repo}/pulls/${pr.number}/reviews`,
          token,
        );
      } catch (err) {
        if (err instanceof GitHubApiError && isAuthDenied(err.status)) {
          console.warn(
            `  ⚠ reviews access denied (${err.status}) for PR #${pr.number} — skipping reviews`,
          );
          continue;
        }
        throw err;
      }
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

  return { posted, skipped, outcome: "ok" };
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
  let succeeded = 0;
  let denied = 0;
  let failed = 0;

  for (const repo of repos) {
    try {
      const { posted, skipped, outcome } = await syncRepo(repo, token, byGithub, {
        syncDays,
        includeReviews,
      });
      totalPosted += posted;
      totalSkipped += skipped;
      if (outcome === "denied") {
        denied++;
      } else {
        succeeded++;
      }
    } catch (err) {
      console.error(`  ✗ ${repo}: ${err.message ?? err}`);
      failed++;
    }
  }

  console.log(
    `\nDone. Posted ${totalPosted} event(s), skipped ${totalSkipped} PR(s) from non-roster authors.`,
  );
  if (denied > 0) {
    console.log(`Access denied for ${denied} repo(s) — other repos were still processed.`);
  }
  if (failed > 0) {
    console.log(`${failed} repo(s) failed with errors.`);
  }
  warnIfPipelineDown({ posted: totalPosted, dryRun });
  if (!dryRun && totalPosted > 0) {
    console.log("Wait ~5s, then open http://127.0.0.1:5174");
    await refreshTeamBrain();
  }

  if (succeeded > 0 || (denied > 0 && failed === 0)) {
    return;
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
