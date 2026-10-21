import { expect, type Locator } from '@playwright/test';

// The dashboard's empty state, as its DESIGN.md draws it (States): centred,
// with the screen's icon drawn plain, with no tinted square, above its
// title. A screen that is nothing but a message, such as a "not found"
// screen, is drawn as one (the redesign, ticket 13). `title` is the title's
// element, and `where` what holds the state and its icon.
export async function expectTheEmptyState(where: Locator, title: Locator): Promise<void> {
  const icon = where.locator('svg[aria-hidden="true"]').first();
  await expect(icon).toBeVisible();
  await expect(title).toBeVisible();

  const [iconBox, titleBox] = await Promise.all([icon.boundingBox(), title.boundingBox()]);
  expect(
    iconBox !== null && titleBox !== null && iconBox.y + iconBox.height <= titleBox.y,
    'the icon is above the title',
  ).toBe(true);
  expect(
    await title.evaluate((element) => getComputedStyle(element).textAlign),
    'the title is centred',
  ).toBe('center');
  expect(
    await icon.evaluate(
      (element) => getComputedStyle(element.parentElement as Element).backgroundColor,
    ),
    'the icon is drawn plain, with no tinted square',
  ).toBe('rgba(0, 0, 0, 0)');
}
