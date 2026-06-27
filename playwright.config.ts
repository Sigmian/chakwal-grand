import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir:   "./e2e",
  timeout:   60_000,           // next dev JIT-compiles pages on first hit; needs headroom
  retries:   process.env.CI ? 2 : 1,
  workers:   1,                // single worker avoids overloading the dev server
  reporter:  [["html", { open: "never" }], ["line"]],
  fullyParallel: false,

  use: {
    baseURL:          process.env.BASE_URL ?? "http://localhost:3000",
    trace:            "retain-on-failure",
    screenshot:       "only-on-failure",
    video:            "retain-on-failure",
    navigationTimeout: 90_000,
    actionTimeout:    30_000,
    launchOptions: {
      args: [
        "--disable-gpu",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    },
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile",   use: { ...devices["iPhone 13"] } },
  ],

  webServer: {
    command: "npm run start",
    url:     "http://localhost:3000",
    reuseExistingServer: true,   // reuse the already-running production server
    timeout: 30_000,
  },
});
