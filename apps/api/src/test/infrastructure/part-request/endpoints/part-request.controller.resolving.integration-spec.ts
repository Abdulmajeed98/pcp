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
import {
  emptyTheDatabase,
  offerHistoryRows,
  sentWhileThePartRequestIsHeld,
} from '../../../test-utils/database/test-database';
import {
  emptyTheRealm,
  loginsNamed,
} from '../../../test-utils/keycloak/keycloak-administrator';

// The Admin resolving a Part Request (REQ-2): fulfilling it with a Part,
// which makes, replaces or keeps the Vendor's Offer for the Part with the
// request's details (REQ-3), the newer statement winning, or rejecting it
// with a reason; each once only, however many calls arrive at once. What
// the Offer then is, is read through the Vendor's Offers and a Part's
// visible Offers, and its history from the database with
// `offerHistoryRows()`, which no endpoint answers.

// A Part as the API answers it.
type PartBody = {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  partNumbers: string[];
  photoPath: string | null;
};

// A Part Request as it is sent and as a Vendor's list answers it, and,
// with its Vendor, as the Admin reads it.
type SentBody = Omit<PartRequestBody, 'vendor'>;
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
  vendor: { id: string; name: string; active: boolean };
};

// A fulfilled Part Request, with what fulfilling it did to the Offer.
type FulfilledBody = PartRequestBody & { offer: 'created' | 'replaced' | 'kept' };

// One of a Vendor's Offers, as its list answers it.
type ListedOfferBody = {
  id: string;
  part: PartBody;
  usdPrice: string | null;
  iqdPrice: number | null;
  inStock: boolean;
  warrantyMonths: number | null;
  confirmedAt: string;
  createdAt: string;
  daysSinceConfirmation: number;
  expired: boolean;
};

