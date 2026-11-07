import { expect, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  aPageOfTheList,
  chooseInTheFilters,
  choicesOnTheSheet,
  expectTheAddressToAsk,
  expectTheList,
  sendTheFilters,
  showParts,
  theChoiceOf,
  theChoiceOnOf,
  theFiltersBar,
  theFiltersFold,
  thePriceField,
  theQueryOf,
  unfoldTheFilters,
  whatThePriceFieldSays,
  whatTheSheetSays,
} from './category-page';
import { createAMadeUpPart, type MadeUpPart } from './catalog';
import { choose, expectPricesShownIn, setThePlatformRate } from './currencies';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { theNumber } from './home-page';
import { addressIn, expectPageIn, languages, linkTo } from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { film, snapsOf } from './motion-film';
import { addAnOffer } from './offers';
import { createAMadeUpVendor } from './vendors';

const [kurdish, , english] = languages;
// The ticket's lines are checked in Kurdish and in English, right to left
// and left to right, in a window as wide as a narrow phone.
const kurdishAndEnglish = [kurdish, english] as const;

// The word unique to this run that finds its own CPUs on the development
// database's long list of CPUs, which earlier runs fill.
const word = aWordUniqueToTheRun();
const cpus = '/categories/cpu';
const ofTheRun = `${cpus}?search=${word}`;

// The Platform Rate the run sets, behind every price in dollars it reads.
const rate = 1500;

// The two made-up manufacturers of the run's CPUs. Their names are the same
// in every run, so that the manufacturers the filters offer do not grow with
// each run.
const ours = 'Made-up Test Parts';
const rivals = 'Made-up Rival Parts';

// The run's five CPUs, each with the specifications the filters choose
// among, and an Offer in dinars from one made-up Vendor. Listed by Lowest
// Price: Charlie (AM4, 8 cores, 180,000 IQD), Alpha (AM5, 8 cores, 250,000),
// Bravo (AM5, 16 cores, 400,000), Delta (LGA 1700, its cores not known,
// 520,000), and last Echo (AM5, 8 cores), which every Vendor has out of
// stock, so it has no Lowest Price.
let alpha: MadeUpPart;
let bravo: MadeUpPart;
let charlie: MadeUpPart;
let delta: MadeUpPart;
let echo: MadeUpPart;

// The run's rows are made as the development Admin, who logs in through the
// dashboard, so the context they are made in runs script, whatever line a
// worker runs first.
test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ javaScriptEnabled: true });
  try {
    const { request } = context;
    const authorization = await authorizationOfTheDevelopmentAdmin(await context.newPage());
    await setThePlatformRate(request, authorization, rate);
    const vendor = await createAMadeUpVendor(request, authorization);
    const cpu = (letter: string, manufacturer: string, specifications: object) =>
      createAMadeUpPart(request, authorization, { ...specifications }, 'cpu', {
        name: `Made-up test CPU ${word} ${letter}`,
        manufacturer,
      });

    alpha = await cpu('Alpha', ours, { socket: 'AM5', cores: { total: 8 } });
    bravo = await cpu('Bravo', ours, { socket: 'AM5', cores: { total: 16 } });
    charlie = await cpu('Charlie', rivals, { socket: 'AM4', cores: { total: 8 } });
    delta = await cpu('Delta', rivals, { socket: 'LGA 1700' });
    echo = await cpu('Echo', ours, { socket: 'AM5', cores: { total: 8 } });
    const offer = (part: MadeUpPart, details: object) =>
      addAnOffer(request, authorization, vendor.id, part.id, details);
    await offer(alpha, { iqdPrice: 250_000 });
    await offer(bravo, { iqdPrice: 400_000 });
    await offer(charlie, { iqdPrice: 180_000 });
    await offer(delta, { iqdPrice: 520_000 });
    await offer(echo, { iqdPrice: 300_000, inStock: false });
  } finally {
    await context.close();
  }
});

// The names of the run's CPUs, in the order the list shows them.
const namesOf = (...parts: MadeUpPart[]) => parts.map(({ name }) => name);
const all = () => namesOf(charlie, alpha, bravo, delta, echo);

