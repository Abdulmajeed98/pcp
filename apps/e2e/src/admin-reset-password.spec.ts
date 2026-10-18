import { expect, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { vendorPageUrl } from './admin-vendors';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { loginOfTheMessage, temporaryPassword, theHandOver } from './hand-over';
import {
  atTheLoginScreenInABrowserOfItsOwn,
  expectNewPasswordScreen,
  expectTheLoginScreenToRefuse,
  submitTheLoginScreen,
  type VendorLoginDetails,
} from './keycloak-screens';
import { expectNoSidewaysScroll, languages, narrowWindow } from './languages';
import { aMadeUpVendorThatHasLoggedIn, expectTheVendorPortal } from './vendors';

// The Admin resets a Vendor's password on a phone, in the Vendor's own place
// or wherever the Vendor calls from (LANG-8).
test.use({ viewport: narrowWindow });

// A made-up Vendor of the test's own, which has been through its first login
// and chosen its own password, as a Vendor has that forgot it. Each test
// changes the Vendor's password, or tries to, so each has its own Vendor.
let vendor: VendorLoginDetails;

test.beforeEach(async ({ browser, page }) => {
  vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  await authorizationOfTheDevelopmentAdmin(page);
  await page.goto(vendorPageUrl(vendor.vendorId));
  await expect(
    page.getByRole('heading', { level: 1, name: vendor.vendorName }),
  ).toBeVisible();
});

// The confirmation the Vendor's page asks for before a reset.
function confirmation(page: Page) {
  return page.getByRole('alertdialog', { name: /Reset the password/ });
}

// Asks for a reset from the Vendor's page, which asks to confirm first.
async function askForAReset(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Reset the password' }).click();
  await expect(confirmation(page)).toBeVisible();
}

// Resets the Vendor's password from its page, confirming it, and gives back
// the new temporary password the page then shows.
async function resetThePassword(page: Page): Promise<string> {
  await askForAReset(page);
  await confirmation(page).getByRole('button', { name: 'Reset the password' }).click();
  await expect(confirmation(page)).toHaveCount(0);
  await expect(temporaryPassword(page)).toBeVisible();
  return temporaryPassword(page).innerText();
}

// The password the Kurdish message, the one chosen first, gives the Vendor.
async function passwordOfTheHandOver(page: Page): Promise<string> {
  const { lines } = await theHandOver(page, languages[0]);
  return loginOfTheMessage(lines).password;
}

test('as the development Admin, the Admin resets the password of a made-up Vendor that has chosen its own, and the hand-over’s link holds the new temporary password; a second reset, for a password lost before it was handed over, gives another, which the link then holds instead', async ({
  page,
}) => {
  const first = await resetThePassword(page);

  // Twelve lower-case letters and digits, without 0, o, 1, l and i.
  expect(first).toMatch(/^[a-hjkmnp-z2-9]{12}$/);
  expect(await passwordOfTheHandOver(page)).toBe(first);

  const second = await resetThePassword(page);

  expect(second).toMatch(/^[a-hjkmnp-z2-9]{12}$/);
  expect(second).not.toBe(first);
  await expect(temporaryPassword(page)).toHaveText(second);
  expect(await passwordOfTheHandOver(page)).toBe(second);
});

test('after the reset, the Vendor’s own password no longer logs in, and the new temporary one, as the hand-over gives it, leads to the screen that asks for a new password', async ({
  browser,
  page,
}) => {
  await resetThePassword(page);
  const newPassword = await passwordOfTheHandOver(page);

  await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
    await expectTheLoginScreenToRefuse(vendorsPage, vendor);

    await submitTheLoginScreen(vendorsPage, { name: vendor.name, password: newPassword });
    await expectNewPasswordScreen(vendorsPage);
  });
});

test('cancelling the confirmation resets nothing: no password is shown, and the Vendor’s own password still logs in', async ({
  browser,
  page,
}) => {
  await askForAReset(page);
  await confirmation(page).getByRole('button', { name: 'Cancel' }).click();

  await expect(confirmation(page)).toHaveCount(0);
  await expect(temporaryPassword(page)).toHaveCount(0);
  await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
    await submitTheLoginScreen(vendorsPage, vendor);
    await expectTheVendorPortal(vendorsPage);
  });
});

test('the confirmation does not scroll sideways, and meets the automated part of WCAG 2.2 level AA in light and in dark', async ({
  page,
}) => {
  await askForAReset(page);

  await expectNoSidewaysScroll(page);
  await expectAccessible(page);
});
