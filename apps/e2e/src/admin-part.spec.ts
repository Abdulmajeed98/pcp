import { randomUUID } from 'node:crypto';

import { expect, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  catalogHeading,
  catalogUrl,
  createAMadeUpPart,
  missingNeededMark,
  openTheFormForANewPart,
  partPageAddress,
  rowOf,
  searchTheCatalog,
  specificationRow,
} from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { aMadeUpPhoto } from './made-up-photo';
import { film, filmPlaces, snapsOfThePlace, travelOf } from './motion-film';
import { apiUrl } from './platform';

// The Admin works in the Vendors' shops, on a phone (LANG-8).
test.use({ viewport: narrowWindow });

// A name unique to the run, and plainly test data. The Parts these tests
// create stay in the development database, which `pnpm services:reset`
// empties.
function aMadeUpName(): string {
  return `Made-up test Part ${aWordUniqueToTheRun()}`;
}

let authorization: string;

test.beforeEach(async ({ page }) => {
  authorization = await authorizationOfTheDevelopmentAdmin(page);
  await expect(catalogHeading(page)).toBeVisible();
});

test.describe('a new Part, through the form', () => {
  const cpu = { cores: 'cores.total', socket: 'socket', tdp: 'specifications.tdp' };
  let name: string;

  // Each test fills in a made-up CPU's name, manufacturer, one part number and
  // its cores, and leaves out its socket, its TDP and its memory types, which
  // are all needed.
  test.beforeEach(async ({ page }) => {
    name = aMadeUpName();
    await openTheFormForANewPart(page, 'CPU');
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
    await page
      .getByRole('textbox', { name: 'Manufacturer', exact: true })
      .fill('Made-up Test Parts');
    await page.getByRole('button', { name: 'Add a part number' }).click();
    await page
      .getByRole('textbox', { name: 'Part number 1', exact: true })
      .fill(`TEST-${Date.now()}`);
    await page.getByRole('textbox', { name: 'Cores', exact: true }).fill('6');
  });

  test('the Admin creates it with needed specifications left out, and arrives at its page, which marks them and shows what was given', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Create the Part' }).click();

    await expect(page).toHaveURL(partPageAddress);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    for (const path of [cpu.socket, cpu.tdp, 'specifications.memory.types']) {
      await expect(missingNeededMark(specificationRow(page, path))).toBeVisible();
    }
    await expect(specificationRow(page, cpu.cores)).toContainText('6');
    await expect(missingNeededMark(specificationRow(page, cpu.cores))).toHaveCount(0);
    await expect(missingNeededMark(specificationRow(page, 'series'))).toHaveCount(0);
    await expect(page.getByText('Created by the Admin')).toBeVisible();
    await expect(page.getByTestId('category-icon')).toHaveAttribute('data-category', 'cpu');
  });

  test('a fixed set is offered as a choice, and nothing outside it can be chosen', async ({
    page,
    request,
  }) => {
    const categories = await request.get(`${apiUrl}/v1/categories`, {
      headers: { authorization },
    });
    const { specifications } = ((await categories.json()) as Category[]).find(
      ({ key }) => key === 'cpu',
    ) as Category;
    const sockets = specifications.find(({ path }) => path === cpu.socket)?.values ?? [];
    expect(sockets).toContain('AM5');

    const socket = page.getByRole('combobox', { name: 'Socket', exact: true });
    await expect(socket.getByRole('option')).toHaveText(['Not known', ...sockets]);
    // Playwright waits for an option to appear before it chooses it, so a
    // second is given for one that never will.
    await expect(socket.selectOption('AM 5', { timeout: 1000 })).rejects.toThrow();
  });

  test('a word typed where a number belongs is refused beside its field, and nothing is created', async ({
    page,
  }) => {
    const cores = page.getByRole('textbox', { name: 'Cores', exact: true });
    await cores.fill('six');
    await page.getByRole('button', { name: 'Create the Part' }).click();

    await expect(cores).toHaveAttribute('aria-invalid', 'true');
    // Cores are a whole number, so the example is one (redesign ticket 08's
    // break-ui: it was "such as 3.8").
    await expect(cores).toHaveAccessibleDescription('Enter a whole number, such as 6.');
    await expect(page).not.toHaveURL(partPageAddress);
  });

  // While the Part is on its way, the button says so and waits (DESIGN.md's
  // busy button).
  test('while the Part is on its way, its button says so and waits', async ({ page }) => {
    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(`${apiUrl}/v1/parts`, async (route) => {
      await held;
      await route.continue();
    });
    await page.getByRole('button', { name: 'Create the Part' }).click();

    const busy = page.getByRole('button', { name: 'Creating the Part…' });
    await expect(busy).toBeVisible();
    await expect(busy).toBeDisabled();
    release();
    await expect(page).toHaveURL(partPageAddress);
  });

  // A refusal that names no field of the form is said where the Admin is,
  // beside the button just pressed, not at the head of a long form scrolled
  // out of sight (redesign ticket 08's break-ui).
  test('a refusal that names no field is said beside the button, in sight', async ({
    page,
  }) => {
    await page.route(`${apiUrl}/v1/parts`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ statusCode: 500, code: 'internalError', errors: [] }),
      }),
    );
    await page.getByRole('button', { name: 'Create the Part' }).click();

    const refusal = page.getByTestId('refusal');
    await expect(refusal).toContainText('The Part was not saved.');
    // A refusal that names no reason ends its sentence there.
    await expect(refusal).toContainText(/with 500, \w+\.$/);
    await expect(refusal).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Create the Part' })).toBeInViewport();
    await expect(page).not.toHaveURL(partPageAddress);
  });

  // With reduced motion the scroll that keeps such a refusal in sight runs
  // at once, as the Reduced motion section drops a movement of the whole
  // screen, while the refusal's space still opens over its frames.
  test('with reduced motion, a refusal that names no field is brought into sight at once, not by a smooth scroll', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route(`${apiUrl}/v1/parts`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ statusCode: 500, code: 'internalError', errors: [] }),
      }),
    );
    const button = page.getByRole('button', { name: 'Create the Part' });
    // The button at the foot of the window, so that the refusal opening above
    // it pushes it out of sight, and the browser's own scroll anchoring off,
    // so that only the form's scroll moves the page.
    await page.addStyleTag({ content: '* { overflow-anchor: none !important; }' });
    await button.evaluate((element) => element.scrollIntoView({ block: 'end' }));

    const frames = await film(
      page,
      () => window.scrollY,
      () => button.click(),
      {
        slowedBy: 1,
        forMs: 1500,
      },
    );
    await expect(page.getByTestId('refusal')).toBeInViewport();
    // A smooth scroll moves the page in frame after frame; one at once moves
    // it in a frame of its own each time it is asked.
    const moved = frames.map(
      ({ drawn }, index) => index > 0 && drawn !== frames[index - 1].drawn,
    );
    const gliding = moved.filter((now, index) => now && moved[index - 1]);
    expect(
      (frames.at(-1)?.drawn ?? 0) - (frames[0]?.drawn ?? 0),
      'it scrolled',
    ).toBeGreaterThan(0);
    expect(gliding, 'never in two frames running').toHaveLength(0);
  });

  // An entry added to a list takes the focus, so the Admin types at once;
  // an entry removed hands the focus to the one that took its place.
  // The owner's word, "Field that grows": the whole name shows while it is
  // edited, and it stays one line of text.
  test('a long name shows whole in a field that grows, and Enter adds no line but saves', async ({
    page,
  }) => {
    const field = page.getByRole('textbox', { name: 'Name', exact: true });
    await field.fill('Line one\nLine two');
    await expect(field).toHaveValue('Line one Line two');

    const long = `${name} with a mounting kit for most sockets, two 140 mm fans, fan and radiator screws, a motherboard header cable, thermal compound applied and a quick start guide`;
    await field.fill(long);
    const { scrollHeight, clientHeight } = await field.evaluate((element) => ({
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
    }));
    expect(scrollHeight, 'the whole name is shown').toBeLessThanOrEqual(clientHeight + 1);
    expect((await field.boundingBox())?.height).toBeGreaterThan(60);

    await field.press('Enter');
    await expect(page).toHaveURL(partPageAddress);
    await expect(page.getByRole('heading', { level: 1, name: long })).toBeVisible();
  });

  // A field's refusal and a refusal naming no field each open their space
  // smoothly, so the form below them moves down over several frames, never
  // in one (the No Snap Rule), at full and at reduced motion.
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`a field's refusal moves the form below it smoothly, coming and going (${reducedMotion})`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion });
      const cores = page.getByRole('textbox', { name: 'Cores', exact: true });
      const below = page.getByRole('textbox', { name: 'Performance cores', exact: true });
      await cores.fill('six');
      const frames = await filmPlaces(page, { below }, async () => {
        await page.getByRole('button', { name: 'Create the Part' }).click();
        await expect(cores).toHaveAttribute('aria-invalid', 'true');
      });
      const moved = travelOf(frames, 'below');
      expect(moved, 'the field below moved down').toBeGreaterThan(10);
      expect(snapsOfThePlace(frames, 'below'), 'never far in one frame').toEqual([]);

      // The refusal leaves smoothly too, as soon as a number is written in
      // its place (the form checks a refused field again as it changes).
      const leaving = await filmPlaces(page, { below }, async () => {
        await cores.fill('6');
        await expect(cores).toHaveAttribute('aria-invalid', 'false');
      });
      const back = travelOf(leaving, 'below');
      expect(back, 'the field below moved back up').toBeGreaterThan(10);
      expect(snapsOfThePlace(leaving, 'below'), 'never far in one frame').toEqual([]);
    });
  }

  test('a refusal that names no field moves the button smoothly', async ({ page }) => {
    await page.route(`${apiUrl}/v1/parts`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ statusCode: 500, code: 'internalError', errors: [] }),
      }),
    );
    const button = page.getByRole('button', { name: 'Create the Part' });
    const frames = await filmPlaces(page, { button }, async () => {
      await button.click();
      await expect(page.getByTestId('refusal')).toBeVisible();
    });
    const moved = travelOf(frames, 'button');
    expect(moved, 'the button moved down').toBeGreaterThan(40);
    expect(snapsOfThePlace(frames, 'button'), 'never far in one frame').toEqual([]);
  });

  test('an added and a removed part number move what is below them smoothly', async ({
    page,
  }) => {
    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      await page.emulateMedia({ reducedMotion });
      const add = page.getByRole('button', { name: 'Add another part number' });
      const added = await filmPlaces(page, { add }, () => add.click());
      const down = travelOf(added, 'add');
      expect(down, `${reducedMotion}: Add moved down`).toBeGreaterThan(30);
      expect(
        snapsOfThePlace(added, 'add'),
        `${reducedMotion}: never far in one frame`,
      ).toEqual([]);

      const removed = await filmPlaces(page, { add }, () =>
        page.getByRole('button', { name: 'Remove Part number 2' }).click(),
      );
      const up = travelOf(removed, 'add');
      expect(up, `${reducedMotion}: Add moved up`).toBeGreaterThan(30);
      expect(
        snapsOfThePlace(removed, 'add'),
        `${reducedMotion}: never far in one frame`,
      ).toEqual([]);
    }
  });

  test('an added part number takes the focus, and a removed one hands it on', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Add another part number' }).click();
    const second = page.getByRole('textbox', { name: 'Part number 2', exact: true });
    await expect(second).toBeFocused();
    await second.fill('TEST-second');

    await page.getByRole('button', { name: 'Remove Part number 1' }).click();
    await expect(page.getByRole('textbox', { name: /^Part number \d$/ })).toHaveCount(1);
    await expect(
      page.getByRole('textbox', { name: 'Part number 1', exact: true }),
    ).toHaveValue('TEST-second');
    await expect(
      page.getByRole('textbox', { name: 'Part number 1', exact: true }),
    ).toBeFocused();

    await page.getByRole('button', { name: 'Remove Part number 1' }).click();
    await expect(page.getByRole('button', { name: 'Add a part number' })).toBeFocused();
  });

  // An entry removed is taken out of the form's values once its space has
  // closed, at the end of that transition, and still when the transition
  // never ends, as one the browser never ran ends nothing: then at the latest
  // a few seconds later, so that the Part is never saved with an entry the
  // Admin removed (the redesign's code review).
  test('a part number removed while no transition runs is still left out of the Part saved', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Add another part number' }).click();
    await page
      .getByRole('textbox', { name: 'Part number 2', exact: true })
      .fill('TEST-removed');
    await page.addStyleTag({
      content: '*, *::before, *::after { transition: none !important; }',
    });
    await page.getByRole('button', { name: 'Remove Part number 2' }).click();

    await expect
      .poll(() =>
        page
          .locator('input')
          .evaluateAll((inputs) =>
            inputs.some((input) => (input as HTMLInputElement).value === 'TEST-removed'),
          ),
      )
      .toBe(false);
    const sent = page.waitForRequest(
      (request) => request.url() === `${apiUrl}/v1/parts` && request.method() === 'POST',
    );
    await page.getByRole('button', { name: 'Create the Part' }).click();
    const { partNumbers } = (await sent).postDataJSON() as { partNumbers: string[] };
    expect(partNumbers).toHaveLength(1);
    expect(partNumbers).not.toContain('TEST-removed');
  });

  test('the form does not scroll sideways, and meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
  }) => {
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  });

  test("the Part's page does not scroll sideways, and meets the automated part of WCAG 2.2 level AA, in light and in dark", async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Create the Part' }).click();
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();

    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  });
});

