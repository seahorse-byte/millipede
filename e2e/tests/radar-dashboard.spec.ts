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
