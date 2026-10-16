import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 2,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'https://loja.andaimeazul.example',
    ignoreHTTPSErrors: true,
    headless: true,
    trace: 'off',
    screenshot: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
