import { expect, test } from "@playwright/test";

test.describe("1:1 portal WASM redaction", () => {
  test("redacts email locally in browser", async ({ page }) => {
    await page.goto("/1on1");

    const sample =
      "Team member reported burnout. Contact alice@example.com after standup.";
    await page.getByPlaceholder(/Team member reported burnout/i).fill(sample);
    await page.getByRole("button", { name: "Run WASM redaction" }).click();

    const output = page.locator(".output-block");
    await expect(output).not.toContainText("alice@example.com", { timeout: 15_000 });
    await expect(output).not.toHaveText(/Output will appear here/);
  });
});
