import { randomUUID } from 'node:crypto';

import { bearerHeader, expectErrorResponse } from '@pcp/core/test-utils';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../../test-utils/database/test-database';
import { vendorNotFound } from '../../../test-utils/error-bodies';
import {
  emptyTheRealm,
  loginsNamed,
} from '../../../test-utils/keycloak/keycloak-administrator';

// A visible Vendor, which anyone may read without a token: an active Vendor's
// name, city and contact details, as a Vendor page shows them (BRW-4), and
// nothing of its Login. A deactivated Vendor is not found (ACC-7).

// A phone number as the API answers it.
type PhoneNumberBody = { international: string; national: string };

// A visible Vendor as the API answers it.
type VisibleVendorBody = {
  id: string;
  name: string;
  city: string;
  address: string;
  mapLocation: { latitude: number; longitude: number } | null;
  phoneNumber: PhoneNumberBody;
  whatsAppNumber: PhoneNumberBody | null;
  instagramName: string | null;
  openingHours: string | null;
};

// A Vendor as the Admin's endpoints answer it, as far as these tests read it.
type VendorBody = { id: string; loginPhoneNumber: PhoneNumberBody };

// Every detail a Vendor may have, as the Admin types them.
const everyDetail = {
  name: 'شەقامی ٦٠ Made-up Computers',
  city: 'erbil',
  address: 'Made-up Street\nErbil',
  mapLocation: { latitude: 36.1911744, longitude: 44.0094145 },
  phoneNumber: '066 223 4567',
  whatsAppNumber: '0770 123 4567',
  instagramName: '@Made_Up.Shop',
  openingHours: 'Saturday to Thursday, 9 to 9\nFriday closed',
};

// Only the details a Vendor must have.
const onlyWhatIsNeeded = {
  name: 'Made-up Computer Shop',
  city: 'erbil',
  address: 'Made-up Street, Erbil',
  phoneNumber: '0751 234 5678',
};

