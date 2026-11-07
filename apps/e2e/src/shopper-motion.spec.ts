import { expect, type Page, test } from '@playwright/test';

import { choiceOf } from './currencies';
import {
  type APrintedPiece,
  bringIntoView,
  linkOf,
  lookAtThePrintedPieces,
  type PrintedPieces,
} from './home-page';
import { addressIn, languages } from './languages';
import { type Filmed, film, filmFromTheFirstFrame, snapsOf } from './motion-film';

const [kurdish, , english] = languages;

// The motion of paper and print (DESIGN.md's Motion): a sheet prints as it
// arrives, its prices settle, a stamp lands, a slip feeds, and a press gives,
// once a page view, and never without script or with reduced motion. Each is
// filmed with every animation slowed four times, and judged by `snapsOf`.
const homePage = addressIn(english);
const notFound = addressIn(english, '/no-such-page');
// The not-found page of an unknown Category, which the browser draws by
// script, unlike that of an address that matches no page.
const anUnknownCategory = addressIn(english, '/categories/no-such-category');

// How long a film runs on after what starts it, at a quarter of the speed:
// time for every print, its prices and its stamp, which are done within
// 1.25 seconds, and for the slip's stamp, which lands 1150 ms into its feed.
const forEveryPiece = 6500;

// The frames in which a piece is on the page, each with when it was drawn.
function framesOf(
  frames: Filmed<PrintedPieces>[],
  piece: 'sheet' | 'slip',
): (APrintedPiece & { at: number })[] {
  return frames.flatMap(({ at, drawn }) => {
    const shown = drawn[piece];
    return shown === null ? [] : [{ at, ...shown }];
  });
}

// What snaps in a printed piece as it prints: its slide into place, and its
// uncovering from its top edge down.
function snapsOfThePrint(
  name: string,
  frames: (APrintedPiece & { at: number })[],
): string[] {
  return [
    ...snapsOf(
      `${name}'s top`,
      frames.map(({ at, top }) => ({ at, value: top })),
    ),
    ...snapsOf(
      `${name}'s covered foot`,
      frames.map(({ at, covered }) => ({ at, value: covered })),
    ),
  ];
}

// A piece printed in full in every frame, which moved not at all.
function expectStillAndWhole(
  name: string,
  frames: (APrintedPiece & { at: number })[],
): void {
  expect(frames.length, `${name} was filmed`).toBeGreaterThan(5);
  for (const { covered } of frames) expect(covered, `${name} is whole`).toBe(0);
  const tops = frames.map(({ top }) => top);
  expect(Math.max(...tops) - Math.min(...tops), `${name} moved`).toBeLessThan(0.5);
}

// The browser asks for no reduced motion, unless a test says otherwise.
// Without this, a browser that did would pass every film as still.
async function expectMotionAllowed(page: Page, allowed: boolean): Promise<void> {
  expect(
    await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: no-preference)').matches,
    ),
  ).toBe(allowed);
}

