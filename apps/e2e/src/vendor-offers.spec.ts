import {
  type APIRequestContext,
  type Browser,
  expect,
  type Page,
  test,
} from '@playwright/test';

import { expectAccessible } from './accessibility';
import { type MadeUpPart, createAMadeUpPart } from './catalog';
import {
  authorizationOfTheDevelopmentAdmin,
  developmentAdmin,
  logInToTheDashboard,
  openTheDashboardAs,
  vendorNameInTheFrame,
} from './development-logins';
import { type VendorLoginDetails } from './keycloak-screens';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import {
  addAnOffer,
  answerTheOffersAsExpiring,
  listedOffers,
  noOffers,
  rowOfOffer,
  theBanner,
  theOffersScreen,
  theSection,
} from './offers';
import { apiUrl, dashboardUrl } from './platform';
import { aMadeUpVendorThatHasLoggedIn } from './vendors';

// A Vendor uses its portal on a phone (LANG-8). The browser is set to
// English, so the portal opens in English. No test quotes the portal's text,
// which the review of the translations may change: an element is found by its
// test id, where it leads or what it is. Prices, Part names and counts are
// not translations, and are read as they are.
test.use({ viewport: narrowWindow, locale: 'en' });

// Calls the API as the development Admin, in a browser of its own that is
// closed afterwards.
async function asTheAdmin<Done>(
  browser: Browser,
  use: (request: APIRequestContext, authorization: string) => Promise<Done>,
): Promise<Done> {
  const context = await browser.newContext();
  try {
    const authorization = await authorizationOfTheDevelopmentAdmin(await context.newPage());
    return await use(context.request, authorization);
  } finally {
    await context.close();
  }
}

