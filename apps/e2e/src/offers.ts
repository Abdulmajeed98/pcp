import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

import { closeTheMenu, openTheMenuOnAPhone } from './menu-sheet';
import { type DrawnFrame } from './leaving-rows';
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

// The Offers screen's tab for a state of the Offers, whatever language it is
// named in.
export function theTab(
  page: Page,
  state: 'all' | 'needs-confirming' | 'out-of-stock',
): Locator {
  return page.getByTestId('offer-states').locator(`a[data-state="${state}"]`);
}

// What a tab says when no Offer is in its state.
export function noOfferInTheState(page: Page): Locator {
  return page.getByTestId('no-offer-in-state');
}

// One of the portal's two sections, found by where it leads, whatever
// language it is named in. They are in the frame's sidebar from 64rem, and in
// the menu sheet on a phone.
export function theSection(page: Page, section: 'offers' | 'details'): Locator {
  const sections = page.getByTestId('portal-sections');
  return section === 'details'
    ? sections.locator('a[href$="/details"]')
    : sections.locator('a').first();
}

// Goes to one of the portal's sections, as a Vendor does: on a phone it opens
// the menu sheet, which choosing a section closes.
export async function goToTheSection(
  page: Page,
  section: 'offers' | 'details',
): Promise<void> {
  await openTheMenuOnAPhone(page);
  await theSection(page, section).click();
}

// The section the Vendor is in is marked as the current one, read in the
// menu sheet on a phone.
export async function expectTheCurrentSection(
  page: Page,
  section: 'offers' | 'details',
): Promise<void> {
  const opened = await openTheMenuOnAPhone(page);
  await expect(theSection(page, section)).toHaveAttribute('aria-current', 'page');
  if (opened) await closeTheMenu(page);
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

// The counts a test gives the screen in place of the Vendor's own. None is
// out of stock unless the test says so.
export interface CountsGiven {
  offers: number;
  expired: number;
  aboutToExpire: number;
  outOfStock?: number;
}

// Gives the page, whenever it lists the Vendor's Offers, an answer of the
// test's own: two Offers about to expire, one of them with less than a day
// left, and one expired, and the counts the test gives, as `answerAsForALoginWithNoVendor` gives an answer of its own.
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
  const offer = (name: string, days: number, daysLeft: number, expired: boolean) => ({
    id: `00000000-0000-4000-8000-${String(days).padStart(12, '0')}`,
    part: aPartOfTheAnswer(name),
    usdPrice: '1250.00',
    iqdPrice: 1_875_000,
    inStock: true,
    warrantyMonths: 12,
    confirmedAt: new Date(now - days * aDay).toISOString(),
    createdAt: new Date(now - 30 * aDay).toISOString(),
    daysSinceConfirmation: days,
    daysLeft,
    expired,
    aboutToExpire: !expired && days > 11,
  });
  const content = [
    offer('Made-up answered Part, expired', 20, 0, true),
    offer('Made-up answered Part, expiring today', 13, 0, false),
    offer('Made-up answered Part, about to expire', 12, 2, false),
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
              counts: { outOfStock: 0, ...counts },
            },
          })
        : route.fallback(),
  );
}

