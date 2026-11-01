import {
  accessDenied,
  bearerHeader,
  expectErrorResponse,
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

// The Admin's list of the active Vendors that have Expired Offers or Offers
// about to expire, so that the Admin can remind them personally (OFF-9).

// A phone number as the API answers it: the form it is stored in, and Iraq's
// own form, which a person reads.
type PhoneNumberBody = { international: string; national: string };

// A Vendor on the list, as the API answers it.
type ExpiringVendorBody = {
  id: string;
  name: string;
  phoneNumber: PhoneNumberBody;
  whatsAppNumber: PhoneNumberBody | null;
  counts: { offers: number; expired: number; aboutToExpire: number };
};

type ListBody = {
  content: ExpiringVendorBody[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

// A moment for the API's clock, with milliseconds, at which the list is read.
const now = new Date('2027-03-14T09:26:53.589Z');

// A day of 24 hours, and the moment some days before now.
const aDay = 24 * 60 * 60 * 1000;
function daysAgo(days: number): Date {
  return new Date(now.getTime() - days * aDay);
}

describe('the Vendors with expiring Offers', () => {
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

  // A token of the Admin. Made when it is needed, so that it is judged by
  // the clock that is current then.
  function adminToken(): Promise<string> {
    return testApp.tokenOf({ roles: ['admin'] });
  }

  async function asTheAdmin(
    method: string,
    address: string,
    body?: unknown,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}${address}`, {
      method,
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  // A made-up Vendor the Admin creates, with the clock running. Each has a
  // login phone number of its own.
  let vendorsMade = 0;
  async function aVendor(
    name: string,
    details: Record<string, unknown> = {},
  ): Promise<{ id: string; loginName: string }> {
    vendorsMade += 1;
    const response = await asTheAdmin('POST', '/v1/vendors', {
      name,
      city: 'erbil',
      address: 'Made-up Street, Erbil',
      phoneNumber: '066 223 4567',
      loginPhoneNumber: `0750 123 ${String(4500 + vendorsMade)}`,
      ...details,
    });
    expect(response.status).toBe(201);
    const { vendor } = (await response.json()) as {
      vendor: { id: string; loginPhoneNumber: { international: string } };
    };
    return { id: vendor.id, loginName: vendor.loginPhoneNumber.international };
  }

  // A made-up Part the Admin adds to the catalog, by its identifier.
  let partsMade = 0;
  async function aPart(): Promise<string> {
    partsMade += 1;
    const response = await asTheAdmin('POST', '/v1/parts', {
      category: 'cpu',
      name: `Made-up Ryzen ${String(partsMade)}`,
      manufacturer: 'AMD',
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { id: string }).id;
  }

  // An Offer of the Vendor's for a new Part, as the Admin adds it with the
  // clock at the moment given, which is then the time of its Confirmation.
  async function anOfferConfirmedAt(vendorId: string, moment: Date): Promise<void> {
    const partId = await aPart();
    moveTheClockTo(moment);
    const response = await asTheAdmin('POST', `/v1/vendors/${vendorId}/offers`, {
      partId,
      usdPrice: '349.99',
      inStock: true,
    });
    letTheClockRun();
    expect(response.status).toBe(201);
  }

  function listExpiring(
    token: string | null,
    query: Record<string, string | number> = {},
  ): Promise<Response> {
    const search = new URLSearchParams(
      Object.entries(query).map(([key, value]): [string, string] => [key, String(value)]),
    );
    return fetch(`${testApp.baseUrl}/v1/offers/expiring?${search}`, {
      headers: token === null ? {} : bearerHeader(token),
    });
  }

  // The list as the Admin reads it now, by the moved clock.
  async function theList(query: Record<string, string | number> = {}): Promise<ListBody> {
    moveTheClockTo(now);
    const response = await listExpiring(await adminToken(), query);
    letTheClockRun();
    expect(response.status).toBe(200);
    return (await response.json()) as ListBody;
  }

  // The names on the list's first page, in its order.
  async function theNamesListed(): Promise<string[]> {
    return (await theList()).content.map(({ name }) => name);
  }

  describe('which Vendors it lists', () => {
    it('lists a Vendor with one Offer about to expire, with a count of one, and not a Vendor with only current Offers', async () => {
      const reminded = await aVendor('Made-up Reminded Shop');
      await anOfferConfirmedAt(reminded.id, new Date(daysAgo(11).getTime() - 1));
      await anOfferConfirmedAt(reminded.id, daysAgo(2));
      const current = await aVendor('Made-up Current Shop');
      await anOfferConfirmedAt(current.id, daysAgo(11));
      await anOfferConfirmedAt(current.id, daysAgo(0));

      const list = await theList();

      expect(list.content).toEqual([
        {
          id: reminded.id,
          name: 'Made-up Reminded Shop',
          phoneNumber: { international: '+964662234567', national: '066 223 4567' },
          whatsAppNumber: null,
          counts: { offers: 2, expired: 0, aboutToExpire: 1 },
        },
      ]);
      expect(list.totalElements).toBe(1);
    });

    it('counts an Offer confirmed 14 days ago to the millisecond as about to expire, and one a millisecond older as expired', async () => {
      const vendor = await aVendor('Made-up Computer Shop');
      await anOfferConfirmedAt(vendor.id, daysAgo(14));
      await anOfferConfirmedAt(vendor.id, new Date(daysAgo(14).getTime() - 1));
      await anOfferConfirmedAt(vendor.id, daysAgo(30));

      const [listed] = (await theList()).content;

      expect(listed.counts).toEqual({ offers: 3, expired: 2, aboutToExpire: 1 });
    });

    it("answers the Vendor's phone number and WhatsApp number in both forms", async () => {
      const vendor = await aVendor('Made-up Computer Shop', {
        phoneNumber: '0750 111 2233',
        whatsAppNumber: '٠٧٧٠ ١٢٣ ٤٥٦٧',
      });
      await anOfferConfirmedAt(vendor.id, daysAgo(20));

      const [listed] = (await theList()).content;

      expect(listed).toMatchObject({
        phoneNumber: { international: '+9647501112233', national: '0750 111 2233' },
        whatsAppNumber: { international: '+9647701234567', national: '0770 123 4567' },
      });
    });

    it('leaves out a deactivated Vendor', async () => {
      const active = await aVendor('Made-up Active Shop');
      await anOfferConfirmedAt(active.id, daysAgo(20));
      const deactivated = await aVendor('Made-up Deactivated Shop');
      await anOfferConfirmedAt(deactivated.id, daysAgo(20));
      await anOfferConfirmedAt(deactivated.id, daysAgo(12));
      const deactivation = await asTheAdmin(
        'POST',
        `/v1/vendors/${deactivated.id}/deactivate`,
      );
      expect(deactivation.status).toBe(200);

      const list = await theList();

      expect(list.content.map(({ name }) => name)).toEqual(['Made-up Active Shop']);
      expect(list.totalElements).toBe(1);
    });

    it('lets a Vendor leave the list once it confirms all its Offers', async () => {
      const vendor = await aVendor('Made-up Computer Shop');
      await anOfferConfirmedAt(vendor.id, daysAgo(20));
      await anOfferConfirmedAt(vendor.id, daysAgo(12));
      expect(await theNamesListed()).toEqual(['Made-up Computer Shop']);

      moveTheClockTo(now);
      const confirmation = await asTheAdmin(
        'POST',
        `/v1/vendors/${vendor.id}/offers/confirm`,
      );
      letTheClockRun();
      expect(confirmation.status).toBe(200);

      expect(await theList()).toMatchObject({ content: [], totalElements: 0 });
    });

    it('answers an empty page when no Vendor has an Offer expired or about to expire', async () => {
      const vendor = await aVendor('Made-up Computer Shop');
      await anOfferConfirmedAt(vendor.id, daysAgo(1));
      await aVendor('Made-up Shop With No Offers');

      expect(await theList()).toEqual({
        content: [],
        pageNumber: 0,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      });
    });
  });

  describe('its order', () => {
    it('puts a Vendor with an Expired Offer before one whose Offers are only about to expire', async () => {
      // The Vendor about to expire is first by name, and its Offer was
      // confirmed before the other Vendor's newest Offer.
      const aboutToExpire = await aVendor('Made-up A Shop');
      await anOfferConfirmedAt(aboutToExpire.id, daysAgo(13));
      const expired = await aVendor('Made-up B Shop');
      await anOfferConfirmedAt(expired.id, daysAgo(1));
      await anOfferConfirmedAt(expired.id, new Date(daysAgo(14).getTime() - 1));

      expect(await theNamesListed()).toEqual(['Made-up B Shop', 'Made-up A Shop']);
    });

    it('puts the Vendor whose Offer expires soonest first, among those whose Offers are only about to expire', async () => {
      const later = await aVendor('Made-up A Shop');
      await anOfferConfirmedAt(later.id, daysAgo(12));
      const sooner = await aVendor('Made-up B Shop');
      await anOfferConfirmedAt(sooner.id, daysAgo(13));
      await anOfferConfirmedAt(sooner.id, daysAgo(0));

      expect(await theNamesListed()).toEqual(['Made-up B Shop', 'Made-up A Shop']);
    });

    it('puts the Vendors with an Expired Offer in name order, however long ago their Offers expired', async () => {
      const longAgo = await aVendor('Made-up B Shop');
      await anOfferConfirmedAt(longAgo.id, daysAgo(40));
      const lately = await aVendor('Made-up A Shop');
      await anOfferConfirmedAt(lately.id, daysAgo(15));

      expect(await theNamesListed()).toEqual(['Made-up A Shop', 'Made-up B Shop']);
    });

    it('lists each Vendor once across the pages', async () => {
      const names = [
        'Made-up C Shop',
        'Made-up A Shop',
        'Made-up B Shop',
        'Made-up D Shop',
      ];
      for (const name of names) {
        const vendor = await aVendor(name);
        await anOfferConfirmedAt(vendor.id, daysAgo(20));
        await anOfferConfirmedAt(vendor.id, daysAgo(21));
      }

      const first = await theList({ page: 0, size: 3 });
      const second = await theList({ page: 1, size: 3 });

      expect([...first.content, ...second.content].map(({ name }) => name)).toEqual([
        'Made-up A Shop',
        'Made-up B Shop',
        'Made-up C Shop',
        'Made-up D Shop',
      ]);
      expect(first).toMatchObject({ totalElements: 4, totalPages: 2, last: false });
    });
  });

  describe('who may read it', () => {
    it("refuses a Vendor's token with 403", async () => {
      const vendor = await aVendor('Made-up Computer Shop');
      await anOfferConfirmedAt(vendor.id, daysAgo(20));
      const [login] = await loginsNamed(vendor.loginName);
      const token = await testApp.tokenOf({
        subject: login.id,
        loginName: vendor.loginName,
        roles: ['vendor'],
      });

      await expectErrorResponse(await listExpiring(token), 403, accessDenied);
    });

    it('answers a call without a token with 401', async () => {
      await expectErrorResponse(await listExpiring(null), 401, unauthorized);
    });
  });
});
