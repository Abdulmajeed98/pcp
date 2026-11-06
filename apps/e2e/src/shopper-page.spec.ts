import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import type { Currency } from './currencies';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import {
  aPartWithPricesInBothCurrencies,
  bringIntoView,
  categories,
  categoryItems,
  endOf,
  itemOf,
  secondLineOf,
  shownPriceText,
  theFirstPageOf,
  theNumber,
  theOffersOf,
  thePartForThePlate,
  thePlatformsFigures,
} from './home-page';
import { addressIn, languages } from './languages';
import { shopperUrl } from './platform';

const [, , english] = languages;

// The home page in English. What these tests read is not a translation, so
// one language is enough; the language tests read every page in all three.
const homePage = addressIn(english);
// An address that matches no page.
const notFound = addressIn(english, '/no-such-page');

// The home page shows a price in each currency, whatever earlier runs left
// in the development database.
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  try {
    const authorization = await authorizationOfTheDevelopmentAdmin(await context.newPage());
    await aPartWithPricesInBothCurrencies(context.request, authorization);
  } finally {
    await context.close();
  }
});

// The home page, as the server drew it in `currency`, shows what the API
// answers: for each of the eight Categories its count of Visible Parts and
// its first Part with that Part's Lowest Price; the Part on the plate, the
// one with the most Vendors on the first page of the eight lists, with its
// slip; and the platform's figures, on the card and in the facts row. Each is
// read from the API as anyone may read it, and the page is read after it.
async function expectWhatTheApiAnswers(
  page: Page,
  request: APIRequestContext,
  currency: Currency,
): Promise<void> {
  const figures = await thePlatformsFigures(request);
  const firstPages = await Promise.all(
    categories.map(({ key }) => theFirstPageOf(request, key, currency)),
  );
  await page.goto(homePage);

  for (const [index, { key }] of categories.entries()) {
    await test.step(`the ${key} Category`, async () => {
      const { totalElements, content } = firstPages[index];
      const item = itemOf(page, key);
      await expect(endOf(item)).toHaveText(theNumber(totalElements));

      const [first] = content;
      if (first === undefined) {
        await expect(secondLineOf(item)).toHaveCount(0);
        return;
      }
      await expect(secondLineOf(item)).toContainText(first.name);
      const price = secondLineOf(item).getByTestId('shown-price');
      if (first.lowestPrice === null) await expect(price).toHaveCount(0);
      else await expect(price).toHaveText(shownPriceText(first.lowestPrice));
    });
  }

  await test.step('the Part on the plate, and its slip', async () => {
    const part = thePartForThePlate(firstPages);
    if (part === undefined) {
      await expect(page.getByTestId('plate')).toHaveCount(0);
      return;
    }
    await expect(page.getByTestId('plate')).toHaveAttribute('data-part', part.id);
    const onTheCard = page.getByTestId('card-part');
    await expect(onTheCard).toContainText(part.name);
    if (part.lowestPrice !== null) {
      await expect(onTheCard.getByTestId('shown-price')).toHaveText(
        shownPriceText(part.lowestPrice),
      );
    }

    const offers = await theOffersOf(request, part.id, currency);
    const priced = offers.filter((offer) => offer.inStock && offer.shownPrice !== null);
    const slip = page.getByTestId('price-slip');
    const lowest = priced.at(0);
    const highest = priced.at(-1);
    if (lowest?.shownPrice) {
      await expect(slip.getByTestId('slip-lowest').getByTestId('shown-price')).toHaveText(
        shownPriceText(lowest.shownPrice),
      );
      await expect(slip.getByTestId('slip-foot')).toContainText(lowest.vendor.name);
      // An Offer confirmed today says so in words, with no figure.
      if (lowest.daysSinceConfirmation > 0) {
        await expect(slip.getByTestId('slip-foot')).toContainText(
          theNumber(lowest.daysSinceConfirmation),
        );
      }
    } else {
      await expect(slip.getByTestId('slip-lowest').getByTestId('shown-price')).toHaveCount(
        0,
      );
    }
    if (highest?.shownPrice) {
      await expect(slip.getByTestId('slip-highest').getByTestId('shown-price')).toHaveText(
        shownPriceText(highest.shownPrice),
      );
    } else {
      await expect(slip.getByTestId('slip-highest')).toHaveCount(0);
    }
    await expect(slip.getByTestId('slip-vendors')).toContainText(theNumber(offers.length));
    await expect(slip.getByTestId('slip-in-stock')).toContainText(
      theNumber(offers.filter((offer) => offer.inStock).length),
    );
    await expect(slip.getByTestId('slip-converted')).toContainText(
      theNumber(offers.filter((offer) => offer.shownPrice?.converted === true).length),
    );
    if (figures.iqdPerUsd === null)
      await expect(slip.getByTestId('slip-rate')).toHaveCount(0);
    else {
      await expect(slip.getByTestId('slip-rate')).toContainText(
        `${figures.iqdPerUsd.toLocaleString('en-US')} IQD = 1 $`,
      );
    }
  });

  await test.step("the platform's figures", async () => {
    const card = page.getByTestId('card-vendors-and-offers');
    await expect(card).toContainText(theNumber(figures.activeVendorCount));
    await expect(card).toContainText(theNumber(figures.visibleOfferCount));
    await expect(page.getByTestId('card-confirmed-within')).toContainText(
      theNumber(figures.daysAnOfferStaysCurrent),
    );

    await expect(page.getByTestId('fact-vendors')).toContainText(
      theNumber(figures.activeVendorCount),
    );
    await expect(page.getByTestId('fact-offers')).toContainText(
      theNumber(figures.visibleOfferCount),
    );
    await expect(page.getByTestId('fact-days')).toContainText(
      theNumber(figures.daysAnOfferStaysCurrent),
    );
    // The Platform Rate is left out until the Admin sets the first.
    if (figures.iqdPerUsd === null)
      await expect(page.getByTestId('fact-rate')).toHaveCount(0);
    else {
      await expect(page.getByTestId('fact-rate')).toContainText(
        `${figures.iqdPerUsd.toLocaleString('en-US')} IQD`,
      );
    }
  });
}

