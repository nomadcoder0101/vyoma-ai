import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100",
    extraHTTPHeaders: {
      "x-vyoma-e2e-token": process.env.E2E_TEST_TOKEN || "local-e2e-token",
      "x-vyoma-test-email": process.env.CLERK_TEST_EMAIL || "test@vyomaai.in",
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx.cmd next dev -p 3100",
    env: {
      ...process.env,
      E2E_TEST_MODE: "true",
      E2E_TEST_TOKEN: process.env.E2E_TEST_TOKEN || "local-e2e-token",
    },
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
