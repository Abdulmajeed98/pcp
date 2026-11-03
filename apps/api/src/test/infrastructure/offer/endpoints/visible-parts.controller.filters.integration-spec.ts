import { randomUUID } from 'node:crypto';

import { bearerHeader, expectErrorResponse, notValid } from '@pcp/core/test-utils';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import {
  emptyTheDatabase,
  keepSpecificationsAsTheyAre,
} from '../../../test-utils/database/test-database';
import { emptyTheRealm } from '../../../test-utils/keycloak/keycloak-administrator';

// A Category's filters, which anyone may read without a token: its
// manufacturers, the key specifications of BRW-2's table, each with the
// values its Visible Parts hold, and the range of their Lowest Prices in the
// chosen currency. A Category's list of Visible Parts is narrowed by them:
// several values of one filter find a Part with any of them, and different
// filters must all match.

// The currencies a Shopper may choose.
type Currency = 'USD' | 'IQD';

// One of a Category's filters as the API answers it.
type FilterBody = {
  parameter: string;
  kind: 'number' | 'text' | 'yesNo';
  unit?: string;
  values: (string | number | boolean)[];
};

// A Category's filters as the API answers them.
type FiltersBody = {
  manufacturers: string[];
  filters: FilterBody[];
  priceRange: { currency: Currency; lowest: string | null; highest: string | null };
};

// A Vendor as the API answers it, as far as these tests read it.
type VendorBody = { id: string; name: string };

// A Part as the API answers it, as far as these tests read it.
type PartBody = { id: string; name: string };

// A page of Visible Parts, as far as these tests read it.
type PageOfVisibleParts = { content: { name: string }[]; totalElements: number };

const adminLoginId = randomUUID();

// A moment for the API's clock, and a day of 24 hours after it.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');
const aDay = 24 * 60 * 60 * 1000;

