import { randomUUID } from 'node:crypto';

import {
  bearerHeader,
  expectErrorResponse,
  type ExpectedErrorResponse,
  notValid,
} from '@pcp/core/test-utils';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import {
  emptyTheDatabase,
  sentWhileTheTableIsHeld,
  takeThePartOutOfTheCatalog,
} from '../../../test-utils/database/test-database';
import { emptyTheRealm } from '../../../test-utils/keycloak/keycloak-administrator';

// Sharing a Build and reading the Shared Build back, by anyone without a
// token (SHR-1, SHR-3, SHR-4). A Shared Build is a frozen copy of a Build's
// Parts and quantities, stored once, which never changes: the same Build
// shared again gives the same one, and any change a new one.

// A Shared Build as sharing answers it.
type SharedBody = { id: string; sharedAt: string };

// A Shared Build as reading it answers it: its frozen `part` values too, and
// the day it was shared with the calendar days since.
type SharedBuildBody = SharedBody & {
  sharedOn: string;
  daysSinceShared: number;
  part: string[];
};

// A Part as the API answers its creation, and a Vendor, as far as these tests
// read them.
type PartBody = { id: string };
type VendorBody = { id: string };

// A Build as `GET v1/build` answers it, as far as these tests read it.
type BuildBody = {
  parts: {
    id: string;
    name: string;
    visible: boolean;
    unstocked: boolean;
    lowestPrice: { shownPrice: { amount: string } } | null;
  }[];
  vendors: { id: string }[];
};

// The refusal of an unknown Shared Build, as a whole.
const sharedBuildNotFound: ExpectedErrorResponse[] = [
  {
    code: 'SHARED_BUILD_NOT_FOUND',
    title: 'shared_build_not_found_title',
    detail: 'shared_build_not_found_details',
  },
];

const adminLoginId = randomUUID();

// A moment for the API's clock, with milliseconds, so that a time stored
// with less precision would show, and a moment some time after another.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');
const aDay = 24 * 60 * 60 * 1000;
function after(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() + milliseconds);
}

