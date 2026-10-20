import {
  type Browser,
  type BrowserContext,
  expect,
  type Locator,
  type Page,
  test,
} from '@playwright/test';

import {
  authorizationOfTheDevelopmentAdmin,
  developmentAdmin,
  logInToTheDashboard,
  logOutOfTheDashboard,
  openTheDashboardAs,
  vendorNameInTheFrame,
} from './development-logins';
import { type LoginDetails, type VendorLoginDetails } from './keycloak-screens';
import {
  buttonFor,
  checkInEveryLanguageOfTheVendorPortal,
  expectADifferentTextInEachLanguage,
  expectNoSidewaysScroll,
  expectPageIn,
  type Language,
  languageSwitch,
  languages,
  layoutOf,
  linesAsDrawn,
  narrowWindow,
  readInEveryLanguageOfTheVendorPortal,
} from './languages';
import { createAMadeUpPart, type MadeUpPart } from './catalog';
import {
  addAnOffer,
  answerTheOffersAsExpiring,
  offerField,
  removeTheOffer,
  rowOfFoundPart,
  rowOfOffer,
  saveTheOffer,
  searchTheCatalogFor,
  theBanner,
  theOfferForm,
  theRemovalDialog,
} from './offers';
import { dashboardUrl, keycloakUrl } from './platform';
import { expectTheSameInEveryLanguage } from './sample';
import {
  aMadeUpMobileNumber,
  aMadeUpVendorThatHasLoggedIn,
  answerAsForALoginWithNoVendor,
  inIraqsOwnForm,
} from './vendors';

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

// What the made-up Vendor these tests log in as wrote, as a Vendor in Erbil
// may write it: its address and its opening hours in Sorani, in the Arabic
// script, with Arabic-Indic digits, the address on two lines. Its name is in
// Latin script, so that what it wrote runs in both directions.
const addressAsWritten = 'شەقامی ٦٠ مەتری، نزیک بازاڕی ١٠٠\nهەولێر';
const openingHoursAsWritten = 'شەممە تا پێنجشەممە: ٩ بۆ ٩';
const instagramName = 'made_up.vendor';
const whatsAppNumber = aMadeUpMobileNumber();

// The Vendor these tests log in as: a made-up one, made once for the file
// with every detail, which has been through its first login, as a real
// Vendor has.
let vendor: VendorLoginDetails;

// The Part the Vendor offers, in an Offer added over HTTP, quoted in both
// currencies, with prices large enough to be grouped in thousands.
let offered: MadeUpPart;
let offeredId: string;

// A Part the Vendor does not offer, whose form for a new Offer the tests
// open.
let notOffered: MadeUpPart;

test.beforeAll(async ({ browser }) => {
  vendor = await aMadeUpVendorThatHasLoggedIn(browser, {
    address: addressAsWritten,
    openingHours: openingHoursAsWritten,
    mapLocation: { latitude: 36.1911744, longitude: 44.0094145 },
    whatsAppNumber,
    instagramName,
  });
  const adminsContext = await browser.newContext();
  try {
    const authorization = await authorizationOfTheDevelopmentAdmin(
      await adminsContext.newPage(),
    );
    offered = await createAMadeUpPart(adminsContext.request, authorization);
    notOffered = await createAMadeUpPart(adminsContext.request, authorization);
    offeredId = await addAnOffer(
      adminsContext.request,
      authorization,
      vendor.vendorId,
      offered.id,
      {
        usdPrice: '1250.5',
        iqdPrice: 1_875_000,
        warrantyMonths: 12,
      },
    );
  } finally {
    await adminsContext.close();
  }
});

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
  login: LoginDetails,
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
  test.describe(`as a made-up Vendor, with the browser set to ${setTo}`, () => {
    test.use({ locale });

    test(`the Vendor portal declares ${expected.name} and ${directions[expected.direction]}`, async ({
      page,
    }) => {
      await openTheDashboardAs(page, vendor);

      await expectPageIn(page, expected);
    });

    test(`the Vendor portal's page does not scroll sideways in ${expected.name}`, async ({
      page,
    }) => {
      await openTheDashboardAs(page, vendor);
      await expectPageIn(page, expected);

      await expect(page.getByTestId('frame')).toBeVisible();
      await expectNoSidewaysScroll(page);
    });
  });
}

