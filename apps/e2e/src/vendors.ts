import {
  type APIRequestContext,
  type APIResponse,
  type Browser,
  expect,
  type Page,
} from '@playwright/test';

import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import {
  atTheLoginScreenInABrowserOfItsOwn,
  expectNewPasswordScreen,
  type LoginDetails,
  submitTheLoginScreen,
  submitTheNewPasswordScreen,
  type VendorLoginDetails,
} from './keycloak-screens';
import { aWordUniqueToTheRun, randomDigits } from './made-up';
import { apiUrl, dashboardUrl } from './platform';

// A made-up Vendor a test creates, and what its Login logs in with. The login
// phone number and the temporary password are never printed.
export interface MadeUpVendor {
  id: string;
  name: string;
  // The login phone number in the stored form, such as `+9647501234567`.
  loginPhoneNumber: string;
  temporaryPassword: string;
}

// What the API answers to a create, as far as the tests read it.
interface CreatedVendor {
  vendor: { id: string; name: string; loginPhoneNumber: { international: string } };
  temporaryPassword: string;
}

// What the API answers to a refused create, as far as the tests read it.
interface Refusal {
  errors: { additionalInformation?: { field?: string; reason?: string } }[];
}

// How many made-up login phone numbers a create tries. Each is random, and a
// made-up Vendor of an earlier run, which stays in the development services,
// may hold the one tried.
const numbersTried = 5;

// An Iraqi mobile number, in the local form a person types: 075 and eight
// random digits. The platform sends nothing to any number, and neither do the
// tests.
export function aMadeUpMobileNumber(): string {
  return `075${randomDigits(8)}`;
}

async function isRefusedAsTaken(response: APIResponse): Promise<boolean> {
  if (response.status() !== 400) return false;
  const { errors } = (await response.json()) as Refusal;
  return errors.some(
    ({ additionalInformation: refused }) =>
      refused?.field === 'loginPhoneNumber' && refused.reason === 'taken',
  );
}

// Details a test may give a made-up Vendor, in place of those it is given
// otherwise, or beside them, as the API takes them.
export type MadeUpVendorDetails = Record<string, unknown>;

// Creates a made-up Vendor over HTTP as the Admin, with a name and a login
// phone number unique to the run, and plainly test data, and every detail a
// Vendor must have, and any other details the test gives. A number another
// Vendor holds already is replaced by another. It and its Login stay in the
// development services, which `pnpm services:reset` empties.
export async function createAMadeUpVendor(
  request: APIRequestContext,
  authorization: string,
  details: MadeUpVendorDetails = {},
): Promise<MadeUpVendor> {
  const name = `Made-up test Vendor ${aWordUniqueToTheRun()}`;
  const createWithANewNumber = () => {
    const mobileNumber = aMadeUpMobileNumber();
    return request.post(`${apiUrl}/v1/vendors`, {
      headers: { authorization },
      data: {
        name,
        city: 'erbil',
        address: 'Made-up Street, Erbil',
        phoneNumber: mobileNumber,
        loginPhoneNumber: mobileNumber,
        ...details,
      },
    });
  };

  let created = await createWithANewNumber();
  for (let tried = 1; tried < numbersTried && (await isRefusedAsTaken(created)); tried++) {
    created = await createWithANewNumber();
  }
  expect(created.status()).toBe(201);
  const { vendor, temporaryPassword } = (await created.json()) as CreatedVendor;

  return {
    id: vendor.id,
    name: vendor.name,
    loginPhoneNumber: vendor.loginPhoneNumber.international,
    temporaryPassword,
  };
}

// A login phone number in the stored form, `+9647501234567`, in the local form
// a person writes, in groups: 0750, 123 and 4567.
function inGroups(loginPhoneNumber: string): string[] {
  const local = `0${loginPhoneNumber.replace(/^\+964/, '')}`;
  return [local.slice(0, 4), local.slice(4, 7), local.slice(7)];
}

// The same number in Iraq's own form, which the platform shows a person:
// 0750 123 4567.
export function inIraqsOwnForm(loginPhoneNumber: string): string {
  return inGroups(loginPhoneNumber).join(' ');
}

// The same number as a Kurdish or an Arabic keyboard types it, in
// Arabic-Indic digits with spaces: ٠٧٥٠ ١٢٣ ٤٥٦٧.
export function inArabicIndicDigitsWithSpaces(loginPhoneNumber: string): string {
  return inGroups(loginPhoneNumber)
    .join(' ')
    .replace(/[0-9]/g, (digit) => String.fromCharCode(0x0660 + Number(digit)));
}

