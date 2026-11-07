import {
  type APIRequestContext,
  type Browser,
  expect,
  type Page,
  test,
} from '@playwright/test';

import { expectAccessible } from './accessibility';
import { addAPhotoTo, visiblePart } from './category-page';
import { createAMadeUpPart, type MadeUpPart } from './catalog';
import { choose, setThePlatformRate } from './currencies';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { shownPriceText, theNumber, theOffersOf } from './home-page';
import {
  addressIn,
  expectPageIn,
  expectTheSameInEveryLanguage,
  type Language,
  languages,
  layoutOf,
  linesAsDrawn,
  readInEveryLanguage,
} from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { film, filmFromTheFirstFrame, snapsOf, type Filmed } from './motion-film';
import { addAnOffer } from './offers';
import {
  aDocumentHolding,
  lookAtThePartPage,
  offerOf,
  offersListed,
  specificationOn,
  switchTheVendor,
  type ThePartPage,
  theSpecificationLists,
  theVisiblePart,
  vendorsListed,
} from './part-page';
import { shopperUrl } from './platform';
import { createAMadeUpVendor, type MadeUpVendor } from './vendors';

const [kurdish, , english] = languages;
// The ticket's lines are checked in Kurdish and in English, right to left
// and left to right, in a window as wide as a narrow phone.
const kurdishAndEnglish = [kurdish, english] as const;

// The word unique to this run that finds its own Parts on the development
// database's long lists, which earlier runs fill.
const word = aWordUniqueToTheRun();

// The Platform Rate the run sets, behind every Converted Price it reads.
const rate = 1500;

// The run's CPU, with every key specification of its box label and two
// yes-or-no ones, a photo, and three Offers: Alpha's in stock in dinars with
// a 12-month warranty; Bravo's in stock in dollars alone, so converted in
// dinars, 299.99 $ at the run's rate being 449,985 dinars, shown as ≈ 450,000,
// rounded to 250, with a 24-month warranty; and Charlie's, the cheapest, out
// of stock, with no warranty. And a CPU that one Vendor alone offers, for
// that Vendor to be deactivated.
let cpu: MadeUpPart;
let lonely: MadeUpPart;
let alpha: MadeUpVendor;
let bravo: MadeUpVendor;
let charlie: MadeUpVendor;
let lonelysVendor: MadeUpVendor;
let photoPath: string;

const partPage = (part: MadeUpPart) => `/parts/${part.id}`;

// Works with the API as the development Admin, who logs in through the
// dashboard, in a context of its own that runs script: a context made in a
// hook takes the options of the first line a worker runs, which may be one
// with scripts switched off (browse ticket 10).
async function asTheAdmin(
  browser: Browser,
  work: (request: APIRequestContext, authorization: string) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext({ javaScriptEnabled: true });
  try {
    const authorization = await authorizationOfTheDevelopmentAdmin(await context.newPage());
    await work(context.request, authorization);
  } finally {
    await context.close();
  }
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  await asTheAdmin(browser, async (request, authorization) => {
    await setThePlatformRate(request, authorization, rate);
    [alpha, bravo, charlie, lonelysVendor] = [
      await createAMadeUpVendor(request, authorization),
      await createAMadeUpVendor(request, authorization),
      await createAMadeUpVendor(request, authorization),
      await createAMadeUpVendor(request, authorization),
    ];
    cpu = await createAMadeUpPart(
      request,
      authorization,
      {
        socket: 'AM5',
        series: 'Made-up 7000',
        cores: { total: 8, threads: 16 },
        clocks: { performance: { base: 4.2, boost: 5 } },
        cache: { l3: 96 },
        specifications: {
          tdp: 120,
          simultaneousMultithreading: true,
          includesCooler: false,
          memory: { types: ['DDR5'] },
        },
      },
      'cpu',
      {
        name: `Made-up test CPU ${word} with Offers`,
        // Short enough, and written in Code 39's characters, for its barcode.
        partNumber: `T${word.slice(-12)}`,
      },
    );
    photoPath = await addAPhotoTo(request, authorization, cpu.id);
    await addAnOffer(request, authorization, alpha.id, cpu.id, {
      iqdPrice: 500_000,
      warrantyMonths: 12,
    });
    await addAnOffer(request, authorization, bravo.id, cpu.id, {
      usdPrice: '299.99',
      warrantyMonths: 24,
    });
    await addAnOffer(request, authorization, charlie.id, cpu.id, {
      iqdPrice: 400_000,
      inStock: false,
    });

    lonely = await createAMadeUpPart(request, authorization, {}, 'cpu', {
      name: `Made-up test CPU ${word} of one Vendor`,
      partNumber: `L${word.slice(-12)}`,
    });
    await addAnOffer(request, authorization, lonelysVendor.id, lonely.id, {
      iqdPrice: 300_000,
    });
  });
});

