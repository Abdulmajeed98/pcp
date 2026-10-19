import {
  accessDenied,
  bearerHeader,
  expectErrorResponse,
  type ExpectedErrorResponse,
  notValid,
  unauthorized,
} from '@pcp/core/test-utils';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import {
  emptyTheDatabase,
  whileTheDatabaseRefusesEveryVendor,
} from '../../../test-utils/database/test-database';
import {
  identityServiceUnavailable,
  internalServerError,
  vendorNotFound,
} from '../../../test-utils/error-bodies';
import {
  addThePasswordCheckClient,
  emptyTheRealm,
  giveALastingPassword,
  logInAt,
  loginsNamed,
  makeALoginByHand,
  realmRolesOf,
  removeThePasswordCheckClient,
  renameItselfInItsAccount,
  whileKeycloakIsPaused,
} from '../../../test-utils/keycloak/keycloak-administrator';

// The Admin's edit of a Vendor, which replaces every detail, its name, its
// city and its login phone number among them, and renames its Login when the
// login phone number changes (ADR-0009).

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

// Every detail a Vendor may have, with a login phone number of its own.
function aVendor(loginPhoneNumber: string): Record<string, unknown> {
  return {
    name: 'Made-up Computer Shop',
    city: 'erbil',
    address: 'Made-up Street, Erbil',
    mapLocation: { latitude: 36.1911744, longitude: 44.0094145 },
    phoneNumber: '066 223 4567',
    whatsAppNumber: '0770 123 4567',
    instagramName: '@made_up.shop',
    openingHours: 'Saturday to Thursday, 9 to 9',
    loginPhoneNumber,
  };
}

// Every detail again, each different from those `aVendor` gives, with the
// login phone number typed in Arabic-Indic digits.
const everyDetailChanged = {
  name: 'شەقامی ٦٠ کۆمپیوتەر',
  city: 'erbil',
  address: 'Another made-up street\nErbil',
  mapLocation: { latitude: 36.2, longitude: 44.02 },
  phoneNumber: '0751 234 5678',
  whatsAppNumber: '0780 123 4567',
  instagramName: 'https://www.instagram.com/Another_Shop/',
  openingHours: 'Every day, 10 to 10',
  loginPhoneNumber: '٠٧٥٠ ٧٦٥ ٤٣٢١',
};

// The password a Vendor chose at its first login, which the test gives its
// Login in place of that login.
const itsOwnPassword = 'its-own-password';

