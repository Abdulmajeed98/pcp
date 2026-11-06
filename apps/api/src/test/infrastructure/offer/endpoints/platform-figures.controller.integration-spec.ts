import { randomUUID } from 'node:crypto';

import { bearerHeader } from '@pcp/core/test-utils';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import {
  changeTheRateAndDeactivateAVendorWhileReading,
  emptyTheDatabase,
} from '../../../test-utils/database/test-database';
import {
  emptyTheRealm,
  loginsNamed,
} from '../../../test-utils/keycloak/keycloak-administrator';

// The platform's figures, which anyone may read without a token, as the
// Shopper app's home page and a Part's price slip print them: how many
// active Vendors the platform has, how many Visible Offers it lists (CAT-7),
// the current Platform Rate's value alone (PRC-1), and how many days an
// Offer stays current without a Confirmation (OFF-6).

// The platform's figures as the API answers them.
type PlatformFiguresBody = {
  activeVendorCount: number;
  visibleOfferCount: number;
  iqdPerUsd: number | null;
  daysAnOfferStaysCurrent: number;
};

// A Vendor as the API answers it, as far as these tests read it.
type VendorBody = { id: string; loginPhoneNumber: { international: string } };

const adminLoginId = randomUUID();

// A moment for the API's clock, with milliseconds, so that a time stored
// with less precision would show.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');

// A day of 24 hours, and a moment some time after another.
const aDay = 24 * 60 * 60 * 1000;
function after(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() + milliseconds);
}

