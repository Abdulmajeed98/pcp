import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

import { expect, type Page } from '@playwright/test';

import { dashboardUrl, realmUrl } from './platform';

// The development Admin is the one login `pnpm services:up` creates. Its name
// and password are in `.env` at the repository root, and are never printed.
const settings = parseEnv(readFileSync(join(__dirname, '..', '..', '..', '.env'), 'utf8'));

export const developmentAdmin = {
  name: settings.DEVELOPMENT_ADMIN_NAME ?? '',
  password: settings.DEVELOPMENT_ADMIN_PASSWORD ?? '',
};

// Keycloak's login screen, told apart by its address and its form. The
// screen's own text is in three languages, so it is not read.
export async function expectLoginScreen(page: Page): Promise<void> {
  await expect(page.locator('#kc-form-login')).toBeVisible();
  expect(page.url().startsWith(`${realmUrl}/`)).toBe(true);
}

// Opens the dashboard as someone who is not logged in, and logs in at
// Keycloak's login screen the way the Admin does.
export async function logInToTheDashboard(page: Page): Promise<void> {
  await page.goto(dashboardUrl);
  await expectLoginScreen(page);

  await page.locator('#username').fill(developmentAdmin.name);
  await page.locator('#password').fill(developmentAdmin.password);
  await page.locator('#kc-login').click();

  await page.waitForURL(`${dashboardUrl}/**`);
}
