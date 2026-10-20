import { expect, type Locator, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { openTheSection } from './admin-vendors';
import { catalogHeading, createAMadeUpPart, type MadeUpPart } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import { apiUrl, dashboardUrl } from './platform';
import { createAMadeUpVendor } from './vendors';

// The Admin keeps compatibility checking whole from a phone, in a Vendor's
// shop (CAT-8, LANG-8).
test.use({ viewport: narrowWindow });

const missingSpecificationsUrl = `${dashboardUrl}/missing-specifications`;

function heading(page: Page): Locator {
  return page.getByRole('heading', { level: 1, name: 'Missing specifications' });
}

function listedParts(page: Page): Locator {
  return page
    .getByRole('list', { name: 'Parts missing specifications' })
    .getByRole('listitem');
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

  // The list returns to the page the Part was found on, which the
  // development database's earlier made-up Parts may have made a later one.
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