// Gives the page, whenever it lists the Vendor's Offers, the Vendor's own
// Offers as the API lists them, in the API's order, but every one needing
// confirmation: the first expired 20 days ago, the others expiring today,
// and on the Need confirming tab every one of them, with the counts to
// match. Once the page has asked the real API to confirm all the Offers,
// every list reaches the real API, so that the same rows come back
// confirmed today, as a Vendor sees them after Confirm all.
export async function answerTheOwnOffersAsNeedingConfirmation(
  page: Page,
  vendorId: string,
): Promise<void> {
  const aDay = 24 * 60 * 60 * 1000;
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
    async (route) => {
      if (route.request().method() !== 'GET' || confirmed) return route.fallback();
      const asked = new URL(route.request().url());
      asked.searchParams.delete('state');
      const response = await route.fetch({ url: asked.href });
      const answered = (await response.json()) as {
        content: { inStock: boolean }[];
        counts: { offers: number; outOfStock: number };
      };
      const now = Date.now();
      const content = answered.content.map((offer, index) => {
        const days = index === 0 ? 20 : 13;
        return {
          ...offer,
          confirmedAt: new Date(now - days * aDay - 60_000).toISOString(),
          daysSinceConfirmation: days,
          daysLeft: 0,
          expired: index === 0,
          aboutToExpire: index !== 0,
        };
      });
      return route.fulfill({
        response,
        json: {
          ...answered,
          content,
          counts: {
            ...answered.counts,
            expired: Math.min(1, content.length),
            aboutToExpire: Math.max(0, content.length - 1),
          },
        },
      });
    },
  );
}

// One frame of the Offers screen, as the page drew it: the list as
// `filmTheList` records one, each row keyed by its Offer (two made-up Parts
// may share the first words of their names); and around it the banner's box
// and how opaque it is drawn, the result line's height, the line of a tab
// with nothing in it, and where the tabs stand, so that a block that comes
// or goes is seen to open or close and not to jump.
export interface ScreenFrame {
  list: DrawnFrame;
  banner: { height: number; opacity: number } | null;
  result: number;
  none: { height: number; opacity: number } | null;
  tabs: number | null;
}

