import { expect, type Locator, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { openTheSection } from './admin-vendors';
import { catalogHeading, createAMadeUpPart, type MadeUpPart } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import { leavingRowsOf, watchForLeavingRows } from './leaving-rows';
import { apiUrl, dashboardUrl } from './platform';
import { createAMadeUpVendor } from './vendors';

// The Admin keeps compatibility checking whole from a phone, in a Vendor's
// shop (CAT-8, LANG-8).
test.use({ viewport: narrowWindow });

const missingSpecificationsUrl = `${dashboardUrl}/missing-specifications`;

function heading(page: Page): Locator {
  return page.getByRole('heading', { level: 1, name: 'Missing specifications' });
}

// The Parts on the list: two-line rows on a phone, and a table's rows from
// 64rem (redesign ticket 10).
function listedParts(page: Page): Locator {
  return page
    .getByRole('list', { name: 'Parts missing specifications' })
    .getByRole('listitem')
    .or(
      page
        .getByRole('table', { name: 'Parts missing specifications' })
        .getByRole('row')
        .filter({ has: page.getByRole('cell') }),
    );
}

// Goes through the list from its first page until the Part's row is seen or
// the last page is passed, and gives back its row, or none.
async function findOnTheList(page: Page, name: string): Promise<Locator | undefined> {
  await page.goto(missingSpecificationsUrl);
  await expect(heading(page)).toBeVisible();

  const pages = page.getByRole('navigation', {
    name: 'Pages of the Parts missing specifications',
  });
  for (let number = 1; ; number++) {
    // An empty list has no rows; a list with rows shows its count.
    await expect(
      page.getByTestId('nothing-missing').or(listedParts(page).first()),
    ).toBeVisible();
    if ((await pages.count()) > 0) {
      await expect(pages.getByText(`Page ${number} of`)).toBeVisible();
    }
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    const row = listedParts(page).filter({ hasText: name });
    if ((await row.count()) > 0) return row;

    if ((await pages.count()) === 0) return undefined;
    const next = pages.getByRole('button', { name: 'Next' });
    if (await next.isDisabled()) return undefined;
    await next.click();
  }
}

let authorization: string;
let part: MadeUpPart;

// A made-up CPU lacking its TDP, a needed specification, offered by a made-up
// Vendor.
test.beforeEach(async ({ page, request }) => {
  authorization = await authorizationOfTheDevelopmentAdmin(page);
  await expect(catalogHeading(page)).toBeVisible();
  const vendor = await createAMadeUpVendor(request, authorization);
  part = await createAMadeUpPart(request, authorization, {
    socket: 'AM5',
    specifications: { memory: { types: ['DDR5'] } },
  });
  const offered = await request.post(`${apiUrl}/v1/vendors/${vendor.id}/offers`, {
    headers: { authorization },
    data: { partId: part.id, usdPrice: '349.99', inStock: true },
  });
  expect(offered.status()).toBe(201);
});

test('the top bar’s menu leads to the list, which holds a made-up Part with a gap and an Offer, naming what it lacks; its row leads to the edit form, and once the gap is filled and saved the list no longer holds it', async ({
  page,
}) => {
  await openTheSection(page, 'Missing specifications');
  await expect(heading(page)).toBeVisible();
  await expect(page).toHaveURL(missingSpecificationsUrl);

  const row = await findOnTheList(page, part.name);
  expect(row, 'the made-up Part is on the list').toBeDefined();
  const found = row as Locator;
  await expect(found.getByTestId('lacks')).toHaveText('Lacks TDP');
  await expect(found.getByTestId('offer-count')).toHaveText('1 Offer');
  await expect(found).toContainText('CPU');
  // No picture on a row (the dashboard's DESIGN.md, redesign ticket 10).
  await expect(found.locator('img, [data-testid="category-icon"]')).toHaveCount(0);
  await expectNoSidewaysScroll(page);

  await found.getByRole('link', { name: part.name }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Edit the Part' }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(
    part.name,
  );
  await page.getByRole('textbox', { name: 'TDP (W)', exact: true }).fill('65');
  await page.getByRole('button', { name: 'Save the Part' }).click();

  // The list again, on the page the Part was found on, which is kept in the
  // address: the development database's Parts from earlier runs can put it
  // past the first.
  await expect(page).toHaveURL(new RegExp(`^${missingSpecificationsUrl}(\\?page=\\d+)?$`));
  await expect(heading(page)).toBeVisible();
  expect(
    await findOnTheList(page, part.name),
    'the Part has left the list',
  ).toBeUndefined();
});

test('the list does not scroll sideways, and meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
  page,
}) => {
  const row = await findOnTheList(page, part.name);
  expect(row).toBeDefined();

  await expectNoSidewaysScroll(page);
  await expectAccessible(page);
});

