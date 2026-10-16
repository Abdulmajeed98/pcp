import {
  type Browser,
  type BrowserContext,
  expect,
  type Page,
  test,
} from '@playwright/test';

import {
  type DevelopmentLogin,
  developmentAdmin,
  developmentVendor,
  logInToTheDashboard,
  logOutOfTheDashboard,
  openTheDashboardAs,
} from './development-logins';
import {
  buttonFor,
  checkInEveryLanguageOfTheVendorPortal,
  expectADifferentTextInEachLanguage,
  expectNoSidewaysScroll,
  expectPageIn,
  type Language,
  languageSwitch,
  languages,
  narrowWindow,
  readInEveryLanguageOfTheVendorPortal,
} from './languages';
import { dashboardUrl, keycloakUrl } from './platform';
import {
  expectDrawnAsWritten,
  expectTheNumbers,
  expectTheSameInEveryLanguage,
  expectTheWholeSample,
  partName,
  readTheCategoryNames,
  readTheLinesAsWritten,
  specification,
} from './sample';

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

// What a browser keeps for the dashboard, from one visit to the next, apart
// from its cookies. The login is kept in Keycloak's cookies, and a browser
// given these alone has to log in again.
type KeptByTheDashboard = Awaited<ReturnType<BrowserContext['storageState']>>['origins'];

