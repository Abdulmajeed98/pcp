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

// Adding an Offer and reading it back (OFF-1, OFF-2, OFF-3, OFF-5, OFF-10).

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
  async function aPart(name = 'Made-up Ryzen 5 7600'): Promise<OfferedPartBody> {
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
    const { id, category, manufacturer, partNumbers, photoPath } =
      (await response.json()) as OfferedPartBody;
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

  describe('who may add and read an Offer', () => {
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
      }
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
});
