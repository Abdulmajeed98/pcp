import { randomInt } from 'node:crypto';

import { type APIRequestContext, expect } from '@playwright/test';

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

// An Iraqi mobile number unique to the run, in the local form a person types:
// 075 and eight random digits. The platform sends nothing to any number, and
// neither do the tests.
function aMadeUpMobileNumber(): string {
  return `075${String(randomInt(100_000_000)).padStart(8, '0')}`;
}

// Creates a made-up Vendor over HTTP as the Admin, with a name and a login
// phone number unique to the run, and plainly test data, and every detail a
// Vendor must have. It and its Login stay in the development services, which
// `pnpm services:reset` empties.
export async function createAMadeUpVendor(
  request: APIRequestContext,
  authorization: string,
): Promise<MadeUpVendor> {
  const word = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const name = `Made-up test Vendor ${word}`;
  const mobileNumber = aMadeUpMobileNumber();

  const created = await request.post(`${apiUrl}/v1/vendors`, {
    headers: { authorization },
    data: {
      name,
      city: 'erbil',
      address: 'Made-up Street, Erbil',
      phoneNumber: mobileNumber,
      loginPhoneNumber: mobileNumber,
    },
  });
  expect(created.status()).toBe(201);
  const { vendor, temporaryPassword } = (await created.json()) as CreatedVendor;

  return {
    id: vendor.id,
    name,
    loginPhoneNumber: vendor.loginPhoneNumber.international,
    temporaryPassword,
  };
}