test("the Vendor portal's text and its tab's title differ in each of the three languages", async ({
  browser,
}) => {
  const headings = new Map<Language, string>();
  const titles = new Map<Language, string>();
  for (const { locale, expected } of browsersSetTo) {
    const {
      found: { heading, title },
    } = await openInABrowserSetTo(browser, locale, vendor, async (page) => {
      await expectPageIn(page, expected);
      return {
        heading: await detailsHeading(page).innerText(),
        title: await page.title(),
      };
    });
    headings.set(expected, heading);
    titles.set(expected, title);
  }

  expectADifferentTextInEachLanguage(headings);
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

test('a made-up Vendor gets the page with the language switch, and the development Admin gets a page without one', async ({
  browser,
}) => {
  await openInABrowserSetTo(browser, 'ar', vendor, async (page) => {
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
  await openTheDashboardAs(page, vendor);

  await checkInEveryLanguageOfTheVendorPortal(page);
});

test("a tap on another language changes the language, the direction and the tab's title in place: the page is not loaded again and Keycloak is not visited", async ({
  page,
}) => {
  await openTheDashboardAs(page, vendor);
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
  await expect(vendorNameInTheFrame(page)).toHaveText(vendor.vendorName);
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
  const inArabic = await openInABrowserSetTo(browser, 'ar', vendor, (page) =>
    expectPageIn(page, arabic),
  );
  const switched = await openInABrowserSetTo(
    browser,
    'en',
    vendor,
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
    vendor,
    (page) => expectPageIn(page, kurdish),
    switched.kept,
  );
});

test.describe('in a browser set to English', () => {
  test.use({ locale: 'en' });

  test('the choice holds after a reload, and after logging out and in again', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor);
    await expectPageIn(page, english);
    await buttonFor(page, arabic).click();
    await expectPageIn(page, arabic);

    await page.reload();
    await expect(vendorNameInTheFrame(page)).toHaveText(vendor.vendorName);
    await expectPageIn(page, arabic);

    await logOutOfTheDashboard(page);
    await openTheDashboardAs(page, vendor);
    await expectPageIn(page, arabic);
  });

  test('after a made-up Vendor has chosen Arabic and logged out, the development Admin in the same browser still gets English, and when the Vendor logs in again, Arabic is still remembered', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor);
    await buttonFor(page, arabic).click();
    await expectPageIn(page, arabic);
    await logOutOfTheDashboard(page);

    await openTheDashboardAs(page, developmentAdmin);
    await expectPageIn(page, english);
    await logOutOfTheDashboard(page);

    await openTheDashboardAs(page, vendor);
    await expectPageIn(page, arabic);
  });

  // The login could not be completed when Keycloak's answer to the
  // dashboard's last step of it never arrives. Nobody is known then, so the
  // message follows the Vendor portal's rule, the remembered choice first.
  test('the message for a login that could not be completed follows the remembered choice', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor);
    await buttonFor(page, arabic).click();
    await expectPageIn(page, arabic);
    await logOutOfTheDashboard(page);

    await page.route(`${keycloakUrl}/**/protocol/openid-connect/token`, (route) =>
      route.abort(),
    );
    await logInToTheDashboard(page, vendor);

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
      response.url().endsWith('/v1/caller/vendor') && response.request().method() === 'GET',
  );
  await openTheDashboardAs(page, vendor);
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

// The Offers screen, the portal's first, holds the two kinds of text the
// details screen lacks, which `accounts` ticket 07 left for `offers`: a
// sentence that counts, the count of Offers, and a Category name, from the
// shared terms. Its Part names and its prices are English in every language.
test.describe('the Offers screen, as a made-up Vendor with an Offer', () => {
  test.beforeEach(async ({ page }) => {
    await openTheDashboardAs(page, vendor);
    await expect(rowOfOffer(page, offered.name)).toBeVisible();
  });

  test('passes the checks of every screen of the Vendor portal, in all three languages; its counting sentence and its Category name differ in each, and the Part name and the prices are drawn left to right, in Western digits', async ({
    page,
  }) => {
    const row = rowOfOffer(page, offered.name);
    const texts = await readInEveryLanguageOfTheVendorPortal(page, async () => {
      await expectInEnglish(row.getByTestId('part-name'), offered.name);
      await expectInEnglish(row.getByTestId('usd-price'), '1,250.50 $');
      await expectInEnglish(row.getByTestId('iqd-price'), '1,875,000 IQD');
      return {
        counted: await page.getByTestId('offers-counted').innerText(),
        category: await row.getByTestId('category').innerText(),
        warranty: await row.getByTestId('warranty').innerText(),
      };
    });

    for (const part of ['counted', 'category', 'warranty'] as const) {
      expectADifferentTextInEachLanguage(
        new Map([...texts].map(([language, read]) => [language, read[part]])),
      );
    }
  });
});

// The catalog search, from which an Offer is added, holds a sentence that
// counts, the Parts found, and the Category filter, whose names are the
// shared terms. The Part's name and its part number are English in every
// language.
test.describe('the catalog search, as a made-up Vendor, with the Part it offers found', () => {
  test.beforeEach(async ({ page }) => {
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/add`);
    await searchTheCatalogFor(page, offered.partNumber);
    await expect(rowOfFoundPart(page, offered.name).getByTestId('offered')).toBeVisible();
  });

  test('passes the checks of every screen of the Vendor portal, in all three languages; its counting sentence, the Category filter and the mark of an offered Part differ in each, and the Part name and its number are drawn left to right', async ({
    page,
  }) => {
    const row = rowOfFoundPart(page, offered.name);
    const texts = await readInEveryLanguageOfTheVendorPortal(page, async () => {
      await expectInEnglish(row.getByTestId('part-name'), offered.name);
      await expectInEnglish(row.getByTestId('part-numbers'), offered.partNumber);
      return {
        found: await page.getByTestId('parts-found').innerText(),
        categories: (await page.locator('#catalog-category option').allInnerTexts()).join(
          ', ',
        ),
        category: await row.getByTestId('category').innerText(),
        offered: await row.getByTestId('offered').innerText(),
      };
    });

    for (const part of ['found', 'categories', 'category', 'offered'] as const) {
      expectADifferentTextInEachLanguage(
        new Map([...texts].map(([language, read]) => [language, read[part]])),
      );
    }
  });
});

// The form for a new Offer, opened from the search, with a refusal shown
// beside the USD field.
test.describe('the form for a new Offer, as a made-up Vendor', () => {
  test.beforeEach(async ({ page }) => {
    await openTheDashboardAs(
      page,
      vendor,
      `${dashboardUrl}/add/${notOffered.id}?search=${notOffered.partNumber}`,
    );
    await expect(theOfferForm(page)).toBeVisible();
  });

  test('passes the checks of every screen of the Vendor portal, in all three languages, with a refusal shown, and its text differs in each', async ({
    page,
  }) => {
    await saveTheOffer(page).click();
    await expect(page.locator('#offer-form-usdPrice-error')).toBeVisible();

    const texts = await readInEveryLanguageOfTheVendorPortal(page, async () => {
      await expectInEnglish(theOfferForm(page).getByTestId('part-name'), notOffered.name);
      return {
        form: await page.getByRole('main').innerText(),
        refusal: await page.locator('#offer-form-usdPrice-error').innerText(),
      };
    });

    for (const part of ['form', 'refusal'] as const) {
      expectADifferentTextInEachLanguage(
        new Map([...texts].map(([language, read]) => [language, read[part]])),
      );
    }
  });
});

// The form that changes the Vendor's Offer, with the alert dialog that asks
// to confirm its removal open over it. The dialog keeps the switch from a
// tap while it is open, so it is closed before each tap and opened again
// after, and every check runs with it open. Nothing is removed.
test.describe('the form that changes an Offer, as a made-up Vendor, with the removal dialog open', () => {
  test.beforeEach(async ({ page }) => {
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/offers/${offeredId}`);
    await expect(theOfferForm(page)).toBeVisible();
  });

  test('passes the checks of every screen of the Vendor portal, in all three languages; the form and the dialog differ in each, and the Part name is drawn left to right', async ({
    page,
  }) => {
    const texts = await readInEveryLanguageOfTheVendorPortal(
      page,
      async () => {
        await expectInEnglish(
          theRemovalDialog(page).getByTestId('part-name'),
          offered.name,
        );
        return {
          form: await theOfferForm(page).innerText(),
          dialog: await theRemovalDialog(page).innerText(),
        };
      },
      {
        open: async () => {
          await removeTheOffer(page).click();
          await expect(theRemovalDialog(page)).toBeVisible();
        },
        close: async () => {
          await theRemovalDialog(page).getByTestId('cancel-removal').click();
          await expect(theRemovalDialog(page)).toHaveCount(0);
        },
      },
    );

    for (const part of ['form', 'dialog'] as const) {
      expectADifferentTextInEachLanguage(
        new Map([...texts].map(([language, read]) => [language, read[part]])),
      );
    }
    await expect(offerField(page, 'usdPrice')).toHaveValue('1,250.50');
    await expect(offerField(page, 'iqdPrice')).toHaveValue('1,875,000');
  });
});

