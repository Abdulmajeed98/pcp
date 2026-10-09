import { join } from 'node:path';

import { defineConfig, devices } from '@playwright/test';

import { apiUrl, dashboardUrl, shopperUrl } from './src/platform';

const root = join(__dirname, '..', '..');

// One of the three apps, started with the development server the owner uses.
// Nx's Playwright plugin reads these commands: it starts each app's `serve`
// target itself before the tests, waits until every address answers, and
// stops what it started when they are over. An app that is already running is
// used as it is and left running. `reuseExistingServer` is what lets
// Playwright use a server that it did not start.
function app(project: string, url: string) {
  return {
    name: project,
    command: `pnpm exec nx serve ${project}`,
    cwd: root,
    url,
    reuseExistingServer: true,
    timeout: 120_000,
  };
}

// Run it with `pnpm platform:check`, which first makes sure that the
// development services are running. They are not started from here.
export default defineConfig({
  testDir: './src',
  outputDir: './test-output/results',
  // The tests share one Keycloak session and one set of apps.
  workers: 1,
  fullyParallel: false,
  // One line for each test, and a report to open when one fails.
  reporter: [['list'], ['html', { outputFolder: './test-output/report', open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    app('@pcp/api', `${apiUrl}/v1/status`),
    app('@pcp/shopper', shopperUrl),
    app('@pcp/dashboard', dashboardUrl),
  ],
});
