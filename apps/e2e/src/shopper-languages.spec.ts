import { type Browser, expect, type Locator, type Page, test } from '@playwright/test';

import { type BuildPart, pick } from './build-page';
import { createAMadeUpPart } from './catalog';
import { choiceOf, currencies, currencySwitch, setThePlatformRate } from './currencies';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { categories, endOf, linkOf } from './home-page';
import {
  addressIn,
  alternateAddresses,
  expectADifferentTextInEachLanguage,
  expectNoSidewaysScroll,
  expectPageIn,
  expectTheSameInEveryLanguage,
  expectTheSwitchInWhatTheServerSent,
  expectWithinReach,
  fetchWithNoBrowser,
  type Language,
  languages,
  languageSwitch,
  layoutOf,
  linesAsDrawn,
  linkTo,
  narrowWindow,
  readInEveryLanguage,
} from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { addAnOffer } from './offers';
import { pickerPath } from './picker';
import { shopperUrl } from './platform';
import { createAMadeUpVendor, type MadeUpVendor } from './vendors';

// A browser states its languages in its own order. The first one the platform
// has is used, a regional form counts as its language, and Kurdish is used
// when the platform has none of them.
const [kurdish, arabic, english] = languages;
const firstVisits = [
  { browser: 'Arabic as written in Iraq', states: ['ar-IQ'], arrivesAt: arabic },
  { browser: 'English', states: ['en-GB'], arrivesAt: english },
  { browser: 'French', states: ['fr-FR'], arrivesAt: kurdish },
  { browser: 'Kurdish', states: ['ckb-IQ'], arrivesAt: kurdish },
  { browser: 'French and then Arabic', states: ['fr-FR', 'ar'], arrivesAt: arabic },
];

for (const { browser, states, arrivesAt } of firstVisits) {
  test.describe(`a browser set to ${browser}`, () => {
    // Playwright's `locale` sets one language, both in what the browser tells
    // a page and in what it sends to a server. It cannot hold a list and it
    // cannot be left unset. For a browser that states several, the list is
    // written into each request on its way out, which changes only what is
    // sent to a server. That is all the Shopper app's server reads.
    if (states.length === 1) test.use({ locale: states[0] });
    else {
      test.beforeEach(async ({ page }) => {
        await page.route(`${shopperUrl}/**`, async (route) => {
          const headers = {
            ...route.request().headers(),
            'accept-language': states.join(','),
          };
          await route.continue({ headers });
        });
      });
    }

    test(`opens the bare address and arrives at the ${arrivesAt.name} one`, async ({
      page,
    }) => {
      const asked = page.waitForRequest(`${shopperUrl}/`);
      await page.goto(shopperUrl);

      // The browser did state these languages. Without this, a setting that
      // did not take would pass as a browser whose language the platform lacks.
      const sent = await (await asked).allHeaders();
      expect(sent['accept-language']).toBe(states.join(','));
      expect(page.url()).toBe(addressIn(arrivesAt));
    });
  });
}

// The home page's title, the three words of its first heading, as one line.
async function readTheTitle(page: Page): Promise<string> {
  const title = await page.getByRole('heading', { level: 1 }).textContent();
  return (title ?? '').replace(/\s+/g, ' ').trim();
}

test("each language's address, fetched with no browser, declares that language and its direction and holds that language's text", async ({
  page,
  request,
}) => {
  await readInEveryLanguage(page, '', async (language) => {
    const shown = await readTheTitle(page);
    const sent = await fetchWithNoBrowser(request, addressIn(language));

    expect(sent.status).toBe(200);
    expect(sent.language).toBe(language.tag);
    expect(sent.direction).toBe(language.direction);
    expect(shown).not.toBe('');
    expect(sent.text).toContain(shown);
  });
});

test("each language's address, fetched with no browser, holds the switch's three links", async ({
  request,
}) => {
  for (const language of languages) {
    const sent = await fetchWithNoBrowser(request, addressIn(language));

    expect(sent.status).toBe(200);
    expect(sent.language).toBe(language.tag);
    expectTheSwitchInWhatTheServerSent(sent.links);
  }
});

