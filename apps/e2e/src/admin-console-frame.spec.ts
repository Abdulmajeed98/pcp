import { expect, type Locator, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { catalogHeading } from './catalog';
import { logInToTheDashboard } from './development-logins';
import { narrowWindow } from './languages';

// The Admin console's frame, as the dashboard's DESIGN.md lays it out (the
// redesign, ticket 07): from 64rem, a Stone Frame holds the sections in a
// sidebar and the caller, the scheme switch and Log out in a top bar, and the
// screen lies on a sheet; on a phone, one bar holds the menu button, which
// opens the menu sheet with the sections, the scheme switch and Log out.

const deskWindow = { width: 1280, height: 800 };

// The scheme switch, by its name.
function schemeSwitch(page: Page): Locator {
  return page.getByRole('group', { name: 'Colour scheme' });
}

// The colour scheme the page is drawn in, as the browser resolves it, and
// the colour of the screen's ground in it.
async function schemeDrawn(page: Page): Promise<{ scheme: string; ground: string }> {
  return page.evaluate(() => ({
    scheme: getComputedStyle(document.documentElement).colorScheme,
    ground: getComputedStyle(document.body).backgroundColor,
  }));
}

// The Sheet's colour in each scheme (DESIGN.md's Colors).
const sheetInLight = 'rgb(255, 255, 255)';
const sheetInDark = 'rgb(22, 22, 22)';

test.describe('on a screen as wide as a desk, under a mouse', () => {
  test.use({ viewport: deskWindow });

  test.beforeEach(async ({ page }) => {
    await logInToTheDashboard(page);
    await expect(catalogHeading(page)).toBeVisible();
  });

  test('the sections are in the sidebar, and the caller, the scheme switch and Log out in the top bar', async ({
    page,
  }) => {
    const sections = page.getByRole('navigation', { name: 'Sections' });
    await expect(sections).toBeVisible();
    await expect(sections.getByRole('link', { name: 'Catalog' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('button', { name: 'Sections' })).toHaveCount(0);

    const topBar = page.getByRole('banner');
    await expect(topBar.getByTestId('caller-name')).toBeVisible();
    await expect(topBar.getByRole('group', { name: 'Colour scheme' })).toBeVisible();
    await expect(topBar.getByTestId('log-out')).toBeVisible();

    await expectAccessible(page);
  });

  test('controls are 36 pixels high', async ({ page }) => {
    for (const control of [
      page.getByTestId('log-out'),
      schemeSwitch(page).getByRole('button', { name: 'Dark' }),
      page.getByRole('navigation', { name: 'Sections' }).getByRole('link', {
        name: 'Vendors',
      }),
    ]) {
      expect((await control.boundingBox())?.height).toBe(36);
    }
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: narrowWindow });

  test.beforeEach(async ({ page }) => {
    await logInToTheDashboard(page);
    await expect(catalogHeading(page)).toBeVisible();
  });

  test('the menu sheet holds the sections, the scheme switch and Log out, and closes back to its button', async ({
    page,
  }) => {
    const menuButton = page.getByRole('button', { name: 'Sections' });
    expect((await menuButton.boundingBox())?.height).toBe(44);
    await expect(page.getByTestId('log-out')).toHaveCount(0);

    await menuButton.click();
    const menu = page.getByRole('dialog', { name: 'Admin console' });
    await expect(menu.getByRole('navigation', { name: 'Sections' })).toBeVisible();
    await expect(menu.getByRole('group', { name: 'Colour scheme' })).toBeVisible();
    await expect(menu.getByTestId('log-out')).toBeVisible();
    expect((await menu.getByTestId('log-out').boundingBox())?.height).toBe(44);

    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(menuButton).toBeFocused();
  });

  test('the menu sheet slides in from the start side on the drawer curve, and only fades with reduced motion', async ({
    page,
  }) => {
    async function sheetsTransition(): Promise<Record<string, string>> {
      await page.getByRole('button', { name: 'Sections' }).click();
      const menu = page.getByRole('dialog', { name: 'Admin console' });
      await expect(menu).toBeVisible();
      const transition = await menu.evaluate((sheet) => {
        const style = getComputedStyle(sheet);
        return {
          property: style.transitionProperty,
          duration: style.transitionDuration,
          curve: style.transitionTimingFunction,
        };
      });
      await page.keyboard.press('Escape');
      await expect(menu).toHaveCount(0);
      return transition;
    }

    const moving = await sheetsTransition();
    expect(moving.property).toContain('translate');
    expect(moving.duration).toContain('0.2s');
    expect(moving.curve).toContain('cubic-bezier(0.32, 0.72, 0, 1)');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const still = await sheetsTransition();
    expect(still.property).not.toContain('translate');
    expect(still.property).toContain('opacity');
  });
});

test.describe('the scheme switch', () => {
  test.use({ viewport: deskWindow, colorScheme: 'light' });

  test('follows the device at first, then the scheme chosen, remembered from before the first paint, until Device is chosen again', async ({
    page,
  }) => {
    // The scheme the document names when its body starts, before anything is
    // drawn and before any script of the dashboard's own has run, on every
    // load. (In development the stylesheet arrives with those scripts, so
    // the colours themselves cannot be read that early.)
    await page.addInitScript(() => {
      new MutationObserver((_, observer) => {
        if (document.body === null) return;
        (window as unknown as { schemeAtFirstPaint?: string }).schemeAtFirstPaint =
          document.documentElement.dataset.scheme;
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await logInToTheDashboard(page);
    await expect(catalogHeading(page)).toBeVisible();

    const device = schemeSwitch(page).getByRole('button', { name: 'Device' });
    const dark = schemeSwitch(page).getByRole('button', { name: 'Dark' });
    await expect(device).toHaveAttribute('aria-pressed', 'true');
    expect(await schemeDrawn(page)).toEqual({ scheme: 'light dark', ground: sheetInLight });

    await dark.click();
    await expect(dark).toHaveAttribute('aria-pressed', 'true');
    expect(await schemeDrawn(page)).toEqual({ scheme: 'dark', ground: sheetInDark });

    await page.reload();
    await expect(catalogHeading(page)).toBeVisible();
    expect(
      await page.evaluate(
        () => (window as unknown as { schemeAtFirstPaint?: string }).schemeAtFirstPaint,
      ),
    ).toBe('dark');
    await expect(dark).toHaveAttribute('aria-pressed', 'true');
    expect(await schemeDrawn(page)).toEqual({ scheme: 'dark', ground: sheetInDark });

    await device.click();
    await expect(device).toHaveAttribute('aria-pressed', 'true');
    expect(await schemeDrawn(page)).toEqual({ scheme: 'light dark', ground: sheetInLight });
    await page.emulateMedia({ colorScheme: 'dark' });
    expect(await schemeDrawn(page)).toEqual({ scheme: 'light dark', ground: sheetInDark });
  });
});
