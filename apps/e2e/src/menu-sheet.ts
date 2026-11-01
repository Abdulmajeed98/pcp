import { expect, type Locator, type Page } from '@playwright/test';

// The menu button of a frame's bar on a phone, in either half of the
// dashboard and whatever language it is named in: the button in the bar that
// opens a dialog, the menu sheet. On a screen as wide as a desk's there is
// none.
export function theMenuButton(page: Page): Locator {
  return page.getByRole('banner').first().locator('button[aria-haspopup="dialog"]');
}

// The menu sheet, while it is open.
export function theMenuSheet(page: Page): Locator {
  return page.getByRole('dialog');
}

// Opens the menu sheet on a phone, where a frame keeps its sections, its
// switches and Log out in it, and says whether it opened one. On a wider
// screen they are in the frame itself, and nothing is opened.
export async function openTheMenuOnAPhone(page: Page): Promise<boolean> {
  await page.getByRole('banner').first().waitFor();
  if (!(await theMenuButton(page).isVisible())) return false;
  await theMenuButton(page).click();
  await expect(theMenuSheet(page)).toBeVisible();
  return true;
}

// Closes the menu sheet, if it is still open. While it is open, what is
// behind it is hidden from the accessibility tree, the menu button with it,
// so the sheet itself is asked for.
export async function closeTheMenu(page: Page): Promise<void> {
  if (await theMenuSheet(page).isVisible()) {
    await page.keyboard.press('Escape');
    await expect(theMenuSheet(page)).toHaveCount(0);
  }
}

// Does what a test asks with the frame's menu sheet open, on a phone, and
// closes the sheet again unless what was done left the page. On a wider
// screen the sheet is not opened.
export async function withTheMenuOpenOnAPhone<Done>(
  page: Page,
  then: () => Promise<Done>,
): Promise<Done> {
  const opened = await openTheMenuOnAPhone(page);
  const done = await then();
  if (opened) await closeTheMenu(page);
  return done;
}
