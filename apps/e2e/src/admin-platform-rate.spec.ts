import {
  type APIRequestContext,
  expect,
  type Locator,
  type Page,
  test,
} from '@playwright/test';

import { expectAccessible } from './accessibility';
import { openTheSection } from './admin-vendors';
import { catalogHeading } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { expectTheEmptyState } from './empty-state';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import { theMenuSheet } from './menu-sheet';
import { film, snapsOf } from './motion-film';
import { apiUrl, dashboardUrl } from './platform';

// The Admin sets the Platform Rate from a phone, on the Admin console's
// Platform Rate screen (PRC-1, LANG-8). The development database is shared
// and keeps what earlier runs left, so each test sets a rate of its own and
// reads only that; a screen with no Platform Rate is given to the page by
// the test, as the API answers it until the first rate is set.
test.use({ viewport: narrowWindow });

const platformRateUrl = `${dashboardUrl}/platform-rate`;
const rateEndpoint = `${apiUrl}/v1/platform-rate`;

function heading(page: Page): Locator {
  return page.getByRole('heading', { level: 1, name: 'Platform Rate' });
}

// The screen's one leading plate, as it is drawn, and the words a reader is
// read in its place; and the day beside it.
function thePlate(page: Page): Locator {
  return page.getByTestId('platform-rate-drawn');
}

function thePlatesWords(page: Page): Locator {
  return page.getByTestId('platform-rate-plate').getByTestId('platform-rate-words');
}

function theDaySet(page: Page): Locator {
  return page.getByTestId('platform-rate-set-on');
}

function theField(page: Page): Locator {
  return page.getByLabel('New rate', { exact: true });
}

function save(page: Page): Locator {
  return page.getByRole('button', { name: 'Save', exact: true });
}

// A rate of the test's own, in the API's limits, with as many digits as it
// is asked for, and never the one given, so that the plate has to change.
function aRateOfOurOwn(digits: 3 | 4, not?: number): number {
  const [lowest, highest] = digits === 3 ? [500, 999] : [1000, 4999];
  for (;;) {
    const rate = lowest + Math.floor(Math.random() * (highest - lowest + 1));
    if (rate !== not) return rate;
  }
}

// A rate as the dashboard writes it, in Western digits grouped in thousands.
function written(rate: number): string {
  return rate.toLocaleString('en-US');
}

// Today, as the screen writes the day a rate was set, in the page's own
// time zone.
async function today(page: Page): Promise<string> {
  return page.evaluate(() =>
    new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', numberingSystem: 'latn' }).format(
      new Date(),
    ),
  );
}

// Sets the Platform Rate through the API as the Admin, as another screen or
// an earlier run would have.
async function setTheRate(
  request: APIRequestContext,
  authorization: string,
  iqdPerUsd: number,
): Promise<void> {
  const response = await request.put(rateEndpoint, {
    headers: { Authorization: authorization },
    data: { iqdPerUsd },
  });
  expect(response.status()).toBe(200);
}

// Answers the page's every read of the rate as the API does before the
// first rate is set. A save still goes to the API.
async function answerNoRate(page: Page): Promise<void> {
  await page.route(rateEndpoint, (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ json: { current: null } })
      : route.fallback(),
  );
}

// Marks the page, so that a test can tell that it was not loaded again.
async function markThePage(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { notReloaded: boolean }).notReloaded = true;
  });
}

async function expectNotReloaded(page: Page): Promise<void> {
  expect(
    await page.evaluate(() => (window as unknown as { notReloaded?: boolean }).notReloaded),
    'the page was not loaded again',
  ).toBe(true);
}

let authorization: string;

test.beforeEach(async ({ page }) => {
  authorization = await authorizationOfTheDevelopmentAdmin(page);
  await expect(catalogHeading(page)).toBeVisible();
});

test('the Admin reaches the Platform Rate from the menu sheet, after the Expiring Offers', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Sections' }).click();
  await expect(
    theMenuSheet(page).getByRole('navigation', { name: 'Sections' }).getByRole('link'),
  ).toHaveText([
    'Catalog',
    'Vendors',
    'Missing specifications',
    'Expiring Offers',
    'Platform Rate',
  ]);
  await page.keyboard.press('Escape');

  await openTheSection(page, 'Platform Rate');

  await expect(heading(page)).toBeVisible();
  await expect(page).toHaveURL(platformRateUrl);
  await expect(theField(page)).toBeVisible();
  await expect(save(page)).toBeVisible();
});