test("the not-found page's sheet prints as the page opens: uncovered from its top edge down while it slides 18 pixels into place, with nothing snapping", async ({
  page,
}) => {
  const frames = await filmFromTheFirstFrame(
    page,
    lookAtThePrintedPieces,
    async () => {
      await page.goto(notFound);
    },
    { forMs: 4500 },
  );
  await expectMotionAllowed(page, true);

  const sheet = framesOf(frames, 'sheet');
  expect(sheet.length, 'the sheet was filmed').toBeGreaterThan(30);
  const [first] = sheet;
  const last = sheet.at(-1) ?? first;
  expect(first.covered / first.height, 'the sheet arrives covered').toBeGreaterThan(0.9);
  expect(last.covered, 'the sheet ends whole').toBe(0);
  expect(last.top - first.top, 'the sheet slides 18 pixels down').toBeCloseTo(18, 0);
  // The print took its 900 ms four times over, so the film saw it slowed.
  const whole = sheet.find(({ covered }) => covered === 0) ?? last;
  expect(whole.at - first.at).toBeGreaterThan(2500);
  expect(snapsOfThePrint('the sheet', sheet)).toEqual([]);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test("the not-found page's sheet is whole from the first frame it is drawn in, and does not move", async ({
    page,
  }) => {
    const frames = await filmFromTheFirstFrame(page, lookAtThePrintedPieces, async () => {
      await page.goto(notFound);
    });
    await expectMotionAllowed(page, false);

    expectStillAndWhole('the sheet', framesOf(frames, 'sheet'));
  });

  test('the home page is the finished page: nothing is held back, and nothing moves as the sheet and the slip come into view', async ({
    page,
  }) => {
    await page.goto(homePage, { waitUntil: 'networkidle' });
    await expectMotionAllowed(page, false);
    for (const piece of ['sheet', 'price-slip']) {
      await expect(page.getByTestId(piece)).not.toHaveAttribute('data-print');
    }

    const frames = await film(
      page,
      lookAtThePrintedPieces,
      async () => {
        await bringIntoView(page, 'sheet');
        await page.waitForTimeout(1500);
        await bringIntoView(page, 'price-slip');
      },
      { forMs: 1500 },
    );

    expectStillAndWhole('the sheet', framesOf(frames, 'sheet'));
    expectStillAndWhole('the slip', framesOf(frames, 'slip'));
    const counts = frames.flatMap(({ drawn }) =>
      drawn.count === null ? [] : [drawn.count],
    );
    for (const { opacity } of counts) expect(opacity, 'the count is settled').toBe(1);
    const lefts = counts.map(({ left }) => left);
    expect(Math.max(...lefts) - Math.min(...lefts), 'the count moved').toBeLessThan(0.5);
    for (const { drawn } of frames) {
      expect(drawn.stamp, 'the stamp is down').toEqual({ scale: 1, opacity: 1 });
    }
  });
});

// The sheet of the eight Categories is below the first screen: the page's
// script holds it back and prints it as it comes into view, and its counts
// settle into their column from the end side, the right in English and the
// left in Kurdish (DESIGN.md's Right to left).
for (const { language, fromTheEnd } of [
  { language: english, fromTheEnd: 1 },
  { language: kurdish, fromTheEnd: -1 },
]) {
  test(`the home page's sheet of the Categories is held back below the first screen and prints as it comes into view, its counts settling from the end side, with nothing snapping, and it prints once, in ${language.name}`, async ({
    page,
  }) => {
    await page.goto(addressIn(language), { waitUntil: 'networkidle' });
    await expectMotionAllowed(page, true);
    await expect(page.getByTestId('sheet')).toHaveAttribute('data-print', 'waiting');

    const frames = await film(
      page,
      lookAtThePrintedPieces,
      () => bringIntoView(page, 'sheet'),
      {
        forMs: forEveryPiece,
      },
    );

    const sheet = framesOf(frames, 'sheet').filter(({ state }) => state === 'printing');
    const [first] = sheet;
    const last = sheet.at(-1) ?? first;
    expect(first.covered / first.height, 'the sheet starts covered').toBeGreaterThan(0.9);
    expect(last.covered, 'the sheet ends whole').toBe(0);
    expect(last.top - first.top, 'the sheet slides 18 pixels down').toBeCloseTo(18, 0);
    expect(snapsOfThePrint('the sheet', sheet)).toEqual([]);

    const counts = frames.flatMap(({ at, drawn }) =>
      drawn.count === null || drawn.sheet?.state !== 'printing'
        ? []
        : [{ at, ...drawn.count }],
    );
    const [firstCount] = counts;
    const lastCount = counts.at(-1) ?? firstCount;
    expect(firstCount.opacity, 'the count starts unseen').toBeLessThan(0.1);
    expect(lastCount.opacity, 'the count ends settled').toBe(1);
    expect(
      (firstCount.left - lastCount.left) * fromTheEnd,
      'the count comes from the end side',
    ).toBeCloseTo(16, 0);
    expect(
      snapsOf(
        "the count's start",
        counts.map(({ at, left }) => ({ at, value: left })),
      ),
    ).toEqual([]);

    // Once printed, it stays printed: scrolled away and back to, it prints
    // and settles no more.
    const again = await film(
      page,
      lookAtThePrintedPieces,
      async () => {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForTimeout(500);
        await bringIntoView(page, 'sheet');
      },
      { forMs: 1500 },
    );
    expectStillAndWhole('the sheet', framesOf(again, 'sheet'));
    for (const { drawn } of again) expect(drawn.count?.opacity).toBe(1);
  });
}

