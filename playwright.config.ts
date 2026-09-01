import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.DAMUI_BASE_URL || 'https://daui.34.36.111.7.nip.io';
const headless = process.env.DAMUI_HEADLESS !== 'false';
const slowMo = Number(process.env.DAMUI_SLOW_MO_MS || 0);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }]
  ],
  use: {
    baseURL,
    headless,
    launchOptions: {
      slowMo
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  outputDir: 'test-results',
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.spec\.ts/
    },
    {
      name: 'chromium',
      testIgnore: /.*\.setup\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth/admin.storageState.json'
      },
      dependencies: ['setup']
    }
  ]
});