describe("the platform's figures", () => {
  let testApp: TestAppWithLogins;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
  });

  afterAll(async () => {
    await testApp.close();
  });

  afterEach(async () => {
    letTheClockRun();
    await emptyTheDatabase();
    await emptyTheRealm();
  });

  // A token of the Admin's Login. Made when it is needed, so that it is
  // judged by the clock that is current then.
  function adminToken(): Promise<string> {
    return testApp.tokenOf({ subject: adminLoginId, roles: ['admin'] });
  }

  // Made-up Vendors are numbered, so that each has a Login phone number of
  // its own.
  let vendors = 0;

  // A made-up Vendor the Admin creates, with a Login of its own. It calls
  // Keycloak, so it runs with the clock running.
  async function aVendor(name = 'Made-up Computer Shop'): Promise<VendorBody> {
    vendors += 1;
    const response = await fetch(`${testApp.baseUrl}/v1/vendors`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        city: 'erbil',
        address: 'Made-up Street, Erbil',
        phoneNumber: '066 223 4567',
        loginPhoneNumber: `0750 100 ${String(1000 + vendors)}`,
      }),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { vendor: VendorBody }).vendor;
  }

  // A made-up CPU the Admin adds to the catalog, and its identifier.
  async function aPart(name: string): Promise<string> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ category: 'cpu', name, manufacturer: 'Made-up Chips' }),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { id: string }).id;
  }

  // An Offer the Admin adds for the Vendor, in stock unless it says
  // otherwise, confirmed at the time of the API's clock.
  async function anOffer(vendorId: string, partId: string, inStock = true): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ partId, iqdPrice: 500000, inStock }),
    });
    expect(response.status).toBe(201);
  }

  // The Admin acts on a Vendor: deactivates it, reactivates it, or confirms
  // all its Offers at the time of the clock. Deactivating and reactivating
  // call Keycloak, so they run with the clock running.
  async function admin(
    action: 'deactivate' | 'reactivate' | 'offers/confirm',
    vendorId: string,
  ): Promise<void> {
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

  // How many active Vendors and Visible Offers the figures count.
  async function theCounts(): Promise<{ vendors: number; offers: number }> {
    const figures = await theFigures();
    return { vendors: figures.activeVendorCount, offers: figures.visibleOfferCount };
  }

  // The Admin sets the Platform Rate, in whole dinars per dollar, at the time
  // of the API's clock.
  async function setThePlatformRate(iqdPerUsd: number): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/platform-rate`, {
      method: 'PUT',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ iqdPerUsd }),
    });
    expect(response.status).toBe(200);
  }

  // The platform's figures, asked for with the headers given.
  function readPlatformFigures(headers: Record<string, string> = {}): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/platform-figures`, { headers });
  }

  // The platform's figures, read without a token.
  async function theFigures(): Promise<PlatformFiguresBody> {
    const response = await readPlatformFigures();
    expect(response.status).toBe(200);
    return (await response.json()) as PlatformFiguresBody;
  }

  describe('the answer', () => {
    it('is no Vendor, no Visible Offer and no Platform Rate on a platform that holds none, and the 14 days an Offer stays current', async () => {
      expect(await theFigures()).toEqual({
        activeVendorCount: 0,
        visibleOfferCount: 0,
        iqdPerUsd: null,
        daysAnOfferStaysCurrent: 14,
      });
    });

    it('counts every active Vendor, one with no Offer among them, and every Visible Offer, in stock or out of stock', async () => {
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      const core = await aPart('Made-up Core i5 14600K');
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      await aVendor('Made-up Shop With No Offer');
      await anOffer(shop.id, ryzen);
      await anOffer(shop.id, core, false);
      await anOffer(store.id, ryzen);

      expect(await theCounts()).toEqual({ vendors: 3, offers: 3 });
    });
  });

  describe('a deactivated Vendor', () => {
    it('is not counted, nor are its Offers, and both are counted again once it is reactivated', async () => {
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      const core = await aPart('Made-up Core i5 14600K');
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      await anOffer(shop.id, ryzen);
      await anOffer(shop.id, core, false);
      await anOffer(store.id, ryzen);

      await admin('deactivate', shop.id);
      expect(await theCounts()).toEqual({ vendors: 1, offers: 1 });

      await admin('reactivate', shop.id);
      expect(await theCounts()).toEqual({ vendors: 2, offers: 3 });
    });
  });

  describe('an Expired Offer', () => {
    it('is not counted, and is counted again once it is confirmed', async () => {
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      const core = await aPart('Made-up Core i5 14600K');
      const shop = await aVendor();
      moveTheClockTo(aMovedMoment);
      await anOffer(shop.id, ryzen);
      moveTheClockTo(after(aMovedMoment, aDay));
      await anOffer(shop.id, core);

      // The first, confirmed 14 days ago to the millisecond, is still visible.
      moveTheClockTo(after(aMovedMoment, 14 * aDay));
      expect(await theCounts()).toEqual({ vendors: 1, offers: 2 });

      moveTheClockTo(after(aMovedMoment, 14 * aDay + 1));
      expect(await theCounts()).toEqual({ vendors: 1, offers: 1 });

      await admin('offers/confirm', shop.id);
      expect(await theCounts()).toEqual({ vendors: 1, offers: 2 });
    });
  });

  describe('the Platform Rate', () => {
    it('is none until the Admin sets one, and then the latest one set', async () => {
      expect((await theFigures()).iqdPerUsd).toBeNull();

      moveTheClockTo(aMovedMoment);
      await setThePlatformRate(1575);
      expect((await theFigures()).iqdPerUsd).toBe(1575);

      moveTheClockTo(after(aMovedMoment, aDay));
      await setThePlatformRate(1600);
      expect((await theFigures()).iqdPerUsd).toBe(1600);
    });

    it('is its value alone, and the answer never says when it was set or by whom', async () => {
      moveTheClockTo(aMovedMoment);
      await setThePlatformRate(1575);

      const response = await readPlatformFigures();
      const text = await response.text();

      expect(response.status).toBe(200);
      for (const secret of [aMovedMoment.toISOString(), '2027-03-14', adminLoginId]) {
        expect(text).not.toContain(secret);
      }
      expect(Object.keys(JSON.parse(text) as object).sort()).toEqual(
        [
          'activeVendorCount',
          'daysAnOfferStaysCurrent',
          'iqdPerUsd',
          'visibleOfferCount',
        ].sort(),
      );
    });
  });

  describe('who may read it', () => {
    it("answers the same without a token and with any token, an Admin's or a Vendor's among them", async () => {
      const shop = await aVendor();
      await anOffer(shop.id, await aPart('Made-up Ryzen 5 7600'));
      await setThePlatformRate(1575);
      const withoutAToken = await theFigures();

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
        const response = await readPlatformFigures(bearerHeader(token));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(withoutAToken);
      }
      expect(withoutAToken).toEqual({
        activeVendorCount: 1,
        visibleOfferCount: 1,
        iqdPerUsd: 1575,
        daysAnOfferStaysCurrent: 14,
      });
    });

    it("counts no deactivated Vendor, nor its Offers, with an Admin's token or with that Vendor's own", async () => {
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      await anOffer(shop.id, ryzen);
      await anOffer(store.id, ryzen);
      const tokenOfTheStore = await tokenOfTheOwnLogin(store);
      await admin('deactivate', store.id);

      for (const token of [await adminToken(), tokenOfTheStore]) {
        const response = await readPlatformFigures(bearerHeader(token));
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({
          activeVendorCount: 1,
          visibleOfferCount: 1,
        });
      }
    });
  });

  describe('one answer', () => {
    // Before the change the platform has 2 active Vendors, 3 Visible Offers
    // and a rate of 1,500; after it, 1, 1 and 2,000. A read that took the
    // rate and the counts at different moments would answer 2, 3 and 2,000,
    // or 1, 1 and 1,500; one that counted the Vendors apart from the Offers,
    // 2 Vendors and 1 Offer.
    for (const lockedTable of ['vendor', 'offer', 'platform_rate'] as const) {
      it(`gives the counts and the rate of one moment, read in one query, while ${lockedTable} is locked`, async () => {
        const ryzen = await aPart('Made-up Ryzen 5 7600');
        const core = await aPart('Made-up Core i5 14600K');
        const shop = await aVendor();
        const store = await aVendor('Made-up Computer Store');
        // The API's clock moved, and the rate set at its time, as every rate
        // is set by the API's clock and not the database's.
        moveTheClockTo(aMovedMoment);
        await anOffer(shop.id, ryzen);
        await anOffer(shop.id, core);
        await anOffer(store.id, ryzen);
        await setThePlatformRate(1500);

        const answer = await changeTheRateAndDeactivateAVendorWhileReading(
          { iqdPerUsd: 2000, setAt: new Date(), vendorId: shop.id, lockedTable },
          theFigures,
        );

        // After the change, as a read in one query sees it.
        expect(answer).toEqual({
          activeVendorCount: 1,
          visibleOfferCount: 1,
          iqdPerUsd: 2000,
          daysAnOfferStaysCurrent: 14,
        });
      });
    }
  });
});