// The box label reads its Category's key specifications by their places in
// a Part's specifications, from a list the Shopper app keeps, so a place the
// API renamed would leave a line out unseen. A Part of each Category that
// holds every specification of its list, as the API lists them now, shows
// all six of its key lines (a follow-up of browse's code review).
test('in every Category, a Part holding every specification of its list shows the six key lines of its box label', async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const parts: { category: string; id: string }[] = [];
  await asTheAdmin(browser, async (request, authorization) => {
    const vendor = await createAMadeUpVendor(request, authorization);
    for (const { key, specifications } of await theSpecificationLists(
      request,
      authorization,
    )) {
      const part = await createAMadeUpPart(
        request,
        authorization,
        aDocumentHolding(specifications),
        key,
      );
      await addAnOffer(request, authorization, vendor.id, part.id, { iqdPrice: 100_000 });
      parts.push({ category: key, id: part.id });
    }
  });

  expect(parts.length).toBe(8);
  for (const { category, id } of parts) {
    await test.step(`a ${category}`, async () => {
      await page.goto(addressIn(english, `/parts/${id}`));
      await expect(page.getByTestId('key-line')).toHaveCount(6);
    });
  }
});

test("in Kurdish and English, a Part reached from its Category page shows its name, its part numbers and its specifications in English, its box label's key lines first", async ({
  page,
  request,
}) => {
  const answered = await theVisiblePart(request, cpu.id);
  const shown = new Map<Language, unknown>();
  const categoryNames = new Map<Language, string>();
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, `/categories/cpu?search=${word}`));
      await visiblePart(page, cpu.name).getByRole('link').click();
      await expect(page).toHaveURL(addressIn(language, partPage(cpu)));
      await expectPageIn(page, language);

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(cpu.name);
      await expect(page.getByTestId('manufacturer')).toHaveText('Made-up Test Parts');
      await expect(page.getByTestId('part-number')).toHaveText([cpu.partNumber]);
      // Its Category, named in the page's language, leads back to its page.
      const category = page.getByTestId('category');
      await expect(category).toHaveAttribute('href', `/${language.tag}/categories/cpu`);
      categoryNames.set(language, await category.innerText());

      // The box label: its Category's key specifications that the Part
      // holds, BRW-2's first, each its English label and value.
      const keyLines = page.getByTestId('key-line');
      await expect(keyLines).toHaveText([
        /^Socket\s*AM5$/,
        /^Cores\s*8$/,
        /^Threads\s*16$/,
        /^Performance core boost clock\s*5 GHz$/,
        /^L3 cache\s*96 MB$/,
        /^TDP\s*120 W$/,
      ]);
      // Every specification, in the order the API answers them, with its
      // label, and yes and no as the English words.
      await expect(page.getByTestId('specification').locator('dt')).toHaveText(
        answered.specifications.map(({ label }) => label),
      );
      await expect(
        specificationOn(page, 'specifications.simultaneousMultithreading').locator('dd'),
      ).toHaveText('Yes');
      await expect(
        specificationOn(page, 'specifications.includesCooler').locator('dd'),
      ).toHaveText('No');
      await expect(
        specificationOn(page, 'clocks.performance.base').locator('dd'),
      ).toHaveText('4.2 GHz');
      await expect(
        specificationOn(page, 'specifications.memory.types').locator('dd'),
      ).toHaveText('DDR5');

      // Its barcode is drawn, and named for a screen reader by its number.
      const barcode = page.getByTestId('barcode');
      await expect(barcode).toHaveAttribute('data-bars', 'code-39');
      await expect(barcode).toHaveAttribute('aria-label', new RegExp(`${cpu.partNumber}$`));

      shown.set(language, await page.getByTestId('specification').allInnerTexts());
    });
  }
  expect(shown.get(kurdish)).toEqual(shown.get(english));
  expect(categoryNames.get(kurdish)).not.toBe(categoryNames.get(english));
});