for (const javaScriptEnabled of [true, false]) {
  test.describe(javaScriptEnabled ? 'with scripts' : 'with scripts switched off', () => {
    test.use({ javaScriptEnabled });

    test('in Kurdish and English, a filter narrows the list and the address holds it, two values of one filter find either, two filters must both match, and a reload keeps them', async ({
      page,
    }) => {
      for (const language of kurdishAndEnglish) {
        await test.step(`in ${language.name}`, async () => {
          await page.goto(addressIn(language, ofTheRun));
          expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(
            !javaScriptEnabled,
          );
          await expectTheList(page, all());

          await chooseInTheFilters(page, [['socket', 'AM5']]);
          await expectTheList(page, namesOf(alpha, bravo, echo));
          await expectTheAddressToAsk(page, language, cpus, [
            ['search', word],
            ['socket', 'AM5'],
          ]);

          await chooseInTheFilters(page, [['socket', 'AM4']]);
          await expectTheList(page, namesOf(charlie, alpha, bravo, echo));

          // A CPU whose cores are not known matches no number of cores.
          await chooseInTheFilters(page, [['cores', '8']]);
          await expectTheList(page, namesOf(charlie, alpha, echo));
          await expectTheAddressToAsk(page, language, cpus, [
            ['search', word],
            ['socket', 'AM4'],
            ['socket', 'AM5'],
            ['cores', '8'],
          ]);

          await page.reload();
          await expectTheList(page, namesOf(charlie, alpha, echo));
          for (const [parameter, value] of [
            ['socket', 'AM4'],
            ['socket', 'AM5'],
            ['cores', '8'],
          ]) {
            await expect(theChoiceOf(page, parameter, value)).toBeChecked();
          }
          await expect(theChoiceOf(page, 'socket', 'LGA 1700')).not.toBeChecked();
          // The bar says how many choices are on, in a figure, and to a screen
          // reader in words.
          await expect(theFiltersBar(page).getByTestId('choices-on-count')).toHaveText('3');
          await expect(theFiltersBar(page)).toHaveAccessibleName(theNumber(3));
        });
      }
    });

    test('in Kurdish and English, the choices that are on are shown, and clearing one, and clearing all, restore the list', async ({
      page,
      request,
    }) => {
      const firstPage = await aPageOfTheList(request, { category: 'cpu', currency: 'IQD' });

      for (const language of kurdishAndEnglish) {
        await test.step(`in ${language.name}`, async () => {
          await page.goto(
            addressIn(
              language,
              `${ofTheRun}&manufacturer=${encodeURIComponent(ours)}&socket=AM5&cores=8`,
            ),
          );
          await expectTheList(page, namesOf(alpha, echo));
          expect(
            await choicesOnTheSheet(page).evaluateAll((chips) =>
              chips.map((chip) => chip.getAttribute('data-choice')),
            ),
          ).toEqual(['search', `manufacturer=${ours}`, 'socket=AM5', 'cores=8']);

          await theChoiceOnOf(page, 'cores=8').click();
          await expectTheAddressToAsk(page, language, cpus, [
            ['search', word],
            ['manufacturer', ours],
            ['socket', 'AM5'],
          ]);
          await expectTheList(page, namesOf(alpha, bravo, echo));
          await expect(theChoiceOf(page, 'cores', '8')).not.toBeChecked();

          await theChoiceOnOf(page, `manufacturer=${ours}`).click();
          await expectTheAddressToAsk(page, language, cpus, [
            ['search', word],
            ['socket', 'AM5'],
          ]);
          await expectTheList(page, namesOf(alpha, bravo, echo));

          await page.getByTestId('choices-on').getByTestId('clear-all').click();
          await expectTheAddressToAsk(page, language, cpus, []);
          await expectTheList(
            page,
            firstPage.content.map(({ name }) => name),
          );
          await expect(theChoiceOf(page, 'socket', 'AM5')).not.toBeChecked();
          await expect(choicesOnTheSheet(page)).toHaveCount(0);
        });
      }
    });

    test('in Kurdish and English, a price range typed in Arabic-Indic digits with a separator narrows the list by Lowest Price, both ends included, leaving out a Part with none', async ({
      page,
    }) => {
      for (const language of kurdishAndEnglish) {
        await test.step(`in ${language.name}`, async () => {
          await page.goto(addressIn(language, ofTheRun));
          await unfoldTheFilters(page);
          await thePriceField(page, 'lowest').fill('٢٥٠٬٠٠٠');
          await thePriceField(page, 'highest').fill('٤٠٠٬٠٠٠');
          await thePriceField(page, 'highest').press('Enter');
          await page.waitForURL((url) =>
            theQueryOf(url.href).some(([name]) => name === 'highest'),
          );

          await expectTheList(page, namesOf(alpha, bravo));
          await expect(theChoiceOnOf(page, 'price')).toContainText(theNumber(250_000));
          await expect(theChoiceOnOf(page, 'price')).toContainText(theNumber(400_000));
          for (const end of ['lowest', 'highest'] as const) {
            await expect(whatThePriceFieldSays(page, end)).toBeEmpty();
          }

          await theChoiceOnOf(page, 'price').click();
          await expectTheAddressToAsk(page, language, cpus, [['search', word]]);
          await expectTheList(page, all());
        });
      }
    });

    test('in Kurdish and English, a price that is not a whole number, or a lowest above the highest, is not used, and the form says why beside its field', async ({
      page,
    }) => {
      const said = new Map<string, string>();
      for (const language of kurdishAndEnglish) {
        await test.step(`in ${language.name}`, async () => {
          await page.goto(addressIn(language, ofTheRun));
          await unfoldTheFilters(page);
          await thePriceField(page, 'lowest').fill('2.5');
          await sendTheFilters(page);

          await expectTheList(page, all());
          await expect(choicesOnTheSheet(page)).toHaveCount(1);
          await unfoldTheFilters(page);
          await expect(thePriceField(page, 'lowest')).toHaveValue('2.5');
          await expect(thePriceField(page, 'lowest')).toHaveAttribute(
            'aria-invalid',
            'true',
          );
          await expect(whatThePriceFieldSays(page, 'lowest')).not.toBeEmpty();
          const notWhole =
            (await whatThePriceFieldSays(page, 'lowest').textContent()) ?? '';
          await expect(thePriceField(page, 'lowest')).toHaveAccessibleDescription(notWhole);

          await thePriceField(page, 'lowest').fill('500000');
          await thePriceField(page, 'highest').fill('200000');
          await sendTheFilters(page);

          // The highest is used alone: Charlie, at 180,000 IQD.
          await expectTheList(page, namesOf(charlie));
          await unfoldTheFilters(page);
          await expect(thePriceField(page, 'lowest')).toHaveAttribute(
            'aria-invalid',
            'true',
          );
          await expect(whatThePriceFieldSays(page, 'highest')).toBeEmpty();
          const above = (await whatThePriceFieldSays(page, 'lowest').textContent()) ?? '';
          expect(above).not.toBe(notWhole);
          said.set(language.tag, above);
        });
      }
      expect(said.get(kurdish.tag)).not.toBe(said.get(english.tag));
    });
  });
}

