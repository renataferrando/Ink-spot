import * as path from "path";
import { test as setup, expect } from "playwright/test";
import { createClient } from "@supabase/supabase-js";

const authFile = path.join(__dirname, "../../playwright/.auth/user.json");

setup("authenticate as test artist", async ({ page }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.TEST_ARTIST_EMAIL;

  if (!supabaseUrl || !serviceRoleKey || !email) {
    console.warn(
      "Skipping auth setup — set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and TEST_ARTIST_EMAIL in .env.local",
    );
    await page.context().storageState({ path: authFile });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: "http://localhost:3000/api/auth/callback" },
  });

  if (error || !data.properties?.action_link) {
    throw new Error(`Could not generate magic link: ${error?.message ?? "no action_link"}`);
  }

  // Follow the magic link → Supabase verifies → redirects to /api/auth/callback → /dashboard
  await page.goto(data.properties.action_link);
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  // Persist cookies so all authenticated test files can reuse this session
  await page.context().storageState({ path: authFile });
});
