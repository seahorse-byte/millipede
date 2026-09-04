import { expect, test } from "@playwright/test";

test.describe("Team Radar dashboard", () => {
  test("loads shell and manager KPI section", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Team Radar" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByLabel("Manager KPIs")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Friction index")).toBeVisible();
    await expect(page.getByText("Eval pass rate")).toBeVisible();
  });

  test("renders live metrics when analyzer is up", async ({ page, request }) => {
    let summary: Awaited<ReturnType<typeof request.get>> | null = null;
    try {
      summary = await request.get("http://127.0.0.1:8082/api/metrics/summary");
    } catch {
      test.skip(true, "Analyzer not running on :8082");
    }
    test.skip(!summary?.ok(), "Analyzer not running on :8082");

    const data = (await summary!.json()) as { total_events: number };
    await page.goto("/");

    await expect(page.getByText("Total events")).toBeVisible();
    await expect(page.getByText(String(data.total_events))).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".kpi-value").first()).not.toHaveText("—", { timeout: 10_000 });
  });

  test("shows empty activity guidance", async ({ page, request }) => {
    try {
      const summary = await request.get("http://127.0.0.1:8082/api/metrics/summary");
      if (summary.ok()) {
        const data = (await summary.json()) as { total_events: number };
        test.skip(data.total_events > 0, "Skip when pipeline already has events");
      }
    } catch {
      // Analyzer down — still assert empty-state UI without pipeline.
    }

    await page.goto("/");

    await expect(page.getByText("No activity matches these filters.")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("tab", { name: "Activity" })).toBeVisible();
  });

  test("navigates to 1:1 portal", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "1:1 Portal" }).click();
    await expect(page.getByRole("heading", { name: "1:1 Portal" })).toBeVisible();
    await expect(page.getByText("Run WASM redaction")).toBeVisible();
  });
});
