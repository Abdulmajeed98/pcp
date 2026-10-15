import { type Browser, expect, type Page, test } from '@playwright/test';

import {
  type DevelopmentLogin,
  developmentAdmin,
  developmentVendor,
  logInToTheDashboard,
} from './development-logins';
import {
  expectADifferentTextInEachLanguage,
  expectNoSidewaysScroll,
  expectPageIn,
  type Language,
  languages,
  narrowWindow,
} from './languages';

const [kurdish, arabic, english] = languages;

// What a browser can be set to, and the language the Vendor portal is then
// expected in: the browser's own when the platform has it, and Kurdish when
// it does not.
const browsersSetTo = [
  { setTo: 'Arabic', locale: 'ar', expected: arabic },
  { setTo: 'English', locale: 'en', expected: english },
  { setTo: 'French', locale: 'fr', expected: kurdish },
] as const;

const directions = { rtl: 'right to left', ltr: 'left to right' };

// Logs in as one of the development logins, and waits until the dashboard
// shows who the API says the caller is. The page is then drawn whole, in
// whichever half and language it chose.
async function openTheDashboardAs(page: Page, login: DevelopmentLogin): Promise<void> {
  await logInToTheDashboard(page, login);
  await expect(page.getByTestId('caller-name')).toHaveText(login.name);
}

// The same, in a browser of its own, set to `locale`, as wide as a narrow
// phone.
async function openInABrowserSetTo<Read>(
  browser: Browser,
  locale: string,
  login: DevelopmentLogin,
  read: (page: Page) => Promise<Read>,
): Promise<Read> {
  const context = await browser.newContext({ locale, viewport: narrowWindow });
  try {
    const page = await context.newPage();
    await openTheDashboardAs(page, login);
    return await read(page);
  } finally {
    await context.close();
  }
}

for (const { setTo, locale, expected } of browsersSetTo) {
  test.describe(`as the development Vendor, with the browser set to ${setTo}`, () => {
    test.use({ locale });

    test(`the Vendor portal declares ${expected.name} and ${directions[expected.direction]}`, async ({
      page,
    }) => {
      await openTheDashboardAs(page, developmentVendor);

      await expectPageIn(page, expected);
    });

    test(`the Vendor portal's page does not scroll sideways in ${expected.name}`, async ({
      page,
    }) => {
      await openTheDashboardAs(page, developmentVendor);
      await expectPageIn(page, expected);

      await expect(page.getByTestId('frame')).toBeVisible();
      await expectNoSidewaysScroll(page);
    });
  });
}

test("the Vendor portal's text and its tab's title differ in each of the three languages", async ({
  browser,
}) => {
  const notices = new Map<Language, string>();
  const titles = new Map<Language, string>();
  for (const { locale, expected } of browsersSetTo) {
    await openInABrowserSetTo(browser, locale, developmentVendor, async (page) => {
      await expectPageIn(page, expected);
      notices.set(expected, await page.getByTestId('placeholder-notice').innerText());
      titles.set(expected, await page.title());
    });
  }

  expectADifferentTextInEachLanguage(notices);
  expectADifferentTextInEachLanguage(titles);
});

test.describe('as the development Admin, with the browser set to Arabic', () => {
  test.use({ locale: 'ar' });

  test('the Admin console declares English and left to right', async ({ page }) => {
    await openTheDashboardAs(page, developmentAdmin);

    await expectPageIn(page, english);
  });

  test("the Admin console's page does not scroll sideways", async ({ page }) => {
    await openTheDashboardAs(page, developmentAdmin);
    await expectPageIn(page, english);

    await expectNoSidewaysScroll(page);
  });
});
