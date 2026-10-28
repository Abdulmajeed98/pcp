import {
  type APIRequestContext,
  type Browser,
  expect,
  type Page,
  test,
} from '@playwright/test';

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
import {
  addAnOffer,
  foundParts,
  goToTheSection,
  inStockSwitch,
  noOffers,
  offerField,
  rowOfFoundPart,
  rowOfOffer,
  saveTheOffer,
  searchTheCatalogFor,
  theCatalogSearch,
  theOfferForm,
  theOffersScreen,
} from './offers';
import { aFrameAtMost, filmPlaces, travelOf } from './motion-film';
import { apiUrl, dashboardUrl } from './platform';
import { aMadeUpVendorThatHasLoggedIn } from './vendors';

const [kurdish, , english] = languages;

// A Vendor adds its Offers from the catalog search, on a phone (OFF-3,
// LANG-8). The browser is set to English, so the portal opens in English. No
// test quotes the portal's text, which the review of the translations may
// change: an element is found by its test id, where it leads or what it is.
// Prices, Part names and counts are not translations, and are read as they
// are. The development database holds made-up data from earlier runs, so
// each test searches by a made-up Part's own number, which finds that Part
// alone.
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

// Made-up Parts the Admin adds to the catalog over HTTP.
async function madeUpParts(browser: Browser, count: number): Promise<MadeUpPart[]> {
  return asTheAdmin(browser, async (request, authorization) => {
    const parts: MadeUpPart[] = [];
    for (let made = 0; made < count; made++) {
      parts.push(await createAMadeUpPart(request, authorization));
    }
    return parts;
  });
}

// The address of the form for a new Offer of a Part, as the search leads to
// it, with the search kept.
function theFormFor(part: MadeUpPart): string {
  return `${dashboardUrl}/add/${part.id}?search=${part.partNumber}`;
}

test.describe('a made-up Vendor with no Offer yet', () => {
  let vendor: VendorLoginDetails;
  let part: MadeUpPart;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
    [part] = await madeUpParts(browser, 1);
  });

  test("searches the catalog by a made-up Part's number, picks it, adds an Offer quoted only in USD with a warranty, returns to the search as it was, and sees the Offer in its list, confirmed today", async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor);
    await expect(noOffers(page)).toBeVisible();

    await noOffers(page).getByRole('link').click();
    await expect(page).toHaveURL(`${dashboardUrl}/add`);
    await searchTheCatalogFor(page, part.partNumber);
    await expect(foundParts(page)).toHaveCount(1);
    const row = rowOfFoundPart(page, part.name);
    await expect(row).toHaveAttribute('data-offered', 'false');
    await expectNoSidewaysScroll(page);

    await row.getByRole('link', { name: part.name }).click();
    await expect(page).toHaveURL(theFormFor(part));
    await expect(theOfferForm(page).getByTestId('part-name')).toHaveText(part.name);
    await expect(theOfferForm(page).getByTestId('part-numbers')).toHaveText(
      part.partNumber,
    );
    await expect(inStockSwitch(page)).toHaveAttribute('aria-checked', 'true');
    await offerField(page, 'usdPrice').fill('349.99');
    await offerField(page, 'warrantyMonths').fill('24');
    await expectNoSidewaysScroll(page);
    await saveTheOffer(page).click();

    await expect(page).toHaveURL(`${dashboardUrl}/add?search=${part.partNumber}`);
    await expect(theCatalogSearch(page).getByRole('searchbox')).toHaveValue(
      part.partNumber,
    );
    await expect(page.getByTestId('offer-added')).toContainText(part.name);
    await expect(rowOfFoundPart(page, part.name)).toHaveAttribute('data-offered', 'true');
    await expectNoSidewaysScroll(page);

    await page.getByTestId('offer-added').getByTestId('see-offers').click();
    await expect(page).toHaveURL(`${dashboardUrl}/`);
    const offer = rowOfOffer(page, part.name);
    await expect(offer.getByTestId('confirmation')).toHaveAttribute('data-state', 'today');
    await expect(offer.getByTestId('usd-price')).toHaveText('349.99 $');
    await expect(offer.getByTestId('iqd-price')).toHaveCount(0);
    await expect(offer.getByTestId('stock')).toHaveAttribute('data-in-stock', 'true');
    await expect(offer.getByTestId('warranty')).toContainText('24');
  });
});

