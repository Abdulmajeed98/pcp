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

// An empty state that is the whole screen, such as a "not found" screen, is
// centred in the window's height, within the sheet, as the owner chose in
// redesign ticket 13: from the top of its icon to the foot of its last
// control, it stands within a few pixels of the window's middle, and the
// page does not scroll to show it.
export async function expectCentredInTheWindow(
  where: Locator,
  title: Locator,
): Promise<void> {
  const page = where.page();
  const icon = where.locator('svg[aria-hidden="true"]').first();
  const controls = where.getByRole('link').or(where.getByRole('button'));
  await expect(title).toBeVisible();
  // Its foot is its last control's, or, with none, as a plain message, its
  // title's.
  const last = (await controls.count()) > 0 ? controls.last() : title;

  const [top, foot, shown] = await Promise.all([
    icon.boundingBox(),
    last.boundingBox(),
    page.evaluate(() => ({
      height: window.innerHeight,
      scrolls: document.documentElement.scrollHeight > window.innerHeight,
    })),
  ]);
  expect(top !== null && foot !== null).toBe(true);
  const middle = ((top?.y ?? 0) + (foot?.y ?? 0) + (foot?.height ?? 0)) / 2;
  expect(
    Math.abs(middle - shown.height / 2),
    `the state's middle, ${middle}, is the window's, ${shown.height / 2}`,
  ).toBeLessThanOrEqual(8);
  expect(shown.scrolls, 'the page does not scroll').toBe(false);
}
