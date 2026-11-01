import { expect, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { openTheVendorsPage } from './admin-vendors';
import { loginOfTheMessage, temporaryPassword, theHandOver } from './hand-over';
import {
  atTheLoginScreenInABrowserOfItsOwn,
  expectNewPasswordScreen,
  expectTheLoginScreenToRefuse,
  submitTheLoginScreen,
  type VendorLoginDetails,
} from './keycloak-screens';
import { expectNoSidewaysScroll, languages, narrowWindow } from './languages';
import { film, snapsOf } from './motion-film';
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
  await openTheVendorsPage(page, vendor);
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

test('after the reset, the line that says so, the temporary password on a Raised Stone panel and the hand-over arrive below the actions and above the details with no snap, and meet WCAG 2.2 level AA in light and in dark', async ({
  page,
}) => {
  await askForAReset(page);
  // Watched four times slower, as the owner asked them to be watched, and
  // the top of the details below taken frame by frame from the confirmation
  // on.
  const frames = await film(
    page,
    () =>
      document.querySelector('[data-detail="state"]')?.getBoundingClientRect().top ?? null,
    () => confirmation(page).getByRole('button', { name: 'Reset the password' }).click(),
    { forMs: 4000 },
  );
  await expect(temporaryPassword(page)).toBeVisible();

  const done = page.getByTestId('password-reset');
  await expect(done).toContainText('The password is reset, and the Vendor is logged out.');
  // It arrives as a row arrives in a list (DESIGN.md's Motion 8, the No Snap
  // Rule): its space opens, and then it fades in. The details below slide
  // down over many frames, with no snap.
  const transition = await done.evaluate(
    (element) => getComputedStyle(element).transitionProperty,
  );
  expect(transition.split(', ')).toEqual(
    expect.arrayContaining(['grid-template-rows', 'opacity']),
  );
  const tops = frames.map(({ at, drawn }) => ({ at, value: drawn }));
  const seen = tops.flatMap(({ value }) => (value === null ? [] : [value]));
  expect((seen.at(-1) ?? 0) - (seen[0] ?? 0), 'the details slid down').toBeGreaterThan(100);
  expect(snapsOf('the details below', tops)).toEqual([]);
  const actions = await page.getByRole('button', { name: 'Deactivate' }).boundingBox();
  const box = await done.boundingBox();
  const details = await page.locator('[data-detail="state"]').boundingBox();
  expect(box?.y).toBeGreaterThan((actions?.y ?? 0) + (actions?.height ?? 0));
  expect(details?.y).toBeGreaterThan((box?.y ?? 0) + (box?.height ?? 0));

  const raisedStone = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.className = 'bg-secondary';
    document.body.append(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  });
  await expect(temporaryPassword(page)).toHaveCSS('background-color', raisedStone);
  await expect(temporaryPassword(page)).toHaveCSS('border-top-width', '0px');
  await expectNoSidewaysScroll(page);
  await expectAccessible(page);
});
