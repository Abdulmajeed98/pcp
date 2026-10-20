import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

import { apiUrl } from './platform';

// What a test gives an Offer it adds, as the API takes it. A price left out
// is not quoted, and the Offer is in stock unless the test says otherwise.
export interface OfferDetails {
  usdPrice?: string;
  iqdPrice?: number;
  inStock?: boolean;
  warrantyMonths?: number;
}

// Adds a made-up Vendor's Offer for a Part over HTTP, as the Admin acting for
// the Vendor, and gives back its identifier. Adding it is its first
// Confirmation, so it is confirmed today.
export async function addAnOffer(
  request: APIRequestContext,
  authorization: string,
  vendorId: string,
  partId: string,
  details: OfferDetails = { usdPrice: '349.99' },
): Promise<string> {
  const added = await request.post(`${apiUrl}/v1/vendors/${vendorId}/offers`, {
    headers: { authorization },
    data: { partId, inStock: true, ...details },
  });
  expect(added.status()).toBe(201);
  return ((await added.json()) as { id: string }).id;
}

// The Offers screen, the Vendor portal's first, told apart by its test id.
export function theOffersScreen(page: Page): Locator {
  return page.getByTestId('offers-screen');
}

// What the Offers screen says to a Vendor with no Offer.
export function noOffers(page: Page): Locator {
  return page.getByTestId('no-offers');
}

// The Offers listed on the screen, one row each.
export function listedOffers(page: Page): Locator {
  return page.getByTestId('offer');
}

// The row of the Offer for the Part of this name.
export function rowOfOffer(page: Page, partName: string): Locator {
  return listedOffers(page).filter({ hasText: partName });
}

// The banner that says Offers are expired or about to expire.
export function theBanner(page: Page): Locator {
  return page.getByTestId('expiry-banner');
}

// One of the portal's two sections in its top bar, found by where it leads,
// whatever language it is named in.
export function theSection(page: Page, section: 'offers' | 'details'): Locator {
  const sections = page.getByTestId('portal-sections');
  return section === 'details'
    ? sections.locator('a[href$="/details"]')
    : sections.locator('a').first();
}

// A Part as the Offers list answers it, made up for an answer the test gives.
function aPartOfTheAnswer(name: string) {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    category: 'gpu',
    name,
    manufacturer: 'Made-up Test Parts',
    partNumbers: ['TEST-ANSWERED'],
    photoPath: null,
  };
}

// The counts a test gives the screen in place of the Vendor's own.
export interface CountsGiven {
  offers: number;
  expired: number;
  aboutToExpire: number;
}

// Gives the page, whenever it lists the Vendor's Offers, an answer of the
// test's own: one Offer about to expire and one expired, and the counts the
// test gives, as `answerAsForALoginWithNoVendor` gives an answer of its own.
// Every other call reaches the real API, and once the page has asked it to
// confirm all the Offers, so does every list after it, which then holds the
// Vendor's own Offers, all of them confirmed.
export async function answerTheOffersAsExpiring(
  page: Page,
  vendorId: string,
  counts: CountsGiven,
): Promise<void> {
  const now = Date.now();
  const aDay = 24 * 60 * 60 * 1000;
  const offer = (name: string, days: number, expired: boolean) => ({
    id: `00000000-0000-4000-8000-${String(days).padStart(12, '0')}`,
    part: aPartOfTheAnswer(name),
    usdPrice: '1250.00',
    iqdPrice: 1_875_000,
    inStock: true,
    warrantyMonths: 12,
    confirmedAt: new Date(now - days * aDay).toISOString(),
    createdAt: new Date(now - 30 * aDay).toISOString(),
    daysSinceConfirmation: days,
    expired,
    aboutToExpire: !expired && days > 11,
  });
  const content = [
    offer('Made-up answered Part, expired', 20, true),
    offer('Made-up answered Part, about to expire', 12, false),
  ];

  let confirmed = false;
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      request.url() === `${apiUrl}/v1/vendors/${vendorId}/offers/confirm`
    ) {
      confirmed = true;
    }
  });

  await page.route(
    (url) => url.href.startsWith(`${apiUrl}/v1/vendors/${vendorId}/offers?`),
    (route) =>
      route.request().method() === 'GET' && !confirmed
        ? route.fulfill({
            json: {
              pageNumber: 0,
              pageSize: 20,
              totalElements: content.length,
              totalPages: 1,
              first: true,
              last: true,
              content,
              counts,
            },
          })
        : route.fallback(),
  );
}

// The Vendor portal's search of the catalog, from which an Offer is added.
export function theCatalogSearch(page: Page): Locator {
  return page.getByTestId('catalog-search');
}

// The Parts the catalog search found, one row each.
export function foundParts(page: Page): Locator {
  return page.getByTestId('found-part');
}

// The row of the Part of this name among those the search found.
export function rowOfFoundPart(page: Page, partName: string): Locator {
  return foundParts(page).filter({ hasText: partName });
}

// Searches the catalog from the Vendor portal: types the words and presses
// Enter, as a Vendor does on a phone's keyboard.
export async function searchTheCatalogFor(page: Page, words: string): Promise<void> {
  await theCatalogSearch(page).getByRole('searchbox').fill(words);
  await theCatalogSearch(page).getByRole('searchbox').press('Enter');
}

// The form for an Offer.
export function theOfferForm(page: Page): Locator {
  return page.getByTestId('offer-form');
}

// One of the Offer form's fields, found by the detail the API names it by.
export function offerField(
  page: Page,
  detail: 'usdPrice' | 'iqdPrice' | 'warrantyMonths',
): Locator {
  return page.locator(`#offer-form-${detail}`);
}

// The Offer form's switch for whether the Part is in stock.
export function inStockSwitch(page: Page): Locator {
  return theOfferForm(page).getByRole('switch');
}

// The form's button that saves the Offer, whatever language it is named in.
export function saveTheOffer(page: Page): Locator {
  return theOfferForm(page).locator('button[type="submit"]');
}

// Removes a made-up Vendor's Offer over HTTP, as the Admin acting for the
// Vendor.
export async function removeAnOffer(
  request: APIRequestContext,
  authorization: string,
  vendorId: string,
  offerId: string,
): Promise<void> {
  const removed = await request.delete(
    `${apiUrl}/v1/vendors/${vendorId}/offers/${offerId}`,
    { headers: { authorization } },
  );
  expect(removed.status()).toBe(204);
}

// The screen of one of the Vendor's Offers, the form that changes it.
export function theOfferScreen(page: Page): Locator {
  return page.getByTestId('offer-screen');
}

// The Offer screen's button that asks to remove the Offer.
export function removeTheOffer(page: Page): Locator {
  return theOfferScreen(page).getByTestId('remove-offer');
}

// The alert dialog that asks the Vendor to confirm the removal.
export function theRemovalDialog(page: Page): Locator {
  return page.getByTestId('remove-confirmation');
}