test('the Admin sets a rate, and the plate shows it with today’s date, with no reload', async ({
  page,
  request,
}) => {
  const before = aRateOfOurOwn(4);
  await setTheRate(request, authorization, before);
  await page.goto(platformRateUrl);
  await expect(thePlate(page)).toHaveText(`1 $ = ${written(before)} IQD`);
  await markThePage(page);

  const rate = aRateOfOurOwn(4, before);
  await theField(page).fill(String(rate));
  await save(page).click();

  await expect(thePlate(page)).toHaveText(`1 $ = ${written(rate)} IQD`);
  await expect(thePlatesWords(page)).toHaveText(`1 dollar is ${written(rate)} dinars`);
  await expect(
    thePlate(page),
    'the drawn figures are hidden from a reader',
  ).toHaveAttribute('aria-hidden', 'true');
  await expect(theDaySet(page)).toHaveText(`Set ${await today(page)}`);
  await expect(theField(page), 'the field is emptied for the next rate').toHaveValue('');
  await expectNotReloaded(page);
  await expectNoSidewaysScroll(page);
});

test('a rate typed in Arabic-Indic digits with a separator is saved as its value', async ({
  page,
}) => {
  await page.goto(platformRateUrl);
  await expect(heading(page)).toBeVisible();
  const rate = aRateOfOurOwn(4);
  const arabicIndic = written(rate)
    .replace(/\d/g, (digit) => String.fromCharCode(0x0660 + Number(digit)))
    .replace(',', '٬');

  const sent = page.waitForRequest(
    (request) => request.url() === rateEndpoint && request.method() === 'PUT',
  );
  await theField(page).fill(` ${arabicIndic} `);
  await save(page).click();

  expect((await sent).postDataJSON()).toEqual({ iqdPerUsd: rate });
  await expect(thePlate(page)).toHaveText(`1 $ = ${written(rate)} IQD`);
});

test('a rate out of range is refused beside the field, and the plate keeps the current rate; what is not a number is refused before it is sent', async ({
  page,
  request,
}) => {
  const rate = aRateOfOurOwn(4);
  await setTheRate(request, authorization, rate);
  await page.goto(platformRateUrl);
  await expect(thePlate(page)).toHaveText(`1 $ = ${written(rate)} IQD`);

  const answered = page.waitForResponse(
    (response) => response.url() === rateEndpoint && response.request().method() === 'PUT',
  );
  await theField(page).fill(`${rate}0`);
  await save(page).click();
  expect((await answered).status()).toBe(400);

  const refusal = page.getByTestId('rate-refusal');
  await expect(refusal).toHaveText('The rate is outside the allowed range.');
  await expect(theField(page)).toHaveAttribute('aria-invalid', 'true');
  await expect(theField(page)).toHaveAccessibleDescription(
    /The rate is outside the allowed range\./,
  );
  await expect(theField(page)).toBeFocused();
  await expect(thePlate(page)).toHaveText(`1 $ = ${written(rate)} IQD`);

  let sent = false;
  page.on('request', (each) => {
    if (each.url() === rateEndpoint && each.method() === 'PUT') sent = true;
  });
  await theField(page).fill('about 1500');
  await save(page).click();
  await expect(refusal).toHaveText('Enter a number, such as 1,575.');
  expect(sent, 'nothing that is not a number is sent').toBe(false);
  await expect(thePlate(page)).toHaveText(`1 $ = ${written(rate)} IQD`);
});

test('with no Platform Rate the empty state says so and what Shoppers see, and the form is still there', async ({
  page,
}) => {
  await answerNoRate(page);
  await page.goto(platformRateUrl);

  const empty = page.getByTestId('no-platform-rate');
  await expectTheEmptyState(
    empty,
    empty.getByText('No Platform Rate yet', { exact: true }),
  );
  await expect(empty).toContainText(
    'Until one is set, an Offer quoted in one currency is shown to Shoppers in that currency only.',
  );
  await expect(thePlate(page)).toHaveCount(0);
  await expect(theField(page)).toBeVisible();
  await expect(save(page)).toBeVisible();
  await expectNoSidewaysScroll(page);
});