// The form's fields go two to a row only where the form itself is 40rem
// wide: beside the list on a desk they would be squeezed, so they go one to
// a row there, and two to a row on a tablet, where the form has the sheet.
test.describe("the form's columns follow the form's own width", () => {
  async function socketAndSeries(page: Page) {
    await openTheFormForANewPart(page, 'CPU');
    const socket = await page
      .getByRole('combobox', { name: 'Socket', exact: true })
      .boundingBox();
    const series = await page
      .getByRole('textbox', { name: 'Series', exact: true })
      .boundingBox();
    return { socket, series };
  }

  test.describe('beside the list, on a desk', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('one field to a row, and WCAG 2.2 level AA in light and in dark', async ({
      page,
    }) => {
      const { socket, series } = await socketAndSeries(page);
      expect(series?.x).toBe(socket?.x);
      expect(series?.y).toBeGreaterThan((socket?.y ?? 0) + (socket?.height ?? 0));
      await expectNoSidewaysScroll(page);
      await expectAccessible(page);
    });
  });

  test.describe('on a tablet', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('two fields to a row', async ({ page }) => {
      const { socket, series } = await socketAndSeries(page);
      expect(series?.y).toBe(socket?.y);
      expect(series?.x).toBeGreaterThan((socket?.x ?? 0) + (socket?.width ?? 0));
    });
  });
});

