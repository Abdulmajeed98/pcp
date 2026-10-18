import { expect, type Locator, type Page, type Request, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { expectShownAsWritten, vendorPageUrl } from './admin-vendors';
import {
  developmentAdmin,
  logInToTheDashboard,
  openTheDashboardAs,
  vendorNameInTheFrame,
} from './development-logins';
import { type VendorLoginDetails } from './keycloak-screens';
import {
  arabicOfIraq,
  buttonFor,
  expectNoSidewaysScroll,
  expectPageIn,
  languages,
  narrowWindow,
} from './languages';
import { apiUrl } from './platform';
import { aMadeUpVendorThatHasLoggedIn } from './vendors';

const [kurdish, arabic, english] = languages;

// The Admin acts as a Vendor in the Vendor's shop, on a phone (LANG-8). The
// browser is set to Arabic as written in Iraq, so that the portal, which
// follows the browser until its switch is used, opens in Arabic, right to
// left, and the Admin console, which is English whatever the browser says,
// is told apart from it. No test quotes the portal's text, which the review
// of the translations may change.
test.use({ viewport: narrowWindow, locale: arabicOfIraq });

// The Admin console's title, which it writes in English itself.
const adminConsoleTitle = 'Admin console';

// The Vendor the Admin acts as: a made-up one, made once for the file, which
// has been through its first login, as a real Vendor has.
let vendor: VendorLoginDetails;

test.beforeAll(async ({ browser }) => {
  vendor = await aMadeUpVendorThatHasLoggedIn(browser);
});

// The address of the Vendor's portal, as the Admin opens it, under the
// Vendor's page.
function portalUrl(): string {
  return `${vendorPageUrl(vendor.vendorId)}/portal`;
}

// The band that names the Vendor the Admin is acting as.
function theBand(page: Page): Locator {
  return page.getByTestId('acting-band');
}

// What the details screen shows for one detail, found by the name the API
// gives it.
function detailOf(page: Page, detail: string): Locator {
  return page.locator(`[data-detail="${detail}"] dd`);
}

// The link beside the contact details' heading, which opens their form.
function theLinkToTheForm(page: Page): Locator {
  return page.getByRole('main').locator('a[href$="/portal/contact-details"]');
}

// Logs in as the development Admin at the Vendor's page, and opens the
// Vendor's portal with the page's link, which the Admin console names in
// English.
async function openThePortalFromItsPage(page: Page): Promise<void> {
  await logInToTheDashboard(page, developmentAdmin, vendorPageUrl(vendor.vendorId));
  await expect(
    page.getByRole('heading', { level: 1, name: vendor.vendorName }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Open its portal' }).click();

  await expect(page).toHaveURL(portalUrl());
  await expect(vendorNameInTheFrame(page)).toHaveText(vendor.vendorName);
}

// The band names the Vendor, as written, and links back to its page.
async function expectTheBand(page: Page): Promise<void> {
  await expectShownAsWritten(theBand(page), vendor.vendorName);
  expect(
    await theBand(page)
      .getByRole('link')
      .evaluate((anchor) => (anchor as HTMLAnchorElement).href),
    "the band's link leads to the Vendor's page",
  ).toBe(vendorPageUrl(vendor.vendorId));
}

// A request the dashboard made to the API, and the Authorization header it
// carried.
interface CallToTheApi {
  address: string;
  authorization: string | undefined;
}

// Every request the page makes to the API from now on, as it is made.
function callsToTheApi(page: Page): CallToTheApi[] {
  const calls: CallToTheApi[] = [];
  page.on('request', (request: Request) => {
    if (request.url().startsWith(`${apiUrl}/`) && request.method() !== 'OPTIONS') {
      calls.push({
        address: request.url(),
        authorization: request.headers().authorization,
      });
    }
  });
  return calls;
}

test("from a made-up Vendor's page the Admin opens its portal, which declares the portal's language: the band names the Vendor, as written, on the details screen and on its form, and links back to the Vendor's page, and every request to the API carries the Admin's own token and names the Vendor in its address", async ({
  page,
}) => {
  const calls = callsToTheApi(page);

  await openThePortalFromItsPage(page);

  await expectPageIn(page, arabic);
  await expect(page).not.toHaveTitle(adminConsoleTitle);
  await expectTheBand(page);
  await expect(detailOf(page, 'name')).toHaveText(vendor.vendorName);

  await theLinkToTheForm(page).click();
  await expect(page).toHaveURL(`${portalUrl()}/contact-details`);
  await expect(page.locator('#contact-details-address')).toBeVisible();
  await expectTheBand(page);

  // The Admin console asked who the caller is before the portal opened, with
  // the Admin's own token.
  const [askedForTheCaller] = calls.filter(
    ({ address }) => address === `${apiUrl}/v1/caller`,
  );
  expect(askedForTheCaller?.authorization).toMatch(/^Bearer \S+$/);
  const inThePortal = calls.filter(({ address }) =>
    address.startsWith(`${apiUrl}/v1/vendors/`),
  );
  expect(inThePortal.length, 'the portal asked the API for the Vendor').toBeGreaterThan(0);
  for (const { address, authorization } of calls) {
    expect(authorization, `${address} carries the Admin's own token`).toBe(
      askedForTheCaller?.authorization,
    );
    expect(address, "the portal never asks for the Caller's own Vendor").not.toBe(
      `${apiUrl}/v1/caller/vendor`,
    );
  }
  for (const { address } of inThePortal) {
    const ofTheVendor = `${apiUrl}/v1/vendors/${vendor.vendorId}`;
    expect(
      address === ofTheVendor || address.startsWith(`${ofTheVendor}/`),
      `${address} names the Vendor`,
    ).toBe(true);
  }
});

test('the Admin changes the opening hours there, and the Vendor, logged in in a browser of its own, sees the change', async ({
  page,
  browser,
}) => {
  const openingHours = `Made-up hours ${Date.now() % 100_000}\nFriday: closed`;
  const vendorsContext = await browser.newContext({ viewport: narrowWindow });
  try {
    const vendorsPage = await vendorsContext.newPage();
    await openTheDashboardAs(vendorsPage, vendor);

    await openThePortalFromItsPage(page);
    await theLinkToTheForm(page).click();
    await page.locator('#contact-details-openingHours').fill(openingHours);
    await page.getByRole('main').locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(portalUrl());
    await expect(detailOf(page, 'openingHours')).toBeVisible();
    expect(await detailOf(page, 'openingHours').innerText()).toBe(openingHours);

    await vendorsPage.reload();
    await expect(vendorNameInTheFrame(vendorsPage)).toHaveText(vendor.vendorName);
    await expect(detailOf(vendorsPage, 'openingHours')).toBeVisible();
    expect(await detailOf(vendorsPage, 'openingHours').innerText()).toBe(openingHours);
  } finally {
    await vendorsContext.close();
  }
});

test("the portal's switch changes the language there, the band staying, and the choice is remembered in this browser", async ({
  page,
}) => {
  await openThePortalFromItsPage(page);

  await buttonFor(page, kurdish).click();
  await expectPageIn(page, kurdish);
  await expectTheBand(page);
  await buttonFor(page, english).click();
  await expectPageIn(page, english);
  await expect(page).not.toHaveTitle(adminConsoleTitle);
  await expectTheBand(page);
  await expect(page).toHaveURL(portalUrl());

  // The browser is set to Arabic, so English after a reload is the choice.
  await page.reload();
  await expect(vendorNameInTheFrame(page)).toHaveText(vendor.vendorName);
  await expectPageIn(page, english);
});

test("the band's link returns to the Vendor's page, which declares English, left to right, with the Admin console's title", async ({
  page,
}) => {
  await openThePortalFromItsPage(page);
  await expectPageIn(page, arabic);

  await theBand(page).getByRole('link').click();

  await expect(page).toHaveURL(vendorPageUrl(vendor.vendorId));
  await expect(
    page.getByRole('heading', { level: 1, name: vendor.vendorName }),
  ).toBeVisible();
  await expectPageIn(page, english);
  await expect(page).toHaveTitle(adminConsoleTitle);
});

test('the portal with its band meets the automated part of WCAG 2.2 level AA, in light and in dark, and does not scroll sideways', async ({
  page,
}) => {
  await openThePortalFromItsPage(page);
  await expectTheBand(page);
  await expect(detailOf(page, 'name')).toBeVisible();

  await expectNoSidewaysScroll(page);
  await expectAccessible(page);
});
