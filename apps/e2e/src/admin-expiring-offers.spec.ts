import { expect, type Locator, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { openTheSection, vendorPageUrl } from './admin-vendors';
import { catalogHeading } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import { leavingRowsOf, watchForLeavingRows } from './leaving-rows';
import { apiUrl, dashboardUrl } from './platform';
import { createAMadeUpVendor, type MadeUpVendor } from './vendors';

// The Admin reminds the Vendors whose Offers expire, from a phone, by a call
// or in WhatsApp (OFF-9, LANG-8). The development database's Offers are
// whatever earlier runs left, and no Offer can be made old through the API,
// so the list's answer is given to the page by the test, for a made-up
// Vendor that exists, whose page the row leads to.
test.use({ viewport: narrowWindow });

const expiringOffersUrl = `${dashboardUrl}/expiring-offers`;

function heading(page: Page): Locator {
  return page.getByRole('heading', { level: 1, name: 'Expiring Offers' });
}

// The Vendors on the list: rows on a phone, and a table's rows from 64rem
// (redesign ticket 10).
function listedVendors(page: Page): Locator {
  return page
    .getByRole('list', { name: 'Vendors to remind' })
    .getByRole('listitem')
    .or(
      page
        .getByRole('table', { name: 'Vendors to remind' })
        .getByRole('row')
        .filter({ has: page.getByRole('cell') }),
    );
}

// The page of the list the API answers, as the test gives it.
function aPageOf(content: unknown[]) {
  return {
    content,
    pageNumber: 0,
    pageSize: 20,
    totalElements: content.length,
    totalPages: content.length === 0 ? 0 : 1,
    first: true,
    last: true,
  };
}

// Answers the page's every call for the list with the page given.
async function answerTheList(page: Page, answer: unknown): Promise<void> {
  await page.route(`${apiUrl}/v1/offers/expiring?**`, (route) =>
    route.fulfill({ json: answer }),
  );
}

let vendor: MadeUpVendor;

test.beforeEach(async ({ page, request }) => {
  const authorization = await authorizationOfTheDevelopmentAdmin(page);
  await expect(catalogHeading(page)).toBeVisible();
  vendor = await createAMadeUpVendor(request, authorization);
});

// The made-up Vendor as the list answers it, with a landline to call and a
// WhatsApp number, one Expired Offer and two about to expire.
function theVendorListed() {
  return {
    id: vendor.id,
    name: vendor.name,
    phoneNumber: { international: '+964662234567', national: '066 223 4567' },
    whatsAppNumber: { international: '+9647701234567', national: '0770 123 4567' },
    counts: { offers: 5, expired: 1, aboutToExpire: 2 },
  };
}

test('the top bar’s menu leads to the Expiring Offers, which ask the API for the list', async ({
  page,
}) => {
  const asked = page.waitForResponse(
    (response) =>
      response.url().startsWith(`${apiUrl}/v1/offers/expiring?`) &&
      response.request().method() === 'GET',
  );

  await openTheSection(page, 'Expiring Offers');

  await expect(heading(page)).toBeVisible();
  await expect(page).toHaveURL(expiringOffersUrl);
  expect((await asked).status()).toBe(200);
  await expect(
    page.getByTestId('nobody-to-remind').or(listedVendors(page).first()),
  ).toBeVisible();
});

test('a row’s links hold the Vendor’s phone number and WhatsApp number, and the row leads to the Vendor’s page', async ({
  page,
}) => {
  await answerTheList(page, aPageOf([theVendorListed()]));
  await page.goto(expiringOffersUrl);

  const row = listedVendors(page).filter({ hasText: vendor.name });
  await expect(row).toHaveCount(1);
  await expect(page.getByTestId('vendors-to-remind-count')).toHaveText('1');
  await expect(row.getByTestId('why-to-remind')).toHaveText(
    '1 Expired Offer · 2 about to expire',
  );
  const call = row.getByTestId('call');
  await expect(call).toHaveAttribute('href', 'tel:+964662234567');
  await expect(call).toHaveText('Call 066 223 4567');
  await expect(call.locator('bdi[dir="ltr"][lang="en"]')).toHaveText('066 223 4567');
  const chat = row.getByTestId('chat');
  await expect(chat).toHaveAttribute('href', 'https://wa.me/9647701234567');
  await expect(chat).toHaveAttribute('target', '_blank');
  await expect(chat.locator('bdi[dir="ltr"][lang="en"]')).toHaveText('0770 123 4567');
  await expect(row.locator('bdi[dir="auto"]')).toHaveText(vendor.name);
  await expectNoSidewaysScroll(page);

  await row.getByRole('link', { name: vendor.name, exact: true }).click();
  await expect(page).toHaveURL(vendorPageUrl(vendor.id));
  await expect(page.getByRole('heading', { level: 1, name: vendor.name })).toBeVisible();
});

test('a Vendor with no WhatsApp number says so, and an empty list says that no Vendor needs reminding', async ({
  page,
}) => {
  await answerTheList(page, aPageOf([{ ...theVendorListed(), whatsAppNumber: null }]));
  await page.goto(expiringOffersUrl);
  const row = listedVendors(page).filter({ hasText: vendor.name });
  await expect(row.getByText('No WhatsApp', { exact: true })).toBeVisible();
  await expect(row.getByTestId('chat')).toHaveCount(0);

  await page.unrouteAll();
  await answerTheList(page, aPageOf([]));
  await page.reload();
  await expect(page.getByTestId('nobody-to-remind')).toContainText(
    'No Vendor needs reminding',
  );
});

test('the list meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
  page,
}) => {
  await answerTheList(
    page,
    aPageOf([
      theVendorListed(),
      { ...theVendorListed(), id: 'another', whatsAppNumber: null },
    ]),
  );
  await page.goto(expiringOffersUrl);
  await expect(listedVendors(page)).toHaveCount(2);

  await expectAccessible(page);
});

