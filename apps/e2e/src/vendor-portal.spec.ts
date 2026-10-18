import { expect, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { vendorPageUrl, vendorsHeading, vendorsUrl } from './admin-vendors';
import { catalogHeading, catalogUrl } from './catalog';
import {
  logInToTheDashboard,
  openTheDashboardAs,
  vendorNameInTheFrame,
} from './development-logins';
import {
  atTheLoginScreenInABrowserOfItsOwn,
  type VendorLoginDetails,
} from './keycloak-screens';
import {
  buttonFor,
  expectADifferentTextInEachLanguage,
  expectNoSidewaysScroll,
  expectPageIn,
  type Language,
  languageSwitch,
  languages,
  narrowWindow,
} from './languages';
import { apiUrl, dashboardUrl } from './platform';
import {
  aMadeUpVendorThatHasLoggedIn,
  createAMadeUpVendorAsTheAdmin,
  inIraqsOwnForm,
  logInForTheFirstTime,
} from './vendors';

const [kurdish, arabic, english] = languages;

// A Vendor uses its portal on a phone (LANG-8).
test.use({ viewport: narrowWindow });

// The details screen's heading, in whichever language the portal is in.
function detailsHeading(page: Page) {
  return page.getByRole('main').getByRole('heading', { level: 1 });
}

// What the details screen shows for one detail, found by the name the API
// gives it.
function detailOf(page: Page, detail: string) {
  return page.locator(`[data-detail="${detail}"] dd`);
}

test("after its first login, a made-up Vendor's portal opens on the details screen, with the Vendor's name in the frame", async ({
  browser,
  page,
  request,
}) => {
  const vendor = await createAMadeUpVendorAsTheAdmin(page, request);

  await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
    await logInForTheFirstTime(vendorsPage, vendor);

    await expect(vendorNameInTheFrame(vendorsPage)).toHaveText(vendor.name);
    await expect(vendorsPage).toHaveURL(`${dashboardUrl}/`);
    await expect(detailsHeading(vendorsPage)).toBeVisible();
    await expect(detailOf(vendorsPage, 'name')).toHaveText(vendor.name);
    await expect(detailOf(vendorsPage, 'loginPhoneNumber')).toHaveText(
      inIraqsOwnForm(vendor.loginPhoneNumber),
    );
  });
});

test.describe('as a made-up Vendor', () => {
  let vendor: VendorLoginDetails;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser, {
      address: 'شەقامی ٦٠ مەتری، نزیک بازاڕی ١٠٠\nهەولێر',
      openingHours: 'شەممە تا پێنجشەممە: ٩ بۆ ٩',
      mapLocation: { latitude: 36.1911744, longitude: 44.0094145 },
      instagramName: 'made_up.vendor',
    });
  });

  for (const { section, address, heading } of [
    { section: 'Vendors section', address: vendorsUrl, heading: vendorsHeading },
    { section: 'Catalog', address: catalogUrl, heading: catalogHeading },
  ]) {
    test(`an address of the Admin console's ${section} shows the Vendor portal and not the ${section}`, async ({
      page,
    }) => {
      await openTheDashboardAs(page, vendor, address);

      await expect(languageSwitch(page)).toBeVisible();
      await expect(heading(page)).toHaveCount(0);
      await expect(page.getByRole('searchbox')).toHaveCount(0);
    });
  }

  test("a Vendor's page in the Admin console, at its address, shows the Vendor portal and not that Vendor", async ({
    page,
  }) => {
    await openTheDashboardAs(
      page,
      vendor,
      vendorPageUrl('0b4d6f8a-2c1e-4a3b-9d5f-7e6a8b9c0d1e'),
    );

    await expect(languageSwitch(page)).toBeVisible();
    await expect(page.getByText('Vendor not found')).toHaveCount(0);
  });

  test('an address that matches no screen shows a "not found" message in the portal\'s language, with a way to the details screen', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/no-such-screen`);

    const messages = new Map<Language, string>();
    for (const language of [kurdish, english]) {
      await buttonFor(page, language).click();
      messages.set(language, await detailsHeading(page).innerText());
    }
    expect(messages.get(kurdish)).not.toBe(messages.get(english));
    await expectNoSidewaysScroll(page);

    await page.getByRole('main').getByRole('link').click();
    await expect(page).toHaveURL(`${dashboardUrl}/`);
    await expect(detailOf(page, 'name')).toHaveText(vendor.vendorName);
  });

  test('the details screen meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor);
    await expect(detailOf(page, 'name')).toHaveText(vendor.vendorName);

    await expectAccessible(page);
  });

  // A Login that holds the Vendor role and has no Vendor behind it is one
  // made by hand in Keycloak's console. The tests make no such Login in the
  // development Keycloak, so the page is given the API's answer for one, in a
  // browser set to each language in turn.
  test("with no Vendor behind the Login, the frame shows a plain message in the portal's language, with the log out button and nothing else", async ({
    browser,
  }) => {
    const messages = new Map<Language, string>();
    for (const { language, locale } of [
      { language: kurdish, locale: 'ckb' },
      { language: arabic, locale: 'ar' },
      { language: english, locale: 'en' },
    ]) {
      const context = await browser.newContext({ locale, viewport: narrowWindow });
      try {
        const page = await context.newPage();
        await page.route(`${apiUrl}/v1/caller/vendor`, (route) =>
          route.fulfill({ status: 404, json: vendorNotFound }),
        );
        await logInToTheDashboard(page, vendor);

        const message = page.getByTestId('no-vendor');
        await expect(message).toBeVisible();
        await expectPageIn(page, language);
        await expect(page.getByTestId('log-out')).toBeVisible();
        await expect(page.getByRole('button')).toHaveCount(1);
        await expect(page.getByRole('link')).toHaveCount(0);
        await expect(page.getByRole('heading')).toHaveCount(0);
        await expect(vendorNameInTheFrame(page)).toHaveCount(0);
        await expectNoSidewaysScroll(page);
        messages.set(language, await message.innerText());
        if (language === kurdish) await expectAccessible(page);
      } finally {
        await context.close();
      }
    }

    expectADifferentTextInEachLanguage(messages);
  });
});

// The API's answer for a Login with no Vendor behind it.
const vendorNotFound = {
  errors: [
    {
      code: 'VENDOR_NOT_FOUND',
      title: 'vendor_not_found_title',
      detail: 'vendor_not_found_details',
    },
  ],
};
