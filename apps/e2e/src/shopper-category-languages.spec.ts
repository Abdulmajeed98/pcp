import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  addAPhotoTo,
  aPageOfTheList,
  expectTheAddressToAsk,
  lookAtTheCategorySheet,
  namesListed,
  searchTheCategory,
  type TheCategorySheet,
  theSearchBox,
  visiblePart,
  visibleParts,
  whatTheSheetSays,
} from './category-page';
import { createAMadeUpPart, type MadeUpPart } from './catalog';
import { choose, expectPricesShownIn, setThePlatformRate } from './currencies';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { linkOf, shownPriceText, theNumber } from './home-page';
import {
  addressIn,
  expectPageIn,
  expectTheSameInEveryLanguage,
  type Language,
  languages,
  linkTo,
  readInEveryLanguage,
} from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { type Filmed, film, filmFromTheFirstFrame, snapsOf } from './motion-film';
import { addAnOffer } from './offers';
import { apiUrl, shopperUrl } from './platform';
import { createAMadeUpVendor } from './vendors';

const [kurdish, , english] = languages;
// The ticket's lines are checked in Kurdish and in English, right to left
// and left to right, in a window as wide as a narrow phone.
const kurdishAndEnglish = [kurdish, english] as const;

// The words unique to this run that find its own rows on the development
// database's long lists, which earlier runs fill: four CPUs for the order of
// a list, and 21, one more than a page holds, for its pages.
const listWord = aWordUniqueToTheRun();
const pagesWord = aWordUniqueToTheRun();
const cpus = (search = '') => `/categories/cpu${search === '' ? '' : `?search=${search}`}`;

// The Platform Rate the run sets, behind every Converted Price it reads.
const rate = 1500;

// The run's four CPUs, named so that their order on the list is not their
// order by name: Bravo is quoted in dollars alone, so its price in dinars is
// converted (≈ 150,000 IQD at the run's rate) and the lowest; Alpha has two
// Vendors and a photo; Charlie is quoted in both currencies; Delta is the
// cheapest of all but every Vendor has it out of stock, so it comes last.
let alpha: MadeUpPart;
let bravo: MadeUpPart;
let charlie: MadeUpPart;
let delta: MadeUpPart;
let alphasPhoto: string;
// The 21 CPUs of the pages, the cheapest first in the order of their names,
// each named by its place, No01 to No21, a word no other name holds.
let paged: MadeUpPart[];

// The run's rows are made as the development Admin, who logs in through the
// dashboard, so the context they are made in runs script: a context made in
// a hook takes the options of the first line a worker runs, and that line may
// be one with scripts switched off, as when it runs alone or after a line
// that failed.
test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ javaScriptEnabled: true });
  try {
    const { request } = context;
    const authorization = await authorizationOfTheDevelopmentAdmin(await context.newPage());
    await setThePlatformRate(request, authorization, rate);
    const vendor = await createAMadeUpVendor(request, authorization);
    const another = await createAMadeUpVendor(request, authorization);
    const named = (name: string) =>
      createAMadeUpPart(request, authorization, {}, 'cpu', { name });

    alpha = await named(`Made-up test CPU ${listWord} Alpha`);
    bravo = await named(`Made-up test CPU ${listWord} Bravo`);
    charlie = await named(`Made-up test CPU ${listWord} Charlie`);
    delta = await named(`Made-up test CPU ${listWord} Delta`);
    alphasPhoto = await addAPhotoTo(request, authorization, alpha.id);
    const offer = (vendorId: string, part: MadeUpPart, details: object) =>
      addAnOffer(request, authorization, vendorId, part.id, details);
    await offer(vendor.id, alpha, { iqdPrice: 250_000 });
    await offer(another.id, alpha, { iqdPrice: 260_000 });
    await offer(vendor.id, bravo, { usdPrice: '100.00' });
    await offer(vendor.id, charlie, { iqdPrice: 400_000, usdPrice: '270.00' });
    await offer(vendor.id, delta, { iqdPrice: 120_000, inStock: false });

    paged = [];
    for (let place = 1; place <= 21; place++) {
      const part = await named(
        `Made-up test CPU ${pagesWord} No${String(place).padStart(2, '0')}`,
      );
      await offer(vendor.id, part, { iqdPrice: 500_000 + place * 1000 });
      paged.push(part);
    }
  } finally {
    await context.close();
  }
});

