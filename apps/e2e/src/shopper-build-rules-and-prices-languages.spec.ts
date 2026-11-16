import {
  type APIRequestContext,
  type Browser,
  expect,
  type Page,
  test,
} from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  type AnsweredBuild,
  buildPageIn,
  type BuildCategory,
  type BuildPart,
  lineOf,
  lowestAtOf,
  outcomesListed,
  partsLackedBy,
  partsNamedBy,
  pick,
  priceOf,
  quantityOf,
  rulesListed,
  rulesPassed,
  theBuildAsAnswered,
  theSlip,
  theTotal,
  vendorLineOf,
  vendorsListed,
} from './build-page';
import { createAMadeUpPart } from './catalog';
import { choose, type Currency, setThePlatformRate } from './currencies';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { shownPriceText } from './home-page';
import {
  expectNoSidewaysScroll,
  expectPageIn,
  languages,
  layoutOf,
  readInEveryLanguage,
} from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { film, snapsOf } from './motion-film';
import { addAnOffer } from './offers';
import { switchTheVendor } from './part-page';
import { createAMadeUpVendor, type MadeUpVendor } from './vendors';

const [kurdish, , english] = languages;
// The ticket's lines are checked in Kurdish and in English, right to left
// and left to right, in a window as wide as a narrow phone.
const kurdishAndEnglish = [kurdish, english] as const;

// The word unique to this run in its Parts' names.
const word = aWordUniqueToTheRun();

// The Platform Rate the run sets, behind every Converted Price it reads.
const rate = 1500;

// The run's made-up Parts, made through the API with the specifications the
// rules they meet need, so that no rule is left unchecked: a CPU of AM5
// taking DDR5; a motherboard of AM5 with four DDR5 slots, and one of AM4;
// a kit of two DDR5 modules, so that three of it are more sticks than the
// board has slots (rule 5); and a drive that one Vendor alone offers.
let cpu: BuildPart & { name: string };
let board: BuildPart & { name: string };
let am4Board: BuildPart & { name: string };
let kit: BuildPart;
let drive: BuildPart;

// The run's Vendors: Alpha and Bravo, which offer the CPU, the boards and
// the kit, the AM5 board in dollars alone, so that its price in dinars is
// converted; and the drive's one Vendor, which a line deactivates.
let alpha: MadeUpVendor;
let bravo: MadeUpVendor;
let drivesVendor: MadeUpVendor;

// Works with the API as the development Admin, who logs in through the
// dashboard, in a context of its own that runs script (browse ticket 10).
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
    [alpha, bravo, drivesVendor] = [
      await createAMadeUpVendor(request, authorization),
      await createAMadeUpVendor(request, authorization),
      await createAMadeUpVendor(request, authorization),
    ];
    const aPart = async (
      category: BuildCategory,
      what: string,
      specifications: Record<string, unknown>,
    ) => {
      const name = `Made-up test ${what} ${word}`;
      const { id } = await createAMadeUpPart(
        request,
        authorization,
        specifications,
        category,
        {
          name,
        },
      );
      return { id, category, name };
    };
    cpu = await aPart('cpu', 'CPU', {
      socket: 'AM5',
      specifications: { memory: { types: ['DDR5'] } },
    });
    board = await aPart('motherboard', 'AM5 motherboard', {
      socket: 'AM5',
      memory: { ram_type: 'DDR5', slots: 4, max: 128 },
    });
    am4Board = await aPart('motherboard', 'AM4 motherboard', {
      socket: 'AM4',
      memory: { ram_type: 'DDR5', slots: 4, max: 128 },
    });
    kit = await aPart('ram', 'RAM kit', {
      ram_type: 'DDR5',
      modules: { quantity: 2, capacity_gb: 16 },
    });
    drive = await aPart('storage', 'drive', {});

    const offer = (vendor: MadeUpVendor, part: BuildPart, details: object) =>
      addAnOffer(request, authorization, vendor.id, part.id, details);
    await offer(alpha, cpu, { iqdPrice: 300_000 });
    await offer(bravo, cpu, { iqdPrice: 320_000 });
    await offer(bravo, board, { usdPrice: '200.00' });
    await offer(alpha, am4Board, { iqdPrice: 150_000 });
    await offer(alpha, kit, { iqdPrice: 100_000 });
    await offer(bravo, kit, { iqdPrice: 90_000 });
    await offer(drivesVendor, drive, { iqdPrice: 50_000 });
  });
});