test("the home page's figures match what the API answers, for the platform, for each Category and for the Part on the plate, in dinars", async ({
  page,
  request,
}) => {
  await expectWhatTheApiAnswers(page, request, 'IQD');
});

test("the home page's figures match what the API answers in dollars, once the Shopper has chosen them", async ({
  page,
  request,
}) => {
  await page.context().addCookies([{ name: 'currency', value: 'USD', url: shopperUrl }]);
  await expectWhatTheApiAnswers(page, request, 'USD');
});

test("the home page lists the eight Categories in the catalog's order, each leading to its Category's address, and its tear-off tabs lead to the same eight", async ({
  page,
}) => {
  await page.goto(homePage);
  const addresses = categories.map(({ inTheAddress }) =>
    addressIn(english, `/categories/${inTheAddress}`),
  );
  const hrefs = (links: Element[]) => links.map((link) => (link as HTMLAnchorElement).href);

  await expect(categoryItems(page)).toHaveCount(categories.length);
  expect(
    await categoryItems(page).evaluateAll((items) =>
      items.map((item) => item.getAttribute('data-testid')),
    ),
  ).toEqual(categories.map(({ key }) => `category-${key}`));
  expect(await categoryItems(page).getByRole('link').evaluateAll(hrefs)).toEqual(addresses);

  // The sheet ends with the Categories as tear-off tabs, its one list of
  // links but its items.
  const tabs = page.getByTestId('sheet').getByRole('navigation').getByRole('link');
  expect(await tabs.evaluateAll(hrefs)).toEqual(addresses);
});

test('the name slot leads home from every page, and on the home page is marked as the page the Shopper is on', async ({
  page,
}) => {
  await page.goto(notFound);
  const nameSlot = page.getByTestId('name-slot');
  await expect(nameSlot).not.toHaveAttribute('aria-current');

  await nameSlot.click();
  await expect(page).toHaveURL(homePage);
  await expect(page.getByTestId('name-slot')).toHaveAttribute('aria-current', 'page');
});

// What a crawler reads of a page: the page as the server sends it, with no
// cookie. WhatsApp's own reader, which builds the preview of a link sent in
// a chat, reads no more than the page's head.
const whatsApp = 'WhatsApp/2.24.6.77 A';

// The tags of a page's head, as the server sent them, read with no browser.
async function headOf(
  request: APIRequestContext,
  address: string,
): Promise<{ status: number; head: string }> {
  const answer = await request.get(address, { headers: { 'user-agent': whatsApp } });
  const html = await answer.text();
  const end = html.indexOf('</head>');
  expect(end, 'the page has a head').toBeGreaterThan(0);
  return { status: answer.status(), head: html.slice(0, end) };
}