// The run's four CPUs, in the order the list shows them in dinars.
const inTheirOrder = () => [bravo, alpha, charlie, delta].map(({ name }) => name);

test('in Kurdish and English, the home page leads to the CPU Category page, titled by the name the home page gives it', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language));
      const name = (await linkOf(page, 'cpu').innerText()).trim();
      await linkOf(page, 'cpu').click();

      await expect(page).toHaveURL(addressIn(language, cpus()));
      await expectPageIn(page, language);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
    });
  }
});

// What the page lists for the run's search, against the API's own answer for
// it: the same Parts in the same order, each with the Lowest Price the API
// answers, written as the platform writes a Shown Price.
async function expectTheListTheApiAnswers(
  page: Page,
  request: APIRequestContext,
  language: Language,
  currency: 'IQD' | 'USD',
): Promise<void> {
  const answered = await aPageOfTheList(request, {
    category: 'cpu',
    currency,
    search: listWord,
  });
  await page.goto(addressIn(language, cpus(listWord)));

  expect(await namesListed(page)).toEqual(answered.content.map(({ name }) => name));
  expect(answered.content.map(({ name }) => name)).toEqual(inTheirOrder());
  for (const part of answered.content) {
    const listed = visiblePart(page, part.name);
    await expect(listed.getByRole('link')).toHaveAttribute(
      'href',
      `/${language.tag}/parts/${part.id}`,
    );
    if (part.lowestPrice === null) {
      await expect(listed.getByTestId('shown-price')).toHaveCount(0);
    } else {
      await expect(listed.getByTestId('shown-price')).toHaveText(
        shownPriceText(part.lowestPrice),
      );
    }
  }
}

test("in Kurdish and English, a Category page lists the run's Parts in the API's order by Lowest Price, a converted one with ≈, and the one every Vendor has out of stock last, marked in words, each a link to its Part page", async ({
  page,
  request,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await expectTheListTheApiAnswers(page, request, language, 'IQD');

      // Bravo is quoted in dollars alone: its price in dinars is converted.
      await expect(visiblePart(page, bravo.name).getByTestId('shown-price')).toHaveText(
        `≈ ${(100 * rate).toLocaleString('en-US')} IQD`,
      );
      // Delta comes last, under its own heading, with words in its price's
      // place and no price.
      const outOfStock = page.getByTestId('out-of-stock-everywhere');
      expect(
        await outOfStock.getByTestId('visible-part').getByRole('link').allInnerTexts(),
      ).toEqual([delta.name]);
      await expect(
        visiblePart(page, delta.name).getByTestId('out-of-stock'),
      ).not.toBeEmpty();
      expect(
        await page
          .getByTestId('in-stock')
          .getByTestId('visible-part')
          .getByRole('link')
          .allInnerTexts(),
      ).toEqual([bravo, alpha, charlie].map(({ name }) => name));
      // Each Part's second line names its manufacturer and counts its
      // Vendors in Western digits.
      const alphasLine = visiblePart(page, alpha.name).getByTestId('item-second');
      await expect(alphasLine).toContainText('Made-up Test Parts');
      await expect(alphasLine).toContainText(theNumber(2));
    });
  }
});

