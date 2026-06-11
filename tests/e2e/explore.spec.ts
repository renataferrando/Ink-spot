import { test, expect } from "playwright/test";

test.describe("Explore page", () => {
  test("loads filter chips and artist links", async ({ page }) => {
    await page.goto("/explore");

    // Style filter chips
    await expect(page.getByRole("link", { name: "All" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Blackwork" })).toBeVisible();

    // At least one artist card links to a profile (filter hidden mobile cards)
    const firstCard = page.locator('a[href^="/artist/"]').filter({ visible: true }).first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });
  });

  test("style filter updates the URL", async ({ page }) => {
    await page.goto("/explore");
    await page.getByRole("link", { name: "Blackwork" }).click();
    await page.waitForURL(/styles=blackwork/);
    await expect(page).toHaveURL(/styles=blackwork/);
  });

  test("All chip clears the style filter", async ({ page }) => {
    await page.goto("/explore?styles=blackwork");
    await page.getByRole("link", { name: "All" }).click();
    await page.waitForURL(/\/explore$/);
    await expect(page).not.toHaveURL(/styles=/);
  });
});
