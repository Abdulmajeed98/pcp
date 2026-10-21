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

// The Admin works in the Vendors' shops, on a phone (LANG-8), and at a desk.
test.use({ viewport: narrowWindow });
const deskWindow = { width: 1280, height: 800 };

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
  test('a made-up Vendor created over HTTP is found on the list, whichever page it is on, with its login phone number in Iraq’s own form, and its row opens its page', async ({
    page,
    request,
  }) => {
    const vendor = await createAMadeUpVendor(request, authorization);

    expect(await findOnTheList(page, [vendor.name])).toEqual([vendor.name]);

    const row = rowOfVendor(page, vendor.name);
    await expectShownAsWritten(row, vendor.name);
    await expectMarkedAlwaysEnglish(row, inIraqsOwnForm(vendor.loginPhoneNumber));

    await row.getByRole('link', { name: vendor.name }).click();
    await expect(page).toHaveURL(new RegExp(`^${vendorPageUrl(vendor.id)}(\\?.*)?$`));
    await expect(page.getByRole('heading', { level: 1, name: vendor.name })).toBeVisible();
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

test.describe('on a screen as wide as a desk', () => {
  test.use({ viewport: deskWindow });

  test('the list is a table across the sheet, its count in words and on no plate, and meets WCAG 2.2 level AA in light and in dark', async ({
    page,
    request,
  }) => {
    const vendor = await createAMadeUpVendor(request, authorization);
    await findOnTheList(page, [vendor.name]);

    const table = page.getByRole('table', { name: 'Vendors' });
    await expect(table.getByRole('columnheader')).toHaveText([
      'Vendor',
      'State',
      'Login phone number',
    ]);
    const cells = rowOfVendor(page, vendor.name).getByRole('cell');
    await expect(cells).toHaveText([
      vendor.name,
      'Active',
      inIraqsOwnForm(vendor.loginPhoneNumber),
    ]);
    // The phone numbers end-aligned in tabular figures, so that their digits
    // line up down the column, its heading with them.
    await expect(cells.last()).toHaveCSS('text-align', 'end');
    await expect(cells.last()).toHaveCSS('font-variant-numeric', 'tabular-nums');
    await expect(table.getByRole('columnheader').last()).toHaveCSS('text-align', 'end');
    await expect(page.getByTestId('vendors-count')).toHaveText(/^[\d,]+ Vendors?$/);
    await expect(page.locator('[data-slot="plate"]')).toHaveCount(0);
    const sheet = await page.getByRole('main').boundingBox();
    const list = await table.boundingBox();
    // The sheet's 24 pixels of padding on each side, and the rows' 8 pixels
    // of bleed past the text on each side.
    expect(list?.width).toBeGreaterThanOrEqual((sheet?.width ?? 0) - 48 - 2);
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  });

  test("a Vendor's page opens beside the list, which keeps seven twelfths and marks the Vendor's row as open, on Active Stone", async ({
    page,
    request,
  }) => {
    const vendor = await createAMadeUpVendor(request, authorization, everyDetail);
    await findOnTheList(page, [vendor.name]);
    const before = await page.getByRole('table', { name: 'Vendors' }).boundingBox();

    await rowOfVendor(page, vendor.name).getByRole('link', { name: vendor.name }).click();

    // One h1 to a page: beside the list, the Vendor's page titles itself
    // h2 (the owner's "h2 on a desk", redesign ticket 08).
    await expect(page.getByRole('heading', { level: 2, name: vendor.name })).toBeVisible();
    await expect(vendorsHeading(page)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const row = rowOfVendor(page, vendor.name);
    await expect(row.getByRole('link', { name: vendor.name })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const activeStone = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.className = 'bg-accent';
      document.body.append(probe);
      const colour = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return colour;
    });
    await expect(row).toHaveCSS('background-color', activeStone);
    const after = await page.getByRole('table', { name: 'Vendors' }).boundingBox();
    const share = (after?.width ?? 0) / (before?.width ?? 1);
    expect(share).toBeGreaterThan(0.5);
    expect(share).toBeLessThan(0.62);
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);

    await page.getByRole('link', { name: 'Edit', exact: true }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: `Edit ${vendor.name}` }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });
});

test.describe("a Vendor's page", () => {
  let vendor: MadeUpVendor;

  test.beforeEach(async ({ page, request }) => {
    vendor = await createAMadeUpVendor(request, authorization, everyDetail);
    await page.goto(vendorPageUrl(vendor.id));
    await expect(page.getByRole('heading', { level: 1, name: vendor.name })).toBeVisible();
  });

  test('it shows every detail the Vendor was given, each as the platform shows it, its map link’s address holds its coordinates, and its Instagram link is its profile’s', async ({
    page,
  }) => {
    const heading = page.getByRole('heading', { level: 1 });
    await expectShownAsWritten(heading, vendor.name);
    await expect(detailRow(page, 'city')).toContainText('Erbil');
    await expectShownAsWritten(detailRow(page, 'address'), everyDetail.address);
    await expectShownAsWritten(detailRow(page, 'openingHours'), everyDetail.openingHours);
    await expectMarkedAlwaysEnglish(detailRow(page, 'phoneNumber'), '066 223 4567');
    await expectMarkedAlwaysEnglish(detailRow(page, 'whatsAppNumber'), '0770 123 4567');
    const instagram = detailRow(page, 'instagramName');
    await expectMarkedAlwaysEnglish(instagram, '@made_up.test');
    await expect(instagram.getByRole('link', { name: '@made_up.test' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/made_up.test/',
    );
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

test("a Vendor's page holds its longest details at 360 pixels: an Instagram name of 30 characters wraps rather than scrolling sideways, and each line of an address takes its own direction", async ({
  page,
  request,
}) => {
  // An English line short enough to fit on one line of the value.
  const englishLine = 'Made-up Complex';
  const vendor = await createAMadeUpVendor(request, authorization, {
    address: `شەقامی ٦٠ مەتری، نزیک بازاڕی ١٠٠\n${englishLine}`,
    instagramName: 'made_up_computer_hardware_erbl',
  });
  await page.goto(vendorPageUrl(vendor.id));
  await expect(page.getByRole('heading', { level: 1, name: vendor.name })).toBeVisible();

  await expect(
    detailRow(page, 'instagramName').getByRole('link', {
      name: '@made_up_computer_hardware_erbl',
    }),
  ).toBeVisible();
  await expectNoSidewaysScroll(page);
  // The English line's words start on the left of the value, as English is
  // read, though the address is Kurdish and laid out right to left.
  const englishLineStartsOnTheLeft = await detailRow(page, 'address')
    .locator('dd')
    .evaluate((value, line) => {
      const walker = document.createTreeWalker(value, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const at = (node as Text).data.indexOf(line);
        if (at === -1) continue;
        const words = document.createRange();
        words.setStart(node, at);
        words.setEnd(node, at + line.length);
        const left = value.getBoundingClientRect().left;
        return Math.abs(words.getClientRects()[0].left - left) < 2;
      }
      return false;
    }, englishLine);
  expect(englishLineStartsOnTheLeft).toBe(true);
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
