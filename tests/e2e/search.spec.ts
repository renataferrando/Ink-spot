import { test, expect } from "playwright/test";

test.describe("Search page", () => {
  test("loads with textarea and suggestion list", async ({ page }) => {
    await page.goto("/search");

    await expect(page.getByRole("textbox")).toBeVisible();
    // Suggestion phrases are shown at idle state
    await expect(page.getByText("fine line botanical")).toBeVisible();
  });

  test("clicking a suggestion phrase triggers results", async ({ page }) => {
    await page.goto("/search");

    await page.getByText("fine line botanical").click();

    // Results section heading appears after search
    await expect(page.getByRole("heading", { name: /Top/i })).toBeVisible({ timeout: 15_000 });
  });

  test("typing and submitting a query shows results", async ({ page }) => {
    await page.goto("/search");

    const textarea = page.getByRole("textbox");
    await textarea.fill("blackwork geometric sleeve");
    await page.getByRole("button", { name: "Search", exact: true }).click();

    // Results heading appears (even if 0 results)
    await expect(page.getByRole("heading", { name: /Top/i })).toBeVisible({ timeout: 15_000 });
  });

  test("assistant / list only toggle switches modes", async ({ page }) => {
    await page.goto("/search");

    const listTab = page.getByRole("tab", { name: /list only/i });
    await listTab.click();
    await expect(listTab).toHaveAttribute("aria-selected", "true");

    const assistantTab = page.getByRole("tab", { name: /assistant/i });
    await assistantTab.click();
    await expect(assistantTab).toHaveAttribute("aria-selected", "true");
  });
});
