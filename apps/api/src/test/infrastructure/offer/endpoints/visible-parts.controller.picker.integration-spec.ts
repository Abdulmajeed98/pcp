import { randomUUID } from 'node:crypto';

import { bearerHeader, expectErrorResponse, notValid } from '@pcp/core/test-utils';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../../test-utils/database/test-database';
import { emptyTheRealm } from '../../../test-utils/keycloak/keycloak-administrator';

// The picker's two conditions on a Category's Visible Parts, which anyone may
// ask for without a token: in stock only, which keeps the Visible Parts that
// some Vendor has in stock among its Visible Offers (BLD-2), and a Build,
// with which each Part answers whether it is Compatible with it, and the
// Parts that are not are left out unless the switch keeps them (BLD-3,
// CMP-4). A Category page that sends neither is answered as before, as the
// tests of the list and its filters prove.

// A Visible Part as the API answers it, as far as these tests read it, and a
// page of them.
type VisiblePartBody = {
  id: string;
  name: string;
  inStock: boolean;
  compatible?: boolean;
};

type PageOfVisibleParts = {
  content: VisiblePartBody[];
  compatibleCount?: number;
  notCompatibleCount?: number;
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

// A Vendor as the API answers its creation, as far as these tests read it.
type VendorBody = { id: string };

// A Part as the API answers its creation, as far as these tests read it.
type PartBody = { id: string; name: string };

const adminLoginId = randomUUID();

// A moment for the API's clock, and a moment some time after another.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');
const aDay = 24 * 60 * 60 * 1000;
function after(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() + milliseconds);
}