test('a Category page lists its Parts by their Lowest Price in dollars, once the Shopper has chosen them', async ({
  page,
  request,
}) => {
  await page.context().addCookies([{ name: 'currency', value: 'USD', url: shopperUrl }]);
  await expectTheListTheApiAnswers(page, request, english, 'USD');
  await expectPricesShownIn(page, 'USD');
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(javaScriptEnabled ? 'with scripts' : 'with scripts switched off', () => {
    test.use({ javaScriptEnabled });

    test('in Kurdish and English, a search narrows the list, the address holds it, a reload keeps it, and clearing it restores the list', async ({
      page,
      request,
    }) => {
      const firstPage = await aPageOfTheList(request, { category: 'cpu', currency: 'IQD' });
      const words = `${listWord} bravo`;

      for (const language of kurdishAndEnglish) {
        await test.step(`in ${language.name}`, async () => {
          await page.goto(addressIn(language, cpus()));
          expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(
            !javaScriptEnabled,
          );

          await searchTheCategory(page, words);
          // Sent without script, the form also sends its empty fields, which
          // the page ignores.
          await expectTheAddressToAsk(page, language, cpus(), [['search', words]]);
          await expect(visibleParts(page)).toHaveCount(1);
          expect(await namesListed(page)).toEqual([bravo.name]);

          await page.reload();
          expect(await namesListed(page)).toEqual([bravo.name]);
          await expect(theSearchBox(page)).toHaveValue(words);

          await page.getByTestId('choice-on').click();
          await expect(page).toHaveURL(addressIn(language, cpus()));
          await expect(visibleParts(page)).toHaveCount(firstPage.content.length);
          expect(await namesListed(page)).toEqual(
            firstPage.content.map(({ name }) => name),
          );
          await expect(theSearchBox(page)).toHaveValue('');
        });
      }
    });
  });
}

test('in Kurdish and English, a search that finds nothing says so, in other words than a list, and offers to clear it', async ({
  page,
}) => {
  const sentences = new Map<Language, string>();
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, cpus(listWord)));
      await expect(whatTheSheetSays(page)).toHaveAttribute('data-state', 'listed');
      const aList = await whatTheSheetSays(page).innerText();

      await searchTheCategory(page, `${listWord} nothing${listWord}`);
      await expect(whatTheSheetSays(page)).toHaveAttribute('data-state', 'no-match');
      await expect(visibleParts(page)).toHaveCount(0);
      const nothing = await whatTheSheetSays(page).innerText();
      expect(nothing).not.toBe(aList);
      sentences.set(language, nothing);

      await page.getByRole('main').getByTestId('clear-all').click();
      await expect(page).toHaveURL(addressIn(language, cpus()));
      await expect(whatTheSheetSays(page)).toHaveAttribute('data-state', 'listed');
    });
  }
  expect(sentences.get(kurdish)).not.toBe(sentences.get(english));
});

test('in Kurdish and English, the list is in pages: the next page and the previous one, with the page in the address, and a page past the last says so and leads to the first', async ({
  page,
}) => {
  const names = () => paged.map(({ name }) => name);
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, cpus(pagesWord)));
      expect(await namesListed(page)).toEqual(names().slice(0, 20));
      await expect(page.getByTestId('page-of')).toContainText(theNumber(1));
      await expect(page.getByTestId('page-of')).toContainText(theNumber(2));
      await expect(page.getByTestId('paging').locator('a[rel="prev"]')).toHaveCount(0);

      await page.getByTestId('paging').locator('a[rel="next"]').click();
      await expect(page).toHaveURL(addressIn(language, `${cpus(pagesWord)}&page=2`));
      expect(await namesListed(page)).toEqual(names().slice(20));
      await expect(page.getByTestId('paging').locator('a[rel="next"]')).toHaveCount(0);

      await page.getByTestId('paging').locator('a[rel="prev"]').click();
      await expect(page).toHaveURL(addressIn(language, cpus(pagesWord)));
      expect(await namesListed(page)).toEqual(names().slice(0, 20));

      await page.goto(addressIn(language, `${cpus(pagesWord)}&page=7`));
      await expect(whatTheSheetSays(page)).toHaveAttribute('data-state', 'past-the-end');
      await expect(whatTheSheetSays(page)).toContainText(theNumber(2));
      await expect(visibleParts(page)).toHaveCount(0);
      await page.getByTestId('to-the-first-page').click();
      await expect(page).toHaveURL(addressIn(language, cpus(pagesWord)));
      expect(await namesListed(page)).toEqual(names().slice(0, 20));
    });
  }
});

test('switching the currency keeps the search and the page, and so does switching the language, between Kurdish and English', async ({
  page,
}) => {
  const address = `${cpus(pagesWord)}&page=2`;
  await page.goto(addressIn(kurdish, address));
  expect(await namesListed(page)).toEqual([paged[20].name]);

  await choose(page, 'USD');
  await expect(page).toHaveURL(addressIn(kurdish, address));
  await expectPricesShownIn(page, 'USD');
  expect(await namesListed(page)).toEqual([paged[20].name]);

  await linkTo(page, english).click();
  await expect(page).toHaveURL(addressIn(english, address));
  await expectPageIn(page, english);
  expect(await namesListed(page)).toEqual([paged[20].name]);

  await choose(page, 'IQD');
  await expect(page).toHaveURL(addressIn(english, address));
  await linkTo(page, kurdish).click();
  await expect(page).toHaveURL(addressIn(kurdish, address));
  await expectPricesShownIn(page, 'IQD');
});

