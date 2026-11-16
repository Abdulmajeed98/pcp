import {
  type APIRequestContext,
  expect,
  type Locator,
  type Page,
  test,
} from '@playwright/test';

import { expectAccessible } from './accessibility';
import { openTheSection, vendorPageUrl } from './admin-vendors';
import { catalogHeading, createAMadeUpPart } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import { apiUrl, dashboardUrl } from './platform';
import { recordAReferral, referralCountOf, shareABuildOf } from './referrals';
import { aMadeUpMobileNumber, createAMadeUpVendor, type MadeUpVendor } from './vendors';

// The Admin sees every Vendor's Referral count on the Referrals screen, from
// a phone, the most first, a deactivated Vendor marked, each leading to its
// page (SHR-7, LANG-8). The test makes its own made-up Vendors, shares a
// Build of its own made-up Part and records Referrals over HTTP, as the
// Shopper's button does, and finds its own rows among those earlier runs
// left, by asking the API for each Vendor's place on the list.
test.use({ viewport: narrowWindow });

const referralsUrl = `${dashboardUrl}/referrals`;

function heading(page: Page): Locator {
  return page.getByRole('heading', { level: 1, name: 'Referrals' });
}

// The Vendors on the list: rows on a phone, and a table's rows from 64rem.
function listedVendors(page: Page): Locator {
  return page
    .getByRole('list', { name: 'Referrals by Vendor' })
    .getByRole('listitem')
    .or(
      page
        .getByRole('table', { name: 'Referrals by Vendor' })
        .getByRole('row')
        .filter({ has: page.getByRole('cell') }),
    );
}

// How many Vendors a page of the dashboard's list holds, and the most the
// API gives in one answer.
const vendorsOnAPage = 20;
const vendorsInAnAnswer = 100;

// Where on the list a Vendor is looked for: from its first page for a
// Vendor with Referrals, which few Vendors have, and from its last for one
// with none. The list is by count, most first, then by name, and the word in
// a made-up Vendor's name begins with the time it was made, so a new made-up
// Vendor with no Referral is among the last of the many with none, and only
// Vendors named in another script follow it.
type LookedForFrom = 'the first page' | 'the last page';

// The Vendor's place on the list, counted from 0, in the order the API gives
// it, or none when the list does not hold it.
async function placeOnTheList(
  request: APIRequestContext,
  vendorId: string,
  from: LookedForFrom,
): Promise<number | undefined> {
  const pageOf = async (number: number) => {
    const answered = await request.get(`${apiUrl}/v1/referral-counts`, {
      headers: { authorization },
      params: { page: number, size: vendorsInAnAnswer },
    });
    expect(answered.status()).toBe(200);
    return (await answered.json()) as { content: { id: string }[]; totalPages: number };
  };

  const first = await pageOf(0);
  const numbers = Array.from({ length: first.totalPages }, (_, number) => number);
  for (const number of from === 'the first page' ? numbers : numbers.reverse()) {
    const { content } = number === 0 ? first : await pageOf(number);
    const place = content.findIndex((vendor) => vendor.id === vendorId);
    if (place >= 0) return number * vendorsInAnAnswer + place;
  }
  return undefined;
}

// Opens the list at the page that holds the Vendor, by the page in the
// list's address, and gives back its row.
async function findOnTheList(
  page: Page,
  request: APIRequestContext,
  vendor: MadeUpVendor,
  from: LookedForFrom,
): Promise<Locator> {
  const place = await placeOnTheList(request, vendor.id, from);
  expect(place, 'the made-up Vendor is on the list').toBeDefined();
  const number = Math.floor((place as number) / vendorsOnAPage) + 1;
  await page.goto(number === 1 ? referralsUrl : `${referralsUrl}?page=${number}`);
  await expect(heading(page)).toBeVisible();
  await expect(listedVendors(page).first()).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  const row = listedVendors(page).filter({ hasText: vendor.name });
  await expect(row, 'the made-up Vendor is on its page of the list').toHaveCount(1);
  return row;
}

let authorization: string;
// A made-up Vendor sent the test's Build twice, one sent it once and then
// deactivated, which keeps its Referral, and one with no WhatsApp number,
// which no Shopper can send a Build to.
let twice: MadeUpVendor;
let deactivated: MadeUpVendor;
let none: MadeUpVendor;

