import { randomUUID } from 'node:crypto';

import {
  bearerHeader,
  expectErrorResponse,
  type ExpectedErrorResponse,
} from '@pcp/core/test-utils';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../../test-utils/database/test-database';
import {
  emptyTheRealm,
  loginsNamed,
} from '../../../test-utils/keycloak/keycloak-administrator';

// A Part's visible Offers, which anyone may read without a token: those that
// are not Expired Offers and whose Vendor is active (CAT-7, OFF-6, ACC-7),
// each with how many days ago it was confirmed (OFF-7), in-stock Offers first
// (OFF-11).

// A visible Offer as the API answers it.
type VisibleOfferBody = {
  vendor: { id: string; name: string };
  usdPrice: string | null;
  iqdPrice: number | null;
  inStock: boolean;
  warrantyMonths: number | null;
  confirmedAt: string;
  daysSinceConfirmation: number;
};

// A Vendor as the API answers it, as far as these tests read it.
type VendorBody = { id: string; name: string; loginPhoneNumber: { international: string } };

// The refusals these tests expect, each as a whole.
function refusal(code: string): ExpectedErrorResponse[] {
  const key = code.toLowerCase();
  return [{ code, title: `${key}_title`, detail: `${key}_details` }];
}
const partNotFound = refusal('PART_NOT_FOUND');

const adminLoginId = randomUUID();

// A moment for the API's clock, with milliseconds, so that a time stored
// with less precision would show.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');

// A day of 24 hours, and a moment some time after another.
const aDay = 24 * 60 * 60 * 1000;
function after(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() + milliseconds);
}

