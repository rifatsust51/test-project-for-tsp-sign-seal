import { defineConfig, devices } from "@playwright/test";

const PORT = 5179;
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * End-to-end tests run the real app in a browser. The external systems — the
 * AAS (Keycloak) SDK and the TSP gateway — are replaced per test by
 * deterministic fakes (see e2e/support), so the suite runs offline.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chrome",
      // Uses the locally installed Google Chrome; set PW_CHANNEL="" to use Playwright's Chromium.
      use: { ...devices["Desktop Chrome"], channel: process.env.PW_CHANNEL ?? "chrome" },
    },
  ],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    // Process env wins over .env files, so the app talks to the fake gateway host.
    env: {
      VITE_TSP_GATEWAY_URL: "https://tsp.e2e.test/gateway",
      VITE_TSP_ADMIN_TOKEN_URL: "https://tsp.e2e.test/admin/token",
      VITE_TSP_ADMIN_USER_ID: "e2e-admin-user",
      VITE_TSP_ADMIN_DIGITAL_IDENTITY_ID: "e2e-admin-identity",
      VITE_AAS_CONFIG_PATH: "aas.json",
    },
  },
});
