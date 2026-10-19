import { type Browser, expect, type Locator, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { detailRow, findOnTheList, openTheVendorsPage, rowOfVendor } from './admin-vendors';
import {
  logInToTheDashboard,
  openTheDashboardAs,
  vendorNameInTheFrame,
} from './development-logins';
import {
  atTheLoginScreenInABrowserOfItsOwn,
  expectLoginScreen,
  expectTheLoginScreenToRefuse,
  submitTheLoginScreen,
  type VendorLoginDetails,
} from './keycloak-screens';
import {
  buttonFor,
  expectNoSidewaysScroll,
  type Language,
  languages,
  narrowWindow,
} from './languages';
import { apiUrl, realmUrl } from './platform';
import { aMadeUpVendorThatHasLoggedIn } from './vendors';

const [kurdish, , english] = languages;

// The Admin deactivates and reactivates a Vendor on a phone, in its shop or
// elsewhere (LANG-8). The lines run in order, on one made-up Vendor, which
// has been through its first login, as a real Vendor has: deactivated, then
// reactivated.
test.use({ viewport: narrowWindow });
test.describe.configure({ mode: 'serial' });

let vendor: VendorLoginDetails;

test.beforeAll(async ({ browser }) => {
  vendor = await aMadeUpVendorThatHasLoggedIn(browser);
});

// The confirmation the Admin is asked for before a deactivation.
function theConfirmation(page: Page): Locator {
  return page.getByRole('alertdialog');
}

// The plain message a deactivated Vendor sees in place of its portal.
function theDeactivatedMessage(page: Page): Locator {
  return page.getByTestId('vendor-deactivated');
}

// Gives the page the API's answer for a deactivation while Keycloak cannot be
// reached, once, for the next deactivation it asks for. The tests cannot
// pause the development services' Keycloak, which other tests share.
async function answerTheNextDeactivationAsUnavailable(page: Page): Promise<void> {
  await page.route(
    `${apiUrl}/v1/vendors/${vendor.vendorId}/deactivate`,
    (route) =>
      route.fulfill({
        status: 503,
        json: {
          errors: [
            {
              code: 'IDENTITY_SERVICE_UNAVAILABLE',
              title: 'identity_service_unavailable_title',
              detail: 'identity_service_unavailable_details',
            },
          ],
        },
      }),
    { times: 1 },
  );
}

// A Vendor's page shows its actions in two groups below its name, each on
// rows of its own: Edit and Open its portal, then the actions that log the
// Vendor out or let it back in, which the test names in their order.
async function expectTheActionsInTwoGroups(page: Page, second: string[]): Promise<void> {
  const top = async (name: string) =>
    (await page.getByRole('main').getByText(name, { exact: true }).boundingBox())!.y;
  const edit = await top('Edit');
  expect(await top('Open its portal')).toBe(edit);
  const tops = await Promise.all(second.map(top));
  expect(new Set(tops).size).toBe(1);
  expect(tops[0]).toBeGreaterThan(edit);
}

// Logs in as the Vendor in a browser of its own, which knows nothing of any
// earlier login, and hands `use` its page at the details screen.
async function inTheVendorsOwnBrowser(
  browser: Browser,
  use: (page: Page) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext({ viewport: narrowWindow });
  try {
    const page = await context.newPage();
    await openTheDashboardAs(page, vendor);
    await use(page);
  } finally {
    await context.close();
  }
}

test("the Admin deactivates the Vendor, after confirming, while its portal is open in another browser, once more after a refusal that the confirmation says and stays open for, and the Vendor's next action there shows a plain message, different in Kurdish and English", async ({
  browser,
  page,
}) => {
  await inTheVendorsOwnBrowser(browser, async (vendorsPage) => {
    await vendorsPage.getByRole('main').locator('a[href$="/contact-details"]').click();
    await expect(vendorsPage.locator('#contact-details-address')).toBeVisible();

    await openTheVendorsPage(page, vendor);
    await page.getByRole('button', { name: 'Deactivate' }).click();
    await expect(theConfirmation(page)).toBeVisible();
    await expectAccessible(page);
    await answerTheNextDeactivationAsUnavailable(page);
    await theConfirmation(page).getByRole('button', { name: 'Deactivate' }).click();
    await expect(theConfirmation(page).getByRole('alert')).toContainText(
      'IDENTITY_SERVICE_UNAVAILABLE',
    );
    await expectAccessible(page);
    await theConfirmation(page).getByRole('button', { name: 'Deactivate' }).click();
    await expect(theConfirmation(page)).toHaveCount(0);
    await expect(detailRow(page, 'state')).toContainText('Deactivated');
    await expect(page.getByRole('button', { name: 'Reactivate' })).toBeVisible();

    // The Vendor's next action: it saves its contact details.
    await vendorsPage.getByRole('main').locator('form button[type="submit"]').click();

    await expect(theDeactivatedMessage(vendorsPage)).toBeVisible();
    await expect(vendorsPage.getByRole('main').locator('form')).toHaveCount(0);
    await expect(vendorNameInTheFrame(vendorsPage)).toHaveCount(0);
    await expect(vendorsPage.getByTestId('log-out')).toBeVisible();
    await expect(vendorsPage.getByRole('link')).toHaveCount(0);
    const messages = new Map<Language, string>();
    for (const language of [kurdish, english]) {
      await buttonFor(vendorsPage, language).click();
      messages.set(language, await theDeactivatedMessage(vendorsPage).innerText());
    }
    expect(messages.get(kurdish)).not.toBe(messages.get(english));
    await expectNoSidewaysScroll(vendorsPage);
    await expectAccessible(vendorsPage);
  });
});

// Keycloak tells a disabled Login, given its right password, that it is
// disabled, in an alert above the form, and a wrong password that it is
// wrong, under the name field, as for any Login.
test("logging in as the deactivated Vendor is refused at Keycloak's login screen, which says so, unlike a wrong password", async ({
  browser,
}) => {
  await atTheLoginScreenInABrowserOfItsOwn(browser, async (page) => {
    const wrongPassword = await expectTheLoginScreenToRefuse(page, {
      ...vendor,
      password: 'not-the-password',
    });

    const answered = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().startsWith(`${realmUrl}/login-actions/authenticate`),
    );
    await submitTheLoginScreen(page, vendor);

    expect((await answered).status()).toBe(200);
    await expectLoginScreen(page);
    const disabled = page.locator('.pf-v5-c-alert.pf-m-danger .kc-feedback-text');
    await expect(disabled).toBeVisible();
    expect((await disabled.innerText()).trim()).not.toBe(wrongPassword);
  });
});

