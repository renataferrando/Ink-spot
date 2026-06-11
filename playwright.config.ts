import * as path from "path";
import * as dotenv from "dotenv";
import { defineConfig, devices } from "playwright/test";

// Load .env.local so Supabase keys are available to auth.setup.ts
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const authFile = "playwright/.auth/user.json";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    // dev server runs HTTPS; next start (CI) runs HTTP — override with PLAYWRIGHT_BASE_URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://localhost:3000",
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Runs auth.setup.ts once to seed playwright/.auth/user.json
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // All other tests — reuse the saved Supabase session
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup"],
    },
  ],

  // Dev: detects the running `next dev --experimental-https` server (HTTPS).
  // CI: set PLAYWRIGHT_BASE_URL=http://localhost:3000 and run `npm run build` first,
  //     then Playwright will start `npm start` automatically.
  webServer: {
    command: "npm start",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "https://localhost:3000",
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true,
    timeout: 120_000,
  },
});
