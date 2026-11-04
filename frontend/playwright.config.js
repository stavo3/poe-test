// Playwright end-to-end (integration) tests: they drive a real browser against the
// full containerised stack (nginx -> API -> MongoDB), so they exercise the frontend,
// the API and the database together.
//   Local:  docker compose up --build -d && docker compose run --rm api npm run seed
//           cd frontend && npm run test:e2e
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 7_500 },
  fullyParallel: false, // the tests share seeded demo data, so run them in order
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'on', // screenshots double as submission evidence
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