test("the list and the Vendor's page mark the Vendor deactivated, and so does the band when the Admin acts as it", async ({
  page,
}) => {
  await logInToTheDashboard(page);

  expect(await findOnTheList(page, [vendor.vendorName])).toEqual([vendor.vendorName]);
  await expect(rowOfVendor(page, vendor.vendorName)).toContainText('Deactivated');

  await rowOfVendor(page, vendor.vendorName)
    .getByRole('link', { name: vendor.vendorName })
    .click();
  await expect(detailRow(page, 'state')).toContainText('Deactivated');

  await page.getByRole('link', { name: 'Open its portal' }).click();
  await expect(vendorNameInTheFrame(page)).toHaveText(vendor.vendorName);
  await expect(page.getByTestId('acting-band-deactivated')).toBeVisible();
});

// A deactivation that failed halfway, after the Vendor was marked, is
// finished by doing it again. The page cannot tell such a Vendor from one
// deactivated in full, so every deactivated Vendor's page has the way to do
// it again, after Reactivate, which is what such a page is mostly for.
test("the deactivated Vendor's page has a way to deactivate it again, after Reactivate, and the Vendor stays deactivated", async ({
  page,
}) => {
  await openTheVendorsPage(page, vendor);
  const actions = page.getByRole('button', { name: /^(Reactivate|Deactivate again)$/ });
  await expect(actions).toHaveText(['Reactivate', 'Deactivate again']);
  await expectTheActionsInTwoGroups(page, ['Reset the password', 'Reactivate']);

  await page.getByRole('button', { name: 'Deactivate again' }).click();
  await expect(theConfirmation(page)).toBeVisible();
  await expectAccessible(page);
  await theConfirmation(page).getByRole('button', { name: 'Deactivate again' }).click();

  await expect(theConfirmation(page)).toHaveCount(0);
  await expect(detailRow(page, 'state')).toContainText('Deactivated');
  await expect(actions).toHaveText(['Reactivate', 'Deactivate again']);
});

test('the Admin reactivates the Vendor, after confirming, which cancelling does not, and it logs in with the password it had', async ({
  browser,
  page,
}) => {
  await openTheVendorsPage(page, vendor);

  await page.getByRole('button', { name: 'Reactivate' }).click();
  await expect(theConfirmation(page)).toBeVisible();
  await theConfirmation(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(theConfirmation(page)).toHaveCount(0);
  await expect(detailRow(page, 'state')).toContainText('Deactivated');

  await page.getByRole('button', { name: 'Reactivate' }).click();
  await expect(theConfirmation(page)).toBeVisible();
  await expectAccessible(page);
  await theConfirmation(page).getByRole('button', { name: 'Reactivate' }).click();

  await expect(theConfirmation(page)).toHaveCount(0);
  await expect(detailRow(page, 'state')).toContainText('Active');
  await expect(page.getByRole('button', { name: 'Deactivate' })).toBeVisible();
  await expectTheActionsInTwoGroups(page, ['Reset the password', 'Deactivate']);
  await inTheVendorsOwnBrowser(browser, async (vendorsPage) => {
    await expect(vendorNameInTheFrame(vendorsPage)).toHaveText(vendor.vendorName);
    await expect(theDeactivatedMessage(vendorsPage)).toHaveCount(0);
  });
});