// With script, Show Parts folds the tag at once and brings the head of the
// list into view, the focus with it (DESIGN.md's The filters with a thumb).
// The page is looked at as a browser without scroll anchoring shows it, as
// Safari on a phone does, so that a list's place measured while the tag still
// folds is seen to miss the list's head; Chrome's anchoring would hide it.
test('in Kurdish and English, with script, Show Parts folds the filters and brings the head of the list into view, the focus with it', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, ofTheRun));
      await chooseInTheFilters(page, [['socket', 'AM5']]);
      await expectTheList(page, namesOf(alpha, bravo, echo));
      await page.addStyleTag({ content: '* { overflow-anchor: none }' });
      await showParts(page).scrollIntoViewIfNeeded();
      await showParts(page).click();

      await expect(theFiltersFold(page)).toHaveJSProperty('open', false);
      const title = page.getByRole('main').getByRole('heading', { level: 1 });
      await expect(title).toBeFocused();
      await expect(title).toBeInViewport();
      await expectTheAddressToAsk(page, language, cpus, [
        ['search', word],
        ['socket', 'AM5'],
      ]);
    });
  }
});

test('in Kurdish and English, switching the currency drops the price range and keeps the filters and the search', async ({
  page,
}) => {
  // In dinars, from Kurdish, to dollars.
  const inDinars = `${ofTheRun}&socket=AM5&lowest=200000&highest=450000`;
  await page.goto(addressIn(kurdish, inDinars));
  await expectTheList(page, namesOf(alpha, bravo));
  await choose(page, 'USD', addressIn(kurdish, `${ofTheRun}&socket=AM5`));
  await expectPricesShownIn(page, 'USD');
  await expectTheList(page, namesOf(alpha, bravo, echo));
  await expect(theChoiceOf(page, 'socket', 'AM5')).toBeChecked();
  for (const end of ['lowest', 'highest'] as const) {
    await expect(thePriceField(page, end)).toHaveValue('');
  }

  // In dollars, from English, back to dinars: 250,000 and 400,000 IQD are
  // about 167 and 267 dollars at the run's rate.
  const inDollars = `${ofTheRun}&socket=AM5&lowest=150&highest=270`;
  await page.goto(addressIn(english, inDollars));
  await expectTheList(page, namesOf(alpha, bravo));
  await choose(page, 'IQD', addressIn(english, `${ofTheRun}&socket=AM5`));
  await expectPricesShownIn(page, 'IQD');
  await expectTheList(page, namesOf(alpha, bravo, echo));
  await expect(theChoiceOf(page, 'socket', 'AM5')).toBeChecked();
});

