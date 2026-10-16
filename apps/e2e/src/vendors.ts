import { type APIRequestContext, type APIResponse, expect } from '@playwright/test';

import { aWordUniqueToTheRun, randomDigits } from './made-up';
import { apiUrl } from './platform';

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
