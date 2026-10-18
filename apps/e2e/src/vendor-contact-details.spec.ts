import { expect, type Page, type Request, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { openTheDashboardAs } from './development-logins';
import { type VendorLoginDetails } from './keycloak-screens';
import { buttonFor, expectNoSidewaysScroll, languages, narrowWindow } from './languages';
import { dashboardUrl } from './platform';
import { aMadeUpVendorThatHasLoggedIn } from './vendors';

const [kurdish, , english] = languages;

// Erbil's citadel, as OpenStreetMap places it: the position the browser is
// given, as a Vendor's phone would give it standing in its own place.
const inErbil = { latitude: 36.1911744, longitude: 44.0094145 };

// A Vendor uses its portal on a phone (LANG-8), and the browser has leave to
// give the dashboard its position. The browser is set to English, so the
// portal opens in English. No test quotes the portal's text, which the
// review of the translations may change: an element is found by its id, its
// test id or what it is.
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

// A control of the form, found by the name the API gives its detail.
function formField(page: Page, detail: string) {
  return page.locator(`#contact-details-${detail}`);
}

// The refusal shown beside a control of the form.
function refusalOf(page: Page, detail: string) {
  return page.locator(`#contact-details-${detail}-error`);
}

function saveButton(page: Page) {
  return page.getByRole('main').locator('form button[type="submit"]');
}

// The request that sends the contact details to the API.
function isTheSave(request: Request): boolean {
  return request.method() === 'PUT' && request.url().endsWith('/contact-details');
}

// Opens the portal as the Vendor, and its form from the details screen by the
// link beside the contact details' heading.
async function openTheForm(page: Page): Promise<void> {
  await openTheDashboardAs(page, vendor);
  await page.getByRole('main').locator('a[href="/contact-details"]').click();
  await expect(formField(page, 'address')).toBeVisible();
}

test('the Vendor changes its address, written in Arabic script with Arabic-Indic digits, and its opening hours, and the details screen shows both exactly as written; the form holds the six contact details and sends them and nothing else', async ({
  page,
}) => {
  const address = `شەقامی ٦٠ مەتری، ژمارە ${Date.now() % 1000}\nهەولێر`;
  const openingHours = 'شەممە تا پێنجشەممە: ٩ بۆ ٩\nهەینی: داخراوە';
  const contactDetails = [
    'address',
    'instagramName',
    'mapLocation',
    'openingHours',
    'phoneNumber',
    'whatsAppNumber',
  ];

  await openTheForm(page);
  const controls = await page
    .getByRole('main')
    .locator('form [name]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('name')));
  expect([...controls].sort(), 'the form’s controls').toEqual(contactDetails);
  await formField(page, 'address').fill(address);
  await formField(page, 'openingHours').fill(openingHours);
  const saved = page.waitForRequest(isTheSave);
  await saveButton(page).click();

  expect(Object.keys((await saved).postDataJSON() as object).sort()).toEqual(
    contactDetails,
  );
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
  await formField(page, 'mapLocation').fill('');

  await page.getByTestId('use-position').click();

  await expect(formField(page, 'mapLocation')).toHaveValue(
    `${inErbil.latitude}, ${inErbil.longitude}`,
  );
});

test('a phone number that is not Iraqi is refused beside its field, which takes the focus, and the refusal follows the language switch, different in Kurdish and English', async ({
  page,
}) => {
  await openTheForm(page);
  const phoneNumber = formField(page, 'phoneNumber');
  const refusal = refusalOf(page, 'phoneNumber');

  // A number in London, as Ofcom keeps 020 7946 0xxx for drama.
  await phoneNumber.fill('+44 20 7946 0958');
  await saveButton(page).click();

  await expect(phoneNumber).toHaveAttribute('aria-invalid', 'true');
  await expect(phoneNumber).toBeFocused();
  await expect(refusal).not.toBeEmpty();
  expect(
    (await phoneNumber.getAttribute('aria-describedby'))?.split(' '),
    'the refusal is part of the field’s description',
  ).toContain('contact-details-phoneNumber-error');
  const inEnglish = await refusal.innerText();

  await buttonFor(page, kurdish).click();
  await expect(refusal).not.toHaveText(inEnglish);
  await expect(refusal).not.toBeEmpty();
  await buttonFor(page, english).click();
  await expect(refusal).toHaveText(inEnglish);
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
  await page.getByTestId('use-position').click();
  await expect(page.locator('#contact-details-mapLocation-position')).not.toBeEmpty();
  await formField(page, 'phoneNumber').fill('+44 20 7946 0958');
  await saveButton(page).click();
  await expect(formField(page, 'phoneNumber')).toHaveAttribute('aria-invalid', 'true');
  await expectNoSidewaysScroll(page);
  await expectAccessible(page);
});
