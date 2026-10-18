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
  address: string;
  mapLocation: { latitude: number; longitude: number } | null;
  phoneNumber: PhoneNumberBody;
  whatsAppNumber: PhoneNumberBody | null;
  instagramName: string | null;
  openingHours: string | null;
  loginPhoneNumber: PhoneNumberBody;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

// A Vendor as the list of Vendors shows it, and a page of them.
type VendorSummaryBody = Pick<VendorBody, 'id' | 'name' | 'loginPhoneNumber' | 'active'>;
type VendorPageBody = {
  content: VendorSummaryBody[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

// What creating a Vendor answers: the Vendor, and its Login's temporary
// password, this once.
type CreatedVendorBody = { vendor: VendorBody; temporaryPassword: string };

// Every detail a Vendor needs, and none of those it may leave out, with a
// login phone number of its own. A detail set to undefined is left out of
// the request, as JSON leaves it out.
function aVendor(loginPhoneNumber: string): Record<string, unknown> {
  return {
    name: 'Made-up Computer Shop',
    city: 'erbil',
    address: 'Made-up Street, Erbil',
    phoneNumber: '066 223 4567',
    loginPhoneNumber,
  };
}

// An address and opening hours as a Vendor in Erbil may write them: in
// Sorani, in the Arabic script, with Arabic-Indic digits, on several lines.
const anAddressAsWritten = 'شەقامی ٦٠ مەتری، نزیک بازاڕی ١٠٠\nهەولێر';
const openingHoursAsWritten = 'شەممە تا پێنجشەممە: ٩ بۆ ٩\n\nهەینی: داخراوە';

// Erbil's coordinates, as Google Maps shows them.
const erbil = { latitude: 36.1911744, longitude: 44.0094145 };

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

// The refusal of a Vendor's Login that names any Vendor but its own, the
// same whether that Vendor exists or not.
const vendorAccessDenied = [
  {
    code: 'VENDOR_ACCESS_DENIED',
    title: 'vendor_access_denied_title',
    detail: 'vendor_access_denied_details',
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

  function listVendors(
    query: Record<string, string> = {},
    token = adminToken,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/vendors?${new URLSearchParams(query)}`, {
      headers: bearerHeader(token),
    });
  }

  function readCallersVendor(token: string): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/caller/vendor`, { headers: bearerHeader(token) });
  }

  async function createdOf(response: Response): Promise<CreatedVendorBody> {
    expect(response.status).toBe(201);
    return (await response.json()) as CreatedVendorBody;
  }

  // A made-up Vendor the Admin creates, with a login phone number of its own.
  async function aVendorWith(loginPhoneNumber: string): Promise<VendorBody> {
    const { vendor } = await createdOf(await createVendor(aVendor(loginPhoneNumber)));
    return vendor;
  }

  // A token of the Vendor's own Login, as Keycloak issues it: its subject is
  // the Login's identifier, and its name the login phone number, unless the
  // test gives another name.
  async function tokenOfTheOwnLogin(
    vendor: VendorBody,
    loginName = vendor.loginPhoneNumber.international,
  ): Promise<string> {
    const [login] = await loginsNamed(vendor.loginPhoneNumber.international);
    return testApp.tokenOf({ subject: login.id, loginName, roles: ['vendor'] });
  }

  describe('creating a Vendor', () => {
    it('lets the Admin create a Vendor with every detail and read it back, its phone numbers in both forms', async () => {
      const { vendor } = await createdOf(
        await createVendor({
          name: 'Made-up Computer Shop',
          city: 'erbil',
          address: anAddressAsWritten,
          mapLocation: erbil,
          phoneNumber: '066 223 4567',
          whatsAppNumber: '0770 123 4567',
          instagramName: '@Made_Up.Shop',
          openingHours: openingHoursAsWritten,
          loginPhoneNumber: '0750 123 4567',
        }),
      );

      expect(vendor).toEqual({
        id: expect.any(String),
        name: 'Made-up Computer Shop',
        city: 'erbil',
        address: 'شەقامی ٦٠ مەتری، نزیک بازاڕی ١٠٠\nهەولێر',
        mapLocation: { latitude: 36.1911744, longitude: 44.0094145 },
        phoneNumber: { international: '+964662234567', national: '066 223 4567' },
        whatsAppNumber: { international: '+9647701234567', national: '0770 123 4567' },
        instagramName: 'made_up.shop',
        openingHours: 'شەممە تا پێنجشەممە: ٩ بۆ ٩\n\nهەینی: داخراوە',
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
      ['with +964', '+964 66 223 4567', '+964 770 123 4567'],
      ['with 00964', '00964 66 223 4567', '00964 770 123 4567'],
      ['in Arabic-Indic digits', '٠٦٦ ٢٢٣ ٤٥٦٧', '٠٧٧٠ ١٢٣ ٤٥٦٧'],
      ['in Eastern Arabic-Indic digits', '۰۶۶ ۲۲۳ ۴۵۶۷', '۰۷۷۰ ۱۲۳ ۴۵۶۷'],
    ])(
      'reads a phone number and a WhatsApp number typed %s, and answers each in both forms',
      async (_form, phoneNumber, whatsAppNumber) => {
        const { vendor } = await createdOf(
          await createVendor({ ...aVendor('0750 123 4567'), phoneNumber, whatsAppNumber }),
        );

        const read = (await (await readVendor(vendor.id)).json()) as VendorBody;

        expect(read.phoneNumber).toEqual({
          international: '+964662234567',
          national: '066 223 4567',
        });
        expect(read.whatsAppNumber).toEqual({
          international: '+9647701234567',
          national: '0770 123 4567',
        });
      },
    );

    it.each<[string, Record<string, unknown>]>([
      ['left out', {}],
      [
        'sent as null',
        {
          mapLocation: null,
          whatsAppNumber: null,
          instagramName: null,
          openingHours: null,
        },
      ],
      [
        'left empty',
        {
          mapLocation: {},
          whatsAppNumber: '',
          instagramName: ' ',
          openingHours: '\n',
        },
      ],
    ])(
      'reads back as absent the details a Vendor may leave out, %s',
      async (_how, details) => {
        const { vendor } = await createdOf(
          await createVendor({ ...aVendor('0750 123 4567'), ...details }),
        );

        const read = (await (await readVendor(vendor.id)).json()) as VendorBody;

        expect(read).toMatchObject({
          mapLocation: null,
          whatsAppNumber: null,
          instagramName: null,
          openingHours: null,
        });
      },
    );

    it.each([
      ['with an @ before it', '@Made_Up.Shop'],
      ["as its profile's address", 'https://www.instagram.com/Made_Up.Shop/'],
      [
        "as its profile's address shared from the app",
        'https://www.instagram.com/Made_Up.Shop?igsh=MWQ1ZGUxMzBkMA==',
      ],
      ["as its profile's address without https or www", 'instagram.com/Made_Up.Shop'],
    ])('keeps an Instagram name typed %s bare and in lower case', async (_form, typed) => {
      const { vendor } = await createdOf(
        await createVendor({ ...aVendor('0750 123 4567'), instagramName: typed }),
      );

      const read = await readVendor(vendor.id);

      expect(((await read.json()) as VendorBody).instagramName).toBe('made_up.shop');
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
    it.each<[string, Record<string, unknown>, ExpectedErrorResponse, string]>([
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
        'no login phone number',
        { ...aVendor('0750 123 4567'), loginPhoneNumber: undefined },
        notValid('loginPhoneNumber', { reason: 'missing' }),
        '+9647501234567',
      ],
      [
        'a login phone number of spaces alone',
        aVendor('   '),
        notValid('loginPhoneNumber', { reason: 'missing' }),
        '+9647501234567',
      ],
      [
        'no name',
        { ...aVendor('0750 123 4567'), name: undefined },
        notValid('name', { reason: 'missing' }),
        '+9647501234567',
      ],
      [
        'an empty name',
        { ...aVendor('0750 123 4567'), name: '' },
        notValid('name', { reason: 'missing' }),
        '+9647501234567',
      ],
      [
        'a name of spaces alone',
        { ...aVendor('0750 123 4567'), name: '   ' },
        notValid('name', { reason: 'missing' }),
        '+9647501234567',
      ],
      [
        'a name of 101 characters',
        { ...aVendor('0750 123 4567'), name: 'م'.repeat(101) },
        notValid('name', { reason: 'tooLong' }),
        '+9647501234567',
      ],
      [
        'no city',
        { ...aVendor('0750 123 4567'), city: undefined },
        notValid('city', { reason: 'missing' }),
        '+9647501234567',
      ],
      [
        'an empty city, as a form sends one not chosen',
        { ...aVendor('0750 123 4567'), city: '' },
        notValid('city', { reason: 'missing' }),
        '+9647501234567',
      ],
      [
        'a city outside the set',
        { ...aVendor('0750 123 4567'), city: 'baghdad' },
        notValid('city', { reason: 'notInTheSet' }),
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

    it.each<[string, Record<string, unknown>, ExpectedErrorResponse]>([
      ['no address', { address: undefined }, notValid('address', { reason: 'missing' })],
      [
        'an address of spaces and line breaks alone',
        { address: ' \n ' },
        notValid('address', { reason: 'missing' }),
      ],
      [
        'an address of 301 characters',
        { address: 'م'.repeat(301) },
        notValid('address', { reason: 'tooLong' }),
      ],
      [
        'no phone number',
        { phoneNumber: undefined },
        notValid('phoneNumber', { reason: 'missing' }),
      ],
      [
        'an empty phone number',
        { phoneNumber: '' },
        notValid('phoneNumber', { reason: 'missing' }),
      ],
      [
        'opening hours of 301 characters',
        { openingHours: 'م'.repeat(301) },
        notValid('openingHours', { reason: 'tooLong' }),
      ],
      [
        'a landline as the WhatsApp number',
        { whatsAppNumber: '066 223 4567' },
        notValid('whatsAppNumber', { reason: 'notMobile' }),
      ],
      [
        'a WhatsApp number that is not Iraqi',
        { whatsAppNumber: '+1 202 555 0123' },
        notValid('whatsAppNumber', { reason: 'notIraqi' }),
      ],
      [
        'a phone number that is not Iraqi',
        { phoneNumber: '+1 202 555 0123' },
        notValid('phoneNumber', { reason: 'notIraqi' }),
      ],
      [
        'a location outside Iraq',
        { mapLocation: { latitude: 41.0082, longitude: 28.9784 } },
        notValid('mapLocation', { reason: 'outsideIraq' }),
      ],
      [
        "Erbil's coordinates typed the wrong way round",
        { mapLocation: { latitude: 44.0094145, longitude: 36.1911744 } },
        notValid('mapLocation', { reason: 'outsideIraq' }),
      ],
      [
        'a latitude without a longitude',
        { mapLocation: { latitude: 36.1911744 } },
        notValid('mapLocation.longitude', { reason: 'missing' }),
      ],
      [
        'a longitude without a latitude',
        { mapLocation: { latitude: null, longitude: 44.0094145 } },
        notValid('mapLocation.latitude', { reason: 'missing' }),
      ],
      [
        'an Instagram name with a space in it',
        { instagramName: 'made up.shop' },
        notValid('instagramName', { reason: 'notAnInstagramName' }),
      ],
      [
        'an Instagram name of 31 characters',
        { instagramName: 'a'.repeat(31) },
        notValid('instagramName', { reason: 'tooLong' }),
      ],
      [
        'the address of an Instagram post as the Instagram name',
        { instagramName: 'https://www.instagram.com/p/C1a2B3c4D5e/' },
        notValid('instagramName', { reason: 'notAnInstagramName' }),
      ],
    ])(
      'refuses %s, naming the field and its reason, and makes no Vendor and no Login',
      async (_what, details, error) => {
        const response = await createVendor({ ...aVendor('0750 123 4567'), ...details });

        await expectErrorResponse(response, 400, [error]);
        expect(await loginsNamed('+9647501234567')).toEqual([]);
        // Nothing holds its login phone number: a Vendor with it is taken.
        expect((await createVendor(aVendor('0750 123 4567'))).status).toBe(201);
      },
    );

    it('takes a name of 100 characters, as written', async () => {
      const name = ' م'.repeat(50);

      const { vendor } = await createdOf(
        await createVendor({ ...aVendor('0750 123 4567'), name }),
      );

      expect(vendor.name).toBe(name);
    });

    it('takes an address and opening hours of 300 characters, as written, and an Instagram name of 30', async () => {
      const address = ' م\n'.repeat(100);
      const openingHours = '٩ م'.repeat(100);

      const { vendor } = await createdOf(
        await createVendor({
          ...aVendor('0750 123 4567'),
          address,
          openingHours,
          instagramName: 'a'.repeat(30),
        }),
      );

      expect(vendor).toMatchObject({
        address,
        openingHours,
        instagramName: 'a'.repeat(30),
      });
    });

    it.each<[string, Record<string, unknown>, ExpectedErrorResponse]>([
      ['an address that is a number', { address: 42 }, notValid('address')],
      [
        'a latitude in a text',
        { mapLocation: { latitude: '36.19', longitude: 44.01 } },
        notValid('mapLocation.latitude'),
      ],
      [
        'a map location with a field of its own',
        { mapLocation: { ...erbil, altitude: 415 } },
        notValid('mapLocation.altitude'),
      ],
    ])(
      "refuses %s with the request's own refusal, naming the field",
      async (_what, details, error) => {
        const response = await createVendor({ ...aVendor('0750 123 4567'), ...details });

        await expectErrorResponse(response, 400, [error]);
        expect(await loginsNamed('+9647501234567')).toEqual([]);
      },
    );

    it('names only the first detail that does not fit, in the order the Vendor form asks for them', async () => {
      const response = await createVendor({
        ...aVendor('0750 123 4567'),
        address: 'م'.repeat(301),
        phoneNumber: '+1 202 555 0123',
        instagramName: 'made up.shop',
      });

      await expectErrorResponse(response, 400, [
        notValid('address', { reason: 'tooLong' }),
      ]);
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

  describe('listing Vendors', () => {
    // A made-up Vendor of this name, with a login phone number of its own.
    async function aVendorNamed(
      name: string,
      loginPhoneNumber: string,
    ): Promise<VendorBody> {
      const { vendor } = await createdOf(
        await createVendor({ ...aVendor(loginPhoneNumber), name }),
      );
      return vendor;
    }

    it('gives every Vendor once across the pages, active and deactivated, in name order, with the totals', async () => {
      const made = new Map<string, VendorBody>();
      for (const [letter, loginPhoneNumber] of [
        ['E', '0750 000 0005'],
        ['C', '0750 000 0003'],
        ['A', '0750 000 0001'],
        ['D', '0750 000 0004'],
        ['B', '0750 000 0002'],
      ]) {
        made.set(letter, await aVendorNamed(`Made-up ${letter}`, loginPhoneNumber));
      }
      // No endpoint deactivates a Vendor yet (ticket 12), so the database
      // marks one.
      await inTheDatabase(
        `UPDATE vendor SET active = false WHERE id = '${made.get('C')?.id}'`,
      );

      const pages = await Promise.all(
        ['0', '1', '2'].map(async (page) => {
          const response = await listVendors({ page, size: '2' });
          expect(response.status).toBe(200);
          return (await response.json()) as VendorPageBody;
        }),
      );

      expect(pages.flatMap((page) => page.content)).toEqual(
        ['A', 'B', 'C', 'D', 'E'].map((letter) => ({
          id: made.get(letter)?.id,
          name: `Made-up ${letter}`,
          loginPhoneNumber: {
            international: `+964750000000${'ABCDE'.indexOf(letter) + 1}`,
            national: `0750 000 000${'ABCDE'.indexOf(letter) + 1}`,
          },
          active: letter !== 'C',
        })),
      );
      expect(pages.map(({ content: _content, ...paging }) => paging)).toEqual([
        {
          pageNumber: 0,
          pageSize: 2,
          totalElements: 5,
          totalPages: 3,
          first: true,
          last: false,
        },
        {
          pageNumber: 1,
          pageSize: 2,
          totalElements: 5,
          totalPages: 3,
          first: false,
          last: false,
        },
        {
          pageNumber: 2,
          pageSize: 2,
          totalElements: 5,
          totalPages: 3,
          first: false,
          last: true,
        },
      ]);
    });

    it('orders Vendors of the same name by their identifiers, so that no page repeats or skips one', async () => {
      const ids = [];
      for (const loginPhoneNumber of ['0750 000 0001', '0750 000 0002', '0750 000 0003']) {
        ids.push((await aVendorNamed('Made-up twin', loginPhoneNumber)).id);
      }

      const pages = await Promise.all(
        ['0', '1', '2'].map(async (page) => {
          const response = await listVendors({ page, size: '1' });
          return (await response.json()) as VendorPageBody;
        }),
      );

      expect(pages.flatMap((page) => page.content.map((vendor) => vendor.id))).toEqual(
        ids.sort(),
      );
    });

    it('answers an empty first page when there is no Vendor', async () => {
      const response = await listVendors();

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        content: [],
        pageNumber: 0,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      });
    });

    it('refuses a page size over the largest, naming it', async () => {
      const response = await listVendors({ size: '1000' });

      await expectErrorResponse(response, 400, [notValid('size')]);
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

    it("lets the Vendor's own Login read its Vendor", async () => {
      const vendor = await aVendorWith('0750 123 4567');

      const response = await readVendor(vendor.id, await tokenOfTheOwnLogin(vendor));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(vendor);
    });

    it("refuses the Vendor's own Login another Vendor, with an error of its own", async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const another = await aVendorWith('0750 765 4321');

      const response = await readVendor(another.id, await tokenOfTheOwnLogin(vendor));

      await expectErrorResponse(response, 403, vendorAccessDenied);
    });

    it.each([
      ['an identifier no Vendor has', '0b4d6f8a-2c1e-4a3b-9d5f-7e6a8b9c0d1e'],
      ['a text that is no identifier', 'not-a-vendor'],
    ])(
      "refuses the Vendor's own Login %s as it refuses another Vendor, where the Admin is answered 404",
      async (_what, vendorId) => {
        const vendor = await aVendorWith('0750 123 4567');

        const response = await readVendor(vendorId, await tokenOfTheOwnLogin(vendor));

        await expectErrorResponse(response, 403, vendorAccessDenied);
      },
    );

    it('refuses a Login that holds the vendor role and has no Vendor behind it every Vendor', async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const loginWithNoVendor = await testApp.tokenOf({ roles: ['vendor'] });

      const response = await readVendor(vendor.id, loginWithNoVendor);

      await expectErrorResponse(response, 403, vendorAccessDenied);
    });
  });

  describe("the Caller's Vendor", () => {
    it("answers the Vendor's own Login with its Vendor", async () => {
      const vendor = await aVendorWith('0750 123 4567');
      await aVendorWith('0750 765 4321');

      const response = await readCallersVendor(await tokenOfTheOwnLogin(vendor));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(vendor);
    });

    // A Login's name can change, and a token issued before the change still
    // carries the old one. Its identifier stays.
    it("finds the Vendor by its Login's identifier, whatever name the token carries", async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const another = await aVendorWith('0750 765 4321');

      const response = await readCallersVendor(
        await tokenOfTheOwnLogin(vendor, another.loginPhoneNumber.international),
      );

      expect(response.status).toBe(200);
      expect(((await response.json()) as VendorBody).id).toBe(vendor.id);
    });

    it('answers a Login that holds the vendor role and has no Vendor behind it 404, with an error of its own', async () => {
      await aVendorWith('0750 123 4567');
      const loginWithNoVendor = await testApp.tokenOf({
        loginName: '+9647501234567',
        roles: ['vendor'],
      });

      const response = await readCallersVendor(loginWithNoVendor);

      await expectErrorResponse(response, 404, vendorNotFound);
    });

    it('refuses the Admin, who has no Vendor of its own', async () => {
      const response = await readCallersVendor(adminToken);

      await expectErrorResponse(response, 403, accessDenied);
    });
  });

  describe('who may call them', () => {
    it("refuses a Vendor's Login a create, and makes no Login", async () => {
      const vendorToken = await testApp.tokenOf({ roles: ['vendor'] });

      const response = await createVendor(aVendor('0750 123 4567'), vendorToken);

      await expectErrorResponse(response, 403, accessDenied);
      expect(await loginsNamed('+9647501234567')).toEqual([]);
    });

    it("refuses a Vendor's own Login the list", async () => {
      await createdOf(await createVendor(aVendor('0750 123 4567')));
      const [login] = await loginsNamed('+9647501234567');
      const vendorToken = await testApp.tokenOf({ subject: login.id, roles: ['vendor'] });

      const response = await listVendors({}, vendorToken);

      await expectErrorResponse(response, 403, accessDenied);
    });

    it('refuses the list without a token', async () => {
      const response = await fetch(`${testApp.baseUrl}/v1/vendors`);

      await expectErrorResponse(response, 401, unauthorized);
    });

    it('refuses a create without a token', async () => {
      const response = await fetch(`${testApp.baseUrl}/v1/vendors`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(aVendor('0750 123 4567')),
      });

      await expectErrorResponse(response, 401, unauthorized);
    });

    it("refuses the Caller's Vendor without a token", async () => {
      const response = await fetch(`${testApp.baseUrl}/v1/caller/vendor`);

      await expectErrorResponse(response, 401, unauthorized);
    });

    it('refuses a read without a token', async () => {
      const { vendor } = await createdOf(await createVendor(aVendor('0750 123 4567')));

      const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendor.id}`);

      await expectErrorResponse(response, 401, unauthorized);
    });
  });
});
