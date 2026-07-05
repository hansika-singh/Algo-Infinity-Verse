import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: '',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: '',
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: '4000',
      SESSION_SECRET: 'dev-session-secret-must-be-long-and-random-32-chars',
      PASSWORD_PEPPER: 'dev-password-pepper-must-be-long-and-random-32-chars',
    },
  },
});
