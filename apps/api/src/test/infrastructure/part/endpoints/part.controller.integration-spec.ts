import {
  accessDenied,
  bearerHeader,
  expectErrorResponse,
  notValid,
  unauthorized,
} from '@pcp/core/test-utils';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../../test-utils/database/test-database';

// A Part as the API answers it.
type PartBody = {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  partNumbers: string[];
  openDbId: string | null;
  specifications: Record<string, unknown>;
  missingNeededSpecifications: string[];
  createdAt: string;
  updatedAt: string;
};

function partOf(response: Response): Promise<PartBody> {
  return response.json() as Promise<PartBody>;
}

describe('the Part endpoints', () => {
  let testApp: TestAppWithLogins;
  let adminToken: string;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
    adminToken = await testApp.tokenOf({ roles: ['admin'] });
  });

  afterAll(async () => {
    await testApp.close();
  });

  afterEach(async () => {
    await emptyTheDatabase();
  });

  function createPart(body: unknown, token = adminToken): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(token), 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  function editPart(partId: string, body: unknown, token = adminToken): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/parts/${partId}`, {
      method: 'PUT',
      headers: { ...bearerHeader(token), 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  function readPart(partId: string, token: string): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/parts/${partId}`, {
      headers: bearerHeader(token),
    });
  }

  describe('creating a Part', () => {
    it('lets the Admin create a Part and read it back as it was given', async () => {
      const created = await createPart({
        category: 'cpu',
        name: 'Made-up Ryzen 5 7600',
        manufacturer: 'AMD',
        partNumbers: ['100-100001015BOX'],
      });

      expect(created.status).toBe(201);
      const part = await partOf(created);
      expect(part).toEqual({
        id: expect.any(String),
        category: 'cpu',
        name: 'Made-up Ryzen 5 7600',
        manufacturer: 'AMD',
        partNumbers: ['100-100001015BOX'],
        openDbId: null,
        specifications: {},
        // In the list's order.
        missingNeededSpecifications: [
          'socket',
          'specifications.tdp',
          'specifications.memory.types',
        ],
        createdAt: expect.any(String),
        updatedAt: part.createdAt,
      });

      const read = await readPart(part.id, adminToken);

      expect(read.status).toBe(200);
      expect(await read.json()).toEqual(part);
    });

    it('cleans the part numbers: trimmed, none empty, and no two alike regardless of case', async () => {
      const created = await createPart({
        category: 'case',
        name: 'Made-up Mesh Tower',
        manufacturer: 'Made-up Cases',
        partNumbers: [' MT-100 ', '', 'mt-100', 'MT-100-WHT', '   ', 'MT-100'],
      });

      expect(created.status).toBe(201);
      expect((await partOf(created)).partNumbers).toEqual(['MT-100', 'MT-100-WHT']);
    });

    it('creates a Part with no part numbers when none are given', async () => {
      const created = await createPart({
        category: 'psu',
        name: 'Made-up 650 W',
        manufacturer: 'Made-up Power',
      });

      expect(created.status).toBe(201);
      expect((await partOf(created)).partNumbers).toEqual([]);
    });

    const aValidPart = {
      category: 'gpu',
      name: 'Made-up RX 7600',
      manufacturer: 'Made-up Graphics',
      partNumbers: ['RX7600-MU'],
    };

    it('refuses a Category outside the eight, naming the field', async () => {
      const response = await createPart({ ...aValidPart, category: 'monitor' });

      await expectErrorResponse(response, 400, [notValid('category')]);
    });

    it('refuses a name of spaces alone, naming the field', async () => {
      const response = await createPart({ ...aValidPart, name: '   ' });

      await expectErrorResponse(response, 400, [notValid('name')]);
    });

    it('refuses a Part without a manufacturer, naming the field', async () => {
      const { manufacturer: _left, ...withoutManufacturer } = aValidPart;

      const response = await createPart(withoutManufacturer);

      await expectErrorResponse(response, 400, [notValid('manufacturer')]);
    });

    it('refuses a field the Part does not have, naming it', async () => {
      const response = await createPart({ ...aValidPart, price: 300 });

      await expectErrorResponse(response, 400, [notValid('price')]);
    });

    it('refuses part numbers that are not text, naming the field', async () => {
      const response = await createPart({ ...aValidPart, partNumbers: [7600] });

      await expectErrorResponse(response, 400, [notValid('partNumbers')]);
    });

    it('refuses part numbers given as null, naming the field', async () => {
      const response = await createPart({ ...aValidPart, partNumbers: null });

      await expectErrorResponse(response, 400, [notValid('partNumbers')]);
    });

    it('keeps a name and a manufacturer as they were written', async () => {
      const created = await createPart({
        ...aValidPart,
        name: 'Made-up RX 7600 ',
        manufacturer: ' Made-up Graphics',
      });

      expect(created.status).toBe(201);
      const part = await partOf(created);
      expect(part.name).toBe('Made-up RX 7600 ');
      expect(part.manufacturer).toBe(' Made-up Graphics');
    });

    it('refuses a Vendor', async () => {
      const vendorToken = await testApp.tokenOf({ roles: ['vendor'] });

      const response = await createPart(aValidPart, vendorToken);

      await expectErrorResponse(response, 403, accessDenied);
    });

    it('refuses a call without a token', async () => {
      const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(aValidPart),
      });

      await expectErrorResponse(response, 401, unauthorized);
    });
  });

  describe("a CPU's specifications", () => {
    // A made-up CPU with a value of every kind a CPU's list has.
    const specifications = {
      socket: 'AM5',
      series: 'Made-up 7000',
      cores: { total: 6, efficiency: 0, threads: 12 },
      clocks: { performance: { base: 3.8, boost: 5.1 } },
      cache: { l1: '6 × 32 KB Instruction + 6 × 32 KB Data', l2: 6, l3: 32 },
      specifications: {
        tdp: 65,
        integratedGraphics: {
          model: 'AMD Radeon Graphics',
          baseClock: 400,
          boostClock: 2200,
        },
        includesCooler: true,
        packaging: 'Boxed',
        memory: { maxSupport: 192, types: ['DDR5'], channels: 2 },
      },
    };

    function aCpu(overrides: Record<string, unknown> = {}): Record<string, unknown> {
      return {
        category: 'cpu',
        name: 'Made-up Ryzen 5 7600',
        manufacturer: 'AMD',
        specifications,
        ...overrides,
      };
    }

    it('are stored as they were given, and read back', async () => {
      const created = await createPart(aCpu());

      expect(created.status).toBe(201);
      const part = await partOf(created);
      expect(part.specifications).toEqual(specifications);
      expect(part.missingNeededSpecifications).toEqual([]);
      expect(await partOf(await readPart(part.id, adminToken))).toEqual(part);
    });

    it('may leave needed ones out, and the Part then lists them as missing', async () => {
      const created = await createPart(aCpu({ specifications: { socket: 'LGA 1700' } }));

      expect(created.status).toBe(201);
      const part = await partOf(created);
      expect(part.missingNeededSpecifications).toEqual([
        'specifications.tdp',
        'specifications.memory.types',
      ]);
    });

    it('count an empty choice of several, and null, as missing', async () => {
      const created = await createPart(
        aCpu({
          specifications: {
            socket: 'AM5',
            series: null,
            specifications: { memory: { types: [] } },
          },
        }),
      );

      const part = await partOf(created);
      expect(part.specifications).toEqual({ socket: 'AM5' });
      expect(part.missingNeededSpecifications).toEqual([
        'specifications.tdp',
        'specifications.memory.types',
      ]);
    });

    it('refuse a value outside a fixed set, naming the specification', async () => {
      const response = await createPart(
        aCpu({ specifications: { ...specifications, socket: 'AM 5' } }),
      );

      await expectErrorResponse(response, 400, [
        notValid('specifications.socket', {
          specification: 'socket',
          reason: 'notInTheSet',
        }),
      ]);
    });

    it('refuse a word where a number belongs, naming the specification', async () => {
      const response = await createPart(
        aCpu({ specifications: { ...specifications, cores: { total: 'six' } } }),
      );

      await expectErrorResponse(response, 400, [
        notValid('specifications.cores.total', {
          specification: 'cores.total',
          reason: 'notANumber',
        }),
      ]);
    });

    it('refuse a specification the list does not name', async () => {
      const response = await createPart(
        aCpu({ specifications: { ...specifications, colour: 'black' } }),
      );

      await expectErrorResponse(response, 400, [
        notValid('specifications.colour', { specification: 'colour', reason: 'unknown' }),
      ]);
    });

    it('refuse 0 where 0 cannot be true, naming the specification', async () => {
      const response = await createPart(
        aCpu({
          specifications: {
            ...specifications,
            specifications: { ...specifications.specifications, tdp: 0 },
          },
        }),
      );

      await expectErrorResponse(response, 400, [
        notValid('specifications.specifications.tdp', {
          specification: 'specifications.tdp',
          reason: 'zeroMeansMissing',
        }),
      ]);
    });

    it('refuse a specification the list does not name even when it is null', async () => {
      const response = await createPart(
        aCpu({ specifications: { socket: 'AM5', colour: null } }),
      );

      await expectErrorResponse(response, 400, [
        notValid('specifications.colour', { specification: 'colour', reason: 'unknown' }),
      ]);
    });

    it('keep each of several values once', async () => {
      const created = await createPart(
        aCpu({
          specifications: {
            specifications: { memory: { types: ['DDR5', 'DDR4', 'DDR5'] } },
          },
        }),
      );

      expect(created.status).toBe(201);
      expect((await partOf(created)).specifications).toEqual({
        specifications: { memory: { types: ['DDR5', 'DDR4'] } },
      });
    });

    it('take 0 where 0 can be true', async () => {
      const created = await createPart(aCpu({ specifications: { cache: { l3: 0 } } }));

      expect(created.status).toBe(201);
      expect((await partOf(created)).specifications).toEqual({ cache: { l3: 0 } });
    });

    it('refuse specifications that are not an object, naming the field', async () => {
      const response = await createPart(aCpu({ specifications: ['AM5'] }));

      await expectErrorResponse(response, 400, [notValid('specifications')]);
    });
  });

  describe("every Category's specifications", () => {
    // A specification as the Categories endpoint describes it.
    type SpecificationBody = {
      path: string;
      kind: string;
      values?: string[];
      fields?: SpecificationBody[];
    };

    async function listOf(category: string): Promise<SpecificationBody[]> {
      const response = await fetch(`${testApp.baseUrl}/v1/categories`, {
        headers: bearerHeader(adminToken),
      });
      const categories = (await response.json()) as {
        key: string;
        specifications: SpecificationBody[];
      }[];
      return categories.find((each) => each.key === category)?.specifications ?? [];
    }

    // A made-up value of the specification's kind.
    function aValueFor(specification: SpecificationBody): unknown {
      switch (specification.kind) {
        case 'wholeNumber':
          return 2;
        case 'decimalNumber':
          return 2.5;
        case 'text':
          return 'Made-up';
        case 'yesNo':
          return true;
        case 'oneOf':
          return specification.values?.[0];
        case 'severalOf':
          return specification.values?.slice(0, 2);
        case 'listOfText':
          return ['Made-up'];
        case 'listOfRows':
          return [
            Object.fromEntries(
              (specification.fields ?? []).map((field) => [field.path, aValueFor(field)]),
            ),
          ];
        default:
          throw new Error(`No made-up value for ${specification.kind}`);
      }
    }

    function documentWithEvery(list: SpecificationBody[]): Record<string, unknown> {
      const document: Record<string, unknown> = {};
      for (const specification of list) {
        const names = specification.path.split('.');
        const last = names.pop() as string;
        let node = document;
        for (const name of names) node = (node[name] ??= {}) as Record<string, unknown>;
        node[last] = aValueFor(specification);
      }
      return document;
    }

    it.each([
      ['a CPU cooler', 'cpuCooler'],
      ['a motherboard', 'motherboard'],
      ['a RAM kit', 'ram'],
      ['a drive', 'storage'],
      ['a GPU', 'gpu'],
      ['a case', 'case'],
      ['a PSU', 'psu'],
    ])(
      'take a value for every specification of %s, and give them all back unchanged',
      async (_name, category) => {
        const specifications = documentWithEvery(await listOf(category));

        const created = await createPart({
          category,
          name: `Made-up ${category}`,
          manufacturer: 'Made-up Parts',
          specifications,
        });

        expect(created.status).toBe(201);
        const part = await partOf(created);
        expect(part.specifications).toEqual(specifications);
        expect(part.missingNeededSpecifications).toEqual([]);
        expect((await partOf(await readPart(part.id, adminToken))).specifications).toEqual(
          specifications,
        );
      },
    );

    function aMotherboard(
      specifications: Record<string, unknown>,
    ): Record<string, unknown> {
      return {
        category: 'motherboard',
        name: 'Made-up B650M',
        manufacturer: 'Made-up Boards',
        specifications,
      };
    }

    it('refuse a value outside a fixed set in a motherboard, as in a CPU', async () => {
      const response = await createPart(aMotherboard({ socket: 'AM 5' }));

      await expectErrorResponse(response, 400, [
        notValid('specifications.socket', {
          specification: 'socket',
          reason: 'notInTheSet',
        }),
      ]);
    });

    it('refuse 0 where 0 cannot be true in a case, as in a CPU', async () => {
      const response = await createPart({
        category: 'case',
        name: 'Made-up Mesh Tower',
        manufacturer: 'Made-up Cases',
        specifications: { max_video_card_length: 0 },
      });

      await expectErrorResponse(response, 400, [
        notValid('specifications.max_video_card_length', {
          specification: 'max_video_card_length',
          reason: 'zeroMeansMissing',
        }),
      ]);
    });

    it('refuse a row that is not an object, naming the row', async () => {
      const response = await createPart(aMotherboard({ pcie_slots: ['x16'] }));

      await expectErrorResponse(response, 400, [
        notValid('specifications.pcie_slots.0', {
          specification: 'pcie_slots.0',
          reason: 'notARow',
        }),
      ]);
    });

    it("refuse a field a row's list does not name, naming the row's field", async () => {
      const response = await createPart(
        aMotherboard({
          pcie_slots: [{ gen: '5.0', lanes: 16, quantity: 1, speed: 'fast' }],
        }),
      );

      await expectErrorResponse(response, 400, [
        notValid('specifications.pcie_slots.0.speed', {
          specification: 'pcie_slots.0.speed',
          reason: 'unknown',
        }),
      ]);
    });

    it("refuse a row's field of the wrong kind, naming the row's field", async () => {
      const response = await createPart(
        aMotherboard({ pcie_slots: [{ gen: '5.0', lanes: 'sixteen', quantity: 1 }] }),
      );

      await expectErrorResponse(response, 400, [
        notValid('specifications.pcie_slots.0.lanes', {
          specification: 'pcie_slots.0.lanes',
          reason: 'notANumber',
        }),
      ]);
    });

    it('keep an empty list of rows as a value: a motherboard with no M.2 slot has none', async () => {
      const created = await createPart(aMotherboard({ m2_slots: [] }));

      expect(created.status).toBe(201);
      const part = await partOf(created);
      expect(part.specifications).toEqual({ m2_slots: [] });
      expect(part.missingNeededSpecifications).not.toContain('m2_slots');
    });
  });

  describe('editing a Part', () => {
    const cpuSpecifications = {
      socket: 'AM5',
      specifications: { tdp: 65, memory: { types: ['DDR5'] } },
    };

    async function aCpu(): Promise<PartBody> {
      return partOf(
        await createPart({
          category: 'cpu',
          name: 'Made-up Ryzen 5 7600',
          manufacturer: 'AMD',
          partNumbers: ['100-100001015BOX'],
          specifications: cpuSpecifications,
        }),
      );
    }

    it('replaces the name, the manufacturer, the part numbers and the specifications, and keeps the rest', async () => {
      const before = await aCpu();

      const edited = await editPart(before.id, {
        name: 'Made-up Ryzen 5 7600X',
        manufacturer: 'Advanced Micro Devices',
        partNumbers: [' 100-100000593WOF ', '100-100000593wof'],
        specifications: { socket: 'AM5', cores: { total: 6 } },
      });

      expect(edited.status).toBe(200);
      const after = await partOf(edited);
      expect(after).toEqual({
        ...before,
        name: 'Made-up Ryzen 5 7600X',
        manufacturer: 'Advanced Micro Devices',
        partNumbers: ['100-100000593WOF'],
        specifications: { socket: 'AM5', cores: { total: 6 } },
        missingNeededSpecifications: ['specifications.tdp', 'specifications.memory.types'],
        updatedAt: expect.any(String),
      });
      expect(new Date(after.updatedAt).getTime()).toBeGreaterThan(
        new Date(before.updatedAt).getTime(),
      );
      expect(await partOf(await readPart(before.id, adminToken))).toEqual(after);
    });

    it('clears a needed specification it leaves out, and the Part then lists it as missing', async () => {
      const before = await aCpu();

      const edited = await editPart(before.id, {
        name: before.name,
        manufacturer: before.manufacturer,
        specifications: { socket: 'AM5', specifications: { memory: { types: ['DDR5'] } } },
      });

      expect((await partOf(edited)).missingNeededSpecifications).toEqual([
        'specifications.tdp',
      ]);
    });

    it('refuses a value outside a fixed set, naming the specification, and changes nothing', async () => {
      const before = await aCpu();

      const response = await editPart(before.id, {
        name: before.name,
        manufacturer: before.manufacturer,
        specifications: { ...cpuSpecifications, socket: 'AM 5' },
      });

      await expectErrorResponse(response, 400, [
        notValid('specifications.socket', {
          specification: 'socket',
          reason: 'notInTheSet',
        }),
      ]);
      expect(await partOf(await readPart(before.id, adminToken))).toEqual(before);
    });

    it('does not change the Category: one sent with an edit is refused', async () => {
      const before = await aCpu();

      const response = await editPart(before.id, {
        category: 'gpu',
        name: before.name,
        manufacturer: before.manufacturer,
      });

      await expectErrorResponse(response, 400, [notValid('category')]);
      expect((await partOf(await readPart(before.id, adminToken))).category).toBe('cpu');
    });

    it('answers a Part that does not exist with its own error', async () => {
      const response = await editPart('6f1d2c3b-4a5e-4f60-8b7a-9c0d1e2f3a4b', {
        name: 'Made-up',
        manufacturer: 'Made-up',
      });

      await expectErrorResponse(response, 404, [
        {
          code: 'PART_NOT_FOUND',
          title: 'part_not_found_title',
          detail: 'part_not_found_details',
        },
      ]);
    });

    it('refuses a Vendor, and changes nothing', async () => {
      const before = await aCpu();
      const vendorToken = await testApp.tokenOf({ roles: ['vendor'] });

      const response = await editPart(
        before.id,
        { name: 'Changed by a Vendor', manufacturer: 'AMD' },
        vendorToken,
      );

      await expectErrorResponse(response, 403, accessDenied);
      expect((await partOf(await readPart(before.id, adminToken))).name).toBe(before.name);
    });

    it('refuses a call without a token', async () => {
      const before = await aCpu();

      const response = await fetch(`${testApp.baseUrl}/v1/parts/${before.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Made-up', manufacturer: 'Made-up' }),
      });

      await expectErrorResponse(response, 401, unauthorized);
    });
  });

  describe('reading a Part', () => {
    const partNotFound = {
      code: 'PART_NOT_FOUND',
      title: 'part_not_found_title',
      detail: 'part_not_found_details',
    };

    async function aPart(): Promise<PartBody> {
      const created = await createPart({
        category: 'ram',
        name: 'Made-up DDR5 32 GB',
        manufacturer: 'Made-up Memory',
        partNumbers: ['MM-DDR5-32'],
      });
      return partOf(created);
    }

    it('lets a Vendor read a Part', async () => {
      const part = await aPart();
      const vendorToken = await testApp.tokenOf({ roles: ['vendor'] });

      const response = await readPart(part.id, vendorToken);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(part);
    });

    it('answers a Part that does not exist with its own error', async () => {
      await aPart();

      const response = await readPart('6f1d2c3b-4a5e-4f60-8b7a-9c0d1e2f3a4b', adminToken);

      await expectErrorResponse(response, 404, [partNotFound]);
    });

    it('answers an identifier that could name no Part in the same way', async () => {
      const response = await readPart('not-an-identifier', adminToken);

      await expectErrorResponse(response, 404, [partNotFound]);
    });

    it('refuses a call without a token', async () => {
      const part = await aPart();

      const response = await fetch(`${testApp.baseUrl}/v1/parts/${part.id}`);

      await expectErrorResponse(response, 401, unauthorized);
    });
  });
});
