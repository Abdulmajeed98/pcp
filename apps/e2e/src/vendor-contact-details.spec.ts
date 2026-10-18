import { expect, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { openTheDashboardAs } from './development-logins';
import { type VendorLoginDetails } from './keycloak-screens';
import {
  buttonFor,
  expectNoSidewaysScroll,
  type Language,
  languages,
  narrowWindow,
} from './languages';
import { dashboardUrl } from './platform';
import { aMadeUpVendorThatHasLoggedIn } from './vendors';

const [kurdish, , english] = languages;

// Erbil's citadel, as OpenStreetMap places it: the position the browser is
// given, as a Vendor's phone would give it standing in its own place.
const inErbil = { latitude: 36.1911744, longitude: 44.0094145 };

// A Vendor uses its portal on a phone (LANG-8), and the browser has leave to
// give the dashboard its position. The browser is set to English, so the
// portal opens in English.
test.use({
  viewport: narrowWindow,
  geolocation: inErbil,
  permissions: ['geolocation'],
  locale: 'en',
});

// The Vendor these tests log in as: a made-up one, made once for the file,
// which has been through its first login, as a real Vendor has.
let vendor: VendorLoginDetails;

test.beforeAll(async ({ browser }) => {
  vendor = await aMadeUpVendorThatHasLoggedIn(browser);
});

// What the details screen shows for one detail, found by the name the API
// gives it.
function detailOf(page: Page, detail: string) {
  return page.locator(`[data-detail="${detail}"] dd`);
}

// A control of the form, found by its label in English.
function formField(page: Page, label: string) {
  return page.getByRole('main').getByLabel(label, { exact: true });
}

function saveButton(page: Page) {
  return page.getByRole('main').getByRole('button', { name: 'Save', exact: true });
}

// Opens the portal as the Vendor, and its form from the details screen.
async function openTheForm(page: Page): Promise<void> {
  await openTheDashboardAs(page, vendor);
  await page.getByRole('link', { name: 'Change your contact details' }).click();
  await expect(formField(page, 'Address')).toBeVisible();
}

test('the Vendor changes its address, written in Arabic script with Arabic-Indic digits, and its opening hours, and the details screen shows both exactly as written; the name, the city and the login phone number are not in the form', async ({
  page,
}) => {
  const address = `شەقامی ٦٠ مەتری، ژمارە ${Date.now() % 1000}\nهەولێر`;
  const openingHours = 'شەممە تا پێنجشەممە: ٩ بۆ ٩\nهەینی: داخراوە';

  await openTheForm(page);
  for (const label of ['Name', 'City', 'Login phone number']) {
    await expect(formField(page, label)).toHaveCount(0);
  }
  await formField(page, 'Address').fill(address);
  await formField(page, 'Opening hours').fill(openingHours);
  await saveButton(page).click();

  await expect(page).toHaveURL(`${dashboardUrl}/`);
  await expect(detailOf(page, 'address')).toBeVisible();
  expect(await detailOf(page, 'address').innerText()).toBe(address);
  expect(await detailOf(page, 'openingHours').innerText()).toBe(openingHours);
  await expect(detailOf(page, 'name')).toHaveText(vendor.vendorName);
});

test("the browser is given a position in Erbil, and the location button fills the map location's coordinates from it", async ({
  page,
}) => {
  await openTheForm(page);
  await formField(page, 'Map location').fill('');

  await page.getByRole('button', { name: 'Use my position' }).click();

  await expect(formField(page, 'Map location')).toHaveValue(
    `${inErbil.latitude}, ${inErbil.longitude}`,
  );
});

test('a phone number that is not Iraqi is refused beside its field, which takes the focus, and the refusal differs between Kurdish and English', async ({
  page,
}) => {
  await openTheForm(page);

  const refusals = new Map<Language, string>();
  for (const language of [english, kurdish]) {
    await buttonFor(page, language).click();
    // A number in London, as Ofcom keeps 020 7946 0xxx for drama.
    const phoneNumber = page.locator('#contact-details-phoneNumber');
    await phoneNumber.fill('+44 20 7946 0958');
    await page.locator('form button[type="submit"]').click();

    await expect(phoneNumber).toHaveAttribute('aria-invalid', 'true');
    await expect(phoneNumber).toBeFocused();
    const refusal = page.locator('#contact-details-phoneNumber-error');
    await expect(refusal).not.toBeEmpty();
    expect(
      (await phoneNumber.getAttribute('aria-describedby'))?.split(' '),
      'the refusal is part of the field’s description',
    ).toContain('contact-details-phoneNumber-error');
    refusals.set(language, await refusal.innerText());
  }

  expect(refusals.get(english)).toMatch(/not an Iraqi phone number/);
  expect(refusals.get(kurdish)).not.toBe(refusals.get(english));
  await expect(page).not.toHaveURL(`${dashboardUrl}/`);
});

// Its checks in the three languages are with the language tests, in
// `dashboard-languages.spec.ts`, whose browser shows a number's fault.
test('the form meets the automated part of WCAG 2.2 level AA in light and in dark, as opened and with a refusal and a position problem shown', async ({
  page,
  context,
}) => {
  await openTheForm(page);
  await expectAccessible(page);

  await context.setGeolocation(null);
  await page.getByRole('button', { name: 'Use my position' }).click();
  await expect(page.getByText('Your position could not be found.')).toBeVisible();
  await formField(page, 'Phone number').fill('+44 20 7946 0958');
  await saveButton(page).click();
  await expect(formField(page, 'Phone number')).toHaveAttribute('aria-invalid', 'true');
  await expectNoSidewaysScroll(page);
  await expectAccessible(page);
});
