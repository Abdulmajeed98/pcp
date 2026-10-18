import { type Browser, expect, type Page } from '@playwright/test';

import { expectPageIn, type Language } from './languages';
import { dashboardUrl, realmUrl } from './platform';

// Keycloak's own screens, as the tests meet them: the login screen and the
// screen that asks for a new password. Each is told apart by its address and
// its form. Their text is in three languages, so a helper here reads it only
// where a test compares it.

// What a Login logs in with at Keycloak's login screen. Neither is printed.
export interface LoginDetails {
  name: string;
  password: string;
}

// The same for a Vendor's Login, with the name of the Vendor behind it, which
// the Vendor portal's frame shows, and its identifier, which the address of
// its page in the Admin console holds.
export interface VendorLoginDetails extends LoginDetails {
  vendorName: string;
  vendorId: string;
}

// Keycloak's login screen.
export async function expectLoginScreen(page: Page): Promise<void> {
  await expect(page.locator('#kc-form-login')).toBeVisible();
  expect(page.url().startsWith(`${realmUrl}/`)).toBe(true);
}

// Keycloak's screen that asks a Login for a new password, before anything
// else, after it logged in with a temporary one. Its address names the
// required action.
export async function expectNewPasswordScreen(page: Page): Promise<void> {
  await expect(page.locator('#kc-passwd-update-form')).toBeVisible();
  const address = new URL(page.url());
  expect(`${address.origin}${address.pathname}`).toBe(
    `${realmUrl}/login-actions/required-action`,
  );
  expect(address.searchParams.get('execution')).toBe('UPDATE_PASSWORD');
}

// Opens the dashboard in a browser of its own, which knows nothing of any
// earlier login, and gives `use` its page once Keycloak's login screen shows.
// The browser is closed afterwards, whatever happens.
export async function atTheLoginScreenInABrowserOfItsOwn<Result>(
  browser: Browser,
  use: (page: Page) => Promise<Result>,
): Promise<Result> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(dashboardUrl);
    await expectLoginScreen(page);
    return await use(page);
  } finally {
    await context.close();
  }
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

// Sets a field of the page Keycloak shows, without Playwright's `fill`, which
// writes what it types into its log, and a failed run prints that log. A
// password set here is therefore never printed.
async function setInThePage(page: Page, field: string, value: string): Promise<void> {
  await page.locator(field).evaluate((input, text) => {
    (input as HTMLInputElement).value = text;
  }, value);
}

interface HowTheNameIsGiven {
  // Typed key by key, as a person types it, so that the theme's script meets
  // it as it meets what a person types. Otherwise it is set in the page.
  typeTheName?: boolean;
}

// Logs in at Keycloak's login screen, which the page shows. The password is
// set in the page, and so is the name unless the test types it. A made-up
// Vendor's login phone number is typed where the theme's script is what a
// test checks. Playwright may then write it into its log, which is no harm
// for a number that is made up and that nothing is ever sent to.
export async function submitTheLoginScreen(
  page: Page,
  login: LoginDetails,
  { typeTheName = false }: HowTheNameIsGiven = {},
): Promise<void> {
  if (typeTheName) {
    await page.locator('#username').pressSequentially(login.name);
  } else {
    await setInThePage(page, '#username', login.name);
  }
  await setInThePage(page, '#password', login.password);
  await page.locator('#kc-login').click();
}

// Gives the screen that asks for a new password a password and its
// confirmation, both set in the page, and sends them. The confirmation is the
// same password unless the test gives another.
export async function submitTheNewPasswordScreen(
  page: Page,
  password: string,
  confirmation = password,
): Promise<void> {
  await setInThePage(page, '#password-new', password);
  await setInThePage(page, '#password-confirm', confirmation);
  await page.locator('#kc-submit').click();
}

// Sends a form of Keycloak's with `send` and expects it refused: Keycloak
// answers the form at `action`, under the realm's `login-actions`, with a
// page of its own, rather than sending the browser on. It gives back the
// error the page then shows, which is found by `error`.
async function expectRefused(
  page: Page,
  action: string,
  send: () => Promise<void>,
  error: string,
): Promise<string> {
  const answered = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().startsWith(`${realmUrl}/login-actions/${action}`),
  );
  await send();

  expect((await answered).status()).toBe(200);
  const shown = page.locator(error);
  await expect(shown).toBeVisible();
  return (await shown.innerText()).trim();
}

// Logs in at the login screen and expects the login refused. The login
// screen shows again, with its error under the name field, which is given
// back.
export async function expectTheLoginScreenToRefuse(
  page: Page,
  login: LoginDetails,
): Promise<string> {
  const error = await expectRefused(
    page,
    'authenticate',
    () => submitTheLoginScreen(page, login),
    '#input-error-username',
  );
  await expectLoginScreen(page);
  return error;
}

// Sends a new password and its confirmation, and expects them refused. The
// same screen shows again, with its error, which is given back: a refusal by
// the password policy in the alert above the form, a missing or unmatched
// password under its field.
export async function expectTheNewPasswordScreenToRefuse(
  page: Page,
  password: string,
  confirmation = password,
): Promise<string> {
  const error = await expectRefused(
    page,
    'required-action',
    () => submitTheNewPasswordScreen(page, password, confirmation),
    '.pf-v5-c-alert.pf-m-danger .kc-feedback-text, [id^=input-error-password]',
  );
  await expectNewPasswordScreen(page);
  return error;
}