describe("the picker's conditions on a Category's Visible Parts", () => {
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

  // A made-up Part the Admin adds to the catalog, a CPU unless the fields say
  // otherwise, with the specifications given.
  async function aPart(
    name: string,
    {
      category = 'cpu',
      manufacturer = 'Made-up Chips',
      specifications = {} as Record<string, unknown>,
    } = {},
  ): Promise<PartBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ category, name, manufacturer, specifications }),
    });
    expect(response.status).toBe(201);
    return (await response.json()) as PartBody;
  }

  // An Offer the Admin adds for the Vendor, in stock at 500,000 IQD unless
  // the details say otherwise, at the time of the clock.
  async function anOffer(
    vendorId: string,
    partId: string,
    details: Record<string, unknown> = { iqdPrice: 500000, inStock: true },
  ): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ partId, ...details }),
    });
    expect(response.status).toBe(201);
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

  // A Category's Visible Parts, asked for with the query given, the CPUs in
  // dinars unless it says otherwise, each `part` value given as a `part` of
  // its own.
  function readVisibleParts(
    query: Record<string, string>,
    partValues: readonly string[] = [],
  ): Promise<Response> {
    const search = new URLSearchParams({ category: 'cpu', currency: 'IQD', ...query });
    for (const value of partValues) search.append('part', value);
    return fetch(`${testApp.baseUrl}/v1/visible-parts?${search.toString()}`);
  }

  // One page of a Category's Visible Parts, read without a token.
  async function theVisibleParts(
    query: Record<string, string> = {},
    partValues: readonly string[] = [],
  ): Promise<PageOfVisibleParts> {
    const response = await readVisibleParts(query, partValues);
    expect(response.status).toBe(200);
    return (await response.json()) as PageOfVisibleParts;
  }

  // The CPUs' filters, in dinars, with the query given, read without a token.
  async function theFilters(query: Record<string, string> = {}): Promise<unknown> {
    const search = new URLSearchParams({ category: 'cpu', currency: 'IQD', ...query });
    const response = await fetch(
      `${testApp.baseUrl}/v1/visible-parts/filters?${search.toString()}`,
    );
    expect(response.status).toBe(200);
    return response.json();
  }

  // The names of the Visible Parts on the first page, in their order.
  async function theNamesListed(
    query: Record<string, string> = {},
    partValues: readonly string[] = [],
  ): Promise<string[]> {
    return (await theVisibleParts(query, partValues)).content.map(({ name }) => name);
  }

  describe('in stock only', () => {
    it('leaves out a Part whose Offers are all out of stock, one whose only in-stock Offer is an Expired Offer and one whose only in-stock Offer is a deactivated Vendor’s, in the order of the list', async () => {
      const [cheap, dear, outOfStock, expired, deactivated] = [
        await aPart('Made-up cheap CPU'),
        await aPart('Made-up dear CPU'),
        await aPart('Made-up CPU out of stock'),
        await aPart('Made-up CPU in stock only when expired'),
        await aPart('Made-up CPU in stock only at a deactivated Vendor'),
      ];
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      const closed = await aVendor('Made-up closed shop');
      // Confirmed 15 days before the list is read, so an Expired Offer.
      moveTheClockTo(aMovedMoment);
      await anOffer(shop.id, expired.id, { iqdPrice: 100000, inStock: true });
      moveTheClockTo(after(aMovedMoment, 10 * aDay));
      await anOffer(shop.id, cheap.id, { iqdPrice: 200000, inStock: true });
      await anOffer(shop.id, dear.id, { iqdPrice: 900000, inStock: true });
      await anOffer(shop.id, outOfStock.id, { iqdPrice: 150000, inStock: false });
      await anOffer(store.id, expired.id, { iqdPrice: 300000, inStock: false });
      await anOffer(closed.id, deactivated.id, { iqdPrice: 120000, inStock: true });
      await anOffer(shop.id, deactivated.id, { iqdPrice: 130000, inStock: false });
      letTheClockRun();
      await deactivate(closed.id);
      moveTheClockTo(after(aMovedMoment, 15 * aDay));

      // Every one is a Visible Part, listed without the condition.
      expect(await theNamesListed()).toEqual([
        'Made-up cheap CPU',
        'Made-up dear CPU',
        'Made-up CPU in stock only at a deactivated Vendor',
        'Made-up CPU in stock only when expired',
        'Made-up CPU out of stock',
      ]);
      expect(await theVisibleParts({ inStockOnly: 'true' })).toEqual({
        content: [
          expect.objectContaining({ name: 'Made-up cheap CPU', inStock: true }),
          expect.objectContaining({ name: 'Made-up dear CPU', inStock: true }),
        ],
        pageNumber: 0,
        pageSize: 10,
        totalElements: 2,
        totalPages: 1,
        first: true,
        last: true,
      });
      expect(await theNamesListed({ inStockOnly: 'false' })).toHaveLength(5);
    });

    it("gives the filters' values of the Parts in stock alone, still before any choice, while the filters without it give every Visible Part's", async () => {
      const [inStock, outOfStock, expired, deactivated] = [
        await aPart('Made-up CPU in stock', {
          manufacturer: 'AMD',
          specifications: { socket: 'AM5', cores: { total: 6 } },
        }),
        await aPart('Made-up CPU out of stock', {
          manufacturer: 'Intel',
          specifications: { socket: 'LGA 1700', cores: { total: 14 } },
        }),
        await aPart('Made-up CPU in stock only when expired', {
          manufacturer: 'Made-up Chips',
          specifications: { socket: 'AM4', cores: { total: 8 } },
        }),
        await aPart('Made-up CPU in stock only at a deactivated Vendor', {
          manufacturer: 'Made-up Silicon',
          specifications: { socket: 'AM4', cores: { total: 12 } },
        }),
      ];
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      const closed = await aVendor('Made-up closed shop');
      moveTheClockTo(aMovedMoment);
      await anOffer(shop.id, expired.id, { iqdPrice: 100000, inStock: true });
      moveTheClockTo(after(aMovedMoment, 10 * aDay));
      await anOffer(shop.id, inStock.id, { iqdPrice: 200000, inStock: true });
      await anOffer(store.id, inStock.id, { iqdPrice: 250000, inStock: true });
      await anOffer(shop.id, outOfStock.id, { iqdPrice: 150000, inStock: false });
      await anOffer(store.id, expired.id, { iqdPrice: 300000, inStock: false });
      await anOffer(closed.id, deactivated.id, { iqdPrice: 120000, inStock: true });
      await anOffer(shop.id, deactivated.id, { iqdPrice: 130000, inStock: false });
      letTheClockRun();
      await deactivate(closed.id);
      moveTheClockTo(after(aMovedMoment, 15 * aDay));

      expect(await theFilters({ inStockOnly: 'true' })).toEqual({
        manufacturers: ['AMD'],
        filters: [
          { parameter: 'socket', kind: 'text', values: ['AM5'] },
          { parameter: 'cores', kind: 'number', values: [6] },
        ],
        priceRange: { currency: 'IQD', lowest: '200000', highest: '200000' },
      });
      expect(await theFilters({ inStockOnly: 'false' })).toEqual({
        manufacturers: ['AMD', 'Intel', 'Made-up Chips', 'Made-up Silicon'],
        filters: [
          { parameter: 'socket', kind: 'text', values: ['AM4', 'AM5', 'LGA 1700'] },
          { parameter: 'cores', kind: 'number', values: [6, 8, 12, 14] },
        ],
        priceRange: { currency: 'IQD', lowest: '200000', highest: '200000' },
      });
    });
  });

  describe('the Build', () => {
    it('is refused as reading a Build refuses it, naming `part`, for each reason', async () => {
      const [cpu, otherCpu] = [
        await aPart('Made-up CPU'),
        await aPart('Made-up other CPU'),
      ];
      const kits: PartBody[] = [];
      for (const number of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        kits.push(await aPart(`Made-up kit ${number}`, { category: 'ram' }));
      }
      await anOffer((await aVendor()).id, cpu.id);

      for (const [reason, values] of [
        ['notAnIdentifier', ['not-a-part']],
        ['notAQuantity', [`${kits[0].id}:17`]],
        ['repeated', [cpu.id, cpu.id]],
        ['quantityGiven', [`${cpu.id}:1`]],
        ['quantityMissing', [kits[0].id]],
        ['twoOfACategory', [cpu.id, otherCpu.id]],
        ['tooMany', kits.map(({ id }) => `${id}:1`)],
      ] as const) {
        for (const query of [{}, { inStockOnly: 'true' }] as Record<string, string>[]) {
          await expectErrorResponse(await readVisibleParts(query, values), 400, [
            notValid('part', { reason }),
          ]);
        }
      }
    });
  });

  // Each Visible Part on the first page, by its name, with whether it answers
  // that it is Compatible, or `'not answered'` when it says nothing of it.
  async function whetherCompatible(
    query: Record<string, string>,
    partValues: readonly string[],
  ): Promise<[string, boolean | 'not answered'][]> {
    return (await theVisibleParts(query, partValues)).content.map((part) => [
      part.name,
      'compatible' in part ? (part.compatible as boolean) : 'not answered',
    ]);
  }

  describe('Compatible with the Build', () => {
    // A PSU with two 6+2-pin connectors and no 12VHPWR cable, in the Build,
    // and four GPUs, each offered in stock: one rule 11 passes, one it warns
    // of, one it finds a Compatibility Problem in, and one whose power
    // sockets are not known, so that the rule is unchecked.
    async function aPsuAndFourGpus(): Promise<PartBody> {
      const psu = await aPart('Made-up PSU', {
        category: 'psu',
        specifications: { connectors: { pcie_6_plus_2_pin: 2, pcie_12vhpwr: 0 } },
      });
      const sockets = (eight: number, cables: number) => ({
        power_connectors: {
          pcie_6_pin: 0,
          pcie_8_pin: eight,
          pcie_12VHPWR: 0,
          pcie_12V_2x6: cables,
        },
      });
      const shop = await aVendor();
      for (const [name, iqdPrice, specifications] of [
        ['Made-up GPU with a Problem', 200000, sockets(3, 0)],
        ['Made-up GPU that passes', 300000, sockets(2, 0)],
        ['Made-up GPU with a Warning', 400000, sockets(0, 1)],
        ['Made-up GPU a rule cannot check', 500000, {}],
      ] as const) {
        const gpu = await aPart(name, { category: 'gpu', specifications });
        await anOffer(shop.id, gpu.id, { iqdPrice, inStock: true });
      }
      return psu;
    }

    it('leaves out a Part that would cause a Compatibility Problem, and keeps one that causes only a Compatibility Warning and one a rule cannot check, each answering that it is Compatible', async () => {
      const psu = await aPsuAndFourGpus();

      expect(await whetherCompatible({ category: 'gpu' }, [psu.id])).toEqual([
        ['Made-up GPU that passes', true],
        ['Made-up GPU with a Warning', true],
        ['Made-up GPU a rule cannot check', true],
      ]);
    });

    it('keeps a Part that is not Compatible when the switch asks, in its place in the order, answering that it is not', async () => {
      const psu = await aPsuAndFourGpus();

      expect(
        await whetherCompatible({ category: 'gpu', keepNotCompatible: 'true' }, [psu.id]),
      ).toEqual([
        ['Made-up GPU with a Problem', false],
        ['Made-up GPU that passes', true],
        ['Made-up GPU with a Warning', true],
        ['Made-up GPU a rule cannot check', true],
      ]);
    });

    it('answers nothing of it without a Build, whether the switch is on or off', async () => {
      await aPsuAndFourGpus();

      for (const query of [{}, { keepNotCompatible: 'true' }] as Record<string, string>[]) {
        expect(await whetherCompatible({ category: 'gpu', ...query }, [])).toEqual([
          ['Made-up GPU with a Problem', 'not answered'],
          ['Made-up GPU that passes', 'not answered'],
          ['Made-up GPU with a Warning', 'not answered'],
          ['Made-up GPU a rule cannot check', 'not answered'],
        ]);
      }
    });

    // Parts the Admin adds of a Category, each offered in stock by one
    // made-up Vendor at the price given, so that they are listed in the
    // order given, with the specifications given.
    async function partsOffered(
      category: string,
      parts: [name: string, iqdPrice: number, specifications: Record<string, unknown>][],
    ): Promise<PartBody[]> {
      const shop = await aVendor();
      const made = [];
      for (const [name, iqdPrice, specifications] of parts) {
        const offered = await aPart(name, { category, specifications });
        await anOffer(shop.id, offered.id, { iqdPrice, inStock: true });
        made.push(offered);
      }
      return made;
    }

    it("judges a CPU in place of the Build's CPU, not beside it, so that another CPU of the motherboard's socket is kept", async () => {
      const board = await aPart('Made-up AM5 board', {
        category: 'motherboard',
        specifications: { socket: 'AM5' },
      });
      // The Build's CPU is of another socket than its board.
      const [buildsCpu] = await partsOffered('cpu', [
        ["Made-up AM4 CPU, the Build's", 100000, { socket: 'AM4' }],
        ['Made-up AM5 CPU', 200000, { socket: 'AM5' }],
        ['Made-up other AM4 CPU', 300000, { socket: 'AM4' }],
      ]);
      const build = [buildsCpu.id, board.id];

      expect(await whetherCompatible({}, build)).toEqual([['Made-up AM5 CPU', true]]);
      expect(await whetherCompatible({ keepNotCompatible: 'true' }, build)).toEqual([
        ["Made-up AM4 CPU, the Build's", false],
        ['Made-up AM5 CPU', true],
        ['Made-up other AM4 CPU', false],
      ]);
    });

    it("judges a RAM kit beside the Build's kits, so that one that would take the Build past the motherboard's slots is left out, and one the Build holds is counted once more", async () => {
      const board = await aPart('Made-up board of four slots', {
        category: 'motherboard',
        specifications: { memory: { slots: 4 } },
      });
      // The Build holds one kit of two modules.
      const [buildsKit] = await partsOffered('ram', [
        ["Made-up kit of two, the Build's", 100000, { modules: { quantity: 2 } }],
        ['Made-up other kit of two', 200000, { modules: { quantity: 2 } }],
        ['Made-up kit of four', 300000, { modules: { quantity: 4 } }],
        ['Made-up kit of modules not known', 400000, {}],
      ]);
      const build = [board.id, `${buildsKit.id}:1`];

      expect(await whetherCompatible({ category: 'ram' }, build)).toEqual([
        ["Made-up kit of two, the Build's", true],
        ['Made-up other kit of two', true],
        ['Made-up kit of modules not known', true],
      ]);
      expect(
        await whetherCompatible({ category: 'ram', keepNotCompatible: 'true' }, build),
      ).toEqual([
        ["Made-up kit of two, the Build's", true],
        ['Made-up other kit of two', true],
        ['Made-up kit of four', false],
        ['Made-up kit of modules not known', true],
      ]);
      // Two of the Build's kit fill the slots, so one more is one too many.
      expect(
        await whetherCompatible({ category: 'ram', keepNotCompatible: 'true' }, [
          board.id,
          `${buildsKit.id}:2`,
        ]),
      ).toEqual([
        ["Made-up kit of two, the Build's", false],
        ['Made-up other kit of two', false],
        ['Made-up kit of four', false],
        ['Made-up kit of modules not known', true],
      ]);
    });
  });

  describe('the pages', () => {
    // An AM5 board for the Build, and eight CPUs listed in the order of their
    // numbers: five of its socket, one of them out of stock, and three of
    // another.
    async function aBoardAndEightCpus(): Promise<PartBody> {
      const board = await aPart('Made-up AM5 board', {
        category: 'motherboard',
        specifications: { socket: 'AM5' },
      });
      const shop = await aVendor();
      for (const [number, socket, inStock] of [
        [1, 'AM5', true],
        [2, 'AM4', true],
        [3, 'AM5', true],
        [4, 'AM4', true],
        [5, 'AM5', true],
        [6, 'AM5', true],
        [7, 'AM4', true],
        [8, 'AM5', false],
      ] as const) {
        const cpu = await aPart(`Made-up CPU ${number}`, { specifications: { socket } });
        await anOffer(shop.id, cpu.id, { iqdPrice: number * 100000, inStock });
      }
      return board;
    }

    // The names and the paging of a page of two, in stock only.
    async function pageOfTwo(
      page: string,
      query: Record<string, string>,
      build: readonly string[],
    ): Promise<{ names: string[]; paging: Omit<PageOfVisibleParts, 'content'> }> {
      const { content, ...paging } = await theVisibleParts(
        { inStockOnly: 'true', size: '2', page, ...query },
        build,
      );
      return { names: content.map(({ name }) => name), paging };
    }

    // Where a page of two stands among the Parts kept, and how many of the
    // Parts judged against the board are Compatible with it, and not: the
    // four of its socket in stock and the three of another, whatever the
    // switch keeps and whatever the page.
    function pageOf(
      pageNumber: number,
      totalElements: number,
      totalPages: number,
      first: boolean,
      last: boolean,
    ): Omit<PageOfVisibleParts, 'content'> {
      return {
        compatibleCount: 4,
        notCompatibleCount: 3,
        pageNumber,
        pageSize: 2,
        totalElements,
        totalPages,
        first,
        last,
      };
    }

    it('count only the Parts kept, each page full but the last, and a page past the end answers the total', async () => {
      const board = await aBoardAndEightCpus();
      const pages = [];
      for (const page of ['0', '1', '2', '5']) {
        pages.push(await pageOfTwo(page, {}, [board.id]));
      }

      expect(pages).toEqual([
        { names: ['Made-up CPU 1', 'Made-up CPU 3'], paging: pageOf(0, 4, 2, true, false) },
        { names: ['Made-up CPU 5', 'Made-up CPU 6'], paging: pageOf(1, 4, 2, false, true) },
        { names: [], paging: pageOf(2, 4, 2, false, true) },
        { names: [], paging: pageOf(5, 4, 2, false, true) },
      ]);
    });

    it('count the Parts that are not Compatible too when the switch keeps them', async () => {
      const board = await aBoardAndEightCpus();
      const pages = [];
      for (const page of ['0', '3']) {
        pages.push(await pageOfTwo(page, { keepNotCompatible: 'true' }, [board.id]));
      }

      expect(pages).toEqual([
        { names: ['Made-up CPU 1', 'Made-up CPU 2'], paging: pageOf(0, 7, 4, true, false) },
        { names: ['Made-up CPU 7'], paging: pageOf(3, 7, 4, false, true) },
      ]);
    });

    it('answer how many of the Parts judged are Compatible and how many are not in the one statement that reads the list, those the search finds alone', async () => {
      const board = await aBoardAndEightCpus();

      const counted = async (query: Record<string, string>) => {
        const { compatibleCount, notCompatibleCount } = await theVisibleParts(
          { inStockOnly: 'true', size: '2', ...query },
          [board.id],
        );
        return { compatibleCount, notCompatibleCount };
      };
      expect(await counted({})).toEqual({ compatibleCount: 4, notCompatibleCount: 3 });
      expect(await counted({ search: 'CPU 7' })).toEqual({
        compatibleCount: 0,
        notCompatibleCount: 1,
      });
      expect(await counted({ search: 'CPU 8' })).toEqual({
        compatibleCount: 0,
        notCompatibleCount: 0,
      });
      expect(await counted({ inStockOnly: 'false', keepNotCompatible: 'true' })).toEqual({
        compatibleCount: 5,
        notCompatibleCount: 3,
      });
    });

    it('answer no count without a Build, as on a Category page', async () => {
      await aBoardAndEightCpus();

      for (const query of [{}, { keepNotCompatible: 'true' }] as Record<string, string>[]) {
        const page = await theVisibleParts({ inStockOnly: 'true', ...query });
        expect(page).not.toHaveProperty('compatibleCount');
        expect(page).not.toHaveProperty('notCompatibleCount');
      }
    });
  });
});