// Records the Offers screen at every frame the page draws while `act` runs
// and for `forMs` after it, with every animation and transition of the page
// slowed by `slowedBy` (DevTools' own playback rate), as `filmTheList` does.
export async function filmTheOffersScreen(
  page: Page,
  act: () => Promise<void>,
  { slowedBy, forMs }: { slowedBy: number; forMs: number },
): Promise<ScreenFrame[]> {
  const devtools = await page.context().newCDPSession(page);
  await devtools.send('Animation.enable');
  await devtools.send('Animation.setPlaybackRate', { playbackRate: 1 / slowedBy });
  await page.evaluate(() => {
    const frames: ScreenFrame[] = [];
    const film = window as unknown as {
      screenFilm: { frames: ScreenFrame[]; on: boolean };
    };
    film.screenFilm = { frames, on: true };
    const opacityOf = (element: Element | null) => {
      let opacity = 1;
      for (let at = element; at !== null && at !== document.body; at = at.parentElement) {
        opacity *= Number(getComputedStyle(at).opacity);
      }
      return opacity;
    };
    const boxOf = (element: Element | null) =>
      element === null
        ? null
        : { height: element.getBoundingClientRect().height, opacity: opacityOf(element) };
    const draw = () => {
      const rows = [...document.querySelectorAll<HTMLElement>('[data-testid="offer"]')].map(
        (row) => {
          const box = row.getBoundingClientRect();
          return {
            key:
              row.dataset.row ??
              row.querySelector('a')?.getAttribute('href') ??
              (row.textContent ?? '').trim().slice(0, 24),
            top: box.top,
            height: box.height,
            opacity: opacityOf(row.querySelector('a')),
          };
        },
      );
      const banner = document.querySelector('[data-testid="expiry-banner"]');
      // The banner's box is the space it takes, which closes as it leaves.
      const space = banner?.closest('.leaves') ?? banner;
      frames.push({
        list: {
          at: performance.now(),
          rows,
          pages: null,
          headings: [...document.querySelectorAll('[data-testid="offers-screen"] th')].map(
            (heading) => heading.getBoundingClientRect().left,
          ),
        },
        banner: boxOf(space ?? null),
        result: document.querySelector('output')?.getBoundingClientRect().height ?? 0,
        none: boxOf(document.querySelector('[data-testid="no-offer-in-state"]')),
        tabs:
          document.querySelector('[data-testid="offer-states"]')?.getBoundingClientRect()
            .top ?? null,
      });
      if (film.screenFilm.on) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  });
  await act();
  await page.waitForTimeout(forMs);
  const frames = await page.evaluate(() => {
    const film = (
      window as unknown as { screenFilm: { frames: ScreenFrame[]; on: boolean } }
    ).screenFilm;
    film.on = false;
    return film.frames;
  });
  await devtools.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await devtools.detach();
  return frames;
}

// What snaps on the Offers screen, filmed frame by frame: a movement that
// makes most of its change in one frame, rather than over the frames of its
// transition. Every row's place and height, the banner's, the result line's
// and the empty line's heights, and where the tabs stand are each followed
// through the film; each run of frames in which one of them moves is a
// movement, and a movement of more than a few pixels whose largest step is
// over half of it, or which is faster than `fastest` pixels a millisecond
// between two drawn frames, is a snap. A step is judged
// against its own movement, since a 300-pixel banner closing smoothly over
// a slowed 800 ms still takes larger steps than a 20-pixel line snapping.
// Also a snap: the banner taken out, or the empty line put in, while it
// takes room or can be seen. Empty when nothing snaps.
export function snapsIn(frames: ScreenFrame[], { fastest }: { fastest: number }): string[] {
  const snaps: string[] = [];
  const follow = (name: string, values: (number | null)[]) => {
    let run: { step: number; speed: number }[] = [];
    const judge = () => {
      const whole = run.reduce((sum, { step }) => sum + Math.abs(step), 0);
      const largest = Math.max(0, ...run.map(({ step }) => Math.abs(step)));
      const quickest = Math.max(0, ...run.map(({ speed }) => speed));
      if (whole > 4 && largest > whole / 2) {
        snaps.push(
          `${name} moved ${Math.round(largest)}px of its ${Math.round(whole)}px in one frame`,
        );
      } else if (whole > 4 && quickest > fastest) {
        snaps.push(`${name} moved at ${quickest.toFixed(2)}px a millisecond`);
      }
      run = [];
    };
    values.slice(1).forEach((value, index) => {
      const before = values[index];
      if (value === null || before === null) return judge();
      const step = value - before;
      if (Math.abs(step) < 0.5) return judge();
      // How fast, by the time between the two frames drawn, which a frame
      // the page dropped while it was busy lengthens.
      const elapsed = Math.max(1, frames[index + 1].list.at - frames[index].list.at);
      run.push({ step, speed: Math.abs(step) / elapsed });
    });
    judge();
  };

  const keys = new Set(frames.flatMap((frame) => frame.list.rows.map((row) => row.key)));
  for (const key of keys) {
    const row = (frame: ScreenFrame) => frame.list.rows.find((each) => each.key === key);
    follow(
      `the row ${key}'s place`,
      frames.map((frame) => row(frame)?.top ?? null),
    );
    follow(
      `the row ${key}'s height`,
      frames.map((frame) => row(frame)?.height ?? null),
    );
  }
  follow(
    'the banner',
    frames.map((frame) => frame.banner?.height ?? null),
  );
  follow(
    'the result line',
    frames.map((frame) => frame.result),
  );
  follow(
    'the empty line',
    frames.map((frame) => frame.none?.height ?? null),
  );
  follow(
    'the tabs',
    frames.map((frame) => frame.tabs),
  );

  frames.slice(1).forEach((frame, index) => {
    const before = frames[index];
    const was = before.banner;
    if (frame.banner === null && was !== null && (was.height > 1 || was.opacity > 0.01)) {
      snaps.push(
        `the banner was taken out ${Math.round(was.height)}px high at ${was.opacity}`,
      );
    }
    const now = frame.none;
    if (now !== null && before.none === null && (now.height > 1 || now.opacity > 0.01)) {
      snaps.push(
        `the empty line was put in ${Math.round(now.height)}px high at ${now.opacity}`,
      );
    }
  });
  return snaps;
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
