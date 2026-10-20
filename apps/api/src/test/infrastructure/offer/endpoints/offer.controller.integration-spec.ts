import { randomUUID } from 'node:crypto';

import {
  bearerHeader,
  expectErrorResponse,
  type ExpectedErrorResponse,
  notValid,
  unauthorized,
} from '@pcp/core/test-utils';
import sharp from 'sharp';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import {
  emptyTheDatabase,
  offerHistoryRows,
} from '../../../test-utils/database/test-database';
import {
  emptyTheRealm,
  loginsNamed,
} from '../../../test-utils/keycloak/keycloak-administrator';

// Adding an Offer and reading it back (OFF-1, OFF-2, OFF-3, OFF-5, OFF-10), a
// Vendor's list of its Offers with their expiry, and confirming them all
// (OFF-5, OFF-6, OFF-7, OFF-8).

// A Part as an Offer answers it.
type OfferedPartBody = {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  partNumbers: string[];
  photoPath: string | null;
};

// An Offer as the API answers it.
type OfferBody = {
  id: string;
  part: OfferedPartBody;
  usdPrice: string | null;
  iqdPrice: number | null;
  inStock: boolean;
  warrantyMonths: number | null;
  confirmedAt: string;
  createdAt: string;
};

// An Offer as a Vendor's list answers it, with its expiry at the time of the
// API's clock.
type ListedOfferBody = OfferBody & {
  daysSinceConfirmation: number;
  expired: boolean;
  aboutToExpire: boolean;
};

// The Vendor's counts, of all its Offers whatever the search.
type OfferCountsBody = { offers: number; expired: number; aboutToExpire: number };

// One page of a Vendor's list of its Offers.
type OffersPageBody = {
  content: ListedOfferBody[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  counts: OfferCountsBody;
};

// A Vendor as the API answers it, as far as these tests read it.
type VendorBody = { id: string; loginPhoneNumber: { international: string } };

// The refusals these tests expect, each as a whole.
function refusal(code: string): ExpectedErrorResponse[] {
  const key = code.toLowerCase();
  return [{ code, title: `${key}_title`, detail: `${key}_details` }];
}
const offerNotFound = refusal('OFFER_NOT_FOUND');
const partNotFound = refusal('PART_NOT_FOUND');
const vendorAccessDenied = refusal('VENDOR_ACCESS_DENIED');
const vendorDeactivated = refusal('VENDOR_DEACTIVATED');

// A refusal of one detail of an Offer, naming its field and why.
function refused(field: string, reason: string): ExpectedErrorResponse[] {
  return [notValid(field, { reason })];
}

// The identifier of the Admin's own Login, which the history records when
// the Admin acts for a Vendor.
const adminLoginId = randomUUID();

// A moment for the API's clock, with milliseconds, so that a time stored
// with less precision would show.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');

// An hour and a day of 24 hours, and a moment some time after another.
const anHour = 60 * 60 * 1000;
const aDay = 24 * anHour;
function after(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() + milliseconds);
}