test('the price slip on the plate feeds as a till does, in ten steps, while it slides into place, and its stamp lands once it has printed, with nothing snapping', async ({
  page,
}) => {
  await page.goto(homePage, { waitUntil: 'networkidle' });
  await expectMotionAllowed(page, true);
  await expect(page.getByTestId('price-slip')).toHaveAttribute('data-print', 'waiting');

  const frames = await film(
    page,
    lookAtThePrintedPieces,
    () => bringIntoView(page, 'price-slip'),
    {
      forMs: forEveryPiece,
    },
  );

  const printing = frames.filter(({ drawn }) => drawn.slip?.state === 'printing');
  const slip = framesOf(printing, 'slip');
  const [first] = slip;
  const last = slip.at(-1) ?? first;
  expect(first.covered / first.height, 'the slip starts covered').toBeGreaterThan(0.9);
  expect(last.covered, 'the slip ends whole').toBe(0);
  // It is uncovered a tenth at a time, as a till feeds paper.
  const steps = new Set(
    slip.map(({ covered, height }) => Math.round((covered / height) * 10)),
  );
  expect(steps.size, `the slip's steps, ${[...steps].join(', ')}`).toBeLessThanOrEqual(11);
  expect(steps.size).toBeGreaterThan(5);
  for (const { covered, height } of slip) {
    expect(
      Math.abs((covered / height) * 10 - Math.round((covered / height) * 10)),
    ).toBeLessThan(0.01);
  }
  expect(
    snapsOf(
      "the slip's top",
      slip.map(({ at, top }) => ({ at, value: top })),
    ),
  ).toEqual([]);

  // The stamp lands from 1.6 times its size once its paper has printed.
  const stamps = printing.flatMap(({ at, drawn }) =>
    drawn.stamp === null ? [] : [{ at, ...drawn.stamp }],
  );
  const [firstStamp] = stamps;
  const lastStamp = stamps.at(-1) ?? firstStamp;
  expect(firstStamp).toEqual({ at: firstStamp.at, scale: 1.6, opacity: 0 });
  expect(lastStamp).toEqual({ at: lastStamp.at, scale: 1, opacity: 1 });
  const printed = slip.find(({ covered }) => covered === 0)?.at ?? Infinity;
  const landing = stamps.find(({ scale }) => scale < 1.6)?.at ?? -Infinity;
  expect(landing, 'the stamp lands after the slip has printed').toBeGreaterThan(printed);
  expect([
    ...snapsOf(
      "the stamp's size",
      stamps.map(({ at, scale }) => ({ at, value: scale * 100 })),
    ),
    ...snapsOf(
      "the stamp's ink",
      stamps.map(({ at, opacity }) => ({ at, value: opacity * 100 })),
    ),
  ]).toEqual([]);
});

test('keyboard focus that enters the sheet before it has printed shows it whole at once, its counts settled', async ({
  page,
}) => {
  await page.goto(homePage, { waitUntil: 'networkidle' });
  await expect(page.getByTestId('sheet')).toHaveAttribute('data-print', 'waiting');

  await linkOf(page, 'cpu').focus();
  const atOnce = await page.evaluate(lookAtThePrintedPieces);
  expect(atOnce.sheet?.covered).toBe(0);
  // The focus brought the sheet into view, and its script has had time to
  // start the print it would have started there.
  await page.waitForTimeout(400);
  const after = await page.evaluate(lookAtThePrintedPieces);
  expect(after.sheet?.state).toBe('printing');
  expect(after.sheet?.covered).toBe(0);
  expect(after.count?.opacity).toBe(1);
});

