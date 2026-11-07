import { type Browser, expect, type Page, test } from '@playwright/test';

import { schemeChoice, schemeSwitch, schemeTurn } from './home-page';
import { addressIn, expectWithinReach, languages, linkTo, narrowWindow } from './languages';
import { film } from './motion-film';
import { shopperUrl } from './platform';

const [, arabic, english] = languages;

// The scheme is not about a language, so these tests open the English pages,
// in a desktop's window, where the switch shows its three choices. The
// phone's one button has a test of its own.
const homePage = addressIn(english);
const notFound = addressIn(english, '/no-such-page');
// The home page with a query, as a page with a search or a page number of its
// own will have one.
const withAQuery = `${homePage}?search=ryzen&page=2`;

type Scheme = 'light' | 'dark' | 'device';

// The scheme the page is drawn in, as its document names it: light or dark
// once one is chosen, and none while the device's is.
async function expectDrawnIn(page: Page, scheme: Scheme): Promise<void> {
  const html = page.locator('html');
  if (scheme === 'device') await expect(html).not.toHaveAttribute('data-scheme');
  else await expect(html).toHaveAttribute('data-scheme', scheme);
}

// How light the page is, by its ground, the background of its body, from 0
// for black to 1 for white: the relative luminance of WCAG's contrast.
async function lightnessOf(page: Page): Promise<number> {
  return page.evaluate(() => {
    const [red, green, blue] = (
      getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g) ?? []
    )
      .slice(0, 3)
      .map((channel) => {
        const share = Number(channel) / 255;
        return share <= 0.04045 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  });
}

// The page is drawn in the light colours or the dark ones, whatever its
// document names: its ground is light or dark.
async function expectTheColoursOf(page: Page, look: 'light' | 'dark'): Promise<void> {
  if (look === 'light') {
    await expect.poll(() => lightnessOf(page), 'the ground is light').toBeGreaterThan(0.5);
  } else {
    await expect.poll(() => lightnessOf(page), 'the ground is dark').toBeLessThan(0.1);
  }
}

// The switch shows `scheme` as the chosen one: its three choices are there,
// that one alone marked as the current one.
async function expectChosen(page: Page, scheme: Scheme): Promise<void> {
  const choices = schemeSwitch(page).locator('li button');
  await expect(choices).toHaveCount(3);
  await expect(schemeSwitch(page).locator('li [aria-current="true"]')).toHaveCount(1);
  await expect(schemeChoice(page, scheme)).toHaveAttribute('aria-current', 'true');
}

// What a choice leaves behind in the browser it was made in: a cookie that
// holds it for about a year, and not only until the browser is closed, so
// that a browser opened another day with what the first one kept draws the
// page in it from the start.
async function expectTheChoiceKept(
  page: Page,
  browser: Browser,
  scheme: 'light' | 'dark',
  javaScriptEnabled: boolean,
): Promise<void> {
  await expect
    .poll(async () =>
      (await page.context().cookies(shopperUrl)).filter(({ value }) => value === scheme),
    )
    .toHaveLength(1);
  const kept = (await page.context().cookies(shopperUrl)).filter(
    (cookie) => cookie.expires !== -1,
  );
  const choice = kept.filter((cookie) => cookie.value === scheme);
  expect(choice, 'the browser keeps the choice beyond the session').toHaveLength(1);
  const daysLeft = (choice[0].expires - Date.now() / 1000) / (60 * 60 * 24);
  expect(daysLeft).toBeGreaterThan(364);
  expect(daysLeft).toBeLessThan(366);

  const anotherDay = await browser.newContext({
    javaScriptEnabled,
    storageState: { cookies: kept, origins: [] },
  });
  try {
    const opened = await anotherDay.newPage();
    await opened.goto(homePage);
    await expectDrawnIn(opened, scheme);
    await expectTheColoursOf(opened, scheme);
  } finally {
    await anotherDay.close();
  }
}

test('a fresh browser follows the device: Device is chosen, and the page is light on a light device and dark on a dark one', async ({
  page,
}) => {
  expect(await page.context().cookies(shopperUrl)).toEqual([]);

  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(homePage);
  await expectChosen(page, 'device');
  await expectDrawnIn(page, 'device');
  await expectTheColoursOf(page, 'light');

  await page.emulateMedia({ colorScheme: 'dark' });
  await expectTheColoursOf(page, 'dark');
});

// A page on a weak connection is read before its scripts have loaded, and
// some browsers run none. The switch is a form in the page as the server sends
// it, so it works in both, and the server draws the page in the choice.
test.describe('with scripts switched off', () => {
  test.use({ javaScriptEnabled: false, colorScheme: 'light' });

  test('choosing Dark returns to the same page, query and all, drawn dark by the server; the choice is kept from page to page, for a year; Device forgets it', async ({
    page,
    browser,
  }) => {
    await page.goto(withAQuery);
    // The browser does run no script. Without this, a setting that did not
    // take would pass as a switch that needs none.
    expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(true);
    await expectTheColoursOf(page, 'light');

    const asked = page.waitForRequest(
      (request) => request.isNavigationRequest() && request.method() === 'POST',
    );
    await schemeChoice(page, 'dark').click();
    await asked;
    await expect(page).toHaveURL(withAQuery);
    await expectChosen(page, 'dark');
    await expectDrawnIn(page, 'dark');
    await expectTheColoursOf(page, 'dark');

    // Another page, here the same page in another language, is drawn dark too.
    await linkTo(page, arabic).click();
    await expect(page).toHaveURL(`${addressIn(arabic)}?search=ryzen&page=2`);
    await expectDrawnIn(page, 'dark');
    await expectTheColoursOf(page, 'dark');
    await expectTheChoiceKept(page, browser, 'dark', false);

    await schemeChoice(page, 'device').click();
    await expectChosen(page, 'device');
    await expectDrawnIn(page, 'device');
    await expectTheColoursOf(page, 'light');
    expect(
      (await page.context().cookies(shopperUrl)).filter(({ name }) => name === 'scheme'),
      'the device’s scheme is not written down',
    ).toEqual([]);
  });
});

test('with script, a choice changes the scheme in place, without leaving the page, and is kept as it is without script', async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(homePage, { waitUntil: 'networkidle' });
  const left: string[] = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) left.push(frame.url());
  });

  await schemeChoice(page, 'dark').click();
  await expectChosen(page, 'dark');
  await expectDrawnIn(page, 'dark');
  await expectTheColoursOf(page, 'dark');
  await expectTheChoiceKept(page, browser, 'dark', true);
  expect(left, 'the page was not left').toEqual([]);

  // The not-found page is dark too.
  await page.goto(notFound);
  await expectDrawnIn(page, 'dark');
  await expectTheColoursOf(page, 'dark');
});

