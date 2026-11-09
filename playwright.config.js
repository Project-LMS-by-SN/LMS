import { defineConfig, devices } from '@playwright/test';

// Automatically apply comfortable slow-motion (600ms) when watching in headed mode
const isHeaded = process.argv.includes('--headed');
const defaultSlowMo = isHeaded ? 600 : 0;
const slowMo = process.env.SLOWMO ? parseInt(process.env.SLOWMO, 10) : defaultSlowMo;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    launchOptions: {
      slowMo,
    },
  },
  webServer: {
    command: 'npm --prefix frontend run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