// A list of rows made not known again: its rows leave one by one as removed
// rows do, never all at once, and the focus goes to the way to add a row
// (the No Snap Rule, redesign ticket 08).
test('a list of rows made not known lets its rows leave smoothly', async ({ page }) => {
  await openTheFormForANewPart(page, 'Motherboard');
  const addPcie = page.getByRole('button', { name: 'Add a row to PCIe slots' });
  await addPcie.click();
  await addPcie.click();
  const below = page.getByRole('button', { name: 'Add a row to M.2 slots' });

  const frames = await filmPlaces(page, { below }, () =>
    page.getByRole('button', { name: 'Make PCIe slots not known' }).click(),
  );
  const moved = travelOf(frames, 'below');
  expect(moved, 'what is below moved up').toBeGreaterThan(100);
  expect(snapsOfThePlace(frames, 'below'), 'never far in one frame').toEqual([]);
  await expect(page.getByRole('group', { name: /^PCIe slots \d$/ })).toHaveCount(0);
  await expect(addPcie).toBeFocused();
});

// The form leaves out a row with every field empty. The API numbers a refused
// field by its row's place in what it was sent, and the form has to put the
// refusal beside that same row.
test("a refusal of a row's field is shown beside that row, after an empty row", async ({
  page,
}) => {
  await openTheFormForANewPart(page, 'Motherboard');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill(aMadeUpName());
  await page
    .getByRole('textbox', { name: 'Manufacturer', exact: true })
    .fill('Made-up Test Parts');
  await page.getByRole('button', { name: 'Add a row to PCIe slots' }).click();
  await page.getByRole('button', { name: 'Add a row to PCIe slots' }).click();
  const slotsOf = (row: number) =>
    page
      .getByRole('group', { name: `PCIe slots ${row}`, exact: true })
      .getByRole('textbox', { name: 'Slots', exact: true });
  await slotsOf(2).fill('0');
  await page.getByRole('button', { name: 'Create the Part' }).click();

  await expect(slotsOf(2)).toHaveAttribute('aria-invalid', 'true');
  await expect(slotsOf(2)).toHaveAccessibleDescription(/0 cannot be right/);
  await expect(slotsOf(1)).toHaveAttribute('aria-invalid', 'false');
});