test("in Kurdish and English, a Part's Offers are in the API's order, OFF-11's, the converted one with ≈, each in stock or out of stock in words, with its warranty and the days since it was confirmed", async ({
  page,
  request,
}) => {
  const answered = await theOffersOf(request, cpu.id, 'IQD');
  const confirmed = new Map<Language, string>();
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, partPage(cpu)));

      // In stock first, the lowest Shown Price first, then out of stock.
      expect(await vendorsListed(page)).toEqual([bravo.id, alpha.id, charlie.id]);
      expect(answered.map(({ vendor }) => vendor.name)).toEqual(
        [bravo, alpha, charlie].map(({ name }) => name),
      );
      for (const [place, offer] of answered.entries()) {
        await expect(offersListed(page).nth(place).getByTestId('shown-price')).toHaveText(
          shownPriceText(
            offer.shownPrice ?? { currency: 'IQD', amount: '0', converted: false },
          ),
        );
      }
      await expect(offerOf(page, bravo.id).getByTestId('shown-price')).toHaveText(/^≈ /);

      // In stock and out of stock, in words: under their own headings, and
      // the one out of stock says so on its line, in its own words.
      await expect(page.getByTestId('offers-in-stock').getByTestId('offer')).toHaveCount(2);
      await expect(
        page.getByTestId('offers-out-of-stock').getByTestId('offer'),
      ).toHaveCount(1);
      await expect(
        offerOf(page, charlie.id).getByTestId('offer-out-of-stock'),
      ).not.toBeEmpty();
      await expect(offerOf(page, alpha.id).getByTestId('offer-out-of-stock')).toHaveCount(
        0,
      );

      // The warranty in months, left out where the Vendor states none.
      await expect(offerOf(page, alpha.id).getByTestId('offer-warranty')).toHaveText(
        theNumber(12),
      );
      await expect(offerOf(page, bravo.id).getByTestId('offer-warranty')).toHaveText(
        theNumber(24),
      );
      await expect(offerOf(page, charlie.id).getByTestId('offer-warranty')).toHaveCount(0);

      // Each was confirmed today, as it was added, and says so with no count.
      for (const offer of [alpha, bravo, charlie]) {
        await expect(offerOf(page, offer.id).getByTestId('offer-confirmed')).toHaveText(
          /^\D+$/,
        );
      }
      confirmed.set(
        language,
        await offerOf(page, alpha.id).getByTestId('offer-confirmed').innerText(),
      );

      // What "≈" means closes the sheet, since a price on it is converted.
      await expect(page.getByTestId('what-approximately-means')).toBeVisible();
    });
  }
  expect(confirmed.get(kurdish)).not.toBe(confirmed.get(english));
});

test('in Kurdish and English, a USD-only Offer seen in dinars shows a price rounded to 250 and marked ≈, with what its Vendor quoted, and seen in dollars, its Quoted Price', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, partPage(cpu)));
      const quotedInDollars = offerOf(page, bravo.id);
      // 299.99 $ at 1,500 dinars is 449,985 dinars, the nearest 250 of which
      // is 450,000.
      await expect(quotedInDollars.getByTestId('shown-price')).toHaveText('≈ 450,000 IQD');
      await expect(quotedInDollars.getByTestId('offer-quoted')).toContainText('299.99 $');

      await choose(page, 'USD');
      await expect(quotedInDollars.getByTestId('shown-price')).toHaveText('299.99 $');
      await expect(quotedInDollars.getByTestId('offer-quoted')).toHaveCount(0);
      // And the Offer quoted in dinars alone is now the converted one:
      // 500,000 dinars at 1,500 are 333.33 $, the nearest whole dollar 333.
      const quotedInDinars = offerOf(page, alpha.id);
      await expect(quotedInDinars.getByTestId('shown-price')).toHaveText('≈ 333 $');
      await expect(quotedInDinars.getByTestId('offer-quoted')).toContainText('500,000 IQD');
      await choose(page, 'IQD');
    });
  }
});

