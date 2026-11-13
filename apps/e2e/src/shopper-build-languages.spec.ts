import { randomUUID } from 'node:crypto';

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
  emptyTheBuild,
  emptyTheBuildAfterConfirming,
  figureOf,
  keepInTheCookieByHand,
  lineOf,
  partLines,
  pick,
  placeOf,
  quantityOf,
  removeOf,
  theBuildAsAnswered,
  theFramesCount,
  theStatus,
  theWayToTheBuild,
  whatTheQuantitySays,
} from './build-page';
import { whatTheSheetSays } from './category-page';
import { createAMadeUpPart } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import {
  expectNoSidewaysScroll,
  expectPageIn,
  type Language,
  languages,
  layoutOf,
  readInEveryLanguage,
} from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { film, snapsOf } from './motion-film';
import { pickerIn } from './picker';
import { shopperUrl } from './platform';

const [kurdish, , english] = languages;
// The ticket's lines are checked in Kurdish and in English, right to left
// and left to right, in a window as wide as a narrow phone.
const kurdishAndEnglish = [kurdish, english] as const;

// The word unique to this run in its Parts' names.
const word = aWordUniqueToTheRun();

// The run's made-up Parts, one of each Category a Build holds one of, two
// RAM kits and a drive, made through the API with no specification, so that
// no rule finds a Problem and the CPU says neither whether it has graphics
// nor whether it comes with a cooler. And seven more kits, so that a Build
// can hold the most different kits it keeps, and a ninth past it.
let cpu: BuildPart;
let cooler: BuildPart;
let board: BuildPart;
let kit: BuildPart;
let otherKit: BuildPart;
let drive: BuildPart;
let gpu: BuildPart;
let theCase: BuildPart;
let psu: BuildPart;
let moreKits: BuildPart[];

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
    const aPart = async (category: BuildCategory, what: string): Promise<BuildPart> => {
      const { id } = await createAMadeUpPart(request, authorization, {}, category, {
        name: `Made-up test ${what} ${word}`,
      });
      return { id, category };
    };
    cpu = await aPart('cpu', 'CPU');
    cooler = await aPart('cpuCooler', 'cooler');
    board = await aPart('motherboard', 'motherboard');
    kit = await aPart('ram', 'RAM kit');
    otherKit = await aPart('ram', 'other RAM kit');
    drive = await aPart('storage', 'drive');
    gpu = await aPart('gpu', 'GPU');
    theCase = await aPart('case', 'case');
    psu = await aPart('psu', 'PSU');
    moreKits = [];
    for (let place = 3; place <= 9; place += 1) {
      moreKits.push(await aPart('ram', `RAM kit ${place}`));
    }
  });
});

// The Build of a CPU, a motherboard, a kit held twice and a drive, picked
// from the page's own browser.
async function aBuildStillNeedingFour(page: Page): Promise<void> {
  for (const part of [cpu, board, kit, kit, drive]) await pick(page, part);
}

const stillNeedingFour = () => [cpu.id, board.id, `${kit.id}:2`, `${drive.id}:1`];