test('a made-up Vendor that has logged in opens its portal on the Offers screen, with the message for a Vendor with none, and no banner', async ({
  browser,
  page,
}) => {
  const vendor = await aMadeUpVendorThatHasLoggedIn(browser);

  await openTheDashboardAs(page, vendor);

  await expect(page).toHaveURL(`${dashboardUrl}/`);
  await expect(theOffersScreen(page)).toBeVisible();
  await expect(noOffers(page)).toBeVisible();
  await expect(listedOffers(page)).toHaveCount(0);
  await expect(theBanner(page)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
});

test.describe('a made-up Vendor with two Offers, added over HTTP', () => {
  let vendor: VendorLoginDetails;
  let quotedInUsd: MadeUpPart;
  let quotedInBoth: MadeUpPart;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
    await asTheAdmin(browser, async (request, authorization) => {
      quotedInUsd = await createAMadeUpPart(request, authorization);
      quotedInBoth = await createAMadeUpPart(request, authorization, {}, 'gpu');
      await addAnOffer(request, authorization, vendor.vendorId, quotedInUsd.id, {
        usdPrice: '349.99',
        warrantyMonths: 24,
      });
      await addAnOffer(request, authorization, vendor.vendorId, quotedInBoth.id, {
        usdPrice: '1250.5',
        iqdPrice: 1_875_000,
        inStock: false,
      });
    });
  });

  test('each Offer is listed, confirmed today, with its price, its Category, its stock and its warranty, and the screen counts them', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor);

    await expect(listedOffers(page)).toHaveCount(2);
    await expect(page.getByTestId('offers-count')).toHaveText('2');
    await expect(theBanner(page)).toHaveCount(0);

    const inUsd = rowOfOffer(page, quotedInUsd.name);
    await expect(inUsd.getByTestId('confirmation')).toHaveAttribute('data-state', 'today');
    await expect(inUsd.getByTestId('usd-price')).toHaveText('349.99 $');
    await expect(inUsd.getByTestId('iqd-price')).toHaveCount(0);
    await expect(inUsd.getByTestId('category')).toHaveAttribute('data-category', 'cpu');
    await expect(inUsd.getByTestId('category')).not.toBeEmpty();
    await expect(inUsd.getByTestId('stock')).toHaveAttribute('data-in-stock', 'true');
    await expect(inUsd.getByTestId('warranty')).toContainText('24');

    const inBoth = rowOfOffer(page, quotedInBoth.name);
    await expect(inBoth.getByTestId('confirmation')).toHaveAttribute('data-state', 'today');
    await expect(inBoth.getByTestId('usd-price')).toHaveText('1,250.50 $');
    await expect(inBoth.getByTestId('iqd-price')).toHaveText('1,875,000 IQD');
    await expect(inBoth.getByTestId('category')).toHaveAttribute('data-category', 'gpu');
    await expect(inBoth.getByTestId('category')).not.toBeEmpty();
    await expect(inBoth.getByTestId('stock')).toHaveAttribute('data-in-stock', 'false');
    await expect(inBoth.getByTestId('warranty')).toHaveCount(0);
    await expectNoSidewaysScroll(page);
  });

  test('the Vendor searches its own Offers by a part number, and only that Offer is listed', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor);
    await expect(listedOffers(page)).toHaveCount(2);

    await page.getByRole('searchbox').fill(quotedInBoth.partNumber);
    await page.getByRole('searchbox').press('Enter');

    await expect(listedOffers(page)).toHaveCount(1);
    await expect(rowOfOffer(page, quotedInBoth.name)).toBeVisible();
    await expect(page.getByTestId('offers-count')).toHaveText('1');
  });

  test('given Offers about to expire and expired, the banner shows both counts; confirm-all asks the real API, says how many it confirmed, and the banner leaves once nothing is expired or about to expire', async ({
    page,
  }) => {
    await answerTheOffersAsExpiring(page, vendor.vendorId, {
      offers: 7,
      expired: 3,
      aboutToExpire: 4,
    });
    await openTheDashboardAs(page, vendor);

    await expect(theBanner(page)).toBeVisible();
    await expect(theBanner(page).getByTestId('expired-count')).toHaveText('3');
    await expect(theBanner(page).getByTestId('about-to-expire-count')).toHaveText('4');
    await expect(
      listedOffers(page).locator('[data-testid="confirmation"][data-state="expired"]'),
    ).toHaveCount(1);
    await expect(
      listedOffers(page).locator('[data-testid="confirmation"][data-state="expiresIn"]'),
    ).toHaveCount(1);
    await expect(
      listedOffers(page).locator('[data-testid="confirmation"][data-state="expiresToday"]'),
    ).toHaveCount(1);

    const answered = page.waitForResponse(
      (response) =>
        response.url() === `${apiUrl}/v1/vendors/${vendor.vendorId}/offers/confirm` &&
        response.request().method() === 'POST',
    );
    await theBanner(page).getByRole('button').click();
    const { confirmed } = (await (await answered).json()) as { confirmed: number };

    expect(confirmed).toBe(2);
    await expect(page.getByTestId('confirmed-count')).toHaveText(String(confirmed));
    await expect(theBanner(page)).toHaveCount(0);
    await expect(listedOffers(page)).toHaveCount(2);
  });

  test('the Offers screen with the banner meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
  }) => {
    await answerTheOffersAsExpiring(page, vendor.vendorId, {
      offers: 3,
      expired: 1,
      aboutToExpire: 2,
    });
    await openTheDashboardAs(page, vendor);
    await expect(theBanner(page)).toBeVisible();
    await expect(listedOffers(page)).toHaveCount(3);

    await expectAccessible(page);
  });

  test('the Admin acting as the Vendor sees the same Offers screen under the band', async ({
    page,
  }) => {
    await logInToTheDashboard(
      page,
      developmentAdmin,
      `${dashboardUrl}/vendors/${vendor.vendorId}/portal`,
    );

    await expect(page.getByTestId('acting-band')).toBeVisible();
    await expect(vendorNameInTheFrame(page)).toHaveText(vendor.vendorName);
    await expect(theOffersScreen(page)).toBeVisible();
    await expect(rowOfOffer(page, quotedInUsd.name)).toBeVisible();
    await expect(rowOfOffer(page, quotedInBoth.name)).toBeVisible();
  });
});

test.describe('the sections of the top bar, as a made-up Vendor', () => {
  let vendor: VendorLoginDetails;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  });

  test('the details screen is reached by its section, the contact details form still saves, and the Offers section leads back', async ({
    page,
  }) => {
    const openingHours = `Made-up hours ${Date.now() % 100_000}`;
    await openTheDashboardAs(page, vendor);
    await expect(theOffersScreen(page)).toBeVisible();

    await theSection(page, 'details').click();
    await expect(page).toHaveURL(`${dashboardUrl}/details`);
    await expect(detailOf(page, 'name')).toHaveText(vendor.vendorName);
    await expect(theSection(page, 'details')).toHaveAttribute('aria-current', 'page');

    await page.getByRole('main').locator('a[href="/details/contact-details"]').click();
    await page.locator('#contact-details-openingHours').fill(openingHours);
    await page.getByRole('main').locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(`${dashboardUrl}/details`);
    await expect(detailOf(page, 'openingHours')).toHaveText(openingHours);

    await theSection(page, 'offers').click();
    await expect(page).toHaveURL(`${dashboardUrl}/`);
    await expect(theOffersScreen(page)).toBeVisible();
    await expect(theSection(page, 'offers')).toHaveAttribute('aria-current', 'page');
  });
});

// What the details screen shows for one detail, found by the name the API
// gives it.
function detailOf(page: Page, detail: string) {
  return page.locator(`[data-detail="${detail}"] dd`);
}