test("in Kurdish and English, an Offer's Vendor leads to the Vendor page's address", async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, partPage(cpu)));
      const link = offerOf(page, alpha.id).getByRole('link', { name: alpha.name });
      await expect(link).toHaveAttribute('href', `/${language.tag}/vendors/${alpha.id}`);
      await link.click();
      await expect(page).toHaveURL(addressIn(language, `/vendors/${alpha.id}`));
    });
  }
});

test("in Kurdish and English, deactivating the Part's only Vendor makes its page answer the not-found page with a 404, and reactivating the Vendor brings the page back", async ({
  page,
  browser,
}) => {
  const answers = async (expected: number) => {
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}, ${expected}`, async () => {
        const response = await page.goto(addressIn(language, partPage(lonely)));
        expect(response?.status()).toBe(expected);
        await expectPageIn(page, language);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          expected === 200 ? lonely.name : /\S/,
        );
        if (expected === 404) {
          await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(lonely.name);
        }
      });
    }
  };

  await answers(200);
  await asTheAdmin(browser, (request, authorization) =>
    switchTheVendor(request, authorization, lonelysVendor.id, 'deactivate'),
  );
  await answers(404);
  await asTheAdmin(browser, (request, authorization) =>
    switchTheVendor(request, authorization, lonelysVendor.id, 'reactivate'),
  );
  await answers(200);
});

test('in Kurdish and English, an unknown Part and an address that names none answer the not-found page with a 404', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      for (const partId of ['00000000-0000-4000-8000-00000000dead', 'not-a-part']) {
        const response = await page.goto(addressIn(language, `/parts/${partId}`));
        expect(response?.status(), partId).toBe(404);
        await expectPageIn(page, language);
      }
    });
  }
});

// The helper checks the page in all three languages: its direction, Kurdish
// and Arabic right to left, the server's page with the switch's links, every
// digit a Western one, and no sideways scroll at 360 pixels.
test('the Part page is right to left in Kurdish and Arabic, its part numbers and specifications reading left to right as they are written, the same in all three languages', async ({
  page,
}) => {
  const read = await readInEveryLanguage(page, partPage(cpu), async () => {
    const numbers = page.getByTestId('part-number').first().locator('xpath=..');
    expect(await layoutOf(numbers)).toEqual({ direction: 'ltr', keptApart: true });
    const tdp = specificationOn(page, 'specifications.tdp').locator('dd bdi');
    expect(await layoutOf(tdp)).toEqual({ direction: 'ltr', keptApart: true });
    expect(await linesAsDrawn(tdp)).toEqual(['120 W']);
    const label = specificationOn(page, 'clocks.performance.base').locator('dt bdi');
    expect(await layoutOf(label)).toEqual({ direction: 'ltr', keptApart: true });

    return {
      numbers: await page.getByTestId('part-number').allInnerTexts(),
      specifications: await page.getByTestId('specification').allInnerTexts(),
      prices: await page.getByTestId('shown-price').allInnerTexts(),
    };
  });

  expectTheSameInEveryLanguage(read);
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

test("in Kurdish and English, a Part page's preview names the Part in its title and its description, its manufacturer and how many Vendors offer it, in the page's language, with its photo and no price, read with no cookie as a crawler would", async ({
  playwright,
}) => {
  const crawler = await playwright.request.newContext();
  try {
    const descriptions = new Map<Language, string>();
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}`, async () => {
        const head = await headOf(crawler, addressIn(language, partPage(cpu)));
        const [title] = tagsIn(head, /<title>([^<]*)<\/title>/g);
        const [description] = tagsIn(
          head,
          /<meta\s+name="description"\s+content="([^"]*)"/gi,
        );
        expect(title).toContain(cpu.name);
        expect(description).toContain(cpu.name);
        expect(description).toContain('Made-up Test Parts');
        expect(description).toMatch(theNumber(3));
        // No price, nor a price's mark.
        expect(description).not.toMatch(/IQD|\$|≈|450,000|500,000|400,000|299\.99/);
        descriptions.set(language, description);

        expect(tagsIn(head, /<link\s+rel="canonical"\s+href="([^"]*)"/gi)).toEqual([
          addressIn(language, partPage(cpu)),
        ]);
        for (const other of languages) {
          expect(
            tagsIn(
              head,
              new RegExp(
                `<link\\s+rel="alternate"\\s+hrefLang="${other.tag}"\\s+href="([^"]*)"`,
                'gi',
              ),
            ),
          ).toEqual([addressIn(other, partPage(cpu))]);
        }
        expect(tagsIn(head, /<meta\s+property="og:title"\s+content="([^"]*)"/gi)).toEqual([
          title,
        ]);
        expect(tagsIn(head, /<meta\s+property="og:type"\s+content="([^"]*)"/gi)).toEqual([
          'website',
        ]);
        expect(tagsIn(head, /<meta\s+property="og:url"\s+content="([^"]*)"/gi)).toEqual([
          addressIn(language, partPage(cpu)),
        ]);
        expect(
          tagsIn(head, /<meta\s+property="og:description"\s+content="([^"]*)"/gi),
        ).toEqual([description]);
        expect(tagsIn(head, /<meta\s+property="og:image"\s+content="([^"]*)"/gi)).toEqual([
          `${shopperUrl}/photos/${photoPath.split('/').at(-1)}`,
        ]);
      });
    }
    expect(descriptions.get(kurdish)).not.toBe(descriptions.get(english));
  } finally {
    await crawler.dispose();
  }
});

