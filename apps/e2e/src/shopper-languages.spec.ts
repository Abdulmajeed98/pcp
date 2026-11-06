import { type Browser, expect, type Locator, type Page, test } from '@playwright/test';

import { choiceOf, currencies, currencySwitch } from './currencies';
import { categories, endOf, linkOf } from './home-page';
import {
  addressIn,
  alternateAddresses,
  expectADifferentTextInEachLanguage,
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
import { shopperUrl } from './platform';

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
// sends it, so it works in both. The "not found" screen is the exception:
// the browser draws that screen by script, the switch with it.
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
// within reach of a thumb, on the first page and on the "not found" screen,
// which the browser draws by script. On a phone its choices are named by the
// marks every price carries, IQD and $, which are the same in every language
// (DESIGN.md's The currency switch); from 48rem by their names.
for (const { where, address, drawnByScript } of [
  { where: 'on the first page', address: '', drawnByScript: false },
  { where: 'on the "not found" screen', address: '/no-such-page', drawnByScript: true },
]) {
  test(`the currency switch is named in the page's language, comes before the language switch, and each of its choices, named by its mark on a phone, is large enough to tap, ${where}`, async ({
    page,
  }) => {
    const names = await readInEveryLanguage(
      page,
      address,
      async (language) => {
        const label = (await currencySwitch(page).getAttribute('aria-label')) ?? '';
        await expect(page.getByRole('form', { name: label, exact: true })).toHaveCount(1);
        await expectTheCurrencyBeforeTheLanguage(page, language);

        const choices: string[] = [];
        for (const currency of currencies) {
          await expectWithinReach(choiceOf(page, currency), `the choice of ${currency}`);
          choices.push((await choiceOf(page, currency).innerText()).trim());
        }
        return { label, choices };
      },
      { drawnByScript },
    );

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
// language.
test("the home page's counts, prices and figures are the same Western digits in all three languages", async ({
  page,
}) => {
  const digitsOf = (text: string) => text.match(/\d[\d,.]*/g) ?? [];
  const read = await readInEveryLanguage(page, '', async () => {
    const counts = await Promise.all(
      categories.map(async ({ key }) =>
        digitsOf(await endOf(page.getByTestId(`category-${key}`)).innerText()),
      ),
    );
    const prices = (await page.getByTestId('shown-price').allInnerTexts()).map(digitsOf);
    const facts = digitsOf(await page.getByTestId('facts').innerText());
    expect(counts.flat().length + prices.flat().length + facts.length).toBeGreaterThan(0);
    return { counts, prices, facts };
  });

  expectTheSameInEveryLanguage(read);
});

// Next answers such an address with the status 404 and a bare document, and
// the browser draws the "not found" screen from it. The screen is therefore
// checked as the browser shows it, and what the server sent is not read.
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
    { drawnByScript: true },
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