// The helper checks each page in all three languages: its direction, Kurdish
// and Arabic right to left, the server's page with the switch's links, every
// digit a Western one, and no sideways scroll at 360 pixels. Here it reads
// every Shown Price on the page, which are the same characters in all three.
test('the Category page is right to left in Kurdish and Arabic, and its Shown Prices are the same Western digits, marks and ≈ in all three languages', async ({
  page,
}) => {
  const prices = await readInEveryLanguage(page, cpus(listWord), async () => {
    const shown = await page.getByTestId('shown-price').allInnerTexts();
    expect(shown.length).toBe(3);
    expect(shown.some((price) => price.startsWith('≈ '))).toBe(true);
    return shown.map((price) => price.trim());
  });

  expectTheSameInEveryLanguage(prices);
});

test("a Part's photo is drawn from the Shopper app's own address, which passes the API's photo through with its caching headers, and an unknown photo answers 404", async ({
  page,
  request,
}) => {
  await page.goto(addressIn(english, cpus(`${listWord}+alpha`)));
  const picture = visiblePart(page, alpha.name).getByTestId('part-square').locator('img');
  await picture.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      picture.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth),
    )
    .toBeGreaterThan(0);
  const drawnFrom = new URL(
    await picture.evaluate((image: HTMLImageElement) => image.currentSrc),
  );
  expect(drawnFrom.origin, 'the photo is drawn from the Shopper app').toBe(shopperUrl);
  const photoId = alphasPhoto.split('/').at(-1);
  expect(drawnFrom.searchParams.get('url') ?? drawnFrom.pathname).toBe(
    `/photos/${photoId}`,
  );

  const passed = await request.get(`${shopperUrl}/photos/${photoId}`);
  const fromTheApi = await request.get(`${apiUrl}${alphasPhoto}`);
  expect(passed.status()).toBe(200);
  for (const header of ['content-type', 'cache-control', 'x-content-type-options']) {
    expect(passed.headers()[header], header).toBe(fromTheApi.headers()[header]);
  }
  expect(passed.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  expect(Buffer.compare(await passed.body(), await fromTheApi.body())).toBe(0);

  for (const unknown of ['00000000-0000-4000-8000-00000000dead', 'not-a-photo']) {
    expect((await request.get(`${shopperUrl}/photos/${unknown}`)).status(), unknown).toBe(
      404,
    );
  }
});

test('in Kurdish and English, an address that names no Category answers the not-found page with a 404, in the page’s language', async ({
  page,
}) => {
  const headings = new Map<Language, string>();
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      for (const name of ['monitor', 'CPU', 'cpu_cooler']) {
        const response = await page.goto(addressIn(language, `/categories/${name}`));
        expect(response?.status(), name).toBe(404);
        await expectPageIn(page, language);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      }
      headings.set(language, await page.getByRole('heading', { level: 1 }).innerText());
    });
  }
  expect(headings.get(kurdish)).not.toBe(headings.get(english));
});

// What a crawler reads of a page: its head as the server sends it, with no
// cookie, to WhatsApp's own reader, which builds the preview of a link.
async function headOf(request: APIRequestContext, address: string): Promise<string> {
  const answer = await request.get(address, {
    headers: { 'user-agent': 'WhatsApp/2.24.6.77 A' },
  });
  expect(answer.status()).toBe(200);
  const html = await answer.text();
  return html.slice(0, html.indexOf('</head>'));
}

function tagsIn(head: string, tag: RegExp): string[] {
  return [...head.matchAll(tag)].map(([, value]) =>
    value
      .replace(/&amp;/g, '&')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"'),
  );
}