test('in Kurdish and English, a Part page meets the automated part of WCAG 2.2 level AA in light and in dark', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, partPage(cpu)));
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(cpu.name);
      await expectAccessible(page);
    });
  }
});

// The motion of paper and print on a Part page (DESIGN.md's Motion): below
// the first screen the price slip feeds and the sheet of Offers prints as
// each comes into view, the Offers' prices settling from the end side and
// the slip's stamp landing once it has printed; the box label's barcode is
// scanned once from its start edge; and from 64rem the slip holds its place
// beside the Offers while they scroll past. Nothing moves with reduced motion
// or without script but the pinned slip, which the page's own scrolling
// moves. Each film slows every animation four times, and is judged by
// `snapsOf`.
type Frames = Filmed<ThePartPage>[];

async function expectMotionAllowed(page: Page, allowed: boolean): Promise<void> {
  expect(
    await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: no-preference)').matches,
    ),
  ).toBe(allowed);
}

// Scrolls at once, as a flick ends, so that the top of a piece's frame is at
// the middle of the window, past the nine tenths at which it prints.
async function bringIntoView(page: Page, selector: string): Promise<void> {
  await page.evaluate((wanted) => {
    const element = document.querySelector(wanted);
    const frame = element?.parentElement;
    if (frame == null) throw new Error(`No ${wanted} on the page.`);
    window.scrollTo({
      top: frame.getBoundingClientRect().top + scrollY - innerHeight / 2,
      behavior: 'instant',
    });
  }, selector);
}

function piecesOf(frames: Frames, piece: 'sheet' | 'slip') {
  return frames.flatMap(({ at, drawn }) => {
    const shown = drawn[piece];
    return shown === null || shown.state !== 'printing' ? [] : [{ at, ...shown }];
  });
}

