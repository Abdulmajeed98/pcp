import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

import { aWordUniqueToTheRun } from './made-up';
import { apiUrl, dashboardUrl } from './platform';

// The Admin console's Catalog. The Admin console is in English only, so its
// screens are found by their English names.
export const catalogUrl = `${dashboardUrl}/catalog`;

// A made-up Part a test creates, and the words that find it.
export interface MadeUpPart {
  id: string;
  name: string;
  // A word of its name that no other Part has.
  word: string;
  partNumber: string;
}

// Creates a made-up Part over HTTP as the Admin, a CPU unless another
// Category is given, with a name and a part number unique to the run, and
// plainly test data, and any specifications given. It stays in the
// development database, which `pnpm services:reset` empties. The name does
// not hold the part number, so that a search for the one does not find it by
// the other.
export async function createAMadeUpPart(
  request: APIRequestContext,
  authorization: string,
  specifications: Record<string, unknown> = {},
  category = 'cpu',
): Promise<MadeUpPart> {
  const word = aWordUniqueToTheRun();
  const name = `Made-up test Part ${word}`;
  const partNumber = `TEST-${word}`;

  const created = await request.post(`${apiUrl}/v1/parts`, {
    headers: { authorization },
    data: {
      category,
      name,
      manufacturer: 'Made-up Test Parts',
      partNumbers: [partNumber],
      specifications,
    },
  });
  expect(created.status()).toBe(201);
  const { id } = (await created.json()) as { id: string };

  return { id, name, word, partNumber };
}

// The Catalog's heading, which tells the screen apart.
export function catalogHeading(page: Page): Locator {
  return page.getByRole('heading', { level: 1, name: 'Catalog' });
}

// Searches the Catalog the way the Admin does: types the words and presses
// Enter, as the search has no button of its own, then chooses the
// Category's tab by its English name, or All Categories. The search is in
// the address before the tab is chosen, as each tab's address keeps it.
export async function searchTheCatalog(
  page: Page,
  { words, category = 'All Categories' }: { words: string; category?: string },
): Promise<void> {
  await page.getByRole('searchbox', { name: 'Search the catalog' }).fill(words);
  await page.getByRole('searchbox', { name: 'Search the catalog' }).press('Enter');
  await page.waitForURL((url) => (url.searchParams.get('search') ?? '') === words.trim());
  await categoryTab(page, category).click();
}

// The Catalog's tab for a Category, by its English name, or All
// Categories. Its name is the Category's followed by its count.
export function categoryTab(page: Page, category: string): Locator {
  return page
    .getByRole('navigation', { name: 'Categories' })
    .getByRole('link', { name: new RegExp(`^${category}( [\\d,]+)?$`) });
}

// The rows the Catalog found: a list's items on a phone, and a table's rows
// on a screen as wide as a desk's.
export function foundParts(page: Page): Locator {
  return page
    .getByRole('list', { name: 'Parts found' })
    .getByRole('listitem')
    .or(page.getByRole('table', { name: 'Parts found' }).getByRole('row'));
}

// The row of a Part, found by its name.
export function rowOf(page: Page, name: string): Locator {
  return foundParts(page).filter({ hasText: name });
}

// What the Catalog says when a search finds nothing.
export function nothingFound(page: Page): Locator {
  return page.getByTestId('nothing-found');
}

// A Part's page, told apart by its address, which keeps the Catalog's search
// when it was opened from one.
export const partPageAddress = new RegExp(
  `^${dashboardUrl}/catalog/parts/[0-9a-f-]{36}(\\?.*)?$`,
);

// Opens the form for a new Part from the Catalog, the way the Admin does:
// taps New Part, then chooses the Category by its English name.
export async function openTheFormForANewPart(page: Page, category: string): Promise<void> {
  await page.getByRole('link', { name: 'New Part' }).click();
  await page.getByRole('link', { name: category, exact: true }).click();
  await expect(
    page.getByRole('heading', {
      level: besideTheList(page) ? 2 : 1,
      name: `New ${category}`,
    }),
  ).toBeVisible();
}

// Whether a screen opened from a list is shown beside it, as it is on a
// screen as wide as a desk's (64rem), where its title is of the second level
// under the list's (redesign ticket 08, the owner's "h2 on a desk").
export function besideTheList(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) >= 1024;
}

// The row of a Part's page that shows one specification, found by its path
// in the API's specification list, such as `cores.total`.
export function specificationRow(page: Page, path: string): Locator {
  return page.locator(`[data-specification="${path}"]`);
}

// The mark a Part's page gives a needed specification the Part lacks.
export function missingNeededMark(row: Locator): Locator {
  return row.getByTestId('missing-needed');
}
