import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

import type { Currency } from './currencies';
import type { CategoryKey, VisiblePart } from './home-page';
import { aMadeUpPhoto } from './made-up-photo';
import { apiUrl } from './platform';

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
): Promise<{ totalElements: number; totalPages: number; content: VisiblePart[] }> {
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
    content: VisiblePart[];
  };
}

// The Visible Parts the Category page shows, in the order it shows them.
export function visibleParts(page: Page): Locator {
  return page.getByTestId('visible-part');
}

// The names of the Parts listed, in their order, each as its link says it.
export async function namesListed(page: Page): Promise<string[]> {
  return (await visibleParts(page).getByRole('link').allInnerTexts()).map((name) =>
    name.trim(),
  );
}

// The page lists these Parts, in this order, once it has drawn its list: a
// list drawn again in place, by a choice applied with script, is waited for.
export async function expectTheList(page: Page, names: string[]): Promise<void> {
  await expect.poll(() => namesListed(page)).toEqual(names);
}

// The Visible Part of this name on the Category page.
export function visiblePart(page: Page, name: string): Locator {
  return visibleParts(page).filter({
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

// What a Category page's address asks of its list, as its query holds it: each
// field the form sent with something in it, in its order, a repeated one in
// each place. A form sent without script sends its empty fields too, and
// those are left out, as the page ignores them.
export function theQueryOf(address: string): [string, string][] {
  return [...new URL(address).searchParams].filter(([, value]) => value.trim() !== '');
}

// The page is the Category page at `path`, in `language`, and its address
// asks for `asked` and nothing else.
export async function expectTheAddressToAsk(
  page: Page,
  language: { tag: string },
  path: string,
  asked: [string, string][],
): Promise<void> {
  await expect
    .poll(() => {
      const shown = new URL(page.url());
      return { path: shown.pathname, asked: theQueryOf(page.url()) };
    })
    .toEqual({ path: `/${language.tag}${path}`, asked });
}

// The filters' form, the swing tag (DESIGN.md's The swing tag): the search,
// and below 64rem the fold of the filters, a disclosure whose bar says
// "Filters" and how many choices are on.
export function theFiltersFold(page: Page): Locator {
  return page.getByTestId('filters-fold');
}

export function theFiltersBar(page: Page): Locator {
  return page.getByTestId('filters-bar');
}

// Unfolds the filters on a phone, as a Shopper does with a tap on the bar,
// unless they are unfolded already.
export async function unfoldTheFilters(page: Page): Promise<void> {
  if (!(await theFiltersFold(page).evaluate((fold: HTMLDetailsElement) => fold.open))) {
    await theFiltersBar(page).click();
  }
  await expect(theFiltersFold(page)).toHaveJSProperty('open', true);
}

// The native checkbox of one value of a filter, by the parameter the API
// asks the filter by and the value as the address writes it, which are the
// same in every language: `manufacturer` for a manufacturer.
export function theChoiceOf(page: Page, parameter: string, value: string): Locator {
  return page
    .getByTestId('filters')
    .locator(`input[type="checkbox"][name="${parameter}"][value="${value}"]`);
}

// The chip that holds it, which a thumb taps.
export function theChipOf(page: Page, parameter: string, value: string): Locator {
  return page.getByTestId('filters').locator('label', {
    has: page.locator(`input[type="checkbox"][name="${parameter}"][value="${value}"]`),
  });
}

// A field of the price range, `lowest` or `highest`.
export function thePriceField(page: Page, end: 'lowest' | 'highest'): Locator {
  return page.getByTestId('filters').locator(`input[name="${end}"]`);
}

// What the form says beside a price field it cannot use.
export function whatThePriceFieldSays(page: Page, end: 'lowest' | 'highest'): Locator {
  return page.getByTestId(`${end}-problem`);
}

// The filters' button that sends the form, Show Parts.
export function showParts(page: Page): Locator {
  return page.getByTestId('show-parts');
}

// Chooses values in the filters as a Shopper does, with a tap on each chip,
// the filters unfolded first. With script each choice applies as soon as it
// is made, and the address holds it before the next; without script the
// choices are sent with Show Parts.
export async function chooseInTheFilters(
  page: Page,
  choices: [string, string][],
): Promise<void> {
  const withScript = await page.evaluate(() => matchMedia('(scripting: enabled)').matches);
  await unfoldTheFilters(page);
  for (const [parameter, value] of choices) {
    const asked = theQueryOf(page.url());
    await theChipOf(page, parameter, value).click();
    if (withScript) {
      const before = asked.some(([name, each]) => name === parameter && each === value);
      await page.waitForURL(
        (url) =>
          theQueryOf(url.href).some(
            ([name, each]) => name === parameter && each === value,
          ) !== before,
      );
    }
  }
  if (!withScript) await sendTheFilters(page);
}

// Sends the filters' form with Show Parts, and waits for the page it asks for.
export async function sendTheFilters(page: Page): Promise<void> {
  const before = page.url();
  await unfoldTheFilters(page);
  await showParts(page).click();
  await page.waitForURL((url) => url.href !== before);
}

// The choices that are on, at the head of the sheet: one chip for each, a
// link to the list without it, told apart by `data-choice`: `search`,
// `price`, or the parameter and the value, such as `socket=AM5`.
export function choicesOnTheSheet(page: Page): Locator {
  return page.getByTestId('choices-on').getByTestId('choice-on');
}

export function theChoiceOnOf(page: Page, choice: string): Locator {
  return page.getByTestId('choices-on').locator(`a[data-choice="${choice}"]`);
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
    '[data-testid="visible-part"] [data-testid="item-end"]',
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
