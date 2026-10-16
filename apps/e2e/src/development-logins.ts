import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

import { expect, type Page } from '@playwright/test';

import { expectPageIn, type Language } from './languages';
import { apiUrl, dashboardUrl, realmUrl } from './platform';

// The login `pnpm services:up` creates: the development Admin, with the
// `admin` role. Its name and password are in `.env` at the repository root,
// and are never printed. A test that needs a Vendor makes a made-up one, and
// logs in as it through its first login (see vendors.ts).
const settings = parseEnv(readFileSync(join(__dirname, '..', '..', '..', '.env'), 'utf8'));

// What a Login logs in with at Keycloak's login screen.
export interface LoginDetails {
  name: string;
  password: string;
}

export const developmentAdmin: LoginDetails = {
  name: settings.DEVELOPMENT_ADMIN_NAME ?? '',
  password: settings.DEVELOPMENT_ADMIN_PASSWORD ?? '',
};

// Keycloak's login screen, told apart by its address and its form. The
// screen's own text is in three languages, so it is not read.
export async function expectLoginScreen(page: Page): Promise<void> {
  await expect(page.locator('#kc-form-login')).toBeVisible();
  expect(page.url().startsWith(`${realmUrl}/`)).toBe(true);
}

// Chooses a language with the select Keycloak's screens show, which opens
// the same screen again in that language. Each of its options is the
// screen's address with the language's tag in `kc_locale`. A choice made
// there holds for the next screens in the same browser.
export async function chooseKeycloaksLanguage(
  page: Page,
  language: Language,
): Promise<void> {
  const select = page.locator('#login-select-toggle');
  const addresses = await select
    .locator('option')
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  const address = addresses.find(
    (each) => new URL(each, page.url()).searchParams.get('kc_locale') === language.tag,
  );
  expect(address, `the select offers ${language.name}`).toBeDefined();

  await select.selectOption(address ?? '');
  await page.waitForURL((url) => url.searchParams.get('kc_locale') === language.tag);
  await expectPageIn(page, language);
}

// Keycloak's screen that asks a Login for a new password, before anything
// else, after it logged in with a temporary one. It is told apart by its
// address, which names the required action, and by its form.
export async function expectNewPasswordScreen(page: Page): Promise<void> {
  await expect(page.locator('#kc-passwd-update-form')).toBeVisible();
  const address = new URL(page.url());
  expect(`${address.origin}${address.pathname}`).toBe(
    `${realmUrl}/login-actions/required-action`,
  );
  expect(address.searchParams.get('execution')).toBe('UPDATE_PASSWORD');
}

// Sets a field of the page Keycloak shows, without Playwright's `fill`, which
// writes what it types into its log, and a failed run prints that log. A
// password set here is therefore never printed.
async function setInThePage(page: Page, field: string, value: string): Promise<void> {
  await page.locator(field).evaluate((input, text) => {
    (input as HTMLInputElement).value = text;
  }, value);
}

// How the name reaches the login screen's name field: set in the page, or
// typed key by key, as a person types it, so that the theme's script meets
// it as it meets what a person types.
type NameEntry = 'set' | 'typed';

// Logs in at Keycloak's login screen, which the page shows, with a name and a
// password that must not be printed, such as a made-up Vendor's login phone
// number and temporary password. The password is set in the page, and so is
// the name unless it is typed. A made-up Vendor's login phone number is typed
// where the theme's script is what a test checks. Playwright may then write
// it into its log, which is no harm for a number that is made up and that
// nothing is ever sent to.
export async function submitTheLoginScreen(
  page: Page,
  name: string,
  password: string,
  nameEntry: NameEntry = 'set',
): Promise<void> {
  if (nameEntry === 'typed') {
    await page.locator('#username').pressSequentially(name);
  } else {
    await setInThePage(page, '#username', name);
  }
  await setInThePage(page, '#password', password);
  await page.locator('#kc-login').click();
}

// Gives the screen that asks for a new password the same password in both of
// its fields, set in the page, and sends it.
export async function submitTheNewPasswordScreen(
  page: Page,
  password: string,
): Promise<void> {
  await setInThePage(page, '#password-new', password);
  await setInThePage(page, '#password-confirm', password);
  await page.locator('#kc-submit').click();
}

// The Vendor portal, which a Login that is not the Admin's gets. It is told
// apart from the Admin console by its frame.
export async function expectTheVendorPortal(page: Page): Promise<void> {
  await page.waitForURL(`${dashboardUrl}/**`);
  await expect(page.getByTestId('frame')).toBeVisible();
}

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

  await submitTheLoginScreen(page, login.name, login.password);

  await page.waitForURL(`${dashboardUrl}/**`);
}

// Logs in as a Login that has logged in before, and waits until the dashboard
// shows who the API says the caller is. The page is then drawn whole, in
// whichever half and language it chose.
export async function openTheDashboardAs(
  page: Page,
  login: LoginDetails,
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
