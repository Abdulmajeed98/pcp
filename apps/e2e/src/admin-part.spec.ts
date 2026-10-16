import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

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
import { apiUrl } from './platform';

// The Admin works in the Vendors' shops, on a phone (LANG-8).
test.use({ viewport: narrowWindow });

// A name unique to the run, and plainly test data. The Parts these tests
// create stay in the development database, which `pnpm services:reset`
// empties.
function aMadeUpName(): string {
  return `Made-up test Part ${Date.now()}${Math.floor(Math.random() * 1000)}`;
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
    await expect(cores).toHaveAccessibleDescription(/number/i);
    await expect(page).not.toHaveURL(partPageAddress);
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