// The Build the price lines read: the CPU, the AM5 board and the kit twice,
// picked from the page's own browser.
async function aPricedBuild(page: Page): Promise<void> {
  for (const part of [cpu, board, kit, kit]) await pick(page, part);
}

const pricedBuild = () => [cpu.id, board.id, `${kit.id}:2`];

// Every price the page shows, compared with what the API answers in the
// same currency, never with a quoted translation: each Part's Lowest Price
// times its quantity and its Vendor, the total across Vendors, and each
// Vendor's total and the Parts it lacks, in the API's order (BLD-7, BLD-8).
async function expectThePricesAnswered(page: Page, answered: AnsweredBuild): Promise<void> {
  for (const part of answered.parts) {
    if (part.lowestPrice === null) {
      await expect(priceOf(page, part.id)).toHaveCount(0);
      continue;
    }
    await expect(priceOf(page, part.id)).toHaveText(
      shownPriceText(part.lowestPrice.timesQuantity),
    );
    await expect(lowestAtOf(page, part.id)).toHaveAttribute(
      'data-vendor',
      part.lowestPrice.vendor.id,
    );
  }
  if (answered.totalAcrossVendors === null) {
    await expect(theTotal(page)).toHaveCount(0);
  } else {
    await expect(theTotal(page)).toHaveText(shownPriceText(answered.totalAcrossVendors));
  }
  expect(await vendorsListed(page)).toEqual(answered.vendors.map(({ id }) => id));
  for (const vendor of answered.vendors) {
    await expect(vendorLineOf(page, vendor.id).getByTestId('vendor-total')).toHaveText(
      vendor.total === null ? '—' : shownPriceText(vendor.total),
    );
    expect(await partsLackedBy(page, vendor.id)).toEqual(vendor.partsLacked);
  }
}