test('a Part found in the Catalog opens its page', async ({ page, request }) => {
  const part = await createAMadeUpPart(request, authorization);
  await searchTheCatalog(page, { words: part.word });

  await rowOf(page, part.name).getByRole('link', { name: part.name }).click();

  await expect(page).toHaveURL(new RegExp(`^${catalogUrl}/parts/${part.id}(\\?.*)?$`));
  await expect(page.getByRole('heading', { level: 1, name: part.name })).toBeVisible();
});

// A Part's page as the dashboard's DESIGN.md lays it out (redesign ticket
// 08): what the Part lacks is said in words, as the Missing specifications
// say it, and never on a plate, since plates are for prices.
test.describe("a Part's page", () => {
  test('says in words which needed specifications the Part lacks, on no plate', async ({
    page,
    request,
  }) => {
    const part = await createAMadeUpPart(request, authorization, { cores: { total: 6 } });
    await page.goto(`${catalogUrl}/parts/${part.id}`);

    await expect(page.getByTestId('lacks')).toHaveText('Lacks Socket, TDP, Memory types');
    await expect(page.locator('[data-slot="plate"]')).toHaveCount(0);
  });

  // The owner's word on 22 October 2026, "Say nothing": a Part that lacks
  // nothing has no line about it.
  test('says nothing about needed specifications when the Part lacks none', async ({
    page,
    request,
  }) => {
    const part = await createAMadeUpPart(request, authorization, {
      socket: 'AM5',
      specifications: { tdp: 65, memory: { types: ['DDR5'] } },
    });
    await page.goto(`${catalogUrl}/parts/${part.id}`);
    await expect(page.getByRole('heading', { level: 1, name: part.name })).toBeVisible();

    await expect(page.getByTestId('lacks')).toHaveCount(0);
    await expect(page.getByText('Every needed specification is known')).toHaveCount(0);
  });

  // A photo added while the page is open: the picture grows from the icon's
  // 32 pixels to the photo's 80, and the name beside it moves over smoothly,
  // never in one frame (the No Snap Rule).
  test('a photo added moves the name over smoothly, at full and at reduced motion', async ({
    page,
    request,
  }) => {
    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      await page.emulateMedia({ reducedMotion });
      const part = await createAMadeUpPart(request, authorization);
      await page.goto(`${catalogUrl}/parts/${part.id}`);
      const name = page.getByRole('heading', { level: 1, name: part.name });
      await expect(name).toBeVisible();

      const frames = await filmPlaces(page, { name }, async () => {
        await page.getByLabel('Add a photo').setInputFiles(aMadeUpPhoto([30, 110, 130]));
        await expect(
          page.getByRole('img', { name: `Photo of ${part.name}` }),
        ).toBeVisible();
      });
      const moved = travelOf(frames, 'name');
      expect(moved, `${reducedMotion}: the name moved over`).toBeGreaterThan(30);
      expect(
        snapsOfThePlace(frames, 'name'),
        `${reducedMotion}: never far in one frame`,
      ).toEqual([]);
    }
  });

  // A Part with no photo shows its Category's icon at 32 pixels, plain, with
  // no tinted square behind it (CAT-6, DESIGN.md's picture of a Part).
  test("draws its Category's icon plain when it has no photo", async ({
    page,
    request,
  }) => {
    const part = await createAMadeUpPart(request, authorization);
    await page.goto(`${catalogUrl}/parts/${part.id}`);

    const icon = page.getByTestId('category-icon');
    await expect(icon).toHaveAttribute('data-category', 'cpu');
    expect((await icon.boundingBox())?.width).toBe(32);
    expect(
      await icon.evaluate((svg) => getComputedStyle(svg.parentElement!).backgroundColor),
    ).toBe('rgba(0, 0, 0, 0)');
  });

  test.describe('beside the list, on a screen as wide as a desk', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("sets each specification's label beside its value, and meets WCAG 2.2 level AA in light and in dark", async ({
      page,
      request,
    }) => {
      const part = await createAMadeUpPart(request, authorization, {
        cores: { total: 6 },
      });
      await searchTheCatalog(page, { words: part.word });
      await rowOf(page, part.name).getByRole('link', { name: part.name }).click();
      // One first-level title to a page: beside the list the Part's is of
      // the second level (the owner's word, "h2 on a desk"), and its
      // sections' titles of the third.
      await expect(page.getByRole('heading', { level: 2, name: part.name })).toBeVisible();
      await expect(
        page.getByRole('heading', { level: 3, name: 'Specifications' }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(['Catalog']);

      const cores = specificationRow(page, 'cores.total');
      const label = await cores.getByRole('term').boundingBox();
      const value = await cores.getByRole('definition').boundingBox();
      expect(value?.y).toBe(label?.y);
      expect(value?.x).toBeGreaterThan((label?.x ?? 0) + (label?.width ?? 0));
      await expectNoSidewaysScroll(page);
      await expectAccessible(page);
    });
  });
});

