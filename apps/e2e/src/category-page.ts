import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

import type { Currency } from './currencies';
import type { CategoryKey, ListedPart } from './home-page';
import { aMadeUpPhoto } from './made-up-photo';
import { apiUrl } from './platform';

// A made-up Part a Category page's test creates, by the name it gives it.
export interface MadeUpListedPart {
  id: string;
  name: string;
}

// Creates a made-up CPU over HTTP as the Admin, with the name the test gives,
// which holds a word unique to the run so that the test finds its own rows on
// a long list, and plainly test data. It stays in the development database,
// which `pnpm services:reset` empties.
export async function createACpuNamed(
  request: APIRequestContext,
  authorization: string,
  name: string,
): Promise<MadeUpListedPart> {
  const created = await request.post(`${apiUrl}/v1/parts`, {
    headers: { authorization },
    data: {
      category: 'cpu',
      name,
      manufacturer: 'Made-up Test Parts',
      partNumbers: [`TEST-${name.replace(/\W+/g, '-')}`],
      specifications: {},
    },
  });
  expect(created.status()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  return { id, name };
}

// Adds a made-up photo to a Part over HTTP as the Admin, and gives back the
// path the API serves it at, `/v1/photos/<photoId>`.
export async function addAPhotoTo(
  request: APIRequestContext,
  authorization: string,
  partId: string,
): Promise<string> {
  const added = await request.put(`${apiUrl}/v1/parts/${partId}/photo`, {
    headers: { authorization },
    multipart: { photo: aMadeUpPhoto([40, 120, 90], 64) },
  });
  expect(added.status()).toBe(200);
  const { photoPath } = (await added.json()) as { photoPath: string | null };
  expect(photoPath).toMatch(/^\/v1\/photos\/[0-9a-f-]{36}$/);
  return photoPath ?? '';
}

// One page of a Category's list, as the API answers it to anyone, counted
// from 0 as the API counts it, 20 Parts to a page as the Category page asks.
export async function aPageOfTheList(
  request: APIRequestContext,
  {
    category,
    currency,
    search,
    page = 0,
  }: { category: CategoryKey; currency: Currency; search?: string; page?: number },
): Promise<{ totalElements: number; totalPages: number; content: ListedPart[] }> {
  const answer = await request.get(`${apiUrl}/v1/visible-parts`, {
    params: {
      category,
      currency,
      page,
      size: 20,
      ...(search === undefined ? {} : { search }),
    },
  });
  expect(answer.status()).toBe(200);
  return (await answer.json()) as {
    totalElements: number;
    totalPages: number;
    content: ListedPart[];
  };
}

// The Parts the Category page lists, in the order it shows them.
export function listedParts(page: Page): Locator {
  return page.getByTestId('listed-part');
}

// The names of the Parts listed, in their order, each as its link says it.
export async function namesListed(page: Page): Promise<string[]> {
  return (await listedParts(page).getByRole('link').allInnerTexts()).map((name) =>
    name.trim(),
  );
}

// The listed Part of this name.
export function listedPart(page: Page, name: string): Locator {
  return listedParts(page).filter({
    has: page.getByRole('link', { name, exact: true }),
  });
}

// The one sentence under the sheet's title that says what it shows, the
// page's status, with what it shows as `data-state`: `listed`, `none-yet`,
// `no-match`, `past-the-end` or `not-read`.
export function whatTheSheetSays(page: Page): Locator {
  return page.getByTestId('sheet-says');
}

// The Category page's search field, the one search box on the page.
export function theSearchBox(page: Page): Locator {
  return page.getByRole('search').getByRole('searchbox');
}

// Searches the Category page as a Shopper does, by typing the words and
// pressing Enter, or the phone keyboard's search key, and waits until the
// address holds them.
export async function searchTheCategory(page: Page, words: string): Promise<void> {
  await theSearchBox(page).fill(words);
  await theSearchBox(page).press('Enter');
  await page.waitForURL((url) => url.searchParams.get('search') === words);
}

// What a film sees of a Category page's sheet in one frame (DESIGN.md's What
// moves): the sheet, the top of its box in the page's own coordinates and how
// much of it its clip still covers from its foot; the first listed price,
// how far its settle still shifts it along the line, in pixels to the right,
// and how opaque it is; and the stamp, its scale and opacity. The price's
// shift is read from its own movement, not its edge, which a font arriving
// while the page opens moves as well, since a price is placed from its
// width. One that is not on the page is null. It runs in the page, so it
// uses nothing but the page's own globals.
export interface TheCategorySheet {
  sheet: { top: number; height: number; covered: number } | null;
  price: { shift: number; opacity: number } | null;
  stamp: { scale: number; opacity: number } | null;
}

export function lookAtTheCategorySheet(): TheCategorySheet {
  const sheet = document.querySelector('[data-testid="sheet"]');
  const price = document.querySelector(
    '[data-testid="listed-part"] [data-testid="item-end"]',
  );
  const stamp = document.querySelector('[data-testid="sheet"] [data-testid="stamp"]');
  // How much a clip `inset(top right bottom left)` covers from the foot: its
  // third length, or its first when it has one only, each a percentage, a
  // length, or a sum of the two midway, which near its end the browser may
  // write with an exponent.
  const covered = (clip: string, height: number) => {
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
    const third = lengths[2] ?? lengths[0] ?? '0px';
    return [...third.matchAll(/(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(%|px)/gi)].reduce(
      (sum, [, amount, unit]) =>
        sum + (unit === '%' ? (Number(amount) / 100) * height : Number(amount)),
      0,
    );
  };
  const scale =
    stamp === null ? Number.NaN : Number.parseFloat(getComputedStyle(stamp).scale);

  return {
    sheet:
      sheet === null
        ? null
        : {
            top: sheet.getBoundingClientRect().top + scrollY,
            height: sheet.getBoundingClientRect().height,
            covered: covered(
              getComputedStyle(sheet).clipPath,
              sheet.getBoundingClientRect().height,
            ),
          },
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
            scale: Number.isNaN(scale) ? 1 : scale,
            opacity: Number(getComputedStyle(stamp).opacity),
          },
  };
}