// The banner's two counts and the result of confirm-all are sentences that
// count. The banner is given by an answer of the test's own, and confirm-all
// asks the real API.
test("the banner and confirm-all's result pass the checks of every screen of the Vendor portal, and differ in each of the three languages", async ({
  page,
}) => {
  await answerTheOffersAsExpiring(page, vendor.vendorId, {
    offers: 3,
    expired: 1,
    aboutToExpire: 2,
  });
  await openTheDashboardAs(page, vendor);
  await expect(theBanner(page)).toBeVisible();

  const banners = await readInEveryLanguageOfTheVendorPortal(page, () =>
    theBanner(page).innerText(),
  );
  expectADifferentTextInEachLanguage(banners);

  await theBanner(page).getByRole('button').click();
  await expect(page.getByTestId('confirmed-count')).toBeVisible();
  const results = await readInEveryLanguageOfTheVendorPortal(page, () =>
    page.getByTestId('confirmed').innerText(),
  );
  expectADifferentTextInEachLanguage(results);
});

// The details screen holds each kind of text the placeholder's sample held,
// but for a sentence that counts and the Category names: what the Vendor
// wrote, shown as written, and what is in English in every language, its
// phone numbers and its Instagram name. The helper shows it in each language
// by the switch, and finds an Arabic-Indic digit anywhere on it but in what
// the Vendor wrote. Its browser is one in which a number that i18next formats
// for Kurdish comes out in those digits.
test.describe('the details screen, as a made-up Vendor', () => {
  test.beforeEach(async ({ page }) => {
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/details`);
    await expect(detailsHeading(page)).toBeVisible();
  });

  test('passes the checks of every screen of the Vendor portal, in all three languages', async ({
    page,
  }) => {
    await checkInEveryLanguageOfTheVendorPortal(page);
  });

  test("its text differs in each of the three languages, the city's name from the shared terms among it", async ({
    page,
  }) => {
    const texts = await readInEveryLanguageOfTheVendorPortal(page, async () => ({
      labels: (await page.locator('main dt').allInnerTexts()).join(', '),
      sentence: await page.getByTestId('admin-changes').innerText(),
      city: await detailOf(page, 'city').innerText(),
    }));

    for (const part of ['labels', 'sentence', 'city'] as const) {
      expectADifferentTextInEachLanguage(
        new Map([...texts].map(([language, read]) => [language, read[part]])),
      );
    }
  });

  test('the address is drawn exactly as written, Arabic-Indic digits and all, as are the name and the opening hours, each in its own direction, the same in all three languages', async ({
    page,
  }) => {
    const written = await readInEveryLanguageOfTheVendorPortal(page, async () => {
      await expectDrawnAsWritten(
        detailOf(page, 'address').locator('bdi'),
        addressAsWritten,
      );
      await expectDrawnAsWritten(
        detailOf(page, 'openingHours').locator('bdi'),
        openingHoursAsWritten,
      );
      await expectDrawnAsWritten(detailOf(page, 'name').locator('bdi'), vendor.vendorName);
      await expectDrawnAsWritten(vendorNameInTheFrame(page), vendor.vendorName);
      return detailOf(page, 'address').innerText();
    });

    expectTheSameInEveryLanguage(written);
  });

  test("the phone numbers are in Iraq's own form in Western digits, and they and the Instagram name are drawn left to right, kept apart from the text around them, in all three languages", async ({
    page,
  }) => {
    const loginPhoneNumber = inIraqsOwnForm(vendor.name);
    await readInEveryLanguageOfTheVendorPortal(page, async () => {
      // A made-up Vendor's phone number is its login phone number.
      for (const detail of ['phoneNumber', 'loginPhoneNumber']) {
        await expectInEnglish(detailOf(page, detail).locator('bdi'), loginPhoneNumber);
      }
      await expectInEnglish(
        detailOf(page, 'whatsAppNumber').locator('bdi'),
        inIraqsOwnForm(`+964${whatsAppNumber.slice(1)}`),
      );
      await expectInEnglish(
        detailOf(page, 'instagramName').locator('bdi'),
        `@${instagramName}`,
      );
    });
  });

  test("the map location is a link to Google Maps' search for its coordinates", async ({
    page,
  }) => {
    const link = detailOf(page, 'mapLocation').getByRole('link');

    await expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=36.1911744%2C44.0094145',
    );
  });
});

// The form in which the Vendor changes its contact details, opened from the
// details screen by its link. It is filled with what the Vendor wrote, which
// the helper leaves out of its check of the digits.
test.describe('the form for the contact details, as a made-up Vendor', () => {
  test.beforeEach(async ({ page }) => {
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/details`);
    await page.getByRole('main').locator('a[href="/details/contact-details"]').click();
    await expect(page.getByRole('main').locator('form')).toBeVisible();
  });

  test('passes the checks of every screen of the Vendor portal, in all three languages, and does not scroll sideways', async ({
    page,
  }) => {
    await checkInEveryLanguageOfTheVendorPortal(page);
    await expectNoSidewaysScroll(page);
  });

  test('its text differs in each of the three languages', async ({ page }) => {
    const texts = await readInEveryLanguageOfTheVendorPortal(page, () =>
      page.getByRole('main').innerText(),
    );

    expectADifferentTextInEachLanguage(texts);
  });
});

