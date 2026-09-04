import { expect, test } from "@playwright/test";

test.describe("Team Radar dashboard", () => {
  test("loads shell and manager KPI section", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Team Radar" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByLabel("Manager KPIs")).toBeVisible();
    await expect(page.getByText("Friction index")).toBeVisible();
    await expect(page.getByText("Eval pass rate")).toBeVisible();
  });

  test("renders live metrics when analyzer is up", async ({ page, request }) => {
    const summary = await request.get("http://127.0.0.1:8082/api/metrics/summary");
    test.skip(!summary.ok(), "Analyzer not running on :8082");

    const data = (await summary.json()) as { total_events: number };
    await page.goto("/");

    await expect(page.getByText("Total events")).toBeVisible();
    await expect(page.getByText(String(data.total_events))).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".kpi-value").first()).not.toHaveText("—", { timeout: 10_000 });
  });

  test("shows empty live feed guidance", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("No live events yet")).toBeVisible();
    await expect(page.getByText("Activity stream")).toBeVisible();
  });

  test("navigates to 1:1 portal", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "1:1 Portal" }).click();
    await expect(page.getByRole("heading", { name: "1:1 Portal" })).toBeVisible();
    await expect(page.getByText("Run WASM redaction")).toBeVisible();
  });
});
