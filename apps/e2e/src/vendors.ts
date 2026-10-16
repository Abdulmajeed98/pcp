import {
  type APIRequestContext,
  type APIResponse,
  expect,
  type Page,
} from '@playwright/test';

import {
  type DevelopmentLogin,
  expectLoginScreen,
  expectNewPasswordScreen,
  expectTheVendorPortal,
  submitTheLoginScreen,
  submitTheNewPasswordScreen,
} from './development-logins';
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
  vendor: { id: string; loginPhoneNumber: { international: string } };
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
function aMadeUpMobileNumber(): string {
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

// Creates a made-up Vendor over HTTP as the Admin, with a name and a login
// phone number unique to the run, and plainly test data, and every detail a
// Vendor must have. A number another Vendor holds already is replaced by
// another. It and its Login stay in the development services, which
// `pnpm services:reset` empties.
export async function createAMadeUpVendor(
  request: APIRequestContext,
  authorization: string,
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
    name,
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

// Logs in as a made-up Vendor through its first login, the path a real
// Vendor takes: it opens the dashboard, types its login phone number at
// Keycloak's login screen, in the stored form unless the test gives another,
// gives its temporary password, chooses a new password made for the run on
// the screen that asks for one, and waits for the Vendor portal. Both
// passwords are set in the page. It gives back what the Vendor logs in with
// from then on.
export async function logInForTheFirstTime(
  page: Page,
  vendor: MadeUpVendor,
  typed = vendor.loginPhoneNumber,
): Promise<DevelopmentLogin> {
  await page.goto(dashboardUrl);
  await expectLoginScreen(page);
  await submitTheLoginScreen(page, typed, vendor.temporaryPassword, 'typed');

  await expectNewPasswordScreen(page);
  const password = aNewPassword();
  await submitTheNewPasswordScreen(page, password);

  await expectTheVendorPortal(page);
  return { name: vendor.loginPhoneNumber, password };
}