// The made-up Vendor's portal as the development Admin opens it, acting as
// the Vendor, under the band that names the Vendor. The band is in the
// portal's language, because the Vendor may be reading over the Admin's
// shoulder.
test.describe("the Vendor's portal, as the development Admin acting as the made-up Vendor", () => {
  test.beforeEach(async ({ page }) => {
    await logInToTheDashboard(
      page,
      developmentAdmin,
      `${dashboardUrl}/vendors/${vendor.vendorId}/portal`,
    );
    await expect(vendorNameInTheFrame(page)).toHaveText(vendor.vendorName);
  });

  test("passes the checks of every screen of the Vendor portal, in all three languages, and the band's text differs in each", async ({
    page,
  }) => {
    const bands = await readInEveryLanguageOfTheVendorPortal(page, () =>
      page.getByTestId('acting-band').innerText(),
    );

    expectADifferentTextInEachLanguage(bands);
  });
});

// What a Login with no Vendor behind it sees passes the checks of every
// screen of the Vendor portal, its switch among them, and the switch changes
// the message's language.
test('the message for a Login with no Vendor behind it passes the checks of every screen of the Vendor portal, and differs in each of the three languages', async ({
  page,
}) => {
  await answerAsForALoginWithNoVendor(page);
  await logInToTheDashboard(page, vendor);
  await expect(page.getByTestId('no-vendor')).toBeVisible();

  const messages = await readInEveryLanguageOfTheVendorPortal(page, () =>
    page.getByTestId('no-vendor').innerText(),
  );

  expectADifferentTextInEachLanguage(messages);
});