describe("a Category's filters and its price range", () => {
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

  // A made-up Part the Admin adds to the catalog, with the specifications
  // given.
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

  // An Offer the Admin adds for the Vendor, with the clock as it is.
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

  // The Admin sets the Platform Rate, in whole dinars per dollar.
  async function setThePlatformRate(iqdPerUsd: number): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/platform-rate`, {
      method: 'PUT',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ iqdPerUsd }),
    });
    expect(response.status).toBe(200);
  }

  // The Admin deactivates a Vendor. It calls Keycloak, so it runs with the
  // clock running.
  async function deactivate(vendorId: string): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/deactivate`, {
      method: 'POST',
      headers: bearerHeader(await adminToken()),
    });
    expect(response.status).toBe(200);
  }

  // A query as a test writes it: a parameter given several values repeats.
  type Query = Record<string, string | string[]>;
  function queryOf(query: Query): string {
    const search = new URLSearchParams();
    for (const [name, values] of Object.entries(query)) {
      for (const value of [values].flat()) search.append(name, value);
    }
    return search.toString();
  }

  // A Category's filters, asked for with the query given, and the headers
  // given.
  function readFilters(query: Query, headers: Record<string, string> = {}) {
    return fetch(`${testApp.baseUrl}/v1/visible-parts/filters?${queryOf(query)}`, {
      headers,
    });
  }

  // A Category's filters, read without a token, the CPUs' in dinars unless the
  // query says otherwise.
  async function theFilters(query: Query = {}): Promise<FiltersBody> {
    const response = await readFilters({ category: 'cpu', currency: 'IQD', ...query });
    expect(response.status).toBe(200);
    return (await response.json()) as FiltersBody;
  }

  // A Category's Visible Parts, asked for with the query given.
  function readVisibleParts(query: Query): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/visible-parts?${queryOf(query)}`);
  }

  // The names of the Visible Parts listed, in their order, read without a
  // token, the CPUs in dinars unless the query says otherwise.
  async function theNamesListed(query: Query = {}): Promise<string[]> {
    const response = await readVisibleParts({
      category: 'cpu',
      currency: 'IQD',
      size: '100',
      ...query,
    });
    expect(response.status).toBe(200);
    return ((await response.json()) as PageOfVisibleParts).content.map(({ name }) => name);
  }

  describe('the answer', () => {
    it("gives the Category's manufacturers, each of its filters with the values its Visible Parts hold, and the range of their Lowest Prices", async () => {
      const zen = await aPart('Made-up Ryzen 7 7700', {
        manufacturer: 'AMD',
        specifications: { socket: 'AM5', cores: { total: 8 } },
      });
      const raptor = await aPart('Made-up Core i5 13600', {
        manufacturer: 'Intel',
        specifications: { socket: 'LGA 1700', cores: { total: 14 } },
      });
      const shop = await aVendor();
      await anOffer(shop.id, zen.id, { iqdPrice: 525000, inStock: true });
      await anOffer(shop.id, raptor.id, { iqdPrice: 410000, inStock: true });

      expect(await theFilters()).toEqual({
        manufacturers: ['AMD', 'Intel'],
        filters: [
          { parameter: 'socket', kind: 'text', values: ['AM5', 'LGA 1700'] },
          { parameter: 'cores', kind: 'number', values: [8, 14] },
        ],
        priceRange: { currency: 'IQD', lowest: '410000', highest: '525000' },
      });
    });
  });

  describe("a filter's values", () => {
    it('come only from Visible Parts: not from a Part with no Offer, one whose only Offer is an Expired Offer, or one whose only Vendor is deactivated', async () => {
      const shop = await aVendor();
      const leaving = await aVendor('Made-up Computer Store');
      const visible = await aPart('Made-up Ryzen 7 7700', {
        manufacturer: 'AMD',
        specifications: { socket: 'AM5', cores: { total: 8 } },
      });
      await aPart('Made-up Core i9 14900', {
        manufacturer: 'Intel',
        specifications: { socket: 'LGA 1700', cores: { total: 24 } },
      });
      const expired = await aPart('Made-up Threadripper 7960X', {
        manufacturer: 'Made-up Server Chips',
        specifications: { socket: 'sTR5', cores: { total: 24 } },
      });
      const ofTheLeaving = await aPart('Made-up Ryzen 5 5600', {
        manufacturer: 'Made-up Old Chips',
        specifications: { socket: 'AM4', cores: { total: 6 } },
      });
      moveTheClockTo(aMovedMoment);
      await anOffer(shop.id, expired.id, { iqdPrice: 2000000, inStock: true });
      moveTheClockTo(new Date(aMovedMoment.getTime() + 10 * aDay));
      await anOffer(shop.id, visible.id, { iqdPrice: 525000, inStock: true });
      await anOffer(leaving.id, ofTheLeaving.id, { iqdPrice: 99000, inStock: true });
      letTheClockRun();
      await deactivate(leaving.id);
      // 14 days and 1 ms after its Confirmation, the first Offer has expired,
      // and the others have not.
      moveTheClockTo(new Date(aMovedMoment.getTime() + 14 * aDay + 1));

      expect(await theFilters()).toEqual({
        manufacturers: ['AMD'],
        filters: [
          { parameter: 'socket', kind: 'text', values: ['AM5'] },
          { parameter: 'cores', kind: 'number', values: [8] },
        ],
        priceRange: { currency: 'IQD', lowest: '525000', highest: '525000' },
      });
    });

    it('are each given once, numbers by size and text alphabetically, and the manufacturers alphabetically too', async () => {
      const shop = await aVendor();
      const parts = [
        ['Made-up Core i5 13600', 'Intel', 'LGA 1700', 14],
        ['Made-up Ryzen 9 7950X', 'AMD', 'AM5', 16],
        ['Made-up Ryzen 5 5600', 'AMD', 'AM4', 6],
        ['Made-up Ryzen 7 7700', 'AMD', 'AM5', 8],
        ['Made-up Core i3 12100', 'Intel', 'LGA 1700', 4],
      ] as const;
      for (const [name, manufacturer, socket, cores] of parts) {
        const made = await aPart(name, {
          manufacturer,
          specifications: { socket, cores: { total: cores } },
        });
        await anOffer(shop.id, made.id);
      }

      expect(await theFilters()).toMatchObject({
        manufacturers: ['AMD', 'Intel'],
        filters: [
          { parameter: 'socket', values: ['AM4', 'AM5', 'LGA 1700'] },
          // Not 14, 16, 4, 6, 8, as text would order them.
          { parameter: 'cores', values: [4, 6, 8, 14, 16] },
        ],
      });
    });

    it("stay the same whatever filters the list was asked with, each from every Visible Part, also one missing another filter's specification", async () => {
      const shop = await aVendor();
      const parts = [
        ['Made-up Ryzen 7 7700', { socket: 'AM5', cores: { total: 8 } }],
        ['Made-up Ryzen 5 5600', { socket: 'AM4' }],
        ['Made-up Core i5 13600', { cores: { total: 14 } }],
      ] as const;
      for (const [name, specifications] of parts) {
        await anOffer(shop.id, (await aPart(name, { specifications })).id);
      }
      const before = await theFilters();

      // The filters a Shopper chose find one Part.
      expect(await theNamesListed({ socket: 'AM5', cores: '8' })).toEqual([
        'Made-up Ryzen 7 7700',
      ]);
      expect(await theFilters()).toEqual(before);
      expect(before.filters).toEqual([
        { parameter: 'socket', kind: 'text', values: ['AM4', 'AM5'] },
        { parameter: 'cores', kind: 'number', values: [8, 14] },
      ]);
    });

    it('leave out a filter no Visible Part holds a value of, and a 0 that stands for "not known"', async () => {
      const shop = await aVendor();
      const socketOnly = await aPart('Made-up Ryzen 7 7700', {
        specifications: { socket: 'AM5' },
      });
      const unknownCores = await aPart('Made-up Ryzen 5 5600', {
        specifications: { socket: 'AM4' },
      });
      // A 0 cores, kept from before 0 stood for "not known".
      await keepSpecificationsAsTheyAre(unknownCores.id, {
        socket: 'AM4',
        cores: { total: 0 },
      });
      await anOffer(shop.id, socketOnly.id);
      await anOffer(shop.id, unknownCores.id);

      expect((await theFilters()).filters).toEqual([
        { parameter: 'socket', kind: 'text', values: ['AM4', 'AM5'] },
      ]);
    });

    it('give yes or no as true and false, and a number with its unit', async () => {
      const shop = await aVendor();
      const coolers = [
        ['Made-up Tower Cooler', { water_cooled: false }],
        ['Made-up Liquid Cooler 240', { water_cooled: true, radiator_size: 240 }],
        ['Made-up Liquid Cooler 360', { water_cooled: true, radiator_size: 360 }],
      ] as const;
      for (const [name, specifications] of coolers) {
        const made = await aPart(name, { category: 'cpuCooler', specifications });
        await anOffer(shop.id, made.id);
      }

      expect((await theFilters({ category: 'cpuCooler' })).filters).toEqual([
        { parameter: 'waterCooled', kind: 'yesNo', values: [false, true] },
        { parameter: 'radiatorSize', kind: 'number', unit: 'mm', values: [240, 360] },
      ]);
    });

    it('are none, with no manufacturer, for a Category with no Visible Part', async () => {
      await aPart('Made-up Ryzen 7 7700', { specifications: { socket: 'AM5' } });

      expect(await theFilters()).toEqual({
        manufacturers: [],
        filters: [],
        priceRange: { currency: 'IQD', lowest: null, highest: null },
      });
    });
  });

  describe("the range's ends", () => {
    it('are the lowest and the highest Lowest Price in the asked currency, as each is answered', async () => {
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      await setThePlatformRate(1575);
      const quotedInDollars = await aPart('Made-up Ryzen 5 7600');
      const quotedInDinars = await aPart('Made-up Ryzen 7 7700');
      const dearest = await aPart('Made-up Ryzen 9 7950X');
      await anOffer(shop.id, quotedInDollars.id, { usdPrice: '158.80', inStock: true });
      await anOffer(shop.id, quotedInDinars.id, { iqdPrice: 410000, inStock: true });
      await anOffer(shop.id, dearest.id, { usdPrice: '549.00', inStock: true });
      // Out of stock, so that it is no Lowest Price.
      await anOffer(store.id, dearest.id, { usdPrice: '999.00', inStock: false });

      // 158.80 $ at 1,575 is 250,110 IQD, which rounds to 250,000; 549 $ is
      // 864,675 IQD, which rounds to 864,750.
      expect((await theFilters({ currency: 'IQD' })).priceRange).toEqual({
        currency: 'IQD',
        lowest: '250000',
        highest: '864750',
      });
      // 410,000 IQD at 1,575 is 260.32 $, which rounds to 260 $.
      expect((await theFilters({ currency: 'USD' })).priceRange).toEqual({
        currency: 'USD',
        lowest: '158.80',
        highest: '549.00',
      });
    });

    it('are null when no Visible Part has a Lowest Price, and leave out a Part with none', async () => {
      const shop = await aVendor();
      const outOfStock = await aPart('Made-up Ryzen 5 7600');
      await anOffer(shop.id, outOfStock.id, { iqdPrice: 99000, inStock: false });
      // Quoted only in dollars, with no Platform Rate to show it in dinars.
      const unconverted = await aPart('Made-up Ryzen 7 7700');
      await anOffer(shop.id, unconverted.id, { usdPrice: '300.00', inStock: true });

      expect((await theFilters()).priceRange).toEqual({
        currency: 'IQD',
        lowest: null,
        highest: null,
      });

      const priced = await aPart('Made-up Ryzen 9 7950X');
      await anOffer(shop.id, priced.id, { iqdPrice: 800000, inStock: true });
      expect((await theFilters()).priceRange).toEqual({
        currency: 'IQD',
        lowest: '800000',
        highest: '800000',
      });
    });
  });

  describe('narrowing the list', () => {
    // Every Category's filters, each with its place in a Part's document as
    // OpenDB writes it, and values the specification takes: two to ask for
    // and, where the specification has more than two, one not asked for.
    const everyFilter: {
      category: string;
      parameter: string;
      path: string;
      values: (string | number | boolean)[];
    }[] = [
      {
        category: 'cpu',
        parameter: 'socket',
        path: 'socket',
        values: ['AM5', 'AM4', 'LGA 1700'],
      },
      { category: 'cpu', parameter: 'cores', path: 'cores.total', values: [8, 6, 12] },
      {
        category: 'cpuCooler',
        parameter: 'waterCooled',
        path: 'water_cooled',
        values: [true, false],
      },
      {
        category: 'cpuCooler',
        parameter: 'radiatorSize',
        path: 'radiator_size',
        values: [240, 360, 280],
      },
      {
        category: 'motherboard',
        parameter: 'socket',
        path: 'socket',
        values: ['AM5', 'LGA 1700', 'AM4'],
      },
      {
        category: 'motherboard',
        parameter: 'formFactor',
        path: 'form_factor',
        values: ['ATX', 'Micro ATX', 'Mini-ITX'],
      },
      {
        category: 'motherboard',
        parameter: 'ramType',
        path: 'memory.ram_type',
        values: ['DDR5', 'DDR4', 'DDR3'],
      },
      {
        category: 'ram',
        parameter: 'ramType',
        path: 'ram_type',
        values: ['DDR5', 'DDR4', 'DDR3'],
      },
      { category: 'ram', parameter: 'capacity', path: 'capacity', values: [32, 64, 16] },
      { category: 'ram', parameter: 'speed', path: 'speed', values: [6000, 5600, 3200] },
      {
        category: 'storage',
        parameter: 'driveType',
        path: 'storage_type',
        values: ['SSD', 'HDD', 'SSHD'],
      },
      {
        category: 'storage',
        parameter: 'capacity',
        path: 'capacity',
        values: [1000, 2000, 500],
      },
      {
        category: 'storage',
        parameter: 'interface',
        path: 'interface',
        values: ['M.2 PCIe 4.0 x4', 'SATA 6.0 Gb/s', 'M.2 PCIe 5.0 x4'],
      },
      {
        category: 'gpu',
        parameter: 'chipset',
        path: 'chipset',
        values: ['GeForce RTX 4070', 'Radeon RX 7800 XT', 'GeForce RTX 4090'],
      },
      { category: 'gpu', parameter: 'memory', path: 'memory', values: [12, 16, 24] },
      {
        category: 'case',
        parameter: 'formFactor',
        path: 'form_factor',
        values: ['ATX Mid Tower', 'Mini ITX Tower', 'ATX Full Tower'],
      },
      { category: 'psu', parameter: 'wattage', path: 'wattage', values: [750, 850, 1000] },
      {
        category: 'psu',
        parameter: 'efficiencyRating',
        path: 'efficiency_rating',
        values: ['80+ Gold', '80+ Platinum', '80+ Bronze'],
      },
    ];

    // A Part's specifications holding each value at its path.
    function documentOf(held: [string, unknown][]): Record<string, unknown> {
      const document: Record<string, unknown> = {};
      for (const [path, value] of held) {
        const names = path.split('.');
        const last = names.pop() as string;
        let node = document;
        for (const name of names) {
          node[name] ??= {};
          node = node[name] as Record<string, unknown>;
        }
        node[last] = value;
      }
      return document;
    }

    // A made-up Part of the Category, holding the specifications given, that
    // a Vendor offers at the same price as every other, so that the list
    // orders them by name.
    async function anOfferedPart(
      vendorId: string,
      category: string,
      name: string,
      held: [string, unknown][],
      manufacturer?: string,
    ): Promise<void> {
      const made = await aPart(name, {
        category,
        specifications: documentOf(held),
        ...(manufacturer === undefined ? {} : { manufacturer }),
      });
      await anOffer(vendorId, made.id);
    }

    for (const { category, parameter, path, values } of everyFilter) {
      it(`finds the ${category} Parts holding any of the ${parameter} values asked for, and none missing it`, async () => {
        const shop = await aVendor();
        const [first, second, third] = values;
        await anOfferedPart(shop.id, category, `Made-up ${parameter} A`, [[path, first]]);
        await anOfferedPart(shop.id, category, `Made-up ${parameter} B`, [[path, second]]);
        if (third !== undefined) {
          await anOfferedPart(shop.id, category, `Made-up ${parameter} C`, [[path, third]]);
        }
        await anOfferedPart(shop.id, category, `Made-up ${parameter} D`, []);

        expect(
          await theNamesListed({ category, [parameter]: [String(first), String(second)] }),
        ).toEqual([`Made-up ${parameter} A`, `Made-up ${parameter} B`]);
        expect(await theNamesListed({ category, [parameter]: String(first) })).toEqual([
          `Made-up ${parameter} A`,
        ]);
        expect(await theNamesListed({ category, [parameter]: String(second) })).toEqual([
          `Made-up ${parameter} B`,
        ]);
      });
    }

    // Each Category's first two filters, and the case's one filter with its
    // manufacturer.
    const categories = [...new Set(everyFilter.map(({ category }) => category))];
    for (const category of categories) {
      const [one, other] = everyFilter.filter((filter) => filter.category === category);
      const name = other === undefined ? 'manufacturer' : other.parameter;
      it(`finds the ${category} Parts matching both the ${one.parameter} and the ${name} asked for`, async () => {
        const shop = await aVendor();
        // The second filter's value asked for, and another, as held by a
        // Part: a specification, or the manufacturer.
        const held = (asked: boolean): [[string, unknown][], string | undefined] =>
          other === undefined
            ? [[], asked ? 'Made-up Cases' : 'Made-up Towers']
            : [[[other.path, other.values[asked ? 0 : 1]]], undefined];
        const [bothSpecifications, bothManufacturer] = held(true);
        await anOfferedPart(
          shop.id,
          category,
          'Made-up Both',
          [[one.path, one.values[0]], ...bothSpecifications],
          bothManufacturer,
        );
        const [otherSpecifications, otherManufacturer] = held(false);
        await anOfferedPart(
          shop.id,
          category,
          'Made-up First Only',
          [[one.path, one.values[0]], ...otherSpecifications],
          otherManufacturer,
        );
        await anOfferedPart(
          shop.id,
          category,
          'Made-up Second Only',
          [[one.path, one.values[1]], ...bothSpecifications],
          bothManufacturer,
        );

        expect(
          await theNamesListed({
            category,
            [one.parameter]: String(one.values[0]),
            [name]: other === undefined ? 'Made-up Cases' : String(other.values[0]),
          }),
        ).toEqual(['Made-up Both']);
      });
    }

    it('finds the Parts of any of the manufacturers asked for', async () => {
      const shop = await aVendor();
      await anOfferedPart(shop.id, 'cpu', 'Made-up Ryzen 7 7700', [], 'AMD');
      await anOfferedPart(shop.id, 'cpu', 'Made-up Core i5 13600', [], 'Intel');
      await anOfferedPart(
        shop.id,
        'cpu',
        'Made-up Server Chip',
        [],
        'Made-up Server Chips',
      );

      expect(await theNamesListed({ manufacturer: ['AMD', 'Intel'] })).toEqual([
        'Made-up Core i5 13600',
        'Made-up Ryzen 7 7700',
      ]);
      expect(await theNamesListed({ manufacturer: 'Intel' })).toEqual([
        'Made-up Core i5 13600',
      ]);
    });

    it('narrows the search and the filters together', async () => {
      const shop = await aVendor();
      await anOfferedPart(shop.id, 'cpu', 'Made-up Ryzen 7 7700', [['socket', 'AM5']]);
      await anOfferedPart(shop.id, 'cpu', 'Made-up Ryzen 5 5600', [['socket', 'AM4']]);
      await anOfferedPart(shop.id, 'cpu', 'Made-up Athlon 7700', [['socket', 'AM5']]);

      expect(await theNamesListed({ search: 'ryzen', socket: ['AM5'] })).toEqual([
        'Made-up Ryzen 7 7700',
      ]);
    });

    it('counts only the Parts the filters find in the total', async () => {
      const shop = await aVendor();
      await anOfferedPart(shop.id, 'cpu', 'Made-up Ryzen 7 7700', [['socket', 'AM5']]);
      await anOfferedPart(shop.id, 'cpu', 'Made-up Ryzen 5 5600', [['socket', 'AM4']]);

      const response = await readVisibleParts({
        category: 'cpu',
        currency: 'IQD',
        socket: 'AM5',
      });
      expect(((await response.json()) as PageOfVisibleParts).totalElements).toBe(1);
    });
  });

  describe('the price range', () => {
    // Three Parts at three Lowest Prices in dinars.
    async function threePrices(): Promise<void> {
      const shop = await aVendor();
      for (const [name, iqdPrice] of [
        ['Made-up Ryzen 5 7600', 400000],
        ['Made-up Ryzen 7 7700', 500000],
        ['Made-up Ryzen 9 7950X', 600000],
      ] as const) {
        await anOffer(shop.id, (await aPart(name)).id, { iqdPrice, inStock: true });
      }
    }

    it('includes both its ends', async () => {
      await threePrices();

      expect(await theNamesListed({ lowest: '400000', highest: '500000' })).toEqual([
        'Made-up Ryzen 5 7600',
        'Made-up Ryzen 7 7700',
      ]);
      expect(await theNamesListed({ lowest: '500000' })).toEqual([
        'Made-up Ryzen 7 7700',
        'Made-up Ryzen 9 7950X',
      ]);
      expect(await theNamesListed({ highest: '500000' })).toEqual([
        'Made-up Ryzen 5 7600',
        'Made-up Ryzen 7 7700',
      ]);
      expect(await theNamesListed({ lowest: '500000', highest: '500000' })).toEqual([
        'Made-up Ryzen 7 7700',
      ]);
      expect(await theNamesListed({ lowest: '400001', highest: '499999' })).toEqual([]);
    });

    it('compares the Lowest Price as answered, after rounding', async () => {
      const shop = await aVendor();
      await setThePlatformRate(1575);
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      await anOffer(shop.id, ryzen.id, { usdPrice: '158.80', inStock: true });

      // 158.80 $ at 1,575 is 250,110 IQD, which rounds to 250,000 IQD.
      expect(await theNamesListed({ highest: '250000' })).toEqual(['Made-up Ryzen 5 7600']);
      expect(await theNamesListed({ lowest: '250001' })).toEqual([]);
    });

    it('is in whole ones of the chosen currency', async () => {
      const shop = await aVendor();
      const ryzen = await aPart('Made-up Ryzen 5 7600');
      await anOffer(shop.id, ryzen.id, { usdPrice: '158.80', inStock: true });

      for (const [range, names] of [
        [{ lowest: '158' }, ['Made-up Ryzen 5 7600']],
        [{ lowest: '159' }, []],
        [{ highest: '159' }, ['Made-up Ryzen 5 7600']],
        [{ highest: '158' }, []],
      ] as const) {
        expect(await theNamesListed({ currency: 'USD', ...range })).toEqual(names);
      }
    });

    it('leaves out a Part with no Lowest Price whenever either end is given', async () => {
      const shop = await aVendor();
      const priced = await aPart('Made-up Ryzen 5 7600');
      await anOffer(shop.id, priced.id, { iqdPrice: 400000, inStock: true });
      const outOfStock = await aPart('Made-up Ryzen 7 7700');
      await anOffer(shop.id, outOfStock.id, { iqdPrice: 450000, inStock: false });
      // Quoted only in dollars, with no Platform Rate to show it in dinars.
      const unconverted = await aPart('Made-up Ryzen 9 7950X');
      await anOffer(shop.id, unconverted.id, { usdPrice: '300.00', inStock: true });

      expect(await theNamesListed()).toEqual([
        'Made-up Ryzen 5 7600',
        'Made-up Ryzen 9 7950X',
        'Made-up Ryzen 7 7700',
      ]);
      for (const range of [{ lowest: '0' }, { highest: '999999999' }] as Query[]) {
        expect(await theNamesListed(range)).toEqual(['Made-up Ryzen 5 7600']);
      }
    });

    it('narrows with the filters and the search', async () => {
      const shop = await aVendor();
      for (const [name, socket, iqdPrice] of [
        ['Made-up Ryzen 5 7600', 'AM5', 400000],
        ['Made-up Ryzen 9 7950X', 'AM5', 900000],
        ['Made-up Ryzen 5 5600', 'AM4', 300000],
      ] as const) {
        const made = await aPart(name, { specifications: { socket } });
        await anOffer(shop.id, made.id, { iqdPrice, inStock: true });
      }

      expect(
        await theNamesListed({ search: 'ryzen 5', socket: 'AM5', highest: '500000' }),
      ).toEqual(['Made-up Ryzen 5 7600']);
    });
  });

  describe('who may read them', () => {
    it("answers the same without a token and with any token, an Admin's among them", async () => {
      const shop = await aVendor();
      const ryzen = await aPart('Made-up Ryzen 7 7700', {
        specifications: { socket: 'AM5' },
      });
      await anOffer(shop.id, ryzen.id);
      const withoutAToken = await theFilters();

      for (const token of [
        await adminToken(),
        await testApp.tokenOf({ roles: ['vendor'] }),
        'nonsense',
      ]) {
        const response = await readFilters(
          { category: 'cpu', currency: 'IQD' },
          bearerHeader(token),
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(withoutAToken);
      }
    });
  });

  describe('a refused request for the list', () => {
    it('refuses a filter the Category does not have, or no Category has, with 400, naming its parameter', async () => {
      const queries: [Query, string][] = [
        [{ category: 'gpu', socket: 'AM5' }, 'socket'],
        [{ category: 'cpu', waterCooled: 'true' }, 'waterCooled'],
        [{ category: 'case', ramType: 'DDR5' }, 'ramType'],
        [{ category: 'cpu', colour: 'Black' }, 'colour'],
      ];
      for (const [query, field] of queries) {
        await expectErrorResponse(
          await readVisibleParts({ currency: 'IQD', ...query }),
          400,
          [notValid(field)],
        );
      }
    });

    it("refuses a value that is not of its filter's kind with 400, naming its parameter", async () => {
      const queries: [Query, string][] = [
        [{ category: 'cpu', cores: 'eight' }, 'cores'],
        [{ category: 'cpu', cores: '8.5' }, 'cores'],
        [{ category: 'cpu', cores: '-8' }, 'cores'],
        [{ category: 'cpu', cores: ['8', ''] }, 'cores'],
        // A 0 stands for "not known", which is not a value.
        [{ category: 'cpu', cores: '0' }, 'cores'],
        [{ category: 'cpuCooler', waterCooled: 'yes' }, 'waterCooled'],
        // Not one of the sockets a CPU's specification takes.
        [{ category: 'cpu', socket: 'AM9' }, 'socket'],
        [{ category: 'gpu', chipset: '' }, 'chipset'],
      ];
      for (const [query, field] of queries) {
        await expectErrorResponse(
          await readVisibleParts({ currency: 'IQD', ...query }),
          400,
          [notValid(field)],
        );
      }
    });

    it('refuses an end of the price range that is not a whole number with 400, naming it', async () => {
      for (const field of ['lowest', 'highest']) {
        for (const value of ['abc', '1.5', '-5', '', '1e6', '1000000000000000']) {
          await expectErrorResponse(
            await readVisibleParts({ category: 'cpu', currency: 'IQD', [field]: value }),
            400,
            [notValid(field)],
          );
        }
      }
    });

    it('refuses a lowest end above the highest with 400, naming the lowest', async () => {
      await expectErrorResponse(
        await readVisibleParts({
          category: 'cpu',
          currency: 'IQD',
          lowest: '500001',
          highest: '500000',
        }),
        400,
        [notValid('lowest')],
      );
    });
  });

  describe('a refused request for the filters', () => {
    it('refuses a missing Category and one outside the eight, and a missing currency and one that is neither USD nor IQD, naming each', async () => {
      const queries: [Record<string, string>, string][] = [
        [{ currency: 'IQD' }, 'category'],
        [{ category: 'monitor', currency: 'IQD' }, 'category'],
        [{ category: 'cpu' }, 'currency'],
        [{ category: 'cpu', currency: 'EUR' }, 'currency'],
      ];
      for (const [query, field] of queries) {
        await expectErrorResponse(await readFilters(query), 400, [notValid(field)]);
      }
    });
  });
});