test('in Kurdish and English, the Build page shows each Part with its quantity and the Categories still needed, and a Complete Build says so', async ({
  page,
}) => {
  await aBuildStillNeedingFour(page);
  const answered = await theBuildAsAnswered(page.request, stillNeedingFour());
  expect(answered.complete).toBe(false);
  const statuses = new Map<Language, string>();

  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}, a Build that still needs four Categories`, async () => {
      await page.goto(buildPageIn(language));
      await expectPageIn(page, language);

      await expect(partLines(page)).toHaveCount(answered.parts.length);
      for (const part of answered.parts) {
        // Each Part in its Category's place, its name in English, left to
        // right and kept apart from the page's own words (LANG-3).
        await expect(
          placeOf(page, part.category).locator(`[data-part="${part.id}"]`),
        ).toHaveCount(1);
        const name = lineOf(page, part.id).locator('[data-item-name] bdi');
        await expect(name).toHaveText(part.name);
        expect(await layoutOf(name)).toEqual({ direction: 'ltr', keptApart: true });
        // A kit or a drive with its quantity, and no quantity for the rest.
        if (part.quantity === null) {
          await expect(quantityOf(page, part.id)).toHaveCount(0);
        } else {
          await expect(figureOf(page, part.id)).toHaveValue(String(part.quantity));
        }
      }
      // The Categories still needed, as the API answers them, each a link to
      // its picker.
      expect(await categoriesStillNeeded(page)).toEqual(answered.stillNeeded);
      // The CPU says neither whether it has graphics nor whether it comes with
      // a cooler, so a line says so for each.
      await expect(page.getByTestId('cpu-line')).toHaveCount(2);
      await expect(page.getByTestId('stamp')).toHaveCount(0);
      await expectNoSidewaysScroll(page);
      statuses.set(language, (await theStatus(page).textContent()) ?? '');
    });
  }

  for (const part of [cooler, gpu, theCase, psu]) await pick(page, part);
  const complete = await theBuildAsAnswered(page.request, [
    ...stillNeedingFour(),
    cooler.id,
    gpu.id,
    theCase.id,
    psu.id,
  ]);
  expect(complete.complete).toBe(true);

  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}, a Complete Build`, async () => {
      await page.goto(buildPageIn(language));
      await expectPageIn(page, language);

      await expect(partLines(page)).toHaveCount(complete.parts.length);
      expect(await categoriesStillNeeded(page)).toEqual([]);
      await expect(theStatus(page)).not.toHaveText(statuses.get(language) ?? '');
      await expect(page.getByTestId('cpu-line')).toHaveCount(0);
      // Stamped, since no rule finds a Problem in it.
      await expect(page.getByTestId('build-slip').getByTestId('stamp')).toBeVisible();
      await expectNoSidewaysScroll(page);
    });
  }
});