for (const { language, fromTheEnd } of [
  { language: english, fromTheEnd: 1 },
  { language: kurdish, fromTheEnd: -1 },
]) {
  test(`in ${language.name}, the price slip feeds and the sheet of Offers prints as each comes into view, the prices settling from the end side and the slip's stamp landing once it has printed, with nothing snapping`, async ({
    page,
  }) => {
    await page.goto(addressIn(language, partPage(cpu)), { waitUntil: 'networkidle' });
    await expectMotionAllowed(page, true);
    await expect(page.getByTestId('price-slip')).toHaveAttribute('data-print', 'waiting');
    await expect(page.getByTestId('sheet')).toHaveAttribute('data-print', 'waiting');

    const slipFrames = await film(
      page,
      lookAtThePartPage,
      () => bringIntoView(page, '[data-testid="price-slip"]'),
      { forMs: 6500 },
    );
    const slip = piecesOf(slipFrames, 'slip');
    const [firstSlip] = slip;
    const lastSlip = slip.at(-1) ?? firstSlip;
    expect(firstSlip.covered / firstSlip.height, 'the slip starts covered').toBeGreaterThan(
      0.9,
    );
    expect(lastSlip.covered, 'the slip ends whole').toBe(0);
    for (const { covered, height } of slip) {
      expect(
        Math.abs((covered / height) * 10 - Math.round((covered / height) * 10)),
        'the slip feeds a tenth at a time',
      ).toBeLessThan(0.01);
    }
    expect(
      snapsOf(
        "the slip's top",
        slip.map(({ at, top }) => ({ at, value: top })),
      ),
    ).toEqual([]);
    const stamps = slipFrames.flatMap(({ at, drawn }) =>
      drawn.stamp === null || drawn.slip?.state !== 'printing'
        ? []
        : [{ at, ...drawn.stamp }],
    );
    expect(stamps[0]).toMatchObject({ scale: 1.6, opacity: 0 });
    expect(stamps.at(-1)).toMatchObject({ scale: 1, opacity: 1 });
    const slipPrinted = slip.find(({ covered }) => covered === 0)?.at ?? Infinity;
    const landing = stamps.find(({ scale }) => scale < 1.6)?.at ?? -Infinity;
    expect(landing, 'the stamp lands after the slip has printed').toBeGreaterThan(
      slipPrinted,
    );

    const sheetFrames = await film(
      page,
      lookAtThePartPage,
      () => bringIntoView(page, '[data-testid="sheet"]'),
      { forMs: 6500 },
    );
    const sheet = piecesOf(sheetFrames, 'sheet');
    const [firstSheet] = sheet;
    const lastSheet = sheet.at(-1) ?? firstSheet;
    expect(
      firstSheet.covered / firstSheet.height,
      'the sheet starts covered',
    ).toBeGreaterThan(0.9);
    expect(lastSheet.covered, 'the sheet ends whole').toBe(0);
    expect(lastSheet.top - firstSheet.top, 'the sheet slides 18 pixels down').toBeCloseTo(
      18,
      0,
    );
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

    const prices = sheetFrames.flatMap(({ at, drawn }) =>
      drawn.price === null || drawn.sheet?.state !== 'printing'
        ? []
        : [{ at, ...drawn.price }],
    );
    const [firstPrice] = prices;
    const lastPrice = prices.at(-1) ?? firstPrice;
    expect(firstPrice.opacity, 'the price arrives unseen').toBeLessThan(0.1);
    expect(lastPrice.opacity, 'the price ends settled').toBe(1);
    expect(firstPrice.shift * fromTheEnd, 'the price comes from the end side').toBeCloseTo(
      16,
      0,
    );
    expect(lastPrice.shift).toBe(0);
    expect(
      snapsOf(
        "the price's shift",
        prices.map(({ at, shift }) => ({ at, value: shift })),
      ),
    ).toEqual([]);
  });

  test(`in ${language.name}, the box label's barcode is scanned once as it comes into view, a line crossing it from its start edge to its end edge at a constant speed and gone at the end`, async ({
    page,
  }) => {
    await page.goto(addressIn(language, partPage(cpu)), { waitUntil: 'networkidle' });
    await expectMotionAllowed(page, true);

    const frames = await film(
      page,
      lookAtThePartPage,
      () => bringIntoView(page, '[data-testid="barcode"]'),
      { forMs: 5000 },
    );
    const crossing = frames.flatMap(({ at, drawn }) =>
      drawn.scan === null || drawn.scan.opacity === 0 || !drawn.scan.inside
        ? []
        : [{ at, ...drawn.scan }],
    );
    expect(crossing.length, 'the line was filmed crossing').toBeGreaterThan(10);
    // From the start edge: from the left in English, from the right in
    // Kurdish, where the bars are the same, never mirrored.
    const [first] = crossing;
    const last = crossing.at(-1) ?? first;
    expect(first.across).toBeCloseTo(fromTheEnd === 1 ? 0 : 1, 1);
    expect(last.across).toBeCloseTo(fromTheEnd === 1 ? 1 : 0, 1);
    // Gone at the end, past the edge that clips it.
    const lastFrame = frames.at(-1)?.drawn.scan;
    expect(
      lastFrame?.inside === false || lastFrame?.opacity === 0,
      'the line is gone',
    ).toBe(true);
    // At a constant speed: each step of the line as long as the others for
    // the time between its frames.
    const speeds = crossing
      .slice(1)
      .map(
        ({ at, across }, index) =>
          (across - crossing[index].across) / (at - crossing[index].at),
      )
      .filter((speed) => Number.isFinite(speed) && speed !== 0);
    const steadiest = Math.min(...speeds.map(Math.abs));
    const quickest = Math.max(...speeds.map(Math.abs));
    expect(quickest / steadiest, 'the line keeps one speed').toBeLessThan(2.5);
    expect(
      snapsOf(
        'the line',
        crossing.map(({ at, across }) => ({ at, value: across * 300 })),
      ),
    ).toEqual([]);

    // Once: scrolled away and back to, the barcode is not scanned again.
    const again = await film(
      page,
      lookAtThePartPage,
      async () => {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForTimeout(300);
        await bringIntoView(page, '[data-testid="barcode"]');
      },
      { forMs: 3000 },
    );
    for (const { drawn } of again) {
      expect(
        drawn.scan === null || !drawn.scan.inside || drawn.scan.opacity === 0,
        'the line does not cross again',
      ).toBe(true);
    }
  });
}

