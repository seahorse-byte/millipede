#!/usr/bin/env bash
# Seed realistic demo events for all 5 direct reports across Slack, Jira, GitHub, GitLab + PRs.
set -euo pipefail

INGESTION_URL="${INGESTION_URL:-http://127.0.0.1:8081}"
WEBHOOK="${INGESTION_URL}/webhooks/hello"

post() {
  local payload="$1"
  if ! curl -sf -X POST "$WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "$payload" > /dev/null; then
    echo "  ✗ failed — is ingestion running on ${INGESTION_URL}?"
    exit 1
  fi
  echo "  ✓ posted: $(echo "$payload" | jq -r '.title // .event_type')"
}

echo "Seeding demo events → ${WEBHOOK}"
echo ""

echo "Activity events (4 sources × 5 people)…"
post '{"source":"slack","event_type":"activity","actor_id":"alex-chen","actor_name":"Alex Chen","title":"Asked about rollout plan in #eng-platform","action":"message"}'
post '{"source":"jira","event_type":"activity","actor_id":"alex-chen","actor_name":"Alex Chen","title":"Moved RADAR-142 to In Review","action":"updated"}'
post '{"source":"slack","event_type":"activity","actor_id":"sam-patel","actor_name":"Sam Patel","title":"Shared deploy checklist in #releases","action":"message"}'
post '{"source":"jira","event_type":"activity","actor_id":"sam-patel","actor_name":"Sam Patel","title":"Resolved RADAR-98: flaky e2e on dashboard","action":"resolved"}'
post '{"source":"slack","event_type":"activity","actor_id":"jordan-lee","actor_name":"Jordan Lee","title":"Flagged latency spike in #oncall","action":"message"}'
post '{"source":"jira","event_type":"activity","actor_id":"jordan-lee","actor_name":"Jordan Lee","title":"Created RADAR-201: Kafka consumer lag alert","action":"opened"}'
post '{"source":"slack","event_type":"activity","actor_id":"riley-morgan","actor_name":"Riley Morgan","title":"Posted retro notes in #team-radar","action":"message"}'
post '{"source":"jira","event_type":"activity","actor_id":"riley-morgan","actor_name":"Riley Morgan","title":"Commented on RADAR-55 security review","action":"commented"}'
post '{"source":"slack","event_type":"activity","actor_id":"casey-nguyen","actor_name":"Casey Nguyen","title":"Celebrated green CI in #mobile","action":"message"}'
post '{"source":"jira","event_type":"activity","actor_id":"casey-nguyen","actor_name":"Casey Nguyen","title":"Closed RADAR-77: mobile SDK crash fix","action":"closed"}'

echo ""
echo "Pull requests (5 PRs across 4 repos, GitHub + GitLab)…"
post '{"source":"github","event_type":"pr","actor_id":"alex-chen","actor_name":"Alex Chen","title":"feat: add auth middleware","repo":"acme/platform-api","pr_number":142,"state":"open","url":"https://github.com/acme/platform-api/pull/142","action":"opened"}'
post '{"source":"github","event_type":"pr","actor_id":"sam-patel","actor_name":"Sam Patel","title":"fix: dashboard reactivity on metrics poll","repo":"acme/web-app","pr_number":89,"state":"merged","url":"https://github.com/acme/web-app/pull/89","action":"merged"}'
post '{"source":"gitlab","event_type":"pr","actor_id":"jordan-lee","actor_name":"Jordan Lee","title":"perf: reduce analyzer query latency","repo":"acme/backend-services","pr_number":234,"state":"open","url":"https://gitlab.com/acme/backend-services/-/merge_requests/234","action":"opened"}'
post '{"source":"gitlab","event_type":"pr","actor_id":"riley-morgan","actor_name":"Riley Morgan","title":"chore: rotate staging secrets","repo":"snyk/infra-config","pr_number":17,"state":"closed","url":"https://gitlab.com/snyk/infra-config/-/merge_requests/17","action":"closed"}'
post '{"source":"github","event_type":"pr","actor_id":"casey-nguyen","actor_name":"Casey Nguyen","title":"feat: offline cache for mobile SDK","repo":"acme/mobile-sdk","pr_number":55,"state":"open","url":"https://github.com/acme/mobile-sdk/pull/55","action":"opened"}'

echo ""
echo "Done. Wait ~5s for pipeline, then open http://127.0.0.1:5174"
echo "Filter by direct report and switch to Pull requests tab."
