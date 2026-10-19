import { expect, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  detailRow,
  openTheVendorsPage,
  vendorFormField,
  vendorPageUrl,
} from './admin-vendors';
import { openTheDashboardAs } from './development-logins';
import {
  atTheLoginScreenInABrowserOfItsOwn,
  expectTheLoginScreenToRefuse,
  type VendorLoginDetails,
} from './keycloak-screens';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import { aWordUniqueToTheRun } from './made-up';
import {
  aMadeUpMobileNumber,
  aMadeUpVendorThatHasLoggedIn,
  inIraqsOwnForm,
} from './vendors';

// The Admin edits a Vendor on a phone, in the Vendor's shop (LANG-8). Each
// test edits a made-up Vendor of its own that has been through its first
// login and chosen its own password, as a real Vendor has.
test.use({ viewport: narrowWindow });

// The edit form's heading, which tells the screen apart.
function editVendorHeading(page: Page) {
  return page.getByRole('heading', { level: 1, name: 'Edit the Vendor' });
}

// A new name and a new login phone number for a made-up Vendor, unique to
// the run: the number as the Admin types it, in local form, and in the
// stored form the Login is then named by.
function aNewNameAndNumber() {
  const typed = aMadeUpMobileNumber();
  return {
    name: `Made-up test Vendor ${aWordUniqueToTheRun()}`,
    loginPhoneNumber: typed,
    stored: `+964${typed.replace(/^0/, '')}`,
  };
}

// As the development Admin, opens the Vendor's page, follows its Edit link to
// the edit form, and checks that the form holds the Vendor as it is.
async function openTheEditForm(page: Page, vendor: VendorLoginDetails): Promise<void> {
  await openTheVendorsPage(page, vendor);
  await page.getByRole('link', { name: 'Edit', exact: true }).click();

  await expect(page).toHaveURL(`${vendorPageUrl(vendor.vendorId)}/edit`);
  await expect(editVendorHeading(page)).toBeVisible();
  await expect(vendorFormField(page, 'Name')).toHaveValue(vendor.vendorName);
  await expect(vendorFormField(page, 'Login phone number')).toHaveValue(
    inIraqsOwnForm(vendor.name),
  );
}

// Changes the Vendor's name and its login phone number in the edit form, and
// saves it.
async function changeTheNameAndTheNumber(
  page: Page,
  change: ReturnType<typeof aNewNameAndNumber>,
): Promise<void> {
  await vendorFormField(page, 'Name').fill(change.name);
  await vendorFormField(page, 'Login phone number').fill(change.loginPhoneNumber);
  await page.getByRole('button', { name: 'Save the Vendor' }).click();
}

test("as the development Admin, the Admin changes a made-up Vendor's name and login phone number in its edit form, filled with the Vendor as it was, and the Vendor's page then shows both", async ({
  browser,
  page,
}) => {
  const vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  const change = aNewNameAndNumber();

  await openTheEditForm(page, vendor);
  await changeTheNameAndTheNumber(page, change);

  await expect(page).toHaveURL(vendorPageUrl(vendor.vendorId));
  await expect(page.getByRole('heading', { level: 1, name: change.name })).toBeVisible();
  await expect(detailRow(page, 'loginPhoneNumber')).toContainText(
    inIraqsOwnForm(change.stored),
  );
  await expectNoSidewaysScroll(page);
});

test('the Vendor, which had chosen its own password, then logs in with the new login phone number and that password, and the old number no longer logs in', async ({
  browser,
  page,
}) => {
  const vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  const change = aNewNameAndNumber();
  await openTheEditForm(page, vendor);
  await changeTheNameAndTheNumber(page, change);
  await expect(page.getByRole('heading', { level: 1, name: change.name })).toBeVisible();

  await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
    await openTheDashboardAs(vendorsPage, {
      ...vendor,
      name: change.stored,
      vendorName: change.name,
    });
  });
  await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
    await expectTheLoginScreenToRefuse(vendorsPage, vendor);
  });
});

test('the edit form does not scroll sideways, and meets the automated part of WCAG 2.2 level AA in light and in dark, as opened and with a refusal shown', async ({
  browser,
  page,
}) => {
  const vendor = await aMadeUpVendorThatHasLoggedIn(browser);

  await openTheEditForm(page, vendor);
  await expectNoSidewaysScroll(page);
  await expectAccessible(page);

  // A number in London, as Ofcom keeps 020 7946 0xxx for drama.
  await vendorFormField(page, 'Phone number').fill('+44 20 7946 0958');
  await page.getByRole('button', { name: 'Save the Vendor' }).click();
  const phoneNumber = vendorFormField(page, 'Phone number');
  await expect(phoneNumber).toHaveAttribute('aria-invalid', 'true');
  await expect(phoneNumber).toHaveAccessibleDescription(/not an Iraqi phone number/);
  await expect(editVendorHeading(page)).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectAccessible(page);
});
