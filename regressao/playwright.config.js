'use strict';

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: 'list',
  use: {
    headless: true,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'v1',
      use: { baseURL: 'http://127.0.0.1:3001' },
    },
    {
      name: 'v2',
      use: { baseURL: 'http://127.0.0.1:3002' },
    },
  ],
  webServer: [
    {
      command: 'node ../server.js v1',
      url: 'http://127.0.0.1:3001/api/versao',
      env: { HOJE: '2026-10-19' },
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: 'node ../server.js v2',
      url: 'http://127.0.0.1:3002/api/versao',
      env: { HOJE: '2026-10-19' },
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