describe("a Part's visible Offers", () => {
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

  // A made-up Vendor the Admin creates, with a Login of its own.
  async function aVendor(name: string, loginPhoneNumber: string): Promise<VendorBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        city: 'erbil',
        address: 'Made-up Street, Erbil',
        phoneNumber: '066 223 4567',
        loginPhoneNumber,
      }),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { vendor: VendorBody }).vendor;
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

  // A made-up Part the Admin adds to the catalog, and its identifier.
  async function aPart(name = 'Made-up Ryzen 5 7600'): Promise<string> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'cpu',
        name,
        manufacturer: 'AMD',
        partNumbers: ['100-100001015BOX'],
      }),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { id: string }).id;
  }

  // An Offer the Admin adds for the Vendor, with the clock as it is, and its
  // identifier.
  async function anOffer(
    vendorId: string,
    partId: string,
    details: Record<string, unknown> = { usdPrice: '349.99', inStock: true },
  ): Promise<string> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ partId, ...details }),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { id: string }).id;
  }

  // An Offer the Admin adds for the Vendor with the clock at a moment, which
  // is then the time of its Confirmation, and its identifier. The clock stays
  // there.
  async function anOfferConfirmedAt(
    vendorId: string,
    partId: string,
    moment: Date,
    details?: Record<string, unknown>,
  ): Promise<string> {
    moveTheClockTo(moment);
    return anOffer(vendorId, partId, details);
  }

  function readVisibleOffers(
    partId: string,
    headers: Record<string, string> = {},
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/parts/${partId}/offers`, { headers });
  }

  // The Part's visible Offers, read without a token at the time of the clock.
  async function theVisibleOffersOf(partId: string): Promise<VisibleOfferBody[]> {
    const response = await readVisibleOffers(partId);
    expect(response.status).toBe(200);
    return (await response.json()) as VisibleOfferBody[];
  }

  describe('the answer', () => {
    it("gives each Offer with its Vendor's name, both Quoted Prices as entered, the stock, the warranty, and when it was confirmed", async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      const store = await aVendor('شەقامی ٦٠ کۆمپیوتەر', '0750 765 4321');
      await anOfferConfirmedAt(shop.id, partId, aMovedMoment, {
        usdPrice: '349.99',
        inStock: true,
        warrantyMonths: 36,
      });
      await anOfferConfirmedAt(store.id, partId, after(aMovedMoment, 2 * aDay), {
        iqdPrice: 525000,
        inStock: true,
      });
      moveTheClockTo(after(aMovedMoment, 3 * aDay + 1));

      expect(await theVisibleOffersOf(partId)).toEqual([
        {
          vendor: { id: store.id, name: 'شەقامی ٦٠ کۆمپیوتەر' },
          usdPrice: null,
          iqdPrice: 525000,
          inStock: true,
          warrantyMonths: null,
          confirmedAt: after(aMovedMoment, 2 * aDay).toISOString(),
          daysSinceConfirmation: 1,
        },
        {
          vendor: { id: shop.id, name: 'Made-up Computer Shop' },
          usdPrice: '349.99',
          iqdPrice: null,
          inStock: true,
          warrantyMonths: 36,
          confirmedAt: aMovedMoment.toISOString(),
          daysSinceConfirmation: 3,
        },
      ]);
    });

    it("leaves out every other Part's Offers", async () => {
      const partId = await aPart();
      const another = await aPart('Made-up Ryzen 7 7700');
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      await anOffer(shop.id, another);

      expect(await theVisibleOffersOf(partId)).toEqual([]);
    });

    it('answers 404 with PART_NOT_FOUND for a Part that does not exist', async () => {
      for (const partId of [randomUUID(), 'not-a-part']) {
        await expectErrorResponse(await readVisibleOffers(partId), 404, partNotFound);
      }
    });

    it('answers an empty list for a Part with no Offer', async () => {
      expect(await theVisibleOffersOf(await aPart())).toEqual([]);
    });
  });

  describe('who may read them', () => {
    it('answers the same without a token and with any token', async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      await anOffer(shop.id, partId);
      const withoutAToken = await theVisibleOffersOf(partId);
      expect(withoutAToken).toHaveLength(1);

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
        const response = await readVisibleOffers(partId, bearerHeader(token));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(withoutAToken);
      }
    });

    it("holds nothing of the Vendor's Login", async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      await anOffer(shop.id, partId);
      const [login] = await loginsNamed(shop.loginPhoneNumber.international);

      const response = await readVisibleOffers(partId);
      const text = await response.text();

      expect(response.status).toBe(200);
      for (const secret of [login.id, '+9647501234567', '07501234567', '750 123 4567']) {
        expect(text).not.toContain(secret);
      }
    });
  });

  describe('the order', () => {
    it('puts in-stock Offers before out-of-stock ones, each group with the most recent Confirmation first', async () => {
      const partId = await aPart();
      const vendors = [];
      for (const [name, phone] of [
        ['Made-up Shop A', '0750 100 0001'],
        ['Made-up Shop B', '0750 100 0002'],
        ['Made-up Shop C', '0750 100 0003'],
        ['Made-up Shop D', '0750 100 0004'],
      ]) {
        vendors.push(await aVendor(name, phone));
      }
      const [a, b, c, d] = vendors;
      // Confirmed one day apart: A first, D last.
      const confirmations: [VendorBody, boolean][] = [
        [a, true],
        [b, false],
        [c, true],
        [d, false],
      ];
      for (const [index, [vendor, inStock]] of confirmations.entries()) {
        await anOfferConfirmedAt(vendor.id, partId, after(aMovedMoment, index * aDay), {
          iqdPrice: 525000,
          inStock,
        });
      }
      moveTheClockTo(after(aMovedMoment, 4 * aDay));

      expect(
        (await theVisibleOffersOf(partId)).map(({ vendor, inStock }) => [
          vendor.name,
          inStock,
        ]),
      ).toEqual([
        ['Made-up Shop C', true],
        ['Made-up Shop A', true],
        ['Made-up Shop D', false],
        ['Made-up Shop B', false],
      ]);
    });
  });

  describe("a deactivated Vendor's Offers", () => {
    // The Admin deactivates or reactivates a Vendor, with the clock running,
    // since it calls Keycloak.
    async function admin(action: 'deactivate' | 'reactivate', vendorId: string) {
      const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/${action}`, {
        method: 'POST',
        headers: bearerHeader(await adminToken()),
      });
      expect(response.status).toBe(200);
    }

    async function theVendorsVisible(partId: string): Promise<string[]> {
      return (await theVisibleOffersOf(partId)).map(({ vendor }) => vendor.id);
    }

    it('are left out, and come back when the Vendor is reactivated', async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      const store = await aVendor('Made-up Computer Store', '0750 765 4321');
      await anOffer(shop.id, partId);
      await anOffer(store.id, partId);

      await admin('deactivate', shop.id);
      expect(await theVendorsVisible(partId)).toEqual([store.id]);

      await admin('reactivate', shop.id);
      expect((await theVendorsVisible(partId)).sort()).toEqual([shop.id, store.id].sort());
    });
  });

  describe('an Expired Offer, with the clock moved', () => {
    // The Vendors whose Offers for the Part are visible with the clock moved
    // to a moment.
    async function theVendorsVisibleAt(partId: string, moment: Date): Promise<string[]> {
      moveTheClockTo(moment);
      return (await theVisibleOffersOf(partId)).map(({ vendor }) => vendor.id);
    }

    it('is visible when confirmed 14 days ago to the millisecond, and left out one millisecond later', async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      await anOfferConfirmedAt(shop.id, partId, aMovedMoment);

      expect(await theVendorsVisibleAt(partId, after(aMovedMoment, 14 * aDay))).toEqual([
        shop.id,
      ]);
      expect(await theVendorsVisibleAt(partId, after(aMovedMoment, 14 * aDay + 1))).toEqual(
        [],
      );
    });

    it('is visible again at once when its Vendor confirms all its Offers', async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      await anOfferConfirmedAt(shop.id, partId, aMovedMoment);
      const later = after(aMovedMoment, 20 * aDay);
      moveTheClockTo(later);
      expect(await theVisibleOffersOf(partId)).toEqual([]);

      const confirmation = await fetch(
        `${testApp.baseUrl}/v1/vendors/${shop.id}/offers/confirm`,
        { method: 'POST', headers: bearerHeader(await tokenOfTheOwnLogin(shop)) },
      );
      expect(confirmation.status).toBe(200);

      expect(await theVisibleOffersOf(partId)).toMatchObject([
        {
          vendor: { id: shop.id },
          confirmedAt: later.toISOString(),
          daysSinceConfirmation: 0,
        },
      ]);
    });

    it('is visible again at once when its Vendor saves it, unchanged or changed', async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      const offerId = await anOfferConfirmedAt(shop.id, partId, aMovedMoment);

      for (const [daysLater, details] of [
        [20, { usdPrice: '349.99', inStock: true }],
        [40, { iqdPrice: 500000, inStock: false, warrantyMonths: 6 }],
      ] as const) {
        const later = after(aMovedMoment, daysLater * aDay);
        moveTheClockTo(later);
        expect(await theVisibleOffersOf(partId)).toEqual([]);

        const saved = await fetch(
          `${testApp.baseUrl}/v1/vendors/${shop.id}/offers/${offerId}`,
          {
            method: 'PUT',
            headers: {
              ...bearerHeader(await tokenOfTheOwnLogin(shop)),
              'content-type': 'application/json',
            },
            body: JSON.stringify(details),
          },
        );
        expect(saved.status).toBe(200);

        expect(await theVisibleOffersOf(partId)).toEqual([
          {
            vendor: { id: shop.id, name: 'Made-up Computer Shop' },
            usdPrice: null,
            iqdPrice: null,
            warrantyMonths: null,
            ...details,
            confirmedAt: later.toISOString(),
            daysSinceConfirmation: 0,
          },
        ]);
      }
    });
  });

  describe('a removed Offer', () => {
    it('is left out, and is there again once its Vendor offers the Part again', async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      const store = await aVendor('Made-up Computer Store', '0750 765 4321');
      const offerId = await anOffer(shop.id, partId);
      await anOffer(store.id, partId);

      const removal = await fetch(
        `${testApp.baseUrl}/v1/vendors/${shop.id}/offers/${offerId}`,
        { method: 'DELETE', headers: bearerHeader(await tokenOfTheOwnLogin(shop)) },
      );
      expect(removal.status).toBe(204);
      expect((await theVisibleOffersOf(partId)).map(({ vendor }) => vendor.id)).toEqual([
        store.id,
      ]);

      await anOffer(shop.id, partId, { iqdPrice: 500000, inStock: true });
      expect(
        (await theVisibleOffersOf(partId)).map(({ vendor }) => vendor.id).sort(),
      ).toEqual([shop.id, store.id].sort());
    });
  });
});