test('in Kurdish and English, a CPU and a motherboard of different sockets make the page list a Compatibility Problem naming both, and a Build with no Problem lists none and counts its passes', async ({
  page,
}) => {
  for (const part of [cpu, am4Board]) await pick(page, part);
  const mismatched = await theBuildAsAnswered(page.request, [cpu.id, am4Board.id]);
  const problems = mismatched.outcomes.filter(({ outcome }) => outcome === 'problem');
  expect(problems.map(({ rule }) => rule)).toContain(1);

  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}, the sockets' Problem`, async () => {
      await page.goto(buildPageIn(language));
      await expectPageIn(page, language);

      expect(await rulesListed(page, 'problem')).toEqual(problems.map(({ rule }) => rule));
      expect(await partsNamedBy(page, 1, 'problem')).toEqual([cpu.id, am4Board.id]);
      // Each Part is named in English, left to right and kept apart from the
      // page's own words (LANG-3), and the sentence names none of them.
      const outcome = outcomesListed(page, 'problem').first();
      for (const part of [cpu, am4Board]) {
        const name = outcome.locator(
          `[data-testid="named-part"][data-part="${part.id}"] bdi`,
        );
        await expect(name).toHaveText(part.name);
        expect(await layoutOf(name)).toEqual({ direction: 'ltr', keptApart: true });
        await expect(outcome.getByTestId('outcome-words')).not.toContainText(part.name);
      }
      await expect(outcome.getByTestId('outcome-words')).not.toHaveText('');
      // The group counts its Problems; on a phone the slip carries its price
      // lines alone and leaves the rules' counts to the rules' sheet.
      await expect(page.getByTestId('outcomes-problem').locator('h3')).toContainText(
        String(problems.length),
      );
      await expect(theSlip(page).getByTestId('slip-complete')).toBeVisible();
      await expect(theSlip(page).getByTestId('slip-problems')).toBeHidden();
      // The page never stops the Shopper keeping the Build (BLD-4): it holds
      // both Parts, each with its Remove and nothing else in the way.
      await expect(lineOf(page, cpu.id)).toBeVisible();
      await expect(lineOf(page, am4Board.id)).toBeVisible();
      await expectNoSidewaysScroll(page);
    });
  }

  // The AM5 board in the AM4 board's place.
  await pick(page, board);
  const matched = await theBuildAsAnswered(page.request, [cpu.id, board.id]);
  const passes = matched.outcomes.filter(({ outcome }) => outcome === 'passes').length;
  expect(matched.outcomes.every(({ outcome }) => outcome === 'passes')).toBe(true);

  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}, a Build with no Problem`, async () => {
      await page.goto(buildPageIn(language));
      await expectPageIn(page, language);

      for (const outcome of ['problem', 'warning', 'unchecked'] as const) {
        await expect(outcomesListed(page, outcome)).toHaveCount(0);
      }
      await expect(page.getByTestId('rules-sentence')).not.toHaveText('');
      await expect(rulesPassed(page)).toHaveText(String(passes));
      await expect(theSlip(page).getByTestId('slip-passed')).toBeHidden();
    });
  }

  await test.step("at a desk, the slip beside the sheet carries the rules' counts too", async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(buildPageIn(english));
    await expect(theSlip(page).getByTestId('slip-problems')).toContainText('0');
    await expect(theSlip(page).getByTestId('slip-passed')).toContainText(String(passes));
  });
});

test("in Kurdish and English, the page shows each Part's Lowest Price and Vendor and the total, and each Vendor's total with the Parts it lacks, in the API's order", async ({
  page,
}) => {
  await aPricedBuild(page);
  const answered = await theBuildAsAnswered(page.request, pricedBuild());
  expect(answered.vendors.length).toBeGreaterThan(1);
  expect(answered.vendors.some(({ partsLacked }) => partsLacked.length > 0)).toBe(true);

  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(buildPageIn(language));
      await expectPageIn(page, language);
      await expectThePricesAnswered(page, answered);
      await expectNoSidewaysScroll(page);
    });
  }
});

test('a total that holds a Converted Price shows "≈", and switching the currency changes every price', async ({
  page,
}) => {
  await aPricedBuild(page);
  await page.goto(buildPageIn(english));

  for (const currency of ['IQD', 'USD'] as const satisfies readonly Currency[]) {
    await test.step(`in ${currency}`, async () => {
      if (currency !== 'IQD') await choose(page, currency);
      const answered = await theBuildAsAnswered(page.request, pricedBuild(), currency);
      // In dinars the AM5 board, quoted in dollars alone, is converted; in
      // dollars the CPU and the kit, quoted in dinars, are.
      expect(answered.totalAcrossVendors?.converted).toBe(true);
      await expect(theTotal(page)).toHaveText(/^≈ /);
      await expect(theTotal(page)).toHaveAttribute('data-currency', currency);
      await expectThePricesAnswered(page, answered);
      // What "≈" means is said under the sheet.
      await expect(page.getByTestId('what-approximately-means').first()).toBeVisible();
    });
  }
});

test("changing a kit's quantity changes the totals", async ({ page }) => {
  await aPricedBuild(page);
  await page.goto(buildPageIn(english));
  const before = await theBuildAsAnswered(page.request, pricedBuild());
  await expectThePricesAnswered(page, before);

  const sent = page.waitForResponse((response) =>
    response.url().endsWith('/build/quantity'),
  );
  await quantityOf(page, kit.id).getByTestId('one-more').click();
  await sent;

  const after = await theBuildAsAnswered(page.request, [cpu.id, board.id, `${kit.id}:3`]);
  expect(after.totalAcrossVendors).not.toEqual(before.totalAcrossVendors);
  await expect(theTotal(page)).toHaveText(shownPriceText(after.totalAcrossVendors!));
  await expectThePricesAnswered(page, after);
});

test("deactivating the only Vendor of a Build's Part shows it as unstocked and leaves it out of the totals", async ({
  page,
  browser,
}) => {
  for (const part of [cpu, drive]) await pick(page, part);
  await page.goto(buildPageIn(english));
  const stocked = await theBuildAsAnswered(page.request, [cpu.id, `${drive.id}:1`]);
  await expect(priceOf(page, drive.id)).toBeVisible();
  await expectThePricesAnswered(page, stocked);

  await asTheAdmin(browser, (request, authorization) =>
    switchTheVendor(request, authorization, drivesVendor.id, 'deactivate'),
  );
  const unstocked = await theBuildAsAnswered(page.request, [cpu.id, `${drive.id}:1`]);
  expect(unstocked.parts.find(({ id }) => id === drive.id)?.unstocked).toBe(true);
  expect(unstocked.totalAcrossVendors).not.toEqual(stocked.totalAcrossVendors);

  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(buildPageIn(language));
      await expectPageIn(page, language);
      // Said in words, in the price's place and on its second line, never by
      // a colour alone; the Part keeps its place and its Remove.
      await expect(lineOf(page, drive.id).getByTestId('no-vendor-has-it')).not.toHaveText(
        '',
      );
      await expect(lineOf(page, drive.id).getByTestId('unstocked')).not.toHaveText('');
      await expect(lineOf(page, drive.id).getByTestId('remove')).toBeVisible();
      await expect(theSlip(page).getByTestId('slip-leaves-out')).not.toHaveText('');
      await expect(vendorLineOf(page, drivesVendor.id)).toHaveCount(0);
      await expect(page.getByTestId('unstocked-in-no-list')).not.toHaveText('');
      await expectThePricesAnswered(page, unstocked);
    });
  }
});

// LANG-2 and LANG-5 on the Build page's outcomes and prices, in all three
// languages: right to left in Kurdish and Arabic, every number in Western
// digits, nothing scrolling sideways, and every price the same in each.
test('the Build page with its outcomes and prices is right to left in Kurdish and Arabic, with every price in Western digits', async ({
  page,
}) => {
  for (const part of [cpu, am4Board, kit, kit]) await pick(page, part);

  const read = await readInEveryLanguage(page, '/build', async () => {
    await expect(outcomesListed(page, 'problem').first()).toBeVisible();
    return {
      total: await theTotal(page).textContent(),
      prices: await page.getByTestId('part-price').allTextContents(),
      vendors: await vendorsListed(page),
      totalLayout: await layoutOf(theTotal(page)),
    };
  });
  for (const each of read.values()) {
    expect(each).toEqual(read.get(english));
    expect(each.totalLayout).toEqual({ direction: 'ltr', keptApart: true });
  }
});

test('the Build page with its outcomes and both price views passes WCAG 2.2 level AA in the light and the dark scheme', async ({
  page,
}) => {
  for (const part of [cpu, am4Board, kit, kit, drive]) await pick(page, part);

  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(buildPageIn(language));
      await expect(outcomesListed(page, 'problem').first()).toBeAttached();
      await expect(vendorLineOf(page, alpha.id)).toBeAttached();
      await expectAccessible(page);
    });
  }
});

// Motion 11 for what the rules found and the totals: with script, a change on
// the Build page applies in place, and what it brings prints in, here a
// Compatibility Problem as a third of a kit takes the Build past the
// motherboard's slots, while each total and count it alters settles again,
// and nothing below snaps. With reduced motion nothing prints or settles, and
// the spaces still move (the No Snap Rule).
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`one more of a kit in place brings a Problem and changes the totals, with nothing below snapping, ${reducedMotion === 'reduce' ? 'and with reduced motion prints and settles nothing' : 'the Problem printing in and the totals settling again'}`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await aPricedBuild(page);
    await page.emulateMedia({ reducedMotion });
    await page.goto(buildPageIn(english));
    await page.evaluate(() => document.fonts.ready);
    // Every sheet below the first screen printed, then back to the kit.
    await page.locator('#vendors').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await quantityOf(page, kit.id).scrollIntoViewIfNeeded();
    await expect(outcomesListed(page, 'problem')).toHaveCount(0);

    const look = () => {
      const top = (selector: string) => {
        const element = document.querySelector(selector);
        return element === null
          ? null
          : element.getBoundingClientRect().top + window.scrollY;
      };
      const running = (name: string, selector: string) =>
        document
          .getAnimations()
          .some(
            (animation) =>
              (animation as CSSAnimation).animationName === name &&
              animation.playState === 'running' &&
              (
                (animation.effect as KeyframeEffect | null)?.target as Element | null
              )?.matches(selector) === true,
          );
      return {
        passedLine: top('[data-testid="rules-passed"]'),
        vendors: top('#vendors'),
        printing: running(
          'line-prints',
          '[data-line^="group-problem"], [data-line^="outcome-"]',
        ),
        settling: running('settle', '[data-figure="total"], [data-figure="problems"]'),
      };
    };

    const sent = page.waitForResponse((response) =>
      response.url().endsWith('/build/quantity'),
    );
    const frames = await film(
      page,
      look,
      () => quantityOf(page, kit.id).getByTestId('one-more').click(),
      { forMs: 5000 },
    );
    await sent;
    await expect(outcomesListed(page, 'problem')).toHaveCount(1);

    const along = (value: 'passedLine' | 'vendors') =>
      frames.map(({ at, drawn }) => ({ at, value: drawn[value] }));
    expect([
      ...snapsOf('the line of the rules passed', along('passedLine')),
      ...snapsOf("the Vendors' sheet", along('vendors')),
    ]).toEqual([]);
    expect(
      frames.some(({ drawn }) => drawn.printing),
      reducedMotion === 'reduce'
        ? 'with reduced motion nothing prints in'
        : 'the Problem prints in',
    ).toBe(reducedMotion !== 'reduce');
    expect(
      frames.some(({ drawn }) => drawn.settling),
      reducedMotion === 'reduce'
        ? 'with reduced motion no total settles'
        : 'the total and the count settle again',
    ).toBe(reducedMotion !== 'reduce');
  });
}
