import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 40000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /global\.setup\.ts/,
    },
  ],
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
});
