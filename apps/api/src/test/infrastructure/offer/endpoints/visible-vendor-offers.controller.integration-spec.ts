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
import { vendorNotFound } from '../../../test-utils/error-bodies';
import {
  emptyTheRealm,
  loginsNamed,
} from '../../../test-utils/keycloak/keycloak-administrator';

// A visible Vendor's Offers, which anyone may read without a token: an
// active Vendor's Offers that are not Expired Offers (CAT-7, OFF-6, ACC-7),
// each with its Part, its Shown Price in the chosen currency (PRC-3) and how
// many days ago it was confirmed (OFF-7), grouped by Category in the
// catalog's order, and within each in stock first, then the lowest Shown
// Price (OFF-11, PRC-4), as a Vendor page lists them (BRW-4).

// The currencies a Shopper may choose.
type Currency = 'USD' | 'IQD';

// The price a visible Offer shows in the currency asked for.
type ShownPriceBody = { currency: Currency; amount: string; converted: boolean };

// A Shown Price that is the Quoted Price in the currency, and one that is a
// Converted Price.
function quoted(currency: Currency, amount: string): ShownPriceBody {
  return { currency, amount, converted: false };
}
function converted(currency: Currency, amount: string): ShownPriceBody {
  return { currency, amount, converted: true };
}

// A Part as the API answers it, as far as these tests read it.
type PartBody = {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  partNumbers: string[];
  photoPath: string | null;
};

// One of a visible Vendor's Offers as the API answers it, and a page of them.
type VisibleOfferOfVendorBody = {
  part: PartBody;
  usdPrice: string | null;
  iqdPrice: number | null;
  shownPrice: ShownPriceBody | null;
  inStock: boolean;
  warrantyMonths: number | null;
  confirmedAt: string;
  daysSinceConfirmation: number;
};