test.describe('a made-up Vendor with an Offer added over HTTP', () => {
  let vendor: VendorLoginDetails;
  let offered: MadeUpPart;
  let offerId: string;
  let notOffered: MadeUpPart;
  let toAdd: MadeUpPart;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
    [offered, notOffered, toAdd] = await madeUpParts(browser, 3);
    offerId = await asTheAdmin(browser, (request, authorization) =>
      addAnOffer(request, authorization, vendor.vendorId, offered.id, {
        usdPrice: '349.99',
        iqdPrice: 525_000,
      }),
    );
  });

  test("the Offers screen's button, in the frame's bar on a phone, leads to the search, which marks the Part the Vendor offers and leads to its Offer", async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor);
    await expect(theOffersScreen(page)).toBeVisible();
    await page.getByRole('banner').getByTestId('add-offer').click();
    await expect(page).toHaveURL(`${dashboardUrl}/add`);

    await searchTheCatalogFor(page, offered.partNumber);
    const row = rowOfFoundPart(page, offered.name);
    await expect(row).toHaveAttribute('data-offered', 'true');
    await expect(row.getByTestId('offered')).toBeVisible();

    await row.getByRole('link', { name: offered.name }).click();
    await expect(page).toHaveURL(`${dashboardUrl}/offers/${offerId}`);
    await expect(theOfferForm(page).getByTestId('part-name')).toHaveText(offered.name);
    await expect(offerField(page, 'usdPrice')).toHaveValue('349.99');
    await expect(offerField(page, 'iqdPrice')).toHaveValue('525,000');
    await expectNoSidewaysScroll(page);
  });

  test("an Offer with no price is refused beside the USD field, and the refusal's text differs between Kurdish and English", async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, theFormFor(notOffered));
    await expect(theOfferForm(page)).toBeVisible();

    const answered = page.waitForResponse(
      (response) =>
        response.url() === `${apiUrl}/v1/vendors/${vendor.vendorId}/offers` &&
        response.request().method() === 'POST',
    );
    await saveTheOffer(page).click();
    expect((await answered).status()).toBe(400);

    const usdPrice = offerField(page, 'usdPrice');
    const refusal = page
      .getByTestId('usdPrice-field')
      .locator('#offer-form-usdPrice-error');
    await expect(refusal).toBeVisible();
    await expect(usdPrice).toHaveAttribute('aria-invalid', 'true');
    await expect(usdPrice).toHaveAttribute('aria-describedby', /offer-form-usdPrice-error/);
    await expect(usdPrice).toBeFocused();
    await expect(page.locator('[data-slot="field-error"]')).toHaveCount(1);
    await expect(page.getByTestId('refusal')).toHaveCount(0);
    await expect(page).toHaveURL(theFormFor(notOffered));

    const inEnglish = await refusal.innerText();
    await chooseInThePortal(page, kurdish);
    await expect(refusal).not.toHaveText(inEnglish);
    const inKurdish = await refusal.innerText();
    expect(inKurdish).not.toBe('');
    await chooseInThePortal(page, english);
    await expect(refusal).toHaveText(inEnglish);
  });

  test('the search with results, and the note that an Offer was added, meet the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, theFormFor(toAdd));
    await offerField(page, 'usdPrice').fill('99.50');
    await saveTheOffer(page).click();
    await expect(page.getByTestId('offer-added')).toBeVisible();
    await expect(rowOfFoundPart(page, toAdd.name).getByTestId('offered')).toBeVisible();

    await expectAccessible(page);
  });

  test('the form with a refusal shown meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, theFormFor(notOffered));
    await saveTheOffer(page).click();
    await expect(page.locator('#offer-form-usdPrice-error')).toBeVisible();

    await expectAccessible(page);
  });
});

