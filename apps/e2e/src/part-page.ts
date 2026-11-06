import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

import { apiUrl } from './platform';

// A made-up Part a Part page's test creates, by the name and part number it
// gives it.
export interface MadeUpPartOfAPage {
  id: string;
  name: string;
  partNumber: string;
}

// Creates a made-up CPU over HTTP as the Admin, with the name, part number
// and specifications the test gives, the name holding a word unique to the
// run so that the test finds it on a Category page's long list. It stays in
// the development database, which `pnpm services:reset` empties.
export async function createACpuWith(
  request: APIRequestContext,
  authorization: string,
  {
    name,
    partNumber,
    specifications,
  }: Omit<MadeUpPartOfAPage, 'id'> & {
    specifications: Record<string, unknown>;
  },
): Promise<MadeUpPartOfAPage> {
  const created = await request.post(`${apiUrl}/v1/parts`, {
    headers: { authorization },
    data: {
      category: 'cpu',
      name,
      manufacturer: 'Made-up Test Parts',
      partNumbers: [partNumber],
      specifications,
    },
  });
  expect(created.status()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  return { id, name, partNumber };
}

// Deactivates or reactivates a made-up Vendor over HTTP as the Admin, as the
// Admin console's buttons do.
export async function switchTheVendor(
  request: APIRequestContext,
  authorization: string,
  vendorId: string,
  to: 'deactivate' | 'reactivate',
): Promise<void> {
  const switched = await request.post(`${apiUrl}/v1/vendors/${vendorId}/${to}`, {
    headers: { authorization },
  });
  expect(switched.status()).toBe(200);
}

// A specification as the API answers it for a Visible Part, as far as the
// tests read it.
export interface AnsweredSpecification {
  path: string;
  label: string;
}

// A Visible Part as the API answers it to anyone.
export async function theVisiblePart(
  request: APIRequestContext,
  partId: string,
): Promise<{
  name: string;
  partNumbers: string[];
  specifications: AnsweredSpecification[];
}> {
  const answer = await request.get(`${apiUrl}/v1/visible-parts/${partId}`);
  expect(answer.status()).toBe(200);
  return (await answer.json()) as {
    name: string;
    partNumbers: string[];
    specifications: AnsweredSpecification[];
  };
}

// The Offers the page lists, in the order it shows them.
export function offersListed(page: Page): Locator {
  return page.getByTestId('offer');
}

// The Offer of the Vendor with this identifier.
export function offerOf(page: Page, vendorId: string): Locator {
  return page.locator(`[data-testid="offer"][data-vendor="${vendorId}"]`);
}

// The identifiers of the Vendors whose Offers are listed, in their order.
export async function vendorsListed(page: Page): Promise<string[]> {
  return offersListed(page).evaluateAll((offers) =>
    offers.map((offer) => offer.getAttribute('data-vendor') ?? ''),
  );
}

// One of the specifications the page shows, under the box label, found by
// its path, its label and its value as their elements hold them.
export function specificationOn(page: Page, path: string): Locator {
  return page.locator(`[data-testid="specification"][data-specification="${path}"]`);
}

// What a film sees of a Part page in one frame (DESIGN.md's What moves): the
// sheet of Offers and the price slip, each its top in the page's own
// coordinates, how much of it its clip still covers from its foot and what
// the page's script says it is doing; the first Offer's price, how far its
// settle still shifts it, in pixels to the right, and how opaque it is; the
// slip's stamp, its scale and opacity; the scan's line, where it is across
// the barcode, from 0 at its left edge to 1 at its right one, whether it is
// inside the barcode, which clips it, and how opaque it is; the slip's top
// in the window; and how far the page is scrolled. One that is not on the
// page is null. It runs in the page, so it uses only the page's own globals.
export interface ThePartPage {
  sheet: { top: number; height: number; covered: number; state: string | null } | null;
  slip: { top: number; height: number; covered: number; state: string | null } | null;
  price: { shift: number; opacity: number } | null;
  stamp: { scale: number; opacity: number } | null;
  scan: { across: number; inside: boolean; opacity: number } | null;
  slipInTheWindow: number | null;
  scrolled: number;
}

export function lookAtThePartPage(): ThePartPage {
  const inPixels = (length: string, height: number) =>
    [...length.matchAll(/(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(%|px)/gi)].reduce(
      (sum, [, amount, unit]) =>
        sum + (unit === '%' ? (Number(amount) / 100) * height : Number(amount)),
      0,
    );
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
  const price = document.querySelector('[data-testid="offer"] [data-testid="item-end"]');
  const stamp = document.querySelector('[data-testid="price-slip"] [data-testid="stamp"]');
  const scale = stamp === null ? null : Number.parseFloat(getComputedStyle(stamp).scale);
  const line = document.querySelector('[data-scan-line]');
  const slip = document.querySelector('[data-testid="price-slip"]');
  const scan = (() => {
    if (line === null) return null;
    const barcode = line.parentElement?.getBoundingClientRect();
    const drawn = line.getBoundingClientRect();
    if (barcode === undefined || barcode.width === 0) return null;
    // The line is the box's start edge, 3 pixels of its border: its left edge
    // in English, and its right edge in Kurdish and Arabic.
    const rtl = getComputedStyle(line).direction === 'rtl';
    const edge = rtl ? drawn.right - 3 : drawn.left;
    return {
      across: (edge - barcode.left) / barcode.width,
      inside: edge + 3 > barcode.left + 0.5 && edge < barcode.right - 0.5,
      opacity: Number(getComputedStyle(line).opacity),
    };
  })();

  return {
    sheet: piece('[data-testid="sheet"]'),
    slip: piece('[data-testid="price-slip"]'),
    price:
      price === null
        ? null
        : {
            shift: Number.parseFloat(getComputedStyle(price).translate) || 0,
            opacity: Number(getComputedStyle(price).opacity),
          },
    stamp:
      stamp === null
        ? null
        : {
            scale: scale === null || Number.isNaN(scale) ? 1 : scale,
            opacity: Number(getComputedStyle(stamp).opacity),
          },
    scan,
    slipInTheWindow: slip?.parentElement?.getBoundingClientRect().top ?? null,
    scrolled: scrollY,
  };
}