test("in Kurdish and English, a Category page's preview names the Category in its title and its description, in the page's language, with no price, and its canonical address is the Category page's own, read with no cookie as a crawler would", async ({
  page,
  playwright,
}) => {
  const crawler = await playwright.request.newContext();
  try {
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}`, async () => {
        await page.goto(addressIn(language, cpus()));
        const name = (await page.getByRole('heading', { level: 1 }).innerText()).trim();

        const head = await headOf(crawler, addressIn(language, cpus(listWord)));
        const [title] = tagsIn(head, /<title>([^<]*)<\/title>/g);
        const [description] = tagsIn(
          head,
          /<meta\s+name="description"\s+content="([^"]*)"/gi,
        );
        expect(title).toContain(name);
        expect(description).toContain(name);
        expect(description).not.toMatch(/\d|IQD|\$|≈/);
        expect(tagsIn(head, /<link\s+rel="canonical"\s+href="([^"]*)"/gi)).toEqual([
          addressIn(language, cpus()),
        ]);
      });
    }
  } finally {
    await crawler.dispose();
  }
});

test('in Kurdish and English, a Category page meets the automated part of WCAG 2.2 level AA in light and in dark, with a search on and with a search that finds nothing', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, cpus(listWord)));
      await expect(page.getByTestId('choices-on')).toBeVisible();
      await expectAccessible(page);

      await page.goto(addressIn(language, cpus(`${listWord}+nothing${listWord}`)));
      await expect(whatTheSheetSays(page)).toHaveAttribute('data-state', 'no-match');
      await expectAccessible(page);
    });
  }
});

// The motion of paper and print (DESIGN.md's Motion): the sheet prints as the
// page opens, its prices settle into their column from the end side and its
// stamp lands, once a page view; a list drawn again in place, by a search or
// another page, is shown printed; and nothing moves with reduced motion or
// without script. Each is filmed with every animation slowed four times, and
// judged by `snapsOf`.
type Frames = Filmed<TheCategorySheet>[];

function sheetsOf(frames: Frames) {
  return frames.flatMap(({ at, drawn }) =>
    drawn.sheet === null ? [] : [{ at, ...drawn.sheet }],
  );
}

async function expectMotionAllowed(page: Page, allowed: boolean): Promise<void> {
  expect(
    await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: no-preference)').matches,
    ),
  ).toBe(allowed);
}

// A sheet whole and still in every frame, its first price settled and its
// stamp down.
function expectStillAndWhole(frames: Frames): void {
  const sheets = sheetsOf(frames);
  expect(sheets.length, 'the sheet was filmed').toBeGreaterThan(5);
  for (const { covered } of sheets) expect(covered, 'the sheet is whole').toBe(0);
  const tops = sheets.map(({ top }) => top);
  expect(Math.max(...tops) - Math.min(...tops), 'the sheet moved').toBeLessThan(0.5);
  for (const { drawn } of frames) {
    if (drawn.price !== null) expect(drawn.price.opacity, 'the price is settled').toBe(1);
    if (drawn.stamp !== null) {
      expect(drawn.stamp, 'the stamp is down').toEqual({ scale: 1, opacity: 1 });
    }
  }
}

for (const { language, fromTheEnd } of [
  { language: english, fromTheEnd: 1 },
  { language: kurdish, fromTheEnd: -1 },
]) {
  test(`in ${language.name}, the Category page's sheet prints as the page opens, its prices settling from the end side, and its stamp lands once it has printed, with nothing snapping`, async ({
    page,
  }) => {
    const frames = await filmFromTheFirstFrame(
      page,
      lookAtTheCategorySheet,
      async () => {
        await page.goto(addressIn(language, cpus(listWord)));
      },
      { forMs: 6500 },
    );
    await expectMotionAllowed(page, true);

    const sheet = sheetsOf(frames);
    const [first] = sheet;
    const last = sheet.at(-1) ?? first;
    expect(first.covered / first.height, 'the sheet arrives covered').toBeGreaterThan(0.9);
    expect(last.covered, 'the sheet ends whole').toBe(0);
    expect(last.top - first.top, 'the sheet slides 18 pixels down').toBeCloseTo(18, 0);
    expect([
      ...snapsOf(
        "the sheet's top",
        sheet.map(({ at, top }) => ({ at, value: top })),
      ),
      ...snapsOf(
        "the sheet's covered foot",
        sheet.map(({ at, covered }) => ({ at, value: covered })),
      ),
    ]).toEqual([]);

    const prices = frames.flatMap(({ at, drawn }) =>
      drawn.price === null ? [] : [{ at, ...drawn.price }],
    );
    const [firstPrice] = prices;
    const lastPrice = prices.at(-1) ?? firstPrice;
    expect(firstPrice.opacity, 'the price arrives unseen').toBeLessThan(0.1);
    expect(lastPrice.opacity, 'the price ends settled').toBe(1);
    expect(firstPrice.shift * fromTheEnd, 'the price comes from the end side').toBeCloseTo(
      16,
      0,
    );
    expect(lastPrice.shift, 'the price ends in its column').toBe(0);
    expect(
      snapsOf(
        "the price's shift",
        prices.map(({ at, shift }) => ({ at, value: shift })),
      ),
    ).toEqual([]);

    const stamps = frames.flatMap(({ at, drawn }) =>
      drawn.stamp === null ? [] : [{ at, ...drawn.stamp }],
    );
    const [firstStamp] = stamps;
    const lastStamp = stamps.at(-1) ?? firstStamp;
    expect(firstStamp.scale).toBeCloseTo(1.6, 2);
    expect(firstStamp.opacity).toBe(0);
    expect(lastStamp).toEqual({ at: lastStamp.at, scale: 1, opacity: 1 });
    const printed = sheet.find(({ covered }) => covered === 0)?.at ?? Infinity;
    const landing = stamps.find(({ scale }) => scale < 1.6)?.at ?? -Infinity;
    expect(landing, 'the stamp lands once the sheet has printed').toBeGreaterThan(
      printed - 400,
    );
    expect(
      snapsOf(
        "the stamp's size",
        stamps.map(({ at, scale }) => ({ at, value: scale * 100 })),
      ),
    ).toEqual([]);
  });
}