// The scheme changes every colour in one frame: nothing on the page fades
// from the one scheme's colour to the other's, a button with a transition of
// its own among them (DESIGN.md's What stays still).
test('a choice changes every colour in one frame, a button that fades its colour under the pointer among them', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(homePage, { waitUntil: 'networkidle' });

  const frames = await film(
    page,
    () => {
      const button = document.querySelector('[data-testid="card"] a[href="#categories"]');
      return {
        ground: getComputedStyle(document.body).backgroundColor,
        button: button === null ? '' : getComputedStyle(button).backgroundColor,
      };
    },
    () => schemeChoice(page, 'dark').click(),
  );

  for (const each of ['ground', 'button'] as const) {
    const colours = [...new Set(frames.map(({ drawn }) => drawn[each]))];
    expect(colours, `the ${each}'s colours, from the first frame to the last`).toHaveLength(
      2,
    );
  }
});

test.describe('on a phone', () => {
  test.use({ viewport: narrowWindow, colorScheme: 'light' });

  test('one button turns through Light, Dark and Device, its name saying the scheme now and the one a tap gives, within reach of a thumb', async ({
    page,
  }) => {
    await page.goto(homePage, { waitUntil: 'networkidle' });
    await expect(schemeSwitch(page).locator('li button:visible')).toHaveCount(0);
    await expectWithinReach(schemeTurn(page), 'the scheme button');

    const names: string[] = [];
    for (const scheme of ['light', 'dark', 'device'] as const) {
      names.push((await schemeTurn(page).getAttribute('aria-label')) ?? '');
      await schemeTurn(page).click();
      await expectDrawnIn(page, scheme);
      await expectTheColoursOf(page, scheme === 'dark' ? 'dark' : 'light');
    }
    expect(new Set(names).size, `each of ${JSON.stringify(names)} differs`).toBe(3);
  });
});

// The form says which page to return to, and anything can be sent in its
// place. Whatever is sent, the answer returns to a page of the Shopper app.
test('the switch never sends anyone to another site', async ({ request }) => {
  for (const page of [
    '//example.com',
    'https://example.com',
    '/\\example.com',
    '?//example.com',
  ]) {
    const answer = await request.post(`${homePage}/scheme`, {
      form: { scheme: 'dark', page },
      maxRedirects: 0,
    });

    expect(answer.status()).toBe(303);
    const returnsTo = new URL(answer.headers().location ?? '', homePage);
    expect(returnsTo.origin, `${page} returns to the Shopper app`).toBe(shopperUrl);
    expect(
      returnsTo.pathname.startsWith('/en'),
      `${page} returns to a page in English`,
    ).toBe(true);
  }
});
