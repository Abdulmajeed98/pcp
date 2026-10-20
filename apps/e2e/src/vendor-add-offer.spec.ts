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
import { buttonFor, expectNoSidewaysScroll, languages, narrowWindow } from './languages';
import {
  addAnOffer,
  foundParts,
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
  theSection,
} from './offers';
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

    await theSection(page, 'offers').click();
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

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
    [offered, notOffered] = await madeUpParts(browser, 2);
    offerId = await asTheAdmin(browser, (request, authorization) =>
      addAnOffer(request, authorization, vendor.vendorId, offered.id, {
        usdPrice: '349.99',
        iqdPrice: 525_000,
      }),
    );
  });

  test("the Offers screen's button leads to the search, which marks the Part the Vendor offers and leads to its Offer", async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor);
    await theOffersScreen(page).getByTestId('add-offer').click();
    await expect(page).toHaveURL(`${dashboardUrl}/add`);

    await searchTheCatalogFor(page, offered.partNumber);
    const row = rowOfFoundPart(page, offered.name);
    await expect(row).toHaveAttribute('data-offered', 'true');
    await expect(row.getByTestId('offered')).toBeVisible();

    await row.getByRole('link', { name: offered.name }).click();
    await expect(page).toHaveURL(`${dashboardUrl}/offers/${offerId}`);
    const screen = page.getByTestId('offer-screen');
    await expect(screen.getByTestId('part-name')).toHaveText(offered.name);
    await expect(screen.getByTestId('usd-price')).toHaveText('349.99 $');
    await expect(screen.getByTestId('iqd-price')).toHaveText('525,000 IQD');
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
    await buttonFor(page, kurdish).click();
    await expect(refusal).not.toHaveText(inEnglish);
    const inKurdish = await refusal.innerText();
    expect(inKurdish).not.toBe('');
    await buttonFor(page, english).click();
    await expect(refusal).toHaveText(inEnglish);
  });

  test('the search with results meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/add`);
    await searchTheCatalogFor(page, offered.partNumber);
    await expect(rowOfFoundPart(page, offered.name).getByTestId('offered')).toBeVisible();

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

    await theSection(page, 'offers').click();
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