test('a page come back to by back or forward is shown printed: the home page, a Category page and the not-found page print no more', async ({
  page,
}) => {
  await page.goto(homePage, { waitUntil: 'networkidle' });
  await bringIntoView(page, 'sheet');
  await expect
    .poll(async () => (await page.evaluate(lookAtThePrintedPieces)).sheet?.covered)
    .toBe(0);
  await linkOf(page, 'cpu').click();
  await expect(page).toHaveURL(addressIn(english, '/categories/cpu'));

  await page.goBack({ waitUntil: 'networkidle' });
  await expect(page).toHaveURL(homePage);
  const home = await film(
    page,
    lookAtThePrintedPieces,
    async () => {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await bringIntoView(page, 'sheet');
    },
    { forMs: 2000 },
  );
  expectStillAndWhole('the home page’s sheet', framesOf(home, 'sheet'));

  // A Category page, which the server draws, is marked as a return by the
  // line in its head before it is painted: here it is come back to by
  // forward.
  const categoryAgain = await filmFromTheFirstFrame(
    page,
    lookAtThePrintedPieces,
    async () => {
      await page.goForward();
    },
  );
  await expect(page).toHaveURL(addressIn(english, '/categories/cpu'));
  expectStillAndWhole('the Category page’s sheet', framesOf(categoryAgain, 'sheet'));

  // The not-found page of an unknown Category, which the browser draws by
  // script, marks a return itself: here it is come back to by back.
  await page.goto(anUnknownCategory, { waitUntil: 'networkidle' });
  await page.goto(homePage, { waitUntil: 'networkidle' });
  const notFoundAgain = await filmFromTheFirstFrame(
    page,
    lookAtThePrintedPieces,
    async () => {
      await page.goBack();
    },
  );
  await expect(page).toHaveURL(anUnknownCategory);
  expectStillAndWhole('the not-found page’s sheet', framesOf(notFoundAgain, 'sheet'));
});

test.describe('without script', () => {
  test.use({ javaScriptEnabled: false });

  test('nothing moves and nothing is held back: every piece arrives printed, as the server sent it', async ({
    page,
  }) => {
    await page.goto(homePage);
    expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(true);
    for (const piece of ['sheet', 'price-slip']) {
      await page.getByTestId(piece).scrollIntoViewIfNeeded();
      await expect(page.getByTestId(piece)).not.toHaveAttribute('data-print');
    }

    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    const { sheet, count, slip, stamp } = await page.evaluate(lookAtThePrintedPieces);
    expect(sheet?.covered).toBe(0);
    expect(slip?.covered).toBe(0);
    expect(count?.opacity).toBe(1);
    expect(stamp).toEqual({ scale: 1, opacity: 1 });
  });
});

// A press settles a choice of the frame's switches to 0.97 while it is held,
// and lets it come back from wherever it is when it is let go (DESIGN.md's
// The press). With reduced motion it does not scale.
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`a choice of the frame's switches settles while it is pressed and comes back when it is let go, with nothing snapping, ${reducedMotion === 'reduce' ? 'and with reduced motion does not move' : 'without reduced motion'}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto(homePage, { waitUntil: 'networkidle' });
    const dollars = choiceOf(page, 'USD');
    const box = await dollars.boundingBox();
    if (box === null) throw new Error('The choice of dollars is not on the page.');

    const frames = await film(
      page,
      () => {
        const choice = document.querySelector(
          '[data-testid="currency-switch"] button[value="USD"]',
        );
        const scale =
          choice === null ? Number.NaN : Number.parseFloat(getComputedStyle(choice).scale);
        return Number.isNaN(scale) ? 1 : scale;
      },
      async () => {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(900);
        // Let go elsewhere, so that the press chooses nothing.
        await page.mouse.move(box.x + box.width / 2, box.y + 400);
        await page.mouse.up();
      },
      { forMs: 1200 },
    );
    const scales = frames.map(({ at, drawn }) => ({ at, value: drawn * 1000 }));

    if (reducedMotion === 'reduce') {
      for (const { value } of scales) expect(value).toBe(1000);
      return;
    }
    expect(Math.min(...scales.map(({ value }) => value)), 'it settles to 0.97').toBeCloseTo(
      970,
      0,
    );
    expect(scales.at(-1)?.value, 'it comes back').toBe(1000);
    expect(snapsOf("the choice's size", scales)).toEqual([]);
  });
}
