import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

import { expect, type Locator, type Page } from '@playwright/test';

import {
  expectLoginScreen,
  type LoginDetails,
  submitTheLoginScreen,
  type VendorLoginDetails,
} from './keycloak-screens';
import { apiUrl, dashboardUrl } from './platform';

// The login `pnpm services:up` creates: the development Admin, with the
// `admin` role. Its name and password are in `.env` at the repository root,
// and are never printed. A test that needs a Vendor makes a made-up one, and
// logs in as it through its first login (see vendors.ts).
const settings = parseEnv(readFileSync(join(__dirname, '..', '..', '..', '.env'), 'utf8'));

export const developmentAdmin: LoginDetails = {
  name: settings.DEVELOPMENT_ADMIN_NAME ?? '',
  password: settings.DEVELOPMENT_ADMIN_PASSWORD ?? '',
};

// Opens the dashboard as someone who is not logged in, and logs in at
// Keycloak's login screen the way a person does, as the development Admin
// unless the test names another Login, such as a made-up Vendor's after its
// first login. The dashboard is opened at its first address unless the test
// names another, such as a screen's.
export async function logInToTheDashboard(
  page: Page,
  login: LoginDetails = developmentAdmin,
  address = dashboardUrl,
): Promise<void> {
  await page.goto(address);
  await expectLoginScreen(page);

  await submitTheLoginScreen(page, login);

  await page.waitForURL(`${dashboardUrl}/**`);
}

// The Vendor's name, as the Vendor portal's frame shows it.
export function vendorNameInTheFrame(page: Page): Locator {
  return page.getByTestId('vendor-name');
}

// Logs in as a Login that has logged in before, and waits until the dashboard
// shows who it is for: the Vendor portal's frame the name of the Vendor
// behind a Vendor's Login, and the Admin console the name the API says the
// caller has. The page is then drawn whole, in whichever half and language it
// chose.
export async function openTheDashboardAs(
  page: Page,
  login: LoginDetails | VendorLoginDetails,
  address = dashboardUrl,
): Promise<void> {
  await logInToTheDashboard(page, login, address);
  if ('vendorName' in login) {
    await expect(vendorNameInTheFrame(page)).toHaveText(login.vendorName);
  } else {
    await expect(page.getByTestId('caller-name')).toHaveText(login.name);
  }
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
