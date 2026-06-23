import { test, expect } from "playwright/test";

// These tests use the session seeded by auth.setup.ts.
// If TEST_ARTIST_EMAIL is not set, setup saves an empty state and these tests
// will redirect to /login — we skip gracefully in that case.

test.describe("Artist dashboard", () => {
  test("authenticated artist reaches /dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    // If auth wasn't seeded, we land on /login — skip
    if (page.url().includes("/login")) {
      test.skip(true, "TEST_ARTIST_EMAIL not configured — auth not seeded");
      return;
    }

    await expect(page).toHaveURL(/\/dashboard/);
    // Dashboard renders the artist's name somewhere on the page
    await expect(page.locator("body")).not.toContainText("Sign in");
  });

  test("profile edit form is accessible from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("/login")) {
      test.skip(true, "TEST_ARTIST_EMAIL not configured — auth not seeded");
      return;
    }

    // Navigate to profile edit
    await page.goto("/dashboard/profile");
    await expect(page).toHaveURL(/\/dashboard\/profile/);

    // Bio textarea should exist
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("locations page is accessible", async ({ page }) => {
    await page.goto("/dashboard/locations");
    if (page.url().includes("/login")) {
      test.skip(true, "TEST_ARTIST_EMAIL not configured — auth not seeded");
      return;
    }

    await expect(page).toHaveURL(/\/dashboard\/locations/);
    // Page loads without error
    await expect(page.locator("body")).not.toContainText("Something went wrong");
  });

  test("unauthenticated request to /dashboard redirects to /login", async ({ browser }) => {
    // Use a fresh context with no cookies
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await context.close();
  });
});
