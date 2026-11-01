import { expect, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  catalogHeading,
  categoryTab,
  createAMadeUpPart,
  type MadeUpPart,
  nothingFound,
  rowOf,
  searchTheCatalog,
} from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { expectNoSidewaysScroll, narrowWindow } from './languages';

// The Admin works in the Vendors' shops, on a phone (LANG-8).
test.use({ viewport: narrowWindow });

test.describe('the Catalog, as the development Admin', () => {
  let part: MadeUpPart;

  // Each test logs in, which opens the Admin console at the Catalog, and
  // creates a made-up CPU of its own over HTTP.
  test.beforeEach(async ({ page, request }) => {
    const authorization = await authorizationOfTheDevelopmentAdmin(page);
    part = await createAMadeUpPart(request, authorization);
    await expect(catalogHeading(page)).toBeVisible();
  });

  // The row shows no picture: the Category is the tab the Admin is in, and
  // each tab counts what the search found in it (redesign ticket 07).
  test("a word of its name finds the made-up Part, which its Category's tab counts, on a row with no picture", async ({
    page,
  }) => {
    await searchTheCatalog(page, { words: part.word });

    const row = rowOf(page, part.name);
    await expect(row).toBeVisible();
    await expect(row.locator('img, [data-testid="category-icon"]')).toHaveCount(0);
    await expect(categoryTab(page, 'CPU')).toHaveText('CPU 1');
    await expect(categoryTab(page, 'GPU')).toHaveText('GPU 0');
    await expect(categoryTab(page, 'All Categories')).toHaveText('All Categories 1');
    await expect(categoryTab(page, 'All Categories')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('its part number finds it too, said in words, with no Search button and no plate', async ({
    page,
  }) => {
    await searchTheCatalog(page, { words: part.partNumber });

    await expect(rowOf(page, part.name)).toBeVisible();
    await expect(rowOf(page, part.name)).toContainText(part.partNumber);
    await expect(page.getByTestId('parts-found')).toHaveText('1 Part');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toHaveCount(0);
    await expect(page.locator('[data-slot="plate"]')).toHaveCount(0);
  });

  test('a search in its own Category finds it, and choosing another Category leaves it out', async ({
    page,
  }) => {
    await searchTheCatalog(page, { words: part.word, category: 'CPU' });
    await expect(rowOf(page, part.name)).toBeVisible();
    await expect(categoryTab(page, 'CPU')).toHaveAttribute('aria-current', 'page');

    await searchTheCatalog(page, { words: part.word, category: 'GPU' });
    await expect(nothingFound(page)).toBeVisible();
    await expect(rowOf(page, part.name)).toHaveCount(0);
  });

  // The tab row scrolls sideways in its own row on a phone; while more tabs
  // lie beyond its end side, that end fades, and once it is scrolled to its
  // end, or a tab in it has the keyboard's focus, it does not (the owner's
  // choice in redesign ticket 07).
  test('the Category tabs fade at their end side while more lie beyond it, and not at the end or with focus', async ({
    page,
  }) => {
    const tabs = page.getByRole('navigation', { name: 'Categories' });
    await expect(categoryTab(page, 'PSU')).toBeAttached();
    const fade = () => tabs.evaluate((row) => getComputedStyle(row).maskImage);

    await expect.poll(fade).toContain('linear-gradient');

    await tabs.evaluate((row) => row.scrollTo({ left: row.scrollWidth }));
    await expect.poll(fade).toBe('none');

    await tabs.evaluate((row) => row.scrollTo({ left: 0 }));
    await expect.poll(fade).toContain('linear-gradient');
    await categoryTab(page, 'All Categories').focus();
    await expect.poll(fade).toBe('none');
  });

  test('the Catalog does not scroll sideways', async ({ page }) => {
    await searchTheCatalog(page, { words: part.word });
    await expect(rowOf(page, part.name)).toBeVisible();

    await expectNoSidewaysScroll(page);
  });

  test('the Catalog meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
  }) => {
    await searchTheCatalog(page, { words: part.word });
    await expect(rowOf(page, part.name)).toBeVisible();

    await expectAccessible(page);
  });
});

// On a wider screen the Catalog's list is a table across the whole sheet
// until a Part is opened, and its search is in the frame's top bar
// (apps/dashboard/DESIGN.md): an opened Part shows beside the list, which
// keeps its search and marks the Part's row as the open one. On a phone the
// opened Part takes the whole screen.
test.describe('a Part opened from the Catalog', () => {
  let part: MadeUpPart;

  test.beforeEach(async ({ page, request }) => {
    const authorization = await authorizationOfTheDevelopmentAdmin(page);
    part = await createAMadeUpPart(request, authorization);
    await searchTheCatalog(page, { words: part.word });
  });

  test.describe('on a screen as wide as a desk', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('the list is a table across the sheet, with the search in the top bar, and meets WCAG 2.2 level AA in light and in dark', async ({
      page,
    }) => {
      await expect(
        page.getByRole('banner').getByRole('searchbox', { name: 'Search the catalog' }),
      ).toHaveValue(part.word);
      const table = page.getByRole('table', { name: 'Parts found' });
      await expect(table.getByRole('columnheader')).toHaveText([
        'Part',
        'Manufacturer',
        'Part numbers',
      ]);
      const sheet = await page.getByRole('main').boundingBox();
      const list = await table.boundingBox();
      // The sheet's 24 pixels of padding on each side, and the rows' 8
      // pixels of bleed past the text on each side.
      expect(list?.width).toBeGreaterThanOrEqual((sheet?.width ?? 0) - 48 - 2);
      // The first column's heading and its text start where the Catalog's
      // title does, the rows' bleed taken back by their padding.
      const title = await catalogHeading(page).boundingBox();
      const heading = await table
        .getByRole('columnheader', { name: 'Part', exact: true })
        .evaluate(
          (cell) =>
            cell.getBoundingClientRect().left +
            parseFloat(getComputedStyle(cell).paddingInlineStart),
        );
      const name = await rowOf(page, part.name)
        .getByRole('link', { name: part.name })
        .boundingBox();
      expect(Math.abs(heading - (title?.x ?? 0)), 'the heading').toBeLessThan(1);
      expect(Math.abs((name?.x ?? 0) - (title?.x ?? 0)), 'the name').toBeLessThan(1);
      await expectNoSidewaysScroll(page);
      await expectAccessible(page);
    });

    test('shows beside the list, which keeps its search and marks the Part as open', async ({
      page,
    }) => {
      await rowOf(page, part.name).getByRole('link', { name: part.name }).click();

      // Beside the list the Part's title is of the second level, under the
      // Catalog's (redesign ticket 08).
      await expect(page.getByRole('heading', { level: 2, name: part.name })).toBeVisible();
      await expect(catalogHeading(page)).toBeVisible();
      await expect(page.getByRole('searchbox', { name: 'Search the catalog' })).toHaveValue(
        part.word,
      );
      await expect(
        rowOf(page, part.name).getByRole('link', { name: part.name }),
      ).toHaveAttribute('aria-current', 'page');
      await expectNoSidewaysScroll(page);
    });
  });

  test('on a phone, takes the whole screen, and its way back returns to the same search', async ({
    page,
  }) => {
    await rowOf(page, part.name).getByRole('link', { name: part.name }).click();

    await expect(page.getByRole('heading', { level: 1, name: part.name })).toBeVisible();
    await expect(catalogHeading(page)).toHaveCount(0);

    await page.getByRole('link', { name: 'Catalog', exact: true }).click();
    await expect(rowOf(page, part.name)).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Search the catalog' })).toHaveValue(
      part.word,
    );
  });
});