// The catalog search and the Offer form as the dashboard's DESIGN.md lays
// them out (redesign ticket 12).
test.describe('the catalog search and the Offer form, as a made-up Vendor', () => {
  let vendor: VendorLoginDetails;
  let first: MadeUpPart;
  let second: MadeUpPart;
  let third: MadeUpPart;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
    [first, second, third] = await madeUpParts(browser, 3);
  });

  test('on a phone the search has no button of its own, the count is in words and not on a plate, and a row has no picture but its part numbers in Geist Mono', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/add`);
    const search = theCatalogSearch(page);
    await expect(search.locator('search').getByRole('combobox')).toBeVisible();
    await expect(search.locator('search button')).toHaveCount(0);
    await expect(search.getByRole('searchbox')).toHaveCSS('font-size', '16px');

    await searchTheCatalogFor(page, first.partNumber);
    await expect(foundParts(page)).toHaveCount(1);
    await expect(page.getByTestId('parts-found-count')).toHaveText('1');
    await expect(search.locator('[data-slot="plate"]')).toHaveCount(0);
    const row = rowOfFoundPart(page, first.name);
    await expect(row.locator('img, svg')).toHaveCount(0);
    await expect(row.getByTestId('part-numbers')).toHaveCSS('font-family', /Geist Mono/);
    await expect(row).toHaveCSS('min-height', '72px');
    await expectNoSidewaysScroll(page);
  });

  test('from 64rem the Parts found are a table of Part and Part numbers, which meets the automated part of WCAG 2.2 level AA', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/add`);
    await searchTheCatalogFor(page, first.partNumber);

    const table = theCatalogSearch(page).getByRole('table');
    await expect(table.getByRole('columnheader')).toHaveCount(2);
    await expect(foundParts(page)).toHaveCount(1);
    expect(await foundParts(page).evaluate((row) => row.tagName)).toBe('TR');
    await expect(rowOfFoundPart(page, first.name).locator('img, svg')).toHaveCount(0);
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  });

  // The note after an Offer is added stays until the next search, and then
  // leaves as Motion 8 says: it fades, then its space closes, so that the
  // search below it rises into place and never jumps (the No Snap Rule).
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`the note after an Offer is added is a Confirmed Green card, and on the next search it leaves, the search rising smoothly (${reducedMotion})`, async ({
      page,
    }) => {
      const part = reducedMotion === 'reduce' ? third : second;
      await page.emulateMedia({ reducedMotion, colorScheme: 'light' });
      await openTheDashboardAs(page, vendor, theFormFor(part));
      await offerField(page, 'usdPrice').fill('99.50');
      await saveTheOffer(page).click();

      const note = page.getByTestId('offer-added');
      await expect(note).toContainText(part.name);
      await expect(note).toHaveCSS('border-top-color', 'rgb(30, 123, 79)');
      await expect(note).toHaveCSS('border-top-left-radius', '8px');
      await expect(note).toHaveCSS('opacity', '1');

      const searchbox = theCatalogSearch(page).getByRole('searchbox');
      const frames = await filmPlaces(page, { searchbox }, () =>
        searchTheCatalogFor(page, first.partNumber),
      );
      await expect(note).toHaveCount(0);
      await expect(foundParts(page)).toHaveCount(1);
      const { moved, mostInAFrame } = travelOf(frames, 'searchbox');
      expect(moved, 'the search rises into the space the note gave up').toBeGreaterThan(40);
      expect(mostInAFrame, 'the search never jumps').toBeLessThanOrEqual(
        aFrameAtMost(moved),
      );
    });
  }

  test("from 64rem the Offer form is one column at most 40rem wide, its Part on Raised Stone with no edge, a Part with no photo showing its Category's icon plain at 32 pixels", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ colorScheme: 'light' });
    await openTheDashboardAs(page, vendor, theFormFor(first));
    const form = theOfferForm(page);
    await expect(form).toBeVisible();

    const width = (await form.boundingBox())?.width ?? 0;
    expect(width).toBeGreaterThan(400);
    expect(width).toBeLessThanOrEqual(640);
    const usd = await page.getByTestId('usdPrice-field').boundingBox();
    const iqd = await page.getByTestId('iqdPrice-field').boundingBox();
    expect(iqd?.y ?? 0, 'each price on its own row').toBeGreaterThan(
      (usd?.y ?? 0) + (usd?.height ?? 0) - 1,
    );

    const offered = form.getByTestId('offered-part');
    await expect(offered).toHaveCSS('background-color', 'rgb(245, 244, 242)');
    await expect(offered).toHaveCSS('border-top-width', '0px');
    await expect(offered).toHaveCSS('border-top-left-radius', '8px');
    const picture = offered.getByTestId('part-picture');
    await expect(picture).toHaveCSS('width', '32px');
    await expect(picture).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(picture.locator('svg')).toHaveCSS('color', 'rgb(93, 95, 96)');
    await expect(offered.getByTestId('part-numbers')).toHaveCSS(
      'font-family',
      /Geist Mono/,
    );
    await expectNoSidewaysScroll(page);
  });
});