test('the screen meets the automated part of WCAG 2.2 level AA, in light and in dark, with a rate and with none', async ({
  page,
  request,
}) => {
  await setTheRate(request, authorization, aRateOfOurOwn(4));
  await page.goto(platformRateUrl);
  await expect(thePlate(page)).toBeVisible();
  await theField(page).fill('20000');
  await save(page).click();
  await expect(page.getByTestId('rate-refusal')).toBeVisible();
  await expectAccessible(page);

  await answerNoRate(page);
  await page.reload();
  await expect(page.getByTestId('no-platform-rate')).toBeVisible();
  await expectAccessible(page);
});

// What a film of the screen sees in each frame: the width of the rate's
// figure, the top of the form, and how opaque the old and the new figures
// are while they change.
interface PlateFrame {
  figureWidth: number | null;
  formTop: number | null;
  shown: number | null;
  leaving: number | null;
}

function lookAtThePlate(): PlateFrame {
  const figure = document.querySelector('[data-testid="rate-figure"]');
  const opacityOf = (element: Element | null | undefined) =>
    element ? Number(getComputedStyle(element).opacity) : null;
  return {
    figureWidth: figure?.getBoundingClientRect().width ?? null,
    formTop:
      document.querySelector('[data-testid="platform-rate-form"]')?.getBoundingClientRect()
        .top ?? null,
    shown: opacityOf(figure?.querySelector('[data-shown]')),
    leaving: opacityOf(figure?.querySelector('[data-leaving]')),
  };
}

// Waits until nothing on the page still moves, such as the space the
// screen's first answer opens, so that a film sees only what it films.
async function untilStill(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (animation) =>
                animation.playState === 'running' &&
                animation.effect?.getComputedTiming().endTime !== Infinity,
            ).length,
      ),
    )
    .toBe(0);
}

function seen(values: (number | null)[]): number[] {
  return values.flatMap((value) => (value === null ? [] : [value]));
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`the plate takes a new rate with no snap: the old figure fades under the new one and its width follows (${reducedMotion})`, async ({
    page,
    request,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await setTheRate(request, authorization, aRateOfOurOwn(3));
    await page.goto(platformRateUrl);
    await expect(thePlate(page)).toBeVisible();
    const rate = aRateOfOurOwn(4);
    await theField(page).fill(String(rate));
    await untilStill(page);

    // Watched four times slower, as the owner asked them to be watched.
    const frames = await film(page, lookAtThePlate, () => save(page).click());
    await expect(thePlate(page)).toHaveText(`1 $ = ${written(rate)} IQD`);

    const widths = frames.map(({ at, drawn }) => ({ at, value: drawn.figureWidth }));
    const drawnWidths = seen(widths.map(({ value }) => value));
    expect(
      (drawnWidths.at(-1) ?? 0) - (drawnWidths[0] ?? 0),
      'the figure grew by a digit and a comma',
    ).toBeGreaterThan(15);
    expect(snapsOf('the figure’s width', widths)).toEqual([]);

    const leaving = seen(frames.map(({ drawn }) => drawn.leaving));
    expect(
      leaving.some((opacity) => opacity > 0.1 && opacity < 0.9),
      'the old figure fades out',
    ).toBe(true);
    const shown = seen(frames.map(({ drawn }) => drawn.shown));
    expect(
      shown.some((opacity) => opacity > 0.1 && opacity < 0.9),
      'the new figure fades in',
    ).toBe(true);
    const tops = seen(frames.map(({ drawn }) => drawn.formTop));
    expect(Math.max(...tops) - Math.min(...tops), 'the form holds still').toBeLessThan(1);
  });

  test(`the first rate takes the empty state’s place with no snap, the form rising (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await answerNoRate(page);
    await page.goto(platformRateUrl);
    await expect(page.getByTestId('no-platform-rate')).toBeVisible();
    const rate = aRateOfOurOwn(4);
    await theField(page).fill(String(rate));
    await untilStill(page);

    const frames = await film(page, lookAtThePlate, () => save(page).click());
    await expect(thePlate(page)).toHaveText(`1 $ = ${written(rate)} IQD`);
    await expect(page.getByTestId('no-platform-rate')).toHaveCount(0);

    const tops = frames.map(({ at, drawn }) => ({ at, value: drawn.formTop }));
    const drawnTops = seen(tops.map(({ value }) => value));
    expect((drawnTops[0] ?? 0) - (drawnTops.at(-1) ?? 0), 'the form rose').toBeGreaterThan(
      40,
    );
    expect(snapsOf('the form’s top', tops)).toEqual([]);
  });
}