// The same number in local form with dashes: 0750-123-4567.
export function inLocalFormWithDashes(loginPhoneNumber: string): string {
  return inGroups(loginPhoneNumber).join('-');
}

// A password a made-up Vendor chooses for itself, made for the run. It fits
// the realm's password policy, and is never printed.
export function aNewPassword(): string {
  return `new-password-${aWordUniqueToTheRun()}`;
}

// Logs in to the dashboard as the development Admin, in the page the test
// gives, and creates a made-up Vendor over HTTP as that Admin, with any
// details the test gives.
export async function createAMadeUpVendorAsTheAdmin(
  page: Page,
  request: APIRequestContext,
  details: MadeUpVendorDetails = {},
): Promise<MadeUpVendor> {
  return createAMadeUpVendor(
    request,
    await authorizationOfTheDevelopmentAdmin(page),
    details,
  );
}

// What a made-up Vendor logs in with before its first login: its login phone
// number in the stored form and its temporary password.
export function temporaryLoginOf(vendor: MadeUpVendor): LoginDetails {
  return { name: vendor.loginPhoneNumber, password: vendor.temporaryPassword };
}

// Gives the page the API's answer for a Login that holds the Vendor role and
// has no Vendor behind it, whenever the page asks for the Caller's Vendor.
// Such a Login is one made by hand in Keycloak's console, and the tests make
// none in the development Keycloak.
export async function answerAsForALoginWithNoVendor(page: Page): Promise<void> {
  await page.route(`${apiUrl}/v1/caller/vendor`, (route) =>
    route.fulfill({
      status: 404,
      json: {
        errors: [
          {
            code: 'VENDOR_NOT_FOUND',
            title: 'vendor_not_found_title',
            detail: 'vendor_not_found_details',
          },
        ],
      },
    }),
  );
}

// The Vendor portal, which a Login that is not the Admin's gets. It is told
// apart from the Admin console by its frame.
export async function expectTheVendorPortal(page: Page): Promise<void> {
  await page.waitForURL(`${dashboardUrl}/**`);
  await expect(page.getByTestId('frame')).toBeVisible();
}

interface HowTheNumberIsTyped {
  // The login phone number as the Vendor types it, such as in Arabic-Indic
  // digits with spaces. Unless the test gives one, it is the stored form.
  loginPhoneNumberAsTyped?: string;
}

// Logs in as a made-up Vendor through its first login, the path a real
// Vendor takes, from Keycloak's login screen, which the page shows: it types
// its login phone number, gives its temporary password, chooses a new
// password made for the run on the screen that asks for one, and waits for
// the Vendor portal. Both passwords are set in the page. It gives back what
// the Vendor logs in with from then on, and the Vendor's name and identifier.
export async function logInForTheFirstTime(
  page: Page,
  vendor: MadeUpVendor,
  { loginPhoneNumberAsTyped = vendor.loginPhoneNumber }: HowTheNumberIsTyped = {},
): Promise<VendorLoginDetails> {
  await submitTheLoginScreen(
    page,
    { ...temporaryLoginOf(vendor), name: loginPhoneNumberAsTyped },
    { typeTheName: true },
  );

  await expectNewPasswordScreen(page);
  const password = aNewPassword();
  await submitTheNewPasswordScreen(page, password);

  await expectTheVendorPortal(page);
  return {
    name: vendor.loginPhoneNumber,
    password,
    vendorName: vendor.name,
    vendorId: vendor.id,
  };
}

// Makes a made-up Vendor, as the development Admin, with any details the
// test gives, and logs in as it once through its first login, each in a
// browser of its own that is closed afterwards. It gives back what the Vendor
// logs in with from then on, and its name and identifier, for a test that
// needs a Vendor whose Login is set up, as a real Vendor's is after its first
// login.
export async function aMadeUpVendorThatHasLoggedIn(
  browser: Browser,
  details: MadeUpVendorDetails = {},
): Promise<VendorLoginDetails> {
  const adminsContext = await browser.newContext();
  let vendor: MadeUpVendor;
  try {
    vendor = await createAMadeUpVendorAsTheAdmin(
      await adminsContext.newPage(),
      adminsContext.request,
      details,
    );
  } finally {
    await adminsContext.close();
  }

  return atTheLoginScreenInABrowserOfItsOwn(browser, (page) =>
    logInForTheFirstTime(page, vendor),
  );
}
