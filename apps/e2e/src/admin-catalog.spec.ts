import { expect, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  catalogHeading,
  catalogUrl,
  createAMadeUpPart,
  type MadeUpPart,
  nothingFound,
  rowOf,
  searchTheCatalog,
} from './catalog';
import {
  authorizationOfTheDevelopmentAdmin,
  developmentVendor,
  openTheDashboardAs,
} from './development-logins';
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

  test("a word of its name finds the made-up Part, which shows its Category's icon", async ({
    page,
  }) => {
    await searchTheCatalog(page, { words: part.word });

    const row = rowOf(page, part.name);
    await expect(row).toBeVisible();
    await expect(row.getByTestId('category-icon')).toHaveAttribute('data-category', 'cpu');
  });

  test('its part number finds it too', async ({ page }) => {
    await searchTheCatalog(page, { words: part.partNumber });

    await expect(rowOf(page, part.name)).toBeVisible();
    await expect(rowOf(page, part.name)).toContainText(part.partNumber);
  });

  test('a search in its own Category finds it, and choosing another Category leaves it out', async ({
    page,
  }) => {
    await searchTheCatalog(page, { words: part.word, category: 'CPU' });
    await expect(rowOf(page, part.name)).toBeVisible();

    await searchTheCatalog(page, { words: part.word, category: 'GPU' });
    await expect(nothingFound(page)).toBeVisible();
    await expect(rowOf(page, part.name)).toHaveCount(0);
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

test("as the development Vendor, the Catalog's address shows the Vendor portal and not the Catalog", async ({
  page,
}) => {
  await openTheDashboardAs(page, developmentVendor, catalogUrl);

  await expect(page.getByTestId('placeholder-notice')).toBeVisible();
  await expect(catalogHeading(page)).toHaveCount(0);
  await expect(page.getByRole('searchbox')).toHaveCount(0);
});

// On a wider screen the Catalog's list gains a detail pane beside it
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

    test('shows beside the list, which keeps its search and marks the Part as open', async ({
      page,
    }) => {
      await rowOf(page, part.name).getByRole('link', { name: part.name }).click();

      await expect(page.getByRole('heading', { level: 1, name: part.name })).toBeVisible();
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
