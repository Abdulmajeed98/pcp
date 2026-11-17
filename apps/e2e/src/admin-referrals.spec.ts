import { expect, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { openTheSection, vendorPageUrl } from './admin-vendors';
import { catalogHeading, createAMadeUpPart } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import { apiUrl } from './platform';
import {
  findOnTheReferrals,
  recordAReferral,
  referralCountOf,
  referralsUrl,
  shareABuildOf,
  theReferralsHeading,
  vendorsListedOnTheReferrals,
} from './referrals';
import { aMadeUpMobileNumber, createAMadeUpVendor, type MadeUpVendor } from './vendors';

// The Admin sees every Vendor's Referral count on the Referrals screen, from
// a phone, the most first, a deactivated Vendor marked, each leading to its
// page (SHR-7, LANG-8). The test makes its own made-up Vendors, shares a
// Build of its own made-up Part and records Referrals over HTTP, as the
// Shopper's button does, and finds its own rows among those earlier runs
// left, by asking the API for each Vendor's place on the list.
test.use({ viewport: narrowWindow });

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

  await expect(theReferralsHeading(page)).toBeVisible();
  await expect(page).toHaveURL(referralsUrl);
  expect((await asked).status()).toBe(200);
  await expect(vendorsListedOnTheReferrals(page).first()).toBeVisible();
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
      const row = await findOnTheReferrals(page, request, authorization, vendor, from);
      await expect(row.getByTestId('referral-count')).toHaveText(String(count));
      await expect(row.getByText('Deactivated', { exact: true })).toHaveCount(
        marked ? 1 : 0,
      );
      await expect(row.locator('bdi[dir="auto"]')).toHaveText(vendor.name);
      await expectNoSidewaysScroll(page);
    });
  }

  const row = await findOnTheReferrals(
    page,
    request,
    authorization,
    twice,
    'the first page',
  );
  await row.getByRole('link', { name: twice.name, exact: true }).click();
  await expect(page).toHaveURL(vendorPageUrl(twice.id));
  await expect(page.getByRole('heading', { level: 1, name: twice.name })).toBeVisible();
});

test('the list meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
  page,
  request,
}) => {
  await findOnTheReferrals(page, request, authorization, deactivated, 'the first page');

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
    const row = await findOnTheReferrals(
      page,
      request,
      authorization,
      deactivated,
      'the first page',
    );

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
