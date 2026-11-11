import { defineConfig, devices } from "@playwright/test";

// If your machine already has Playwright browsers installed, nothing else is needed.
// Set PW_CHROMIUM_PATH only if you want to use a specific Chromium binary.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
const port = Number(process.env.PORT || 3100);

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "e2e-results.json" }]],
  use: { baseURL: `http://127.0.0.1:${port}`, trace: "off", launchOptions: { executablePath } },
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
    timeout: 240_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