test.describe('a made-up Vendor adding an Offer typed as a Kurdish or an Arabic keyboard writes it', () => {
  let vendor: VendorLoginDetails;
  let part: MadeUpPart;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
    [part] = await madeUpParts(browser, 1);
  });

  test('prices typed in Arabic-Indic and Eastern Arabic-Indic digits, with separators, are saved as their values', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, theFormFor(part));
    // 1,250.50 with the Arabic thousands and decimal separators, and
    // 1,875,000 in Eastern Arabic-Indic digits grouped by spaces.
    await offerField(page, 'usdPrice').fill('١٬٢٥٠٫٥٠');
    await offerField(page, 'iqdPrice').fill('۱ ۸۷۵ ۰۰۰');
    await offerField(page, 'warrantyMonths').fill('١٢');

    const sent = page.waitForRequest(
      (request) =>
        request.url() === `${apiUrl}/v1/vendors/${vendor.vendorId}/offers` &&
        request.method() === 'POST',
    );
    await saveTheOffer(page).click();
    expect((await sent).postDataJSON()).toEqual({
      partId: part.id,
      usdPrice: '1250.50',
      iqdPrice: 1_875_000,
      inStock: true,
      warrantyMonths: 12,
    });
    await expect(page.getByTestId('offer-added')).toBeVisible();

    await goToTheSection(page, 'offers');
    const offer = rowOfOffer(page, part.name);
    await expect(offer.getByTestId('usd-price')).toHaveText('1,250.50 $');
    await expect(offer.getByTestId('iqd-price')).toHaveText('1,875,000 IQD');
    await expect(offer.getByTestId('warranty')).toContainText('12');
  });
});

test.describe('the development Admin acting as a made-up Vendor', () => {
  let vendor: VendorLoginDetails;
  let part: MadeUpPart;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
    [part] = await madeUpParts(browser, 1);
  });

  test('adds an Offer under the band, from the search, and the Vendor, logged in, sees it', async ({
    page,
    browser,
  }) => {
    const portal = `${dashboardUrl}/vendors/${vendor.vendorId}/portal`;
    await logInToTheDashboard(page, developmentAdmin, portal);
    await expect(page.getByTestId('acting-band')).toBeVisible();

    await theOffersScreen(page).getByTestId('add-first-offer').click();
    await expect(page).toHaveURL(`${portal}/add`);
    await searchTheCatalogFor(page, part.partNumber);
    await rowOfFoundPart(page, part.name).getByRole('link', { name: part.name }).click();
    await expect(page).toHaveURL(`${portal}/add/${part.id}?search=${part.partNumber}`);
    await offerField(page, 'iqdPrice').fill('525,000');
    await saveTheOffer(page).click();

    await expect(page).toHaveURL(`${portal}/add?search=${part.partNumber}`);
    await expect(page.getByTestId('acting-band')).toBeVisible();
    await expect(page.getByTestId('offer-added')).toContainText(part.name);

    await seenByTheVendor(browser, vendor, async (vendorsPage) => {
      const offer = rowOfOffer(vendorsPage, part.name);
      await expect(offer.getByTestId('iqd-price')).toHaveText('525,000 IQD');
      await expect(offer.getByTestId('usd-price')).toHaveCount(0);
    });
  });
});

// Opens the Vendor's own portal, in a browser of its own, and lets the test
// look at it.
async function seenByTheVendor(
  browser: Browser,
  vendor: VendorLoginDetails,
  look: (page: Page) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext({ viewport: narrowWindow, locale: 'en' });
  try {
    const page = await context.newPage();
    await openTheDashboardAs(page, vendor);
    await look(page);
  } finally {
    await context.close();
  }
}