// Asks the list again, as TanStack Query does when the Admin comes back to
// the window.
async function comeBackToTheWindow(page: Page): Promise<void> {
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')));
}

test('a Vendor the list drops while the Admin is on it fades, then its space closes, and with reduced motion it only fades', async ({
  page,
}) => {
  const staying = { ...theVendorListed(), id: 'staying', name: 'Made-up Stays' };
  await answerTheList(page, aPageOf([theVendorListed(), staying]));
  await page.goto(expiringOffersUrl);
  await expect(listedVendors(page)).toHaveCount(2);

  await watchForLeavingRows(page);
  await page.unrouteAll();
  await answerTheList(page, aPageOf([staying]));
  await comeBackToTheWindow(page);
  await expect(listedVendors(page)).toHaveCount(1);
  await expect(listedVendors(page)).toContainText('Made-up Stays');
  await expect(page.getByTestId('vendors-to-remind-count')).toHaveText('1');
  const [left] = await leavingRowsOf(page);
  expect(left?.text).toContain(vendor.name);
  expect(left?.inert, 'a leaving row takes no tap').toBe(true);
  expect(left?.transitions).toContainEqual({
    property: 'opacity',
    duration: '0.15s',
    delay: '0s',
  });
  expect(left?.transitions).toContainEqual({
    property: 'grid-template-rows',
    duration: '0.2s',
    delay: '0.15s',
  });

  // With reduced motion: the fade, then the space closes at once.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.unrouteAll();
  await answerTheList(page, aPageOf([staying, theVendorListed()]));
  await comeBackToTheWindow(page);
  await expect(listedVendors(page)).toHaveCount(2);
  await watchForLeavingRows(page);
  await page.unrouteAll();
  await answerTheList(page, aPageOf([theVendorListed()]));
  await comeBackToTheWindow(page);
  await expect(listedVendors(page)).toHaveCount(1);
  const [faded] = await leavingRowsOf(page);
  expect(faded?.text).toContain('Made-up Stays');
  expect(faded?.transitions).toContainEqual({
    property: 'opacity',
    duration: '0.15s',
    delay: '0s',
  });
  expect(faded?.transitions).toContainEqual({
    property: 'grid-template-rows',
    duration: '0s',
    delay: '0.15s',
  });
});

// From 64rem the list is a table (redesign ticket 10).
test.describe('at a desk’s width', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the list is a table across the sheet, its Vendor, Offers, Phone and WhatsApp, whose links still call and chat, and meets WCAG 2.2 level AA in light and in dark', async ({
    page,
  }) => {
    await answerTheList(
      page,
      aPageOf([
        theVendorListed(),
        {
          ...theVendorListed(),
          id: 'another',
          name: 'Made-up Second',
          whatsAppNumber: null,
        },
      ]),
    );
    await page.goto(expiringOffersUrl);

    const table = page.getByRole('table', { name: 'Vendors to remind' });
    await expect(table.getByRole('columnheader')).toHaveText([
      'Vendor',
      'Offers',
      'Phone',
      'WhatsApp',
    ]);
    const row = listedVendors(page).filter({ hasText: vendor.name });
    await expect(row.getByTestId('why-to-remind')).toHaveText(
      '1 Expired Offer · 2 about to expire',
    );
    await expect(row.getByTestId('call')).toHaveAttribute('href', 'tel:+964662234567');
    await expect(row.getByTestId('chat')).toHaveAttribute(
      'href',
      'https://wa.me/9647701234567',
    );
    await expect(
      listedVendors(page)
        .filter({ hasText: 'Made-up Second' })
        .getByText('No WhatsApp', { exact: true }),
    ).toBeVisible();
    // A heading starts where its column's text does, and a row's name and
    // why stand level with the middle of its numbers' links (redesign
    // ticket 10's break-ui).
    const vendorHeading = await table
      .getByRole('columnheader', { name: 'Vendor' })
      .evaluate(
        (heading) =>
          heading.getBoundingClientRect().left +
          parseFloat(getComputedStyle(heading).paddingInlineStart),
      );
    const name = await row
      .getByRole('link', { name: vendor.name, exact: true })
      .boundingBox();
    expect(Math.abs((name?.x ?? 0) - vendorHeading)).toBeLessThan(1);
    const middle = (box: { y: number; height: number } | null) =>
      (box?.y ?? 0) + (box?.height ?? 0) / 2;
    const call = middle(await row.getByTestId('call').boundingBox());
    expect(Math.abs(middle(name) - call)).toBeLessThan(2);
    expect(
      Math.abs(middle(await row.getByTestId('why-to-remind').boundingBox()) - call),
    ).toBeLessThan(2);
    await expect(page.getByTestId('vendors-to-remind-count')).toHaveText('2');
    await expect(page.locator('[data-slot="plate"]')).toHaveCount(0);

    const sheet = await page.getByRole('main').boundingBox();
    const list = await table.boundingBox();
    expect(list?.width).toBeGreaterThanOrEqual((sheet?.width ?? 0) - 48 - 2);
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);

    await row.getByRole('link', { name: vendor.name, exact: true }).click();
    await expect(page).toHaveURL(vendorPageUrl(vendor.id));
  });
});
