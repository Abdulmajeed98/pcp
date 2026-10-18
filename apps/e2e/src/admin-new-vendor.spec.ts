import { expect, type Page, test } from '@playwright/test';

import {
  detailRow,
  newVendorHeading,
  newVendorUrl,
  vendorFormField,
  vendorsHeading,
  vendorsUrl,
} from './admin-vendors';
import { expectAccessible } from './accessibility';
import { catalogHeading } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import {
  expectADifferentTextInEachLanguage,
  type Language,
  expectNoSidewaysScroll,
  languages,
  narrowWindow,
} from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { dashboardUrl } from './platform';
import {
  atTheLoginScreenInABrowserOfItsOwn,
  expectNewPasswordScreen,
  submitTheLoginScreen,
  submitTheNewPasswordScreen,
} from './keycloak-screens';
import {
  aMadeUpMobileNumber,
  aNewPassword,
  expectTheVendorPortal,
  inIraqsOwnForm,
} from './vendors';

// Erbil's citadel, as OpenStreetMap places it: the position the browser is
// given, as the Admin's phone would give it standing in a shop in Erbil.
const inErbil = { latitude: 36.1911744, longitude: 44.0094145 };

// The Admin creates Vendors on a phone, in their shops (LANG-8), and the
// browser has leave to give the dashboard its position.
test.use({
  viewport: narrowWindow,
  geolocation: inErbil,
  permissions: ['geolocation'],
});

test.beforeEach(async ({ page }) => {
  await authorizationOfTheDevelopmentAdmin(page);
  await expect(catalogHeading(page)).toBeVisible();
});

// A made-up Vendor as the Admin types it into the form, with a name and a
// login phone number unique to the run.
function aMadeUpVendorToType() {
  const loginPhoneNumber = aMadeUpMobileNumber();
  return {
    name: `Made-up test Vendor ${aWordUniqueToTheRun()}`,
    address: 'Made-up Street\nErbil',
    phoneNumber: loginPhoneNumber,
    loginPhoneNumber,
  };
}

type VendorToType = ReturnType<typeof aMadeUpVendorToType>;

// Fills in the form's required details, as the Admin types them.
async function fillInTheForm(page: Page, vendor: VendorToType): Promise<void> {
  await vendorFormField(page, 'Name').fill(vendor.name);
  await vendorFormField(page, 'Address').fill(vendor.address);
  await vendorFormField(page, 'Phone number').fill(vendor.phoneNumber);
  await vendorFormField(page, 'Login phone number').fill(vendor.loginPhoneNumber);
}

// The temporary password, shown once after the create.
function temporaryPassword(page: Page) {
  return page.getByTestId('temporary-password');
}

test('the Admin opens the form from the Vendors list, with Erbil chosen as the city, fills in a made-up Vendor, fills its map location from the browser’s position in Erbil, and creates it; the page then shows the temporary password, and the Vendor holds that location', async ({
  page,
}) => {
  await page.goto(vendorsUrl);
  await expect(vendorsHeading(page)).toBeVisible();
  await page.getByRole('link', { name: 'New Vendor' }).click();
  await expect(page).toHaveURL(newVendorUrl);
  await expect(newVendorHeading(page)).toBeVisible();

  const city = vendorFormField(page, 'City');
  await expect(city).toHaveValue('erbil');
  await expect(city.locator('option:checked')).toHaveText('Erbil');

  const vendor = aMadeUpVendorToType();
  await fillInTheForm(page, vendor);
  await page.getByRole('button', { name: 'Use this phone’s position' }).click();
  await expect(vendorFormField(page, 'Map location')).toHaveValue(
    `${inErbil.latitude}, ${inErbil.longitude}`,
  );
  await page.getByRole('button', { name: 'Create the Vendor' }).click();

  await expect(page.getByRole('heading', { level: 1, name: vendor.name })).toBeVisible();
  // Twelve lower-case letters and digits, without 0, o, 1, l and i.
  await expect(temporaryPassword(page)).toHaveText(/^[a-hjkmnp-z2-9]{12}$/);

  await page.getByRole('link', { name: 'Open the Vendor’s page' }).click();
  await expect(detailRow(page, 'mapLocation')).toContainText(
    `${inErbil.latitude}, ${inErbil.longitude}`,
  );
  await expect(temporaryPassword(page)).toHaveCount(0);
});

// Opens the form for a new Vendor, fills in a made-up one and creates it,
// and gives back what was typed and the temporary password shown.
async function createAMadeUpVendorInTheForm(
  page: Page,
): Promise<{ vendor: VendorToType; password: string }> {
  await page.goto(newVendorUrl);
  await expect(newVendorHeading(page)).toBeVisible();
  const vendor = aMadeUpVendorToType();
  await fillInTheForm(page, vendor);
  await page.getByRole('button', { name: 'Create the Vendor' }).click();

  await expect(temporaryPassword(page)).toBeVisible();
  return { vendor, password: await temporaryPassword(page).innerText() };
}

// The hand-over's choice of the message's language.
function messageLanguage(page: Page) {
  return page.getByRole('group', { name: 'Language of the message' });
}

