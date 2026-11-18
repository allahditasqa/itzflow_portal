// Main Playwright settings file.
import { defineConfig, devices } from '@playwright/test';
import { ENV } from './config/env';

export default defineConfig({
  testDir: './tests', // tests are discovered in this folder
  timeout: 60_000, // one test takes 60 sec at most (the app can be slow)
  workers: 2, // too many parallel logins slow the server down
  expect: { timeout: 7_000 }, // an assertion waits 7 sec at most
  fullyParallel: true, // tests run in parallel
  retries: 0, // no retries: on a live app a retry hides flaky tests/lockout and slows the run
  reporter: [
    ['list'], // terminal
    ['html', { open: 'never' }], // online report (playwright-report/, opened through a server)
    ['./reporters/offline-report.ts', { outputDir: 'reports' }], // a separate offline report for every module/sub-module (reports/<module>/<sub> test report.html) + reports/index.html
  ],
  use: {
    baseURL: ENV.baseURL, // page.goto('/login') = BASE_URL + /login
    trace: 'off', // trace/video off (faster run). For debugging: npx playwright test -g "TC_X" --trace on
    screenshot: 'on', // a screenshot of every test in the report
    video: 'off',
    // With SLOWMO=300 every step pauses for 300ms (to watch in headed mode)
    launchOptions: { slowMo: Number(process.env.SLOWMO ?? 0) },
  },
  projects: [
    // 1) Logs in once and saves the session
    { name: 'setup', testMatch: /setup\/auth\.setup\.ts/ },
    // 2) tests/auth/*: without a session (login, sign out)
    {
      name: 'auth',
      testMatch: /auth\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: { cookies: [], origins: [] },
      },
    },
    // 3) All other feature folders (workspace, project, my-work ...): with the saved session, read-only
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /(auth|setup)\//, // all other modules (no config change needed when a new module is added)
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: '.auth/user.json' },
    },
  ],
});
