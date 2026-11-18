import { randomUUID } from 'node:crypto';

import {
  accessDenied,
  bearerHeader,
  expectErrorResponse,
  type ExpectedErrorResponse,
  notValid,
  unauthorized,
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

// Sending a Part Request, by a Vendor's own Login or the Admin acting for
// any Vendor (REQ-1, ACC-6), the Vendor's list of its own in every state
// (REQ-4), the Admin's queue of open ones (REQ-2), and reading one. The
// fulfilment and the rejection are in the file beside this one.

// A Part as a fulfilled Part Request answers it.
type PartBody = {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  partNumbers: string[];
  photoPath: string | null;
};

// A Part Request as the API answers it.
type PartRequestBody = {
  id: string;
  category: string;
  name: string;
  partNumber: string;
  usdPrice: string | null;
  iqdPrice: number | null;
  inStock: boolean;
  warrantyMonths: number | null;
  sentAt: string;
  sentOn: string;
  daysSinceSent: number;
  state: 'open' | 'fulfilled' | 'rejected';
  offerWouldBeExpired: boolean;
  part?: PartBody;
  offerId?: string | null;
  reason?: string;
  resolvedAt?: string;
};

// The Vendor that sent it, as the Admin reads it.
type SendingVendorBody = { id: string; name: string; active: boolean };

// A Part Request as the Admin reads it, with its Vendor.
type PartRequestWithVendorBody = PartRequestBody & { vendor: SendingVendorBody };

// One page of a list.
type PageBody<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

// A Vendor as the API answers its creation, as far as these tests read it.
type VendorBody = { id: string; name: string; loginPhoneNumber: { international: string } };

// A made-up Vendor, with the identifier of its own Login.
type MadeUpVendor = VendorBody & { loginId: string };

// The refusals these tests expect, each as a whole.
function refusal(code: string): ExpectedErrorResponse[] {
  const key = code.toLowerCase();
  return [{ code, title: `${key}_title`, detail: `${key}_details` }];
}
const partRequestNotFound = refusal('PART_REQUEST_NOT_FOUND');
const vendorNotFound = refusal('VENDOR_NOT_FOUND');
const vendorAccessDenied = refusal('VENDOR_ACCESS_DENIED');
const vendorDeactivated = refusal('VENDOR_DEACTIVATED');

// A refusal of one detail, naming its field and why.
function refused(field: string, reason: string): ExpectedErrorResponse[] {
  return [notValid(field, { reason })];
}

const adminLoginId = randomUUID();

// A moment for the API's clock, with milliseconds, so that a time stored
// with less precision would show. In Iraq, three hours ahead of UTC, it is
// 12:26 on 14 March 2027.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');

// An hour and a day of 24 hours, and a moment some time after another.
const anHour = 60 * 60 * 1000;
const aDay = 24 * anHour;
function after(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() + milliseconds);
}

// A Part Request's details, as the Vendor's form sends them.
const aRequest = {
  category: 'gpu',
  name: 'Made-up Pulse Radeon RX 9070 XT 16GB',
  partNumber: '11348-03-20G',
  usdPrice: '649.5',
  iqdPrice: 950000,
  inStock: true,
  warrantyMonths: 24,
};

// The same, as the API answers them, sent at a moment and read then.
function asSentAt(moment: Date) {
  return {
    category: 'gpu',
    name: 'Made-up Pulse Radeon RX 9070 XT 16GB',
    partNumber: '11348-03-20G',
    usdPrice: '649.50',
    iqdPrice: 950000,
    inStock: true,
    warrantyMonths: 24,
    sentAt: moment.toISOString(),
    sentOn: '2027-03-14',
    daysSinceSent: 0,
    state: 'open',
    offerWouldBeExpired: false,
  };
}

