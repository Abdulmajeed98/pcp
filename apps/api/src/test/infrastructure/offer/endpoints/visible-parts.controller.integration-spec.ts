import { randomUUID } from 'node:crypto';

import { bearerHeader, expectErrorResponse, notValid } from '@pcp/core/test-utils';
import sharp from 'sharp';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import {
  changeTheRateAndTheOffersWhileReading,
  emptyTheDatabase,
} from '../../../test-utils/database/test-database';
import {
  emptyTheRealm,
  loginsNamed,
} from '../../../test-utils/keycloak/keycloak-administrator';

// A Category's Visible Parts, which anyone may read without a token: the
// Parts with at least one Visible Offer, an Offer that is not an Expired
// Offer and whose Vendor is active (CAT-7), each with its Lowest Price, the
// lowest Shown Price among its in-stock Visible Offers in the chosen currency,
// lowest first, and the Parts that every Vendor has out of stock last
// (BRW-1).

// The currencies a Shopper may choose.
type Currency = 'USD' | 'IQD';

// A price as a Part's Lowest Price shows it, in the currency asked for.
type ShownPriceBody = { currency: Currency; amount: string; converted: boolean };

// A Visible Part as the API answers it, and a page of them.
type VisiblePartBody = {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  partNumbers: string[];
  photoPath: string | null;
  lowestPrice: ShownPriceBody | null;
  vendorCount: number;
  inStock: boolean;
};

