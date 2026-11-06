import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

import { apiUrl } from './platform';

// The links of a Vendor's contact details, by what each does, as the Vendor
// page's coupon names them in its test ids, whatever language the page is in.
export type ContactKind = 'call' | 'whatsApp' | 'instagram' | 'map';

// The coupon's cell that does `kind`: calls the shop, opens its WhatsApp
// chat, its Instagram profile or its place in Google Maps.
export function contactLink(page: Page, kind: ContactKind): Locator {
  return page.getByTestId(`contact-${kind}`);
}

// The coupon's tear-off tabs, each a call.
export function tearOffTabs(page: Page): Locator {
  return page.getByRole('group').filter({ has: page.locator('a[href^="tel:"]') });
}

// The Offers the Vendor page lists, in the order it shows them.
export function vendorsOffers(page: Page): Locator {
  return page.getByTestId('offer');
}

// The Offer of the Part with this identifier.
export function offerOfThePart(page: Page, partId: string): Locator {
  return page.locator(`[data-testid="offer"][data-part="${partId}"]`);
}

// The identifiers of the Parts whose Offers are listed, in their order.
export async function partsListed(page: Page): Promise<string[]> {
  return vendorsOffers(page).evaluateAll((offers) =>
    offers.map((offer) => offer.getAttribute('data-part') ?? ''),
  );
}

// The groups of the Vendor's Offers, each a Category's, by the Category's
// key, in the order the page shows them, with the Parts of each.
export async function groupsListed(
  page: Page,
): Promise<{ category: string; parts: string[] }[]> {
  return page.locator('[data-testid^="offers-of-"]').evaluateAll((groups) =>
    groups.map((group) => ({
      category: (group.getAttribute('data-testid') ?? '').replace('offers-of-', ''),
      parts: [...group.querySelectorAll('[data-testid="offer"]')].map(
        (offer) => offer.getAttribute('data-part') ?? '',
      ),
    })),
  );
}

// What the sheet says when it lists no Offer, with why as `data-state`:
// `none`, `past-the-end` or `not-read`.
export function whatTheOffersSay(page: Page): Locator {
  return page.getByTestId('offers-say');
}

// A visible Vendor's Offers as the API answers them to anyone, a page of
// them, counted from 0, in a currency, as far as the tests read them.
export async function theVendorsOffers(
  request: APIRequestContext,
  vendorId: string,
  currency: 'IQD' | 'USD',
  page = 0,
): Promise<{
  totalElements: number;
  totalPages: number;
  content: { part: { id: string; category: string } }[];
}> {
  const answer = await request.get(`${apiUrl}/v1/visible-vendors/${vendorId}/offers`, {
    params: { currency, page, size: 20 },
  });
  expect(answer.status()).toBe(200);
  return (await answer.json()) as {
    totalElements: number;
    totalPages: number;
    content: { part: { id: string; category: string } }[];
  };
}

// What a film sees of a Vendor page in one frame (DESIGN.md's What moves and
// What stays still): the sheet of Offers, its top in the page's own
// coordinates, how much of it its clip still covers from its foot and what
// the page's script says it is doing; the first Offer's price, how far its
// settle still shifts it, in pixels to the right, and how opaque it is; the
// coupon's top in the page, which never moves; and a contact cell's and a
// tear-off tab's movement, the cell's scale and the tab's turn and drop, for
// the films of a press and of a lean. One that is not on the page is null.
// It runs in the page, so it uses only the page's own globals.
export interface TheVendorPage {
  sheet: { top: number; height: number; covered: number; state: string | null } | null;
  price: { shift: number; opacity: number } | null;
  coupon: number | null;
  cell: number | null;
  tab: { turn: number; drop: number } | null;
}

export function lookAtTheVendorPage(): TheVendorPage {
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
  const sheet = document.querySelector('[data-testid="sheet"]');
  const sheetBox = sheet?.getBoundingClientRect();
  const price = document.querySelector('[data-testid="offer"] [data-testid="item-end"]');
  const coupon = document.querySelector('[data-testid="coupon"]');
  const cell = document.querySelector('[data-testid="contact-call"]');
  const tab = document.querySelector('[role="group"] a[href^="tel:"]');
  const scale =
    cell === null ? Number.NaN : Number.parseFloat(getComputedStyle(cell).scale);
  const turn = tab === null ? Number.NaN : Number.parseFloat(getComputedStyle(tab).rotate);
  const drop =
    tab === null
      ? Number.NaN
      : Number.parseFloat(getComputedStyle(tab).translate.split(' ')[1] ?? '0');

  return {
    sheet:
      sheet === null || sheetBox === undefined
        ? null
        : {
            top: sheetBox.top + scrollY,
            height: sheetBox.height,
            covered: coveredOf(getComputedStyle(sheet).clipPath, sheetBox.height),
            state: sheet.getAttribute('data-print'),
          },
    price:
      price === null
        ? null
        : {
            shift: Number.parseFloat(getComputedStyle(price).translate) || 0,
            opacity: Number(getComputedStyle(price).opacity),
          },
    coupon: coupon === null ? null : coupon.getBoundingClientRect().top + scrollY,
    cell: cell === null ? null : Number.isNaN(scale) ? 1 : scale,
    tab:
      tab === null
        ? null
        : { turn: Number.isNaN(turn) ? 0 : turn, drop: Number.isNaN(drop) ? 0 : drop },
  };
}