describe('a visible Vendor', () => {
  let testApp: TestAppWithLogins;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
  });

  afterAll(async () => {
    await testApp.close();
  });

  afterEach(async () => {
    await emptyTheDatabase();
    await emptyTheRealm();
  });

  function adminToken(): Promise<string> {
    return testApp.tokenOf({ subject: randomUUID(), roles: ['admin'] });
  }

  // A made-up Vendor the Admin creates with these details and a Login of its
  // own, known by the login phone number given.
  async function aVendor(
    details: Record<string, unknown>,
    loginPhoneNumber = '0750 100 1001',
  ): Promise<VendorBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ ...details, loginPhoneNumber }),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { vendor: VendorBody }).vendor;
  }

  // The Admin deactivates the Vendor, or reactivates it.
  async function admin(action: 'deactivate' | 'reactivate', vendorId: string) {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/${action}`, {
      method: 'POST',
      headers: bearerHeader(await adminToken()),
    });
    expect(response.status).toBe(200);
  }

  // A token of the Vendor's own Login, as Keycloak issues it.
  async function tokenOfTheOwnLogin(vendor: VendorBody): Promise<string> {
    const [login] = await loginsNamed(vendor.loginPhoneNumber.international);
    return testApp.tokenOf({
      subject: login.id,
      loginName: vendor.loginPhoneNumber.international,
      roles: ['vendor'],
    });
  }

  function readVisibleVendor(
    vendorId: string,
    headers: Record<string, string> = {},
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/visible-vendors/${vendorId}`, { headers });
  }

  async function theVisibleVendor(vendorId: string): Promise<VisibleVendorBody> {
    const response = await readVisibleVendor(vendorId);
    expect(response.status).toBe(200);
    return (await response.json()) as VisibleVendorBody;
  }

  describe('the answer', () => {
    it("gives the Vendor's identifier, name, city, address, map location, phone number, WhatsApp number, Instagram name and opening hours, as the Vendor writes them", async () => {
      const shop = await aVendor(everyDetail);

      expect(await theVisibleVendor(shop.id)).toEqual({
        id: shop.id,
        name: 'شەقامی ٦٠ Made-up Computers',
        city: 'erbil',
        address: 'Made-up Street\nErbil',
        mapLocation: { latitude: 36.1911744, longitude: 44.0094145 },
        phoneNumber: { international: '+964662234567', national: '066 223 4567' },
        whatsAppNumber: { international: '+9647701234567', national: '0770 123 4567' },
        instagramName: 'made_up.shop',
        openingHours: 'Saturday to Thursday, 9 to 9\nFriday closed',
      });
    });

    it('gives null for each detail the Vendor has not given', async () => {
      const shop = await aVendor(onlyWhatIsNeeded);

      expect(await theVisibleVendor(shop.id)).toEqual({
        id: shop.id,
        name: 'Made-up Computer Shop',
        city: 'erbil',
        address: 'Made-up Street, Erbil',
        mapLocation: null,
        phoneNumber: { international: '+9647512345678', national: '0751 234 5678' },
        whatsAppNumber: null,
        instagramName: null,
        openingHours: null,
      });
    });

    it("holds nothing of the Vendor's Login, whether it is active, or when it was made or changed", async () => {
      const shop = await aVendor(everyDetail, '0750 123 4567');
      const [login] = await loginsNamed(shop.loginPhoneNumber.international);

      const response = await readVisibleVendor(shop.id);
      const text = await response.text();

      expect(response.status).toBe(200);
      for (const secret of [login.id, '+9647501234567', '07501234567', '750 123 4567']) {
        expect(text).not.toContain(secret);
      }
      expect(Object.keys(JSON.parse(text) as object).sort()).toEqual(
        [
          'address',
          'city',
          'id',
          'instagramName',
          'mapLocation',
          'name',
          'openingHours',
          'phoneNumber',
          'whatsAppNumber',
        ].sort(),
      );
    });

    it('gives a Vendor with no Offer, so that its page still says how to reach it', async () => {
      const shop = await aVendor(onlyWhatIsNeeded);

      expect((await theVisibleVendor(shop.id)).id).toBe(shop.id);
    });
  });

  describe('a Vendor that is not visible', () => {
    it('answers 404 with VENDOR_NOT_FOUND for a deactivated Vendor, and the Vendor again once it is reactivated', async () => {
      const shop = await aVendor(everyDetail);

      await admin('deactivate', shop.id);
      await expectErrorResponse(await readVisibleVendor(shop.id), 404, vendorNotFound);

      await admin('reactivate', shop.id);
      expect((await theVisibleVendor(shop.id)).id).toBe(shop.id);
    });

    it('answers 404 with VENDOR_NOT_FOUND for an unknown Vendor and an identifier of no Vendor', async () => {
      for (const vendorId of [randomUUID(), 'not-a-vendor']) {
        await expectErrorResponse(await readVisibleVendor(vendorId), 404, vendorNotFound);
      }
    });
  });

  describe('who may read it', () => {
    it("answers the same without a token and with any token, an Admin's or a Vendor's among them", async () => {
      const shop = await aVendor(everyDetail);
      const withoutAToken = await theVisibleVendor(shop.id);

      const tokens = [
        await adminToken(),
        await tokenOfTheOwnLogin(shop),
        await testApp.tokenOf({ roles: ['shopper'] }),
        await testApp.tokenOf({
          roles: ['admin'],
          expiresAt: new Date(Date.now() - 60_000),
        }),
        'nonsense',
      ];
      for (const token of tokens) {
        const response = await readVisibleVendor(shop.id, bearerHeader(token));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(withoutAToken);
      }
    });

    it("answers 404 for a deactivated Vendor with an Admin's token and with its own Login's", async () => {
      const shop = await aVendor(everyDetail);
      const ownToken = await tokenOfTheOwnLogin(shop);
      await admin('deactivate', shop.id);

      for (const token of [await adminToken(), ownToken]) {
        await expectErrorResponse(
          await readVisibleVendor(shop.id, bearerHeader(token)),
          404,
          vendorNotFound,
        );
      }
    });
  });
});
