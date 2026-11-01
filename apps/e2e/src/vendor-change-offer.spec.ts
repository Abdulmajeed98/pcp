import { type APIRequestContext, type Browser, expect, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { expectCentredInTheWindow, expectTheEmptyState } from './empty-state';
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
  layoutOf,
  narrowWindow,
} from './languages';
import { filmPlaces, snapsOfThePlace, travelOf } from './motion-film';
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

const [kurdish, , english] = languages;

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
    // Centred in the window, as the not-found screens are (the owner's
    // "Centred in window", redesign ticket 12).
    await expectTheEmptyState(gone, gone.locator('[data-slot="empty-title"]'));
    await expectCentredInTheWindow(gone, gone.locator('[data-slot="empty-title"]'));
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

// An Offer's own screen as the dashboard's DESIGN.md lays it out (redesign
// ticket 12): under its title the leading plate, the Offer's price as
// Shoppers see it, with its Confirmation beside it, muted when out of
// stock; then the form, and below it Remove the Offer on a row of its own,
// as wide as the form on a phone.
// The owner's "Own line" (redesign ticket 12): the removal's dialog names
// the Part on a line of its own under its question, left to right in every
// language, so that a long English name is never broken through a
// right-to-left sentence.
test.describe("the removal's dialog, as a made-up Vendor", () => {
  let vendor: VendorLoginDetails;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  });

  test('names the Part on a line of its own under the question, left to right, in English and in Kurdish', async ({
    page,
    browser,
  }) => {
    const { part, offerId } = await anOfferOf(browser, vendor);
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/offers/${offerId}`);

    for (const language of [kurdish, english]) {
      await chooseInThePortal(page, language);
      await removeTheOffer(page).click();
      const dialog = theRemovalDialog(page);
      const name = dialog.getByTestId('part-name');
      await expect(name).toHaveText(part.name);
      const [question, line, sentence] = await Promise.all([
        dialog.getByRole('heading').boundingBox(),
        name.boundingBox(),
        dialog.locator('[data-slot="alert-dialog-description"]').boundingBox(),
      ]);
      expect(line?.y ?? 0, 'under the question').toBeGreaterThanOrEqual(
        (question?.y ?? 0) + (question?.height ?? 0),
      );
      expect(
        (line?.y ?? 0) + (line?.height ?? 0),
        'above the sentence',
      ).toBeLessThanOrEqual(sentence?.y ?? 0);
      expect(await layoutOf(name)).toEqual({ direction: 'ltr', keptApart: true });
      await expect(
        dialog,
        'the dialog is described by the name and its sentence',
      ).toHaveAccessibleDescription(new RegExp(`^${part.name}\\s.+`));
      await expect(
        dialog.locator('[data-slot="alert-dialog-description"]').getByTestId('part-name'),
        'the sentence does not hold the name',
      ).toHaveCount(0);
      await dialog.getByTestId('cancel-removal').click();
      await expect(dialog).toHaveCount(0);
    }
  });
});

test.describe("an Offer's own screen, as a made-up Vendor", () => {
  let vendor: VendorLoginDetails;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  });

  test('leads with the Offer on one large plate, both prices on it, with its Confirmation beside it, and Remove the Offer below the form as wide as it', async ({
    page,
    browser,
  }) => {
    const offerId = await asTheAdmin(browser, async (request, authorization) => {
      const part = await createAMadeUpPart(request, authorization);
      return addAnOffer(request, authorization, vendor.vendorId, part.id, {
        usdPrice: '1250.50',
        iqdPrice: 1_875_000,
      });
    });
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/offers/${offerId}`);
    const screen = theOfferScreen(page);
    await expect(theOfferForm(page)).toBeVisible();

    const plate = screen.getByTestId('leading-plate').locator('[data-slot="plate"]');
    await expect(plate).toHaveCount(1);
    await expect(plate.getByTestId('usd-price')).toHaveText('1,250.50 $');
    await expect(plate.getByTestId('iqd-price')).toHaveText('1,875,000 IQD');
    await expect(plate.getByTestId('usd-price')).toHaveCSS('font-size', '30px');
    // The decimal point and the grouping commas take no whole cell of the
    // figure: they are in Geist, the digits in Geist Mono.
    await expect(plate.getByTestId('usd-price')).toHaveCSS('font-family', /Geist Mono/);
    for (const mark of ['.', ',']) {
      await expect(
        plate.getByTestId('usd-price').locator('span', { hasText: mark }).last(),
      ).not.toHaveCSS('font-family', /Geist Mono/);
    }
    await expect(plate).toHaveCSS('border-top-left-radius', '6px');
    await expect(plate).not.toHaveAttribute('data-muted', '');
    await expect(
      screen.getByTestId('leading-plate').getByTestId('confirmation'),
    ).toHaveAttribute('data-state', 'today');
    await expect(screen.locator('[data-slot="plate"]')).toHaveCount(1);

    const title = await screen.getByRole('heading', { level: 1 }).boundingBox();
    const plateBox = await plate.boundingBox();
    const form = await theOfferForm(page).boundingBox();
    const remove = await removeTheOffer(page).boundingBox();
    expect(plateBox?.y ?? 0, 'the plate is under the title').toBeGreaterThan(title?.y ?? 0);
    expect(form?.y ?? 0, 'and above the form').toBeGreaterThan(plateBox?.y ?? 0);
    expect(remove?.y ?? 0, 'Remove is below the form').toBeGreaterThanOrEqual(
      (form?.y ?? 0) + (form?.height ?? 0),
    );
    expect(remove?.width, 'and as wide as it on a phone').toBeCloseTo(form?.width ?? 0, 0);
    await expectNoSidewaysScroll(page);
  });

  test("an Offer out of stock leads with its plate muted, and an Offer's screen meets the automated part of WCAG 2.2 level AA from 64rem", async ({
    page,
    browser,
  }) => {
    const offerId = await asTheAdmin(browser, async (request, authorization) => {
      const part = await createAMadeUpPart(request, authorization);
      return addAnOffer(request, authorization, vendor.vendorId, part.id, {
        iqdPrice: 150_000_000,
        inStock: false,
      });
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/offers/${offerId}`);

    const plate = theOfferScreen(page)
      .getByTestId('leading-plate')
      .locator('[data-slot="plate"]');
    await expect(plate).toHaveAttribute('data-muted', '');
    await expect(plate.getByTestId('iqd-price')).toHaveText('150,000,000 IQD');
    await expect(plate.getByTestId('usd-price')).toHaveCount(0);
    const form = (await theOfferForm(page).boundingBox())?.width ?? 0;
    expect(form).toBeLessThanOrEqual(640);
    await expectNoSidewaysScroll(page);
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
      const moved = travelOf(frames, 'thumb');
      expect(moved, 'the thumb crosses its track').toBeGreaterThan(15);
      expect(snapsOfThePlace(frames, 'thumb'), 'the thumb never jumps').toEqual([]);
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