// LANG-2, LANG-3 and LANG-5 on the Build page, in all three languages, with
// a kit held 16 times so that a figure has two digits.
test('the Build page is right to left in Kurdish and Arabic, with every number in Western digits, Part names in English, and nothing scrolling sideways', async ({
  page,
}) => {
  await aBuildStillNeedingFour(page);
  for (let held = 2; held < 16; held += 1) await pick(page, kit);

  const names = await readInEveryLanguage(page, '/build', async () => {
    await expect(figureOf(page, kit.id)).toHaveValue('16');
    return Promise.all(
      [cpu, board, kit, drive].map(async (part) => {
        const name = lineOf(page, part.id).locator('[data-item-name] bdi');
        return { text: await name.textContent(), layout: await layoutOf(name) };
      }),
    );
  });
  for (const read of names.values()) {
    expect(read).toEqual(names.get(english));
    for (const { layout } of read) {
      expect(layout).toEqual({ direction: 'ltr', keptApart: true });
    }
  }
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(javaScriptEnabled ? 'with scripts' : 'with scripts switched off', () => {
    test.use({ javaScriptEnabled });

    // A change with script applies in place: the answer to its form is
    // awaited before the page is read again.
    async function andSent(page: Page, form: string, act: () => Promise<void>) {
      if (!javaScriptEnabled) {
        await act();
        return;
      }
      const sent = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/build/${form}`) &&
          response.request().method() === 'POST',
      );
      await act();
      await sent;
    }

    test("changing a kit's quantity, removing a Part and emptying the Build after confirming each work, and the frame counts the Parts", async ({
      page,
    }) => {
      await aBuildStillNeedingFour(page);
      await page.goto(buildPageIn(english));
      expect(
        await page.evaluate(() => matchMedia('(scripting: none)').matches),
        'the browser runs script as the line says',
      ).toBe(!javaScriptEnabled);
      expect(await theFramesCount(page)).toBe(4);

      await test.step('one more of the kit', async () => {
        await andSent(page, 'quantity', () =>
          quantityOf(page, kit.id).getByTestId('one-more').click(),
        );
        await expect(figureOf(page, kit.id)).toHaveValue('3');
      });
      await test.step('a quantity typed on the number pad, in Arabic-Indic digits', async () => {
        await figureOf(page, kit.id).fill('١٢');
        await andSent(page, 'quantity', () => figureOf(page, kit.id).press('Enter'));
        await expect(figureOf(page, kit.id)).toHaveValue('12');
      });
      await test.step('one fewer of the kit', async () => {
        await andSent(page, 'quantity', () =>
          quantityOf(page, kit.id).getByTestId('one-fewer').click(),
        );
        await expect(figureOf(page, kit.id)).toHaveValue('11');
      });
      await test.step('the drive removed', async () => {
        await andSent(page, 'remove', () => removeOf(page, drive.id).click());
        await expect(lineOf(page, drive.id)).toHaveCount(0);
        await expect(placeOf(page, 'storage').getByTestId('choose')).toBeVisible();
        await expect.poll(() => theFramesCount(page)).toBe(3);
      });

      await test.step('each change kept, as a reload shows', async () => {
        await page.reload();
        await expect(figureOf(page, kit.id)).toHaveValue('11');
        await expect(partLines(page)).toHaveCount(3);
        expect(await theFramesCount(page)).toBe(3);
      });

      await test.step('emptying, kept after Keep them, done after the confirmation', async () => {
        await emptyTheBuild(page).locator('summary').click();
        await emptyTheBuild(page).getByTestId('keep-them').click();
        await expect(emptyTheBuild(page)).not.toHaveAttribute('open');
        await expect(partLines(page)).toHaveCount(3);

        await emptyTheBuildAfterConfirming(page);
        await expect(page).toHaveURL(buildPageIn(english));
        await expect(partLines(page)).toHaveCount(0);
        await expect(emptyTheBuild(page)).toHaveCount(0);
        expect(await theFramesCount(page)).toBe(0);
        expect(
          (await page.context().cookies(shopperUrl)).filter(({ name }) => name === 'build'),
          'the browser keeps no Build',
        ).toEqual([]);
      });
    });

    // A quantity outside 1 to 16 is not applied, and the form says why under
    // it: with script before it is sent, and without it in the server's
    // answer.
    test('a quantity outside 1 to 16 is not applied, and the form says why', async ({
      page,
    }) => {
      await aBuildStillNeedingFour(page);
      await page.goto(buildPageIn(english));
      await expect(whatTheQuantitySays(page, kit.id)).toHaveText('');

      await figureOf(page, kit.id).fill('17');
      await figureOf(page, kit.id).press('Enter');
      await expect(whatTheQuantitySays(page, kit.id)).not.toHaveText('');
      // With script the figure keeps what was typed, so that it can be
      // corrected; without it the page drawn again shows what the Build holds.
      await expect(figureOf(page, kit.id)).toHaveValue(javaScriptEnabled ? '17' : '2');

      await page.goto(buildPageIn(english));
      await expect(figureOf(page, kit.id)).toHaveValue('2');
      await expect(whatTheQuantitySays(page, kit.id)).toHaveText('');
    });
  });
}

test('the Build is kept after a reload and on another page in the same browser for a year, the frame counting its Parts, and a fresh browser starts with an empty Build', async ({
  page,
  browser,
}) => {
  for (const part of [cpu, kit, kit]) await pick(page, part);

  await page.goto(buildPageIn(english));
  await expect(partLines(page)).toHaveCount(2);
  expect(await theFramesCount(page)).toBe(2);

  await page.reload();
  await expect(partLines(page)).toHaveCount(2);
  await expect(figureOf(page, kit.id)).toHaveValue('2');

  // Another page: the home page, whose frame leads back to the Build.
  await page.goto(`${shopperUrl}/en`);
  expect(await theFramesCount(page)).toBe(2);
  await theWayToTheBuild(page).click();
  await expect(page).toHaveURL(buildPageIn(english));
  await expect(partLines(page)).toHaveCount(2);
  await expect(theWayToTheBuild(page)).toHaveAttribute('aria-current', 'page');

  const [kept] = (await page.context().cookies(shopperUrl)).filter(
    ({ name }) => name === 'build',
  );
  const daysLeft = (kept.expires - Date.now() / 1000) / (60 * 60 * 24);
  expect(daysLeft).toBeGreaterThan(364);
  expect(daysLeft).toBeLessThan(366);
  expect(kept.httpOnly, 'no script reads the Build').toBe(true);

  const fresh = await browser.newContext();
  try {
    const another = await fresh.newPage();
    await another.goto(buildPageIn(english));
    await expect(partLines(another)).toHaveCount(0);
    expect(await theFramesCount(another)).toBe(0);
    expect(await categoriesStillNeeded(another)).toEqual([]);
    await expect(another.getByTestId('choose')).toHaveCount(8);
  } finally {
    await fresh.close();
  }
});

// The Build depends on the Shopper's cookie, so its page asks search engines
// not to index it, and its preview names no Part and no price, whatever the
// Build holds.
test("the Build page's head asks search engines not to index it, and its title names no Part", async ({
  page,
}) => {
  await aBuildStillNeedingFour(page);
  const answered = await theBuildAsAnswered(page.request, stillNeedingFour());

  for (const language of kurdishAndEnglish) {
    await page.goto(buildPageIn(language));
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const title = await page.title();
    const description =
      (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
    for (const part of answered.parts) {
      expect(title).not.toContain(part.name);
      expect(description).not.toContain(part.name);
    }
    expect(`${title} ${description}`, 'no price').not.toMatch(/IQD|\$|[0-9]/);
  }
});

test('a pick past the limits is refused and the page says why: a ninth different kit, and a seventeenth of one', async ({
  page,
}) => {
  const eightKits = [kit, otherKit, ...moreKits.slice(0, 6)];
  for (const each of eightKits) await pick(page, each);

  const ninth = moreKits[6];
  const refused = await pick(page, ninth);
  expect(refused).toContain('refused=mostKitsOrDrives');
  await page.goto(`${shopperUrl}${refused}`);
  await expect(placeOf(page, 'ram').getByTestId('refused')).not.toHaveText('');
  await expect(placeOf(page, 'ram').locator('[data-testid="build-part"]')).toHaveCount(8);
  await expect(lineOf(page, ninth.id)).toHaveCount(0);

  for (let held = 1; held < 16; held += 1) await pick(page, kit);
  const seventeenth = await pick(page, kit);
  expect(seventeenth).toContain('refused=mostOfOne');
  await page.goto(`${shopperUrl}${seventeenth}`);
  await expect(figureOf(page, kit.id)).toHaveValue('16');
  await expect(whatTheQuantitySays(page, kit.id)).not.toHaveText('');
  await expect(quantityOf(page, kit.id).getByTestId('one-more')).toBeDisabled();
});

test('a change forgets the Parts the catalog no longer holds, so that a kit joins a Build whose cookie names 8 kits the catalog does not hold', async ({
  page,
}) => {
  // Eight kits no catalog holds, as a cookie keeps Parts that have since
  // left the catalog.
  const gone = Array.from({ length: 8 }, () => `ram:${randomUUID()}:1`);
  await keepInTheCookieByHand(page, gone.join(','));
  await page.goto(buildPageIn(english));
  await expect(partLines(page)).toHaveCount(0);
  expect(await theFramesCount(page), 'the cookie still names them').toBe(8);

  const picked = await pick(page, kit);
  expect(picked, 'the kit is not refused as a ninth').not.toContain('refused');
  await page.goto(buildPageIn(english));
  await expect(partLines(page)).toHaveCount(1);
  await expect(lineOf(page, kit.id)).toBeVisible();
  expect(await theFramesCount(page), 'the cookie forgot them').toBe(1);
});

test('a Build the API refuses, a RAM kit filed by hand under the CPU, is said to be one that cannot be read and is emptied after confirming, and the picker says so and leads to the Build page', async ({
  page,
}) => {
  await keepInTheCookieByHand(page, `cpu:${kit.id}`);

  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(pickerIn(language, 'cpu'));
      await expectPageIn(page, language);
      await expect(whatTheSheetSays(page)).toHaveAttribute('data-state', 'build-refused');
      await expect(page.getByTestId('picker-list')).toHaveCount(0);
      await page.getByTestId('to-your-build').click();
      await expect(page).toHaveURL(buildPageIn(language));

      await expect(page.getByTestId('build-refused')).toBeVisible();
      await expect(page.getByTestId('try-again')).toHaveCount(0);
      await expect(emptyTheBuild(page)).toBeVisible();
      await expectNoSidewaysScroll(page);
    });
  }

  await emptyTheBuildAfterConfirming(page);
  await expect(page).toHaveURL(buildPageIn(english));
  await expect(page.getByTestId('build-refused')).toHaveCount(0);
  await expect(page.getByTestId('choose')).toHaveCount(8);
  expect(await theFramesCount(page)).toBe(0);
});

test('the Build page passes WCAG 2.2 level AA in the light and the dark scheme, its confirmation open', async ({
  page,
}) => {
  await aBuildStillNeedingFour(page);
  await page.goto(buildPageIn(english));
  await emptyTheBuild(page).locator('summary').click();
  await expect(emptyTheBuild(page).getByTestId('empty-confirm')).toBeVisible();
  await expectAccessible(page);

  await page.goto(buildPageIn(kurdish));
  await expectAccessible(page);
});

// Motion 11: with script, a change on the Build page applies in place and the
// page holds still but for what the change brought. A line the Build loses
// fades and folds; a place it changes moves to its new height, so that
// nothing below jumps; a line it gains prints in. With reduced motion nothing
// fades or prints, and the spaces still move (the No Snap Rule).
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`a Part removed in place folds its line and its Category's place, with nothing below snapping, ${reducedMotion === 'reduce' ? 'and with reduced motion fades and prints nothing' : 'its line fading and what it brings printing in'}`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    for (const part of [cpu, kit, otherKit, drive, psu]) await pick(page, part);
    await page.emulateMedia({ reducedMotion });
    await page.goto(buildPageIn(english));
    await page.evaluate(() => document.fonts.ready);

    // What the film looks at in each frame: where the places below the
    // change are drawn, how the leaving line is drawn, and whether what the
    // change brings is printing in.
    const look = () => {
      const top = (selector: string) => {
        const element = document.querySelector(selector);
        return element === null
          ? null
          : element.getBoundingClientRect().top + window.scrollY;
      };
      const leaving = document.querySelector<HTMLElement>('[data-leaving]');
      return {
        storage: top('[data-testid="build-category-storage"]'),
        psu: top('[data-testid="build-category-psu"]'),
        leavingOpacity: leaving === null ? null : Number(getComputedStyle(leaving).opacity),
        leavingHeight: leaving === null ? null : leaving.getBoundingClientRect().height,
        printing: document
          .getAnimations()
          .some(
            (animation) =>
              (animation as CSSAnimation).animationName === 'line-prints' &&
              animation.playState === 'running',
          ),
      };
    };

    await test.step('a second kit removed: its line leaves, and the places below follow', async () => {
      await lineOf(page, otherKit.id).evaluate((line) =>
        line.setAttribute('data-leaving', ''),
      );
      const sent = page.waitForResponse((response) =>
        response.url().endsWith('/build/remove'),
      );
      const frames = await film(page, look, () => removeOf(page, otherKit.id).click(), {
        forMs: 4000,
      });
      await sent;
      await expect(lineOf(page, otherKit.id)).toHaveCount(0);

      const along = (value: 'storage' | 'psu') =>
        frames.map(({ at, drawn }) => ({ at, value: drawn[value] }));
      expect([
        ...snapsOf("the storage's place", along('storage')),
        ...snapsOf("the PSU's place", along('psu')),
      ]).toEqual([]);
      const opacities = frames.flatMap(({ drawn }) =>
        drawn.leavingOpacity === null ? [] : [drawn.leavingOpacity],
      );
      const heights = frames.flatMap(({ drawn }) =>
        drawn.leavingHeight === null ? [] : [drawn.leavingHeight],
      );
      expect(Math.min(...heights), 'the line folds its space').toBeLessThan(1);
      if (reducedMotion === 'reduce') {
        expect(Math.min(...opacities), 'with reduced motion the line does not fade').toBe(
          1,
        );
      } else {
        expect(Math.min(...opacities), 'the line fades as it leaves').toBeLessThan(0.5);
      }
    });

    await test.step('the CPU removed: the cell to choose one prints in, and nothing below snaps', async () => {
      const sent = page.waitForResponse((response) =>
        response.url().endsWith('/build/remove'),
      );
      const frames = await film(page, look, () => removeOf(page, cpu.id).click(), {
        forMs: 5000,
      });
      await sent;
      await expect(placeOf(page, 'cpu').getByTestId('choose')).toBeVisible();

      const along = (value: 'storage' | 'psu') =>
        frames.map(({ at, drawn }) => ({ at, value: drawn[value] }));
      expect([
        ...snapsOf("the storage's place", along('storage')),
        ...snapsOf("the PSU's place", along('psu')),
      ]).toEqual([]);
      expect(
        frames.some(({ drawn }) => drawn.printing),
        reducedMotion === 'reduce'
          ? 'with reduced motion nothing prints in'
          : 'what the change brings prints in',
      ).toBe(reducedMotion !== 'reduce');
    });
  });
}