type PageOfOffers = {
  content: VisibleOfferOfVendorBody[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

// A Vendor as the API answers it, as far as these tests read it.
type VendorBody = { id: string; name: string; loginPhoneNumber: { international: string } };

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

describe("a visible Vendor's Offers", () => {
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

  // A made-up Part the Admin adds to the catalog, a CPU unless it says
  // otherwise.
  async function aPart(name: string, category = 'cpu'): Promise<PartBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        category,
        name,
        manufacturer: 'Made-up Chips',
        partNumbers: ['MADE-UP-1'],
      }),
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

  // The Vendor's visible Offers, asked for with the query given, as a test
  // writes it, and the headers given.
  function readVisibleOffersOf(
    vendorId: string,
    query: Record<string, string> = { currency: 'IQD' },
    headers: Record<string, string> = {},
  ): Promise<Response> {
    const search = new URLSearchParams(query).toString();
    return fetch(`${testApp.baseUrl}/v1/visible-vendors/${vendorId}/offers?${search}`, {
      headers,
    });
  }

  // One page of the Vendor's visible Offers, read without a token, in dinars
  // unless the query says otherwise.
  async function theVisibleOffersOf(
    vendorId: string,
    query: Record<string, string> = {},
  ): Promise<PageOfOffers> {
    const response = await readVisibleOffersOf(vendorId, { currency: 'IQD', ...query });
    expect(response.status).toBe(200);
    return (await response.json()) as PageOfOffers;
  }

  // The names of the Parts of the Vendor's visible Offers on the first page,
  // in their order.
  async function theNamesListed(
    vendorId: string,
    query: Record<string, string> = {},
  ): Promise<string[]> {
    return (await theVisibleOffersOf(vendorId, query)).content.map(({ part }) => part.name);
  }

  describe('the answer', () => {
    it('gives each Offer with its Part, both Quoted Prices as entered, its Shown Price, the stock, the warranty, and when it was confirmed', async () => {
      await setThePlatformRate(1500);
      const ryzen = await withAPhoto((await aPart('Made-up Ryzen 5 7600')).id);
      const shop = await aVendor();
      await anOfferConfirmedAt(aMovedMoment, shop.id, ryzen.id, {
        usdPrice: '100.00',
        inStock: true,
        warrantyMonths: 12,
      });
      moveTheClockTo(after(aMovedMoment, 3 * aDay + 1000));

      const offer = {
        part: {
          id: ryzen.id,
          category: 'cpu',
          name: 'Made-up Ryzen 5 7600',
          manufacturer: 'Made-up Chips',
          partNumbers: ['MADE-UP-1'],
          photoPath: ryzen.photoPath,
        },
        usdPrice: '100.00',
        iqdPrice: null,
        inStock: true,
        warrantyMonths: 12,
        confirmedAt: aMovedMoment.toISOString(),
        daysSinceConfirmation: 3,
      };
      expect(await theVisibleOffersOf(shop.id, { currency: 'IQD' })).toEqual({
        content: [{ ...offer, shownPrice: converted('IQD', '150000') }],
        pageNumber: 0,
        pageSize: 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      });
      expect((await theVisibleOffersOf(shop.id, { currency: 'USD' })).content).toEqual([
        { ...offer, shownPrice: quoted('USD', '100.00') },
      ]);
      expect(ryzen.photoPath).toMatch(/^\/v1\/photos\//);
    });

    it("leaves out every other Vendor's Offers", async () => {
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      const core = await aPart('Made-up Core i5 14600K');
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      await anOffer(shop.id, ryzen.id);
      await anOffer(store.id, ryzen.id);
      await anOffer(store.id, core.id);

      expect(await theNamesListed(shop.id)).toEqual(['Made-up Ryzen 5 7600']);
    });
  });

  describe('which Offers are listed', () => {
    it('leaves out an Expired Offer, and lists it again once the Vendor confirms it', async () => {
      const expiring = await aPart('Made-up Ryzen 5 7600');
      const current = await aPart('Made-up Ryzen 7 7700');
      const shop = await aVendor();
      await anOfferConfirmedAt(aMovedMoment, shop.id, expiring.id, {
        iqdPrice: 100000,
        inStock: true,
      });
      await anOfferConfirmedAt(after(aMovedMoment, 10 * aDay), shop.id, current.id, {
        iqdPrice: 200000,
        inStock: true,
      });

      // Confirmed 14 days ago to the millisecond, it is still visible.
      moveTheClockTo(after(aMovedMoment, 14 * aDay));
      expect(await theNamesListed(shop.id)).toEqual([
        'Made-up Ryzen 5 7600',
        'Made-up Ryzen 7 7700',
      ]);

      moveTheClockTo(after(aMovedMoment, 14 * aDay + 1));
      expect(await theVisibleOffersOf(shop.id)).toMatchObject({
        content: [{ part: { name: 'Made-up Ryzen 7 7700' } }],
        totalElements: 1,
      });

      await admin('offers/confirm', shop.id);
      expect(await theNamesListed(shop.id)).toEqual([
        'Made-up Ryzen 5 7600',
        'Made-up Ryzen 7 7700',
      ]);
    });

    it('gives an empty page for an active Vendor whose Offers are all Expired Offers, and for one with none', async () => {
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      await anOfferConfirmedAt(aMovedMoment, shop.id, ryzen.id);
      moveTheClockTo(after(aMovedMoment, 15 * aDay));

      for (const vendorId of [shop.id, store.id]) {
        expect(await theVisibleOffersOf(vendorId)).toEqual({
          content: [],
          pageNumber: 0,
          pageSize: 10,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        });
      }
    });

    it('answers 404 with VENDOR_NOT_FOUND for a deactivated Vendor, and its Offers again once it is reactivated', async () => {
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      const shop = await aVendor();
      await anOffer(shop.id, ryzen.id);

      await admin('deactivate', shop.id);
      for (const currency of ['IQD', 'USD']) {
        await expectErrorResponse(
          await readVisibleOffersOf(shop.id, { currency }),
          404,
          vendorNotFound,
        );
      }

      await admin('reactivate', shop.id);
      expect(await theNamesListed(shop.id)).toEqual(['Made-up Ryzen 5 7600']);
    });

    it('answers 404 with VENDOR_NOT_FOUND for an unknown Vendor and an identifier of no Vendor', async () => {
      for (const vendorId of [randomUUID(), 'not-a-vendor']) {
        await expectErrorResponse(await readVisibleOffersOf(vendorId), 404, vendorNotFound);
      }
    });
  });

  describe('the order', () => {
    it("groups the Offers by Category in the catalog's order, whatever their prices and stock", async () => {
      const shop = await aVendor();
      for (const [name, category, details] of [
        ['Made-up PSU', 'psu', { iqdPrice: 50000, inStock: true }],
        ['Made-up GPU', 'gpu', { iqdPrice: 100000, inStock: true }],
        ['Made-up CPU out of stock', 'cpu', { iqdPrice: 300000, inStock: false }],
        ['Made-up Case', 'case', { iqdPrice: 60000, inStock: true }],
        ['Made-up CPU', 'cpu', { iqdPrice: 400000, inStock: true }],
        ['Made-up RAM', 'ram', { iqdPrice: 70000, inStock: false }],
        ['Made-up Cooler', 'cpuCooler', { iqdPrice: 20000, inStock: true }],
      ] as const) {
        await anOffer(shop.id, (await aPart(name, category)).id, details);
      }

      expect(
        (await theVisibleOffersOf(shop.id)).content.map(({ part }) => [
          part.category,
          part.name,
        ]),
      ).toEqual([
        ['cpu', 'Made-up CPU'],
        ['cpu', 'Made-up CPU out of stock'],
        ['cpuCooler', 'Made-up Cooler'],
        ['ram', 'Made-up RAM'],
        ['gpu', 'Made-up GPU'],
        ['case', 'Made-up Case'],
        ['psu', 'Made-up PSU'],
      ]);
    });

    it('puts in-stock Offers first within a Category, then the lowest Shown Price, compared after rounding, so that the order can differ between the currencies', async () => {
      await setThePlatformRate(1500);
      const shop = await aVendor();
      for (const [name, details] of [
        ['Made-up out of stock', { iqdPrice: 1000, inStock: false }],
        ['Made-up quoted in both', { usdPrice: '100.00', iqdPrice: 160000, inStock: true }],
        // 101 $ is 151,500 IQD.
        ['Made-up quoted in dollars', { usdPrice: '101.00', inStock: true }],
        // 154,490 IQD is 102.99… $, shown as 103 $.
        ['Made-up quoted in dinars', { iqdPrice: 154490, inStock: true }],
        // 102.99 $ is 154,485 IQD before rounding, below 154,490, and shown
        // as 154,500, above it.
        ['Made-up quoted in cents', { usdPrice: '102.99', inStock: true }],
      ] as const) {
        await anOffer(shop.id, (await aPart(name)).id, details);
      }

      expect(await theNamesListed(shop.id, { currency: 'USD' })).toEqual([
        'Made-up quoted in both',
        'Made-up quoted in dollars',
        'Made-up quoted in cents',
        'Made-up quoted in dinars',
        'Made-up out of stock',
      ]);
      expect(await theNamesListed(shop.id, { currency: 'IQD' })).toEqual([
        'Made-up quoted in dollars',
        'Made-up quoted in dinars',
        'Made-up quoted in cents',
        'Made-up quoted in both',
        'Made-up out of stock',
      ]);
    });

    it("falls back on equal Shown Prices to the most recent Confirmation, then the Part's name, then the Offer's identifier", async () => {
      const shop = await aVendor();
      const offerOf = new Map<string, string>();
      // All at 200,000 IQD in stock; all but one confirmed at the same moment.
      for (const [name, moment] of [
        ['Made-up B', aMovedMoment],
        ['Made-up Twin', aMovedMoment],
        ['Made-up A', aMovedMoment],
        ['Made-up C', after(aMovedMoment, aDay)],
        ['Made-up Twin', aMovedMoment],
      ] as const) {
        letTheClockRun();
        const offered = await aPart(name);
        offerOf.set(
          offered.id,
          await anOfferConfirmedAt(moment, shop.id, offered.id, {
            iqdPrice: 200000,
            inStock: true,
          }),
        );
      }
      moveTheClockTo(after(aMovedMoment, 2 * aDay));

      const listed = (await theVisibleOffersOf(shop.id)).content.map(({ part }) => [
        part.name,
        offerOf.get(part.id),
      ]);
      const twins = listed
        .filter(([name]) => name === 'Made-up Twin')
        .map(([, offerId]) => offerId);
      expect(listed.map(([name]) => name)).toEqual([
        'Made-up C',
        'Made-up A',
        'Made-up B',
        'Made-up Twin',
        'Made-up Twin',
      ]);
      expect(twins).toEqual([...twins].sort());
    });
  });

  describe('the pages', () => {
    it('gives each Offer once across the pages, in their order across the Categories, with the totals', async () => {
      const shop = await aVendor();
      for (const [name, category, iqdPrice] of [
        ['Made-up GPU', 'gpu', 100000],
        ['Made-up CPU B', 'cpu', 300000],
        ['Made-up PSU', 'psu', 50000],
        ['Made-up CPU A', 'cpu', 200000],
        ['Made-up RAM', 'ram', 70000],
      ] as const) {
        await anOffer(shop.id, (await aPart(name, category)).id, {
          iqdPrice,
          inStock: true,
        });
      }

      const pages = [];
      for (const page of ['0', '1', '2']) {
        pages.push(await theVisibleOffersOf(shop.id, { page, size: '2' }));
      }

      expect(pages.flatMap(({ content }) => content.map(({ part }) => part.name))).toEqual([
        'Made-up CPU A',
        'Made-up CPU B',
        'Made-up RAM',
        'Made-up GPU',
        'Made-up PSU',
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

      expect(await theVisibleOffersOf(shop.id, { page: '5', size: '2' })).toEqual({
        content: [],
        pageNumber: 5,
        pageSize: 2,
        totalElements: 1,
        totalPages: 1,
        first: false,
        last: true,
      });
    });
  });

  describe('a refused request', () => {
    it('refuses a missing currency, and one that is neither USD nor IQD, with 400, naming the currency', async () => {
      const shop = await aVendor();
      const queries: Record<string, string>[] = [
        {},
        { currency: 'EUR' },
        { currency: 'usd' },
        { currency: '' },
      ];
      for (const query of queries) {
        await expectErrorResponse(await readVisibleOffersOf(shop.id, query), 400, [
          notValid('currency'),
        ]);
      }
    });

    it('refuses a page size over the largest and a page number past the largest, naming each', async () => {
      const shop = await aVendor();

      await expectErrorResponse(
        await readVisibleOffersOf(shop.id, { currency: 'IQD', size: '1000' }),
        400,
        [notValid('size')],
      );
      await expectErrorResponse(
        await readVisibleOffersOf(shop.id, { currency: 'IQD', page: '1e20' }),
        400,
        [notValid('page')],
      );
    });
  });

  describe('who may read them', () => {
    it("answers the same without a token and with any token, an Admin's or a Vendor's among them", async () => {
      const shop = await aVendor();
      await anOffer(shop.id, (await aPart('Made-up Ryzen 5 7600')).id);
      const withoutAToken = await theVisibleOffersOf(shop.id);
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
        const response = await readVisibleOffersOf(
          shop.id,
          { currency: 'IQD' },
          bearerHeader(token),
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(withoutAToken);
      }
    });

    it("lists no Expired Offer for the Admin or the Vendor's own Login, and answers 404 for a deactivated Vendor with either", async () => {
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      const ownTokenOfTheStore = await tokenOfTheOwnLogin(store);
      await anOfferConfirmedAt(aMovedMoment, shop.id, (await aPart('Made-up A')).id);
      await anOfferConfirmedAt(aMovedMoment, store.id, (await aPart('Made-up B')).id);
      letTheClockRun();
      await admin('deactivate', store.id);
      moveTheClockTo(after(aMovedMoment, 15 * aDay));

      for (const token of [await adminToken(), await tokenOfTheOwnLogin(shop)]) {
        const response = await readVisibleOffersOf(
          shop.id,
          { currency: 'IQD' },
          bearerHeader(token),
        );
        expect(await response.json()).toMatchObject({ content: [], totalElements: 0 });
      }
      for (const token of [await adminToken(), ownTokenOfTheStore]) {
        await expectErrorResponse(
          await readVisibleOffersOf(store.id, { currency: 'IQD' }, bearerHeader(token)),
          404,
          vendorNotFound,
        );
      }
    });

    it("holds nothing of the Vendor's Login", async () => {
      const shop = await aVendor();
      await anOffer(shop.id, (await aPart('Made-up Ryzen 5 7600')).id);
      const { international } = shop.loginPhoneNumber;
      const [login] = await loginsNamed(international);
      // The number after +964, as 750…, and as Iraq writes it, 0750….
      const local = international.slice('+964'.length);

      const response = await readVisibleOffersOf(shop.id);
      const text = await response.text();

      expect(response.status).toBe(200);
      for (const secret of [login.id, international, local, `0${local}`]) {
        expect(text).not.toContain(secret);
      }
    });
  });

  describe('one answer', () => {
    // A read that took the rate and the Offers at different moments would
    // answer 10 $ at 2,000, 20,000 IQD, or 20 $ at 1,500, 30,000 IQD.
    for (const lockedTable of ['offer', 'platform_rate'] as const) {
      it(`gives every Shown Price at the rate of the same moment as its Offers, read in one query, while ${lockedTable} is locked`, async () => {
        const ryzen = await aPart('Made-up Ryzen 5 7600');
        const shop = await aVendor();
        // The API's clock moved, and the rate set at its time, as every rate
        // is set by the API's clock and not the database's.
        moveTheClockTo(aMovedMoment);
        await setThePlatformRate(1500);
        await anOffer(shop.id, ryzen.id, { usdPrice: '10.00', inStock: true });

        const answer = await changeTheRateAndTheOffersWhileReading(
          { iqdPerUsd: 2000, setAt: new Date(), usdPriceCents: 2000, lockedTable },
          () => theVisibleOffersOf(shop.id, { currency: 'IQD' }),
        );

        // After the change, as a read in one query sees it.
        expect(answer).toMatchObject({
          content: [{ usdPrice: '20.00', shownPrice: converted('IQD', '40000') }],
          totalElements: 1,
        });
      });
    }
  });
});
