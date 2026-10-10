import { expect, test } from '@playwright/test';

import {
  addressIn,
  alternateAddresses,
  checkInEveryLanguage,
  expectADifferentTextInEachLanguage,
  fetchWithNoBrowser,
  type Language,
  languages,
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
  await checkInEveryLanguage(page, '', async (language) => {
    const shown = await page.getByTestId('placeholder').innerText();
    const served = await fetchWithNoBrowser(request, addressIn(language));

    expect(served.status).toBe(200);
    expect(served.language).toBe(language.tag);
    expect(served.direction).toBe(language.direction);
    expect(shown.trim()).not.toBe('');
    expect(served.text).toContain(shown.trim());
  });
});

test('the same piece of text is different in each of the three languages', async ({
  page,
}) => {
  const notices = new Map<Language, string>();
  await checkInEveryLanguage(page, '', async (language) => {
    notices.set(language, await page.getByTestId('placeholder').innerText());
  });

  expectADifferentTextInEachLanguage(notices);
});

test("an address that matches no page is answered 404, with the frame, in the visitor's language", async ({
  page,
}) => {
  const headings = new Map<Language, string>();
  await checkInEveryLanguage(page, '/no-such-page', async (language, response) => {
    expect(response.status()).toBe(404);
    headings.set(
      language,
      await page.getByTestId('frame').getByRole('heading').innerText(),
    );
  });

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
  const titles = new Map<Language, string>();
  await checkInEveryLanguage(page, '', async (language) => {
    titles.set(language, await page.title());
  });

  expectADifferentTextInEachLanguage(titles);
});