// The hand-over's link, and the message it writes, in the language chosen:
// where the link goes, and the message's lines.
async function theHandOver(page: Page, language: Language) {
  await messageLanguage(page).getByRole('radio', { name: language.ownName }).check();
  const link = page.getByRole('link', { name: /WhatsApp/ });
  const address = new URL((await link.getAttribute('href')) ?? '');
  return {
    chat: `${address.origin}${address.pathname}`,
    lines: (address.searchParams.get('text') ?? '').split('\n'),
  };
}

// The stored form's digits: +9647501234567 is 9647501234567.
function digitsOf(loginPhoneNumber: string): string {
  return `964${loginPhoneNumber.replace(/^0/, '')}`;
}

test('after the create, the hand-over offers the message in Kurdish, Arabic and English, each named in its own language, Kurdish chosen first; its link opens a WhatsApp chat with the login phone number, and its text holds the dashboard’s address, the login phone number and the password, each on a line of its own, in a different text in each language', async ({
  page,
}) => {
  const { vendor, password } = await createAMadeUpVendorInTheForm(page);

  await expect(messageLanguage(page).getByRole('radio')).toHaveCount(3);
  await expect(
    messageLanguage(page).getByRole('radio', { name: languages[0].ownName }),
  ).toBeChecked();

  const values = [
    dashboardUrl,
    inIraqsOwnForm(`+${digitsOf(vendor.loginPhoneNumber)}`),
    password,
  ];
  const texts = new Map<Language, string>();
  for (const language of languages) {
    const { chat, lines } = await theHandOver(page, language);

    expect(chat).toBe(`https://wa.me/${digitsOf(vendor.loginPhoneNumber)}`);
    for (const value of values) {
      expect(
        lines.filter((line) => line.includes(value)),
        `one line of the ${language.name} message holds ${value === password ? 'the password' : value}, after its label`,
      ).toEqual([
        expect.stringMatching(new RegExp(`\\S.* ${value.replaceAll('.', '\\.')}$`)),
      ]);
    }
    texts.set(language, lines.join('\n'));
  }
  expectADifferentTextInEachLanguage(texts);
});

// The value after a label on its line of the message, such as the login
// phone number after "Phone number:".
function valueAfter(lines: string[], label: string): string {
  const line = lines.find((each) => each.startsWith(`${label} `));
  expect(line, `the message has a line for ${label}`).toBeDefined();
  return (line ?? '').slice(label.length + 1);
}

test('in a fresh browser, the Vendor logs in with the login phone number and the password as the English message gives them, is made to replace the password, and reaches the Vendor portal', async ({
  browser,
  page,
}) => {
  await createAMadeUpVendorInTheForm(page);
  const english = languages.find(({ tag }) => tag === 'en') ?? languages[2];
  const { lines } = await theHandOver(page, english);
  const login = {
    name: valueAfter(lines, 'Phone number:'),
    password: valueAfter(lines, 'Temporary password:'),
  };

  await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
    await submitTheLoginScreen(vendorsPage, login, { typeTheName: true });
    await expectNewPasswordScreen(vendorsPage);
    await submitTheNewPasswordScreen(vendorsPage, aNewPassword());

    await expectTheVendorPortal(vendorsPage);
  });
});

test('a phone number that is not Iraqi is refused beside its field, which takes the focus, and nothing is created', async ({
  page,
}) => {
  await page.goto(newVendorUrl);
  await expect(newVendorHeading(page)).toBeVisible();
  // A number in London, as Ofcom keeps 020 7946 0xxx for drama.
  await fillInTheForm(page, { ...aMadeUpVendorToType(), phoneNumber: '+44 20 7946 0958' });
  await page.getByRole('button', { name: 'Create the Vendor' }).click();

  const phoneNumber = vendorFormField(page, 'Phone number');
  await expect(phoneNumber).toHaveAccessibleDescription(/not an Iraqi phone number/);
  await expect(phoneNumber).toHaveAttribute('aria-invalid', 'true');
  await expect(phoneNumber).toBeFocused();
  await expect(newVendorHeading(page)).toBeVisible();
  await expect(temporaryPassword(page)).toHaveCount(0);
});

test('the form does not scroll sideways, and meets the automated part of WCAG 2.2 level AA in light and in dark, with a refusal and a position problem shown', async ({
  page,
  context,
}) => {
  await page.goto(newVendorUrl);
  await expect(newVendorHeading(page)).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectAccessible(page);

  await context.setGeolocation(null);
  await page.getByRole('button', { name: 'Use this phone’s position' }).click();
  await expect(page.getByText('This phone’s position could not be found.')).toBeVisible();
  await page.getByRole('button', { name: 'Create the Vendor' }).click();
  await expect(vendorFormField(page, 'Name')).toHaveAttribute('aria-invalid', 'true');
  await expectNoSidewaysScroll(page);
  await expectAccessible(page);
});

test('the temporary password and the hand-over do not scroll sideways, and meet the automated part of WCAG 2.2 level AA in light and in dark', async ({
  page,
}) => {
  await createAMadeUpVendorInTheForm(page);
  await expect(messageLanguage(page)).toBeVisible();

  await expectNoSidewaysScroll(page);
  await expectAccessible(page);
});