test('switching the language keeps the search, the filters and the price range, between Kurdish and English', async ({
  page,
}) => {
  const address = `${ofTheRun}&socket=AM5&cores=8&lowest=200000&highest=450000`;
  const expectAllKept = async () => {
    await expectTheList(page, namesOf(alpha));
    await expect(theChoiceOf(page, 'socket', 'AM5')).toBeChecked();
    await expect(theChoiceOf(page, 'cores', '8')).toBeChecked();
    await unfoldTheFilters(page);
    await expect(thePriceField(page, 'lowest')).toHaveValue('200,000');
    await expect(thePriceField(page, 'highest')).toHaveValue('450,000');
  };

  await page.goto(addressIn(kurdish, address));
  await expectAllKept();
  await linkTo(page, english).click();
  await expect(page).toHaveURL(addressIn(english, address));
  await expectPageIn(page, english);
  await expectAllKept();
  await linkTo(page, kurdish).click();
  await expect(page).toHaveURL(addressIn(kurdish, address));
  await expectAllKept();
});

test('in Kurdish and English, an address with an unknown filter and an unknown value opens, with both dropped', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      // A socket that is none, a number of cores no CPU has, and filters of
      // other Categories.
      await page.goto(
        addressIn(
          language,
          `${ofTheRun}&socket=AM5&socket=Moon&cores=99&chipset=RTX+4070&waterCooled=true`,
        ),
      );
      await expect(whatTheSheetSays(page)).toHaveAttribute('data-state', 'listed');
      await expectTheList(page, namesOf(alpha, bravo, echo));
      expect(
        await choicesOnTheSheet(page).evaluateAll((chips) =>
          chips.map((chip) => chip.getAttribute('data-choice')),
        ),
      ).toEqual(['search', 'socket=AM5']);
      await expect(theChoiceOf(page, 'socket', 'AM5')).toBeChecked();
      // No link the page writes holds what was dropped.
      const links = await page
        .getByRole('main')
        .locator('a[href]')
        .evaluateAll((anchors) =>
          anchors.map((anchor) => anchor.getAttribute('href') ?? ''),
        );
      for (const dropped of ['Moon', 'cores=', 'chipset', 'waterCooled']) {
        expect(links.filter((href) => href.includes(dropped))).toEqual([]);
      }
    });
  }
});

test('in Kurdish and English, a Category page meets the automated part of WCAG 2.2 level AA in light and in dark, with its filters unfolded and on, and with filters that empty the list', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(
        addressIn(language, `${ofTheRun}&socket=AM5&lowest=2.5&highest=450000`),
      );
      await unfoldTheFilters(page);
      await expect(whatThePriceFieldSays(page, 'lowest')).not.toBeEmpty();
      await expectAccessible(page);

      await page.goto(addressIn(language, `${ofTheRun}&socket=LGA+1700&cores=8`));
      await expect(whatTheSheetSays(page)).toHaveAttribute('data-state', 'no-match');
      await expectAccessible(page);
    });
  }
});

