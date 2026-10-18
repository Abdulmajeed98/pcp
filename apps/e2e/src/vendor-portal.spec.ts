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
  expectNoSidewaysScroll,
  expectPageIn,
  type Language,
  languageSwitch,
  languages,
  narrowWindow,
} from './languages';
import { dashboardUrl } from './platform';
import {
  aMadeUpVendorThatHasLoggedIn,
  answerAsForALoginWithNoVendor,
  createAMadeUpVendorAsTheAdmin,
  inIraqsOwnForm,
  logInForTheFirstTime,
} from './vendors';

const [kurdish, , english] = languages;

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

  // The language tests show the same message in each of the three
  // languages, by its switch.
  test("with no Vendor behind the Login, the frame shows a plain message in the portal's language, with the language switch and the log out button and nothing else", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: 'ckb', viewport: narrowWindow });
    try {
      const page = await context.newPage();
      await answerAsForALoginWithNoVendor(page);
      await logInToTheDashboard(page, vendor);

      await expect(page.getByTestId('no-vendor')).toBeVisible();
      await expectPageIn(page, kurdish);
      await expect(page.getByTestId('log-out')).toBeVisible();
      await expect(languageSwitch(page).getByRole('button')).toHaveCount(languages.length);
      await expect(page.getByRole('button')).toHaveCount(1 + languages.length);
      await expect(page.getByRole('link')).toHaveCount(0);
      await expect(page.getByRole('heading')).toHaveCount(0);
      await expect(vendorNameInTheFrame(page)).toHaveCount(0);
      await expectNoSidewaysScroll(page);
      await expectAccessible(page);
    } finally {
      await context.close();
    }
  });
});