// The first page, and an address that matches no page, which has the switch
// as every page has. The second shows that the page is kept and not only the
// language changed: a tap does not lead back to the first page.
for (const { where, address } of [
  { where: 'on the first page', address: '' },
  { where: 'on the "not found" screen', address: '/no-such-page' },
]) {
  test(`a tap on another language arrives at the same page in that language, ${where}`, async ({
    page,
  }) => {
    await page.goto(addressIn(english, address));
    await expectPageIn(page, english);

    for (const next of [kurdish, arabic, english]) {
      await linkTo(page, next).click();

      await expect(page).toHaveURL(addressIn(next, address));
      await expectPageIn(page, next);
    }
  });
}

// A page's query, as a page with a search, filters or a page number of its
// own will have one. The home page reads none, but its address keeps it.
const aQuery = '?search=ryzen&page=2';

// The switch keeps the query (story 29), so that a search, the filters and
// the page are not lost: the helper checks that each link, in what the
// server sends and in what the browser shows, leads to the same address in
// its language, query and all.
test("the switch's links keep the page's query, in what the server sends and in the browser, in each language", async ({
  page,
}) => {
  await readInEveryLanguage(page, aQuery, async () => {});
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(javaScriptEnabled ? 'with scripts' : 'with scripts switched off', () => {
    test.use({ javaScriptEnabled });

    test("a tap on another language keeps the page's query", async ({ page }) => {
      await page.goto(addressIn(english, aQuery));
      expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(
        !javaScriptEnabled,
      );

      for (const next of [kurdish, arabic, english]) {
        await linkTo(page, next).click();

        await expect(page).toHaveURL(addressIn(next, aQuery));
        await expectPageIn(page, next);
      }
    });
  });
}

// A Shopper whose browser is set to English uses the switch once, and
// chooses Arabic.
const browserSetTo = 'en-GB';

// What a use of the switch leaves behind, in the browser it was made in. The
// bare address goes to the chosen language, whatever the browser is set to.
// The browser holds the choice for about a year. And it still has it on
// another day, after it was closed.
async function expectTheChoiceIsKept(
  page: Page,
  browser: Browser,
  chosen: Language,
): Promise<void> {
  await page.goto(shopperUrl);
  await expect(page).toHaveURL(addressIn(chosen));

  // A browser drops a cookie that has no end when it is closed, and keeps one
  // that has an end until then. What it keeps here is the choice.
  const cookies = await page.context().cookies(shopperUrl);
  const kept = cookies.filter((cookie) => cookie.expires !== -1);
  const choice = kept.filter((cookie) => cookie.value === chosen.tag);
  expect(choice).toHaveLength(1);
  const daysLeft = (choice[0].expires - Date.now() / 1000) / (60 * 60 * 24);
  expect(daysLeft).toBeGreaterThan(364);
  expect(daysLeft).toBeLessThan(366);

  const anotherDay = await browser.newContext({
    locale: browserSetTo,
    viewport: narrowWindow,
    storageState: { cookies: kept, origins: [] },
  });
  const opened = await anotherDay.newPage();
  await opened.goto(shopperUrl);
  await expect(opened).toHaveURL(addressIn(chosen));
  await anotherDay.close();
}

test.describe('in a browser set to English, after a switch to Arabic', () => {
  test.use({ locale: browserSetTo });

  test.beforeEach(async ({ page }) => {
    // The page is left alone until its scripts have loaded and run. From
    // then on a link that a script handles asks the server for no page.
    await page.goto(shopperUrl, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(addressIn(english));

    // The tap asks the server for the page, with scripts running too. The
    // server's answer is then what writes the choice down, and a browser
    // keeps that for as long as the answer says. What a page's own script
    // writes down, Safari keeps for seven days at most.
    const asked = page.waitForRequest(
      (request) => request.isNavigationRequest() && request.url() === addressIn(arabic),
      { timeout: 5000 },
    );
    await linkTo(page, arabic).click();
    await asked;
    await expect(page).toHaveURL(addressIn(arabic));
  });

  test('the bare address goes to the chosen language, although the browser is set to another, and the browser holds the choice for about a year, and not only for the session', async ({
    page,
    browser,
  }) => {
    await expectTheChoiceIsKept(page, browser, arabic);
  });

  test('with Arabic remembered, the English address shows English', async ({ page }) => {
    await page.goto(shopperUrl);
    await expect(page).toHaveURL(addressIn(arabic));

    await page.goto(addressIn(english));
    await expect(page).toHaveURL(addressIn(english));
    await expectPageIn(page, english);
  });
});

// A page on a weak connection is read before its scripts have loaded, and
// some browsers run none. The switch is three links in the page as the server
// sends it, so it works in both. The "not found" screen of an unknown
// Category, Part or Vendor is the exception: the browser draws that screen
// by script, the switch with it.
test.describe('in a browser set to English, with scripts switched off', () => {
  test.use({ locale: browserSetTo, javaScriptEnabled: false });

  test('the switch still changes the language, and the choice is kept as it is with scripts', async ({
    page,
    browser,
  }) => {
    await page.goto(addressIn(english));
    await expectPageIn(page, english);
    // The browser does run no script. Without this, a setting that did not
    // take would pass as a switch that needs none.
    expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(true);

    await linkTo(page, arabic).click();
    await expect(page).toHaveURL(addressIn(arabic));
    await expectPageIn(page, arabic);

    await expectTheChoiceIsKept(page, browser, arabic);
  });

  // The server draws the "not found" screen of such an address (follow-up
  // ticket 07), so it is read with no script: its heading and the eight
  // Categories are in the page as the server sends it.
  test('the "not found" screen of an address that matches no page is drawn with no script, in the language of its address, with its heading and the eight Categories', async ({
    page,
  }) => {
    const response = await page.goto(addressIn(english, '/no-such-page'));

    expect(response?.status()).toBe(404);
    await expectPageIn(page, english);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    for (const { key } of categories) await expect(linkOf(page, key)).toBeVisible();
  });
});

// The frame's switches stand in one row in DESIGN.md's order, the currency
// first and then the language, from the start side: on a phone the row under
// the name, from the right in Kurdish and Arabic and from the left in English.
async function expectTheCurrencyBeforeTheLanguage(
  page: Page,
  language: Language,
): Promise<void> {
  const currency = await currencySwitch(page).boundingBox();
  const languagesSwitch = await languageSwitch(page).boundingBox();
  if (currency === null || languagesSwitch === null) {
    throw new Error('The switches are not on the page.');
  }
  expect(
    Math.abs(
      currency.y + currency.height / 2 - (languagesSwitch.y + languagesSwitch.height / 2),
    ),
    'the two switches share a row',
  ).toBeLessThan(4);
  if (language.direction === 'ltr') {
    expect(currency.x, 'the currency comes first, from the left').toBeLessThan(
      languagesSwitch.x,
    );
  } else {
    expect(
      currency.x + currency.width,
      'the currency comes first, from the right',
    ).toBeGreaterThan(languagesSwitch.x + languagesSwitch.width);
  }
}

// The currency switch, beside the language switch: named in the page's
// language, before the language switch in the reading order, and each choice
// within reach of a thumb, on the first page and on the "not found" screen.
// On a phone its choices are named by the marks every price carries, IQD and
// $, which are the same in every language (DESIGN.md's The currency switch);
// from 48rem by their names.
for (const { where, address } of [
  { where: 'on the first page', address: '' },
  { where: 'on the "not found" screen', address: '/no-such-page' },
]) {
  test(`the currency switch is named in the page's language, comes before the language switch, and each of its choices, named by its mark on a phone, is large enough to tap, ${where}`, async ({
    page,
  }) => {
    const names = await readInEveryLanguage(page, address, async (language) => {
      const label = (await currencySwitch(page).getAttribute('aria-label')) ?? '';
      await expect(page.getByRole('form', { name: label, exact: true })).toHaveCount(1);
      await expectTheCurrencyBeforeTheLanguage(page, language);

      const choices: string[] = [];
      for (const currency of currencies) {
        await expectWithinReach(choiceOf(page, currency), `the choice of ${currency}`);
        choices.push((await choiceOf(page, currency).innerText()).trim());
      }
      return { label, choices };
    });

    expectADifferentTextInEachLanguage(
      new Map([...names].map(([language, { label }]) => [language, label])),
    );
    const choices = new Map(
      [...names].map(([language, { choices }]) => [language, choices]),
    );
    expectTheSameInEveryLanguage(choices);
    expect(choices.get(kurdish)).toEqual(['IQD', '$']);
  });
}

test('the same piece of text, the home page’s title, is different in each of the three languages', async ({
  page,
}) => {
  const titles = await readInEveryLanguage(page, '', () => readTheTitle(page));

  expectADifferentTextInEachLanguage(titles);
});

// The eight Categories, by their names in the page's language, which are
// translated, unlike the names of Parts (LANG-3), each a link to its
// Category's address, in the browser and in what the server sends.
test("in Kurdish, Arabic and English, the home page lists the eight Categories by their names in the page's language, each leading to its Category's address, in the browser and in what the server sends", async ({
  page,
}) => {
  const lists = await readInEveryLanguage(page, '', async (language) => {
    const names: string[] = [];
    for (const { key, inTheAddress } of categories) {
      const link = linkOf(page, key);
      await expect(link).toHaveAttribute(
        'href',
        `/${language.tag}/categories/${inTheAddress}`,
      );
      names.push((await link.innerText()).trim());
    }
    expect(new Set(names).size, `each of ${JSON.stringify(names)} differs`).toBe(
      categories.length,
    );

    const sent = await fetchWithNoBrowser(page.request, addressIn(language));
    for (const [index, { inTheAddress }] of categories.entries()) {
      expect(sent.links).toContainEqual({
        leadsTo: addressIn(language, `/categories/${inTheAddress}`),
        text: names[index],
      });
    }
    return names.join(', ');
  });

  expectADifferentTextInEachLanguage(lists);
});

// A piece of text that is in English on every page is drawn in the order it
// is written in, whatever the direction of the sentence around it, because
// it runs left to right and is kept apart from that sentence. It gives back
// what it read.
async function readDrawnAsWritten(element: Locator): Promise<string> {
  const written = ((await element.textContent()) ?? '').trim();
  expect(written).not.toBe('');
  expect((await linesAsDrawn(element)).join('').trim()).toBe(written);
  expect(await layoutOf(element)).toEqual({ direction: 'ltr', keptApart: true });
  return written;
}

// The Part names are in English on every page (LANG-3), and a price is one
// left-to-right unit in every language (DESIGN.md's The Shown Price).
test('the Part on the card, by its name, and its Lowest Price are the same characters in all three languages, and each carries a left-to-right direction of its own', async ({
  page,
}) => {
  const read = await readInEveryLanguage(page, '', async () => {
    const card = page.getByTestId('card-part');
    return [
      await readDrawnAsWritten(card.locator('bdi').first()),
      await readDrawnAsWritten(card.getByTestId('shown-price')),
    ];
  });

  expectTheSameInEveryLanguage(read);
});

// The helper finds an Arabic-Indic digit anywhere on the page, in each
// language, in what the server sent and in what the browser shows. Here the
// page holds numbers for that to mean something: each Category's count,
// every price and the platform's figures, which are the same digits in every
// language. Arabic writes a count of one or two in words, "قطعة واحدة" and
// its dual "قطعتان", where Kurdish and English write the figure, so a
// Category holding one or two Visible Parts is read as showing no digit.
test("the home page's counts, prices and figures are the same Western digits in all three languages", async ({
  page,
}) => {
  const digitsOf = (text: string) => text.match(/\d[\d,.]*/g) ?? [];
  const countOf = (text: string) => {
    const digits = digitsOf(text);
    return ['1', '2'].includes(digits.join()) ? [] : digits;
  };
  const read = await readInEveryLanguage(page, '', async () => {
    const counts = await Promise.all(
      categories.map(async ({ key }) =>
        countOf(await endOf(page.getByTestId(`category-${key}`)).innerText()),
      ),
    );
    const prices = (await page.getByTestId('shown-price').allInnerTexts()).map(digitsOf);
    const facts = digitsOf(await page.getByTestId('facts').innerText());
    expect(counts.flat().length + prices.flat().length + facts.length).toBeGreaterThan(0);
    return { counts, prices, facts };
  });

  expectTheSameInEveryLanguage(read);
});

// next-intl's proxy sees an address with a dot in it, as a file's would have,
// only under a language, and the "not found" screen of an address that
// matches no page takes its language from the proxy (follow-up ticket 07).
test('an address with a dot in it, under a language, is answered 404 with the "not found" screen in that language', async ({
  page,
}) => {
  const response = await page.goto(addressIn(english, '/no.such.page'));

  expect(response?.status()).toBe(404);
  await expectPageIn(page, english);
});

// The server draws the "not found" screen of such an address, with the
// status 404 (follow-up ticket 07), so what it sent is read as well as what
// the browser shows: the language, the direction and the switch.
test("an address that matches no page is answered 404, with the frame and the switch, in the visitor's language, and lists the eight Categories, each leading to its Category's address", async ({
  page,
}) => {
  const read = await readInEveryLanguage(
    page,
    '/no-such-page',
    async (language, response) => {
      expect(response.status()).toBe(404);
      const names: string[] = [];
      for (const { key, inTheAddress } of categories) {
        const link = linkOf(page, key);
        await expect(link).toHaveAttribute(
          'href',
          `/${language.tag}/categories/${inTheAddress}`,
        );
        names.push((await link.innerText()).trim());
      }
      expect(new Set(names).size).toBe(categories.length);
      return {
        heading: await page.getByRole('heading', { level: 1 }).innerText(),
        names: names.join(', '),
      };
    },
  );

  expectADifferentTextInEachLanguage(
    new Map([...read].map(([language, { heading }]) => [language, heading])),
  );
  expectADifferentTextInEachLanguage(
    new Map([...read].map(([language, { names }]) => [language, names])),
  );
});

test("the answer to a language's address names that page's address in all three languages", async ({
  request,
}) => {
  for (const language of languages) {
    const answer = await request.get(addressIn(language));
    const named = alternateAddresses(answer.headers().link);

    for (const other of languages) {
      expect(
        named.get(other.tag),
        `${language.name}'s answer names the ${other.name} address`,
      ).toBe(addressIn(other));
    }
  }
});

test("the tab's title is different in each language", async ({ page }) => {
  const titles = await readInEveryLanguage(page, '', () => page.title());

  expectADifferentTextInEachLanguage(titles);
});

// The pieces of the page within `piece`, the piece among them, that reach
// past either edge of the window, each named by its tag, its test id and the
// start of its words, with how far it reaches past. What is hidden from
// readers is left out: the back cover's cropped name is cut by the window's
// edge on purpose (DESIGN.md's The back cover).
async function piecesPastTheWindow(piece: Locator): Promise<string[]> {
  return piece.evaluate((root) => {
    const width = document.documentElement.clientWidth;
    const past: string[] = [];
    for (const element of [root, ...root.querySelectorAll('*')]) {
      if (element.closest('[aria-hidden="true"]') !== null) continue;
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      const by = Math.max(box.right - width, -box.left);
      if (by > 0.5) {
        const name = element.getAttribute('data-testid') ?? '';
        const words = (element.textContent ?? '').trim().slice(0, 24);
        past.push(
          `${element.tagName.toLowerCase()}[${name}] "${words}" ${Math.round(by)} px`,
        );
      }
    }
    return past;
  });
}

// A Shopper may make the browser's text larger, to 200% (WCAG 1.4.4), and
// on a phone 390 pixels wide, in Kurdish, whose words run longest, the
// frame's header with its switches, and the back cover, still lie within the
// window, and the page does not scroll sideways (a follow-up of browse's code
// review: ticket 09's stub scrolled the page 22 pixels, and its switches and
// back cover reached about 42 pixels past the edge).
test.describe("with the browser's text at 200% on a phone 390 pixels wide", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("in Kurdish, the frame's header, its switches and the back cover lie within the window on the home page, a Category page and the not-found page", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const devtools = await page.context().newCDPSession(page);
    try {
      // The browser's own text size, as its settings set it.
      await devtools.send('Page.setFontSizes', { fontSizes: { standard: 32, fixed: 26 } });
      for (const [name, address] of [
        ['the home page', ''],
        ['a Category page', '/categories/cpu'],
        ['the not-found page', '/no-such-page'],
      ]) {
        await test.step(name, async () => {
          await page.goto(addressIn(kurdish, address));
          await expect(page.getByTestId('frame')).toBeVisible();
          await page.evaluate(() => document.fonts.ready);
          expect(
            await page.evaluate(() => getComputedStyle(document.documentElement).fontSize),
            'the page takes the browser’s text size',
          ).toBe('32px');

          for (const piece of [
            page.getByTestId('frame-header'),
            page.getByTestId('back-cover'),
          ]) {
            expect(await piecesPastTheWindow(piece)).toEqual([]);
          }
          await expectNoSidewaysScroll(page);
        });
      }
    } finally {
      await devtools.send('Page.setFontSizes', { fontSizes: { standard: 16, fixed: 13 } });
      await devtools.detach();
    }
  });

  // A Shown Price of seven figures in dinars, "≈ 6,499,750 IQD", is wider
  // than a phone's line at twice the text. It is one left-to-right unit
  // whose figure never breaks, so its unit wraps under its figure, and only
  // where its line cannot hold it whole: the "≈" stays with the figure, and
  // the unit stands on the side the price is set to, so that the price's
  // edge stays straight (DESIGN.md's The Shown Price, the owner's option A
  // of 13 November 2026). Before, the sheet clipped what ran past its line,
  // pulling the line's other columns with it (builder ticket 08's break-ui).
  test.describe('with prices of seven figures in dinars', () => {
    // The finished page: a price settling into its column comes 16 pixels
    // from the side (Motion 2), and reduced motion shows it settled.
    test.use({ reducedMotion: 'reduce' });
    // The run's Parts are found by the run's word in their names, sixteen
    // digits with nowhere to break, as a made-up Vendor's name and a made-up
    // Part's part number hold one too. At twice the text such a word is
    // wider than a phone's line, and breaks where it must rather than widen
    // its page past the window, as a sheet's title does (follow-up ticket
    // 12): the Part page's plate and the Vendor page's coupon grew to it.
    const word = aWordUniqueToTheRun();
    // The Platform Rate behind the run's Converted Prices.
    const rate = 1500;

    // A Vendor that offers every Part, the GPU and the kit in dollars
    // alone, so that its prices and its total in dinars are converted, and
    // one that offers the CPU and the GPU, which lacks the kit.
    let everything: MadeUpVendor;
    let lacksTheKit: MadeUpVendor;
    let cpu: BuildPart;
    let gpu: BuildPart;
    let kit: BuildPart;

    test.beforeAll(async ({ browser }) => {
      test.setTimeout(120_000);
      const context = await browser.newContext({ javaScriptEnabled: true });
      try {
        const request = context.request;
        const authorization = await authorizationOfTheDevelopmentAdmin(
          await context.newPage(),
        );
        await setThePlatformRate(request, authorization, rate);
        everything = await createAMadeUpVendor(request, authorization);
        lacksTheKit = await createAMadeUpVendor(request, authorization);
        const aPart = async (category: BuildPart['category'], what: string) => {
          const named = { name: `Made-up test ${what} ${word}` };
          const { id } = await createAMadeUpPart(
            request,
            authorization,
            {},
            category,
            named,
          );
          return { id, category };
        };
        cpu = await aPart('cpu', 'CPU');
        gpu = await aPart('gpu', 'GPU');
        kit = await aPart('ram', 'RAM kit');
        const offer = (vendor: MadeUpVendor, part: BuildPart, details: object) =>
          addAnOffer(request, authorization, vendor.id, part.id, details);
        // ≈ 3,750,000 IQD and 3,999,750 IQD.
        await offer(everything, gpu, { usdPrice: '2499.99' });
        await offer(lacksTheKit, gpu, { iqdPrice: 3_999_750 });
        // 1,249,750 IQD and ≈ 1,350,000 IQD.
        await offer(everything, cpu, { iqdPrice: 1_249_750 });
        await offer(lacksTheKit, cpu, { usdPrice: '899.99' });
        // ≈ 750,000 IQD.
        await offer(everything, kit, { usdPrice: '499.99' });
      } finally {
        await context.close();
      }
    });

    test('in Kurdish and English, no Shown Price runs past its line, and nothing reaches past the window, on the Build page, the picker, a Category page, a Part page or a Vendor page, their names holding the run’s word; at the text’s own size each price keeps one line', async ({
      page,
    }) => {
      test.setTimeout(180_000);
      // The Build whose totals are the longest: two of the kit, ≈ 6,499,750
      // IQD across Vendors and at the Vendor that offers every Part.
      for (const part of [cpu, gpu, kit, kit]) await pick(page, part);
      const pages = [
        ['the Build page', '/build'],
        ['the picker', pickerPath('gpu', `?search=${word}`)],
        ['a Category page', `/categories/gpu?search=${word}`],
        ['a Part page', `/parts/${gpu.id}`],
        ['a Vendor page', `/vendors/${everything.id}`],
      ] as const;

      const devtools = await page.context().newCDPSession(page);
      try {
        for (const size of [16, 32]) {
          // The browser's own text size, as its settings set it.
          await devtools.send('Page.setFontSizes', {
            fontSizes: { standard: size, fixed: (size * 13) / 16 },
          });
          for (const language of [kurdish, english]) {
            for (const [name, address] of pages) {
              await test.step(`${name} in ${language.name}, the text at ${size} pixels`, async () => {
                await page.goto(addressIn(language, address));
                await expect(page.getByTestId('frame')).toBeVisible();
                await page.evaluate(() => document.fonts.ready);
                expect(
                  await page.evaluate(
                    () => getComputedStyle(document.documentElement).fontSize,
                  ),
                ).toBe(`${size}px`);
                // Every disclosure open, as a Vendor's Parts on the Build page.
                await page.evaluate(() => {
                  for (const fold of document.querySelectorAll('details')) fold.open = true;
                });
                const prices = await howThePricesStand(page);
                expect(
                  prices.map(({ written }) => written),
                  'the page shows a price of seven figures in dinars',
                ).toContainEqual(expect.stringMatching(/^(≈ )?\d,\d{3},\d{3} IQD$/));
                const faults = prices.flatMap(({ faults }) => faults);
                expect(faults).toEqual([]);
                if (size === 16) {
                  expect(
                    prices.filter(({ lines }) => lines > 1).map(({ written }) => written),
                    'at its own size, the text keeps every price on one line',
                  ).toEqual([]);
                }
                // The page does not scroll sideways, and none of its words
                // reaches past the window, even where a piece's edge would
                // cut it: a name's word of sixteen digits breaks where it
                // must, on the Vendor's coupon and the Part's plate as in
                // its part number and on every list.
                expect(await piecesPastTheWindow(page.getByRole('main'))).toEqual([]);
                await expectNoSidewaysScroll(page);
              });
            }
          }
        }
      } finally {
        await devtools.send('Page.setFontSizes', {
          fontSizes: { standard: 16, fixed: 13 },
        });
        await devtools.detach();
      }
    });
  });
});