describe('Part Requests', () => {
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

  // Made-up Vendors are numbered, so that each has a login phone number of
  // its own.
  let vendors = 0;

  // A made-up Vendor the Admin creates, with a Login of its own. It calls
  // Keycloak, so it runs with the clock running.
  async function aVendor(name = 'Made-up Computer Corner'): Promise<MadeUpVendor> {
    vendors += 1;
    const response = await fetch(`${testApp.baseUrl}/v1/vendors`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        city: 'erbil',
        address: 'Made-up Street, Erbil',
        phoneNumber: '066 223 4567',
        loginPhoneNumber: `0750 300 ${String(1000 + vendors)}`,
      }),
    });
    expect(response.status).toBe(201);
    const { vendor } = (await response.json()) as { vendor: VendorBody };
    const [login] = await loginsNamed(vendor.loginPhoneNumber.international);
    return { ...vendor, loginId: login.id };
  }

  // A token of the Vendor's own Login, as Keycloak issues it: its subject is
  // the Login's identifier. Made when it is needed, so that it is judged by
  // the clock that is current then.
  function tokenOfTheOwnLogin(vendor: MadeUpVendor): Promise<string> {
    return testApp.tokenOf({
      subject: vendor.loginId,
      loginName: vendor.loginPhoneNumber.international,
      roles: ['vendor'],
    });
  }

  // The Admin deactivates a Vendor, which calls Keycloak, so it runs with the
  // clock running.
  async function deactivate(vendorId: string): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/deactivate`, {
      method: 'POST',
      headers: bearerHeader(await adminToken()),
    });
    expect(response.status).toBe(200);
  }

  // A made-up Part the Admin adds to the catalog.
  async function aPart(name = 'Made-up Radeon RX 9070 XT'): Promise<PartBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'gpu',
        name,
        manufacturer: 'Made-up Graphics',
        partNumbers: ['11348-03-20G'],
      }),
    });
    expect(response.status).toBe(201);
    // As a Part Request answers it, the catalog's summary of a Part.
    const {
      id,
      category: kept,
      manufacturer,
      partNumbers,
      photoPath,
    } = (await response.json()) as PartBody;
    return { id, category: kept, name, manufacturer, partNumbers, photoPath };
  }

  function sendPartRequest(
    vendorId: string,
    body: unknown,
    token: string | null,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/part-requests`, {
      method: 'POST',
      headers: {
        ...(token === null ? {} : bearerHeader(token)),
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  // A Part Request the Admin sends for the Vendor at the time of the clock,
  // with the details given over the made-up ones.
  async function aPartRequest(
    vendorId: string,
    details: Record<string, unknown> = {},
  ): Promise<PartRequestBody> {
    const response = await sendPartRequest(
      vendorId,
      { ...aRequest, ...details },
      await adminToken(),
    );
    expect(response.status).toBe(201);
    return (await response.json()) as PartRequestBody;
  }

  function listVendorsPartRequests(
    vendorId: string,
    query: Record<string, string>,
    token: string | null,
  ): Promise<Response> {
    return fetch(
      `${testApp.baseUrl}/v1/vendors/${vendorId}/part-requests?${new URLSearchParams(query).toString()}`,
      { headers: token === null ? {} : bearerHeader(token) },
    );
  }

  // One page of the Vendor's Part Requests, as the Admin reads it at the
  // time of the clock.
  async function theVendorsList(
    vendorId: string,
    query: Record<string, string> = { size: '100' },
  ): Promise<PageBody<PartRequestBody>> {
    const response = await listVendorsPartRequests(vendorId, query, await adminToken());
    expect(response.status).toBe(200);
    return (await response.json()) as PageBody<PartRequestBody>;
  }

  function listOpenPartRequests(
    query: Record<string, string>,
    token: string | null,
  ): Promise<Response> {
    return fetch(
      `${testApp.baseUrl}/v1/part-requests?${new URLSearchParams(query).toString()}`,
      { headers: token === null ? {} : bearerHeader(token) },
    );
  }

  // One page of the Admin's queue, read at the time of the clock.
  async function theQueue(
    query: Record<string, string> = { size: '100' },
  ): Promise<PageBody<PartRequestWithVendorBody>> {
    const response = await listOpenPartRequests(query, await adminToken());
    expect(response.status).toBe(200);
    return (await response.json()) as PageBody<PartRequestWithVendorBody>;
  }

  function readPartRequest(partRequestId: string, token: string | null): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/part-requests/${partRequestId}`, {
      headers: token === null ? {} : bearerHeader(token),
    });
  }

  // One Part Request, as the Admin reads it at the time of the clock.
  async function thePartRequest(partRequestId: string): Promise<PartRequestWithVendorBody> {
    const response = await readPartRequest(partRequestId, await adminToken());
    expect(response.status).toBe(200);
    return (await response.json()) as PartRequestWithVendorBody;
  }

  // The Admin resolves a Part Request, fulfilling it with a Part or
  // rejecting it with a reason, at the time of the clock.
  async function fulfil(partRequestId: string, partId: string): Promise<void> {
    const response = await fetch(
      `${testApp.baseUrl}/v1/part-requests/${partRequestId}/fulfil`,
      {
        method: 'POST',
        headers: {
          ...bearerHeader(await adminToken()),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ partId }),
      },
    );
    expect(response.status).toBe(200);
  }
  async function reject(partRequestId: string, reason: string): Promise<void> {
    const response = await fetch(
      `${testApp.baseUrl}/v1/part-requests/${partRequestId}/reject`,
      {
        method: 'POST',
        headers: {
          ...bearerHeader(await adminToken()),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      },
    );
    expect(response.status).toBe(200);
  }

  describe('sending a Part Request', () => {
    it("answers 201 to the Vendor's own Login with every detail, open, sent at the moment of the API's clock, and nothing of a resolution", async () => {
      const vendor = await aVendor();
      moveTheClockTo(aMovedMoment);
      const response = await sendPartRequest(
        vendor.id,
        aRequest,
        await tokenOfTheOwnLogin(vendor),
      );

      expect(response.status).toBe(201);
      const body = (await response.json()) as PartRequestBody;
      expect(body).toEqual({ id: expect.any(String) as string, ...asSentAt(aMovedMoment) });
      expect((await theVendorsList(vendor.id)).content).toEqual([body]);
    });

    it('takes a price in one currency alone, out of stock, with no warranty, as an Offer does', async () => {
      const vendor = await aVendor();

      expect(
        await aPartRequest(vendor.id, {
          usdPrice: null,
          iqdPrice: 1_875_000,
          inStock: false,
          warrantyMonths: undefined,
        }),
      ).toMatchObject({
        usdPrice: null,
        iqdPrice: 1_875_000,
        inStock: false,
        warrantyMonths: null,
      });
      expect(
        await aPartRequest(vendor.id, { usdPrice: '350', iqdPrice: undefined }),
      ).toMatchObject({ usdPrice: '350.00', iqdPrice: null });
    });

    it('lets the Admin send one for any Vendor, a Deactivated Vendor among them, which that Vendor lists', async () => {
      const vendor = await aVendor();
      const gone = await aVendor('Made-up Gone Corner');
      await deactivate(gone.id);

      const forVendor = await aPartRequest(vendor.id);
      const forGone = await aPartRequest(gone.id, { name: 'Made-up Arc B580' });

      expect((await theVendorsList(vendor.id)).content).toEqual([forVendor]);
      expect((await theVendorsList(gone.id)).content).toEqual([forGone]);
    });

    it('keeps the name as written, and the part number without its invisible marks and the space around it, as the catalog cleans one', async () => {
      const vendor = await aVendor();

      expect(
        await aPartRequest(vendor.id, {
          name: '  Made-up  Pulse ‎RX 9070 XT  ',
          partNumber: ' ‎11348-03-20G​  ',
        }),
      ).toMatchObject({
        name: '  Made-up  Pulse ‎RX 9070 XT  ',
        partNumber: '11348-03-20G',
      });
    });

    it('takes a name of 300 characters and a part number of 100, counted as Unicode code points', async () => {
      const vendor = await aVendor();
      const name = 'پ'.repeat(150) + '😀'.repeat(150);
      const partNumber = '😀'.repeat(100);

      expect(await aPartRequest(vendor.id, { name, partNumber })).toMatchObject({
        name,
        partNumber,
      });
    });

    it.each<[string, Record<string, unknown>, string, string]>([
      ['no Category', { category: undefined }, 'category', 'missing'],
      ['an empty Category', { category: '' }, 'category', 'missing'],
      [
        'a Category not among the eight',
        { category: 'monitor' },
        'category',
        'notInTheSet',
      ],
      ['a Category in capitals', { category: 'GPU' }, 'category', 'notInTheSet'],
      ['no name', { name: undefined }, 'name', 'missing'],
      ['a name of spaces and line breaks', { name: '  \n ' }, 'name', 'missing'],
      ['a name of 301 characters', { name: '😀'.repeat(301) }, 'name', 'tooLong'],
      ['no part number', { partNumber: null }, 'partNumber', 'missing'],
      [
        'a part number of invisible marks and spaces',
        { partNumber: ' ‎​ ' },
        'partNumber',
        'missing',
      ],
      [
        'a part number of 101 characters',
        { partNumber: 'A'.repeat(101) },
        'partNumber',
        'tooLong',
      ],
      [
        'no price at all',
        { usdPrice: undefined, iqdPrice: undefined },
        'usdPrice',
        'missing',
      ],
      ['a USD price of zero', { usdPrice: '0.00' }, 'usdPrice', 'notPositive'],
      [
        'three decimal places in USD',
        { usdPrice: '649.999' },
        'usdPrice',
        'tooManyDecimals',
      ],
      ['an IQD price over 150,000,000', { iqdPrice: 150000001 }, 'iqdPrice', 'tooLarge'],
      ['no in stock', { inStock: undefined }, 'inStock', 'missing'],
      ['a warranty of 121 months', { warrantyMonths: 121 }, 'warrantyMonths', 'tooLarge'],
    ])(
      'refuses %s, naming the field and the reason',
      async (_what, details, field, reason) => {
        const vendor = await aVendor();

        await expectErrorResponse(
          await sendPartRequest(vendor.id, { ...aRequest, ...details }, await adminToken()),
          400,
          refused(field, reason),
        );
        expect((await theVendorsList(vendor.id)).totalElements).toBe(0);
      },
    );

    it("names the first detail that does not fit, in the form's order: the Category, the name, the part number, then the Offer's details", async () => {
      const vendor = await aVendor();
      const token = await tokenOfTheOwnLogin(vendor);
      const everyDetailWrong = {
        category: 'monitor',
        name: ' ',
        partNumber: '',
        usdPrice: '0',
        inStock: true,
      };

      await expectErrorResponse(
        await sendPartRequest(vendor.id, everyDetailWrong, token),
        400,
        refused('category', 'notInTheSet'),
      );
      await expectErrorResponse(
        await sendPartRequest(vendor.id, { ...everyDetailWrong, category: 'cpu' }, token),
        400,
        refused('name', 'missing'),
      );
      await expectErrorResponse(
        await sendPartRequest(
          vendor.id,
          { ...everyDetailWrong, category: 'cpu', name: 'Made-up Ryzen' },
          token,
        ),
        400,
        refused('partNumber', 'missing'),
      );
      await expectErrorResponse(
        await sendPartRequest(
          vendor.id,
          { ...everyDetailWrong, category: 'cpu', name: 'Made-up Ryzen', partNumber: 'R1' },
          token,
        ),
        400,
        refused('usdPrice', 'notPositive'),
      );
    });

    it('refuses a manufacturer, a specification or any field the request does not take, naming it, and a detail of the wrong kind, naming it', async () => {
      const vendor = await aVendor();
      const token = await adminToken();

      await expectErrorResponse(
        await sendPartRequest(vendor.id, { ...aRequest, manufacturer: 'Sapphire' }, token),
        400,
        [notValid('manufacturer')],
      );
      await expectErrorResponse(
        await sendPartRequest(vendor.id, { ...aRequest, specifications: {} }, token),
        400,
        [notValid('specifications')],
      );
      await expectErrorResponse(
        await sendPartRequest(vendor.id, { ...aRequest, partNumber: 11348 }, token),
        400,
        [notValid('partNumber')],
      );
      expect((await theVendorsList(vendor.id)).totalElements).toBe(0);
    });

    it("refuses a Vendor's token at another Vendor's address 403 with VENDOR_ACCESS_DENIED, whether that Vendor exists or not", async () => {
      const vendor = await aVendor();
      const other = await aVendor('Made-up Computer House');
      const token = await tokenOfTheOwnLogin(vendor);

      await expectErrorResponse(
        await sendPartRequest(other.id, aRequest, token),
        403,
        vendorAccessDenied,
      );
      await expectErrorResponse(
        await sendPartRequest(randomUUID(), aRequest, token),
        403,
        vendorAccessDenied,
      );
      // Before any detail is looked at.
      await expectErrorResponse(
        await sendPartRequest(other.id, { ...aRequest, category: 'monitor' }, token),
        403,
        vendorAccessDenied,
      );
      expect((await theVendorsList(other.id)).totalElements).toBe(0);
    });

    it("refuses a Deactivated Vendor's own Login 403 with VENDOR_DEACTIVATED, no token 401, and an unknown Vendor 404 with VENDOR_NOT_FOUND for the Admin", async () => {
      const vendor = await aVendor();
      const token = await tokenOfTheOwnLogin(vendor);
      await deactivate(vendor.id);

      await expectErrorResponse(
        await sendPartRequest(vendor.id, aRequest, token),
        403,
        vendorDeactivated,
      );
      await expectErrorResponse(
        await sendPartRequest(vendor.id, aRequest, null),
        401,
        unauthorized,
      );
      await expectErrorResponse(
        await sendPartRequest(randomUUID(), aRequest, await adminToken()),
        404,
        vendorNotFound,
      );
      await expectErrorResponse(
        await sendPartRequest('not-a-vendor', aRequest, await adminToken()),
        404,
        vendorNotFound,
      );
      expect((await theVendorsList(vendor.id)).totalElements).toBe(0);
    });
  });

  describe("a Vendor's list of its Part Requests", () => {
    it("holds its own in every state, newest first, then by identifier on requests sent at the same moment, and no other Vendor's", async () => {
      const vendor = await aVendor();
      const other = await aVendor('Made-up Computer House');
      const part = await aPart();
      moveTheClockTo(aMovedMoment);
      const oldest = await aPartRequest(vendor.id, { name: 'Made-up Oldest' });
      moveTheClockTo(after(aMovedMoment, anHour));
      const twinA = await aPartRequest(vendor.id, { name: 'Made-up Twin' });
      const twinB = await aPartRequest(vendor.id, { name: 'Made-up Twin' });
      await aPartRequest(other.id, { name: 'Made-up Not Its Own' });
      moveTheClockTo(after(aMovedMoment, 2 * anHour));
      const newest = await aPartRequest(vendor.id, { name: 'Made-up Newest' });
      await fulfil(oldest.id, part.id);
      await reject(newest.id, 'Made-up reason');
      const [lowerTwin, higherTwin] = [twinA.id, twinB.id].sort();

      const list = await theVendorsList(vendor.id);

      expect(list.content.map(({ id, state }) => ({ id, state }))).toEqual([
        { id: newest.id, state: 'rejected' },
        { id: lowerTwin, state: 'open' },
        { id: higherTwin, state: 'open' },
        { id: oldest.id, state: 'fulfilled' },
      ]);
      expect(list).toMatchObject({
        totalElements: 4,
        totalPages: 1,
        first: true,
        last: true,
      });
    });

    it('answers a fulfilled request with its Part, the Offer and the moment, and a rejected one with its reason and the moment', async () => {
      const vendor = await aVendor();
      const part = await aPart();
      moveTheClockTo(aMovedMoment);
      const fulfilled = await aPartRequest(vendor.id);
      moveTheClockTo(after(aMovedMoment, anHour));
      const rejected = await aPartRequest(vendor.id, { name: 'Made-up Rejected' });
      moveTheClockTo(after(aMovedMoment, 2 * anHour));
      await fulfil(fulfilled.id, part.id);
      await reject(rejected.id, 'ئەم پارچەیە پێشتر هەیە.');

      const { content } = await theVendorsList(vendor.id);

      const resolvedAt = after(aMovedMoment, 2 * anHour).toISOString();
      expect(content).toEqual([
        { ...rejected, state: 'rejected', reason: 'ئەم پارچەیە پێشتر هەیە.', resolvedAt },
        {
          ...fulfilled,
          state: 'fulfilled',
          part,
          offerId: expect.any(String) as string,
          resolvedAt,
        },
      ]);
    });

    it('pages through the catalog paging: 10 a page unless asked, the pages in order with no request twice, and a page past the end empty with the total', async () => {
      const vendor = await aVendor();
      for (let number = 1; number <= 5; number += 1) {
        await aPartRequest(vendor.id, { name: `Made-up Part ${String(number)}` });
      }

      const whole = (await theVendorsList(vendor.id)).content.map(({ id }) => id);
      expect(whole).toHaveLength(5);
      const pages = [
        await theVendorsList(vendor.id, { page: '0', size: '2' }),
        await theVendorsList(vendor.id, { page: '1', size: '2' }),
        await theVendorsList(vendor.id, { page: '2', size: '2' }),
      ];
      expect(pages.flatMap(({ content }) => content.map(({ id }) => id))).toEqual(whole);
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
      expect(await theVendorsList(vendor.id, { page: '7', size: '2' })).toMatchObject({
        content: [],
        totalElements: 5,
        last: true,
      });
      expect((await theVendorsList(vendor.id, {})).pageSize).toBe(10);
      await expectErrorResponse(
        await listVendorsPartRequests(vendor.id, { size: '101' }, await adminToken()),
        400,
        [notValid('size')],
      );
    });

    it("is read by the Vendor's own Login, and refuses another Vendor's to it 403 with VENDOR_ACCESS_DENIED, whether that Vendor exists or not", async () => {
      const vendor = await aVendor();
      const other = await aVendor('Made-up Computer House');
      const sent = await aPartRequest(vendor.id);
      const token = await tokenOfTheOwnLogin(vendor);

      const own = await listVendorsPartRequests(vendor.id, {}, token);
      expect(own.status).toBe(200);
      expect(((await own.json()) as PageBody<PartRequestBody>).content).toEqual([sent]);
      await expectErrorResponse(
        await listVendorsPartRequests(other.id, {}, token),
        403,
        vendorAccessDenied,
      );
      await expectErrorResponse(
        await listVendorsPartRequests(randomUUID(), {}, token),
        403,
        vendorAccessDenied,
      );
    });

    it("refuses a Deactivated Vendor's own Login 403 with VENDOR_DEACTIVATED, while the Admin still reads it; no token 401; and an unknown Vendor 404 for the Admin", async () => {
      const vendor = await aVendor();
      const sent = await aPartRequest(vendor.id);
      const token = await tokenOfTheOwnLogin(vendor);
      await deactivate(vendor.id);

      await expectErrorResponse(
        await listVendorsPartRequests(vendor.id, {}, token),
        403,
        vendorDeactivated,
      );
      expect((await theVendorsList(vendor.id)).content).toEqual([sent]);
      await expectErrorResponse(
        await listVendorsPartRequests(vendor.id, {}, null),
        401,
        unauthorized,
      );
      await expectErrorResponse(
        await listVendorsPartRequests(randomUUID(), {}, await adminToken()),
        404,
        vendorNotFound,
      );
    });
  });

  describe("the Admin's queue of open Part Requests", () => {
    it('holds the open requests of every Vendor, active and deactivated, oldest first, then by identifier on requests sent at the same moment, each with its Vendor; a fulfilled or rejected request leaves it', async () => {
      const vendor = await aVendor('Made-up Computer Corner');
      const gone = await aVendor('Made-up Gone Corner');
      const part = await aPart();
      moveTheClockTo(aMovedMoment);
      const oldest = await aPartRequest(gone.id, { name: 'Made-up Oldest' });
      const toFulfil = await aPartRequest(vendor.id, { name: 'Made-up Fulfilled' });
      moveTheClockTo(after(aMovedMoment, anHour));
      const twinA = await aPartRequest(vendor.id, { name: 'Made-up Twin' });
      const twinB = await aPartRequest(gone.id, { name: 'Made-up Twin' });
      const toReject = await aPartRequest(vendor.id, { name: 'Made-up Rejected' });
      moveTheClockTo(after(aMovedMoment, 2 * anHour));
      const newest = await aPartRequest(vendor.id, { name: 'Made-up Newest' });
      await fulfil(toFulfil.id, part.id);
      await reject(toReject.id, 'Made-up reason');
      letTheClockRun();
      await deactivate(gone.id);
      moveTheClockTo(after(aMovedMoment, 2 * anHour));
      const [lowerTwin, higherTwin] = [twinA, twinB].sort((a, b) =>
        a.id.localeCompare(b.id),
      );
      const activeVendor = { id: vendor.id, name: 'Made-up Computer Corner', active: true };
      const deactivatedVendor = { id: gone.id, name: 'Made-up Gone Corner', active: false };
      const vendorOf = (request: PartRequestBody) =>
        request === twinA || request === newest ? activeVendor : deactivatedVendor;

      const queue = await theQueue();

      expect(queue.content).toEqual([
        { ...oldest, daysSinceSent: 0, vendor: deactivatedVendor },
        { ...lowerTwin, vendor: vendorOf(lowerTwin) },
        { ...higherTwin, vendor: vendorOf(higherTwin) },
        { ...newest, vendor: activeVendor },
      ]);
      expect(queue).toMatchObject({ totalElements: 4, totalPages: 1 });
    });

    it('pages through the catalog paging, 10 a page unless asked, and a page past the end empty with the total', async () => {
      const vendor = await aVendor();
      for (let number = 1; number <= 3; number += 1) {
        await aPartRequest(vendor.id, { name: `Made-up Part ${String(number)}` });
      }

      const whole = (await theQueue()).content.map(({ id }) => id);
      const pages = [
        await theQueue({ page: '0', size: '2' }),
        await theQueue({ page: '1', size: '2' }),
      ];
      expect(pages.flatMap(({ content }) => content.map(({ id }) => id))).toEqual(whole);
      expect(
        pages.map(({ totalElements, totalPages, last }) => ({
          totalElements,
          totalPages,
          last,
        })),
      ).toEqual([
        { totalElements: 3, totalPages: 2, last: false },
        { totalElements: 3, totalPages: 2, last: true },
      ]);
      expect(await theQueue({ page: '5', size: '2' })).toMatchObject({
        content: [],
        totalElements: 3,
      });
      expect((await theQueue({})).pageSize).toBe(10);
    });

    it("is the Admin's alone: a Vendor's own Login is refused 403 with ACCESS_DENIED, and no token 401", async () => {
      const vendor = await aVendor();

      await expectErrorResponse(
        await listOpenPartRequests({}, await tokenOfTheOwnLogin(vendor)),
        403,
        accessDenied,
      );
      await expectErrorResponse(await listOpenPartRequests({}, null), 401, unauthorized);
    });
  });

  describe("when it was sent, by the API's clock", () => {
    // Iraq is three hours ahead of UTC all year, so 20:00 in UTC is 23:00
    // in Iraq, and 21:30 in UTC 00:30 the next day there.
    async function sentAndReadAt(sentAt: string, readAt: string) {
      const vendor = await aVendor();
      moveTheClockTo(new Date(sentAt));
      const sent = await aPartRequest(vendor.id);
      moveTheClockTo(new Date(readAt));
      return { sent, read: await thePartRequest(sent.id) };
    }

    it('is 1 day for a request sent at 23:00 and read at 08:00 the next morning, its day the one it was sent on, in the queue and the list alike', async () => {
      const { sent, read } = await sentAndReadAt(
        '2026-11-16T20:00:00.000Z',
        '2026-11-17T05:00:00.000Z',
      );

      expect(read).toMatchObject({
        sentAt: '2026-11-16T20:00:00.000Z',
        sentOn: '2026-11-16',
        daysSinceSent: 1,
      });
      expect((await theQueue()).content[0]).toMatchObject({ daysSinceSent: 1 });
      expect((await theVendorsList(read.vendor.id)).content).toEqual([
        { ...sent, daysSinceSent: 1 },
      ]);
    });

    it("is 0 days for a request sent at 00:30 and read at 23:30 the same day, its day Iraq's, not UTC's", async () => {
      const { read } = await sentAndReadAt(
        '2026-11-15T21:30:00.000Z',
        '2026-11-16T20:30:00.000Z',
      );

      expect(read).toMatchObject({ sentOn: '2026-11-16', daysSinceSent: 0 });
    });

    it('turns its Offer to one that would be expired one millisecond past 14 days, by the expiry rule', async () => {
      const vendor = await aVendor();
      moveTheClockTo(aMovedMoment);
      const sent = await aPartRequest(vendor.id);

      moveTheClockTo(after(aMovedMoment, 14 * aDay));
      expect(await thePartRequest(sent.id)).toMatchObject({
        daysSinceSent: 14,
        offerWouldBeExpired: false,
      });
      expect((await theQueue()).content[0]).toMatchObject({ offerWouldBeExpired: false });

      moveTheClockTo(after(aMovedMoment, 14 * aDay + 1));
      expect(await thePartRequest(sent.id)).toMatchObject({ offerWouldBeExpired: true });
      expect((await theQueue()).content[0]).toMatchObject({ offerWouldBeExpired: true });
      expect((await theVendorsList(vendor.id)).content[0]).toMatchObject({
        offerWouldBeExpired: true,
      });
    });
  });

  describe('reading one Part Request', () => {
    it('answers it in every state with its Vendor, as the lists do', async () => {
      const vendor = await aVendor();
      const part = await aPart();
      moveTheClockTo(aMovedMoment);
      const open = await aPartRequest(vendor.id);
      const fulfilled = await aPartRequest(vendor.id, { name: 'Made-up Fulfilled' });
      const rejected = await aPartRequest(vendor.id, { name: 'Made-up Rejected' });
      await fulfil(fulfilled.id, part.id);
      await reject(rejected.id, 'Made-up reason, as written ');
      const sendingVendor = {
        id: vendor.id,
        name: 'Made-up Computer Corner',
        active: true,
      };
      const listed = (await theVendorsList(vendor.id)).content;

      expect(await thePartRequest(open.id)).toEqual({ ...open, vendor: sendingVendor });
      expect(await thePartRequest(fulfilled.id)).toEqual({
        ...listed.find(({ id }) => id === fulfilled.id),
        vendor: sendingVendor,
      });
      expect(await thePartRequest(rejected.id)).toEqual({
        ...rejected,
        state: 'rejected',
        reason: 'Made-up reason, as written ',
        resolvedAt: aMovedMoment.toISOString(),
        vendor: sendingVendor,
      });
    });

    it('answers an identifier that names no Part Request, and a text that is not an identifier, 404 with PART_REQUEST_NOT_FOUND', async () => {
      const vendor = await aVendor();
      const sent = await aPartRequest(vendor.id);
      const token = await adminToken();

      for (const id of [
        randomUUID(),
        'not-a-part-request',
        `${sent.id}0`,
        sent.id.slice(1),
      ]) {
        await expectErrorResponse(
          await readPartRequest(id, token),
          404,
          partRequestNotFound,
        );
      }
    });

    it("is the Admin's alone: a Vendor's own Login is refused 403 with ACCESS_DENIED, even for its own request, and no token 401", async () => {
      const vendor = await aVendor();
      const sent = await aPartRequest(vendor.id);

      await expectErrorResponse(
        await readPartRequest(sent.id, await tokenOfTheOwnLogin(vendor)),
        403,
        accessDenied,
      );
      await expectErrorResponse(await readPartRequest(sent.id, null), 401, unauthorized);
    });
  });
});