// The same, in a browser of its own, set to `locale`, as wide as a narrow
// phone. It may be given what an earlier browser kept for the dashboard, and
// gives back what this one kept.
async function openInABrowserSetTo<Read>(
  browser: Browser,
  locale: string,
  login: DevelopmentLogin,
  read: (page: Page) => Promise<Read>,
  kept: KeptByTheDashboard = [],
): Promise<{ found: Read; kept: KeptByTheDashboard }> {
  const context = await browser.newContext({
    locale,
    viewport: narrowWindow,
    storageState: { cookies: [], origins: kept },
  });
  try {
    const page = await context.newPage();
    await openTheDashboardAs(page, login);
    const found = await read(page);
    const { origins } = await context.storageState();
    return { found, kept: origins.filter(({ origin }) => origin === dashboardUrl) };
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
    const {
      found: { notice, title },
    } = await openInABrowserSetTo(browser, locale, developmentVendor, async (page) => {
      await expectPageIn(page, expected);
      return {
        notice: await page.getByTestId('placeholder-notice').innerText(),
        title: await page.title(),
      };
    });
    notices.set(expected, notice);
    titles.set(expected, title);
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

test('the development Vendor gets the page with the language switch, and the development Admin gets a page without one', async ({
  browser,
}) => {
  await openInABrowserSetTo(browser, 'ar', developmentVendor, async (page) => {
    await expectPageIn(page, arabic);
    await expect(languageSwitch(page).getByRole('button')).toHaveCount(languages.length);
  });
  await openInABrowserSetTo(browser, 'ar', developmentAdmin, async (page) => {
    await expectPageIn(page, english);
    await expect(languageSwitch(page)).toHaveCount(0);
  });
});

// The helper taps the switch for each language in turn, and checks the
// switch in each: the three languages under their own names, the one the
// portal is in shown as pressed, and each inside the screen, large enough to
// tap, on the end side of the frame.
test('in each language the switch is inside the screen, large enough to tap, and on the end side of the frame', async ({
  page,
}) => {
  await openTheDashboardAs(page, developmentVendor);

  await checkInEveryLanguageOfTheVendorPortal(page);
});

test("a tap on another language changes the language, the direction and the tab's title in place: the page is not loaded again and Keycloak is not visited", async ({
  page,
}) => {
  await openTheDashboardAs(page, developmentVendor);
  await expectPageIn(page, arabic);
  const titles = new Map<Language, string>([[arabic, await page.title()]]);

  // A page that is loaded again loses what was set on it, and every
  // request the browser makes is seen.
  await page.evaluate(() => Object.assign(window, { stillTheSamePage: true }));
  const pagesLoaded: string[] = [];
  const keycloakVisits: string[] = [];
  page.on('request', (request) => {
    if (request.isNavigationRequest()) pagesLoaded.push(request.url());
    if (request.url().startsWith(`${keycloakUrl}/`)) keycloakVisits.push(request.url());
  });

  for (const next of [english, kurdish]) {
    await buttonFor(page, next).click();

    await expectPageIn(page, next);
    titles.set(next, await page.title());
  }

  expectADifferentTextInEachLanguage(titles);
  await expect(page.getByTestId('caller-name')).toHaveText(developmentVendor.name);
  expect(await page.evaluate(() => 'stillTheSamePage' in window)).toBe(true);
  expect(pagesLoaded).toEqual([]);
  expect(keycloakVisits).toEqual([]);
});

// A browser set to English is given what another browser kept for the
// dashboard. A language that was only found from the browser's own is not
// kept: the Vendor portal follows each browser's language. One chosen with
// the switch is kept, and the Vendor portal opens in it.
test('a language the Vendor portal only found from the browser is not remembered, and one chosen with the switch is', async ({
  browser,
}) => {
  const inArabic = await openInABrowserSetTo(browser, 'ar', developmentVendor, (page) =>
    expectPageIn(page, arabic),
  );
  const switched = await openInABrowserSetTo(
    browser,
    'en',
    developmentVendor,
    async (page) => {
      await expectPageIn(page, english);
      await buttonFor(page, kurdish).click();
      await expectPageIn(page, kurdish);
    },
    inArabic.kept,
  );
  await openInABrowserSetTo(
    browser,
    'en',
    developmentVendor,
    (page) => expectPageIn(page, kurdish),
    switched.kept,
  );
});

test.describe('in a browser set to English', () => {
  test.use({ locale: 'en' });

  test('the choice holds after a reload, and after logging out and in again', async ({
    page,
  }) => {
    await openTheDashboardAs(page, developmentVendor);
    await expectPageIn(page, english);
    await buttonFor(page, arabic).click();
    await expectPageIn(page, arabic);

    await page.reload();
    await expect(page.getByTestId('caller-name')).toHaveText(developmentVendor.name);
    await expectPageIn(page, arabic);

    await logOutOfTheDashboard(page);
    await openTheDashboardAs(page, developmentVendor);
    await expectPageIn(page, arabic);
  });

  test('after the development Vendor has chosen Arabic and logged out, the development Admin in the same browser still gets English, and when the development Vendor logs in again, Arabic is still remembered', async ({
    page,
  }) => {
    await openTheDashboardAs(page, developmentVendor);
    await buttonFor(page, arabic).click();
    await expectPageIn(page, arabic);
    await logOutOfTheDashboard(page);

    await openTheDashboardAs(page, developmentAdmin);
    await expectPageIn(page, english);
    await logOutOfTheDashboard(page);

    await openTheDashboardAs(page, developmentVendor);
    await expectPageIn(page, arabic);
  });

  // The login could not be completed when Keycloak's answer to the
  // dashboard's last step of it never arrives. Nobody is known then, so the
  // message follows the Vendor portal's rule, the remembered choice first.
  test('the message for a login that could not be completed follows the remembered choice', async ({
    page,
  }) => {
    await openTheDashboardAs(page, developmentVendor);
    await buttonFor(page, arabic).click();
    await expectPageIn(page, arabic);
    await logOutOfTheDashboard(page);

    await page.route(`${keycloakUrl}/**/protocol/openid-connect/token`, (route) =>
      route.abort(),
    );
    await logInToTheDashboard(page, developmentVendor);

    await expect(page.getByTestId('login-failed')).toBeVisible();
    await expectPageIn(page, arabic);
  });
});

// The language choice is the one thing the dashboard keeps in the browser's
// storage. The tokens stay in memory.
test("with a language remembered, the browser's storage still holds no token", async ({
  page,
}) => {
  const answered = page.waitForResponse(
    (response) =>
      response.url().endsWith('/v1/caller') && response.request().method() === 'GET',
  );
  await openTheDashboardAs(page, developmentVendor);
  const token = (await answered).request().headers().authorization.replace('Bearer ', '');
  await buttonFor(page, english).click();
  await expectPageIn(page, english);

  await page.reload();
  await expectPageIn(page, english);
  const stored = await page.evaluate(() => [
    ...Object.values({ ...localStorage }),
    ...Object.values({ ...sessionStorage }),
  ]);

  expect(token.split('.')).toHaveLength(3);
  expect(stored.filter((value) => value.includes(token) || value.includes('eyJ'))).toEqual(
    [],
  );
});

// The Vendor portal's placeholder shows the sample the Shopper app's page
// shows, with the same values, built from the same parts. The helper shows it
// in each language by the switch, and finds an Arabic-Indic digit anywhere
// on it. Its browser is one in which a number that i18next formats for
// Kurdish comes out in those digits.
test.describe("the Vendor portal's sample, as the development Vendor", () => {
  test.beforeEach(async ({ page }) => {
    await openTheDashboardAs(page, developmentVendor);
  });

  test('the sample number reads 1,575,000 in all three languages, and no Arabic-Indic digit is anywhere on the page in any language, the counted sentences among it', async ({
    page,
  }) => {
    await readInEveryLanguageOfTheVendorPortal(page, () => expectTheNumbers(page));
  });

  test('the Part name and the specification are the same characters in all three languages, and each carries a left-to-right direction of its own', async ({
    page,
  }) => {
    await readInEveryLanguageOfTheVendorPortal(page, async () => {
      await expectDrawnAsWritten(page, partName);
      await expectDrawnAsWritten(page, specification);
    });
  });

  test('the two as-written lines are the same in all three languages, and each carries its own direction', async ({
    page,
  }) => {
    const written = await readInEveryLanguageOfTheVendorPortal(page, () =>
      readTheLinesAsWritten(page),
    );

    expectTheSameInEveryLanguage(written);
  });

  // The Category names are the shared terms, which the Shopper reads too.
  test('the list of Category names is different in each of the three languages', async ({
    page,
  }) => {
    const lists = await readInEveryLanguageOfTheVendorPortal(page, () =>
      readTheCategoryNames(page),
    );

    expectADifferentTextInEachLanguage(lists);
  });

  test('with the sample on it, the page still does not scroll sideways in any language', async ({
    page,
  }) => {
    await readInEveryLanguageOfTheVendorPortal(page, () => expectTheWholeSample(page));
  });
});
