import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/unit/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'data-tests',
      testMatch: '**/fetchData.spec.ts',
    },
    {
      name: 'ui-tests',
      testIgnore: '**/fetchData.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-tests'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
