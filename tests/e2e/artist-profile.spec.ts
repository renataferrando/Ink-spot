import { test, expect } from "playwright/test";

// Navigates to the first artist card found on /explore and checks the profile page.
// Falls back to TEST_ARTIST_HANDLE env var if set.
test.describe("Artist profile page", () => {
  test("public profile loads with display name", async ({ page }) => {
    const handle = process.env.TEST_ARTIST_HANDLE;

    if (handle) {
      await page.goto(`/artist/${handle}`);
    } else {
      // Pick the first artist card from /explore
      await page.goto("/explore");
      const firstCard = page.locator('a[href^="/artist/"]').filter({ visible: true }).first();
      await expect(firstCard).toBeVisible({ timeout: 10_000 });
      await firstCard.click();
    }

    // Profile must have a heading (artist display name)
    await expect(page.getByRole("heading")).toBeVisible({ timeout: 10_000 });
    // Instagram or contact link, or at minimum the page body loads
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("unknown handle returns 404", async ({ page }) => {
    const response = await page.goto("/artist/__no_such_handle__");
    expect(response?.status()).toBe(404);
  });
});
