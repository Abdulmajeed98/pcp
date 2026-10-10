import { expect, test } from '@playwright/test';

import {
  addressIn,
  alternateAddresses,
  checkInEveryLanguage,
  expectADifferentTextInEachLanguage,
  expectPageIn,
  expectTheSwitchsLinks,
  fetchWithNoBrowser,
  languages,
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
    expectTheSwitchsLinks(sent.links);
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

    for (const next of [arabic, kurdish, english]) {
      await linkTo(page, next).click();

      await expect(page).toHaveURL(addressIn(next, address));
      await expectPageIn(page, next);
    }
  });
}

// A Shopper whose browser is set to English uses the switch once, and
// chooses Arabic.
test.describe('after a switch to Arabic, in a browser set to English', () => {
  const browserSetTo = 'en-GB';
  test.use({ locale: browserSetTo });

  test.beforeEach(async ({ page }) => {
    await page.goto(shopperUrl);
    await expect(page).toHaveURL(addressIn(english));

    await linkTo(page, arabic).click();
    await expect(page).toHaveURL(addressIn(arabic));
  });

  test('the bare address goes to the chosen language, although the browser is set to another, and the browser holds the choice for about a year, and not only for the session', async ({
    page,
    context,
    browser,
  }) => {
    await page.goto(shopperUrl);
    await expect(page).toHaveURL(addressIn(arabic));

    // A browser drops a cookie that has no end when it is closed, and keeps
    // one that has an end until then. What it keeps here is the choice, and
    // it keeps it for a year.
    const cookies = await context.cookies(shopperUrl);
    const kept = cookies.filter((cookie) => cookie.expires !== -1);
    const choice = kept.filter((cookie) => cookie.value === arabic.tag);
    expect(choice).toHaveLength(1);
    const daysLeft = (choice[0].expires - Date.now() / 1000) / (60 * 60 * 24);
    expect(daysLeft).toBeGreaterThan(364);
    expect(daysLeft).toBeLessThan(366);

    // The same browser on another day: it was closed in between, and has
    // only what it kept.
    const anotherDay = await browser.newContext({
      locale: browserSetTo,
      viewport: narrowWindow,
      storageState: { cookies: kept, origins: [] },
    });
    const opened = await anotherDay.newPage();
    await opened.goto(shopperUrl);
    await expect(opened).toHaveURL(addressIn(arabic));
    await anotherDay.close();
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
// some browsers run none. The switch is three links, so it works in both.
test.describe('with scripts switched off in the browser', () => {
  test.use({ javaScriptEnabled: false, locale: 'en-GB' });

  test('the switch still changes the language, and the choice is remembered', async ({
    page,
  }) => {
    await page.goto(addressIn(english));
    // The browser does run no script. Without this, a setting that did not
    // take would pass as a switch that needs none.
    expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(true);

    await linkTo(page, arabic).click();
    await expect(page).toHaveURL(addressIn(arabic));
    await expectPageIn(page, arabic);

    await page.goto(shopperUrl);
    await expect(page).toHaveURL(addressIn(arabic));
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
