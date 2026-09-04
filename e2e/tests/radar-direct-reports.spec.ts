import { expect, test } from "@playwright/test";

const pipeline = !!process.env.RUN_PIPELINE_E2E;
const INGESTION = "http://127.0.0.1:8081";
const ANALYZER = "http://127.0.0.1:8082";

async function seedEvents(request: import("@playwright/test").APIRequestContext) {
  const events = [
    {
      source: "slack",
      event_type: "activity",
      actor_id: "alex-chen",
      actor_name: "Alex Chen",
      title: "e2e: Alex slack message",
      action: "message",
    },
    {
      source: "jira",
      event_type: "activity",
      actor_id: "sam-patel",
      actor_name: "Sam Patel",
      title: "e2e: Sam jira update",
      action: "updated",
    },
    {
      source: "github",
      event_type: "pr",
      actor_id: "alex-chen",
      actor_name: "Alex Chen",
      title: "e2e: Alex PR for filter test",
      repo: "acme/e2e-repo",
      pr_number: 999,
      state: "open",
      url: "https://github.com/acme/e2e-repo/pull/999",
      action: "opened",
      updated_at: "2026-09-01T12:00:00Z",
    },
    {
      source: "gitlab",
      event_type: "pr",
      actor_id: "sam-patel",
      actor_name: "Sam Patel",
      title: "e2e: Sam MR for filter test",
      repo: "acme/e2e-services",
      pr_number: 888,
      state: "merged",
      url: "https://gitlab.com/acme/e2e-services/-/merge_requests/888",
      action: "merged",
      merged_at: "2026-09-03T15:30:00Z",
      updated_at: "2026-09-03T15:30:00Z",
    },
  ];

  for (const event of events) {
    const response = await request.post(`${INGESTION}/webhooks/hello`, { data: event });
    expect(response.ok()).toBeTruthy();
  }
}

async function waitForEvents(
  request: import("@playwright/test").APIRequestContext,
  directReport: string,
  minCount: number,
) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const response = await request.get(
      `${ANALYZER}/api/events?direct_report=${directReport}&limit=10`,
    );
    if (response.ok()) {
      const events = (await response.json()) as unknown[];
      if (events.length >= minCount) return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for events for ${directReport}`);
}

async function waitForPullRequests(
  request: import("@playwright/test").APIRequestContext,
  directReport: string,
) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const response = await request.get(
      `${ANALYZER}/api/pull-requests?direct_report=${directReport}`,
    );
    if (response.ok()) {
      const prs = (await response.json()) as { title: string }[];
      if (prs.length > 0) return prs;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for PRs for ${directReport}`);
}

test.describe("Team Radar direct reports @pipeline", () => {
  test.skip(!pipeline, "Set RUN_PIPELINE_E2E=1 with compose + Rust services running");

  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${ANALYZER}/health`);
    test.skip(!health.ok(), "Analyzer not running on :8082");
    await seedEvents(request);
  });

  test("filters activity by direct report", async ({ page, request }) => {
    await waitForEvents(request, "alex-chen", 1);

    await page.goto("/");
    await page.getByLabel("Direct report").selectOption({ label: "Alex Chen" });

    await expect(
      page.getByRole("cell", { name: "e2e: Alex slack message" }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("e2e: Sam jira update")).not.toBeVisible();
  });

  test("pull requests tab filters by direct report", async ({ page, request }) => {
    await waitForPullRequests(request, "alex-chen");

    await page.goto("/");
    await page.getByRole("tab", { name: "Pull requests" }).click();
    await page.getByLabel("Direct report").selectOption({ label: "Alex Chen" });

    await expect(page.getByText("e2e: Alex PR for filter test")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("e2e: Sam MR for filter test")).not.toBeVisible();
  });
});

test.describe("Team Radar filters UI", () => {
  test("renders filter bar and PR tab", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByLabel("Activity filters")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("Direct report")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Pull requests" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Source filters" })).toBeVisible();
  });

  test("renders PR state filter chips on pull requests tab", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Pull requests" }).click();

    await expect(page.getByRole("group", { name: "PR state filters" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Merged" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open" })).toBeVisible();
  });
});