// Each Shown Price on the page, as the browser drew it against its line: the
// item, the slip's line or the sentence it stands on. Read character by
// character, as `linesAsDrawn` reads them, so that the markup it comes from
// does not matter. Its faults: a character past its line, or past the
// window; its figure, with its "≈", broken across two lines; its unit
// anywhere but on the figure's line or alone on the line under it; and a
// unit under the figure that is not flush with it on the side the price is
// set to on its line, so that the price's edge would not stay straight.
async function howThePricesStand(
  page: Page,
): Promise<{ written: string; lines: number; faults: string[] }[]> {
  return page.getByTestId('shown-price').evaluateAll((prices) =>
    prices.map((price) => {
      const written = (price.textContent ?? '').replace(/\s+/g, ' ').trim();
      const line = price.closest('li, p') ?? price.parentElement ?? price;
      const edges = line.getBoundingClientRect();
      const characters: DOMRect[] = [];
      const texts = document.createTreeWalker(price, NodeFilter.SHOW_TEXT);
      for (let text = texts.nextNode(); text !== null; text = texts.nextNode()) {
        const content = text.textContent ?? '';
        for (let index = 0; index < content.length; index += 1) {
          if (/\s/.test(content[index])) continue;
          const one = document.createRange();
          one.setStart(text, index);
          one.setEnd(text, index + 1);
          characters.push(one.getBoundingClientRect());
        }
      }
      // The characters of its figure, "≈" and all, and those of its unit.
      const unitLength = written.length - written.lastIndexOf(' ') - 1;
      const figure = characters.slice(0, characters.length - unitLength);
      const unit = characters.slice(characters.length - unitLength);
      const box = (of: DOMRect[]) => ({
        left: Math.min(...of.map(({ left }) => left)),
        right: Math.max(...of.map(({ right }) => right)),
        top: Math.min(...of.map(({ top }) => top)),
        bottom: Math.max(...of.map(({ bottom }) => bottom)),
      });
      const figureBox = box(figure);
      const unitBox = box(unit);
      const middle = ({ top, bottom }: { top: number; bottom: number }) =>
        (top + bottom) / 2;
      // A character is on a line under another's when its middle is below
      // the other's foot.
      const firstFoot = Math.min(...figure.map(({ bottom }) => bottom));
      const faults: string[] = [];

      const past = Math.max(
        ...characters.map(({ left, right }) =>
          Math.max(right - edges.right, edges.left - left),
        ),
      );
      if (past > 0.5) faults.push(`"${written}" runs ${Math.round(past)} px past its line`);
      const windowWidth = document.documentElement.clientWidth;
      const outside = Math.max(
        ...characters.map(({ left, right }) => Math.max(right - windowWidth, -left)),
      );
      if (outside > 0.5) {
        faults.push(`"${written}" runs ${Math.round(outside)} px past the window`);
      }
      if (figure.some((one) => middle(one) > firstFoot)) {
        faults.push(`"${written}" breaks inside its figure`);
      }
      const underTheFigure = unit.some((one) => middle(one) > firstFoot);
      if (underTheFigure) {
        // Under the figure, on the line under it, flush with the figure's
        // edge on the side the price is set to: the side its line aligns
        // what holds the price to, read against the line's direction, its
        // end on an item, and its start on a slip's line stacked on a
        // narrow slip.
        const holder = getComputedStyle(price.parentElement ?? price);
        const toTheEnd = holder.textAlign === 'end' || holder.textAlign === 'right';
        const side =
          holder.textAlign === 'left' || holder.textAlign === 'right'
            ? holder.textAlign
            : toTheEnd === (holder.direction === 'rtl')
              ? 'left'
              : 'right';
        if (Math.abs(unitBox[side] - figureBox[side]) > 1) {
          faults.push(`"${written}" has its unit off the ${side} edge of its figure`);
        }
        if (unit.some((one) => middle(one) < figureBox.bottom)) {
          faults.push(`"${written}" has its unit across two lines`);
        }
        if (unitBox.top - figureBox.bottom > figureBox.bottom - figureBox.top) {
          faults.push(`"${written}" has its unit more than a line under its figure`);
        }
      }

      return { written, lines: underTheFigure ? 2 : 1, faults };
    }),
  );
}
