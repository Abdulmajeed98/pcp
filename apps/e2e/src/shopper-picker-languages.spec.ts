import {
  type APIRequestContext,
  type Browser,
  expect,
  type Page,
  test,
} from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  buildPageIn,
  type BuildCategory,
  type BuildPart,
  categoriesStillNeeded,
  figureOf,
  lineOf,
  partLines,
  partsNamedBy,
  pick,
  placeOf,
  rulesListed,
  theBuildAsAnswered,
} from './build-page';
import {
  chooseInTheFilters,
  expectTheAddressToAsk,
  lookAtTheCategorySheet,
  searchTheCategory,
  type TheCategorySheet,
  whatTheSheetSays,
} from './category-page';
import { createAMadeUpPart } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import {
  addressIn,
  expectNoSidewaysScroll,
  expectPageIn,
  expectTheSameInEveryLanguage,
  languages,
  layoutOf,
  readInEveryLanguage,
} from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { type Filmed, film, filmFromTheFirstFrame, snapsOf } from './motion-film';
import { addAnOffer } from './offers';
import {
  buildCategories,
  expectThePickerToList,
  partsInThePicker,
  pickerIn,
  pickerPartOf,
  pickerPath,
  pickInThePicker,
  pickOf,
  theSwitch,
  turnTheSwitch,
} from './picker';
import { createAMadeUpVendor } from './vendors';

const [kurdish, , english] = languages;
// Most lines are checked in Kurdish and in English, right to left and left
// to right, in a window as wide as a narrow phone; a Complete Build is
// picked in all three languages.
const kurdishAndEnglish = [kurdish, english] as const;

// The words unique to this run that find its own Parts in each picker, by
// searching for their names, on the development database's long lists,
// which earlier runs fill: the eight Parts of a Complete Build; two CPUs of
// two sockets and an AM5 motherboard; three CPUs in and out of stock; and
// two CPUs and a RAM kit picked again.
const buildWord = aWordUniqueToTheRun();
const socketWord = aWordUniqueToTheRun();
const stockWord = aWordUniqueToTheRun();
const pickWord = aWordUniqueToTheRun();

// One Part of each Category, with no specification, so that no rule finds
// a Problem and each fits every Build of them.
let completeBuild: Record<BuildCategory, BuildPart>;
// An AM5 motherboard, and two CPUs: one of its socket, the cheaper, and one
// of AM4, which rule 1 finds a Problem with beside it.
let am5Board: BuildPart;
let am5Cpu: BuildPart;
let am4Cpu: BuildPart;
// Two CPUs in stock, Bravo of AM4 the cheaper and Alpha of AM5, and Charlie
// of AM5, which its one Vendor has out of stock.
let alpha: BuildPart;
let bravo: BuildPart;
let charlie: BuildPart;
// Two CPUs, the first the cheaper, and a RAM kit, picked again.
let firstCpu: BuildPart;
let secondCpu: BuildPart;
let kit: BuildPart;

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