describe('a Shared Build', () => {
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

  // A made-up Part the Admin adds to the catalog, a CPU unless the fields say
  // otherwise.
  async function aPart(fields: Record<string, unknown> = {}): Promise<PartBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'cpu',
        name: 'Made-up Ryzen 5 7600',
        manufacturer: 'Made-up Chips',
        ...fields,
      }),
    });
    expect(response.status).toBe(201);
    return (await response.json()) as PartBody;
  }

  // Shares the Build the body gives, with the headers given.
  function share(body: unknown, headers: Record<string, string> = {}): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/shared-builds`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  }

  // Shares the Build of these `part` values without a token, and the Shared
  // Build it answers, with the status it answered.
  async function shared(
    values: readonly string[],
  ): Promise<{ status: number; body: SharedBody }> {
    const response = await share({ part: values });
    return { status: response.status, body: (await response.json()) as SharedBody };
  }

  // Reads the Shared Build with this identifier, with the headers given.
  function readSharedBuild(
    id: string,
    headers: Record<string, string> = {},
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/shared-builds/${id}`, { headers });
  }

  // The Shared Build with this identifier, read without a token.
  async function theSharedBuild(id: string): Promise<SharedBuildBody> {
    const response = await readSharedBuild(id);
    expect(response.status).toBe(200);
    return (await response.json()) as SharedBuildBody;
  }

  // Made-up Vendors are numbered, so that each has a Login phone number of
  // its own.
  let vendors = 0;

  // A made-up Vendor the Admin creates, with a Login of its own. It calls
  // Keycloak, so it runs with the clock running.
  async function aVendor(name: string): Promise<VendorBody> {
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

  // An Offer the Admin adds for the Vendor, with the details given, and its
  // identifier.
  async function anOffer(
    vendorId: string,
    partId: string,
    details: Record<string, unknown>,
  ): Promise<string> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ partId, ...details }),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { id: string }).id;
  }

  // The Admin replaces something the catalog holds: an Offer's details for
  // its Vendor, or a Part's fields.
  async function admin(address: string, change: Record<string, unknown>): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}${address}`, {
      method: 'PUT',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify(change),
    });
    expect(response.status).toBe(200);
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

  // The Build of these `part` values as `GET v1/build` reads it today, in
  // dinars, without a token.
  async function theBuildOf(values: readonly string[]): Promise<BuildBody> {
    const search = new URLSearchParams({ currency: 'IQD' });
    for (const value of values) search.append('part', value);
    const response = await fetch(`${testApp.baseUrl}/v1/build?${search.toString()}`);
    expect(response.status).toBe(200);
    return (await response.json()) as BuildBody;
  }

  describe('sharing a Build', () => {
    it("answers 201 with the Shared Build's identifier and the moment it was shared, by the API's clock", async () => {
      const ryzen = await aPart();
      moveTheClockTo(aMovedMoment);

      const { status, body } = await shared([ryzen.id]);

      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.any(String),
        sharedAt: aMovedMoment.toISOString(),
      });
      expect(body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });

    describe('again', () => {
      // A Build of a CPU, a motherboard, two RAM kits and a drive, with the
      // `part` values that name it as first shared.
      async function aBuild(): Promise<{
        cpu: string;
        board: string;
        kitX: string;
        kitY: string;
        drive: string;
        values: string[];
      }> {
        const cpu = (await aPart({ category: 'cpu', name: 'Made-up CPU' })).id;
        const board = (await aPart({ category: 'motherboard', name: 'Made-up board' })).id;
        const kitX = (await aPart({ category: 'ram', name: 'Made-up kit X' })).id;
        const kitY = (await aPart({ category: 'ram', name: 'Made-up kit Y' })).id;
        const drive = (await aPart({ category: 'storage', name: 'Made-up drive' })).id;
        return {
          cpu,
          board,
          kitX,
          kitY,
          drive,
          values: [cpu, board, `${kitX}:2`, `${kitY}:1`, `${drive}:1`],
        };
      }

      it('answers 200 with the same Shared Build, as it was first shared, for the same Build, its single Parts given in another order and its identifiers in capitals', async () => {
        const { cpu, board, kitX, kitY, drive, values } = await aBuild();
        moveTheClockTo(aMovedMoment);
        const first = await shared(values);
        expect(first.status).toBe(201);

        moveTheClockTo(after(aMovedMoment, aDay));
        for (const again of [
          values,
          [`${drive}:1`, board, `${kitX}:2`, cpu, `${kitY}:1`],
          [
            cpu.toUpperCase(),
            board.toUpperCase(),
            `${kitX.toUpperCase()}:2`,
            `${kitY.toUpperCase()}:01`,
            `${drive.toUpperCase()}:1`,
          ],
        ]) {
          expect(await shared(again)).toEqual({ status: 200, body: first.body });
        }
        expect((await theSharedBuild(first.body.id)).sharedAt).toBe(
          aMovedMoment.toISOString(),
        );
      });

      it('answers 201 with a new Shared Build for any change, and the first still holds what it held: a quantity changed, a Part replaced, a Part added, and the RAM kits in another order', async () => {
        const { cpu, board, kitX, kitY, drive, values } = await aBuild();
        const otherBoard = (
          await aPart({ category: 'motherboard', name: 'Made-up board 2' })
        ).id;
        const pcCase = (await aPart({ category: 'case', name: 'Made-up case' })).id;
        const first = await shared(values);

        const identifiers = new Set([first.body.id]);
        for (const changed of [
          [cpu, board, `${kitX}:3`, `${kitY}:1`, `${drive}:1`],
          [cpu, otherBoard, `${kitX}:2`, `${kitY}:1`, `${drive}:1`],
          [...values, pcCase],
          [cpu, board, `${kitY}:1`, `${kitX}:2`, `${drive}:1`],
        ]) {
          const answer = await shared(changed);
          expect(answer.status).toBe(201);
          identifiers.add(answer.body.id);
        }

        expect(identifiers.size).toBe(5);
        expect((await theSharedBuild(first.body.id)).part).toEqual(values);
      });

      it('makes one Shared Build of shares of one Build sent at once: one is answered 201 and the others 200, all with its identifier', async () => {
        const { values } = await aBuild();

        // Sent while the table is held, so that all of them reach it at
        // once.
        const answers = await sentWhileTheTableIsHeld('shared_build', 8, () =>
          Promise.all(Array.from({ length: 8 }, () => shared(values))),
        );

        expect(new Set(answers.map(({ body }) => body.id)).size).toBe(1);
        expect(answers.map(({ status }) => status).sort()).toEqual([
          200, 200, 200, 200, 200, 200, 200, 201,
        ]);
      });
    });

    describe('a Part the catalog does not hold', () => {
      it('is left out of the frozen copy, with its quantity or without, and the Build without it is the same Shared Build', async () => {
        const ryzen = await aPart();
        const kit = await aPart({ category: 'ram', name: 'Made-up kit' });

        const withUnknown = await shared([
          randomUUID(),
          `${kit.id}:2`,
          `${randomUUID()}:3`,
          ryzen.id,
        ]);

        expect(withUnknown.status).toBe(201);
        expect((await theSharedBuild(withUnknown.body.id)).part).toEqual([
          ryzen.id,
          `${kit.id}:2`,
        ]);
        expect(await shared([ryzen.id, `${kit.id}:2`])).toEqual({
          status: 200,
          body: withUnknown.body,
        });
      });
    });

    describe('its refusals', () => {
      // The refusal of a Build, naming `part`, for its reason.
      function refusedFor(reason: string): ExpectedErrorResponse[] {
        return [notValid('part', { reason })];
      }

      it('refuse a Build of Parts the catalog does not hold alone, and an empty Build, as `empty`, naming `part`', async () => {
        await expectErrorResponse(
          await share({ part: [randomUUID(), `${randomUUID()}:2`] }),
          400,
          refusedFor('empty'),
        );
        await expectErrorResponse(await share({ part: [] }), 400, refusedFor('empty'));
      });

      it('refuse each Build that `GET v1/build` refuses, naming `part`, for the same reason', async () => {
        const ryzen = await aPart();
        const other = await aPart({ name: 'Made-up Ryzen 7 7700' });
        const kit = await aPart({ category: 'ram', name: 'Made-up kit' });
        const kits: string[] = [];
        for (let number = 1; number <= 9; number += 1) {
          kits.push(
            `${(await aPart({ category: 'ram', name: `Made-up kit ${number}` })).id}:1`,
          );
        }

        for (const [values, reason] of [
          [['not-a-part'], 'notAnIdentifier'],
          [[ryzen.id, ` ${kit.id}:2`], 'notAnIdentifier'],
          [[`${kit.id}:0`], 'notAQuantity'],
          [[`${kit.id}:17`], 'notAQuantity'],
          [[`${kit.id}:٢`], 'notAQuantity'],
          [[`${randomUUID()}:x`], 'notAQuantity'],
          [[ryzen.id, ryzen.id.toUpperCase()], 'repeated'],
          [[`${ryzen.id}:1`], 'quantityGiven'],
          [[kit.id], 'quantityMissing'],
          [[ryzen.id, other.id], 'twoOfACategory'],
          [kits, 'tooMany'],
        ] as const) {
          await expectErrorResponse(await share({ part: values }), 400, refusedFor(reason));
        }
      });

      it('refuse a request with no `part`, or with a `part` that is not a list of texts, naming `part`, and a field the request does not take, naming it', async () => {
        const ryzen = await aPart();

        for (const body of [{}, { part: ryzen.id }, { part: [1] }, { part: null }]) {
          await expectErrorResponse(await share(body), 400, [notValid('part')]);
        }
        await expectErrorResponse(
          await share({ part: [ryzen.id], name: 'My Build' }),
          400,
          [notValid('name')],
        );
      });
    });
  });

  describe('reading a Shared Build', () => {
    it("answers its frozen `part` values, lower-case identifiers in the catalog's order of Categories and the Build's order of RAM kits and drives, each kit or drive with its quantity, and the moment it was shared, with its day and the days since", async () => {
      const [psu, driveA, cpu, kitX, driveB, kitY, board] = [
        await aPart({ category: 'psu', name: 'Made-up 750 W PSU' }),
        await aPart({ category: 'storage', name: 'Made-up drive A' }),
        await aPart({ category: 'cpu', name: 'Made-up CPU' }),
        await aPart({ category: 'ram', name: 'Made-up kit X' }),
        await aPart({ category: 'storage', name: 'Made-up drive B' }),
        await aPart({ category: 'ram', name: 'Made-up kit Y' }),
        await aPart({ category: 'motherboard', name: 'Made-up board' }),
      ];
      moveTheClockTo(aMovedMoment);
      const { body } = await shared([
        psu.id,
        `${driveA.id.toUpperCase()}:1`,
        cpu.id.toUpperCase(),
        `${kitX.id}:2`,
        `${driveB.id}:16`,
        `${kitY.id}:01`,
        board.id,
      ]);

      moveTheClockTo(after(aMovedMoment, aDay));
      expect(await theSharedBuild(body.id)).toEqual({
        id: body.id,
        sharedAt: aMovedMoment.toISOString(),
        sharedOn: '2027-03-14',
        daysSinceShared: 1,
        part: [
          cpu.id,
          board.id,
          `${kitX.id}:2`,
          `${kitY.id}:1`,
          `${driveA.id}:1`,
          `${driveB.id}:16`,
          psu.id,
        ],
      });
    });

    describe("answers the day it was shared in Iraq's time, and the calendar days since, by the API's clock", () => {
      // Iraq is three hours ahead of UTC all year, so 20:00 in UTC is 23:00
      // in Iraq, and 21:30 in UTC 00:30 the next day there.
      async function sharedAndReadAt(sharedAt: string, readAt: string) {
        const ryzen = await aPart();
        moveTheClockTo(new Date(sharedAt));
        const { body } = await shared([ryzen.id]);
        moveTheClockTo(new Date(readAt));
        return theSharedBuild(body.id);
      }

      it('1 day for a Build shared at 23:00 and read at 08:00 the next morning, its day the one it was shared on', async () => {
        expect(
          await sharedAndReadAt('2026-11-16T20:00:00.000Z', '2026-11-17T05:00:00.000Z'),
        ).toMatchObject({
          sharedAt: '2026-11-16T20:00:00.000Z',
          sharedOn: '2026-11-16',
          daysSinceShared: 1,
        });
      });

      it("0 days for a Build shared at 00:30 and read at 23:30 the same day, its day Iraq's, not UTC's", async () => {
        expect(
          await sharedAndReadAt('2026-11-15T21:30:00.000Z', '2026-11-16T20:30:00.000Z'),
        ).toMatchObject({
          sharedAt: '2026-11-15T21:30:00.000Z',
          sharedOn: '2026-11-16',
          daysSinceShared: 0,
        });
      });

      it("counts calendar days across a month's end and a year's, from Iraq's first minute of the year to the last of the twelfth day", async () => {
        expect(
          await sharedAndReadAt('2026-12-31T21:00:00.000Z', '2027-01-12T20:59:59.999Z'),
        ).toMatchObject({ sharedOn: '2027-01-01', daysSinceShared: 11 });
        expect(
          await sharedAndReadAt('2026-11-30T20:59:59.999Z', '2026-12-01T21:00:00.000Z'),
        ).toMatchObject({ sharedOn: '2026-11-30', daysSinceShared: 2 });
      });
    });

    it('answers an identifier that names no Shared Build, and a text that is not an identifier, 404 with SHARED_BUILD_NOT_FOUND', async () => {
      const ryzen = await aPart();
      const { body } = await shared([ryzen.id]);

      for (const id of [
        randomUUID(),
        'not-a-shared-build',
        `${body.id}0`,
        body.id.slice(1),
      ]) {
        await expectErrorResponse(await readSharedBuild(id), 404, sharedBuildNotFound);
      }
    });

    describe('never changes', () => {
      // A Build of a CPU one Vendor has in stock and two of a RAM kit another
      // has, shared, with its frozen values and the Offers.
      async function aSharedBuildOnSale(): Promise<{
        ryzen: string;
        kit: string;
        cpuVendor: VendorBody;
        kitVendor: VendorBody;
        ryzenOffer: string;
        kitOffer: string;
        sharedBuild: SharedBody;
        frozen: string[];
      }> {
        const ryzen = (await aPart({ name: 'Made-up Ryzen 5 7600' })).id;
        const kit = (await aPart({ category: 'ram', name: 'Made-up 32 GB kit' })).id;
        const cpuVendor = await aVendor('Made-up Computer Corner');
        const kitVendor = await aVendor('Made-up Computer House');
        const ryzenOffer = await anOffer(cpuVendor.id, ryzen, {
          iqdPrice: 300000,
          inStock: true,
        });
        const kitOffer = await anOffer(kitVendor.id, kit, {
          iqdPrice: 100000,
          inStock: true,
        });
        const frozen = [ryzen, `${kit}:2`];
        moveTheClockTo(aMovedMoment);
        const sharedBuild = (await shared(frozen)).body;
        letTheClockRun();

        const today = await theBuildOf(frozen);
        expect(
          today.parts.map(({ lowestPrice }) => lowestPrice?.shownPrice.amount),
        ).toEqual(['300000', '100000']);
        expect(today.vendors.map(({ id }) => id).sort()).toEqual(
          [cpuVendor.id, kitVendor.id].sort(),
        );
        return {
          ryzen,
          kit,
          cpuVendor,
          kitVendor,
          ryzenOffer,
          kitOffer,
          sharedBuild,
          frozen,
        };
      }

      // The Shared Build still holds what it was shared with, when it was
      // shared, and sharing the same Build again still answers it.
      async function expectItAsShared(sharedBuild: SharedBody, frozen: string[]) {
        expect(await theSharedBuild(sharedBuild.id)).toMatchObject({
          ...sharedBuild,
          part: frozen,
        });
        expect(await shared(frozen)).toEqual({ status: 200, body: sharedBuild });
      }

      it("when an Offer's price changes, while `GET v1/build` with its values answers the new price", async () => {
        const { ryzen, cpuVendor, ryzenOffer, sharedBuild, frozen } =
          await aSharedBuildOnSale();

        await admin(`/v1/vendors/${cpuVendor.id}/offers/${ryzenOffer}`, {
          iqdPrice: 280000,
          inStock: true,
        });

        await expectItAsShared(sharedBuild, frozen);
        const today = await theBuildOf(frozen);
        expect(
          today.parts.find(({ id }) => id === ryzen)?.lowestPrice?.shownPrice.amount,
        ).toBe('280000');
      });

      it('when an Offer is put out of stock, while `GET v1/build` with its values answers its Part as an Unstocked Part', async () => {
        const { kit, kitVendor, kitOffer, sharedBuild, frozen } =
          await aSharedBuildOnSale();

        await admin(`/v1/vendors/${kitVendor.id}/offers/${kitOffer}`, {
          iqdPrice: 100000,
          inStock: false,
        });

        await expectItAsShared(sharedBuild, frozen);
        const today = await theBuildOf(frozen);
        expect(today.parts.find(({ id }) => id === kit)).toMatchObject({
          unstocked: true,
          lowestPrice: null,
        });
        expect(today.vendors.map(({ id }) => id)).not.toContain(kitVendor.id);
      });

      it('when a Vendor is deactivated, while `GET v1/build` with its values answers its Part as no longer a Visible Part and the Vendor gone from the second view', async () => {
        const { ryzen, cpuVendor, sharedBuild, frozen } = await aSharedBuildOnSale();

        await deactivate(cpuVendor.id);

        await expectItAsShared(sharedBuild, frozen);
        const today = await theBuildOf(frozen);
        expect(today.parts.find(({ id }) => id === ryzen)).toMatchObject({
          visible: false,
          unstocked: true,
        });
        expect(today.vendors.map(({ id }) => id)).not.toContain(cpuVendor.id);
      });

      it('when a Part is edited, while `GET v1/build` with its values answers the Part as it now is', async () => {
        const { ryzen, sharedBuild, frozen } = await aSharedBuildOnSale();

        await admin(`/v1/parts/${ryzen}`, {
          name: 'Made-up Ryzen 5 7600X',
          manufacturer: 'Made-up Chips',
        });

        await expectItAsShared(sharedBuild, frozen);
        expect((await theBuildOf(frozen)).parts.find(({ id }) => id === ryzen)?.name).toBe(
          'Made-up Ryzen 5 7600X',
        );
      });

      it('when a Part leaves the catalog, which it keeps among its values, while `GET v1/build` with them leaves the Part out, and so with every Part gone', async () => {
        const ryzen = (await aPart({ name: 'Made-up Ryzen 5 7600' })).id;
        const board = (await aPart({ category: 'motherboard', name: 'Made-up board' })).id;
        const frozen = [ryzen, board];
        const sharedBuild = (await shared(frozen)).body;

        await takeThePartOutOfTheCatalog(board);
        expect(await theSharedBuild(sharedBuild.id)).toMatchObject({
          ...sharedBuild,
          part: frozen,
        });
        expect((await theBuildOf(frozen)).parts.map(({ id }) => id)).toEqual([ryzen]);

        await takeThePartOutOfTheCatalog(ryzen);
        expect(await theSharedBuild(sharedBuild.id)).toMatchObject({
          ...sharedBuild,
          part: frozen,
        });
        expect((await theBuildOf(frozen)).parts).toEqual([]);
      });
    });
  });

  describe('who may share a Build and read a Shared Build', () => {
    it("is anyone: both answer the same without a token and with any token, an Admin's or a Vendor's among them", async () => {
      const ryzen = await aPart();
      const kit = await aPart({ category: 'ram', name: 'Made-up kit' });
      const values = [ryzen.id, `${kit.id}:2`];
      const first = await shared(values);
      expect(first.status).toBe(201);
      const read = await theSharedBuild(first.body.id);

      const tokens = [
        await adminToken(),
        await testApp.tokenOf({ subject: randomUUID(), roles: ['vendor'] }),
        await testApp.tokenOf({ roles: ['shopper'] }),
        await testApp.tokenOf({
          roles: ['admin'],
          expiresAt: new Date(Date.now() - 60_000),
        }),
        'nonsense',
      ];
      for (const token of tokens) {
        const again = await share({ part: values }, bearerHeader(token));
        expect(again.status).toBe(200);
        expect(await again.json()).toEqual(first.body);

        const readAgain = await readSharedBuild(first.body.id, bearerHeader(token));
        expect(readAgain.status).toBe(200);
        expect(await readAgain.json()).toEqual(read);
      }
    });

    it('is anyone for a new Build and a refusal too, with a token that is not good', async () => {
      const ryzen = await aPart();

      const response = await share({ part: [ryzen.id] }, bearerHeader('nonsense'));
      expect(response.status).toBe(201);
      await expectErrorResponse(await share({ part: [] }, bearerHeader('nonsense')), 400, [
        notValid('part', { reason: 'empty' }),
      ]);
      await expectErrorResponse(
        await readSharedBuild(randomUUID(), bearerHeader('nonsense')),
        404,
        sharedBuildNotFound,
      );
    });
  });
});