type PageOfVisibleParts = {
  content: VisiblePartBody[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

// A Shown Price that is the Quoted Price in the currency, and one that is a
// Converted Price.
function quoted(currency: Currency, amount: string): ShownPriceBody {
  return { currency, amount, converted: false };
}
function converted(currency: Currency, amount: string): ShownPriceBody {
  return { currency, amount, converted: true };
}

// A Vendor as the API answers it, as far as these tests read it.
type VendorBody = { id: string; name: string; loginPhoneNumber: { international: string } };

// A Part as the API answers it, as far as these tests read it.
type PartBody = {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  partNumbers: string[];
  photoPath: string | null;
};

const adminLoginId = randomUUID();

// A moment for the API's clock, with milliseconds, so that a time stored
// with less precision would show.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');

// A day of 24 hours, and a moment some time after another.
const aDay = 24 * 60 * 60 * 1000;
function after(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() + milliseconds);
}

// A small made-up photo.
function aPhoto(): Promise<Buffer> {
  return sharp({ create: { width: 400, height: 300, channels: 3, background: '#4a6a8a' } })
    .png()
    .toBuffer();
}

describe("a Category's Visible Parts", () => {
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

  // A made-up Part the Admin adds to the catalog.
  async function aPart(
    name: string,
    { category = 'cpu', manufacturer = 'Made-up Chips', partNumbers = [] as string[] } = {},
  ): Promise<PartBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ category, name, manufacturer, partNumbers }),
    });
    expect(response.status).toBe(201);
    return (await response.json()) as PartBody;
  }

  // The Admin adds a photo to a Part, and the Part as it then is.
  async function withAPhoto(partId: string): Promise<PartBody> {
    const form = new FormData();
    form.append(
      'photo',
      new Blob([new Uint8Array(await aPhoto())], { type: 'image/png' }),
      'photo.png',
    );
    const response = await fetch(`${testApp.baseUrl}/v1/parts/${partId}/photo`, {
      method: 'PUT',
      headers: bearerHeader(await adminToken()),
      body: form,
    });
    expect(response.status).toBe(200);
    return (await response.json()) as PartBody;
  }

  // An Offer the Admin adds for the Vendor, with the clock as it is, and its
  // identifier.
  async function anOffer(
    vendorId: string,
    partId: string,
    details: Record<string, unknown> = { iqdPrice: 500000, inStock: true },
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
    moment: Date,
    vendorId: string,
    partId: string,
    details?: Record<string, unknown>,
  ): Promise<string> {
    moveTheClockTo(moment);
    return anOffer(vendorId, partId, details);
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

  // The Admin sets the Platform Rate, in whole dinars per dollar.
  async function setThePlatformRate(iqdPerUsd: number): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/platform-rate`, {
      method: 'PUT',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ iqdPerUsd }),
    });
    expect(response.status).toBe(200);
  }

  // A Category's Visible Parts, asked for with the query given, as a test
  // writes it, and the headers given.
  function readVisibleParts(
    query: Record<string, string>,
    headers: Record<string, string> = {},
  ): Promise<Response> {
    const search = new URLSearchParams(query).toString();
    return fetch(`${testApp.baseUrl}/v1/visible-parts?${search}`, { headers });
  }

  // One page of a Category's Visible Parts, read without a token, the CPUs
  // in dinars unless the query says otherwise.
  async function theVisibleParts(
    query: Record<string, string> = {},
  ): Promise<PageOfVisibleParts> {
    const response = await readVisibleParts({ category: 'cpu', currency: 'IQD', ...query });
    expect(response.status).toBe(200);
    return (await response.json()) as PageOfVisibleParts;
  }

  // The names of the Visible Parts on the first page, in their order.
  async function theNamesListed(query: Record<string, string> = {}): Promise<string[]> {
    return (await theVisibleParts(query)).content.map(({ name }) => name);
  }

  // The Visible Part of that name on the first page.
  async function theVisiblePart(
    name: string,
    query: Record<string, string> = {},
  ): Promise<VisiblePartBody | undefined> {
    return (await theVisibleParts(query)).content.find((part) => part.name === name);
  }

  describe('the answer', () => {
    it('gives each Visible Part with its identifier, Category, name, manufacturer, part numbers and photo, its Lowest Price, how many Vendors offer it and whether one has it in stock', async () => {
      const ryzen = await withAPhoto(
        (
          await aPart('Made-up Ryzen 5 7600', {
            manufacturer: 'AMD',
            partNumbers: ['100-100001015BOX', '100-000001015'],
          })
        ).id,
      );
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      await anOffer(shop.id, ryzen.id, { iqdPrice: 525000, inStock: true });
      await anOffer(store.id, ryzen.id, { iqdPrice: 499000, inStock: false });

      expect(await theVisibleParts()).toEqual({
        content: [
          {
            id: ryzen.id,
            category: 'cpu',
            name: 'Made-up Ryzen 5 7600',
            manufacturer: 'AMD',
            partNumbers: ['100-100001015BOX', '100-000001015'],
            photoPath: ryzen.photoPath,
            lowestPrice: quoted('IQD', '525000'),
            vendorCount: 2,
            inStock: true,
          },
        ],
        pageNumber: 0,
        pageSize: 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      });
      expect(ryzen.photoPath).toMatch(/^\/v1\/photos\//);
    });
  });

  describe('which Parts are listed', () => {
    it('leaves out a Part with no Offer', async () => {
      const offered = await aPart('Made-up Ryzen 5 7600');
      await aPart('Made-up Ryzen 7 7700');
      const shop = await aVendor();
      await anOffer(shop.id, offered.id);

      expect(await theNamesListed()).toEqual(['Made-up Ryzen 5 7600']);
    });

    it('leaves out a Part whose only Offer is an Expired Offer, and lists it again once the Offer is confirmed', async () => {
      const expiring = await aPart('Made-up Ryzen 5 7600');
      const current = await aPart('Made-up Ryzen 7 7700');
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      await anOfferConfirmedAt(aMovedMoment, shop.id, expiring.id);
      await anOfferConfirmedAt(after(aMovedMoment, 10 * aDay), store.id, current.id);

      // Confirmed 14 days ago to the millisecond, it is still visible.
      moveTheClockTo(after(aMovedMoment, 14 * aDay));
      expect(await theNamesListed()).toEqual([
        'Made-up Ryzen 5 7600',
        'Made-up Ryzen 7 7700',
      ]);

      moveTheClockTo(after(aMovedMoment, 14 * aDay + 1));
      expect(await theNamesListed()).toEqual(['Made-up Ryzen 7 7700']);

      await admin('offers/confirm', shop.id);
      expect(await theNamesListed()).toEqual([
        'Made-up Ryzen 5 7600',
        'Made-up Ryzen 7 7700',
      ]);
    });

    it('leaves out a Part whose only Vendor is deactivated, and lists it again once the Vendor is reactivated', async () => {
      const onlyTheShops = await aPart('Made-up Ryzen 5 7600');
      const both = await aPart('Made-up Ryzen 7 7700');
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      await anOffer(shop.id, onlyTheShops.id);
      await anOffer(shop.id, both.id);
      await anOffer(store.id, both.id);

      await admin('deactivate', shop.id);
      expect(
        (await theVisibleParts()).content.map(({ name, vendorCount }) => [
          name,
          vendorCount,
        ]),
      ).toEqual([['Made-up Ryzen 7 7700', 1]]);

      await admin('reactivate', shop.id);
      expect(
        (await theVisibleParts()).content.map(({ name, vendorCount }) => [
          name,
          vendorCount,
        ]),
      ).toEqual([
        ['Made-up Ryzen 5 7600', 1],
        ['Made-up Ryzen 7 7700', 2],
      ]);
    });

    it("lists only the asked Category's Visible Parts", async () => {
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      const geforce = await aPart('Made-up GeForce RTX 4060', { category: 'gpu' });
      const shop = await aVendor();
      await anOffer(shop.id, ryzen.id);
      await anOffer(shop.id, geforce.id);

      expect(await theNamesListed({ category: 'cpu' })).toEqual(['Made-up Ryzen 5 7600']);
      expect(await theNamesListed({ category: 'gpu' })).toEqual([
        'Made-up GeForce RTX 4060',
      ]);
      expect(await theVisibleParts({ category: 'psu' })).toMatchObject({
        content: [],
        totalElements: 0,
      });
    });
  });

  // A Part offered by five made-up Vendors at 1,500 IQD a dollar, read 15
  // days after the first Offer was confirmed: in stock at 100 $, which is
  // 150,000 IQD; out of stock at 100,000 IQD; an Expired Offer in stock at
  // 90,000 IQD; in stock at 80,000 IQD, of a deactivated Vendor; and in stock
  // at 160,000 IQD, which is 106.67 $, shown as 107 $.
  async function aPartOfferedEveryWay(): Promise<PartBody> {
    await setThePlatformRate(1500);
    const ryzen = await aPart('Made-up Ryzen 5 7600');
    const [inDollars, outOfStock, expired, deactivated, inDinars] = [
      await aVendor('Made-up Shop in dollars'),
      await aVendor('Made-up Shop out of stock'),
      await aVendor('Made-up Shop expired'),
      await aVendor('Made-up Shop deactivated'),
      await aVendor('Made-up Shop in dinars'),
    ];
    await anOfferConfirmedAt(aMovedMoment, expired.id, ryzen.id, {
      iqdPrice: 90000,
      inStock: true,
    });
    const later = after(aMovedMoment, 10 * aDay);
    for (const [vendor, details] of [
      [inDollars, { usdPrice: '100.00', inStock: true }],
      [outOfStock, { iqdPrice: 100000, inStock: false }],
      [deactivated, { iqdPrice: 80000, inStock: true }],
      [inDinars, { iqdPrice: 160000, inStock: true }],
    ] as const) {
      await anOfferConfirmedAt(later, vendor.id, ryzen.id, details);
    }
    letTheClockRun();
    await admin('deactivate', deactivated.id);
    moveTheClockTo(after(aMovedMoment, 15 * aDay));
    return ryzen;
  }

  describe('the Lowest Price', () => {
    it('is the lowest Shown Price among the in-stock Visible Offers, leaving out those out of stock and those that are not Visible Offers', async () => {
      await aPartOfferedEveryWay();

      expect((await theVisibleParts({ currency: 'IQD' })).content).toMatchObject([
        { lowestPrice: converted('IQD', '150000'), inStock: true },
      ]);
      expect((await theVisibleParts({ currency: 'USD' })).content).toMatchObject([
        { lowestPrice: quoted('USD', '100.00'), inStock: true },
      ]);
    });

    it('is marked converted exactly when the Offer it comes from is converted, in each currency', async () => {
      await setThePlatformRate(1500);
      const fromDollars = await aPart('Made-up Ryzen 5 7600');
      const fromDinars = await aPart('Made-up Ryzen 7 7700');
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      // 100 $ is 150,000 IQD; 160,000 IQD is 107 $.
      await anOffer(shop.id, fromDollars.id, { usdPrice: '100.00', inStock: true });
      await anOffer(store.id, fromDollars.id, { iqdPrice: 160000, inStock: true });
      // 150,000 IQD is 100 $; 101 $ is 151,500 IQD.
      await anOffer(shop.id, fromDinars.id, { iqdPrice: 150000, inStock: true });
      await anOffer(store.id, fromDinars.id, { usdPrice: '101.00', inStock: true });

      expect(
        await theVisiblePart('Made-up Ryzen 5 7600', { currency: 'IQD' }),
      ).toMatchObject({
        lowestPrice: converted('IQD', '150000'),
      });
      expect(
        await theVisiblePart('Made-up Ryzen 5 7600', { currency: 'USD' }),
      ).toMatchObject({
        lowestPrice: quoted('USD', '100.00'),
      });
      expect(
        await theVisiblePart('Made-up Ryzen 7 7700', { currency: 'IQD' }),
      ).toMatchObject({
        lowestPrice: quoted('IQD', '150000'),
      });
      expect(
        await theVisiblePart('Made-up Ryzen 7 7700', { currency: 'USD' }),
      ).toMatchObject({
        lowestPrice: converted('USD', '100.00'),
      });
    });

    it("is, of equal Shown Prices, the one of the Offer that the Part's own Offers list first", async () => {
      await setThePlatformRate(1500);
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      // Both shown as 150,000 IQD and as 100 $; the later Confirmation first.
      await anOfferConfirmedAt(aMovedMoment, shop.id, ryzen.id, {
        iqdPrice: 150000,
        inStock: true,
      });
      await anOfferConfirmedAt(after(aMovedMoment, aDay), store.id, ryzen.id, {
        usdPrice: '100.00',
        inStock: true,
      });
      moveTheClockTo(after(aMovedMoment, 2 * aDay));

      for (const [currency, lowestPrice] of [
        ['IQD', converted('IQD', '150000')],
        ['USD', quoted('USD', '100.00')],
      ] as const) {
        const offers = await fetch(
          `${testApp.baseUrl}/v1/parts/${ryzen.id}/offers?currency=${currency}`,
        );
        const [first] = (await offers.json()) as { shownPrice: ShownPriceBody }[];
        expect(first.shownPrice).toEqual(lowestPrice);
        expect(await theVisiblePart('Made-up Ryzen 5 7600', { currency })).toMatchObject({
          lowestPrice,
        });
      }
    });

    it('is null when no Visible Offer is in stock, and when no in-stock one has a Shown Price, for want of a Platform Rate', async () => {
      // No Platform Rate is set.
      const outOfStock = await aPart('Made-up Ryzen 5 7600');
      const inDollars = await aPart('Made-up Ryzen 7 7700');
      const shop = await aVendor();
      await anOffer(shop.id, outOfStock.id, { iqdPrice: 100000, inStock: false });
      await anOffer(shop.id, inDollars.id, { usdPrice: '10.00', inStock: true });

      expect(
        await theVisiblePart('Made-up Ryzen 5 7600', { currency: 'IQD' }),
      ).toMatchObject({
        lowestPrice: null,
        inStock: false,
      });
      expect(
        await theVisiblePart('Made-up Ryzen 7 7700', { currency: 'IQD' }),
      ).toMatchObject({
        lowestPrice: null,
        inStock: true,
      });
      expect(
        await theVisiblePart('Made-up Ryzen 7 7700', { currency: 'USD' }),
      ).toMatchObject({
        lowestPrice: quoted('USD', '10.00'),
        inStock: true,
      });
    });
  });

  describe('the count of Vendors', () => {
    it('counts the Visible Offers, in stock or not, and nothing else', async () => {
      await aPartOfferedEveryWay();

      expect((await theVisibleParts()).content).toMatchObject([{ vendorCount: 3 }]);
    });

    it('counts a Part every Vendor has out of stock, which is listed as out of stock', async () => {
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      await anOffer(shop.id, ryzen.id, { iqdPrice: 100000, inStock: false });
      await anOffer(store.id, ryzen.id, { usdPrice: '10.00', inStock: false });

      expect((await theVisibleParts()).content).toMatchObject([
        { vendorCount: 2, inStock: false, lowestPrice: null },
      ]);
    });
  });

  describe('the order', () => {
    // A made-up Vendor of its own offers each Part, of the name given, with
    // the details given.
    async function partsOffered(
      offers: [name: string, details: Record<string, unknown>][],
    ): Promise<PartBody[]> {
      const parts = [];
      for (const [name, details] of offers) {
        const offered = await aPart(name);
        await anOffer((await aVendor(`Shop of ${name}`)).id, offered.id, details);
        parts.push(offered);
      }
      return parts;
    }

    it('puts the Parts with a Lowest Price first, the lowest first, then the in-stock Parts with none, then those all out of stock, each by name', async () => {
      // No Platform Rate is set, so a Part offered only in the other currency
      // has no Lowest Price.
      await partsOffered([
        ['Made-up E', { iqdPrice: 300000, inStock: true }],
        ['Made-up B', { iqdPrice: 200000, inStock: true }],
        ['Made-up D', { usdPrice: '10.00', inStock: true }],
        ['Made-up G', { usdPrice: '5.00', inStock: false }],
        ['Made-up A', { usdPrice: '20.00', inStock: true }],
        ['Made-up C', { iqdPrice: 100000, inStock: false }],
        ['Made-up F', { iqdPrice: 200000, inStock: true }],
      ]);

      expect(await theNamesListed({ currency: 'IQD' })).toEqual([
        'Made-up B',
        'Made-up F',
        'Made-up E',
        'Made-up A',
        'Made-up D',
        'Made-up C',
        'Made-up G',
      ]);
      expect(await theNamesListed({ currency: 'USD' })).toEqual([
        'Made-up D',
        'Made-up A',
        'Made-up B',
        'Made-up E',
        'Made-up F',
        'Made-up C',
        'Made-up G',
      ]);
    });

    it('orders by the Shown Price, compared after rounding, so that the same Parts can be in another order in the other currency', async () => {
      await setThePlatformRate(1500);
      await partsOffered([
        ['Made-up quoted in both', { usdPrice: '100.00', iqdPrice: 160000, inStock: true }],
        // 101 $ is 151,500 IQD.
        ['Made-up quoted in dollars', { usdPrice: '101.00', inStock: true }],
        // 154,490 IQD is 102.99… $, shown as 103 $.
        ['Made-up quoted in dinars', { iqdPrice: 154490, inStock: true }],
        // 102.99 $ is 154,485 IQD before rounding, below 154,490, and shown
        // as 154,500, above it.
        ['Made-up quoted in cents', { usdPrice: '102.99', inStock: true }],
      ]);

      expect(await theNamesListed({ currency: 'USD' })).toEqual([
        'Made-up quoted in both',
        'Made-up quoted in dollars',
        'Made-up quoted in cents',
        'Made-up quoted in dinars',
      ]);
      expect(await theNamesListed({ currency: 'IQD' })).toEqual([
        'Made-up quoted in dollars',
        'Made-up quoted in dinars',
        'Made-up quoted in cents',
        'Made-up quoted in both',
      ]);
    });

    it('falls back on the identifier for Parts of the same name and the same Lowest Price', async () => {
      const parts = await partsOffered([
        ['Made-up Twin', { iqdPrice: 200000, inStock: true }],
        ['Made-up Twin', { iqdPrice: 200000, inStock: true }],
        ['Made-up Twin', { iqdPrice: 200000, inStock: true }],
      ]);

      expect((await theVisibleParts()).content.map(({ id }) => id)).toEqual(
        parts.map(({ id }) => id).sort(),
      );
    });
  });

  describe('the search', () => {
    beforeEach(async () => {
      const shop = await aVendor();
      for (const [name, manufacturer, partNumbers] of [
        ['Made-up Ryzen 5 7600', 'AMD', ['100-100001015BOX']],
        ['Made-up Ryzen 7 7700', 'AMD', ['100-100000592BOX']],
        ['Made-up Core i5 14600K', 'Intel', ['BX8071514600K']],
      ] as const) {
        const offered = await aPart(name, { manufacturer, partNumbers: [...partNumbers] });
        await anOffer(shop.id, offered.id);
      }
      // Holding every word, but with no Offer, so not a Visible Part.
      await aPart('Made-up Ryzen 5 7600X', { manufacturer: 'AMD' });
    });

    it('finds a Visible Part by a word of its name, of its manufacturer or of a part number, in any case', async () => {
      for (const [search, found] of [
        ['core', ['Made-up Core i5 14600K']],
        ['INTEL', ['Made-up Core i5 14600K']],
        ['100001015box', ['Made-up Ryzen 5 7600']],
        ['amd', ['Made-up Ryzen 5 7600', 'Made-up Ryzen 7 7700']],
      ] as const) {
        expect({ search, found: await theNamesListed({ search }) }).toEqual({
          search,
          found,
        });
      }
    });

    it('finds only the Visible Parts that hold every word, in any order', async () => {
      expect(await theNamesListed({ search: '7600 RYZEN' })).toEqual([
        'Made-up Ryzen 5 7600',
      ]);
      expect(await theNamesListed({ search: 'ryzen intel' })).toEqual([]);
    });

    it('finds every Visible Part of the Category when the search is empty or left out', async () => {
      const all = [
        'Made-up Core i5 14600K',
        'Made-up Ryzen 5 7600',
        'Made-up Ryzen 7 7700',
      ];

      expect(await theNamesListed()).toEqual(all);
      expect(await theNamesListed({ search: '' })).toEqual(all);
      expect(await theNamesListed({ search: '   ' })).toEqual(all);
    });
  });

  describe('the pages', () => {
    it('gives each Visible Part once across the pages, in their order, with the totals', async () => {
      const shop = await aVendor();
      for (const [name, iqdPrice] of [
        ['Made-up E', 100000],
        ['Made-up C', 300000],
        ['Made-up A', 500000],
        ['Made-up D', 200000],
        ['Made-up B', 400000],
      ] as const) {
        await anOffer(shop.id, (await aPart(name)).id, { iqdPrice, inStock: true });
      }

      const pages = [];
      for (const page of ['0', '1', '2']) {
        pages.push(await theVisibleParts({ page, size: '2' }));
      }

      expect(pages.flatMap(({ content }) => content.map(({ name }) => name))).toEqual([
        'Made-up E',
        'Made-up D',
        'Made-up C',
        'Made-up B',
        'Made-up A',
      ]);
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

    it('answers a page past the last one as empty, with the totals', async () => {
      const shop = await aVendor();
      await anOffer(shop.id, (await aPart('Made-up A')).id);

      expect(await theVisibleParts({ page: '5', size: '2' })).toEqual({
        content: [],
        pageNumber: 5,
        pageSize: 2,
        totalElements: 1,
        totalPages: 1,
        first: false,
        last: true,
      });
      expect(await theVisibleParts({ page: '1000000' })).toMatchObject({
        content: [],
        totalElements: 1,
      });
    });

    it('refuses a page size over the largest and a page number past the largest, naming each', async () => {
      await expectErrorResponse(
        await readVisibleParts({ category: 'cpu', currency: 'IQD', size: '1000' }),
        400,
        [notValid('size')],
      );
      await expectErrorResponse(
        await readVisibleParts({ category: 'cpu', currency: 'IQD', page: '1e20' }),
        400,
        [notValid('page')],
      );
    });
  });

  describe('who may read them', () => {
    it("answers the same without a token and with any token, an Admin's or a Vendor's among them", async () => {
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      const shop = await aVendor();
      await anOffer(shop.id, ryzen.id);
      const query = { category: 'cpu', currency: 'IQD' };
      const withoutAToken = await (await readVisibleParts(query)).json();
      expect(withoutAToken).toMatchObject({ totalElements: 1 });

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
        const response = await readVisibleParts(query, bearerHeader(token));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(withoutAToken);
      }
    });

    it('lists no more for an Admin or a Vendor than for anyone', async () => {
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      await aPart('Made-up Ryzen 7 7700');
      const shop = await aVendor();
      await anOffer(shop.id, ryzen.id);

      for (const token of [await adminToken(), await tokenOfTheOwnLogin(shop)]) {
        const response = await readVisibleParts(
          { category: 'cpu', currency: 'IQD' },
          bearerHeader(token),
        );
        const { content } = (await response.json()) as PageOfVisibleParts;
        expect(content.map(({ name }) => name)).toEqual(['Made-up Ryzen 5 7600']);
      }
    });
  });

  describe('a refused request', () => {
    it('refuses a missing Category and one outside the eight with 400, naming the Category', async () => {
      const queries: Record<string, string>[] = [
        { currency: 'IQD' },
        { category: 'monitor', currency: 'IQD' },
        { category: 'CPU', currency: 'IQD' },
        { category: '', currency: 'IQD' },
      ];
      for (const query of queries) {
        await expectErrorResponse(await readVisibleParts(query), 400, [
          notValid('category'),
        ]);
      }
    });

    it('refuses a missing currency and one that is neither USD nor IQD with 400, naming the currency', async () => {
      const queries: Record<string, string>[] = [
        { category: 'cpu' },
        { category: 'cpu', currency: 'EUR' },
        { category: 'cpu', currency: 'usd' },
        { category: 'cpu', currency: '' },
      ];
      for (const query of queries) {
        await expectErrorResponse(await readVisibleParts(query), 400, [
          notValid('currency'),
        ]);
      }
    });
  });

  describe('one answer', () => {
    // A read that took the rate and the Offers at different moments would
    // answer 10 $ at 2,000, 20,000 IQD, or 20 $ at 1,500, 30,000 IQD.
    for (const lockedTable of ['offer', 'platform_rate'] as const) {
      it(`gives every Lowest Price at the rate of the same moment as its Offers, read in one query, while ${lockedTable} is locked`, async () => {
        const ryzen = await aPart('Made-up Ryzen 5 7600');
        const shop = await aVendor();
        const store = await aVendor('Made-up Computer Store');
        // The API's clock moved, and the rate set at its time, as every rate
        // is set by the API's clock and not the database's.
        moveTheClockTo(aMovedMoment);
        await setThePlatformRate(1500);
        await anOffer(shop.id, ryzen.id, { usdPrice: '10.00', inStock: true });
        await anOffer(store.id, ryzen.id, { usdPrice: '10.00', inStock: false });

        const answer = await changeTheRateAndTheOffersWhileReading(
          { iqdPerUsd: 2000, setAt: new Date(), usdPriceCents: 2000, lockedTable },
          () => theVisibleParts({ currency: 'IQD' }),
        );

        // After the change, as a read in one query sees it.
        expect(answer).toMatchObject({
          content: [{ lowestPrice: converted('IQD', '40000') }],
          totalElements: 1,
        });
      });
    }
  });
});