// Each Part is made through the API with the specifications its line needs,
// and offered by the run's own made-up Vendor in dinars, in stock unless its
// line says otherwise, so that no Platform Rate is needed.
test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000);
  await asTheAdmin(browser, async (request, authorization) => {
    const vendor = await createAMadeUpVendor(request, authorization);
    const aPart = async (
      category: BuildCategory,
      name: string,
      offered: { iqdPrice: number; inStock?: boolean },
      specifications: Record<string, unknown> = {},
    ): Promise<BuildPart> => {
      const { id } = await createAMadeUpPart(
        request,
        authorization,
        specifications,
        category,
        {
          name,
        },
      );
      await addAnOffer(request, authorization, vendor.id, id, offered);
      return { id, category };
    };

    const parts: Partial<Record<BuildCategory, BuildPart>> = {};
    for (const [place, category] of buildCategories.entries()) {
      parts[category] = await aPart(category, `Made-up test ${category} ${buildWord}`, {
        iqdPrice: 100_000 + place * 1000,
      });
    }
    completeBuild = parts as Record<BuildCategory, BuildPart>;

    am5Board = await aPart(
      'motherboard',
      `Made-up test motherboard ${socketWord} AM5`,
      { iqdPrice: 150_000 },
      { socket: 'AM5' },
    );
    am5Cpu = await aPart(
      'cpu',
      `Made-up test CPU ${socketWord} AM5`,
      { iqdPrice: 200_000 },
      { socket: 'AM5' },
    );
    am4Cpu = await aPart(
      'cpu',
      `Made-up test CPU ${socketWord} AM4`,
      { iqdPrice: 210_000 },
      { socket: 'AM4' },
    );

    alpha = await aPart(
      'cpu',
      `Made-up test CPU ${stockWord} Alpha`,
      { iqdPrice: 250_000 },
      { socket: 'AM5' },
    );
    bravo = await aPart(
      'cpu',
      `Made-up test CPU ${stockWord} Bravo`,
      { iqdPrice: 180_000 },
      { socket: 'AM4' },
    );
    charlie = await aPart(
      'cpu',
      `Made-up test CPU ${stockWord} Charlie`,
      { iqdPrice: 120_000, inStock: false },
      { socket: 'AM5' },
    );

    firstCpu = await aPart('cpu', `Made-up test CPU ${pickWord} First`, {
      iqdPrice: 200_000,
    });
    secondCpu = await aPart('cpu', `Made-up test CPU ${pickWord} Second`, {
      iqdPrice: 210_000,
    });
    kit = await aPart('ram', `Made-up test RAM kit ${pickWord}`, { iqdPrice: 90_000 });
  });
});

// The `part` value a Build holds of a Part: its identifier, and for a kit or
// a drive held once, `:1`.
function heldOnce({ id, category }: BuildPart): string {
  return category === 'ram' || category === 'storage' ? `${id}:1` : id;
}

test('in Kurdish, Arabic and English, a Shopper picks a Complete Build through the pickers, starting from the Build page’s links, and the Build page says it is complete', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const complete = await theBuildAsAnswered(
    page.request,
    buildCategories.map((category) => heldOnce(completeBuild[category])),
  );
  expect(complete.complete).toBe(true);

  for (const language of languages) {
    await test.step(`in ${language.name}`, async () => {
      await page.context().clearCookies();
      await page.goto(buildPageIn(language));
      await expectPageIn(page, language);

      for (const category of buildCategories) {
        const part = completeBuild[category];
        await placeOf(page, category).getByTestId('choose').click();
        await page.waitForURL(
          (url) => url.pathname === `/${language.tag}${pickerPath(category)}`,
        );
        await expectPageIn(page, language);
        await searchTheCategory(page, buildWord);
        await expectThePickerToList(page, [part.id]);
        await pickInThePicker(page, part.id);
        await expectPageIn(page, language);
        await expect(lineOf(page, part.id)).toBeVisible();
      }

      await expect(partLines(page)).toHaveCount(complete.parts.length);
      expect(await categoriesStillNeeded(page)).toEqual([]);
      // Stamped "Complete Build", since no rule finds a Problem in it.
      await expect(page.getByTestId('build-slip').getByTestId('stamp')).toBeVisible();
      await expectNoSidewaysScroll(page);
    });
  }
});

