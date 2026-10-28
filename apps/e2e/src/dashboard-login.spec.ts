import { expect, type Response, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { catalogHeading } from './catalog';
import {
  developmentAdmin,
  logInToTheDashboard,
  vendorNameInTheFrame,
} from './development-logins';
import { expectTheEmptyState } from './empty-state';
import { atTheLoginScreenInABrowserOfItsOwn, expectLoginScreen } from './keycloak-screens';
import { apiUrl, dashboardUrl, realmUrl } from './platform';
import { createAMadeUpVendorAsTheAdmin, logInForTheFirstTime } from './vendors';

const callerEndpoint = `${apiUrl}/v1/caller`;

function isCallOfTheCallerEndpoint(response: Response): boolean {
  return response.url() === callerEndpoint && response.request().method() === 'GET';
}

// The Admin console is the half a login with the role admin gets, so the
// Catalog showing is what the role decided.
test("the Admin logs in: the dashboard sends them to Keycloak, and then opens the Admin console's Catalog with the name the API says the caller has", async ({
  page,
}) => {
  await logInToTheDashboard(page);

  await expect(page.getByTestId('caller-name')).toHaveText(developmentAdmin.name);
  await expect(catalogHeading(page)).toBeVisible();
});

// A made-up Vendor logs in through its first login, as a real Vendor does.
// The Vendor portal asks the API for the Caller's Vendor, and its frame
// shows that Vendor's name, not the Login's, which is its login phone number.
test("a made-up Vendor logs in: the Vendor portal's frame shows the name of the Vendor the API says is the caller's", async ({
  browser,
  page,
  request,
}) => {
  const vendor = await createAMadeUpVendorAsTheAdmin(page, request);

  await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
    await logInForTheFirstTime(vendorsPage, vendor);

    await expect(vendorNameInTheFrame(vendorsPage)).toHaveText(vendor.name);
  });
});

test("the API was asked: the dashboard's call carried a token, and the name on the page is the name in the answer", async ({
  page,
}) => {
  const answered = page.waitForResponse(isCallOfTheCallerEndpoint);
  await logInToTheDashboard(page);
  const response = await answered;

  expect(response.status()).toBe(200);
  expect(response.request().headers().authorization).toMatch(/^Bearer \S+$/);
  const { loginName } = (await response.json()) as { loginName: string };
  await expect(page.getByTestId('caller-name')).toHaveText(loginName);
});

// The login could not be completed when Keycloak's answer to the dashboard's
// last step of it never arrives. The screen is the dashboard's empty state,
// on the Sheet with no frame, since nobody is known yet, and its Try again
// starts the login again.
test('a login that could not be completed says so as the empty state, and Try again starts the login again, which then opens the Admin console', async ({
  page,
}) => {
  const tokenEndpoint = `${realmUrl}/protocol/openid-connect/token`;
  await page.route(tokenEndpoint, (route) => route.abort());
  await logInToTheDashboard(page);

  const message = page.getByTestId('login-failed');
  await expect(message).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    await message.innerText(),
  );
  await expectTheEmptyState(
    page.getByRole('main'),
    page.getByRole('heading', { level: 1 }),
  );
  await expectAccessible(page);

  const tryAgain = page.getByRole('button', { name: 'Try again' });
  const startedAgain = page.waitForRequest((request) =>
    request.url().startsWith(`${realmUrl}/protocol/openid-connect/auth`),
  );
  await tryAgain.click();
  await startedAgain;
  await expect(message).toBeVisible();

  await page.unroute(tokenEndpoint);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByTestId('caller-name')).toHaveText(developmentAdmin.name);
  await expect(catalogHeading(page)).toBeVisible();
});

test('the endpoint is not simply open: the same request without a token is answered 401', async ({
  request,
}) => {
  const response = await request.get(callerEndpoint);

  expect(response.status()).toBe(401);
});

test('a reload keeps the login: the caller is shown again and no login screen is', async ({
  page,
}) => {
  await logInToTheDashboard(page);
  await expect(page.getByTestId('caller-name')).toHaveText(developmentAdmin.name);

  // Keycloak answers a login request with a page when it has to ask who is
  // there, and by sending the browser straight back when it already knows.
  const loginScreens: string[] = [];
  page.on('response', (response) => {
    const asksWhoIsThere =
      response.url().startsWith(`${realmUrl}/`) && response.status() === 200;
    if (asksWhoIsThere && response.request().isNavigationRequest()) {
      loginScreens.push(response.url());
    }
  });
  const answered = page.waitForResponse(isCallOfTheCallerEndpoint);
  await page.reload();
  await answered;

  await expect(page.getByTestId('caller-name')).toHaveText(developmentAdmin.name);
  expect(loginScreens).toEqual([]);
});

test("the login is kept in memory: after it, the browser's storage holds no token", async ({
  page,
}) => {
  const answered = page.waitForResponse(isCallOfTheCallerEndpoint);
  await logInToTheDashboard(page);
  const token = (await answered).request().headers().authorization.replace('Bearer ', '');

  const stored = await page.evaluate(() => [
    ...Object.values({ ...localStorage }),
    ...Object.values({ ...sessionStorage }),
  ]);

  expect(token.split('.')).toHaveLength(3);
  // No stored value is the token, and none is any token: every token Keycloak
  // issues starts with the same letters, which spell the opening of its header.
  expect(stored.filter((value) => value.includes(token) || value.includes('eyJ'))).toEqual(
    [],
  );
});

test('logging out ends it: the next visit to the dashboard arrives at the login screen', async ({
  page,
}) => {
  await logInToTheDashboard(page);
  await expect(page.getByTestId('caller-name')).toHaveText(developmentAdmin.name);

  await page.getByRole('button', { name: 'Log out' }).click();
  await expectLoginScreen(page);

  await page.goto(dashboardUrl);
  await expectLoginScreen(page);
});
