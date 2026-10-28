import { type APIRequestContext, type Browser, expect, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { createAMadeUpPart, type MadeUpPart } from './catalog';
import {
  authorizationOfTheDevelopmentAdmin,
  developmentAdmin,
  logInToTheDashboard,
  openTheDashboardAs,
} from './development-logins';
import { type VendorLoginDetails } from './keycloak-screens';
import {
  chooseInThePortal,
  expectNoSidewaysScroll,
  languages,
  narrowWindow,
} from './languages';
import { aFrameAtMost, filmPlaces, travelOf } from './motion-film';
import {
  addAnOffer,
  inStockSwitch,
  offerField,
  removeAnOffer,
  removeTheOffer,
  rowOfOffer,
  saveTheOffer,
  theOfferForm,
  theOfferScreen,
  theRemovalDialog,
} from './offers';
import { apiUrl, dashboardUrl } from './platform';
import { aMadeUpVendorThatHasLoggedIn } from './vendors';

const [kurdish] = languages;

// A Vendor changes one of its Offers, or removes it after confirming, on a
// phone (OFF-4, OFF-5). The browser is set to English, so the portal opens
// in English. No test quotes the portal's text, which the review of the
// translations may change: an element is found by its test id, where it
// leads or what it is. The development database holds made-up data from
// earlier runs, so each test works on a made-up Vendor and made-up Parts of
// its own.
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

// A made-up Part the Admin adds to the catalog, and the Vendor's Offer for it,
// quoted only in USD, in stock and with no warranty, both over HTTP.
async function anOfferOf(
  browser: Browser,
  vendor: VendorLoginDetails,
): Promise<{ part: MadeUpPart; offerId: string }> {
  return asTheAdmin(browser, async (request, authorization) => {
    const part = await createAMadeUpPart(request, authorization);
    const offerId = await addAnOffer(request, authorization, vendor.vendorId, part.id, {
      usdPrice: '349.99',
    });
    return { part, offerId };
  });
}

// The DELETE of the Offer, as the page sends it.
function isTheRemoval(vendor: VendorLoginDetails, offerId: string) {
  return (url: URL) =>
    url.href === `${apiUrl}/v1/vendors/${vendor.vendorId}/offers/${offerId}`;
}

test.describe('a made-up Vendor with Offers added over HTTP', () => {
  let vendor: VendorLoginDetails;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  });

  test('opens an Offer from its row, changes it to quote IQD too and to be out of stock, and the list shows both prices and the stock, confirmed today', async ({
    page,
    browser,
  }) => {
    const { part, offerId } = await anOfferOf(browser, vendor);
    await openTheDashboardAs(page, vendor);

    await rowOfOffer(page, part.name).getByRole('link', { name: part.name }).click();
    await expect(page).toHaveURL(`${dashboardUrl}/offers/${offerId}`);
    await expect(theOfferForm(page).getByTestId('part-name')).toHaveText(part.name);
    await expect(offerField(page, 'usdPrice')).toHaveValue('349.99');
    await expect(offerField(page, 'iqdPrice')).toHaveValue('');
    await expect(offerField(page, 'warrantyMonths')).toHaveValue('');
    await expect(inStockSwitch(page)).toHaveAttribute('aria-checked', 'true');
    await expectNoSidewaysScroll(page);

    await offerField(page, 'iqdPrice').fill('525,000');
    await inStockSwitch(page).click();
    await expect(inStockSwitch(page)).toHaveAttribute('aria-checked', 'false');
    const sent = page.waitForRequest(
      (request) =>
        request.url() === `${apiUrl}/v1/vendors/${vendor.vendorId}/offers/${offerId}` &&
        request.method() === 'PUT',
    );
    await saveTheOffer(page).click();
    expect((await sent).postDataJSON()).toEqual({
      usdPrice: '349.99',
      iqdPrice: 525_000,
      inStock: false,
      warrantyMonths: null,
    });

    await expect(page).toHaveURL(`${dashboardUrl}/`);
    const offer = rowOfOffer(page, part.name);
    await expect(offer.getByTestId('usd-price')).toHaveText('349.99 $');
    await expect(offer.getByTestId('iqd-price')).toHaveText('525,000 IQD');
    await expect(offer.getByTestId('stock')).toHaveAttribute('data-in-stock', 'false');
    await expect(offer.getByTestId('confirmation')).toHaveAttribute('data-state', 'today');
  });

  test('removes an Offer after confirming, and the list no longer holds it; cancelling first changes nothing', async ({
    page,
    browser,
  }) => {
    const { part, offerId } = await anOfferOf(browser, vendor);
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/offers/${offerId}`);
    await expect(theOfferForm(page)).toBeVisible();
    const removals: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'DELETE') removals.push(request.url());
    });

    await removeTheOffer(page).click();
    await expect(theRemovalDialog(page)).toBeVisible();
    await expect(theRemovalDialog(page).getByTestId('part-name')).toHaveText(part.name);
    await expectNoSidewaysScroll(page);
    await theRemovalDialog(page).getByTestId('cancel-removal').click();
    await expect(theRemovalDialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(`${dashboardUrl}/offers/${offerId}`);
    expect(removals).toEqual([]);

    await removeTheOffer(page).click();
    await theRemovalDialog(page).getByTestId('confirm-removal').click();

    await expect(page).toHaveURL(`${dashboardUrl}/`);
    await expect(page.getByTestId('offers-screen')).toBeVisible();
    await expect(rowOfOffer(page, part.name)).toHaveCount(0);
    expect(removals).toEqual([`${apiUrl}/v1/vendors/${vendor.vendorId}/offers/${offerId}`]);
  });

  test('the dialog says a refusal, and stays open until the removal is done', async ({
    page,
    browser,
  }) => {
    const { part, offerId } = await anOfferOf(browser, vendor);
    const theRemoval = isTheRemoval(vendor, offerId);
    await page.route(theRemoval, (route) =>
      route.request().method() === 'DELETE'
        ? route.fulfill({
            status: 503,
            json: { errors: [{ code: 'SERVICE_UNAVAILABLE', title: 'x', detail: 'y' }] },
          })
        : route.fallback(),
    );
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/offers/${offerId}`);

    await removeTheOffer(page).click();
    await theRemovalDialog(page).getByTestId('confirm-removal').click();
    await expect(theRemovalDialog(page).getByRole('alert')).toContainText('503');
    await expect(theRemovalDialog(page)).toBeVisible();
    await expect(page).toHaveURL(`${dashboardUrl}/offers/${offerId}`);

    await page.unroute(theRemoval);
    await theRemovalDialog(page).getByTestId('confirm-removal').click();
    await expect(page).toHaveURL(`${dashboardUrl}/`);
    await expect(rowOfOffer(page, part.name)).toHaveCount(0);
  });

  test('an Offer removed since, opened by an old link, says that it no longer exists, and leads to the Offers', async ({
    page,
    browser,
  }) => {
    const { offerId } = await anOfferOf(browser, vendor);
    await asTheAdmin(browser, (request, authorization) =>
      removeAnOffer(request, authorization, vendor.vendorId, offerId),
    );

    await openTheDashboardAs(page, vendor, `${dashboardUrl}/offers/${offerId}`);

    const gone = theOfferScreen(page).getByTestId('offer-gone');
    await expect(gone).toBeVisible();
    await expect(theOfferForm(page)).toHaveCount(0);
    await expect(page.getByTestId('refusal')).toHaveCount(0);
    await gone.getByRole('link').click();
    await expect(page).toHaveURL(`${dashboardUrl}/`);
  });

  test('the form, with the removal dialog open, meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
    browser,
  }) => {
    const { offerId } = await anOfferOf(browser, vendor);
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/offers/${offerId}`);
    await expect(theOfferForm(page)).toBeVisible();
    await expectAccessible(page);

    await removeTheOffer(page).click();
    await expect(theRemovalDialog(page)).toBeVisible();
    await expectAccessible(page);
  });
});

test.describe("the in-stock switch's thumb, as a made-up Vendor", () => {
  let vendor: VendorLoginDetails;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  });

  // DESIGN.md's Motion 4 and its reduced motion: the thumb slides in 150 ms
  // on the out curve, or in 100 ms with reduced motion, and never jumps
  // (the No Snap Rule). It travels to the end side when on, in either
  // direction.
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    const duration = reducedMotion === 'reduce' ? '0.1s' : '0.15s';

    test(`travels to the end side in ${duration} on the out curve, never in one frame, mirrored in Kurdish (${reducedMotion})`, async ({
      page,
      browser,
    }) => {
      const { offerId } = await anOfferOf(browser, vendor);
      await page.emulateMedia({ reducedMotion });
      await openTheDashboardAs(page, vendor, `${dashboardUrl}/offers/${offerId}`);
      const track = inStockSwitch(page);
      const thumb = track.locator('[data-slot="switch-thumb"]');
      await expect(track).toHaveAttribute('aria-checked', 'true');
      await expect(thumb).toHaveCSS('transition-duration', duration);
      await expect(thumb).toHaveCSS(
        'transition-timing-function',
        'cubic-bezier(0.23, 1, 0.32, 1)',
      );

      // Where the thumb stands in its track: its centre against the track's.
      const side = async () => {
        const [inner, outer] = [await thumb.boundingBox(), await track.boundingBox()];
        if (inner === null || outer === null) throw new Error('the switch is not drawn');
        return inner.x + inner.width / 2 > outer.x + outer.width / 2 ? 'right' : 'left';
      };
      expect(await side()).toBe('right');

      const frames = await filmPlaces(page, { thumb }, () => track.click(), {
        forMs: 1000,
      });
      await expect(track).toHaveAttribute('aria-checked', 'false');
      const { moved, mostInAFrame } = travelOf(frames, 'thumb');
      expect(moved, 'the thumb crosses its track').toBeGreaterThan(15);
      expect(mostInAFrame, 'the thumb never jumps').toBeLessThanOrEqual(
        aFrameAtMost(moved),
      );
      expect(await side()).toBe('left');

      await chooseInThePortal(page, kurdish);
      expect(await side(), 'off, it stands on the start side, the right').toBe('right');
      await track.click();
      await expect(track).toHaveAttribute('aria-checked', 'true');
      await expect
        .poll(side, { message: 'on, it travels to the end side, the left' })
        .toBe('left');
    });
  }
});

test.describe('the development Admin acting as a made-up Vendor', () => {
  let vendor: VendorLoginDetails;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  });

  test('changes an Offer under the band, and returns to the Offers under it', async ({
    page,
    browser,
  }) => {
    const { part, offerId } = await anOfferOf(browser, vendor);
    const portal = `${dashboardUrl}/vendors/${vendor.vendorId}/portal`;
    await logInToTheDashboard(page, developmentAdmin, portal);
    await expect(page.getByTestId('acting-band')).toBeVisible();

    await rowOfOffer(page, part.name).getByRole('link', { name: part.name }).click();
    await expect(page).toHaveURL(`${portal}/offers/${offerId}`);
    await expect(page.getByTestId('acting-band')).toBeVisible();
    await offerField(page, 'usdPrice').fill('329.50');
    await offerField(page, 'warrantyMonths').fill('6');
    await saveTheOffer(page).click();

    await expect(page).toHaveURL(`${portal}`);
    await expect(page.getByTestId('acting-band')).toBeVisible();
    const offer = rowOfOffer(page, part.name);
    await expect(offer.getByTestId('usd-price')).toHaveText('329.50 $');
    await expect(offer.getByTestId('warranty')).toContainText('6');
  });
});
