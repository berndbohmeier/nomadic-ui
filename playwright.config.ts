import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:1420",
    locale: "en-US",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev --host 127.0.0.1 --port 1420 --strictPort",
    url: "http://127.0.0.1:1420",
    env: { VITE_BACKEND: "mock" },
    reuseExistingServer: false,
  },
});
