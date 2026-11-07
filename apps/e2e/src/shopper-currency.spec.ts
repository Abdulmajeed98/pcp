import { expect, test } from '@playwright/test';

import {
  choose,
  currencies,
  expectChosen,
  expectPricesShownIn,
  expectTheChoiceKept,
} from './currencies';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { aPartWithPricesInBothCurrencies } from './home-page';
import { addressIn, expectPageIn, languages, linkTo } from './languages';
import { shopperUrl } from './platform';

const [, arabic] = languages;

// The currency is not about a language, so these tests open the English
// pages. The language tests check the switch in all three.
const firstPage = `${shopperUrl}/en`;
// An address that matches no page.
const notFound = `${firstPage}/no-such-page`;
// The first page with a query, as a page with a search or a page number of
// its own will have one.
const withAQuery = `${firstPage}?search=ryzen&page=2`;
// The first page with a price range in its query, as a Category page will
// have one, both its ends and a search among them. A range is typed in the
// currency the Shopper had, so a choice returns to the page without it.
const withAPriceRange = `${firstPage}?lowest=150000&search=ryzen&highest=900000`;
const withThePriceRangeDropped = `${firstPage}?search=ryzen`;

// The home page shows a price in each currency, whatever earlier runs left
// in the development database: the first CPU's Lowest Price among them. The
// rows are made as the development Admin, who logs in through the
// dashboard, so the context they are made in runs script: a context made in
// a hook takes the options of the first line a worker runs, and that line
// may be one with scripts switched off, as when it runs alone or after a
// line that failed.
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: true });
  try {
    const authorization = await authorizationOfTheDevelopmentAdmin(await context.newPage());
    await aPartWithPricesInBothCurrencies(context.request, authorization);
  } finally {
    await context.close();
  }
});

test('a fresh browser shows the switch with dinars chosen, and every price on the home page in dinars', async ({
  page,
}) => {
  expect(await page.context().cookies(shopperUrl)).toEqual([]);

  await page.goto(firstPage);

  await expectChosen(page, 'IQD');
  await expectPricesShownIn(page, 'IQD');
});

test('choosing dollars returns to the same page with dollars chosen and every price in dollars; choosing dinars switches back', async ({
  page,
}) => {
  await page.goto(firstPage);

  await choose(page, 'USD');
  await expectChosen(page, 'USD');
  await expectPricesShownIn(page, 'USD');

  await choose(page, 'IQD');
  await expectChosen(page, 'IQD');
  await expectPricesShownIn(page, 'IQD');
});

// Where a price leads a page, the same choice stands above it as the plate's
// tabs (DESIGN.md's The currency switch): a choice there is the frame's too.
test("the plate's tabs are the same choice: choosing dollars there returns to the home page with dollars chosen in the frame's switch and on the tabs", async ({
  page,
}) => {
  await page.goto(firstPage);
  const tabs = page.getByTestId('plate-tabs');
  await expect(tabs.getByRole('button')).toHaveCount(currencies.length);
  await expect(tabs.locator('button[value="IQD"]')).toHaveAttribute('aria-current', 'true');

  const asked = page.waitForRequest(
    (request) => request.isNavigationRequest() && request.method() === 'POST',
  );
  await tabs.locator('button[value="USD"]').click();
  await asked;
  await expect(tabs.locator('button[value="USD"]')).toHaveAttribute('aria-current', 'true');
  expect(page.url()).toBe(firstPage);
  await expectChosen(page, 'USD');
  await expectPricesShownIn(page, 'USD');
});

test('choosing a currency returns to the same page with the same query', async ({
  page,
}) => {
  await page.goto(withAQuery);

  await choose(page, 'USD');
  expect(page.url()).toBe(withAQuery);
  await expectChosen(page, 'USD');
});

test('choosing a currency drops a price range from the query and keeps the rest', async ({
  page,
}) => {
  await page.goto(withAPriceRange);

  await choose(page, 'USD', withThePriceRangeDropped);
  await expectChosen(page, 'USD');
});