// The pinned story (Motion 7), at a desk's width: the page is scrolled
// smoothly through the Offers, a few pixels a frame, and filmed. While the
// Offers scroll past it the slip holds its place 32 pixels from the window's
// top, and where they end it lets go and scrolls away with them, with
// nothing snapping. The page's own scrolling moves it; with reduced motion it
// is kept, as it moves nothing itself (DESIGN.md's Reduced motion).
async function expectThePinnedStory(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(addressIn(english, partPage(cpu)), { waitUntil: 'networkidle' });
  // Where the slip and the sheet of Offers lie in the page, before any
  // scroll: the slip can hold its place for as long as the sheet runs on
  // beyond it.
  const { slipTop, slipHeight, sheetBottom } = await page.evaluate(() => {
    const slip = document.querySelector('[data-testid="price-slip"]')?.parentElement;
    const sheet = document.querySelector('[data-testid="sheet"]')?.parentElement;
    if (slip == null || sheet == null) throw new Error('No slip or sheet on the page.');
    return {
      slipTop: slip.getBoundingClientRect().top + scrollY,
      slipHeight: slip.getBoundingClientRect().height,
      sheetBottom: sheet.getBoundingClientRect().bottom + scrollY,
    };
  });
  const holds = { from: slipTop - 32, to: sheetBottom - slipHeight - 32 };
  expect(holds.to - holds.from, 'the Offers run on beyond the slip').toBeGreaterThan(100);

  // The film starts where the smooth scroll does, so that it films the
  // page's scrolling alone, and not the jump to its start.
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: 'instant' }),
    holds.from - 160,
  );
  const frames = await film(
    page,
    lookAtThePartPage,
    () =>
      page.evaluate(
        ({ from, to }) =>
          new Promise<void>((done) => {
            let y = from;
            const step = () => {
              y += 8;
              window.scrollTo({ top: y, behavior: 'instant' });
              if (y < to) requestAnimationFrame(step);
              else done();
            };
            requestAnimationFrame(step);
          }),
        { from: holds.from - 160, to: holds.to + 160 },
      ),
    { forMs: 300 },
  );

  const pinned = frames.filter(
    ({ drawn }) => drawn.scrolled > holds.from + 1 && drawn.scrolled < holds.to - 1,
  );
  const after = frames.filter(({ drawn }) => drawn.scrolled > holds.to + 40);
  expect(pinned.length, 'the slip was filmed while the Offers scrolled').toBeGreaterThan(
    10,
  );
  for (const { drawn } of pinned) {
    expect(drawn.slipInTheWindow ?? Number.NaN, 'the slip holds its place').toBeCloseTo(
      32,
      0,
    );
  }
  // Where the Offers end it lets go, and scrolls away with them.
  expect(after.length).toBeGreaterThan(3);
  for (const { drawn } of after) {
    expect(drawn.slipInTheWindow ?? Number.NaN).toBeCloseTo(
      32 - (drawn.scrolled - holds.to),
      0,
    );
  }
  expect(
    snapsOf(
      "the slip's place in the window",
      frames.map(({ at, drawn }) => ({ at, value: drawn.slipInTheWindow })),
    ),
  ).toEqual([]);
}

