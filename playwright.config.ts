import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'test-reports/html-report', open: 'never' }],
    ['json', { outputFile: 'test-reports/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://alleato-project-manager.vercel.app',
    screenshot: 'on',
    trace: 'on-first-retry',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  outputDir: 'test-reports/test-results',
});
