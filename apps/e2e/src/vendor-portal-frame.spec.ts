import { expect, type Locator, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { vendorPageUrl } from './admin-vendors';
import {
  developmentAdmin,
  logInToTheDashboard,
  openTheDashboardAs,
} from './development-logins';
import { type VendorLoginDetails } from './keycloak-screens';
import { buttonFor, expectNoSidewaysScroll, languages, narrowWindow } from './languages';
import { theMenuButton } from './menu-sheet';
import { theOffersScreen } from './offers';
import { aMadeUpVendorThatHasLoggedIn } from './vendors';

// The Vendor portal's frame, as the dashboard's DESIGN.md lays it out (the
// redesign, ticket 11): from 64rem, a Stone Frame holds the Vendor's name and
// the sections in a sidebar and the language switch, the scheme switch and
// Log out in a top bar, and the screen lies on a sheet; on a phone, one bar
// holds the menu button and the Vendor's name, and the menu sheet holds the
// sections, both switches and Log out. While the Admin acts as a Vendor, a
// band across the whole window, above the frame, names the Vendor.
//
// The browser is set to English. No test quotes the portal's text, which the
// review of the translations may change: the scheme switch, its segments and
// the menu button are found by their test identifiers.

const deskWindow = { width: 1280, height: 800 };
const [kurdish] = languages;

test.use({ locale: 'en', colorScheme: 'light' });

let vendor: VendorLoginDetails;

test.beforeAll(async ({ browser }) => {
  vendor = await aMadeUpVendorThatHasLoggedIn(browser);
});

// The portal's sections, whatever language they are named in.
function sections(page: Page): Locator {
  return page.getByTestId('portal-sections');
}

// The scheme switch, whatever language it is named in.
function schemeSwitch(page: Page | Locator): Locator {
  return page.getByTestId('scheme-switch');
}

// The sheet the screen lies on.
function theSheet(page: Page): Locator {
  return page.getByRole('main');
}

test.describe('on a screen as wide as a desk, under a mouse', () => {
  test.use({ viewport: deskWindow });

  test('the Vendor and the sections are in the sidebar, and the language switch, the scheme switch and Log out in the top bar, each 36 pixels high', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor);
    await expect(theOffersScreen(page)).toBeVisible();

    await expect(sections(page)).toBeVisible();
    await expect(sections(page).getByRole('link').first()).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(theMenuButton(page)).toHaveCount(0);

    const topBar = page.getByRole('banner');
    await expect(topBar.getByTestId('language-switch')).toBeVisible();
    await expect(schemeSwitch(topBar)).toBeVisible();
    await expect(topBar.getByTestId('log-out')).toBeVisible();

    for (const control of [
      page.getByTestId('log-out'),
      buttonFor(page, kurdish),
      schemeSwitch(page).getByTestId('scheme-dark'),
      sections(page).getByRole('link').last(),
    ]) {
      expect((await control.boundingBox())?.height).toBe(36);
    }

    const sheet = await theSheet(page).boundingBox();
    expect(sheet?.x).toBeGreaterThan(200);
    expect(Math.round((sheet?.x ?? 0) + (sheet?.width ?? 0))).toBe(deskWindow.width - 8);

    await expectAccessible(page);
  });

  test('in Kurdish the frame is mirrored: the sidebar on the right, and the sheet inset 8 pixels from the left', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor);
    await buttonFor(page, kurdish).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    const sheet = await theSheet(page).boundingBox();
    const theSections = await sections(page).boundingBox();
    expect(Math.round(sheet?.x ?? 0)).toBe(8);
    expect(theSections?.x).toBeGreaterThan((sheet?.x ?? 0) + (sheet?.width ?? 0));
    await expectNoSidewaysScroll(page);
  });

  test('the Admin acting as the Vendor sees the band across the whole window, above the frame', async ({
    page,
  }) => {
    await logInToTheDashboard(
      page,
      developmentAdmin,
      `${vendorPageUrl(vendor.vendorId)}/portal`,
    );
    await expect(theOffersScreen(page)).toBeVisible();

    const band = await page.getByTestId('acting-band').boundingBox();
    const theSections = await sections(page).boundingBox();
    const sheet = await theSheet(page).boundingBox();
    expect(band).toMatchObject({ x: 0, y: 0, width: deskWindow.width });
    expect(theSections?.y).toBeGreaterThanOrEqual((band?.y ?? 0) + (band?.height ?? 0));
    expect((theSections?.x ?? 0) + (theSections?.width ?? 0)).toBeLessThan(sheet?.x ?? 0);
    // On Active Stone, in the light scheme the browser is in.
    expect(
      await page
        .getByTestId('acting-band')
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    ).toBe('rgb(233, 232, 229)');

    await expectAccessible(page);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: narrowWindow });

  test('the bar names the Vendor, and the menu sheet holds the sections, the language switch, the scheme switch and Log out, 44 pixels high, and closes back to its button', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor);
    await expect(theOffersScreen(page)).toBeVisible();

    const menuButton = theMenuButton(page);
    expect((await menuButton.boundingBox())?.height).toBe(44);
    await expect(page.getByTestId('log-out')).toHaveCount(0);
    await expect(page.getByTestId('language-switch')).toHaveCount(0);

    await menuButton.click();
    const menu = page.getByRole('dialog');
    await expect(menu).toContainText(vendor.vendorName);
    await expect(menu.getByTestId('portal-sections')).toBeVisible();
    await expect(menu.getByTestId('language-switch')).toBeVisible();
    await expect(schemeSwitch(menu)).toBeVisible();
    for (const control of [
      menu.getByTestId('log-out'),
      buttonFor(page, kurdish),
      menu.getByTestId('portal-sections').getByRole('link').last(),
    ]) {
      expect((await control.boundingBox())?.height).toBe(44);
    }

    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(menuButton).toBeFocused();
    await expectNoSidewaysScroll(page);
  });
});
