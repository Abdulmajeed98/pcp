import { expect, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  catalogUrl,
  createAMadeUpPart,
  type MadeUpPart,
  missingNeededMark,
  partPageAddress,
  rowOf,
  searchTheCatalog,
  specificationRow,
} from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import { aMadeUpPhoto } from './made-up-photo';

// The Admin works in the Vendors' shops, on a phone (LANG-8).
test.use({ viewport: narrowWindow });

let part: MadeUpPart;

// Each test creates a made-up CPU of its own over HTTP, with a socket and six
// cores, and opens its page.
test.beforeEach(async ({ page, request }) => {
  const authorization = await authorizationOfTheDevelopmentAdmin(page);
  part = await createAMadeUpPart(request, authorization, {
    socket: 'AM5',
    cores: { total: 6 },
  });
  await page.goto(`${catalogUrl}/parts/${part.id}`);
  await expect(page.getByRole('heading', { level: 1, name: part.name })).toBeVisible();
});

async function openTheEditForm(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Edit' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Edit the Part' }),
  ).toBeVisible();
}

async function save(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Save the Part' }).click();
  await expect(page).toHaveURL(partPageAddress);
}

test.describe('editing a Part, from its page', () => {
  test('the form opens filled with the Part, shows its Category, and offers no way to change it', async ({
    page,
  }) => {
    await openTheEditForm(page);

    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(
      part.name,
    );
    await expect(page.getByRole('textbox', { name: 'Cores', exact: true })).toHaveValue(
      '6',
    );
    await expect(page.getByRole('combobox', { name: 'Socket', exact: true })).toHaveValue(
      'AM5',
    );
    await expect(page.getByTestId('category')).toHaveText('CPU');
    await expect(page.getByRole('combobox', { name: 'Category' })).toHaveCount(0);
  });

  test('the Admin edits a specification, and the page shows the new value', async ({
    page,
  }) => {
    await openTheEditForm(page);
    await page.getByRole('textbox', { name: 'Cores', exact: true }).fill('8');
    await save(page);

    await expect(specificationRow(page, 'cores.total')).toContainText('8');
    await expect(specificationRow(page, 'socket')).toContainText('AM5');
  });

  test('the Admin empties a needed specification, and the page marks it as missing', async ({
    page,
  }) => {
    await openTheEditForm(page);
    await page
      .getByRole('combobox', { name: 'Socket', exact: true })
      .selectOption('Not known');
    await save(page);

    await expect(missingNeededMark(specificationRow(page, 'socket'))).toBeVisible();
    await expect(specificationRow(page, 'cores.total')).toContainText('6');
  });

  test('the edit form does not scroll sideways, and meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
  }) => {
    await openTheEditForm(page);

    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  });
});

test.describe("a Part's photo, from its page", () => {
  // The picture on the Part's page, and its address once it has loaded.
  async function addressOfThePhoto(page: Page): Promise<string> {
    const photo = page.getByRole('img', { name: `Photo of ${part.name}` });
    await expect(photo).toBeVisible();
    await expect
      .poll(() => photo.evaluate((image) => (image as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    return (await photo.getAttribute('src')) ?? '';
  }

  test('the Admin adds a photo, which the page and the Catalog show in place of the icon, and a second replaces it at a new address', async ({
    page,
  }) => {
    await page.getByLabel('Add a photo').setInputFiles(aMadeUpPhoto([200, 40, 40]));
    const first = await addressOfThePhoto(page);
    await expect(page.getByTestId('category-icon')).toHaveCount(0);

    await page.getByLabel('Replace the photo').setInputFiles(aMadeUpPhoto([40, 40, 200]));
    await expect(
      page.getByRole('img', { name: `Photo of ${part.name}` }),
    ).not.toHaveAttribute('src', first);
    const second = await addressOfThePhoto(page);
    expect(second).not.toBe(first);

    await page.getByRole('link', { name: 'Catalog' }).click();
    await searchTheCatalog(page, { words: part.word });
    const row = rowOf(page, part.name);
    await expect(row.locator('img')).toHaveAttribute('src', second);
    await expect(row.getByTestId('category-icon')).toHaveCount(0);
  });

  test('a file that is not a picture is refused in plain words', async ({ page }) => {
    await page.getByLabel('Add a photo').setInputFiles({
      name: 'not-a-picture.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('These are words, not a picture.'),
    });

    await expect(page.getByTestId('photo-refusal')).toContainText(
      'not a JPEG, PNG or WebP picture',
    );
    await expect(page.getByTestId('category-icon')).toBeVisible();
  });

  test('the photo field asks the browser for JPEG, PNG or WebP', async ({ page }) => {
    await expect(page.getByLabel('Add a photo')).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/webp',
    );
  });
});
