import { type Browser, expect, type Page, test } from '@playwright/test';

import {
  addressIn,
  alternateAddresses,
  checkInEveryLanguage,
  expectADifferentTextInEachLanguage,
  expectPageIn,
  expectTheSwitchInWhatTheServerSent,
  fetchWithNoBrowser,
  type Language,
  languages,
  layoutOf,
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

test("each language's address, fetched with no browser, declares that language and its direction and holds that language's text", async ({
  page,
  request,
}) => {
  await readInEveryLanguage(page, '', async (language) => {
    const shown = (await page.getByTestId('placeholder').innerText()).trim();
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

test('the same piece of text is different in each of the three languages', async ({
  page,
}) => {
  const notices = await readInEveryLanguage(page, '', () =>
    page.getByTestId('placeholder').innerText(),
  );

  expectADifferentTextInEachLanguage(notices);
});

// Text that is in English and runs left to right on every page: a Part name,
// a specification, and a number beside its unit. In a Kurdish or an Arabic
// sentence the browser reorders the pieces of such text unless it is kept
// apart from the sentence.
const leftToRightAndKeptApart = { direction: 'ltr', keptApart: true };

test('the Part name and the specification are the same characters in all three languages, and each carries a left-to-right direction of its own', async ({
  page,
}) => {
  await readInEveryLanguage(page, '', async () => {
    for (const alwaysEnglish of ['Ryzen 5 7600', 'DDR5-6000']) {
      // Found by its own characters, as an element that holds nothing else.
      const marked = page.getByText(alwaysEnglish, { exact: true });

      await expect(marked).toBeVisible();
      expect(await layoutOf(marked)).toEqual(leftToRightAndKeptApart);
    }
  });
});

// The direction a piece of text has of its own: that of its first letter.
// Arabic script runs right to left, and Latin script left to right.
function directionOfItsOwn(text: string): 'rtl' | 'ltr' {
  const firstLetter = /\p{L}/u.exec(text)?.[0] ?? '';

  return /\p{Script=Arabic}/u.test(firstLetter) ? 'rtl' : 'ltr';
}

// What someone wrote, such as a Vendor's name and address, is shown as
// written on every page (LANG-4). Each line runs in its own direction,
// whatever the page's is: the one in Arabic script right to left on the
// English page, and the one in Latin script left to right on the other two.
test('the two as-written lines are the same in all three languages, and each carries its own direction', async ({
  page,
}) => {
  const written = await readInEveryLanguage(page, '', async () => {
    const lines = page.getByTestId('as-written');
    await expect(lines).toHaveCount(2);

    const texts: string[] = [];
    for (const line of await lines.all()) {
      const text = await line.innerText();
      expect(await layoutOf(line)).toEqual({
        direction: directionOfItsOwn(text),
        keptApart: true,
      });
      texts.push(text);
    }
    // One line in each script, so both directions were checked.
    expect(texts.map(directionOfItsOwn).sort()).toEqual(['ltr', 'rtl']);

    return texts;
  });

  const [inKurdish, inArabic, inEnglish] = languages.map((language) =>
    written.get(language),
  );
  expect(inArabic).toEqual(inKurdish);
  expect(inEnglish).toEqual(inKurdish);
});

// The sample the placeholder page shows: a sentence that counts, drawn once
// for each of these counts, which between them take every plural form Arabic
// has but the one for nothing.
const sampleCounts = [1, 2, 3, 11, 100];

// The helper finds an Arabic-Indic digit anywhere on the page, in each
// language. The page has to hold numbers for that to mean anything: on the
// installed Node, a library that formats a number for Kurdish writes it in
// Arabic-Indic digits, and a page in English never shows it.
test('the sample number reads 1,575,000 in all three languages, and no Arabic-Indic digit is anywhere on the page in any language, the counted sentences among it', async ({
  page,
}) => {
  await readInEveryLanguage(page, '', async () => {
    // The number is beside its unit. The two are one piece of text that runs
    // left to right, so that they do not swap places in a sentence that runs
    // the other way.
    const numberWithUnit = page.getByText('1,575,000 IOPS', { exact: true });
    await expect(numberWithUnit).toBeVisible();
    expect(await layoutOf(numberWithUnit)).toEqual(leftToRightAndKeptApart);

    const sentences = await page.getByTestId('counted-sentence').allInnerTexts();
    expect(sentences).toHaveLength(sampleCounts.length);
    for (const [index, count] of sampleCounts.entries()) {
      // A language may have a word of its own for one and for two, as Arabic
      // has. From three up every language writes the count in digits.
      if (count >= 3) expect(sentences[index]).toContain(String(count));
    }
  });
});

// Category names are translated, unlike the names of Parts (LANG-3). There
// are eight Categories.
test('the list of Category names is different in each of the three languages', async ({
  page,
}) => {
  const lists = await readInEveryLanguage(page, '', async () => {
    const names = await page
      .getByTestId('category-names')
      .getByRole('listitem')
      .allInnerTexts();

    expect(names).toHaveLength(8);
    expect(new Set(names).size, `each of ${JSON.stringify(names)} differs`).toBe(8);
    return names.join(', ');
  });

  expectADifferentTextInEachLanguage(lists);
});

// Next answers such an address with the status 404 and a bare document, and
// the browser draws the "not found" screen from it. The screen is therefore
// checked as the browser shows it, and what the server sent is not read.
test("an address that matches no page is answered 404, with the frame and the switch, in the visitor's language", async ({
  page,
}) => {
  const headings = await readInEveryLanguage(
    page,
    '/no-such-page',
    async (_language, response) => {
      expect(response.status()).toBe(404);
      return page.getByTestId('frame').getByRole('heading').innerText();
    },
    { drawnByScript: true },
  );

  expectADifferentTextInEachLanguage(headings);
});

test('in each language the page does not scroll sideways', async ({ page }) => {
  await checkInEveryLanguage(page);
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