describe("a Vendor's Offers", () => {
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
  async function aVendorWith(loginPhoneNumber: string): Promise<VendorBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Made-up Computer Shop',
        city: 'erbil',
        address: 'Made-up Street, Erbil',
        phoneNumber: '066 223 4567',
        loginPhoneNumber,
      }),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { vendor: VendorBody }).vendor;
  }

  // The identifier of the Vendor's own Login.
  async function loginIdOf(vendor: VendorBody): Promise<string> {
    const [login] = await loginsNamed(vendor.loginPhoneNumber.international);
    return login.id;
  }

  // A token of the Vendor's own Login, as Keycloak issues it: its subject is
  // the Login's identifier.
  async function tokenOfTheOwnLogin(vendor: VendorBody): Promise<string> {
    return testApp.tokenOf({
      subject: await loginIdOf(vendor),
      loginName: vendor.loginPhoneNumber.international,
      roles: ['vendor'],
    });
  }

  // A made-up Part the Admin adds to the catalog.
  async function aPart(
    name = 'Made-up Ryzen 5 7600',
    manufacturer = 'AMD',
    partNumbers = ['100-100001015BOX'],
  ): Promise<OfferedPartBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'cpu',
        name,
        manufacturer,
        partNumbers,
      }),
    });
    expect(response.status).toBe(201);
    const { id, category, photoPath } = (await response.json()) as OfferedPartBody;
    return { id, category, name, manufacturer, partNumbers, photoPath };
  }

  function createOffer(
    vendorId: string,
    body: unknown,
    token: string | null,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers`, {
      method: 'POST',
      headers: {
        ...(token === null ? {} : bearerHeader(token)),
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  function readOffer(
    vendorId: string,
    offerId: string,
    token: string | null,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers/${offerId}`, {
      headers: token === null ? {} : bearerHeader(token),
    });
  }

  async function createdOf(response: Response): Promise<OfferBody> {
    expect(response.status).toBe(201);
    return (await response.json()) as OfferBody;
  }

  async function readOf(response: Response): Promise<OfferBody> {
    expect(response.status).toBe(200);
    return (await response.json()) as OfferBody;
  }

  function listOffers(
    vendorId: string,
    query: Record<string, string | number>,
    token: string | null,
  ): Promise<Response> {
    const search = new URLSearchParams(
      Object.entries(query).map(([key, value]): [string, string] => [key, String(value)]),
    );
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers?${search}`, {
      headers: token === null ? {} : bearerHeader(token),
    });
  }

  async function pageOf(response: Response): Promise<OffersPageBody> {
    expect(response.status).toBe(200);
    return (await response.json()) as OffersPageBody;
  }

  // The first page of the Vendor's Offers, as the Admin reads it at the time
  // of the clock.
  async function theListOf(
    vendorId: string,
    query: Record<string, string | number> = {},
  ): Promise<OffersPageBody> {
    return pageOf(await listOffers(vendorId, query, await adminToken()));
  }

  function confirmAll(vendorId: string, token: string | null): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers/confirm`, {
      method: 'POST',
      headers: token === null ? {} : bearerHeader(token),
    });
  }

  function editOffer(
    vendorId: string,
    offerId: string,
    body: unknown,
    token: string | null,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers/${offerId}`, {
      method: 'PUT',
      headers: {
        ...(token === null ? {} : bearerHeader(token)),
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  function removeOffer(
    vendorId: string,
    offerId: string,
    token: string | null,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers/${offerId}`, {
      method: 'DELETE',
      headers: token === null ? {} : bearerHeader(token),
    });
  }

  // An Offer the Admin adds for the Vendor with the clock at a moment, which
  // is then the time of its Confirmation. The clock stays there.
  async function anOfferConfirmedAt(
    vendorId: string,
    part: OfferedPartBody,
    moment: Date,
  ): Promise<OfferBody> {
    moveTheClockTo(moment);
    return createdOf(
      await createOffer(
        vendorId,
        { partId: part.id, usdPrice: '349.99', inStock: true },
        await adminToken(),
      ),
    );
  }

  // A Vendor that has logged in, with its token, and a Part to offer.
  async function aVendorAndAPart(): Promise<{
    vendor: VendorBody;
    token: string;
    part: OfferedPartBody;
  }> {
    const vendor = await aVendorWith('0750 123 4567');
    return { vendor, token: await tokenOfTheOwnLogin(vendor), part: await aPart() };
  }

  describe('adding and reading an Offer', () => {
    it.each<[string, Record<string, unknown>, Partial<OfferBody>]>([
      [
        'only in USD, with its cents',
        { usdPrice: '349.99', inStock: true, warrantyMonths: 36 },
        { usdPrice: '349.99', iqdPrice: null, inStock: true, warrantyMonths: 36 },
      ],
      [
        'only in IQD, out of stock and with no warranty',
        { iqdPrice: 525000, inStock: false },
        { usdPrice: null, iqdPrice: 525000, inStock: false, warrantyMonths: null },
      ],
      [
        'in both, the warranty sent as null',
        { usdPrice: '350', iqdPrice: 530000, inStock: true, warrantyMonths: null },
        { usdPrice: '350.00', iqdPrice: 530000, inStock: true, warrantyMonths: null },
      ],
    ])(
      'lets a Vendor add one quoted %s, and read it back as entered',
      async (_how, details, expected) => {
        const { vendor, token, part } = await aVendorAndAPart();

        const created = await createdOf(
          await createOffer(vendor.id, { partId: part.id, ...details }, token),
        );

        expect(created).toEqual({
          id: expect.any(String),
          part,
          ...expected,
          confirmedAt: expect.any(String),
          createdAt: created.confirmedAt,
        });
        expect(await readOf(await readOffer(vendor.id, created.id, token))).toEqual(
          created,
        );
      },
    );

    it("answers the Part's photo with the Offer", async () => {
      const { vendor, token, part } = await aVendorAndAPart();
      const picture = await sharp({
        create: { width: 400, height: 300, channels: 3, background: '#aa3333' },
      })
        .png()
        .toBuffer();
      const form = new FormData();
      form.append(
        'photo',
        new Blob([new Uint8Array(picture)], { type: 'image/png' }),
        'a.png',
      );
      const added = await fetch(`${testApp.baseUrl}/v1/parts/${part.id}/photo`, {
        method: 'PUT',
        headers: bearerHeader(await adminToken()),
        body: form,
      });
      expect(added.status).toBe(200);
      const { photoPath } = (await added.json()) as { photoPath: string };

      const created = await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '99.50', inStock: true },
          token,
        ),
      );

      expect(created.part.photoPath).toBe(photoPath);
      expect(
        (await readOf(await readOffer(vendor.id, created.id, token))).part.photoPath,
      ).toBe(photoPath);
    });

    it("is confirmed and created at the time of the API's clock", async () => {
      const { vendor, part } = await aVendorAndAPart();
      moveTheClockTo(aMovedMoment);
      const token = await tokenOfTheOwnLogin(vendor);

      const created = await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '349.99', inStock: true },
          token,
        ),
      );

      expect(created.confirmedAt).toBe('2027-03-14T09:26:53.589Z');
      expect(created.createdAt).toBe('2027-03-14T09:26:53.589Z');
      const read = await readOf(await readOffer(vendor.id, created.id, token));
      expect(read.confirmedAt).toBe('2027-03-14T09:26:53.589Z');
    });

    it('answers 404 with PART_NOT_FOUND for a Part that does not exist', async () => {
      const { vendor, token } = await aVendorAndAPart();

      for (const partId of [randomUUID(), 'not-a-part']) {
        await expectErrorResponse(
          await createOffer(
            vendor.id,
            { partId, usdPrice: '349.99', inStock: true },
            token,
          ),
          404,
          partNotFound,
        );
      }
    });
  });

  describe("an Offer's details", () => {
    it.each<[string, Record<string, unknown>, string, string]>([
      ['no price at all', { inStock: true }, 'usdPrice', 'missing'],
      [
        'an empty USD price and no IQD price',
        { usdPrice: '', inStock: true },
        'usdPrice',
        'missing',
      ],
      [
        'a USD price of zero',
        { usdPrice: '0.00', inStock: true },
        'usdPrice',
        'notPositive',
      ],
      ['an IQD price of zero', { iqdPrice: 0, inStock: true }, 'iqdPrice', 'notPositive'],
      [
        'a negative USD price',
        { usdPrice: '-349.99', inStock: true },
        'usdPrice',
        'notPositive',
      ],
      [
        'a negative IQD price',
        { iqdPrice: -525000, inStock: true },
        'iqdPrice',
        'notPositive',
      ],
      [
        'three decimal places in USD',
        { usdPrice: '349.999', inStock: true },
        'usdPrice',
        'tooManyDecimals',
      ],
      [
        'a fraction of a dinar',
        { iqdPrice: 525000.5, inStock: true },
        'iqdPrice',
        'tooManyDecimals',
      ],
      [
        'a USD price over 100,000.00',
        { usdPrice: '100000.01', inStock: true },
        'usdPrice',
        'tooLarge',
      ],
      [
        'a USD price far over its limit',
        { usdPrice: '12345678901234567890', inStock: true },
        'usdPrice',
        'tooLarge',
      ],
      [
        'an IQD price over 150,000,000',
        { iqdPrice: 150000001, inStock: true },
        'iqdPrice',
        'tooLarge',
      ],
      [
        'a USD price with a thousands separator',
        { usdPrice: '1,349.99', inStock: true },
        'usdPrice',
        'notANumber',
      ],
      [
        'a USD price in Arabic-Indic digits',
        { usdPrice: '٣٤٩', inStock: true },
        'usdPrice',
        'notANumber',
      ],
      [
        'a USD price that is no number',
        { usdPrice: 'cheap', inStock: true },
        'usdPrice',
        'notANumber',
      ],
      ['no in stock', { usdPrice: '349.99' }, 'inStock', 'missing'],
      [
        'a warranty of 0 months',
        { usdPrice: '349.99', inStock: true, warrantyMonths: 0 },
        'warrantyMonths',
        'notPositive',
      ],
      [
        'a warranty of 121 months',
        { usdPrice: '349.99', inStock: true, warrantyMonths: 121 },
        'warrantyMonths',
        'tooLarge',
      ],
      [
        'a warranty of 1.5 months',
        { usdPrice: '349.99', inStock: true, warrantyMonths: 1.5 },
        'warrantyMonths',
        'notWholeMonths',
      ],
    ])(
      'refuses %s, naming the field and the reason',
      async (_what, details, field, reason) => {
        const { vendor, token, part } = await aVendorAndAPart();

        await expectErrorResponse(
          await createOffer(vendor.id, { partId: part.id, ...details }, token),
          400,
          refused(field, reason),
        );
      },
    );

    it('names the first detail that does not fit, in the order USD, IQD, in stock, warranty', async () => {
      const { vendor, token, part } = await aVendorAndAPart();
      const everyDetailWrong = {
        partId: part.id,
        usdPrice: '0',
        iqdPrice: 0.5,
        warrantyMonths: 0,
      };

      await expectErrorResponse(
        await createOffer(vendor.id, everyDetailWrong, token),
        400,
        refused('usdPrice', 'notPositive'),
      );
      await expectErrorResponse(
        await createOffer(vendor.id, { ...everyDetailWrong, usdPrice: '1' }, token),
        400,
        refused('iqdPrice', 'tooManyDecimals'),
      );
      await expectErrorResponse(
        await createOffer(
          vendor.id,
          { ...everyDetailWrong, usdPrice: '1', iqdPrice: 1 },
          token,
        ),
        400,
        refused('inStock', 'missing'),
      );
      await expectErrorResponse(
        await createOffer(
          vendor.id,
          { ...everyDetailWrong, usdPrice: '1', iqdPrice: 1, inStock: true },
          token,
        ),
        400,
        refused('warrantyMonths', 'notPositive'),
      );
    });

    it('takes every detail at its limits', async () => {
      const { vendor, token } = await aVendorAndAPart();
      const lowest = await aPart('Made-up Lowest');
      const highest = await aPart('Made-up Highest');

      const low = await createdOf(
        await createOffer(
          vendor.id,
          {
            partId: lowest.id,
            usdPrice: '0.01',
            iqdPrice: 1,
            inStock: true,
            warrantyMonths: 1,
          },
          token,
        ),
      );
      const high = await createdOf(
        await createOffer(
          vendor.id,
          {
            partId: highest.id,
            usdPrice: '100000.00',
            iqdPrice: 150000000,
            inStock: true,
            warrantyMonths: 120,
          },
          token,
        ),
      );

      expect(low).toMatchObject({ usdPrice: '0.01', iqdPrice: 1, warrantyMonths: 1 });
      expect(high).toMatchObject({
        usdPrice: '100000.00',
        iqdPrice: 150000000,
        warrantyMonths: 120,
      });
    });

    it.each<[string, Record<string, unknown>, string]>([
      [
        'a USD price sent as a JSON number',
        { usdPrice: 349.99, inStock: true },
        'usdPrice',
      ],
      ['an IQD price sent as text', { iqdPrice: '525000', inStock: true }, 'iqdPrice'],
      ['in stock sent as text', { usdPrice: '349.99', inStock: 'yes' }, 'inStock'],
      [
        'a field the request does not declare',
        { usdPrice: '1', inStock: true, vendorId: 'x' },
        'vendorId',
      ],
    ])(
      "refuses %s by the request's own check, with no reason",
      async (_what, details, field) => {
        const { vendor, token, part } = await aVendorAndAPart();

        await expectErrorResponse(
          await createOffer(vendor.id, { partId: part.id, ...details }, token),
          400,
          [notValid(field)],
        );
      },
    );
  });

  describe('one Offer for a Part', () => {
    it('refuses a second Offer for the same Part as taken', async () => {
      const { vendor, token, part } = await aVendorAndAPart();
      await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '349.99', inStock: true },
          token,
        ),
      );

      await expectErrorResponse(
        await createOffer(
          vendor.id,
          { partId: part.id, iqdPrice: 525000, inStock: false },
          token,
        ),
        400,
        refused('partId', 'taken'),
      );
    });

    it('leaves one Offer when several requests to add it arrive at once', async () => {
      const { vendor, token, part } = await aVendorAndAPart();

      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          createOffer(
            vendor.id,
            { partId: part.id, usdPrice: '349.99', inStock: true },
            token,
          ),
        ),
      );

      const statuses = responses.map((response) => response.status).sort();
      expect(statuses).toEqual([201, 400, 400, 400, 400]);
      for (const response of responses.filter((each) => each.status === 400)) {
        expect(await response.json()).toEqual({ errors: refused('partId', 'taken') });
      }
      expect(await offerHistoryRows()).toHaveLength(1);
    });

    it('lets two Vendors each offer the same Part', async () => {
      const { vendor, token, part } = await aVendorAndAPart();
      const another = await aVendorWith('0750 765 4321');

      const first = await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '349.99', inStock: true },
          token,
        ),
      );
      const second = await createdOf(
        await createOffer(
          another.id,
          { partId: part.id, usdPrice: '345.00', inStock: true },
          await tokenOfTheOwnLogin(another),
        ),
      );

      expect([first.usdPrice, second.usdPrice]).toEqual(['349.99', '345.00']);
    });
  });

  describe('the Admin', () => {
    it('adds and reads an Offer for any Vendor, a deactivated one among them', async () => {
      const part = await aPart();
      const active = await aVendorWith('0750 123 4567');
      const deactivated = await aVendorWith('0750 765 4321');
      const deactivation = await fetch(
        `${testApp.baseUrl}/v1/vendors/${deactivated.id}/deactivate`,
        { method: 'POST', headers: bearerHeader(await adminToken()) },
      );
      expect(deactivation.status).toBe(200);

      for (const vendor of [active, deactivated]) {
        const created = await createdOf(
          await createOffer(
            vendor.id,
            { partId: part.id, usdPrice: '349.99', inStock: true },
            await adminToken(),
          ),
        );
        expect(
          await readOf(await readOffer(vendor.id, created.id, await adminToken())),
        ).toEqual(created);
      }
    });

    it('is answered 404 with VENDOR_NOT_FOUND for a Vendor that does not exist', async () => {
      const part = await aPart();

      await expectErrorResponse(
        await createOffer(
          randomUUID(),
          { partId: part.id, usdPrice: '349.99', inStock: true },
          await adminToken(),
        ),
        404,
        refusal('VENDOR_NOT_FOUND'),
      );
    });
  });

  describe('who may add, read, list, confirm, change and remove Offers', () => {
    it("refuses a Vendor's token at another Vendor's Offers with 403, whether that Vendor exists or not", async () => {
      const { vendor, part } = await aVendorAndAPart();
      const another = await aVendorWith('0750 765 4321');
      const offer = await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '349.99', inStock: true },
          await adminToken(),
        ),
      );
      const anothersToken = await tokenOfTheOwnLogin(another);

      for (const vendorId of [vendor.id, randomUUID(), 'not-a-vendor']) {
        await expectErrorResponse(
          await createOffer(
            vendorId,
            { partId: part.id, usdPrice: '1.00', inStock: true },
            anothersToken,
          ),
          403,
          vendorAccessDenied,
        );
        await expectErrorResponse(
          await readOffer(vendorId, offer.id, anothersToken),
          403,
          vendorAccessDenied,
        );
        await expectErrorResponse(
          await listOffers(vendorId, {}, anothersToken),
          403,
          vendorAccessDenied,
        );
        await expectErrorResponse(
          await confirmAll(vendorId, anothersToken),
          403,
          vendorAccessDenied,
        );
        await expectErrorResponse(
          await editOffer(
            vendorId,
            offer.id,
            { usdPrice: '1.00', inStock: false },
            anothersToken,
          ),
          403,
          vendorAccessDenied,
        );
        await expectErrorResponse(
          await removeOffer(vendorId, offer.id, anothersToken),
          403,
          vendorAccessDenied,
        );
      }
      expect(
        await readOf(await readOffer(vendor.id, offer.id, await adminToken())),
      ).toEqual(offer);
    });

    it("answers 404 with OFFER_NOT_FOUND for another Vendor's Offer changed or removed through one's own address, and for one that does not exist, leaving the other Vendor's Offer as it was", async () => {
      const { vendor, token, part } = await aVendorAndAPart();
      const another = await aVendorWith('0750 765 4321');
      const anothersOffer = await createdOf(
        await createOffer(
          another.id,
          { partId: part.id, usdPrice: '349.99', inStock: true },
          await tokenOfTheOwnLogin(another),
        ),
      );
      const historyBefore = await offerHistoryRows();

      for (const offerId of [anothersOffer.id, randomUUID(), 'not-an-offer']) {
        for (const caller of [token, await adminToken()]) {
          await expectErrorResponse(
            await editOffer(
              vendor.id,
              offerId,
              { usdPrice: '1.00', inStock: false },
              caller,
            ),
            404,
            offerNotFound,
          );
          await expectErrorResponse(
            await removeOffer(vendor.id, offerId, caller),
            404,
            offerNotFound,
          );
        }
      }
      expect(
        await readOf(await readOffer(another.id, anothersOffer.id, await adminToken())),
      ).toEqual(anothersOffer);
      expect(await offerHistoryRows()).toEqual(historyBefore);
    });

    it("answers 404 with OFFER_NOT_FOUND for another Vendor's Offer read through one's own address, and for one that does not exist", async () => {
      const { vendor, token, part } = await aVendorAndAPart();
      const another = await aVendorWith('0750 765 4321');
      const anothersOffer = await createdOf(
        await createOffer(
          another.id,
          { partId: part.id, usdPrice: '349.99', inStock: true },
          await tokenOfTheOwnLogin(another),
        ),
      );

      for (const offerId of [anothersOffer.id, randomUUID(), 'not-an-offer']) {
        await expectErrorResponse(
          await readOffer(vendor.id, offerId, token),
          404,
          offerNotFound,
        );
      }
      await expectErrorResponse(
        await readOffer(vendor.id, anothersOffer.id, await adminToken()),
        404,
        offerNotFound,
      );
    });

    it("refuses a deactivated Vendor's own token, not run out, with 403 and VENDOR_DEACTIVATED", async () => {
      const { vendor, token, part } = await aVendorAndAPart();
      const offer = await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '349.99', inStock: true },
          token,
        ),
      );
      const deactivation = await fetch(
        `${testApp.baseUrl}/v1/vendors/${vendor.id}/deactivate`,
        {
          method: 'POST',
          headers: bearerHeader(await adminToken()),
        },
      );
      expect(deactivation.status).toBe(200);
      const another = await aPart('Made-up Ryzen 7 7700');

      await expectErrorResponse(
        await createOffer(
          vendor.id,
          { partId: another.id, usdPrice: '1.00', inStock: true },
          token,
        ),
        403,
        vendorDeactivated,
      );
      await expectErrorResponse(
        await readOffer(vendor.id, offer.id, token),
        403,
        vendorDeactivated,
      );
      await expectErrorResponse(
        await listOffers(vendor.id, {}, token),
        403,
        vendorDeactivated,
      );
      await expectErrorResponse(await confirmAll(vendor.id, token), 403, vendorDeactivated);
      await expectErrorResponse(
        await editOffer(vendor.id, offer.id, { usdPrice: '1.00', inStock: false }, token),
        403,
        vendorDeactivated,
      );
      await expectErrorResponse(
        await removeOffer(vendor.id, offer.id, token),
        403,
        vendorDeactivated,
      );
      expect(
        await readOf(await readOffer(vendor.id, offer.id, await adminToken())),
      ).toEqual(offer);
    });

    it('answers a call without a token with 401', async () => {
      const { vendor, token, part } = await aVendorAndAPart();
      const offer = await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '349.99', inStock: true },
          token,
        ),
      );

      await expectErrorResponse(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '1.00', inStock: true },
          null,
        ),
        401,
        unauthorized,
      );
      await expectErrorResponse(
        await readOffer(vendor.id, offer.id, null),
        401,
        unauthorized,
      );
      await expectErrorResponse(await listOffers(vendor.id, {}, null), 401, unauthorized);
      await expectErrorResponse(await confirmAll(vendor.id, null), 401, unauthorized);
      await expectErrorResponse(
        await editOffer(vendor.id, offer.id, { usdPrice: '1.00', inStock: false }, null),
        401,
        unauthorized,
      );
      await expectErrorResponse(
        await removeOffer(vendor.id, offer.id, null),
        401,
        unauthorized,
      );
    });
  });

  describe("the Offer's history", () => {
    it("records the Offer's creation once, with the time of the API's clock and the Vendor's own Login", async () => {
      const { vendor, part } = await aVendorAndAPart();
      moveTheClockTo(aMovedMoment);

      await createdOf(
        await createOffer(
          vendor.id,
          {
            partId: part.id,
            usdPrice: '349.99',
            iqdPrice: 525000,
            inStock: true,
            warrantyMonths: 12,
          },
          await tokenOfTheOwnLogin(vendor),
        ),
      );

      expect(await offerHistoryRows()).toEqual([
        {
          changedAt: aMovedMoment,
          vendorId: vendor.id,
          partId: part.id,
          change: 'created',
          usdPriceCents: 34999,
          iqdPrice: 525000,
          inStock: true,
          changedBy: await loginIdOf(vendor),
        },
      ]);
    });

    it('records the Admin, acting for the Vendor, as the Admin', async () => {
      const { vendor, part } = await aVendorAndAPart();
      moveTheClockTo(aMovedMoment);

      await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, iqdPrice: 525000, inStock: false },
          await adminToken(),
        ),
      );

      expect(await offerHistoryRows()).toEqual([
        {
          changedAt: aMovedMoment,
          vendorId: vendor.id,
          partId: part.id,
          change: 'created',
          usdPriceCents: null,
          iqdPrice: 525000,
          inStock: false,
          changedBy: adminLoginId,
        },
      ]);
    });

    it('records nothing for an Offer that was refused', async () => {
      const { vendor, token, part } = await aVendorAndAPart();
      await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '349.99', inStock: true },
          token,
        ),
      );

      expect(
        (
          await createOffer(
            vendor.id,
            { partId: part.id, usdPrice: '1.00', inStock: true },
            token,
          )
        ).status,
      ).toBe(400);
      expect(
        (
          await createOffer(
            vendor.id,
            { partId: part.id, usdPrice: '0', inStock: true },
            token,
          )
        ).status,
      ).toBe(400);

      expect(await offerHistoryRows()).toHaveLength(1);
    });
  });

  describe("a Vendor's list of its Offers", () => {
    it("holds the Vendor's Offers only, each once across the pages, oldest Confirmation first and then by Part name", async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const another = await aVendorWith('0750 765 4321');
      const [a, b, c, d, e] = [
        await aPart('Made-up Part A'),
        await aPart('Made-up Part B'),
        await aPart('Made-up Part C'),
        await aPart('Made-up Part D'),
        await aPart('Made-up Part E'),
      ];
      await anOfferConfirmedAt(vendor.id, c, after(aMovedMoment, 3 * anHour));
      await anOfferConfirmedAt(vendor.id, b, after(aMovedMoment, anHour));
      await anOfferConfirmedAt(vendor.id, e, after(aMovedMoment, 2 * anHour));
      const first = await anOfferConfirmedAt(vendor.id, d, aMovedMoment);
      await anOfferConfirmedAt(vendor.id, a, after(aMovedMoment, anHour));
      await anOfferConfirmedAt(another.id, a, after(aMovedMoment, -anHour));
      moveTheClockTo(after(aMovedMoment, 4 * anHour));
      const token = await tokenOfTheOwnLogin(vendor);

      const pages = [];
      for (const page of [0, 1, 2]) {
        pages.push(await pageOf(await listOffers(vendor.id, { page, size: 2 }, token)));
      }

      expect(pages.flatMap((each) => each.content.map((offer) => offer.part.name))).toEqual(
        [
          'Made-up Part D',
          'Made-up Part A',
          'Made-up Part B',
          'Made-up Part E',
          'Made-up Part C',
        ],
      );
      expect(pages[0].content[0]).toEqual({
        ...first,
        daysSinceConfirmation: 0,
        expired: false,
        aboutToExpire: false,
      });
      expect(
        pages.map(({ pageNumber, pageSize, totalElements, totalPages, first, last }) => ({
          pageNumber,
          pageSize,
          totalElements,
          totalPages,
          first,
          last,
        })),
      ).toEqual([
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

    it("finds an Offer by its Part's name, manufacturer or part number, in any case and any order", async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const another = await aVendorWith('0750 765 4321');
      const ryzen = await aPart('Made-up Ryzen 5 7600', 'AMD', ['100-100001015BOX']);
      const geforce = await aPart('Made-up GeForce RTX 4070', 'NVIDIA', [
        '900-1G141-2544-000',
      ]);
      const core = await aPart('Made-up Core i5-14600K', 'Intel', ['BX8071514600K']);
      for (const part of [ryzen, geforce, core]) {
        await anOfferConfirmedAt(vendor.id, part, aMovedMoment);
      }
      await anOfferConfirmedAt(another.id, ryzen, aMovedMoment);

      for (const [search, found] of [
        ['ryzen 7600', ['Made-up Ryzen 5 7600']],
        ['7600 RYZEN', ['Made-up Ryzen 5 7600']],
        ['nvidia', ['Made-up GeForce RTX 4070']],
        ['bx8071514600k', ['Made-up Core i5-14600K']],
        [
          '  ',
          ['Made-up Core i5-14600K', 'Made-up GeForce RTX 4070', 'Made-up Ryzen 5 7600'],
        ],
        ['made-up radeon', []],
      ] as const) {
        const page = await theListOf(vendor.id, { search });

        expect(page.content.map((offer) => offer.part.name)).toEqual(found);
        expect(page.totalElements).toBe(found.length);
      }
    });

    it("lets the Admin list a deactivated Vendor's Offers", async () => {
      const { vendor, part } = await aVendorAndAPart();
      const offer = await anOfferConfirmedAt(vendor.id, part, aMovedMoment);
      letTheClockRun();
      const deactivation = await fetch(
        `${testApp.baseUrl}/v1/vendors/${vendor.id}/deactivate`,
        { method: 'POST', headers: bearerHeader(await adminToken()) },
      );
      expect(deactivation.status).toBe(200);
      moveTheClockTo(aMovedMoment);

      expect((await theListOf(vendor.id)).content.map(({ id }) => id)).toEqual([offer.id]);
    });
  });

  describe("an Offer's expiry, with the clock moved", () => {
    // The Vendor's one Offer, confirmed at the moved moment, as its list
    // answers it with the clock moved on by some time.
    async function theOfferListed(
      vendorId: string,
      later: number,
    ): Promise<ListedOfferBody> {
      moveTheClockTo(after(aMovedMoment, later));
      const [listed] = (await theListOf(vendorId)).content;
      return listed;
    }

    it('is not expired when confirmed 14 days ago to the millisecond, and is listed marked expired one millisecond later', async () => {
      const { vendor, part } = await aVendorAndAPart();
      await anOfferConfirmedAt(vendor.id, part, aMovedMoment);

      expect(await theOfferListed(vendor.id, 14 * aDay)).toMatchObject({
        daysSinceConfirmation: 14,
        expired: false,
        aboutToExpire: true,
      });
      expect(await theOfferListed(vendor.id, 14 * aDay + 1)).toMatchObject({
        daysSinceConfirmation: 14,
        expired: true,
        aboutToExpire: false,
      });
    });

    it('is not about to expire when confirmed 11 days ago to the millisecond, and is one millisecond later', async () => {
      const { vendor, part } = await aVendorAndAPart();
      await anOfferConfirmedAt(vendor.id, part, aMovedMoment);

      expect(await theOfferListed(vendor.id, 11 * aDay)).toMatchObject({
        daysSinceConfirmation: 11,
        expired: false,
        aboutToExpire: false,
      });
      expect(await theOfferListed(vendor.id, 11 * aDay + 1)).toMatchObject({
        daysSinceConfirmation: 11,
        expired: false,
        aboutToExpire: true,
      });
    });

    it('counts the days since Confirmation as whole days of 24 hours: 0 just before 24 hours, 1 at 24 hours, 14 at the boundary', async () => {
      const { vendor, part } = await aVendorAndAPart();
      await anOfferConfirmedAt(vendor.id, part, aMovedMoment);

      const days = [];
      for (const later of [0, aDay - 1, aDay, 2 * aDay - 1, 14 * aDay, 15 * aDay]) {
        days.push((await theOfferListed(vendor.id, later)).daysSinceConfirmation);
      }

      expect(days).toEqual([0, 0, 1, 1, 14, 15]);
    });
  });

  describe("a Vendor's counts of its Offers", () => {
    it('counts the Offers, the Expired Offers and those about to expire, whatever the search', async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const another = await aVendorWith('0750 765 4321');
      const now = after(aMovedMoment, 30 * aDay);
      const confirmed = [
        // Current.
        ['Made-up Ryzen 5 7600', 1],
        ['Made-up Part 1', 11],
        // About to expire.
        ['Made-up Part 2', 12],
        ['Made-up Part 3', 14],
        // Expired.
        ['Made-up Part 4', 15],
        ['Made-up Part 5', 20],
        ['Made-up Part 6', 30],
      ] as const;
      for (const [name, daysAgo] of confirmed) {
        const part = await aPart(name);
        await anOfferConfirmedAt(vendor.id, part, after(now, -daysAgo * aDay));
        await anOfferConfirmedAt(another.id, part, after(now, -15 * aDay));
      }
      moveTheClockTo(now);

      const all = await theListOf(vendor.id);
      const searched = await theListOf(vendor.id, { search: 'ryzen' });

      expect(all.totalElements).toBe(7);
      expect(all.counts).toEqual({ offers: 7, expired: 3, aboutToExpire: 2 });
      expect(searched.totalElements).toBe(1);
      expect(searched.counts).toEqual({ offers: 7, expired: 3, aboutToExpire: 2 });
      expect(
        all.content.map(({ part, expired, aboutToExpire }) => [
          part.name,
          expired,
          aboutToExpire,
        ]),
      ).toEqual([
        ['Made-up Part 6', true, false],
        ['Made-up Part 5', true, false],
        ['Made-up Part 4', true, false],
        ['Made-up Part 3', false, true],
        ['Made-up Part 2', false, true],
        ['Made-up Part 1', false, false],
        ['Made-up Ryzen 5 7600', false, false],
      ]);
    });

    it('moves an Offer from about to expire to expired at the 14-day boundary, as its list marks it', async () => {
      const { vendor, part } = await aVendorAndAPart();
      await anOfferConfirmedAt(vendor.id, part, aMovedMoment);

      const counts = [];
      for (const later of [11 * aDay, 11 * aDay + 1, 14 * aDay, 14 * aDay + 1]) {
        moveTheClockTo(after(aMovedMoment, later));
        counts.push((await theListOf(vendor.id)).counts);
      }

      expect(counts).toEqual([
        { offers: 1, expired: 0, aboutToExpire: 0 },
        { offers: 1, expired: 0, aboutToExpire: 1 },
        { offers: 1, expired: 0, aboutToExpire: 1 },
        { offers: 1, expired: 1, aboutToExpire: 0 },
      ]);
    });

    it('answers an empty page, with counts of 0, for a Vendor with no Offers', async () => {
      const vendor = await aVendorWith('0750 123 4567');

      expect(await theListOf(vendor.id)).toEqual({
        content: [],
        pageNumber: 0,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
        counts: { offers: 0, expired: 0, aboutToExpire: 0 },
      });
    });
  });

  describe("confirming all of a Vendor's Offers", () => {
    it("confirms every Offer of the Vendor, Expired Offers among them, answers how many, leaves another Vendor's as they were, and adds no history row", async () => {
      const vendor = await aVendorWith('0750 123 4567');
      const another = await aVendorWith('0750 765 4321');
      const now = after(aMovedMoment, 30 * aDay);
      const parts = [
        await aPart('Made-up Part 1'),
        await aPart('Made-up Part 2'),
        await aPart('Made-up Part 3'),
      ];
      for (const [part, daysAgo] of [
        [parts[0], 20],
        [parts[1], 12],
        [parts[2], 1],
      ] as const) {
        await anOfferConfirmedAt(vendor.id, part, after(now, -daysAgo * aDay));
      }
      const anothers = await anOfferConfirmedAt(
        another.id,
        parts[0],
        after(now, -20 * aDay),
      );
      const historyBefore = await offerHistoryRows();
      moveTheClockTo(now);

      const response = await confirmAll(vendor.id, await tokenOfTheOwnLogin(vendor));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ confirmed: 3 });
      const listed = await theListOf(vendor.id);
      expect(
        listed.content.map(({ confirmedAt, daysSinceConfirmation, expired }) => ({
          confirmedAt,
          daysSinceConfirmation,
          expired,
        })),
      ).toEqual(
        Array.from({ length: 3 }, () => ({
          confirmedAt: now.toISOString(),
          daysSinceConfirmation: 0,
          expired: false,
        })),
      );
      expect(listed.counts).toEqual({ offers: 3, expired: 0, aboutToExpire: 0 });
      const anothersListed = await theListOf(another.id);
      expect(anothersListed.content).toEqual([
        { ...anothers, daysSinceConfirmation: 20, expired: true, aboutToExpire: false },
      ]);
      expect(await offerHistoryRows()).toEqual(historyBefore);
    });

    it('answers 0 for a Vendor with no Offers', async () => {
      const { vendor, token } = await aVendorAndAPart();

      const response = await confirmAll(vendor.id, token);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ confirmed: 0 });
    });

    it("lets the Admin confirm all of a deactivated Vendor's Offers", async () => {
      const { vendor, part } = await aVendorAndAPart();
      await anOfferConfirmedAt(vendor.id, part, aMovedMoment);
      letTheClockRun();
      const deactivation = await fetch(
        `${testApp.baseUrl}/v1/vendors/${vendor.id}/deactivate`,
        { method: 'POST', headers: bearerHeader(await adminToken()) },
      );
      expect(deactivation.status).toBe(200);
      const now = after(aMovedMoment, 15 * aDay);
      moveTheClockTo(now);

      const response = await confirmAll(vendor.id, await adminToken());

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ confirmed: 1 });
      expect((await theListOf(vendor.id)).content[0].confirmedAt).toBe(now.toISOString());
    });
  });

  describe('changing an Offer', () => {
    it('replaces the prices, the stock and the warranty, clears a warranty left out, and confirms the Offer, answering it', async () => {
      const { vendor, part } = await aVendorAndAPart();
      moveTheClockTo(aMovedMoment);
      const created = await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '349.99', inStock: true, warrantyMonths: 36 },
          await tokenOfTheOwnLogin(vendor),
        ),
      );
      const later = after(aMovedMoment, 3 * aDay + anHour);
      moveTheClockTo(later);

      const response = await editOffer(
        vendor.id,
        created.id,
        { iqdPrice: 530000, inStock: false },
        await tokenOfTheOwnLogin(vendor),
      );

      expect(response.status).toBe(200);
      const changed = (await response.json()) as OfferBody;
      expect(changed).toEqual({
        id: created.id,
        part,
        usdPrice: null,
        iqdPrice: 530000,
        inStock: false,
        warrantyMonths: null,
        confirmedAt: later.toISOString(),
        createdAt: created.createdAt,
      });
      expect(
        await readOf(await readOffer(vendor.id, created.id, await adminToken())),
      ).toEqual(changed);
    });

    it('confirms an Expired Offer saved unchanged, which is current again', async () => {
      const { vendor, part } = await aVendorAndAPart();
      const created = await anOfferConfirmedAt(vendor.id, part, aMovedMoment);
      const later = after(aMovedMoment, 20 * aDay);
      moveTheClockTo(later);
      expect((await theListOf(vendor.id)).content[0].expired).toBe(true);

      const response = await editOffer(
        vendor.id,
        created.id,
        { usdPrice: created.usdPrice, inStock: created.inStock },
        await tokenOfTheOwnLogin(vendor),
      );

      expect(response.status).toBe(200);
      const listed = await theListOf(vendor.id);
      expect(listed.content).toEqual([
        {
          ...created,
          confirmedAt: later.toISOString(),
          daysSinceConfirmation: 0,
          expired: false,
          aboutToExpire: false,
        },
      ]);
      expect(listed.counts).toEqual({ offers: 1, expired: 0, aboutToExpire: 0 });
    });

    it('refuses a detail that does not fit, naming it, and leaves the Offer as it was', async () => {
      const { vendor, part } = await aVendorAndAPart();
      const created = await anOfferConfirmedAt(vendor.id, part, aMovedMoment);
      moveTheClockTo(after(aMovedMoment, aDay));
      const ownToken = await tokenOfTheOwnLogin(vendor);

      for (const [details, field, reason] of [
        [{ inStock: true }, 'usdPrice', 'missing'],
        [{ usdPrice: '1.999', inStock: true }, 'usdPrice', 'tooManyDecimals'],
        [{ iqdPrice: 0, inStock: true }, 'iqdPrice', 'notPositive'],
        [{ usdPrice: '1.00' }, 'inStock', 'missing'],
        [
          { usdPrice: '1.00', inStock: true, warrantyMonths: 121 },
          'warrantyMonths',
          'tooLarge',
        ],
      ] as const) {
        await expectErrorResponse(
          await editOffer(vendor.id, created.id, details, ownToken),
          400,
          refused(field, reason),
        );
      }
      expect(await readOf(await readOffer(vendor.id, created.id, ownToken))).toEqual(
        created,
      );
    });

    it("refuses to change the Offer's Part", async () => {
      const { vendor, token, part } = await aVendorAndAPart();
      const another = await aPart('Made-up Ryzen 7 7700');
      const created = await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '349.99', inStock: true },
          token,
        ),
      );

      const response = await editOffer(
        vendor.id,
        created.id,
        { partId: another.id, usdPrice: '349.99', inStock: true },
        token,
      );

      expect(response.status).toBe(400);
      expect((await readOf(await readOffer(vendor.id, created.id, token))).part).toEqual(
        part,
      );
    });

    it("lets the Admin change a deactivated Vendor's Offer", async () => {
      const { vendor, part } = await aVendorAndAPart();
      const created = await anOfferConfirmedAt(vendor.id, part, aMovedMoment);
      letTheClockRun();
      const deactivation = await fetch(
        `${testApp.baseUrl}/v1/vendors/${vendor.id}/deactivate`,
        { method: 'POST', headers: bearerHeader(await adminToken()) },
      );
      expect(deactivation.status).toBe(200);

      const response = await editOffer(
        vendor.id,
        created.id,
        { usdPrice: '300', inStock: true },
        await adminToken(),
      );

      expect(response.status).toBe(200);
      expect(((await response.json()) as OfferBody).usdPrice).toBe('300.00');
    });
  });

  describe("the history of an Offer's changes", () => {
    it('records a change to a price, and a change to the stock, each once, with the time of the moved clock and the Caller, the Admin as the Admin', async () => {
      const { vendor, part } = await aVendorAndAPart();
      const vendorsLogin = await loginIdOf(vendor);
      moveTheClockTo(aMovedMoment);
      const created = await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '349.99', inStock: true, warrantyMonths: 12 },
          await tokenOfTheOwnLogin(vendor),
        ),
      );
      const [first, second, third] = [1, 2, 3].map((days) =>
        after(aMovedMoment, days * aDay),
      );
      async function changedAt(
        moment: Date,
        details: Record<string, unknown>,
        token: () => Promise<string>,
      ): Promise<void> {
        moveTheClockTo(moment);
        const response = await editOffer(vendor.id, created.id, details, await token());
        expect(response.status).toBe(200);
      }

      // The IQD price added, by the Vendor.
      await changedAt(
        first,
        { usdPrice: '349.99', iqdPrice: 525000, inStock: true, warrantyMonths: 12 },
        () => tokenOfTheOwnLogin(vendor),
      );
      // The stock alone, by the Admin acting for the Vendor.
      await changedAt(
        second,
        { usdPrice: '349.99', iqdPrice: 525000, inStock: false, warrantyMonths: 12 },
        adminToken,
      );
      // The USD price, which the Vendor no longer quotes, by the Vendor.
      await changedAt(third, { iqdPrice: 525000, inStock: false, warrantyMonths: 12 }, () =>
        tokenOfTheOwnLogin(vendor),
      );

      const ofTheOffer = { vendorId: vendor.id, partId: part.id };
      expect(await offerHistoryRows()).toEqual([
        {
          ...ofTheOffer,
          changedAt: aMovedMoment,
          change: 'created',
          usdPriceCents: 34999,
          iqdPrice: null,
          inStock: true,
          changedBy: vendorsLogin,
        },
        {
          ...ofTheOffer,
          changedAt: first,
          change: 'changed',
          usdPriceCents: 34999,
          iqdPrice: 525000,
          inStock: true,
          changedBy: vendorsLogin,
        },
        {
          ...ofTheOffer,
          changedAt: second,
          change: 'changed',
          usdPriceCents: 34999,
          iqdPrice: 525000,
          inStock: false,
          changedBy: adminLoginId,
        },
        {
          ...ofTheOffer,
          changedAt: third,
          change: 'changed',
          usdPriceCents: null,
          iqdPrice: 525000,
          inStock: false,
          changedBy: vendorsLogin,
        },
      ]);
    });

    it('records nothing for a save that changes nothing, for one that changes the warranty alone, or for one refused', async () => {
      const { vendor, token, part } = await aVendorAndAPart();
      const created = await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '349.99', iqdPrice: 525000, inStock: true },
          token,
        ),
      );
      const historyBefore = await offerHistoryRows();

      for (const details of [
        { usdPrice: '349.99', iqdPrice: 525000, inStock: true },
        // The same price, written with a leading zero.
        { usdPrice: '0349.99', iqdPrice: 525000, inStock: true },
        { usdPrice: '349.99', iqdPrice: 525000, inStock: true, warrantyMonths: 24 },
        { usdPrice: '349.99', iqdPrice: 525000, inStock: true, warrantyMonths: null },
      ]) {
        expect((await editOffer(vendor.id, created.id, details, token)).status).toBe(200);
      }
      expect(
        (
          await editOffer(
            vendor.id,
            created.id,
            { usdPrice: '0', iqdPrice: 1, inStock: false },
            token,
          )
        ).status,
      ).toBe(400);

      expect(await offerHistoryRows()).toEqual(historyBefore);
    });
  });

  describe('removing an Offer', () => {
    it("answers 204, after which the Offer is 404 for its Vendor and gone from the Vendor's list", async () => {
      const { vendor, token, part } = await aVendorAndAPart();
      const kept = await aPart('Made-up Ryzen 7 7700');
      const removed = await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, usdPrice: '349.99', inStock: true },
          token,
        ),
      );
      await createdOf(
        await createOffer(
          vendor.id,
          { partId: kept.id, usdPrice: '449.99', inStock: true },
          token,
        ),
      );

      const response = await removeOffer(vendor.id, removed.id, token);

      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');
      await expectErrorResponse(
        await readOffer(vendor.id, removed.id, token),
        404,
        offerNotFound,
      );
      await expectErrorResponse(
        await removeOffer(vendor.id, removed.id, token),
        404,
        offerNotFound,
      );
      await expectErrorResponse(
        await editOffer(vendor.id, removed.id, { usdPrice: '1.00', inStock: true }, token),
        404,
        offerNotFound,
      );
      const listed = await theListOf(vendor.id);
      expect(listed.content.map(({ part }) => part.id)).toEqual([kept.id]);
      expect(listed.counts.offers).toBe(1);
    });

    it('records the removal after the earlier rows, which stay, and lets the Vendor offer the Part again, whose next row follows them', async () => {
      const { vendor, part } = await aVendorAndAPart();
      const vendorsLogin = await loginIdOf(vendor);
      const [changed, removedAt, offeredAgain] = [1, 2, 3].map((days) =>
        after(aMovedMoment, days * aDay),
      );
      const created = await anOfferConfirmedAt(vendor.id, part, aMovedMoment);
      moveTheClockTo(changed);
      expect(
        (
          await editOffer(
            vendor.id,
            created.id,
            { usdPrice: '329.99', inStock: false },
            await tokenOfTheOwnLogin(vendor),
          )
        ).status,
      ).toBe(200);
      moveTheClockTo(removedAt);
      expect(
        (await removeOffer(vendor.id, created.id, await tokenOfTheOwnLogin(vendor))).status,
      ).toBe(204);

      moveTheClockTo(offeredAgain);
      const again = await createdOf(
        await createOffer(
          vendor.id,
          { partId: part.id, iqdPrice: 500000, inStock: true },
          await tokenOfTheOwnLogin(vendor),
        ),
      );

      expect(again.id).not.toBe(created.id);
      const ofTheOffer = { vendorId: vendor.id, partId: part.id };
      expect(await offerHistoryRows()).toEqual([
        {
          ...ofTheOffer,
          changedAt: aMovedMoment,
          change: 'created',
          usdPriceCents: 34999,
          iqdPrice: null,
          inStock: true,
          changedBy: adminLoginId,
        },
        {
          ...ofTheOffer,
          changedAt: changed,
          change: 'changed',
          usdPriceCents: 32999,
          iqdPrice: null,
          inStock: false,
          changedBy: vendorsLogin,
        },
        {
          ...ofTheOffer,
          changedAt: removedAt,
          change: 'removed',
          usdPriceCents: 32999,
          iqdPrice: null,
          inStock: false,
          changedBy: vendorsLogin,
        },
        {
          ...ofTheOffer,
          changedAt: offeredAgain,
          change: 'created',
          usdPriceCents: null,
          iqdPrice: 500000,
          inStock: true,
          changedBy: vendorsLogin,
        },
      ]);
    });

    it("lets the Admin remove a deactivated Vendor's Offer, recorded as the Admin", async () => {
      const { vendor, part } = await aVendorAndAPart();
      const created = await anOfferConfirmedAt(vendor.id, part, aMovedMoment);
      letTheClockRun();
      const deactivation = await fetch(
        `${testApp.baseUrl}/v1/vendors/${vendor.id}/deactivate`,
        { method: 'POST', headers: bearerHeader(await adminToken()) },
      );
      expect(deactivation.status).toBe(200);
      const removedAt = after(aMovedMoment, aDay);
      moveTheClockTo(removedAt);

      expect((await removeOffer(vendor.id, created.id, await adminToken())).status).toBe(
        204,
      );

      const rows = await offerHistoryRows();
      expect(
        rows.map(({ change, changedAt, changedBy }) => ({ change, changedAt, changedBy })),
      ).toEqual([
        { change: 'created', changedAt: aMovedMoment, changedBy: adminLoginId },
        { change: 'removed', changedAt: removedAt, changedBy: adminLoginId },
      ]);
    });
  });
});
