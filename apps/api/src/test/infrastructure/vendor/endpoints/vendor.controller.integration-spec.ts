import { connectionOf } from '@pcp/core';
import {
  accessDenied,
  bearerHeader,
  expectErrorResponse,
  type ExpectedErrorResponse,
  notValid,
  unauthorized,
} from '@pcp/core/test-utils';
import { Client } from 'pg';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import {
  emptyTheDatabase,
  testDatabaseSettings,
} from '../../../test-utils/database/test-database';
import {
  addThePasswordCheckClient,
  emptyTheRealm,
  logInAt,
  loginsNamed,
  makeALoginByHand,
  realmRolesOf,
  removeThePasswordCheckClient,
  whileKeycloakIsPaused,
} from '../../../test-utils/keycloak/keycloak-administrator';

// A phone number as the API answers it: the form it is stored in, and Iraq's
// own form, which a person reads.
type PhoneNumberBody = { international: string; national: string };

// A Vendor as the API answers it.
type VendorBody = {
  id: string;
  name: string;
  city: string;
  loginPhoneNumber: PhoneNumberBody;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

// What creating a Vendor answers: the Vendor, and its Login's temporary
// password, this once.
type CreatedVendorBody = { vendor: VendorBody; temporaryPassword: string };

// Every detail a Vendor needs, with a login phone number of its own.
function aVendor(loginPhoneNumber: string): Record<string, string> {
  return { name: 'Made-up Computer Shop', city: 'erbil', loginPhoneNumber };
}

// 12 lower-case letters and digits, without 0, o, 1, l and i.
const aTemporaryPassword = /^[a-hjkmnp-z2-9]{12}$/;

const identityServiceUnavailable = [
  {
    code: 'IDENTITY_SERVICE_UNAVAILABLE',
    title: 'identity_service_unavailable_title',
    detail: 'identity_service_unavailable_details',
  },
];

const vendorNotFound = [
  {
    code: 'VENDOR_NOT_FOUND',
    title: 'vendor_not_found_title',
    detail: 'vendor_not_found_details',
  },
];

const internalServerError = [
  {
    code: 'INTERNAL_SERVER_ERROR',
    title: 'internal_server_error_title',
    detail: 'internal_server_error_details',
  },
];

// Runs SQL in the test database as the API's own database user.
async function inTheDatabase(statement: string): Promise<void> {
  const client = new Client(connectionOf(testDatabaseSettings()));
  await client.connect();
  try {
    await client.query(statement);
  } finally {
    await client.end();
  }
}

// A fault planted in the database for as long as the function runs: a rule
// that no Vendor can meet, so that storing one is refused.
async function whileTheDatabaseRefusesEveryVendor(run: () => Promise<void>): Promise<void> {
  await inTheDatabase(
    'ALTER TABLE vendor ADD CONSTRAINT planted_refusal_of_every_vendor CHECK (false)',
  );
  try {
    await run();
  } finally {
    await inTheDatabase(
      'ALTER TABLE vendor DROP CONSTRAINT planted_refusal_of_every_vendor',
    );
  }
}

describe('the Vendor endpoints', () => {
  let testApp: TestAppWithLogins;
  let adminToken: string;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
    adminToken = await testApp.tokenOf({ roles: ['admin'] });
    await addThePasswordCheckClient();
  });

  afterAll(async () => {
    await removeThePasswordCheckClient();
    await testApp.close();
  });

  afterEach(async () => {
    await emptyTheDatabase();
    await emptyTheRealm();
  });

  function createVendor(body: unknown, token = adminToken): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/vendors`, {
      method: 'POST',
      headers: { ...bearerHeader(token), 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  function readVendor(vendorId: string, token = adminToken): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}`, {
      headers: bearerHeader(token),
    });
  }

  async function createdOf(response: Response): Promise<CreatedVendorBody> {
    expect(response.status).toBe(201);
    return (await response.json()) as CreatedVendorBody;
  }

  describe('creating a Vendor', () => {
    it('lets the Admin create a Vendor and read it back, its login phone number in both forms', async () => {
      const { vendor } = await createdOf(
        await createVendor({
          name: 'Made-up Computer Shop',
          city: 'erbil',
          loginPhoneNumber: '0750 123 4567',
        }),
      );

      expect(vendor).toEqual({
        id: expect.any(String),
        name: 'Made-up Computer Shop',
        city: 'erbil',
        loginPhoneNumber: { international: '+9647501234567', national: '0750 123 4567' },
        active: true,
        createdAt: expect.any(String),
        updatedAt: vendor.createdAt,
      });

      const read = await readVendor(vendor.id);

      expect(read.status).toBe(200);
      expect(await read.json()).toEqual(vendor);
    });

    it.each([
      ['with +964', '+964 751 234 5678', '+9647512345678', '0751 234 5678'],
      ['with 00964', '00964 770 123 4567', '+9647701234567', '0770 123 4567'],
      ['in Arabic-Indic digits', '٠٧٨٠ ١٢٣ ٤٥٦٧', '+9647801234567', '0780 123 4567'],
      [
        'in Eastern Arabic-Indic digits',
        '۰۷۹۰ ۱۲۳ ۴۵۶۷',
        '+9647901234567',
        '0790 123 4567',
      ],
    ])(
      'reads a login phone number typed %s, and answers it in both forms',
      async (_form, typed, international, national) => {
        const { vendor } = await createdOf(await createVendor(aVendor(typed)));

        const read = await readVendor(vendor.id);

        expect(((await read.json()) as VendorBody).loginPhoneNumber).toEqual({
          international,
          national,
        });
      },
    );

    it('makes its Login, named by the login phone number as stored, enabled, holding the vendor role and no other platform role, asking for nothing but a new password', async () => {
      await createdOf(await createVendor(aVendor('0750 123 4567')));

      const logins = await loginsNamed('+9647501234567');

      expect(logins).toHaveLength(1);
      const [login] = logins;
      expect(login.enabled).toBe(true);
      expect(login.email).toBeUndefined();
      expect(login.firstName).toBeUndefined();
      expect(login.lastName).toBeUndefined();
      expect(login.requiredActions).toEqual(['UPDATE_PASSWORD']);
      const platformRoles = (await realmRolesOf(login.id)).filter((role) =>
        ['admin', 'vendor'].includes(role),
      );
      expect(platformRoles).toEqual(['vendor']);
    });

    it("answers the Login's temporary password, which the token address takes as the Login's, not yet set up", async () => {
      const { temporaryPassword } = await createdOf(
        await createVendor(aVendor('0750 123 4567')),
      );

      expect(temporaryPassword).toMatch(aTemporaryPassword);
      expect(await logInAt('+9647501234567', temporaryPassword)).toEqual({
        status: 400,
        body: { error: 'invalid_grant', error_description: 'Account is not fully set up' },
      });
      expect(await logInAt('+9647501234567', 'not-the-password')).toEqual({
        status: 400,
        body: { error: 'invalid_grant', error_description: 'Invalid user credentials' },
      });
    });

    it('answers a different temporary password for each Vendor', async () => {
      const first = await createdOf(await createVendor(aVendor('0750 123 4567')));
      const second = await createdOf(await createVendor(aVendor('0751 234 5678')));

      expect(second.temporaryPassword).toMatch(aTemporaryPassword);
      expect(second.temporaryPassword).not.toBe(first.temporaryPassword);
    });

    it('does not answer the temporary password when the Vendor is read', async () => {
      const { vendor, temporaryPassword } = await createdOf(
        await createVendor(aVendor('0750 123 4567')),
      );

      const read = await readVendor(vendor.id);

      expect(read.status).toBe(200);
      expect(await read.text()).not.toContain(temporaryPassword);
    });
  });

  describe('refusing a Vendor', () => {
    it.each<[string, Record<string, string>, ExpectedErrorResponse, string]>([
      [
        'a landline as the login phone number',
        aVendor('066 223 4567'),
        notValid('loginPhoneNumber', { reason: 'notMobile' }),
        '+964662234567',
      ],
      [
        'a number that is not Iraqi as the login phone number',
        aVendor('+1 202 555 0123'),
        notValid('loginPhoneNumber', { reason: 'notIraqi' }),
        '+12025550123',
      ],
      [
        'a login phone number a digit short',
        aVendor('0750 123 456'),
        notValid('loginPhoneNumber', { reason: 'notIraqi' }),
        '+964750123456',
      ],
      [
        'a login phone number with words around it',
        aVendor('call 0750 123 4567'),
        notValid('loginPhoneNumber', { reason: 'notIraqi' }),
        '+9647501234567',
      ],
      [
        'no name',
        { city: 'erbil', loginPhoneNumber: '0750 123 4567' },
        notValid('name'),
        '+9647501234567',
      ],
      [
        'an empty name',
        { ...aVendor('0750 123 4567'), name: '' },
        notValid('name'),
        '+9647501234567',
      ],
      [
        'a name of spaces alone',
        { ...aVendor('0750 123 4567'), name: '   ' },
        notValid('name'),
        '+9647501234567',
      ],
      [
        'a name of 101 characters',
        { ...aVendor('0750 123 4567'), name: 'م'.repeat(101) },
        notValid('name', { reason: 'tooLong' }),
        '+9647501234567',
      ],
      [
        'a city outside the set',
        { ...aVendor('0750 123 4567'), city: 'baghdad' },
        notValid('city'),
        '+9647501234567',
      ],
    ])(
      'refuses %s, naming the field, and makes no Login',
      async (_what, body, error, loginName) => {
        const response = await createVendor(body);

        await expectErrorResponse(response, 400, [error]);
        expect(await loginsNamed(loginName)).toEqual([]);
      },
    );

    it('takes a name of 100 characters, as written', async () => {
      const name = ' م'.repeat(50);

      const { vendor } = await createdOf(
        await createVendor({ ...aVendor('0750 123 4567'), name }),
      );

      expect(vendor.name).toBe(name);
    });

    it('refuses a login phone number another Vendor holds, typed in another form, as taken, and Keycloak holds no second Login', async () => {
      await createdOf(await createVendor(aVendor('0750 123 4567')));

      const response = await createVendor({
        ...aVendor('+964 750 123 4567'),
        name: 'Another made-up shop',
      });

      await expectErrorResponse(response, 400, [
        notValid('loginPhoneNumber', { reason: 'taken' }),
      ]);
      expect(await loginsNamed('+9647501234567')).toHaveLength(1);
    });

    it('refuses as taken a login phone number that a Login made by hand in Keycloak holds, with no Vendor behind it', async () => {
      await makeALoginByHand('+9647501234567');

      const response = await createVendor(aVendor('0750 123 4567'));

      await expectErrorResponse(response, 400, [
        notValid('loginPhoneNumber', { reason: 'taken' }),
      ]);
      expect(await loginsNamed('+9647501234567')).toHaveLength(1);
    });
  });

  describe('a create that fails halfway', () => {
    it('deletes the Login it made when the Vendor cannot be stored', async () => {
      await whileTheDatabaseRefusesEveryVendor(async () => {
        const response = await createVendor(aVendor('0750 123 4567'));

        await expectErrorResponse(response, 500, internalServerError);
      });

      expect(await loginsNamed('+9647501234567')).toEqual([]);
    });
  });

  describe('while Keycloak does not answer', () => {
    it('answers a create with 503 and an error of its own, and stores no Vendor', async () => {
      await whileKeycloakIsPaused(async () => {
        const response = await createVendor(aVendor('0750 123 4567'));

        await expectErrorResponse(response, 503, identityServiceUnavailable);
      });

      // Nothing holds the number: the same Vendor can be created at once.
      const again = await createVendor(aVendor('0750 123 4567'));

      expect(again.status).toBe(201);
    });

    it('still refuses a login phone number another Vendor holds, without asking Keycloak', async () => {
      await createdOf(await createVendor(aVendor('0750 123 4567')));

      await whileKeycloakIsPaused(async () => {
        const response = await createVendor(aVendor('0750 123 4567'));

        await expectErrorResponse(response, 400, [
          notValid('loginPhoneNumber', { reason: 'taken' }),
        ]);
      });
    });
  });

  describe('reading a Vendor', () => {
    it.each([
      ['an identifier no Vendor has', '0b4d6f8a-2c1e-4a3b-9d5f-7e6a8b9c0d1e'],
      ['a text that is no identifier', 'not-a-vendor'],
    ])('answers 404 with an error of its own for %s', async (_what, vendorId) => {
      const response = await readVendor(vendorId);

      await expectErrorResponse(response, 404, vendorNotFound);
    });
  });

  describe('who may call them', () => {
    it("refuses a Vendor's Login a create, and makes no Login", async () => {
      const vendorToken = await testApp.tokenOf({ roles: ['vendor'] });

      const response = await createVendor(aVendor('0750 123 4567'), vendorToken);

      await expectErrorResponse(response, 403, accessDenied);
      expect(await loginsNamed('+9647501234567')).toEqual([]);
    });

    it("refuses a Vendor's Login a read", async () => {
      const { vendor } = await createdOf(await createVendor(aVendor('0750 123 4567')));
      const vendorToken = await testApp.tokenOf({ roles: ['vendor'] });

      const response = await readVendor(vendor.id, vendorToken);

      await expectErrorResponse(response, 403, accessDenied);
    });

    it('refuses a create without a token', async () => {
      const response = await fetch(`${testApp.baseUrl}/v1/vendors`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(aVendor('0750 123 4567')),
      });

      await expectErrorResponse(response, 401, unauthorized);
    });

    it('refuses a read without a token', async () => {
      const { vendor } = await createdOf(await createVendor(aVendor('0750 123 4567')));

      const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendor.id}`);

      await expectErrorResponse(response, 401, unauthorized);
    });
  });
});