// The first step of a new Part: its Category. Each says what its form will
// ask, so that the Admin knows the work before choosing.
test.describe('choosing a Category', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole('link', { name: 'New Part' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'New Part' })).toBeVisible();
  });

  test('lists each Category with how many specifications its form asks for, and how many are needed', async ({
    page,
  }) => {
    const categories = page.getByRole('list', { name: 'Categories' }).getByRole('listitem');
    await expect(categories).toHaveCount(8);
    await expect(categories.filter({ hasText: 'CPU cooler' })).toContainText(
      '13 specifications, 3 needed',
    );
    await expect(
      categories.filter({ has: page.getByRole('link', { name: 'CPU', exact: true }) }),
    ).toContainText('29 specifications, 3 needed');
  });

  test('does not scroll sideways, and meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
  }) => {
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  });
});

// A Part the API does not give is a screen with its own title, saying what
// was not done and why, and a way to try again (redesign ticket 08's
// break-ui: on a phone it had no title at all).
test('a Part the API does not give has a title, the reason and a way to try again', async ({
  page,
}) => {
  let refuse = true;
  await page.route(`${apiUrl}/v1/parts/*`, (route) =>
    refuse && route.request().method() === 'GET'
      ? route.fulfill({
          status: 500,
          json: { statusCode: 500, code: 'internalError', errors: [] },
        })
      : route.continue(),
  );
  const part = await createAMadeUpPart(page.request, authorization);
  await page.goto(`${catalogUrl}/parts/${part.id}`);

  await expect(
    page.getByRole('heading', { level: 1, name: 'The Part could not be read' }),
  ).toBeVisible();
  await expect(page.getByTestId('refusal')).toContainText('500');
  await expectAccessible(page);
  refuse = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { level: 1, name: part.name })).toBeVisible();
});

test('a Part that does not exist is said not to exist', async ({ page }) => {
  await page.goto(`${catalogUrl}/parts/${randomUUID()}`);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Part not found' }),
  ).toBeVisible();
});

// The parts of the API's answer for the Categories that these tests read.
interface Category {
  key: string;
  specifications: { path: string; values?: string[] }[];
}
