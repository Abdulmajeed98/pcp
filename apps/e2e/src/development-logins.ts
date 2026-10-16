import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

import { expect, type Page } from '@playwright/test';

import { apiUrl, dashboardUrl, realmUrl } from './platform';

// The two logins `pnpm services:up` creates: the development Admin, with the
// `admin` role, and the development Vendor, with the `vendor` role. Their
// names and passwords are in `.env` at the repository root, and are never
// printed.
const settings = parseEnv(readFileSync(join(__dirname, '..', '..', '..', '.env'), 'utf8'));

export interface DevelopmentLogin {
  name: string;
  password: string;
}

export const developmentAdmin: DevelopmentLogin = {
  name: settings.DEVELOPMENT_ADMIN_NAME ?? '',
  password: settings.DEVELOPMENT_ADMIN_PASSWORD ?? '',
};

export const developmentVendor: DevelopmentLogin = {
  name: settings.DEVELOPMENT_VENDOR_NAME ?? '',
  password: settings.DEVELOPMENT_VENDOR_PASSWORD ?? '',
};

// Keycloak's login screen, told apart by its address and its form. The
// screen's own text is in three languages, so it is not read.
export async function expectLoginScreen(page: Page): Promise<void> {
  await expect(page.locator('#kc-form-login')).toBeVisible();
  expect(page.url().startsWith(`${realmUrl}/`)).toBe(true);
}

// Opens the dashboard as someone who is not logged in, and logs in at
// Keycloak's login screen the way a person does, as the development Admin
// unless the test names the development Vendor. The dashboard is opened at
// its first address unless the test names another, such as a screen's.
export async function logInToTheDashboard(
  page: Page,
  login: DevelopmentLogin = developmentAdmin,
  address = dashboardUrl,
): Promise<void> {
  await page.goto(address);
  await expectLoginScreen(page);

  await page.locator('#username').fill(login.name);
  // Playwright writes what `fill` types into its log, which a failed run
  // prints. The password is therefore set in the page and never typed.
  await page.locator('#password').evaluate((field, password) => {
    (field as HTMLInputElement).value = password;
  }, login.password);
  await page.locator('#kc-login').click();

  await page.waitForURL(`${dashboardUrl}/**`);
}

// Logs in as one of the development logins, and waits until the dashboard
// shows who the API says the caller is. The page is then drawn whole, in
// whichever half and language it chose.
export async function openTheDashboardAs(
  page: Page,
  login: DevelopmentLogin,
  address = dashboardUrl,
): Promise<void> {
  await logInToTheDashboard(page, login, address);
  await expect(page.getByTestId('caller-name')).toHaveText(login.name);
}

// Logs out of the dashboard with its button, and waits for Keycloak's login
// screen. The button's text is in the page's language, so it is found by
// what it is and not by what it says.
export async function logOutOfTheDashboard(page: Page): Promise<void> {
  await page.getByTestId('log-out').click();
  await expectLoginScreen(page);
}

// Logs in to the dashboard as the development Admin, and gives the
// Authorization header the dashboard sends the API, so that a test can call
// the API as the Admin. The dashboard's page asks the API who the caller is,
// and the header is taken from that call.
export async function authorizationOfTheDevelopmentAdmin(page: Page): Promise<string> {
  const called = page.waitForRequest(
    (request) => request.url() === `${apiUrl}/v1/caller` && request.method() === 'GET',
  );
  await logInToTheDashboard(page);

  const authorization = (await called).headers().authorization;
  expect(authorization).toMatch(/^Bearer \S+$/);
  return authorization;
}