test('in Kurdish and English, a list drawn again in place, by a search and by another page, is shown printed: nothing prints, settles or lands again', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, cpus(pagesWord)), { waitUntil: 'networkidle' });
      await expectMotionAllowed(page, true);
      await expect
        .poll(async () => (await page.evaluate(lookAtTheCategorySheet)).stamp)
        .toEqual({ scale: 1, opacity: 1 });

      const searched = await film(
        page,
        lookAtTheCategorySheet,
        () => searchTheCategory(page, `${pagesWord} No07`),
        { forMs: 3000 },
      );
      expect(await namesListed(page)).toEqual([paged[6].name]);
      expectStillAndWhole(searched);

      await page.goto(addressIn(language, cpus(pagesWord)), { waitUntil: 'networkidle' });
      await expect
        .poll(async () => (await page.evaluate(lookAtTheCategorySheet)).stamp)
        .toEqual({ scale: 1, opacity: 1 });
      const paging = await film(
        page,
        lookAtTheCategorySheet,
        async () => {
          await page.getByTestId('paging').locator('a[rel="next"]').click();
          await page.waitForURL(/page=2/);
        },
        { forMs: 3000 },
      );
      expect(await namesListed(page)).toEqual([paged[20].name]);
      expectStillAndWhole(paging);
    });
  }
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('in Kurdish and English, the Category page is whole from the first frame it is drawn in, its prices settled and its stamp down, and nothing moves', async ({
    page,
  }) => {
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}`, async () => {
        const frames = await filmFromTheFirstFrame(
          page,
          lookAtTheCategorySheet,
          async () => {
            await page.goto(addressIn(language, cpus(listWord)));
          },
        );
        await expectMotionAllowed(page, false);
        expectStillAndWhole(frames);
      });
    }
  });
});

test.describe('without script', () => {
  test.use({ javaScriptEnabled: false });

  test('in Kurdish and English, nothing on the Category page moves, and it arrives whole, as the server sent it', async ({
    page,
  }) => {
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}`, async () => {
        await page.goto(addressIn(language, cpus(listWord)));
        expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(
          true,
        );
        expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
        const { sheet, price, stamp } = await page.evaluate(lookAtTheCategorySheet);
        expect(sheet?.covered).toBe(0);
        expect(price?.opacity).toBe(1);
        expect(stamp).toEqual({ scale: 1, opacity: 1 });
      });
    }
  });
});