test('in Kurdish and English, filters that find nothing say so, naming the search and the filters, and offer to clear them all', async ({
  page,
}) => {
  const sentences = new Map<string, string>();
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, `${ofTheRun}&socket=LGA+1700&cores=8`));
      await expect(whatTheSheetSays(page)).toHaveAttribute('data-state', 'no-match');
      await expectTheList(page, []);
      expect(
        await choicesOnTheSheet(page).evaluateAll((chips) =>
          chips.map((chip) => chip.getAttribute('data-choice')),
        ),
      ).toEqual(['search', 'socket=LGA 1700', 'cores=8']);
      sentences.set(language.tag, await whatTheSheetSays(page).innerText());

      await page.getByRole('main').getByTestId('clear-all').click();
      await expectTheAddressToAsk(page, language, cpus, []);
      await expect(whatTheSheetSays(page)).toHaveAttribute('data-state', 'listed');
    });
  }
  expect(sentences.get(kurdish.tag)).not.toBe(sentences.get(english.tag));
});

// The filters unfold (DESIGN.md's Motion 10): on a phone the swing tag's
// space opens over 250 ms as its contents fade in, and folds in 150 ms, so
// that the list below moves down rather than jumps; with reduced motion it
// opens and folds at once. Filmed by where the sheet below it is drawn, with
// every animation slowed four times, and judged by `snapsOf`.
interface TheFold {
  open: boolean;
  sheetTop: number | null;
}

function lookAtTheFold(): TheFold {
  const fold = document.querySelector<HTMLDetailsElement>('[data-testid="filters-fold"]');
  const sheet = document.querySelector('[data-testid="sheet"]');
  return {
    open: fold?.open ?? false,
    sheetTop: sheet === null ? null : sheet.getBoundingClientRect().top + scrollY,
  };
}

async function filmTheFold(page: Page): Promise<{ at: number; value: number | null }[]> {
  const frames = await film(page, lookAtTheFold, () => theFiltersBar(page).click(), {
    forMs: 1600,
  });
  return frames.map(({ at, drawn }) => ({ at, value: drawn.sheetTop }));
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`in Kurdish and English, the filters unfold and fold on a phone, the list below moving down and back ${reducedMotion === 'reduce' ? 'at once, with reduced motion' : 'with nothing snapping'}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}`, async () => {
        await page.goto(addressIn(language, ofTheRun), { waitUntil: 'networkidle' });
        // The sheet has printed, and the page has settled.
        await page.waitForTimeout(1500);
        await expect(theFiltersFold(page)).toHaveJSProperty('open', false);

        const unfolding = await filmTheFold(page);
        await expect(theFiltersFold(page)).toHaveJSProperty('open', true);
        const folding = await filmTheFold(page);
        await expect(theFiltersFold(page)).toHaveJSProperty('open', false);

        for (const [frames, what] of [
          [unfolding, 'unfolding'],
          [folding, 'folding'],
        ] as const) {
          const tops = frames.map(({ value }) => value ?? 0);
          const moved = Math.abs((tops.at(-1) ?? 0) - (tops[0] ?? 0));
          expect(moved, `the sheet moves as the filters are ${what}`).toBeGreaterThan(100);
          if (reducedMotion === 'reduce') {
            const between = tops.filter(
              (top) =>
                Math.abs(top - tops[0]) > 0.5 && Math.abs(top - (tops.at(-1) ?? 0)) > 0.5,
            );
            expect(between, `the filters are ${what} at once`).toEqual([]);
          } else {
            expect(
              frames.filter(({ value }) => value !== tops[0] && value !== tops.at(-1))
                .length,
              `the filters are ${what} over several frames`,
            ).toBeGreaterThan(3);
            expect(snapsOf(`the sheet, while the filters are ${what}`, frames)).toEqual([]);
          }
        }
      });
    }
  });
}