// A Visible Offer, as a Part's list answers it.
type VisibleOfferBody = {
  vendor: { id: string; name: string };
  usdPrice: string | null;
  iqdPrice: number | null;
  confirmedAt: string;
  daysSinceConfirmation: number;
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
const partRequestResolved = refusal('PART_REQUEST_RESOLVED');
const partNotFound = refusal('PART_NOT_FOUND');

// A refusal of one detail, naming its field and why.
function refused(field: string, reason: string): ExpectedErrorResponse[] {
  return [notValid(field, { reason })];
}

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

// A Part Request's details, as the Vendor's form sends them.
const aRequest = {
  category: 'gpu',
  name: 'Made-up Pulse Radeon RX 9070 XT 16GB',
  partNumber: '11348-03-20G',
  usdPrice: '649.99',
  iqdPrice: 950000,
  inStock: true,
  warrantyMonths: 24,
};

describe('resolving a Part Request', () => {
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
        loginPhoneNumber: `0750 400 ${String(1000 + vendors)}`,
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

  // The Admin deactivates or reactivates a Vendor, which calls Keycloak, so
  // it runs with the clock running.
  async function admin(action: 'deactivate' | 'reactivate', vendorId: string) {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/${action}`, {
      method: 'POST',
      headers: bearerHeader(await adminToken()),
    });
    expect(response.status).toBe(200);
  }

  // A made-up Part the Admin adds to the catalog, a GPU unless told.
  async function aPart(
    name = 'Made-up Radeon RX 9070 XT',
    category = 'gpu',
  ): Promise<PartBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        category,
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

  // A Part Request the Admin sends for the Vendor at the time of the clock,
  // with the details given over the made-up ones.
  async function aPartRequest(
    vendorId: string,
    details: Record<string, unknown> = {},
  ): Promise<SentBody> {
    const response = await fetch(
      `${testApp.baseUrl}/v1/vendors/${vendorId}/part-requests`,
      {
        method: 'POST',
        headers: {
          ...bearerHeader(await adminToken()),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ...aRequest, ...details }),
      },
    );
    expect(response.status).toBe(201);
    return (await response.json()) as SentBody;
  }

  function fulfil(
    partRequestId: string,
    body: unknown,
    token: string | null,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/part-requests/${partRequestId}/fulfil`, {
      method: 'POST',
      headers: {
        ...(token === null ? {} : bearerHeader(token)),
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  // The Admin fulfils a Part Request with a Part at the time of the clock.
  async function fulfilled(partRequestId: string, partId: string): Promise<FulfilledBody> {
    const response = await fulfil(partRequestId, { partId }, await adminToken());
    expect(response.status).toBe(200);
    return (await response.json()) as FulfilledBody;
  }

  function reject(
    partRequestId: string,
    body: unknown,
    token: string | null,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/part-requests/${partRequestId}/reject`, {
      method: 'POST',
      headers: {
        ...(token === null ? {} : bearerHeader(token)),
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  // The Admin rejects a Part Request with a reason at the time of the clock.
  async function rejected(partRequestId: string, reason: string): Promise<PartRequestBody> {
    const response = await reject(partRequestId, { reason }, await adminToken());
    expect(response.status).toBe(200);
    return (await response.json()) as PartRequestBody;
  }

  // One Part Request, as the Admin reads it at the time of the clock.
  async function thePartRequest(partRequestId: string): Promise<PartRequestBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/part-requests/${partRequestId}`, {
      headers: bearerHeader(await adminToken()),
    });
    expect(response.status).toBe(200);
    return (await response.json()) as PartRequestBody;
  }

  // The identifiers of the Admin's queue of open Part Requests.
  async function theQueue(): Promise<string[]> {
    const response = await fetch(`${testApp.baseUrl}/v1/part-requests?size=100`, {
      headers: bearerHeader(await adminToken()),
    });
    expect(response.status).toBe(200);
    return ((await response.json()) as { content: { id: string }[] }).content.map(
      ({ id }) => id,
    );
  }

  // The Vendor's Part Requests, as the Admin reads them at the time of the
  // clock.
  async function theVendorsPartRequests(vendorId: string): Promise<SentBody[]> {
    const response = await fetch(
      `${testApp.baseUrl}/v1/vendors/${vendorId}/part-requests?size=100`,
      { headers: bearerHeader(await adminToken()) },
    );
    expect(response.status).toBe(200);
    return ((await response.json()) as { content: SentBody[] }).content;
  }

  // An Offer the Admin adds for the Vendor with the clock at a moment, which
  // is then the time of its Confirmation. The clock stays there.
  async function anOfferConfirmedAt(
    vendorId: string,
    partId: string,
    moment: Date,
    details: Record<string, unknown> = { usdPrice: '599.00', inStock: false },
  ): Promise<ListedOfferBody> {
    moveTheClockTo(moment);
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ partId, ...details }),
    });
    expect(response.status).toBe(201);
    return (await response.json()) as ListedOfferBody;
  }

  // The Vendor's Offers, as the Admin reads them at the time of the clock.
  async function theVendorsOffers(vendorId: string): Promise<ListedOfferBody[]> {
    const response = await fetch(
      `${testApp.baseUrl}/v1/vendors/${vendorId}/offers?size=100`,
      {
        headers: bearerHeader(await adminToken()),
      },
    );
    expect(response.status).toBe(200);
    return ((await response.json()) as { content: ListedOfferBody[] }).content;
  }

  // A Part's Visible Offers, as a Shopper reads them without a token at the
  // time of the clock.
  async function theVisibleOffersOf(partId: string): Promise<VisibleOfferBody[]> {
    const response = await fetch(
      `${testApp.baseUrl}/v1/parts/${partId}/offers?currency=USD`,
    );
    expect(response.status).toBe(200);
    return (await response.json()) as VisibleOfferBody[];
  }

  // A Vendor's open Part Request sent at the moment, and a Part to fulfil it
  // with. The clock stays at the moment.
  async function aRequestSentAt(moment: Date) {
    const vendor = await aVendor();
    const part = await aPart();
    moveTheClockTo(moment);
    const partRequest = await aPartRequest(vendor.id);
    return { vendor, part, partRequest };
  }

  describe('fulfilling it', () => {
    describe('for a Vendor with no Offer for the Part', () => {
      it("makes the Offer with the request's prices, stock and warranty, confirmed when the request was sent and made now, and answers `created` with the request fulfilled", async () => {
        const { vendor, part, partRequest } = await aRequestSentAt(aMovedMoment);
        const now = after(aMovedMoment, 3 * aDay);
        moveTheClockTo(now);

        const answer = await fulfilled(partRequest.id, part.id);

        const [offer] = await theVendorsOffers(vendor.id);
        expect(offer).toMatchObject({
          part,
          usdPrice: '649.99',
          iqdPrice: 950000,
          inStock: true,
          warrantyMonths: 24,
          confirmedAt: aMovedMoment.toISOString(),
          createdAt: now.toISOString(),
          daysSinceConfirmation: 3,
          expired: false,
        });
        expect(answer).toEqual({
          ...partRequest,
          vendor: { id: vendor.id, name: 'Made-up Computer Corner', active: true },
          daysSinceSent: 3,
          state: 'fulfilled',
          part,
          offerId: offer.id,
          resolvedAt: now.toISOString(),
          offer: 'created',
        });
        const { offer: _outcome, ...withoutTheOutcome } = answer;
        expect(await thePartRequest(partRequest.id)).toEqual(withoutTheOutcome);
      });

      it("records the Offer's creation once, at now, by the Admin's Login", async () => {
        const { vendor, part, partRequest } = await aRequestSentAt(aMovedMoment);
        const now = after(aMovedMoment, anHour);
        moveTheClockTo(now);

        await fulfilled(partRequest.id, part.id);

        expect(await offerHistoryRows()).toEqual([
          {
            changedAt: now,
            vendorId: vendor.id,
            partId: part.id,
            change: 'created',
            usdPriceCents: 64999,
            iqdPrice: 950000,
            inStock: true,
            changedBy: adminLoginId,
          },
        ]);
      });

      it("lists the Offer among the Part's Visible Offers within 14 days of the sending, its days counted from it; past them, listed as expired in the Vendor's Offers and not visible, until confirming all makes it visible", async () => {
        const { vendor, part, partRequest } = await aRequestSentAt(aMovedMoment);
        moveTheClockTo(after(aMovedMoment, 5 * aDay));
        await fulfilled(partRequest.id, part.id);

        expect(await theVisibleOffersOf(part.id)).toMatchObject([
          {
            vendor: { id: vendor.id, name: 'Made-up Computer Corner' },
            usdPrice: '649.99',
            confirmedAt: aMovedMoment.toISOString(),
            daysSinceConfirmation: 5,
          },
        ]);

        moveTheClockTo(after(aMovedMoment, 14 * aDay + 1));
        expect(await theVisibleOffersOf(part.id)).toEqual([]);
        expect(await theVendorsOffers(vendor.id)).toMatchObject([{ expired: true }]);

        const confirmedAt = after(aMovedMoment, 14 * aDay + 1);
        const confirmed = await fetch(
          `${testApp.baseUrl}/v1/vendors/${vendor.id}/offers/confirm`,
          { method: 'POST', headers: bearerHeader(await tokenOfTheOwnLogin(vendor)) },
        );
        expect(confirmed.status).toBe(200);
        expect(await theVisibleOffersOf(part.id)).toMatchObject([
          { confirmedAt: confirmedAt.toISOString(), daysSinceConfirmation: 0 },
        ]);
      });

      it('makes an Offer that is an Expired Offer at once for a request sent more than 14 days before, as it said it would be', async () => {
        const { vendor, part, partRequest } = await aRequestSentAt(aMovedMoment);
        moveTheClockTo(after(aMovedMoment, 20 * aDay));
        expect(await thePartRequest(partRequest.id)).toMatchObject({
          offerWouldBeExpired: true,
        });

        await fulfilled(partRequest.id, part.id);

        expect(await theVendorsOffers(vendor.id)).toMatchObject([
          { confirmedAt: aMovedMoment.toISOString(), expired: true },
        ]);
        expect(await theVisibleOffersOf(part.id)).toEqual([]);
      });
    });

    describe('for a Vendor whose Offer for the Part was confirmed before the request was sent', () => {
      it("replaces the Offer's prices, stock and warranty with the request's, moves its Confirmation to the sending, records the change at now by the Admin, and answers `replaced`", async () => {
        const vendor = await aVendor();
        const part = await aPart();
        const before = await anOfferConfirmedAt(vendor.id, part.id, aMovedMoment, {
          usdPrice: '599.00',
          inStock: false,
          warrantyMonths: 12,
        });
        const sentAt = after(aMovedMoment, aDay);
        moveTheClockTo(sentAt);
        const partRequest = await aPartRequest(vendor.id);
        const now = after(sentAt, anHour);
        moveTheClockTo(now);

        const answer = await fulfilled(partRequest.id, part.id);

        expect(answer).toMatchObject({ offer: 'replaced', offerId: before.id });
        expect(await theVendorsOffers(vendor.id)).toMatchObject([
          {
            id: before.id,
            usdPrice: '649.99',
            iqdPrice: 950000,
            inStock: true,
            warrantyMonths: 24,
            confirmedAt: sentAt.toISOString(),
            createdAt: aMovedMoment.toISOString(),
          },
        ]);
        expect(
          (await offerHistoryRows()).map(
            ({ change, changedAt, usdPriceCents, iqdPrice, inStock, changedBy }) => ({
              change,
              changedAt,
              usdPriceCents,
              iqdPrice,
              inStock,
              changedBy,
            }),
          ),
        ).toEqual([
          {
            change: 'created',
            changedAt: aMovedMoment,
            usdPriceCents: 59900,
            iqdPrice: null,
            inStock: false,
            changedBy: adminLoginId,
          },
          {
            change: 'changed',
            changedAt: now,
            usdPriceCents: 64999,
            iqdPrice: 950000,
            inStock: true,
            changedBy: adminLoginId,
          },
        ]);
      });

      it('adds no history row when neither price nor stock changed, a change to the warranty alone, while the Confirmation still moves', async () => {
        const vendor = await aVendor();
        const part = await aPart();
        const before = await anOfferConfirmedAt(vendor.id, part.id, aMovedMoment, {
          usdPrice: '649.99',
          iqdPrice: 950000,
          inStock: true,
        });
        const sentAt = after(aMovedMoment, aDay);
        moveTheClockTo(sentAt);
        const partRequest = await aPartRequest(vendor.id);

        expect(await fulfilled(partRequest.id, part.id)).toMatchObject({
          offer: 'replaced',
        });

        expect(await theVendorsOffers(vendor.id)).toMatchObject([
          { id: before.id, warrantyMonths: 24, confirmedAt: sentAt.toISOString() },
        ]);
        expect((await offerHistoryRows()).map(({ change }) => change)).toEqual(['created']);
      });
    });

    describe('for a Vendor whose Offer for the Part was confirmed at or after the moment the request was sent', () => {
      it.each([
        ['at the very moment', 0],
        ['an hour after', anHour],
      ])(
        'keeps the Offer as it is, confirmed %s, adds no history row, answers `kept`, and still fulfils the request',
        async (_when, later) => {
          const vendor = await aVendor();
          const part = await aPart();
          moveTheClockTo(aMovedMoment);
          const partRequest = await aPartRequest(vendor.id);
          const offer = await anOfferConfirmedAt(
            vendor.id,
            part.id,
            after(aMovedMoment, later),
          );
          moveTheClockTo(after(aMovedMoment, 2 * anHour));
          const [before] = await theVendorsOffers(vendor.id);

          const answer = await fulfilled(partRequest.id, part.id);

          expect(answer).toMatchObject({
            state: 'fulfilled',
            offer: 'kept',
            offerId: offer.id,
          });
          expect(await theVendorsOffers(vendor.id)).toEqual([before]);
          expect((await offerHistoryRows()).map(({ change }) => change)).toEqual([
            'created',
          ]);
        },
      );
    });

    it("makes a Deactivated Vendor's Offer, which is not visible until the Vendor is reactivated", async () => {
      const vendor = await aVendor();
      const part = await aPart();
      moveTheClockTo(aMovedMoment);
      const partRequest = await aPartRequest(vendor.id);
      letTheClockRun();
      await admin('deactivate', vendor.id);
      moveTheClockTo(after(aMovedMoment, anHour));

      expect(await fulfilled(partRequest.id, part.id)).toMatchObject({
        offer: 'created',
        vendor: { id: vendor.id, active: false },
      });
      expect(await theVendorsOffers(vendor.id)).toHaveLength(1);
      expect(await theVisibleOffersOf(part.id)).toEqual([]);

      letTheClockRun();
      await admin('reactivate', vendor.id);
      moveTheClockTo(after(aMovedMoment, 2 * anHour));
      expect(await theVisibleOffersOf(part.id)).toMatchObject([
        { vendor: { id: vendor.id } },
      ]);
    });

    it('takes a Part of another Category than the request names, and the request keeps its own', async () => {
      const { vendor, partRequest } = await aRequestSentAt(aMovedMoment);
      const cpu = await aPart('Made-up Ryzen 5 7600', 'cpu');

      const answer = await fulfilled(partRequest.id, cpu.id);

      expect(answer).toMatchObject({
        category: 'gpu',
        part: { id: cpu.id, category: 'cpu' },
        offer: 'created',
      });
      expect(await theVendorsOffers(vendor.id)).toMatchObject([{ part: { id: cpu.id } }]);
    });

    it("answers the requesting Vendor's own Offer for the Part, not another Vendor's, and null in its list and on its own once the Vendor removes it, still fulfilled", async () => {
      const other = await aVendor('Made-up Computer House');
      const { vendor, part, partRequest } = await aRequestSentAt(aMovedMoment);
      const othersOffer = await anOfferConfirmedAt(other.id, part.id, aMovedMoment);
      const answer = await fulfilled(partRequest.id, part.id);
      const [own] = await theVendorsOffers(vendor.id);

      expect(answer.offerId).toBe(own.id);
      expect(answer.offerId).not.toBe(othersOffer.id);

      const removed = await fetch(
        `${testApp.baseUrl}/v1/vendors/${vendor.id}/offers/${own.id}`,
        { method: 'DELETE', headers: bearerHeader(await tokenOfTheOwnLogin(vendor)) },
      );
      expect(removed.status).toBe(204);

      expect(await thePartRequest(partRequest.id)).toMatchObject({
        state: 'fulfilled',
        part: { id: part.id },
        offerId: null,
      });
      expect(await theVendorsPartRequests(vendor.id)).toMatchObject([
        { id: partRequest.id, state: 'fulfilled', part: { id: part.id }, offerId: null },
      ]);
    });

    it('leaves the queue, and the Vendor lists it fulfilled', async () => {
      const { vendor, part, partRequest } = await aRequestSentAt(aMovedMoment);
      const staying = await aPartRequest(vendor.id, { name: 'Made-up Staying' });

      await fulfilled(partRequest.id, part.id);

      expect(await theQueue()).toEqual([staying.id]);
      expect(
        (await theVendorsPartRequests(vendor.id)).map(({ state }) => state).sort(),
      ).toEqual(['fulfilled', 'open']);
    });

    describe('its refusals', () => {
      it('refuse an unknown Part, and a text that is not an identifier, 404 with PART_NOT_FOUND, leaving the request open and no Offer made', async () => {
        const { vendor, partRequest } = await aRequestSentAt(aMovedMoment);
        const token = await adminToken();

        for (const partId of [randomUUID(), 'not-a-part']) {
          await expectErrorResponse(
            await fulfil(partRequest.id, { partId }, token),
            404,
            partNotFound,
          );
        }
        expect(await thePartRequest(partRequest.id)).toMatchObject({ state: 'open' });
        expect(await theQueue()).toEqual([partRequest.id]);
        expect(await theVendorsOffers(vendor.id)).toEqual([]);
      });

      it('refuse a request already fulfilled or rejected 400 with PART_REQUEST_RESOLVED, before the Part is looked at, changing nothing', async () => {
        const { vendor, part, partRequest } = await aRequestSentAt(aMovedMoment);
        const toReject = await aPartRequest(vendor.id, { name: 'Made-up Rejected' });
        await fulfilled(partRequest.id, part.id);
        await rejected(toReject.id, 'Made-up reason');
        const other = await aPart('Made-up Other GPU');
        const token = await adminToken();

        for (const [id, partId] of [
          [partRequest.id, part.id],
          [partRequest.id, other.id],
          [toReject.id, part.id],
          [partRequest.id, randomUUID()],
        ]) {
          await expectErrorResponse(
            await fulfil(id, { partId }, token),
            400,
            partRequestResolved,
          );
        }
        expect(await thePartRequest(toReject.id)).toMatchObject({ state: 'rejected' });
        expect(await theVendorsOffers(vendor.id)).toHaveLength(1);
      });

      it('refuse an unknown request, and a text that is not an identifier, 404 with PART_REQUEST_NOT_FOUND, before the Part is looked at', async () => {
        const part = await aPart();
        const token = await adminToken();

        for (const id of [randomUUID(), 'not-a-part-request']) {
          await expectErrorResponse(
            await fulfil(id, { partId: part.id }, token),
            404,
            partRequestNotFound,
          );
          await expectErrorResponse(
            await fulfil(id, { partId: randomUUID() }, token),
            404,
            partRequestNotFound,
          );
        }
      });

      it("refuse a request with no Part named, naming `partId`, a Vendor's own Login 403 with ACCESS_DENIED, even for its own request, and no token 401", async () => {
        const { vendor, part, partRequest } = await aRequestSentAt(aMovedMoment);

        await expectErrorResponse(
          await fulfil(partRequest.id, {}, await adminToken()),
          400,
          [notValid('partId')],
        );
        await expectErrorResponse(
          await fulfil(
            partRequest.id,
            { partId: part.id },
            await tokenOfTheOwnLogin(vendor),
          ),
          403,
          accessDenied,
        );
        await expectErrorResponse(
          await fulfil(partRequest.id, { partId: part.id }, null),
          401,
          unauthorized,
        );
        expect(await thePartRequest(partRequest.id)).toMatchObject({ state: 'open' });
      });
    });
  });

  describe('rejecting it', () => {
    it('keeps the reason as written and answers the request rejected, with its Vendor and the moment, which leaves the queue and which the Vendor lists so', async () => {
      const { vendor, partRequest } = await aRequestSentAt(aMovedMoment);
      const now = after(aMovedMoment, anHour);
      moveTheClockTo(now);
      const reason = '  ئەم پارچەیە هەمان Sapphire Pulse ـە کە لە کەتەلۆگدایە.\n';

      const answer = await rejected(partRequest.id, reason);

      expect(answer).toEqual({
        ...partRequest,
        vendor: { id: vendor.id, name: 'Made-up Computer Corner', active: true },
        state: 'rejected',
        reason,
        resolvedAt: now.toISOString(),
      });
      expect(await thePartRequest(partRequest.id)).toEqual(answer);
      expect(await theQueue()).toEqual([]);
      const { vendor: _vendor, ...asListed } = answer;
      expect(await theVendorsPartRequests(vendor.id)).toEqual([asListed]);
      expect(await theVendorsOffers(vendor.id)).toEqual([]);
    });

    it('takes a reason of 300 characters, counted as Unicode code points', async () => {
      const { partRequest } = await aRequestSentAt(aMovedMoment);
      const reason = 'ڕ'.repeat(299) + '😀';

      expect(await rejected(partRequest.id, reason)).toMatchObject({ reason });
    });

    it.each<[string, Record<string, unknown>, string]>([
      ['no reason', {}, 'missing'],
      ['an empty reason', { reason: '' }, 'missing'],
      ['a reason of spaces and line breaks', { reason: ' \n ' }, 'missing'],
      ['a reason of 301 characters', { reason: '😀'.repeat(301) }, 'tooLong'],
    ])(
      'refuses %s, naming `reason` and why, leaving the request open',
      async (_what, body, why) => {
        const { partRequest } = await aRequestSentAt(aMovedMoment);

        await expectErrorResponse(
          await reject(partRequest.id, body, await adminToken()),
          400,
          refused('reason', why),
        );
        expect(await thePartRequest(partRequest.id)).toMatchObject({ state: 'open' });
      },
    );

    it('refuses a request already resolved 400 with PART_REQUEST_RESOLVED, and an unknown one, or a text that is not an identifier, 404 with PART_REQUEST_NOT_FOUND, each before the reason is looked at', async () => {
      const { vendor, part, partRequest } = await aRequestSentAt(aMovedMoment);
      const toReject = await aPartRequest(vendor.id, { name: 'Made-up Rejected' });
      await fulfilled(partRequest.id, part.id);
      await rejected(toReject.id, 'The first reason');
      const token = await adminToken();

      for (const id of [partRequest.id, toReject.id]) {
        for (const body of [{ reason: 'Another reason' }, {}]) {
          await expectErrorResponse(
            await reject(id, body, token),
            400,
            partRequestResolved,
          );
        }
      }
      for (const id of [randomUUID(), 'not-a-part-request']) {
        await expectErrorResponse(await reject(id, {}, token), 404, partRequestNotFound);
      }
      expect(await thePartRequest(partRequest.id)).toMatchObject({ state: 'fulfilled' });
      expect(await thePartRequest(toReject.id)).toMatchObject({
        reason: 'The first reason',
      });
    });

    it("refuses a reason that is not a text, naming it, a Vendor's own Login 403 with ACCESS_DENIED, and no token 401", async () => {
      const { vendor, partRequest } = await aRequestSentAt(aMovedMoment);

      await expectErrorResponse(
        await reject(partRequest.id, { reason: 5 }, await adminToken()),
        400,
        [notValid('reason')],
      );
      await expectErrorResponse(
        await reject(partRequest.id, { reason: 'No' }, await tokenOfTheOwnLogin(vendor)),
        403,
        accessDenied,
      );
      await expectErrorResponse(
        await reject(partRequest.id, { reason: 'No' }, null),
        401,
        unauthorized,
      );
      expect(await thePartRequest(partRequest.id)).toMatchObject({ state: 'open' });
    });
  });

  describe('once only, for calls sent at once while the request is held', () => {
    it('fulfils it once with two fulfilments, makes one Offer with one history row, and refuses the other 400 with PART_REQUEST_RESOLVED', async () => {
      const { vendor, part, partRequest } = await aRequestSentAt(aMovedMoment);
      const token = await adminToken();

      const answers = await sentWhileThePartRequestIsHeld(partRequest.id, 2, () =>
        Promise.all([
          fulfil(partRequest.id, { partId: part.id }, token),
          fulfil(partRequest.id, { partId: part.id }, token),
        ]),
      );

      expect(answers.map(({ status }) => status).sort()).toEqual([200, 400]);
      await expectErrorResponse(
        answers.find(({ status }) => status === 400) as Response,
        400,
        partRequestResolved,
      );
      expect(await theVendorsOffers(vendor.id)).toHaveLength(1);
      expect((await offerHistoryRows()).map(({ change }) => change)).toEqual(['created']);
      expect(await thePartRequest(partRequest.id)).toMatchObject({ state: 'fulfilled' });
    });

    it('resolves it once with a fulfilment and a rejection, as the one answered 200 says, and refuses the other 400 with PART_REQUEST_RESOLVED', async () => {
      const { vendor, part, partRequest } = await aRequestSentAt(aMovedMoment);
      const token = await adminToken();

      const [fulfilment, rejection] = await sentWhileThePartRequestIsHeld(
        partRequest.id,
        2,
        () =>
          Promise.all([
            fulfil(partRequest.id, { partId: part.id }, token),
            reject(partRequest.id, { reason: 'Made-up reason' }, token),
          ]),
      );

      expect([fulfilment.status, rejection.status].sort()).toEqual([200, 400]);
      const fulfilmentWon = fulfilment.status === 200;
      await expectErrorResponse(
        fulfilmentWon ? rejection : fulfilment,
        400,
        partRequestResolved,
      );
      expect(await thePartRequest(partRequest.id)).toMatchObject({
        state: fulfilmentWon ? 'fulfilled' : 'rejected',
      });
      expect(await theVendorsOffers(vendor.id)).toHaveLength(fulfilmentWon ? 1 : 0);
    });
  });
});