// The value of one tag in a head: a meta tag's content by its name or its
// property, a link's address by its relation, or the title's text.
function tagIn(head: string, tag: RegExp): string[] {
  return [...head.matchAll(tag)].map(([, value]) =>
    value
      .replace(/&amp;/g, '&')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"'),
  );
}

const metaNamed = (name: string) =>
  new RegExp(`<meta\\s+(?:name|property)="${name}"\\s+content="([^"]*)"`, 'gi');

test("the home page's HTML holds its title, its description, its canonical address, the other two languages' addresses and Open Graph's tags, in its language, read with no cookie as a crawler would", async ({
  playwright,
}) => {
  const crawler = await playwright.request.newContext();
  try {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const language of languages) {
      await test.step(`in ${language.name}`, async () => {
        const { status, head } = await headOf(crawler, addressIn(language));
        expect(status).toBe(200);

        const [title] = tagIn(head, /<title>([^<]*)<\/title>/g);
        const [description] = tagIn(head, metaNamed('description'));
        expect(title).toBeTruthy();
        expect(description).toBeTruthy();
        // No description holds a price, which a chat's copy of the preview
        // would keep showing after it changed.
        expect(description).not.toMatch(/\d|IQD|\$|≈/);
        titles.add(title);
        descriptions.add(description);

        expect(tagIn(head, /<link\s+rel="canonical"\s+href="([^"]*)"/gi)).toEqual([
          addressIn(language),
        ]);
        for (const other of languages) {
          expect(
            tagIn(
              head,
              new RegExp(
                `<link\\s+rel="alternate"\\s+hrefLang="${other.tag}"\\s+href="([^"]*)"`,
                'gi',
              ),
            ),
            `the address in ${other.name}`,
          ).toEqual([addressIn(other)]);
        }

        expect(tagIn(head, metaNamed('og:title'))).toEqual([title]);
        expect(tagIn(head, metaNamed('og:description'))).toEqual([description]);
        expect(tagIn(head, metaNamed('og:type'))).toEqual(['website']);
        expect(tagIn(head, metaNamed('og:url'))).toEqual([addressIn(language)]);
        expect(tagIn(head, metaNamed('og:locale'))).toEqual([
          { ckb: 'ckb_IQ', ar: 'ar_IQ', en: 'en_US' }[language.tag],
        ]);
        expect(tagIn(head, metaNamed('og:locale:alternate'))).toHaveLength(2);
        expect(tagIn(head, metaNamed('og:site_name'))).toHaveLength(1);
      });
    }
    expect(titles.size, 'each language has its own title').toBe(languages.length);
    expect(descriptions.size, 'each language has its own description').toBe(
      languages.length,
    );
  } finally {
    await crawler.dispose();
  }
});

// Next sends an address that matches no page as a bare document, and the
// browser draws the screen by script; its head is the server's all the same.
// A page that is not there has no address of its own to name.
test("the not-found page's HTML holds its title, its description and Open Graph's, with no canonical address, and answers 404", async ({
  playwright,
}) => {
  const crawler = await playwright.request.newContext();
  try {
    const { status, head } = await headOf(crawler, notFound);
    expect(status).toBe(404);
    const [title] = tagIn(head, /<title>([^<]*)<\/title>/g);
    const [description] = tagIn(head, metaNamed('description'));
    expect(title).toBeTruthy();
    expect(description).toBeTruthy();
    expect(tagIn(head, metaNamed('og:title'))).toEqual([title]);
    expect(tagIn(head, metaNamed('og:description'))).toEqual([description]);
    expect(tagIn(head, /<link\s+rel="canonical"/gi)).toEqual([]);
  } finally {
    await crawler.dispose();
  }
});

test('the home page meets the automated part of WCAG 2.2 level AA, in light and in dark, once every piece on it has printed', async ({
  page,
}) => {
  // The page's script holds back the pieces below the first screen once it
  // has run, and each prints as it is brought into view.
  await page.goto(homePage, { waitUntil: 'networkidle' });
  for (const piece of ['sheet', 'price-slip']) {
    await expect(page.getByTestId(piece)).toHaveAttribute('data-print', 'waiting');
    await bringIntoView(page, piece);
    await expect(page.getByTestId(piece)).toHaveAttribute('data-print', 'printing');
  }

  await expectAccessible(page);
});

test('the not-found page meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
  page,
}) => {
  await page.goto(notFound);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await expectAccessible(page);
});
