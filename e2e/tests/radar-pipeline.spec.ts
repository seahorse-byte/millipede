import { test, expect } from "@playwright/test";

const pipeline = !!process.env.RUN_PIPELINE_E2E;

test.describe("Team Radar pipeline @pipeline", () => {
  test.skip(!pipeline, "Set RUN_PIPELINE_E2E=1 with compose + Rust services running");

  test("webhook increments metrics summary", async ({ request }) => {
    const before = await request.get("http://127.0.0.1:8082/api/metrics/summary");
    expect(before.ok()).toBeTruthy();
    const baseline = (await before.json()) as { total_events: number };

    const webhook = await request.post("http://127.0.0.1:8081/webhooks/hello", {
      data: {
        action: "opened",
        source: "github",
        title: "pipeline e2e event",
      },
    });
    expect(webhook.ok()).toBeTruthy();

    let latest = baseline.total_events;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await request.get("http://127.0.0.1:8082/api/metrics/summary");
      latest = ((await response.json()) as { total_events: number }).total_events;
      if (latest > baseline.total_events) break;
    }

    expect(latest).toBeGreaterThan(baseline.total_events);
  });

  test("dashboard reflects live pipeline state", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByLabel("Manager KPIs")).toBeVisible();
    await expect(page.getByText("Activity stream")).toBeVisible();
  });
});