describe("the Admin's edit of a Vendor", () => {
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

  async function aVendorWith(loginPhoneNumber: string): Promise<VendorBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors`, {
      method: 'POST',
      headers: { ...bearerHeader(adminToken), 'content-type': 'application/json' },
      body: JSON.stringify(aVendor(loginPhoneNumber)),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { vendor: VendorBody }).vendor;
  }

  function editVendor(
    vendorId: string,
    body: unknown,
    token: string | null = adminToken,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}`, {
      method: 'PUT',
      headers: {
        ...(token === null ? {} : bearerHeader(token)),
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async function read(vendorId: string): Promise<VendorBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}`, {
      headers: bearerHeader(adminToken),
    });
    expect(response.status).toBe(200);
    return (await response.json()) as VendorBody;
  }

  // The identifier of the one Login of this name.
  async function loginIdOf(name: string): Promise<string> {
    const logins = await loginsNamed(name);
    expect(logins).toHaveLength(1);
    return logins[0].id;
  }

  describe('editing', () => {
    it('replaces every detail, the name and the login phone number among them, and reads back so', async () => {
      const vendor = await aVendorWith('0750 123 4567');

      const response = await editVendor(vendor.id, everyDetailChanged);

      expect(response.status).toBe(200);
      const edited = (await response.json()) as VendorBody;
      expect(edited).toEqual({
        id: vendor.id,
        name: 'شەقامی ٦٠ کۆمپیوتەر',
        city: 'erbil',
        address: 'Another made-up street\nErbil',
        mapLocation: { latitude: 36.2, longitude: 44.02 },
        phoneNumber: { international: '+9647512345678', national: '0751 234 5678' },
        whatsAppNumber: { international: '+9647801234567', national: '0780 123 4567' },
        instagramName: 'another_shop',
        openingHours: 'Every day, 10 to 10',
        loginPhoneNumber: { international: '+9647507654321', national: '0750 765 4321' },
        active: true,
        createdAt: vendor.createdAt,
        updatedAt: expect.any(String),
      });
      expect(new Date(edited.updatedAt) > new Date(vendor.updatedAt)).toBe(true);
      expect(await read(vendor.id)).toEqual(edited);
    });

    it('renames the Login to the new login phone number, as stored, and the Login keeps the password it had, its role and what it is asked for', async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const loginId = await loginIdOf('+9647501234567');
      await giveALastingPassword(loginId, itsOwnPassword);

      const response = await editVendor(vendor.id, everyDetailChanged);

      expect(response.status).toBe(200);
      expect(await loginsNamed('+9647501234567')).toEqual([]);
      const [login] = await loginsNamed('+9647507654321');
      expect(login).toMatchObject({ id: loginId, enabled: true, requiredActions: [] });
      expect(
        (await realmRolesOf(loginId)).filter((role) => ['admin', 'vendor'].includes(role)),
      ).toEqual(['vendor']);
      expect((await logInAt('+9647507654321', itsOwnPassword)).status).toBe(200);
      expect(await logInAt('+9647501234567', itsOwnPassword)).toEqual({
        status: 400,
        body: { error: 'invalid_grant', error_description: 'Invalid user credentials' },
      });
    });

    it('leaves a deactivated Vendor deactivated, and its renamed Login disabled, when its login phone number changes', async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const loginId = await loginIdOf('+9647501234567');
      await giveALastingPassword(loginId, itsOwnPassword);
      const deactivated = await fetch(
        `${testApp.baseUrl}/v1/vendors/${vendor.id}/deactivate`,
        { method: 'POST', headers: bearerHeader(adminToken) },
      );
      expect(deactivated.status).toBe(200);

      const response = await editVendor(vendor.id, everyDetailChanged);

      expect(response.status).toBe(200);
      expect(((await response.json()) as VendorBody).active).toBe(false);
      expect((await read(vendor.id)).active).toBe(false);
      const [login] = await loginsNamed('+9647507654321');
      expect(login).toMatchObject({ id: loginId, enabled: false });
      expect(await logInAt('+9647507654321', itsOwnPassword)).toEqual({
        status: 400,
        body: { error: 'invalid_grant', error_description: 'Account disabled' },
      });
    });

    it('keeps the Login as it is when the login phone number stays, typed in another form', async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const loginId = await loginIdOf('+9647501234567');

      const response = await editVendor(vendor.id, {
        ...everyDetailChanged,
        loginPhoneNumber: '+964 750 123 4567',
      });

      expect(response.status).toBe(200);
      expect(((await response.json()) as VendorBody).loginPhoneNumber.international).toBe(
        '+9647501234567',
      );
      expect(await loginIdOf('+9647501234567')).toBe(loginId);
    });

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
    ])('clears the details a Vendor may leave out, %s', async (_how, optional) => {
      const vendor = await aVendorWith('0750 123 4567');

      const response = await editVendor(vendor.id, {
        name: 'Made-up Computer Shop',
        city: 'erbil',
        address: 'Made-up Street, Erbil',
        phoneNumber: '066 223 4567',
        loginPhoneNumber: '0750 123 4567',
        ...optional,
      });

      expect(response.status).toBe(200);
      expect(await read(vendor.id)).toMatchObject({
        mapLocation: null,
        whatsAppNumber: null,
        instagramName: null,
        openingHours: null,
      });
    });
  });

  describe('refusing an edit', () => {
    it('refuses a login phone number another Vendor holds, typed in another form, as taken; neither Login is renamed and the Vendor is unchanged', async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const another = await aVendorWith('0750 765 4321');
      const loginId = await loginIdOf('+9647501234567');
      const anothersLoginId = await loginIdOf('+9647507654321');

      const response = await editVendor(vendor.id, {
        ...everyDetailChanged,
        loginPhoneNumber: '+964 750 765 4321',
      });

      await expectErrorResponse(response, 400, [
        notValid('loginPhoneNumber', { reason: 'taken' }),
      ]);
      expect(await loginIdOf('+9647501234567')).toBe(loginId);
      expect(await loginIdOf('+9647507654321')).toBe(anothersLoginId);
      expect(await read(vendor.id)).toEqual(vendor);
      expect(await read(another.id)).toEqual(another);
    });

    it('refuses as taken a login phone number that a Login made by hand in Keycloak holds, and keeps the Login as it was', async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const loginId = await loginIdOf('+9647501234567');
      await makeALoginByHand('+9647507654321');

      const response = await editVendor(vendor.id, everyDetailChanged);

      await expectErrorResponse(response, 400, [
        notValid('loginPhoneNumber', { reason: 'taken' }),
      ]);
      expect(await loginIdOf('+9647501234567')).toBe(loginId);
      expect(await read(vendor.id)).toEqual(vendor);
    });

    it.each<[string, Record<string, unknown>, ExpectedErrorResponse]>([
      ['no name', { name: undefined }, notValid('name', { reason: 'missing' })],
      [
        'a name of 101 characters',
        { name: 'م'.repeat(101) },
        notValid('name', { reason: 'tooLong' }),
      ],
      [
        'a city outside the set',
        { city: 'baghdad' },
        notValid('city', { reason: 'notInTheSet' }),
      ],
      ['no address', { address: undefined }, notValid('address', { reason: 'missing' })],
      [
        'a phone number that is not Iraqi',
        { phoneNumber: '+44 20 7946 0958' },
        notValid('phoneNumber', { reason: 'notIraqi' }),
      ],
      [
        'a location outside Iraq',
        { mapLocation: { latitude: 44.02, longitude: 36.2 } },
        notValid('mapLocation', { reason: 'outsideIraq' }),
      ],
      [
        'a landline as the login phone number',
        { loginPhoneNumber: '066 223 4567' },
        notValid('loginPhoneNumber', { reason: 'notMobile' }),
      ],
      [
        'no login phone number',
        { loginPhoneNumber: undefined },
        notValid('loginPhoneNumber', { reason: 'missing' }),
      ],
      ['a name that is not text', { name: 7 }, notValid('name')],
      ['a field of its own', { active: false }, notValid('active')],
    ])(
      'refuses %s, naming the field, and changes neither the Vendor nor its Login',
      async (_what, change, expected) => {
        const vendor = await aVendorWith('0750 123 4567');
        const loginId = await loginIdOf('+9647501234567');

        const response = await editVendor(vendor.id, { ...everyDetailChanged, ...change });

        await expectErrorResponse(response, 400, [expected]);
        expect(await read(vendor.id)).toEqual(vendor);
        expect(await loginIdOf('+9647501234567')).toBe(loginId);
      },
    );

    it.each([
      ['an identifier no Vendor has', '0b4d6f8a-2c1e-4a3b-9d5f-7e6a8b9c0d1e'],
      ['a text that is no identifier', 'not-a-vendor'],
    ])('answers 404 with an error of its own for %s', async (_what, vendorId) => {
      const response = await editVendor(vendorId, everyDetailChanged);

      await expectErrorResponse(response, 404, vendorNotFound);
    });
  });

  describe('an edit that fails halfway', () => {
    it('puts the Login’s name back when the Vendor cannot be stored', async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const loginId = await loginIdOf('+9647501234567');

      await whileTheDatabaseRefusesEveryVendor(async () => {
        const response = await editVendor(vendor.id, everyDetailChanged);

        await expectErrorResponse(response, 500, internalServerError);
      });

      expect(await loginIdOf('+9647501234567')).toBe(loginId);
      expect(await loginsNamed('+9647507654321')).toEqual([]);
      expect(await read(vendor.id)).toEqual(vendor);
    });
  });

  describe('while Keycloak does not answer', () => {
    it('answers an edit of the login phone number with 503 and an error of its own, and changes nothing', async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const loginId = await loginIdOf('+9647501234567');

      await whileKeycloakIsPaused(async () => {
        const response = await editVendor(vendor.id, everyDetailChanged);

        await expectErrorResponse(response, 503, identityServiceUnavailable);
      });

      expect(await read(vendor.id)).toEqual(vendor);
      expect(await loginIdOf('+9647501234567')).toBe(loginId);
      expect(await loginsNamed('+9647507654321')).toEqual([]);
    });

    it('still takes an edit that keeps the login phone number, which needs no Keycloak', async () => {
      const vendor = await aVendorWith('0750 123 4567');

      await whileKeycloakIsPaused(async () => {
        const response = await editVendor(vendor.id, {
          ...everyDetailChanged,
          loginPhoneNumber: '0750 123 4567',
        });

        expect(response.status).toBe(200);
      });

      expect((await read(vendor.id)).name).toBe(everyDetailChanged.name);
    });
  });

  describe('who may edit a Vendor', () => {
    it("refuses the Vendor's own Login, and changes nothing", async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const loginId = await loginIdOf('+9647501234567');
      const ownToken = await testApp.tokenOf({
        subject: loginId,
        loginName: '+9647501234567',
        roles: ['vendor'],
      });

      const response = await editVendor(vendor.id, everyDetailChanged, ownToken);

      await expectErrorResponse(response, 403, accessDenied);
      expect(await read(vendor.id)).toEqual(vendor);
      expect(await loginIdOf('+9647501234567')).toBe(loginId);
    });

    it('refuses a call without a token, and changes nothing', async () => {
      const vendor = await aVendorWith('0750 123 4567');

      const response = await editVendor(vendor.id, everyDetailChanged, null);

      await expectErrorResponse(response, 401, unauthorized);
      expect(await read(vendor.id)).toEqual(vendor);
    });
  });

  describe("renaming a Login in Keycloak's account pages", () => {
    it('refuses a Login that renames itself, and it keeps its name', async () => {
      await aVendorWith('0750 123 4567');
      const loginId = await loginIdOf('+9647501234567');
      await giveALastingPassword(loginId, itsOwnPassword);

      const answer = await renameItselfInItsAccount(
        '+9647501234567',
        itsOwnPassword,
        '+9647507654321',
      );

      expect(answer).toMatchObject({
        status: 400,
        body: { field: 'username', errorMessage: 'error-user-attribute-read-only' },
      });
      expect(await loginIdOf('+9647501234567')).toBe(loginId);
      expect(await loginsNamed('+9647507654321')).toEqual([]);
    });
  });
});