// From 64rem the list is a table, and an opened Part's edit form shows
// beside it (redesign ticket 10).
test.describe('at a desk’s width', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the list is a table across the sheet, its Part, Offers and Lacks, with no picture, and meets WCAG 2.2 level AA in light and in dark', async ({
    page,
  }) => {
    const row = await findOnTheList(page, part.name);
    expect(row, 'the made-up Part is on the list').toBeDefined();
    const found = row as Locator;

    const table = page.getByRole('table', { name: 'Parts missing specifications' });
    await expect(table.getByRole('columnheader')).toHaveText(['Part', 'Offers', 'Lacks']);
    await expect(found.getByTestId('lacks')).toHaveText('TDP');
    await expect(found.getByTestId('offer-count')).toHaveText('1');
    await expect(found).toContainText('CPU');
    await expect(found.locator('img, [data-testid="category-icon"]')).toHaveCount(0);
    // A heading starts where its column's text does, and the Offers, a
    // count, are end aligned, their cell with them (redesign ticket 10's
    // break-ui and Taste's inspector).
    const partHeading = await table
      .getByRole('columnheader', { name: 'Part' })
      .evaluate(
        (heading) =>
          heading.getBoundingClientRect().left +
          parseFloat(getComputedStyle(heading).paddingInlineStart),
      );
    const name = await found.getByRole('link', { name: part.name }).boundingBox();
    expect(Math.abs((name?.x ?? 0) - partHeading)).toBeLessThan(1);
    await expect(found.getByRole('cell').nth(1)).toHaveCSS('text-align', 'end');
    // The count in words, on the end side, never on a plate.
    await expect(page.getByTestId('missing-specifications-count')).toHaveText(/^[\d,]+$/);
    await expect(page.locator('[data-slot="plate"]')).toHaveCount(0);

    // Until a Part is opened, the list takes the sheet's whole width, but
    // for its 24 pixels of padding on each side and the rows' 8 pixels of
    // bleed past the text on each side.
    const sheet = await page.getByRole('main').boundingBox();
    const list = await table.boundingBox();
    expect(list?.width).toBeGreaterThanOrEqual((sheet?.width ?? 0) - 48 - 2);
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  });

  test('a Part opened from its row shows its edit form beside the list, which marks it as open; once saved, its row leaves the list as the Motion section says', async ({
    page,
  }) => {
    const row = await findOnTheList(page, part.name);
    expect(row, 'the made-up Part is on the list').toBeDefined();
    const found = row as Locator;

    await found.getByRole('link', { name: part.name }).click();
    // Beside the list the form's title is of the second level (redesign
    // ticket 08).
    await expect(
      page.getByRole('heading', { level: 2, name: 'Edit the Part' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText([
      'Missing specifications',
    ]);
    await expect(heading(page)).toBeVisible();
    await expect(found.getByRole('link', { name: part.name })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // The list keeps seven twelfths of the sheet, the form the rest.
    const sheet = await page.getByRole('main').boundingBox();
    const list = await page
      .getByRole('table', { name: 'Parts missing specifications' })
      .boundingBox();
    expect(list?.width).toBeLessThan((sheet?.width ?? 0) * (7 / 12));
    await expectNoSidewaysScroll(page);

    await watchForLeavingRows(page);
    await page.getByRole('textbox', { name: 'TDP (W)', exact: true }).fill('65');
    await page.getByRole('button', { name: 'Save the Part' }).click();

    await expect(
      page.getByRole('heading', { level: 2, name: 'Edit the Part' }),
    ).toHaveCount(0);
    await expect(listedParts(page).filter({ hasText: part.name })).toHaveCount(0);
    const left = (await leavingRowsOf(page)).filter((leaving) =>
      leaving.text.includes(part.name),
    );
    expect(left, 'the saved Part’s row was seen leaving').not.toHaveLength(0);
    for (const leaving of left) {
      expect(leaving.inert, 'a leaving row takes no tap').toBe(true);
      // Its opacity first, 150 ms; then its space closes, 200 ms, after it.
      expect(leaving.transitions).toContainEqual({
        property: 'opacity',
        duration: '0.15s',
        delay: '0s',
      });
      expect(leaving.transitions).toContainEqual({
        property: 'grid-template-rows',
        duration: '0.2s',
        delay: '0.15s',
      });
    }
  });
});