// The details screen's heading, in whichever language the portal is in.
function detailsHeading(page: Page): Locator {
  return page.getByRole('main').getByRole('heading', { level: 1 });
}

// What the details screen shows for one detail, found by the name the API
// gives it.
function detailOf(page: Page, detail: string): Locator {
  return page.locator(`[data-detail="${detail}"] dd`);
}

// What someone wrote is shown exactly as written (LANG-4), in the direction
// of its own first letter: right to left for Arabic script, also on the
// English page, and left to right for Latin script, also on a Kurdish one.
// Each line starts on its own side, its first character drawn at the far
// right of a line that runs right to left, and kept apart from the text
// around it.
async function expectDrawnAsWritten(element: Locator, written: string): Promise<void> {
  await expect(element).toHaveText(written, { useInnerText: true });
  const ownDirection = /^\P{L}*\p{Script=Arabic}/u.test(written) ? 'rtl' : 'ltr';
  const [firstLineDrawn] = await linesAsDrawn(element);

  expect(
    ownDirection === 'rtl' ? firstLineDrawn.at(-1) : firstLineDrawn[0],
    `"${written}", drawn "${firstLineDrawn}", starts on its own side`,
  ).toBe(written[0]);
  expect(await layoutOf(element)).toEqual({ direction: ownDirection, keptApart: true });
}

// Text that is in English in every language is drawn in the order it is
// written in, left to right, whatever the direction of the sentence around
// it, because it is kept apart from that sentence.
async function expectInEnglish(element: Locator, text: string): Promise<void> {
  await expect(element).toHaveText(text);
  expect((await linesAsDrawn(element)).join('')).toBe(text);
  expect(await layoutOf(element)).toEqual({ direction: 'ltr', keptApart: true });
}
