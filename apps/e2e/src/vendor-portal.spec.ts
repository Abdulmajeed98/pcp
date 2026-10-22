import { expect, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { vendorPageUrl, vendorsHeading, vendorsUrl } from './admin-vendors';
import { catalogHeading, catalogUrl } from './catalog';
import {
  logInToTheDashboard,
  openTheDashboardAs,
  vendorNameInTheFrame,
} from './development-logins';
import { expectCentredInTheWindow, expectTheEmptyState } from './empty-state';
import {
  atTheLoginScreenInABrowserOfItsOwn,
  type VendorLoginDetails,
} from './keycloak-screens';
import {
  chooseInThePortal,
  expectNoSidewaysScroll,
  expectPageIn,
  type Language,
  languages,
  languageSwitch,
  narrowWindow,
} from './languages';
import { openTheMenuOnAPhone, theMenuSheet, withTheMenuOpenOnAPhone } from './menu-sheet';
import { goToTheSection, theOffersScreen } from './offers';
import { apiUrl, dashboardUrl } from './platform';
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

test("after its first login, a made-up Vendor's portal opens on the Offers screen, with the Vendor's name in the frame, and its details are in their own section", async ({
  browser,
  page,
  request,
}) => {
  const vendor = await createAMadeUpVendorAsTheAdmin(page, request);

  await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
    await logInForTheFirstTime(vendorsPage, vendor);

    await expect(vendorNameInTheFrame(vendorsPage)).toHaveText(vendor.name);
    await expect(vendorsPage).toHaveURL(`${dashboardUrl}/`);
    await expect(theOffersScreen(vendorsPage)).toBeVisible();

    await goToTheSection(vendorsPage, 'details');
    await expect(vendorsPage).toHaveURL(`${dashboardUrl}/details`);
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

      await withTheMenuOpenOnAPhone(page, () => expect(languageSwitch(page)).toBeVisible());
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

    await withTheMenuOpenOnAPhone(page, () => expect(languageSwitch(page)).toBeVisible());
    await expect(page.getByText('Vendor not found')).toHaveCount(0);
  });

  test('an address that matches no screen shows a "not found" message in the portal\'s language, with a way to the Offers screen', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/no-such-screen`);

    const messages = new Map<Language, string>();
    for (const language of [kurdish, english]) {
      await chooseInThePortal(page, language);
      messages.set(language, await detailsHeading(page).innerText());
    }
    expect(messages.get(kurdish)).not.toBe(messages.get(english));
    await expectTheEmptyState(page.getByRole('main'), detailsHeading(page));
    await expectCentredInTheWindow(page.getByRole('main'), detailsHeading(page));
    await expectNoSidewaysScroll(page);

    await page.getByRole('main').getByRole('link').click();
    await expect(page).toHaveURL(`${dashboardUrl}/`);
    await expect(theOffersScreen(page)).toBeVisible();
  });

  test('the details are in three groups, the Vendor, its contact details and its Login, each after its heading', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/details`);

    const groups = page.getByRole('main').getByRole('region');
    await expect(groups).toHaveCount(3);
    for (const [group, details] of [
      [0, ['name', 'city']],
      [
        1,
        [
          'address',
          'mapLocation',
          'phoneNumber',
          'whatsAppNumber',
          'instagramName',
          'openingHours',
        ],
      ],
      [2, ['loginPhoneNumber']],
    ] as const) {
      await expect(groups.nth(group).getByRole('heading', { level: 2 })).toBeVisible();
      expect(
        await groups
          .nth(group)
          .locator('[data-detail]')
          .evaluateAll((elements) =>
            elements.map((element) => element.getAttribute('data-detail')),
          ),
      ).toEqual(details);
    }
  });

  test("while the Vendor's details are being read, the screen already shows its title, its groups' headings and each detail's name, its value sketched, and says that it is reading", async ({
    page,
  }) => {
    let answer = () => {};
    const answered = new Promise<void>((resolve) => (answer = resolve));
    await page.route(`${apiUrl}/v1/vendors/${vendor.vendorId}`, async (route) => {
      await answered;
      await route.continue();
    });
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/details`);

    const main = page.getByRole('main');
    await expect(detailsHeading(page)).toBeVisible();
    await expect(main.getByRole('region')).toHaveCount(3);
    await expect(main.locator('[data-detail] dt')).toHaveCount(9);
    await expect(main.locator('[aria-busy="true"]')).toHaveCount(1);
    await expect(main.getByRole('status')).not.toBeEmpty();
    await expect(detailOf(page, 'name')).toHaveText('');

    answer();
    await expect(detailOf(page, 'name')).toHaveText(vendor.vendorName);
    await expect(main.locator('[aria-busy="true"]')).toHaveCount(0);
  });

  // The owner on motion (22 October 2026): no rigid snaps, and with reduced
  // motion nothing jumps a layout in one frame. The address takes two lines
  // where its sketch took one, so each value grows from its sketch's height
  // to its own as it fades in, 200 ms on the ease-out curve, and 150 ms with
  // reduced motion, still growing rather than jumping.
  for (const { motion, duration } of [
    { motion: 'no-preference', duration: 200 },
    { motion: 'reduce', duration: 150 },
  ] as const) {
    test(`as the Vendor's details arrive, each value grows from its sketch's height to its own and fades in, in ${duration} ms, with ${motion === 'reduce' ? 'reduced motion' : 'full motion'}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: motion });
      // Each animation the page starts with the Web Animations API, with
      // the detail it is in, its keyframes and its timing.
      await page.addInitScript(() => {
        const started: unknown[] = [];
        (window as unknown as { started: unknown[] }).started = started;
        const animate = Element.prototype.animate;
        Element.prototype.animate = function (keyframes, options) {
          started.push({
            detail: this.closest('[data-detail]')?.getAttribute('data-detail'),
            keyframes,
            options,
          });
          return animate.call(this, keyframes, options);
        };
      });
      let answer = () => {};
      const answered = new Promise<void>((resolve) => (answer = resolve));
      await page.route(`${apiUrl}/v1/vendors/${vendor.vendorId}`, async (route) => {
        await answered;
        await route.continue();
      });
      await openTheDashboardAs(page, vendor, `${dashboardUrl}/details`);
      await expect(page.getByRole('main').locator('[aria-busy="true"]')).toHaveCount(1);

      answer();
      await expect(detailOf(page, 'address')).not.toHaveText('');
      const started = (await page.evaluate(
        () => (window as unknown as { started: unknown[] }).started,
      )) as {
        detail?: string;
        keyframes: { height?: string; opacity?: number }[];
        options: { duration: number; easing: string };
      }[];
      const address = started.find(({ detail }) => detail === 'address');

      expect(address, 'the address arrives with a movement').toBeDefined();
      expect(address?.options).toMatchObject({
        duration,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      });
      const [from, to] = address?.keyframes ?? [];
      expect(from).toMatchObject({ height: '20px', opacity: 0 });
      expect(to?.opacity).toBe(1);
      expect(parseFloat(to?.height ?? '0'), 'it grows to its two lines').toBeGreaterThan(
        20,
      );
    });
  }

  // Emil Kowalski's break-ui on the details screen: the longest name and
  // address the API takes, the address as a Vendor might paste it, with a
  // link to its place and no space in it, and every optional detail left
  // out.
  test('with the longest name and address the API takes and every optional detail left out, each missing detail says so alike, and the screen does not scroll sideways', async ({
    page,
  }) => {
    const name =
      'Made-up Computer, Laptop and Gaming Accessories Trading Company of the Fictional Bazaar in Erbil'.padEnd(
        100,
        '.',
      );
    const address =
      `${'Made-up Street 60, beside the made-up bazaar, ground floor, shop number 100, '.repeat(2)}https://maps.app.goo.gl/MadeUpFictionalBazaarErbilShop1000000000000000000000000000000`.slice(
        0,
        300,
      );
    await page.route(`${apiUrl}/v1/vendors/${vendor.vendorId}`, async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        json: {
          ...((await response.json()) as object),
          name,
          address,
          mapLocation: null,
          whatsAppNumber: null,
          instagramName: null,
          openingHours: null,
        },
      });
    });
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/details`);

    await expect(detailOf(page, 'name')).toHaveText(name);
    await expect(detailOf(page, 'address')).toHaveText(address);
    const none = await detailOf(page, 'mapLocation').innerText();
    expect(none).not.toBe('');
    for (const detail of ['whatsAppNumber', 'instagramName', 'openingHours']) {
      await expect(detailOf(page, detail)).toHaveText(none);
    }
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  });

  test('the details screen meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/details`);
    await expect(detailOf(page, 'name')).toHaveText(vendor.vendorName);

    await expectAccessible(page);
  });

  // The language tests show the same message in each of the three
  // languages, by its switch.
  test("with no Vendor behind the Login, the frame shows a plain message in the portal's language, with the menu sheet's language switch, scheme switch and log out button and nothing else", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: 'ckb', viewport: narrowWindow });
    try {
      const page = await context.newPage();
      await answerAsForALoginWithNoVendor(page);
      await logInToTheDashboard(page, vendor);

      await expect(page.getByTestId('no-vendor')).toBeVisible();
      await expectPageIn(page, kurdish);
      await expect(page.getByRole('button')).toHaveCount(1);
      await expect(page.getByRole('link')).toHaveCount(0);
      await expect(page.getByRole('heading')).toHaveCount(0);
      await expect(vendorNameInTheFrame(page)).toHaveCount(0);
      await expectNoSidewaysScroll(page);
      await expectAccessible(page);

      // The menu sheet holds the two switches and Log out, and no section.
      await openTheMenuOnAPhone(page);
      const menu = theMenuSheet(page);
      await expect(menu.getByTestId('log-out')).toBeVisible();
      await expect(languageSwitch(page).getByRole('button')).toHaveCount(languages.length);
      await expect(menu.getByRole('button')).toHaveCount(1 + languages.length + 3);
      await expect(menu.getByRole('link')).toHaveCount(0);
      await expect(menu.getByTestId('portal-sections')).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
});