test.describe('after choosing dollars', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(firstPage);
    await choose(page, 'USD');
  });

  test('a reload keeps dollars', async ({ page }) => {
    await page.reload();

    await expectChosen(page, 'USD');
    await expectPricesShownIn(page, 'USD');
  });

  test('a new tab keeps dollars', async ({ page }) => {
    const tab = await page.context().newPage();
    await tab.goto(firstPage);

    await expectChosen(tab, 'USD');
    await expectPricesShownIn(tab, 'USD');
  });

  // Next answers such an address with the status 404 and a bare document, and
  // the browser draws the "not found" screen from it, the switch with it.
  test('the "not found" screen keeps dollars, and a choice made there returns to it', async ({
    page,
  }) => {
    const response = await page.goto(notFound);
    expect(response?.status()).toBe(404);
    await expectChosen(page, 'USD');

    await choose(page, 'IQD');
    await expectChosen(page, 'IQD');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('the browser holds the choice for about a year, and not only for the session', async ({
    page,
    browser,
  }) => {
    await expectTheChoiceKept(page, browser, 'USD');
  });

  test('changing the language keeps dollars, and changing the currency keeps the language', async ({
    page,
  }) => {
    await linkTo(page, arabic).click();
    await expect(page).toHaveURL(addressIn(arabic));
    await expectPageIn(page, arabic);
    await expectChosen(page, 'USD');

    await choose(page, 'IQD');
    await expect(page).toHaveURL(addressIn(arabic));
    await expectPageIn(page, arabic);
    await expectChosen(page, 'IQD');
  });
});

// A cookie the platform did not write, such as one from an older version or
// one changed by hand, is read as no choice at all.
test('a browser that holds anything but one of the two currencies is shown dinars', async ({
  page,
}) => {
  await page.context().addCookies([{ name: 'currency', value: 'EUR', url: shopperUrl }]);
  await page.goto(firstPage);

  await expectChosen(page, 'IQD');
  await expectPricesShownIn(page, 'IQD');
});

// A page on a weak connection is read before its scripts have loaded, and
// some browsers run none. The switch is a form in the page as the server sends
// it, so it works in both, and the choice is read on the server. The "not
// found" screen is the exception: the browser draws that screen by script,
// the switch with it.
test.describe('with scripts switched off', () => {
  test.use({ javaScriptEnabled: false });

  test('the switch still changes the currency, and the choice is kept as it is with scripts', async ({
    page,
    browser,
  }) => {
    await page.goto(firstPage);
    // The browser does run no script. Without this, a setting that did not
    // take would pass as a switch that needs none.
    expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(true);
    await expectChosen(page, 'IQD');

    await choose(page, 'USD');
    await expectChosen(page, 'USD');
    await expectPricesShownIn(page, 'USD');

    await expectTheChoiceKept(page, browser, 'USD', { javaScriptEnabled: false });
  });

  test('the switch keeps the page’s query too', async ({ page }) => {
    await page.goto(withAQuery);

    await choose(page, 'USD');
    expect(page.url()).toBe(withAQuery);
    await expectChosen(page, 'USD');
  });

  test('the switch drops a price range from the query too, and keeps the rest', async ({
    page,
  }) => {
    await page.goto(withAPriceRange);

    await choose(page, 'USD', withThePriceRangeDropped);
    await expectChosen(page, 'USD');
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
    const answer = await request.post(`${firstPage}/currency`, {
      form: { currency: 'USD', page },
      maxRedirects: 0,
    });

    expect(answer.status()).toBe(303);
    const returnsTo = new URL(answer.headers().location ?? '', firstPage);
    expect(returnsTo.origin, `${page} returns to the Shopper app`).toBe(shopperUrl);
    expect(
      returnsTo.pathname.startsWith('/en'),
      `${page} returns to a page in English`,
    ).toBe(true);
  }
});
