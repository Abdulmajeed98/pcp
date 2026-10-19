import { expect, type Locator, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { openTheSection, vendorPageUrl } from './admin-vendors';
import { catalogHeading } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
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

function listedVendors(page: Page): Locator {
  return page.getByRole('list', { name: 'Vendors to remind' }).getByRole('listitem');
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
