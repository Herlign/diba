import { defineConfig, devices } from "@playwright/test"

const chrome = process.env.CHROME_PATH || "/usr/bin/google-chrome"

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4317",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: {
      executablePath: chrome,
      args: ["--no-sandbox", "--disable-gpu"],
    },
  },
})
