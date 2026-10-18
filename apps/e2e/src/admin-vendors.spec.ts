import { expect, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  detailRow,
  expectMarkedAlwaysEnglish,
  expectShownAsWritten,
  findOnTheList,
  openTheSection,
  rowOfVendor,
  vendorPageUrl,
  vendorsHeading,
  vendorsUrl,
} from './admin-vendors';
import { catalogHeading, catalogUrl } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { createAMadeUpVendor, inIraqsOwnForm, type MadeUpVendor } from './vendors';

// The Admin works in the Vendors' shops, on a phone (LANG-8).
test.use({ viewport: narrowWindow });

// What a Vendor in Erbil may write, in Sorani, in the Arabic script, with
// Arabic-Indic digits, on more than one line, and the rest of its details,
// each of a kind the platform shows in its own way.
const everyDetail = {
  address: 'شەقامی ٦٠ مەتری، نزیک بازاڕی ١٠٠\nهەولێر',
  mapLocation: { latitude: 36.1911744, longitude: 44.0094145 },
  phoneNumber: '066 223 4567',
  whatsAppNumber: '0770 123 4567',
  instagramName: '@Made_Up.Test',
  openingHours: 'شەممە تا پێنجشەممە: ٩ بۆ ٩\nهەینی: داخراوە',
};

let authorization: string;

test.beforeEach(async ({ page }) => {
  authorization = await authorizationOfTheDevelopmentAdmin(page);
  await expect(catalogHeading(page)).toBeVisible();
});

test.describe('the Vendors list', () => {
  test('a made-up Vendor created over HTTP is found on the list, whichever page it is on, with its login phone number in Iraq’s own form', async ({
    page,
    request,
  }) => {
    const vendor = await createAMadeUpVendor(request, authorization);

    expect(await findOnTheList(page, [vendor.name])).toEqual([vendor.name]);

    const row = rowOfVendor(page, vendor.name);
    await expectShownAsWritten(row, vendor.name);
    await expectMarkedAlwaysEnglish(row, inIraqsOwnForm(vendor.loginPhoneNumber));
  });

  test('the list is in name order: of two made-up Vendors, the one whose name comes first is listed first, though it was made second', async ({
    page,
    request,
  }) => {
    const word = aWordUniqueToTheRun();
    const later = await createAMadeUpVendor(request, authorization, {
      name: `Made-up test Vendor ${word} B`,
    });
    const first = await createAMadeUpVendor(request, authorization, {
      name: `Made-up test Vendor ${word} A`,
    });

    expect(await findOnTheList(page, [first.name, later.name])).toEqual([
      first.name,
      later.name,
    ]);
  });

  test('the list does not scroll sideways, and it and its menu meet the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
    request,
  }) => {
    const vendor = await createAMadeUpVendor(request, authorization);
    await findOnTheList(page, [vendor.name]);

    await expectNoSidewaysScroll(page);
    await page.getByRole('button', { name: 'Sections' }).click();
    await expect(page.getByRole('navigation', { name: 'Sections' })).toBeVisible();
    await expectAccessible(page);
  });
});

test.describe("a Vendor's page", () => {
  let vendor: MadeUpVendor;

  test.beforeEach(async ({ page, request }) => {
    vendor = await createAMadeUpVendor(request, authorization, everyDetail);
    await page.goto(vendorPageUrl(vendor.id));
    await expect(page.getByRole('heading', { level: 1, name: vendor.name })).toBeVisible();
  });

  test('it shows every detail the Vendor was given, each as the platform shows it, and its map link’s address holds its coordinates', async ({
    page,
  }) => {
    const heading = page.getByRole('heading', { level: 1 });
    await expectShownAsWritten(heading, vendor.name);
    await expect(detailRow(page, 'city')).toContainText('Erbil');
    await expectShownAsWritten(detailRow(page, 'address'), everyDetail.address);
    await expectShownAsWritten(detailRow(page, 'openingHours'), everyDetail.openingHours);
    await expectMarkedAlwaysEnglish(detailRow(page, 'phoneNumber'), '066 223 4567');
    await expectMarkedAlwaysEnglish(detailRow(page, 'whatsAppNumber'), '0770 123 4567');
    await expectMarkedAlwaysEnglish(detailRow(page, 'instagramName'), 'made_up.test');
    await expectMarkedAlwaysEnglish(
      detailRow(page, 'loginPhoneNumber'),
      inIraqsOwnForm(vendor.loginPhoneNumber),
    );
    await expect(detailRow(page, 'state')).toHaveText(/Active/);

    const mapLink = detailRow(page, 'mapLocation').getByRole('link', {
      name: 'Open in Google Maps',
    });
    const address = new URL((await mapLink.getAttribute('href')) ?? '');
    expect(`${address.origin}${address.pathname}`).toBe(
      'https://www.google.com/maps/search/',
    );
    expect(Object.fromEntries(address.searchParams)).toEqual({
      api: '1',
      query: '36.1911744,44.0094145',
    });
  });

  test('it does not scroll sideways, and meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
  }) => {
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  });
});

test('the menu leads from the Vendors to the Catalog and back, and marks the section the Admin is in', async ({
  page,
}) => {
  await page.goto(vendorsUrl);
  await expect(vendorsHeading(page)).toBeVisible();

  await openTheSection(page, 'Catalog');
  await expect(catalogHeading(page)).toBeVisible();
  await expect(page).toHaveURL(catalogUrl);
  await page.getByRole('button', { name: 'Sections' }).click();
  const sections = page.getByRole('navigation', { name: 'Sections' });
  await expect(sections.getByRole('link', { name: 'Catalog' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(sections.getByRole('link', { name: 'Vendors' })).not.toHaveAttribute(
    'aria-current',
  );

  await sections.getByRole('link', { name: 'Vendors', exact: true }).click();
  await expect(vendorsHeading(page)).toBeVisible();
  await expect(page).toHaveURL(vendorsUrl);
  await page.getByRole('button', { name: 'Sections' }).click();
  await expect(sections.getByRole('link', { name: 'Vendors' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});