test('from 64rem, the price slip holds its place 32 pixels from the top beside the Offers while they scroll past, and lets go where they end, with nothing snapping', async ({
  page,
}) => {
  await expectThePinnedStory(page);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('from 64rem, the price slip is still pinned beside the Offers, as the page scrolls it', async ({
    page,
  }) => {
    await expectThePinnedStory(page);
    expect(
      await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    ).toBe(true);
  });

  test('in Kurdish and English, the Part page is the finished page: the slip fed, the sheet of Offers printed, its prices settled and the stamp down from the first frame, and no line scans the barcode', async ({
    page,
  }) => {
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}`, async () => {
        const frames = await filmFromTheFirstFrame(
          page,
          lookAtThePartPage,
          async () => {
            await page.goto(addressIn(language, partPage(cpu)), {
              waitUntil: 'networkidle',
            });
            await bringIntoView(page, '[data-testid="sheet"]');
            await page.waitForTimeout(300);
            await bringIntoView(page, '[data-testid="barcode"]');
          },
          { forMs: 3000 },
        );
        await expectMotionAllowed(page, false);
        expect(
          frames.filter(({ drawn }) => drawn.sheet !== null).length,
          'the sheet was filmed',
        ).toBeGreaterThan(5);
        for (const { drawn } of frames) {
          if (drawn.sheet !== null)
            expect(drawn.sheet.covered, 'the sheet is whole').toBe(0);
          if (drawn.slip !== null) expect(drawn.slip.covered, 'the slip is whole').toBe(0);
          if (drawn.price !== null) expect(drawn.price.opacity).toBe(1);
          if (drawn.stamp !== null) expect(drawn.stamp).toEqual({ scale: 1, opacity: 1 });
          if (drawn.scan !== null) expect(drawn.scan.opacity, 'no line scans').toBe(0);
        }
      });
    }
  });
});

test.describe('without script', () => {
  test.use({ javaScriptEnabled: false });

  test('in Kurdish and English, nothing on the Part page moves, and it arrives whole, as the server sent it', async ({
    page,
  }) => {
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}`, async () => {
        await page.goto(addressIn(language, partPage(cpu)));
        expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(
          true,
        );
        expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
        const drawn = await page.evaluate(lookAtThePartPage);
        expect(drawn.sheet?.covered).toBe(0);
        expect(drawn.slip?.covered).toBe(0);
        expect(drawn.price?.opacity).toBe(1);
        expect(drawn.stamp).toEqual({ scale: 1, opacity: 1 });
        expect(drawn.scan?.opacity ?? 0).toBe(0);
      });
    }
  });
});