test('in Kurdish and English, the CPU picker hides a CPU of another socket than the Build’s motherboard, the switch shows it marked as not Compatible, and picking it makes the Build page list the Compatibility Problem, naming both Parts', async ({
  page,
}) => {
  await pick(page, am5Board);
  const ofTheRun = `?search=${socketWord}`;

  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(pickerIn(language, 'cpu', ofTheRun));
      await expectPageIn(page, language);
      await expectThePickerToList(page, [am5Cpu.id]);
      await expect(whatTheSheetSays(page)).toHaveAttribute('data-state', 'listed');
      await expect(theSwitch(page)).toHaveAttribute('data-on', 'no');

      await turnTheSwitch(page, true);
      await expectThePickerToList(page, [am5Cpu.id, am4Cpu.id]);
      await expect(theSwitch(page)).toHaveAttribute('data-on', 'yes');
      await expect(pickerPartOf(page, am4Cpu.id)).toHaveAttribute(
        'data-not-compatible',
        '',
      );
      await expect(
        pickerPartOf(page, am4Cpu.id).getByTestId('not-compatible'),
      ).toBeVisible();
      await expect(pickerPartOf(page, am5Cpu.id)).not.toHaveAttribute(
        'data-not-compatible',
      );
      await expect(pickerPartOf(page, am5Cpu.id).getByTestId('not-compatible')).toHaveCount(
        0,
      );

      // The switch is in the address, with the search, so a reload keeps it.
      await page.reload();
      await expectThePickerToList(page, [am5Cpu.id, am4Cpu.id]);
      await expectTheAddressToAsk(page, language, pickerPath('cpu'), [
        ['search', socketWord],
        ['show', 'all'],
      ]);

      await turnTheSwitch(page, false);
      await expectThePickerToList(page, [am5Cpu.id]);
      await expectNoSidewaysScroll(page);
    });
  }

  await page.goto(pickerIn(english, 'cpu', `${ofTheRun}&show=all`));
  await pickInThePicker(page, am4Cpu.id);
  const answered = await theBuildAsAnswered(page.request, [am5Board.id, am4Cpu.id]);
  const problem = answered.outcomes.find(
    ({ rule, outcome }) => rule === 1 && outcome === 'problem',
  );
  expect(problem?.parts).toEqual(expect.arrayContaining([am5Board.id, am4Cpu.id]));

  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}, the Build page`, async () => {
      await page.goto(buildPageIn(language));
      await expect(lineOf(page, am4Cpu.id)).toBeVisible();
      expect(await rulesListed(page, 'problem')).toContain(1);
      expect(await partsNamedBy(page, 1, 'problem')).toEqual(problem?.parts);
    });
  }
});

test('in Kurdish and English, a Part only out of stock is not in the picker, a search and a filter narrow it, and the address keeps them over a reload', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(pickerIn(language, 'cpu'));
      await expectPageIn(page, language);
      // An empty Build is judged by nothing, so the switch is not drawn.
      await expect(theSwitch(page)).toHaveCount(0);

      await searchTheCategory(page, stockWord);
      await expectThePickerToList(page, [bravo.id, alpha.id]);
      expect(await partsInThePicker(page)).not.toContain(charlie.id);

      await chooseInTheFilters(page, [['socket', 'AM5']]);
      await expectThePickerToList(page, [alpha.id]);
      await expectTheAddressToAsk(page, language, pickerPath('cpu'), [
        ['search', stockWord],
        ['socket', 'AM5'],
      ]);

      await page.reload();
      await expectThePickerToList(page, [alpha.id]);
      await expectTheAddressToAsk(page, language, pickerPath('cpu'), [
        ['search', stockWord],
        ['socket', 'AM5'],
      ]);
    });
  }
});

test.describe('with scripts switched off', () => {
  test.use({ javaScriptEnabled: false });

  test('picking works, and so do the search and the switch, which the search keeps', async ({
    page,
  }) => {
    await pick(page, am5Board);
    await page.goto(pickerIn(english, 'cpu'));
    expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(true);

    await searchTheCategory(page, socketWord);
    await expectThePickerToList(page, [am5Cpu.id]);
    await turnTheSwitch(page, true);
    await expectThePickerToList(page, [am5Cpu.id, am4Cpu.id]);
    // A search sent with the switch on keeps it.
    await searchTheCategory(page, `${socketWord} AM4`);
    expect(new URL(page.url()).searchParams.get('show')).toBe('all');
    await expectThePickerToList(page, [am4Cpu.id]);

    await pickInThePicker(page, am4Cpu.id);
    await expect(lineOf(page, am4Cpu.id)).toBeVisible();
    await expect(lineOf(page, am5Board.id)).toBeVisible();
  });
});

test('picking a second CPU replaces the first, and picking the same RAM kit twice makes its quantity two', async ({
  page,
}) => {
  const ofTheRun = `?search=${pickWord}`;
  await page.goto(pickerIn(english, 'cpu', ofTheRun));
  await expectThePickerToList(page, [firstCpu.id, secondCpu.id]);
  await pickInThePicker(page, firstCpu.id);
  await expect(placeOf(page, 'cpu').getByTestId('build-part')).toHaveCount(1);
  await expect(lineOf(page, firstCpu.id)).toBeVisible();

  // The CPU the Build holds says so in place of Pick.
  await page.goto(pickerIn(english, 'cpu', ofTheRun));
  await expect(pickerPartOf(page, firstCpu.id)).toHaveAttribute('data-in-build', 'one');
  await expect(pickerPartOf(page, firstCpu.id).getByTestId('in-your-build')).toBeVisible();
  await expect(pickOf(page, firstCpu.id)).toHaveCount(0);
  await pickInThePicker(page, secondCpu.id);
  await expect(placeOf(page, 'cpu').getByTestId('build-part')).toHaveCount(1);
  await expect(lineOf(page, secondCpu.id)).toBeVisible();
  await expect(lineOf(page, firstCpu.id)).toHaveCount(0);

  await page.goto(pickerIn(english, 'ram', ofTheRun));
  await pickInThePicker(page, kit.id);
  await expect(figureOf(page, kit.id)).toHaveValue('1');

  // A kit the Build holds says how many, and offers one more.
  await page.goto(pickerIn(english, 'ram', ofTheRun));
  await expect(pickerPartOf(page, kit.id)).toHaveAttribute('data-in-build', '1');
  await expect(pickerPartOf(page, kit.id).getByTestId('in-your-build')).toBeVisible();
  await pickInThePicker(page, kit.id);
  await expect(figureOf(page, kit.id)).toHaveValue('2');
  await expect(placeOf(page, 'ram').getByTestId('build-part')).toHaveCount(1);
});

// LANG-2, LANG-3 and LANG-5 in the picker, in all three languages, with a
// Part in the Build, so that it is marked, and the switch on, so that one is
// marked as not fitting.
test('the picker is right to left in Kurdish and Arabic, with every number in Western digits, Part names in English, and nothing scrolling sideways', async ({
  page,
}) => {
  await pick(page, am5Board);
  await pick(page, am5Cpu);

  const read = await readInEveryLanguage(
    page,
    pickerPath('cpu', `?search=${socketWord}&show=all`),
    async () => {
      await expectThePickerToList(page, [am5Cpu.id, am4Cpu.id]);
      await expect(
        pickerPartOf(page, am5Cpu.id).getByTestId('in-your-build'),
      ).toBeVisible();
      await expect(
        pickerPartOf(page, am4Cpu.id).getByTestId('not-compatible'),
      ).toBeVisible();
      const name = pickerPartOf(page, am4Cpu.id).locator('[data-item-name] bdi');
      return {
        listed: await partsInThePicker(page),
        name: await name.textContent(),
        layout: await layoutOf(name),
        price: await pickerPartOf(page, am4Cpu.id).getByTestId('item-end').textContent(),
      };
    },
  );
  expectTheSameInEveryLanguage(read);
  expect(read.get(kurdish)?.layout).toEqual({ direction: 'ltr', keptApart: true });
});

test('in Kurdish and English, the picker meets the automated part of WCAG 2.2 level AA in light and in dark, with a Part in the Build and the switch on', async ({
  page,
}) => {
  await pick(page, am5Board);
  await pick(page, am5Cpu);
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(pickerIn(language, 'cpu', `?search=${socketWord}&show=all`));
      await expectThePickerToList(page, [am5Cpu.id, am4Cpu.id]);
      await expectAccessible(page);
    });
  }
});

test('in Kurdish and English, an address that names no Category answers the not-found page with a 404, in the page’s language, and the picker’s head names its Category with no price and is not indexed', async ({
  page,
  playwright,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      for (const name of ['monitor', 'CPU', 'cpu_cooler']) {
        const response = await page.goto(addressIn(language, `/build/${name}`));
        expect(response?.status(), name).toBe(404);
        await expectPageIn(page, language);
      }
    });
  }

  // Read as a crawler reads it, with no cookie.
  const crawler = await playwright.request.newContext();
  try {
    for (const language of kurdishAndEnglish) {
      await page.goto(pickerIn(language, 'cpu'));
      const title = (await page.getByRole('heading', { level: 1 }).innerText()).trim();
      const answer = await crawler.get(pickerIn(language, 'cpu', `?search=${stockWord}`), {
        headers: { 'user-agent': 'WhatsApp/2.24.6.77 A' },
      });
      expect(answer.status()).toBe(200);
      const html = await answer.text();
      const head = html.slice(0, html.indexOf('</head>'));
      expect(/<title>([^<]*)<\/title>/.exec(head)?.[1]).toContain(title);
      expect(head).toMatch(/<meta\s+name="robots"\s+content="noindex"/);
      const description =
        /<meta\s+name="description"\s+content="([^"]*)"/.exec(head)?.[1] ?? '';
      expect(description).not.toMatch(/\d|IQD|\$|≈/);
    }
  } finally {
    await crawler.dispose();
  }
});

// The motion DESIGN.md gives the picker and the pick: the picker's sheet
// prints as the page opens, as a Category page's does, its prices settling
// from the end side and its stamp landing (Motions 1 to 3); the list drawn
// again in place by the switch is shown printed; a pick is answered with the
// Build page at the Category picked, which is shown printed, as an anchor's
// target always is; and with reduced motion each is whole from its first
// frame. Each is filmed with every animation slowed four times, and judged
// by `snapsOf` (the No Snap Rule).
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

// The Build page a pick is answered with, filmed from its first frame: the
// Build's sheet, the first sheet of the page, which holds the Category's
// place the address leads to.
async function filmThePick(page: Page, partId: string): Promise<Frames> {
  return filmFromTheFirstFrame(page, lookAtTheCategorySheet, () =>
    pickInThePicker(page, partId),
  );
}

for (const { language, fromTheEnd } of [
  { language: english, fromTheEnd: 1 },
  { language: kurdish, fromTheEnd: -1 },
]) {
  test(`in ${language.name}, the picker's sheet prints as the page opens, its prices settling from the end side and its stamp landing, the switch draws the list again shown printed, and a pick lands on the Build page shown printed, with nothing snapping`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await pick(page, am5Board);
    const frames = await filmFromTheFirstFrame(
      page,
      lookAtTheCategorySheet,
      async () => {
        await page.goto(pickerIn(language, 'cpu', `?search=${socketWord}`));
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
    expect(
      snapsOf(
        "the price's shift",
        prices.map(({ at, shift }) => ({ at, value: shift })),
      ),
    ).toEqual([]);

    const stamps = frames.flatMap(({ at, drawn }) =>
      drawn.stamp === null ? [] : [{ at, ...drawn.stamp }],
    );
    const lastStamp = stamps.at(-1);
    expect(stamps[0]?.scale).toBeCloseTo(1.6, 2);
    expect(lastStamp).toEqual({ at: lastStamp?.at, scale: 1, opacity: 1 });
    expect(
      snapsOf(
        "the stamp's size",
        stamps.map(({ at, scale }) => ({ at, value: scale * 100 })),
      ),
    ).toEqual([]);

    // The switch, with script, draws the list again in place, shown printed.
    const switched = await film(
      page,
      lookAtTheCategorySheet,
      () => turnTheSwitch(page, true),
      {
        forMs: 3000,
      },
    );
    await expectThePickerToList(page, [am5Cpu.id, am4Cpu.id]);
    expectStillAndWhole(switched);

    // A pick is answered with the Build page at the CPU's place, shown
    // printed.
    const picked = await filmThePick(page, am5Cpu.id);
    expect(new URL(page.url()).hash).toBe('#cpu');
    expectStillAndWhole(picked);
  });
}

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('in Kurdish and English, the picker is whole from the first frame it is drawn in, its prices settled and its stamp down, nothing moves as the switch draws it again, and a pick lands on the Build page whole', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}`, async () => {
        await page.context().clearCookies();
        await pick(page, am5Board);
        const frames = await filmFromTheFirstFrame(
          page,
          lookAtTheCategorySheet,
          async () => {
            await page.goto(pickerIn(language, 'cpu', `?search=${socketWord}`));
          },
        );
        await expectMotionAllowed(page, false);
        expectStillAndWhole(frames);

        const switched = await film(
          page,
          lookAtTheCategorySheet,
          () => turnTheSwitch(page, true),
          { forMs: 1600 },
        );
        expectStillAndWhole(switched);

        expectStillAndWhole(await filmThePick(page, am5Cpu.id));
      });
    }
  });
});
