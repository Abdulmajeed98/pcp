import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

import { createAMadeUpPart } from './catalog';
import type { Currency } from './currencies';
import { addAnOffer } from './offers';
import { apiUrl } from './platform';
import { createAMadeUpVendor } from './vendors';

// The eight Categories, by the API's key for each and its name in the Shopper
// app's addresses, in the catalog's order. They are written out here and not
// read from the platform's code, so that an address that changes there fails
// here.
export const categories = [
  { key: 'cpu', inTheAddress: 'cpu' },
  { key: 'cpuCooler', inTheAddress: 'cpu-cooler' },
  { key: 'motherboard', inTheAddress: 'motherboard' },
  { key: 'ram', inTheAddress: 'ram' },
  { key: 'storage', inTheAddress: 'storage' },
  { key: 'gpu', inTheAddress: 'gpu' },
  { key: 'case', inTheAddress: 'case' },
  { key: 'psu', inTheAddress: 'psu' },
] as const;

export type CategoryKey = (typeof categories)[number]['key'];

// A Category's item on a sheet, the home page's or the not-found page's.
export function itemOf(page: Page, category: CategoryKey): Locator {
  return page.getByTestId(`category-${category}`);
}

// The link of a Category's item, which carries its name.
export function linkOf(page: Page, category: CategoryKey): Locator {
  return itemOf(page, category).getByRole('link');
}

// The items of the eight Categories on the page, in the order they are shown.
export function categoryItems(page: Page): Locator {
  return page.locator(
    categories.map(({ key }) => `[data-testid="category-${key}"]`).join(', '),
  );
}

// What an item prints at its end, the Category's count, and on its second
// line, its first Part.
export function endOf(item: Locator): Locator {
  return item.getByTestId('item-end');
}

export function secondLineOf(item: Locator): Locator {
  return item.getByTestId('item-second');
}

// A whole number as the platform writes it in every language, in Western
// digits grouped in thousands with commas, found as a number of its own: not
// as a part of a larger one.
export function theNumber(count: number): RegExp {
  return new RegExp(`(^|[^\\d,])${count.toLocaleString('en-US')}([^\\d,]|$)`);
}

// A Shown Price as the API answers it.
export interface ShownPrice {
  currency: Currency;
  amount: string;
  converted: boolean;
}

// The mark every price carries after its figure, the same in every language.
export const marks: Record<Currency, string> = { IQD: 'IQD', USD: '$' };

// A Shown Price as the platform writes it in every language, worked out here
// from what the API answers, so that a page that writes it otherwise fails:
// Western digits grouped in thousands, the dollars' cents unless they are
// none, "≈" before a converted one, and its mark after it.
export function shownPriceText(price: ShownPrice): string {
  const [whole, cents = '00'] = price.amount.split('.');
  const grouped = Number(whole).toLocaleString('en-US');
  const figure =
    price.currency === 'USD' && cents !== '00' ? `${grouped}.${cents}` : grouped;
  return `${price.converted ? '≈ ' : ''}${figure} ${marks[price.currency]}`;
}

// A Visible Part as a Category's list answers it, as far as the tests read it.
export interface VisiblePart {
  id: string;
  name: string;
  vendorCount: number;
  inStock: boolean;
  lowestPrice: ShownPrice | null;
}

// The first page of a Category's list, in a currency, as the API answers it
// to anyone.
export async function theFirstPageOf(
  request: APIRequestContext,
  category: CategoryKey,
  currency: Currency,
): Promise<{ totalElements: number; content: VisiblePart[] }> {
  const answer = await request.get(`${apiUrl}/v1/visible-parts`, {
    params: { category, currency },
  });
  expect(answer.status()).toBe(200);
  return (await answer.json()) as { totalElements: number; content: VisiblePart[] };
}

// The Part the home page's plate shows, worked out from the first pages of
// the eight lists as the API answers them (DESIGN.md's One Part, on the
// plate): the Visible Part with the most Vendors, the first of them in the
// catalog's order and its list's when several have as many.
export function thePartForThePlate(
  firstPages: readonly { content: VisiblePart[] }[],
): VisiblePart | undefined {
  let chosen: VisiblePart | undefined;
  for (const { content } of firstPages) {
    for (const part of content) {
      if (chosen === undefined || part.vendorCount > chosen.vendorCount) chosen = part;
    }
  }
  return chosen;
}

// A Part's Visible Offer as the API answers it, as far as the tests read it.
export interface ListedOffer {
  inStock: boolean;
  shownPrice: ShownPrice | null;
  daysSinceConfirmation: number;
  vendor: { name: string };
}

// A Part's Visible Offers, in a currency, in the API's order: in stock first,
// then the lowest Shown Price.
export async function theOffersOf(
  request: APIRequestContext,
  partId: string,
  currency: Currency,
): Promise<ListedOffer[]> {
  const answer = await request.get(`${apiUrl}/v1/parts/${partId}/offers`, {
    params: { currency },
  });
  expect(answer.status()).toBe(200);
  return (await answer.json()) as ListedOffer[];
}

// The platform's figures, as the API answers them to anyone.
export interface PlatformFigures {
  activeVendorCount: number;
  visibleOfferCount: number;
  iqdPerUsd: number | null;
  daysAnOfferStaysCurrent: number;
}

export async function thePlatformsFigures(
  request: APIRequestContext,
): Promise<PlatformFigures> {
  const answer = await request.get(`${apiUrl}/v1/platform-figures`);
  expect(answer.status()).toBe(200);
  return (await answer.json()) as PlatformFigures;
}

