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

// Recording a Referral to a Vendor from a Shared Build, by anyone without a
// token (SHR-6), and reading the Referral counts: the Admin every Vendor's,
// and a Vendor only its own (SHR-7). A Referral is one tap on "send on
// WhatsApp": it holds the Vendor, the Shared Build and the moment, and
// nothing about the Shopper.

// A phone number as the API answers it.
type PhoneNumberBody = { international: string; national: string };

// A Vendor as the API answers its creation, as far as these tests read it.
type VendorBody = { id: string; name: string; loginPhoneNumber: PhoneNumberBody };

// A Referral as recording one answers it.
type ReferralBody = {
  vendor: { id: string; name: string; whatsAppNumber: PhoneNumberBody };
  referredAt: string;
};

// A Vendor's Referral count, as the Admin's list answers it.
type ReferralCountBody = { id: string; name: string; active: boolean; count: number };

// One page of the Admin's list of Referral counts.
type ReferralCountsPageBody = {
  content: ReferralCountBody[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

// The refusals these tests expect, each as a whole.
function refusal(code: string): ExpectedErrorResponse[] {
  const key = code.toLowerCase();
  return [{ code, title: `${key}_title`, detail: `${key}_details` }];
}
const sharedBuildNotFound = refusal('SHARED_BUILD_NOT_FOUND');
const vendorNotFound = refusal('VENDOR_NOT_FOUND');
const vendorAccessDenied = refusal('VENDOR_ACCESS_DENIED');
const vendorDeactivated = refusal('VENDOR_DEACTIVATED');
const noWhatsAppNumber = [notValid('vendorId', { reason: 'noWhatsAppNumber' })];

const adminLoginId = randomUUID();

// A moment for the API's clock, with milliseconds, so that a time stored
// with less precision would show.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');

describe('Referrals', () => {
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

  // Made-up Vendors are numbered, so that each has a Login phone number and a
  // WhatsApp number of its own.
  let vendors = 0;

  // A made-up Vendor the Admin creates, with a Login of its own, and the
  // WhatsApp number given, one of its own unless it is given one, or none
  // when it is given null. It calls Keycloak, so it runs with the clock
  // running.
  async function aVendor(
    name = 'Made-up Computer Corner',
    whatsAppNumber?: string | null,
  ): Promise<VendorBody> {
    vendors += 1;
    const response = await fetch(`${testApp.baseUrl}/v1/vendors`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        city: 'erbil',
        address: 'Made-up Street, Erbil',
        phoneNumber: '066 223 4567',
        whatsAppNumber:
          whatsAppNumber === undefined
            ? `0770 200 ${String(1000 + vendors)}`
            : whatsAppNumber,
        loginPhoneNumber: `0750 100 ${String(1000 + vendors)}`,
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

  // The Admin deactivates a Vendor, which calls Keycloak, so it runs with the
  // clock running.
  async function deactivate(vendorId: string): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/deactivate`, {
      method: 'POST',
      headers: bearerHeader(await adminToken()),
    });
    expect(response.status).toBe(200);
  }

  // Made-up Parts are numbered, so that each Shared Build is of a Build of
  // its own.
  let parts = 0;

  // The identifier of a Shared Build of a made-up CPU, shared without a
  // token.
  async function aSharedBuild(): Promise<string> {
    parts += 1;
    const made = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'cpu',
        name: `Made-up CPU ${String(parts)}`,
        manufacturer: 'Made-up Chips',
      }),
    });
    expect(made.status).toBe(201);
    const { id } = (await made.json()) as { id: string };
    const shared = await fetch(`${testApp.baseUrl}/v1/shared-builds`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ part: [id] }),
    });
    expect(shared.status).toBe(201);
    return ((await shared.json()) as { id: string }).id;
  }

  // Records a Referral from a Shared Build with the body given, and the
  // headers given.
  function refer(
    sharedBuildId: string,
    body: unknown,
    headers: Record<string, string> = {},
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/shared-builds/${sharedBuildId}/referrals`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  }

  // Records a Referral to a Vendor from a Shared Build without a token, and
  // the Referral it answers.
  async function referred(sharedBuildId: string, vendorId: string): Promise<ReferralBody> {
    const response = await refer(sharedBuildId, { vendorId });
    expect(response.status).toBe(201);
    return (await response.json()) as ReferralBody;
  }

  // Reads a Vendor's Referral count with the token given, or none.
  function readCount(vendorId: string, token: string | null): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/referral-count`, {
      headers: token === null ? {} : bearerHeader(token),
    });
  }

  // A Vendor's Referral count, as the Admin reads it.
  async function countOf(vendorId: string): Promise<number> {
    const response = await readCount(vendorId, await adminToken());
    expect(response.status).toBe(200);
    return ((await response.json()) as { count: number }).count;
  }

  // Reads the Admin's list of Referral counts, with the query and the token
  // given, or none.
  function listCounts(
    query: Record<string, string>,
    token: string | null,
  ): Promise<Response> {
    return fetch(
      `${testApp.baseUrl}/v1/referral-counts?${new URLSearchParams(query).toString()}`,
      { headers: token === null ? {} : bearerHeader(token) },
    );
  }

  // One page of the Admin's list of Referral counts.
  async function theCounts(
    query: Record<string, string> = { size: '100' },
  ): Promise<ReferralCountsPageBody> {
    const response = await listCounts(query, await adminToken());
    expect(response.status).toBe(200);
    return (await response.json()) as ReferralCountsPageBody;
  }

  describe('recording a Referral', () => {
    it("answers 201 with the Vendor's identifier, name and WhatsApp number in both forms, and the moment by the API's clock", async () => {
      const vendor = await aVendor('Made-up Computer Corner', '0770 123 4567');
      const sharedBuild = await aSharedBuild();
      moveTheClockTo(aMovedMoment);

      const response = await refer(sharedBuild, { vendorId: vendor.id });

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({
        vendor: {
          id: vendor.id,
          name: 'Made-up Computer Corner',
          whatsAppNumber: { international: '+9647701234567', national: '0770 123 4567' },
        },
        referredAt: aMovedMoment.toISOString(),
      });
    });

    it('counts each call as one Referral: two for one Vendor and one Shared Build are two, and each raises its count by one', async () => {
      const vendor = await aVendor();
      const sharedBuild = await aSharedBuild();
      expect(await countOf(vendor.id)).toBe(0);

      await referred(sharedBuild, vendor.id);
      expect(await countOf(vendor.id)).toBe(1);

      await referred(sharedBuild, vendor.id);
      expect(await countOf(vendor.id)).toBe(2);

      await referred(await aSharedBuild(), vendor.id);
      expect(await countOf(vendor.id)).toBe(3);
    });

    it("records a Referral to a Vendor that has none of the Shared Build's Parts in stock, or no Offer at all", async () => {
      const vendor = await aVendor();

      await referred(await aSharedBuild(), vendor.id);

      expect(await countOf(vendor.id)).toBe(1);
    });

    describe('its refusals', () => {
      it('refuse an unknown Shared Build, and a text that is not an identifier, 404 with SHARED_BUILD_NOT_FOUND, whatever the Vendor, and count nothing', async () => {
        const vendor = await aVendor();

        for (const sharedBuildId of [randomUUID(), 'not-a-shared-build']) {
          for (const vendorId of [vendor.id, randomUUID()]) {
            await expectErrorResponse(
              await refer(sharedBuildId, { vendorId }),
              404,
              sharedBuildNotFound,
            );
          }
        }
        expect(await countOf(vendor.id)).toBe(0);
      });

      it('refuse an unknown Vendor, and a text that is not an identifier, 404 with VENDOR_NOT_FOUND', async () => {
        const sharedBuild = await aSharedBuild();

        for (const vendorId of [randomUUID(), 'not-a-vendor', '']) {
          await expectErrorResponse(
            await refer(sharedBuild, { vendorId }),
            404,
            vendorNotFound,
          );
        }
      });

      it('refuse a deactivated Vendor 404 with VENDOR_NOT_FOUND, with a WhatsApp number, and count nothing', async () => {
        const vendor = await aVendor();
        const sharedBuild = await aSharedBuild();
        await deactivate(vendor.id);

        await expectErrorResponse(
          await refer(sharedBuild, { vendorId: vendor.id }),
          404,
          vendorNotFound,
        );
        expect(await countOf(vendor.id)).toBe(0);
      });

      it('refuse a Vendor with no WhatsApp number, naming `vendorId`, with the reason `noWhatsAppNumber`, and count nothing', async () => {
        const vendor = await aVendor('Made-up Computer Corner', null);
        const sharedBuild = await aSharedBuild();

        await expectErrorResponse(
          await refer(sharedBuild, { vendorId: vendor.id }),
          400,
          noWhatsAppNumber,
        );
        expect(await countOf(vendor.id)).toBe(0);
      });

      it('refuse a request with no `vendorId`, or one that is not a text, naming it, and a field the request does not take, naming it', async () => {
        const vendor = await aVendor();
        const sharedBuild = await aSharedBuild();

        for (const body of [
          {},
          { vendorId: null },
          { vendorId: 7 },
          { vendorId: [vendor.id] },
        ]) {
          await expectErrorResponse(await refer(sharedBuild, body), 400, [
            notValid('vendorId'),
          ]);
        }
        await expectErrorResponse(
          await refer(sharedBuild, { vendorId: vendor.id, phoneNumber: '0750 123 4567' }),
          400,
          [notValid('phoneNumber')],
        );
        expect(await countOf(vendor.id)).toBe(0);
      });
    });

    it("answers the same without a token and with any token, an Admin's or a Vendor's among them, and counts each call", async () => {
      const vendor = await aVendor();
      const sharedBuild = await aSharedBuild();
      moveTheClockTo(aMovedMoment);
      const withoutAToken = await referred(sharedBuild, vendor.id);

      const tokens = [
        await adminToken(),
        await testApp.tokenOf({ subject: randomUUID(), roles: ['vendor'] }),
        await testApp.tokenOf({ roles: ['shopper'] }),
        await testApp.tokenOf({
          roles: ['admin'],
          expiresAt: new Date(aMovedMoment.getTime() - 60_000),
        }),
        'nonsense',
      ];
      for (const token of tokens) {
        const response = await refer(
          sharedBuild,
          { vendorId: vendor.id },
          bearerHeader(token),
        );
        expect(response.status).toBe(201);
        expect(await response.json()).toEqual(withoutAToken);
      }
      await expectErrorResponse(
        await refer(randomUUID(), { vendorId: vendor.id }, bearerHeader('nonsense')),
        404,
        sharedBuildNotFound,
      );
      letTheClockRun();
      expect(await countOf(vendor.id)).toBe(6);
    });
  });

  describe("the Admin's list of Referral counts", () => {
    it('holds every Vendor, active and deactivated, with its identifier, name, whether it is active and its count, zeros included', async () => {
      const vendor = await aVendor('Made-up Computer Corner');
      const otherVendor = await aVendor('Made-up Computer House');
      const quiet = await aVendor('Made-up Quiet Corner', null);
      const gone = await aVendor('Made-up Gone Corner');
      const sharedBuild = await aSharedBuild();
      await referred(sharedBuild, vendor.id);
      await referred(sharedBuild, vendor.id);
      await referred(sharedBuild, gone.id);
      await deactivate(gone.id);

      expect(await theCounts()).toEqual({
        content: [
          { id: vendor.id, name: 'Made-up Computer Corner', active: true, count: 2 },
          { id: gone.id, name: 'Made-up Gone Corner', active: false, count: 1 },
          { id: otherVendor.id, name: 'Made-up Computer House', active: true, count: 0 },
          { id: quiet.id, name: 'Made-up Quiet Corner', active: true, count: 0 },
        ],
        pageNumber: 0,
        pageSize: 100,
        totalElements: 4,
        totalPages: 1,
        first: true,
        last: true,
      });
    });

    it('orders the Vendors by count, most first, then by name, then by identifier, on Vendors that tie on each key in turn', async () => {
      // Zulu has the most, whatever its name. Bravo and Charlie tie on two,
      // and their names decide. Alpha has none, whatever its name, and comes
      // first among those with none by it. The twins tie on none and on
      // their name, and their identifiers decide.
      const zulu = await aVendor('Made-up Zulu Computers');
      const bravo = await aVendor('Made-up Bravo Computers');
      const charlie = await aVendor('Made-up Charlie Computers');
      const alpha = await aVendor('Made-up Alpha Computers');
      const twinA = await aVendor('Made-up Twin Computers');
      const twinB = await aVendor('Made-up Twin Computers');
      const [lowerTwin, higherTwin] = [twinA.id, twinB.id].sort();
      const sharedBuild = await aSharedBuild();
      for (const [vendor, times] of [
        [zulu, 3],
        [charlie, 2],
        [bravo, 2],
      ] as const) {
        for (let time = 0; time < times; time += 1) await referred(sharedBuild, vendor.id);
      }

      expect((await theCounts()).content.map(({ id, count }) => ({ id, count }))).toEqual([
        { id: zulu.id, count: 3 },
        { id: bravo.id, count: 2 },
        { id: charlie.id, count: 2 },
        { id: alpha.id, count: 0 },
        { id: lowerTwin, count: 0 },
        { id: higherTwin, count: 0 },
      ]);
    });

    it('pages through the catalog paging: 10 a page unless asked, the pages in order with no Vendor twice, and a page past the end empty with the total', async () => {
      const made: VendorBody[] = [];
      for (let number = 1; number <= 5; number += 1) {
        made.push(await aVendor(`Made-up Vendor ${String(number)}`));
      }
      const sharedBuild = await aSharedBuild();
      await referred(sharedBuild, made[4].id);

      const whole = (await theCounts()).content.map(({ id }) => id);
      expect(whole).toHaveLength(5);
      expect(whole[0]).toBe(made[4].id);

      const pages = [
        await theCounts({ page: '0', size: '2' }),
        await theCounts({ page: '1', size: '2' }),
        await theCounts({ page: '2', size: '2' }),
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

      const past = await theCounts({ page: '7', size: '2' });
      expect(past).toMatchObject({ content: [], totalElements: 5, last: true });
      expect((await theCounts({})).pageSize).toBe(10);
      await expectErrorResponse(
        await listCounts({ size: '101' }, await adminToken()),
        400,
        [notValid('size')],
      );
    });

    it("is the Admin's alone: a Vendor's own Login is refused 403 with ACCESS_DENIED, and no token 401", async () => {
      const vendor = await aVendor();

      await expectErrorResponse(
        await listCounts({}, await tokenOfTheOwnLogin(vendor)),
        403,
        accessDenied,
      );
      await expectErrorResponse(await listCounts({}, null), 401, unauthorized);
      await expectErrorResponse(await listCounts({}, 'nonsense'), 401, unauthorized);
    });
  });

  describe("a Vendor's own Referral count", () => {
    it("is read by the Vendor's own Login and by the Admin, and is unchanged by Referrals to any other Vendor", async () => {
      const vendor = await aVendor('Made-up Computer Corner');
      const otherVendor = await aVendor('Made-up Computer House');
      const sharedBuild = await aSharedBuild();
      await referred(sharedBuild, vendor.id);
      await referred(sharedBuild, otherVendor.id);
      await referred(sharedBuild, otherVendor.id);

      const own = await readCount(vendor.id, await tokenOfTheOwnLogin(vendor));
      expect(own.status).toBe(200);
      expect(await own.json()).toEqual({ count: 1 });
      expect(await countOf(vendor.id)).toBe(1);
      expect(await countOf(otherVendor.id)).toBe(2);

      await referred(sharedBuild, otherVendor.id);
      expect(await countOf(vendor.id)).toBe(1);
    });

    it("refuses another Vendor's count to a Vendor's own Login 403 with VENDOR_ACCESS_DENIED, whether that Vendor exists or not", async () => {
      const vendor = await aVendor('Made-up Computer Corner');
      const otherVendor = await aVendor('Made-up Computer House');
      const token = await tokenOfTheOwnLogin(vendor);

      for (const vendorId of [otherVendor.id, randomUUID(), 'not-a-vendor']) {
        await expectErrorResponse(
          await readCount(vendorId, token),
          403,
          vendorAccessDenied,
        );
      }
    });

    it("refuses a deactivated Vendor's own Login 403 with VENDOR_DEACTIVATED, while the Admin still reads its count", async () => {
      const vendor = await aVendor();
      await referred(await aSharedBuild(), vendor.id);
      const token = await tokenOfTheOwnLogin(vendor);
      await deactivate(vendor.id);

      await expectErrorResponse(await readCount(vendor.id, token), 403, vendorDeactivated);
      expect(await countOf(vendor.id)).toBe(1);
    });

    it('answers a call without a token, or with a token that is not good, 401, and an unknown Vendor 404 with VENDOR_NOT_FOUND for the Admin', async () => {
      const vendor = await aVendor();

      await expectErrorResponse(await readCount(vendor.id, null), 401, unauthorized);
      await expectErrorResponse(await readCount(vendor.id, 'nonsense'), 401, unauthorized);
      for (const vendorId of [randomUUID(), 'not-a-vendor']) {
        await expectErrorResponse(
          await readCount(vendorId, await adminToken()),
          404,
          vendorNotFound,
        );
      }
    });
  });
});