test.beforeAll(async ({ browser }) => {
  // A context made in a hook takes the worker's first line's options, so it
  // asks for script itself (browse ticket 10).
  const context = await browser.newContext({ javaScriptEnabled: true });
  const page = await context.newPage();
  const { request } = page;
  authorization = await authorizationOfTheDevelopmentAdmin(page);
  await expect(catalogHeading(page)).toBeVisible();

  const withWhatsApp = () => ({ whatsAppNumber: aMadeUpMobileNumber() });
  twice = await createAMadeUpVendor(request, authorization, withWhatsApp());
  deactivated = await createAMadeUpVendor(request, authorization, withWhatsApp());
  none = await createAMadeUpVendor(request, authorization);
  const part = await createAMadeUpPart(request, authorization);
  const sharedBuild = await shareABuildOf(request, [part.id]);
  await recordAReferral(request, sharedBuild, twice.id);
  await recordAReferral(request, sharedBuild, twice.id);
  await recordAReferral(request, sharedBuild, deactivated.id);
  const switchedOff = await request.post(
    `${apiUrl}/v1/vendors/${deactivated.id}/deactivate`,
    { headers: { authorization } },
  );
  expect(switchedOff.status()).toBe(200);
  await context.close();
});

test.beforeEach(async ({ page }) => {
  await authorizationOfTheDevelopmentAdmin(page);
  await expect(catalogHeading(page)).toBeVisible();
});

test('the top bar’s menu leads to the Referrals, which ask the API for the counts', async ({
  page,
}) => {
  const asked = page.waitForResponse(
    (response) =>
      response.url().startsWith(`${apiUrl}/v1/referral-counts?`) &&
      response.request().method() === 'GET',
  );

  await openTheSection(page, 'Referrals');

  await expect(heading(page)).toBeVisible();
  await expect(page).toHaveURL(referralsUrl);
  expect((await asked).status()).toBe(200);
  await expect(listedVendors(page).first()).toBeVisible();
});

test('each of the test’s Vendors is listed with its count as the API answers it, the deactivated one marked, and leads to its page', async ({
  page,
  request,
}) => {
  const arranged = [
    { vendor: twice, count: 2, from: 'the first page', marked: false },
    { vendor: deactivated, count: 1, from: 'the first page', marked: true },
    { vendor: none, count: 0, from: 'the last page', marked: false },
  ] as const;

  for (const { vendor, count, from, marked } of arranged) {
    await test.step(`${vendor.name}, sent the Build ${count} times`, async () => {
      expect(await referralCountOf(request, authorization, vendor.id)).toBe(count);
      const row = await findOnTheList(page, request, vendor, from);
      await expect(row.getByTestId('referral-count')).toHaveText(String(count));
      await expect(row.getByText('Deactivated', { exact: true })).toHaveCount(
        marked ? 1 : 0,
      );
      await expect(row.locator('bdi[dir="auto"]')).toHaveText(vendor.name);
      await expectNoSidewaysScroll(page);
    });
  }

  const row = await findOnTheList(page, request, twice, 'the first page');
  await row.getByRole('link', { name: twice.name, exact: true }).click();
  await expect(page).toHaveURL(vendorPageUrl(twice.id));
  await expect(page.getByRole('heading', { level: 1, name: twice.name })).toBeVisible();
});

test('the list meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
  page,
  request,
}) => {
  await findOnTheList(page, request, deactivated, 'the first page');

  await expectAccessible(page);
});

test('a refusal and an API that cannot be reached are each said', async ({ page }) => {
  await page.route(`${apiUrl}/v1/referral-counts?**`, (route) =>
    route.fulfill({
      status: 503,
      json: {
        errors: [
          {
            code: 'DATABASE_UNAVAILABLE',
            title: 'DATABASE_UNAVAILABLE.title',
            detail: 'DATABASE_UNAVAILABLE.detail',
          },
        ],
      },
    }),
  );
  await page.goto(referralsUrl);
  const refusal = page.getByTestId('refusal');
  await expect(refusal).toContainText('The Referrals could not be listed.');
  await expect(refusal).toContainText('503, DATABASE_UNAVAILABLE');

  await page.unrouteAll();
  await page.route(`${apiUrl}/v1/referral-counts?**`, (route) => route.abort());
  await page.reload();
  await expect(refusal).toContainText('The API cannot be reached.');
});

// From 64rem the list is a table.
test.describe('at a desk’s width', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the list is a table across the sheet, its Vendor, State and Referrals, and meets WCAG 2.2 level AA in light and in dark', async ({
    page,
    request,
  }) => {
    const row = await findOnTheList(page, request, deactivated, 'the first page');

    const table = page.getByRole('table', { name: 'Referrals by Vendor' });
    await expect(table.getByRole('columnheader')).toHaveText([
      'Vendor',
      'State',
      'Referrals',
    ]);
    await expect(row.getByTestId('referral-count')).toHaveText('1');
    await expect(row.getByText('Deactivated', { exact: true })).toBeVisible();
    await expect(page.locator('[data-slot="plate"]')).toHaveCount(0);
    const sheet = await page.getByRole('main').boundingBox();
    const list = await table.boundingBox();
    expect(list?.width).toBeGreaterThanOrEqual((sheet?.width ?? 0) - 48 - 2);
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);

    await row.getByRole('link', { name: deactivated.name, exact: true }).click();
    await expect(page).toHaveURL(vendorPageUrl(deactivated.id));
  });
});