// Makes sure the home page shows a price in each currency: a made-up
// Vendor's Offer, in stock and quoted in dollars and in dinars, for a
// made-up CPU. The development database keeps what earlier runs left, so the
// CPU shown first may be another run's; what this makes sure of is that the
// first CPU on the list has a Lowest Price in each currency, since a Part
// in stock with a price comes before every Part without.
export async function aPartWithPricesInBothCurrencies(
  request: APIRequestContext,
  authorization: string,
): Promise<void> {
  const vendor = await createAMadeUpVendor(request, authorization);
  const part = await createAMadeUpPart(request, authorization);
  await addAnOffer(request, authorization, vendor.id, part.id, {
    usdPrice: '199.00',
    iqdPrice: 313000,
  });
}

// The scheme switch, which the frame holds on every page of the Shopper app,
// after the language switch.
export function schemeSwitch(page: Page): Locator {
  return page.getByTestId('scheme-switch');
}

// One of the three schemes' choices, by the scheme it sends, which is the
// same in every language. From 48rem the switch shows the three.
export function schemeChoice(page: Page, scheme: 'light' | 'dark' | 'device'): Locator {
  return schemeSwitch(page).locator(`li button[name="scheme"][value="${scheme}"]`);
}

// The phone's one button, which turns through the three schemes.
export function schemeTurn(page: Page): Locator {
  return page.getByTestId('scheme-turn');
}

// One of the home page's printed pieces, as a film sees it in a frame.
export interface APrintedPiece {
  // The top of its box, in the page's own coordinates, so that a scroll
  // moves it not at all.
  top: number;
  height: number;
  // How much of it is still covered, from its foot up, in pixels.
  covered: number;
  // What the page's script says it is doing: `waiting`, `printing`, or
  // nothing, as the server sent it.
  state: string | null;
}

// What a film of the printed pieces sees in one frame (DESIGN.md's What
// moves): the page's sheet; the first Category's count, where its start is
// and how opaque it is, as it settles; the price slip; and the slip's stamp,
// its scale and opacity, as it lands. One that is not on the page is null.
export interface PrintedPieces {
  sheet: APrintedPiece | null;
  count: { left: number; opacity: number } | null;
  slip: APrintedPiece | null;
  stamp: { scale: number; opacity: number } | null;
}

// Looks at the printed pieces in a frame. It runs in the page, so it uses
// nothing but the page's own globals.
export function lookAtThePrintedPieces(): PrintedPieces {
  // A length of a clip, in pixels, on a piece `height` tall: a percentage, a
  // length, or a sum of the two, as the browser writes one midway. Near the
  // end of a print the browser writes a tiny one with an exponent, such as
  // `1.2e-05%`, which is read whole.
  const inPixels = (length: string, height: number) =>
    [...length.matchAll(/(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(%|px)/gi)].reduce(
      (sum, [, amount, unit]) =>
        sum + (unit === '%' ? (Number(amount) / 100) * height : Number(amount)),
      0,
    );
  // How much of a piece its clip covers from its foot: the third length of
  // its inset, or the first when it has one only.
  const coveredOf = (clip: string, height: number) => {
    const inside = /^inset\((.*)\)$/.exec(clip)?.[1] ?? '';
    const lengths: string[] = [];
    let depth = 0;
    let current = '';
    for (const character of inside) {
      if (character === '(') depth += 1;
      if (character === ')') depth -= 1;
      if (character === ' ' && depth === 0) {
        if (current !== '') lengths.push(current);
        current = '';
      } else {
        current += character;
      }
    }
    if (current !== '') lengths.push(current);
    return inPixels(lengths[2] ?? lengths[0] ?? '0px', height);
  };
  const piece = (selector: string) => {
    const element = document.querySelector(selector);
    if (element === null) return null;
    const box = element.getBoundingClientRect();
    return {
      top: box.top + scrollY,
      height: box.height,
      covered: coveredOf(getComputedStyle(element).clipPath, box.height),
      state: element.getAttribute('data-print'),
    };
  };
  const count = document.querySelector(
    '[data-testid="category-cpu"] [data-testid="item-end"]',
  );
  const stamp = document.querySelector('[data-testid="price-slip"] [data-testid="stamp"]');
  const scale = stamp === null ? null : Number.parseFloat(getComputedStyle(stamp).scale);

  return {
    sheet: piece('[data-testid="sheet"]'),
    count:
      count === null
        ? null
        : {
            left: count.getBoundingClientRect().left + scrollX,
            opacity: Number(getComputedStyle(count).opacity),
          },
    slip: piece('[data-testid="price-slip"]'),
    stamp:
      stamp === null
        ? null
        : {
            scale: scale === null || Number.isNaN(scale) ? 1 : scale,
            opacity: Number(getComputedStyle(stamp).opacity),
          },
  };
}

// Scrolls the page at once, as a thumb's flick ends, so that the top of a
// printed piece's frame is at the middle of the window: past the nine tenths
// of the way down at which it prints.
export async function bringIntoView(page: Page, testId: string): Promise<void> {
  await page.evaluate((id) => {
    const piece = document.querySelector(`[data-testid="${id}"]`);
    const frame = piece?.parentElement;
    if (frame == null) throw new Error(`No ${id} on the page.`);
    window.scrollTo({
      top: frame.getBoundingClientRect().top + scrollY - innerHeight / 2,
      behavior: 'instant',
    });
  }, testId);
}
