import { randomUUID } from 'node:crypto';

import {
  bearerHeader,
  expectErrorResponse,
  type ExpectedErrorResponse,
  notValid,
} from '@pcp/core/test-utils';
import sharp from 'sharp';

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

// A Build, read by anyone without a token: the Parts it is given, by their
// identifiers and, for a RAM kit or a drive, a quantity, each answered as the
// catalog holds it, and whether the Build is a Complete Build (BLD-1, BLD-5).

// A Part of a Build as the API answers it.
type BuildPartBody = {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  partNumbers: string[];
  photoPath: string | null;
  quantity: number | null;
  visible: boolean;
};

// A needed specification a Part of the Build lacks, as the API names it.
type MissingSpecificationBody = {
  part: string;
  path: string;
  label: string;
  fieldLabel: string | null;
};

// The outcome of a Compatibility Rule that applies to the Build.
type RuleOutcomeBody = {
  rule: number;
  outcome: 'passes' | 'problem' | 'warning' | 'unchecked';
  parts: string[];
  missing: MissingSpecificationBody[];
};

// A Build's Estimated power draw: its watts, or the TDPs that are missing.
type EstimatedPowerDrawBody = {
  watts: number | null;
  missing: MissingSpecificationBody[];
};

// A Build as the API answers it.
type BuildBody = {
  parts: BuildPartBody[];
  complete: boolean;
  stillNeeded: string[];
  cpuValuesNotKnown: string[];
  outcomes: RuleOutcomeBody[];
  estimatedPowerDraw: EstimatedPowerDrawBody | null;
};

// A Part as the API answers its creation, as far as these tests read it.
type PartBody = { id: string; photoPath: string | null };

// A Vendor as the API answers its creation, as far as these tests read it.
type VendorBody = { id: string };

const adminLoginId = randomUUID();

// A moment for the API's clock, and a moment some time after another.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');
const aDay = 24 * 60 * 60 * 1000;
function after(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() + milliseconds);
}

// A small made-up photo.
function aPhoto(): Promise<Buffer> {
  return sharp({ create: { width: 400, height: 300, channels: 3, background: '#4a6a8a' } })
    .png()
    .toBuffer();
}

// The eight Categories in the catalog's order, as the API names them.
const everyCategory = [
  'cpu',
  'cpuCooler',
  'motherboard',
  'ram',
  'storage',
  'gpu',
  'case',
  'psu',
];

describe('a Build', () => {
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

  // An Offer the Admin adds for the Vendor, in stock unless it says
  // otherwise, at the time of the clock.
  async function anOffer(vendorId: string, partId: string, inStock = true): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ partId, iqdPrice: 500000, inStock }),
    });
    expect(response.status).toBe(201);
  }

  // The Admin deactivates a Vendor or reactivates it, which calls Keycloak,
  // so it runs with the clock running.
  async function admin(
    action: 'deactivate' | 'reactivate',
    vendorId: string,
  ): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/${action}`, {
      method: 'POST',
      headers: bearerHeader(await adminToken()),
    });
    expect(response.status).toBe(200);
  }

  // The Admin adds a photo to a Part, and the Part as it then is.
  async function withAPhoto(partId: string): Promise<PartBody> {
    const form = new FormData();
    form.append(
      'photo',
      new Blob([new Uint8Array(await aPhoto())], { type: 'image/png' }),
      'photo.png',
    );
    const response = await fetch(`${testApp.baseUrl}/v1/parts/${partId}/photo`, {
      method: 'PUT',
      headers: bearerHeader(await adminToken()),
      body: form,
    });
    expect(response.status).toBe(200);
    return (await response.json()) as PartBody;
  }

  // The Build of these `part` values, each given as a `part` of its own, with
  // the rest of the query given, in dinars unless it says otherwise, and the
  // headers given.
  function readBuild(
    values: readonly string[],
    query: Record<string, string> = { currency: 'IQD' },
    headers: Record<string, string> = {},
  ): Promise<Response> {
    const search = new URLSearchParams(query);
    for (const value of values) search.append('part', value);
    return fetch(`${testApp.baseUrl}/v1/build?${search.toString()}`, { headers });
  }

  // The Build of these `part` values, read without a token.
  async function theBuild(values: readonly string[]): Promise<BuildBody> {
    const response = await readBuild(values);
    expect(response.status).toBe(200);
    return (await response.json()) as BuildBody;
  }

  describe('an empty Build', () => {
    it("answers no Part, is not complete, needs every Category, in the catalog's order, and answers no rule's outcome and no Estimated power draw", async () => {
      expect(await theBuild([])).toEqual({
        parts: [],
        complete: false,
        stillNeeded: everyCategory,
        cpuValuesNotKnown: [],
        outcomes: [],
        estimatedPowerDraw: null,
      });
    });
  });

  describe('its Parts', () => {
    it("answer each as the catalog holds it: its identifier, Category, name, manufacturer, part numbers and photo's path, with no quantity for a Part of a Category a Build holds one of", async () => {
      const ryzen = await withAPhoto(
        (
          await aPart({
            name: 'Made-up Ryzen 5 7600',
            manufacturer: 'AMD',
            partNumbers: ['100-100001015BOX', '100-000001015'],
          })
        ).id,
      );

      expect((await theBuild([ryzen.id])).parts).toEqual([
        {
          id: ryzen.id,
          category: 'cpu',
          name: 'Made-up Ryzen 5 7600',
          manufacturer: 'AMD',
          partNumbers: ['100-100001015BOX', '100-000001015'],
          photoPath: ryzen.photoPath,
          quantity: null,
          visible: false,
        },
      ]);
      expect(ryzen.photoPath).toMatch(/^\/v1\/photos\//);
    });

    it("come in the catalog's order of Categories whatever order they were given in, the RAM kits and drives in the Build's order, each with its quantity", async () => {
      const [psu, driveA, cpu, kitX, driveB, pcCase, kitY, driveC, board] = [
        await aPart({ category: 'psu', name: 'Made-up 750 W PSU' }),
        await aPart({ category: 'storage', name: 'Made-up drive A' }),
        await aPart({ category: 'cpu', name: 'Made-up CPU' }),
        await aPart({ category: 'ram', name: 'Made-up kit X' }),
        await aPart({ category: 'storage', name: 'Made-up drive B' }),
        await aPart({ category: 'case', name: 'Made-up case' }),
        await aPart({ category: 'ram', name: 'Made-up kit Y' }),
        await aPart({ category: 'storage', name: 'Made-up drive C' }),
        await aPart({ category: 'motherboard', name: 'Made-up board' }),
      ];

      const { parts } = await theBuild([
        psu.id,
        `${driveA.id}:1`,
        cpu.id,
        `${kitX.id}:2`,
        `${driveB.id}:4`,
        pcCase.id,
        `${kitY.id}:1`,
        `${driveC.id}:16`,
        board.id,
      ]);

      expect(
        parts.map(({ id, category, quantity }) => ({ id, category, quantity })),
      ).toEqual([
        { id: cpu.id, category: 'cpu', quantity: null },
        { id: board.id, category: 'motherboard', quantity: null },
        { id: kitX.id, category: 'ram', quantity: 2 },
        { id: kitY.id, category: 'ram', quantity: 1 },
        { id: driveA.id, category: 'storage', quantity: 1 },
        { id: driveB.id, category: 'storage', quantity: 4 },
        { id: driveC.id, category: 'storage', quantity: 16 },
        { id: pcCase.id, category: 'case', quantity: null },
        { id: psu.id, category: 'psu', quantity: null },
      ]);
    });

    it('leave out an identifier the catalog does not hold, with its quantity or without, so that an old Build still opens', async () => {
      const ryzen = await aPart();

      expect(
        (await theBuild([randomUUID(), ryzen.id, `${randomUUID()}:2`])).parts.map(
          ({ id }) => id,
        ),
      ).toEqual([ryzen.id]);
    });

    it('read an identifier in capitals as the Part it names', async () => {
      const ryzen = await aPart();
      const kit = await aPart({ category: 'ram', name: 'Made-up kit' });

      expect(
        (await theBuild([ryzen.id.toUpperCase(), `${kit.id.toUpperCase()}:2`])).parts.map(
          ({ id, quantity }) => ({ id, quantity }),
        ),
      ).toEqual([
        { id: ryzen.id, quantity: null },
        { id: kit.id, quantity: 2 },
      ]);
    });
  });

  describe('whether each Part is a Visible Part', () => {
    // Whether the Build's Parts are visible, by identifier.
    async function visibilityIn(
      values: readonly string[],
    ): Promise<Record<string, boolean>> {
      const { parts } = await theBuild(values);
      return Object.fromEntries(parts.map(({ id, visible }) => [id, visible]));
    }

    it('answers a Part with a Visible Offer as visible, and one with none as not visible, still in the Build', async () => {
      const offered = await aPart({ name: 'Made-up Ryzen 5 7600' });
      const board = await aPart({ category: 'motherboard', name: 'Made-up board' });
      await anOffer((await aVendor()).id, offered.id);

      expect(await visibilityIn([offered.id, board.id])).toEqual({
        [offered.id]: true,
        [board.id]: false,
      });
    });

    it('answers a Part whose only Offer expired as not visible, still in the Build, and as visible at exactly 14 days', async () => {
      const ryzen = await aPart();
      const shop = await aVendor();
      moveTheClockTo(aMovedMoment);
      await anOffer(shop.id, ryzen.id);

      moveTheClockTo(after(aMovedMoment, 14 * aDay));
      expect(await visibilityIn([ryzen.id])).toEqual({ [ryzen.id]: true });

      moveTheClockTo(after(aMovedMoment, 14 * aDay + 1));
      expect(await visibilityIn([ryzen.id])).toEqual({ [ryzen.id]: false });
    });

    it('answers a Part whose only Vendor was deactivated as not visible, still in the Build, and as visible again once it is reactivated', async () => {
      const ryzen = await aPart();
      const shop = await aVendor();
      await anOffer(shop.id, ryzen.id);

      await admin('deactivate', shop.id);
      expect(await visibilityIn([ryzen.id])).toEqual({ [ryzen.id]: false });

      await admin('reactivate', shop.id);
      expect(await visibilityIn([ryzen.id])).toEqual({ [ryzen.id]: true });
    });
  });

  describe('whether it is a Complete Build', () => {
    // A CPU that has no integrated graphics and includes no cooler, as
    // OpenDB writes them.
    const neitherGraphicsNorCooler = {
      specifications: { integratedGraphics: { model: 'None' }, includesCooler: false },
    };

    // A Part of each Category, by its Category's key, a CPU with the
    // specifications given, and the `part` value that names each.
    async function aPartOfEach(
      cpuSpecifications: Record<string, unknown> = neitherGraphicsNorCooler,
    ): Promise<Record<string, string>> {
      const values: Record<string, string> = {};
      for (const category of everyCategory) {
        const made = await aPart({
          category,
          name: `Made-up ${category}`,
          ...(category === 'cpu' ? { specifications: cpuSpecifications } : {}),
        });
        values[category] = ['ram', 'storage'].includes(category) ? `${made.id}:1` : made.id;
      }
      return values;
    }

    // The Build's completeness: whether it is complete, the Categories it
    // still needs, and the CPU's values not known.
    async function completenessOf(
      values: readonly string[],
    ): Promise<Pick<BuildBody, 'complete' | 'stillNeeded' | 'cpuValuesNotKnown'>> {
      const { complete, stillNeeded, cpuValuesNotKnown } = await theBuild(values);
      return { complete, stillNeeded, cpuValuesNotKnown };
    }

    it('is complete with a Part of every Category', async () => {
      const each = await aPartOfEach();

      expect(await completenessOf(Object.values(each))).toEqual({
        complete: true,
        stillNeeded: [],
        cpuValuesNotKnown: [],
      });
    });

    it('lists as still needed each of the CPU, the motherboard, the RAM, the storage, the case and the PSU when it is missing', async () => {
      const each = await aPartOfEach();

      for (const missing of ['cpu', 'motherboard', 'ram', 'storage', 'case', 'psu']) {
        const others = everyCategory.filter((category) => category !== missing);

        expect(await completenessOf(others.map((category) => each[category]))).toEqual({
          complete: false,
          stillNeeded: [missing],
          cpuValuesNotKnown: [],
        });
      }
    });

    // The `part` values of a Part of each Category but those given.
    function without(each: Record<string, string>, ...left: readonly string[]): string[] {
      return everyCategory
        .filter((category) => !left.includes(category))
        .map((category) => each[category]);
    }

    describe('a CPU with integrated graphics', () => {
      it('makes the GPU unneeded', async () => {
        const each = await aPartOfEach({
          specifications: {
            integratedGraphics: { model: 'Radeon Graphics' },
            includesCooler: false,
          },
        });

        expect(await completenessOf(without(each, 'gpu'))).toEqual({
          complete: true,
          stillNeeded: [],
          cpuValuesNotKnown: [],
        });
      });

      it('written "None" needs one', async () => {
        const each = await aPartOfEach();

        expect(await completenessOf(without(each, 'gpu'))).toEqual({
          complete: false,
          stillNeeded: ['gpu'],
          cpuValuesNotKnown: [],
        });
      });

      it('not held needs one, and the answer says the value is not known, as it does beside a GPU', async () => {
        const each = await aPartOfEach({ specifications: { includesCooler: false } });

        expect(await completenessOf(without(each, 'gpu'))).toEqual({
          complete: false,
          stillNeeded: ['gpu'],
          cpuValuesNotKnown: ['integratedGraphics'],
        });
        expect(await completenessOf(without(each))).toEqual({
          complete: true,
          stillNeeded: [],
          cpuValuesNotKnown: ['integratedGraphics'],
        });
      });

      it('stored as an empty text counts as not held', async () => {
        const each = await aPartOfEach();
        const cpuId = each.cpu;
        await keepSpecificationsAsTheyAre(cpuId, {
          specifications: { integratedGraphics: { model: '' }, includesCooler: false },
        });

        expect(await completenessOf(without(each, 'gpu'))).toEqual({
          complete: false,
          stillNeeded: ['gpu'],
          cpuValuesNotKnown: ['integratedGraphics'],
        });
      });
    });

    describe('a CPU that includes a cooler', () => {
      it('makes the CPU cooler unneeded', async () => {
        const each = await aPartOfEach({
          specifications: { integratedGraphics: { model: 'None' }, includesCooler: true },
        });

        expect(await completenessOf(without(each, 'cpuCooler'))).toEqual({
          complete: true,
          stillNeeded: [],
          cpuValuesNotKnown: [],
        });
      });

      it('written no needs one', async () => {
        const each = await aPartOfEach();

        expect(await completenessOf(without(each, 'cpuCooler'))).toEqual({
          complete: false,
          stillNeeded: ['cpuCooler'],
          cpuValuesNotKnown: [],
        });
      });

      it('not held needs one, and the answer says the value is not known, as it does beside a CPU cooler', async () => {
        const each = await aPartOfEach({
          specifications: { integratedGraphics: { model: 'None' } },
        });

        expect(await completenessOf(without(each, 'cpuCooler'))).toEqual({
          complete: false,
          stillNeeded: ['cpuCooler'],
          cpuValuesNotKnown: ['includesCooler'],
        });
        expect(await completenessOf(without(each))).toEqual({
          complete: true,
          stillNeeded: [],
          cpuValuesNotKnown: ['includesCooler'],
        });
      });
    });

    it('needs both a GPU and a CPU cooler for a CPU that holds neither value, saying both are not known', async () => {
      const each = await aPartOfEach({});

      expect(await completenessOf(without(each, 'cpuCooler', 'gpu'))).toEqual({
        complete: false,
        stillNeeded: ['cpuCooler', 'gpu'],
        cpuValuesNotKnown: ['integratedGraphics', 'includesCooler'],
      });
    });

    it('needs a GPU and a CPU cooler without a CPU, whatever else it holds, and says no value is not known', async () => {
      const each = await aPartOfEach();

      expect(await completenessOf(without(each, 'cpu', 'cpuCooler', 'gpu'))).toEqual({
        complete: false,
        stillNeeded: ['cpu', 'cpuCooler', 'gpu'],
        cpuValuesNotKnown: [],
      });
    });

    it('counts two RAM kits and three drives as RAM and storage once each', async () => {
      const each = await aPartOfEach();
      const kits = [
        each.ram,
        `${(await aPart({ category: 'ram', name: 'Made-up kit 2' })).id}:2`,
      ];
      const drives = [
        each.storage,
        `${(await aPart({ category: 'storage', name: 'Made-up drive 2' })).id}:3`,
        `${(await aPart({ category: 'storage', name: 'Made-up drive 3' })).id}:1`,
      ];

      expect(
        await completenessOf([...without(each, 'ram', 'storage'), ...kits, ...drives]),
      ).toEqual({ complete: true, stillNeeded: [], cpuValuesNotKnown: [] });
      expect(
        await completenessOf([
          ...without(each, 'ram', 'storage', 'psu'),
          ...kits,
          ...drives,
        ]),
      ).toEqual({
        complete: false,
        stillNeeded: ['psu'],
        cpuValuesNotKnown: [],
      });
    });
  });

  describe('its refusals', () => {
    // The refusal of a Build, naming `part`, for its reason.
    function refusedFor(reason: string): ExpectedErrorResponse[] {
      return [notValid('part', { reason })];
    }

    it("refuse a value that is not a Part's identifier, naming `part`", async () => {
      const ryzen = await aPart();

      for (const value of [
        'not-a-part',
        '',
        `${ryzen.id}0`,
        ` ${ryzen.id}`,
        `:${ryzen.id}`,
      ]) {
        await expectErrorResponse(
          await readBuild([value]),
          400,
          refusedFor('notAnIdentifier'),
        );
        await expectErrorResponse(
          await readBuild([ryzen.id, value]),
          400,
          refusedFor('notAnIdentifier'),
        );
      }
    });

    it('refuse a quantity that is not a whole number from 1 to 16 in Western digits, naming `part`, whether the catalog holds the Part or not', async () => {
      const kit = await aPart({ category: 'ram', name: 'Made-up kit' });

      for (const quantity of [
        '0',
        '17',
        '100',
        '-1',
        '1.5',
        '',
        ' 2',
        '2 ',
        '٢',
        '1e1',
        'two',
      ]) {
        await expectErrorResponse(
          await readBuild([`${kit.id}:${quantity}`]),
          400,
          refusedFor('notAQuantity'),
        );
        await expectErrorResponse(
          await readBuild([`${randomUUID()}:${quantity}`]),
          400,
          refusedFor('notAQuantity'),
        );
      }
      await expectErrorResponse(
        await readBuild([`${kit.id}:2:2`]),
        400,
        refusedFor('notAQuantity'),
      );
    });

    it('refuse one Part given twice, naming `part`, with the same quantity or another, and in capitals', async () => {
      const ryzen = await aPart();
      const kit = await aPart({ category: 'ram', name: 'Made-up kit' });
      const unknown = randomUUID();

      for (const values of [
        [ryzen.id, ryzen.id],
        [ryzen.id, `${kit.id}:2`, ryzen.id.toUpperCase()],
        [`${kit.id}:2`, `${kit.id}:2`],
        [`${kit.id}:1`, ryzen.id, `${kit.id}:3`],
        [unknown, unknown],
      ]) {
        await expectErrorResponse(await readBuild(values), 400, refusedFor('repeated'));
      }
    });

    it('refuse a quantity on a Part of each Category a Build holds one of, naming `part`, even a quantity of 1', async () => {
      for (const category of ['cpu', 'cpuCooler', 'motherboard', 'gpu', 'case', 'psu']) {
        const single = await aPart({ category, name: `Made-up ${category}` });

        await expectErrorResponse(
          await readBuild([`${single.id}:1`]),
          400,
          refusedFor('quantityGiven'),
        );
        await expectErrorResponse(
          await readBuild([`${single.id}:2`]),
          400,
          refusedFor('quantityGiven'),
        );
      }
    });

    it('refuse a RAM kit or a drive with no quantity, naming `part`', async () => {
      const kit = await aPart({ category: 'ram', name: 'Made-up kit' });
      const drive = await aPart({ category: 'storage', name: 'Made-up drive' });

      await expectErrorResponse(
        await readBuild([kit.id]),
        400,
        refusedFor('quantityMissing'),
      );
      await expectErrorResponse(
        await readBuild([`${kit.id}:1`, drive.id]),
        400,
        refusedFor('quantityMissing'),
      );
    });

    it('refuse two Parts of each Category a Build holds one of, naming `part`', async () => {
      for (const category of ['cpu', 'cpuCooler', 'motherboard', 'gpu', 'case', 'psu']) {
        const one = await aPart({ category, name: `Made-up ${category} one` });
        const other = await aPart({ category, name: `Made-up ${category} other` });

        await expectErrorResponse(
          await readBuild([one.id, other.id]),
          400,
          refusedFor('twoOfACategory'),
        );
      }
    });

    it('refuse more than 8 different RAM kits, or more than 8 different drives, naming `part`, and take 8 of each beside a Part of every other Category', async () => {
      async function several(category: string, count: number): Promise<string[]> {
        const made: string[] = [];
        for (let number = 1; number <= count; number += 1) {
          made.push(
            `${(await aPart({ category, name: `Made-up ${category} ${number}` })).id}:16`,
          );
        }
        return made;
      }
      const kits = await several('ram', 9);
      const drives = await several('storage', 9);
      const singles: string[] = [];
      for (const category of ['cpu', 'cpuCooler', 'motherboard', 'gpu', 'case', 'psu']) {
        singles.push((await aPart({ category, name: `Made-up ${category}` })).id);
      }

      const { parts } = await theBuild([
        ...singles,
        ...kits.slice(0, 8),
        ...drives.slice(0, 8),
      ]);
      expect(parts).toHaveLength(22);

      await expectErrorResponse(await readBuild([...kits]), 400, refusedFor('tooMany'));
      await expectErrorResponse(
        await readBuild([...kits.slice(0, 8), ...drives]),
        400,
        refusedFor('tooMany'),
      );
    });

    it('refuse a missing, empty or unknown currency, naming `currency`, with a Build or without', async () => {
      const ryzen = await aPart();

      const queries: Record<string, string>[] = [
        {},
        { currency: '' },
        { currency: 'EUR' },
        { currency: 'usd' },
      ];
      for (const query of queries) {
        for (const values of [[], [ryzen.id]]) {
          await expectErrorResponse(await readBuild(values, query), 400, [
            notValid('currency'),
          ]);
        }
      }
    });

    it('refuse a parameter the endpoint does not take, naming it', async () => {
      await expectErrorResponse(
        await readBuild([], { currency: 'IQD', parts: randomUUID() }),
        400,
        [notValid('parts')],
      );
    });
  });

  // The rules are judged by `@pcp/compatibility`, whose own tests prove each
  // rule. These prove the wiring: that the Parts reach the rules as the
  // catalog stores them, and that the library's answers reach the API's
  // surface whole.
  describe("the rules' outcomes", () => {
    // One rule's outcome in a Build's answer, if it applies.
    function outcomeOf(rule: number, build: BuildBody): RuleOutcomeBody | undefined {
      return build.outcomes.find((outcome) => outcome.rule === rule);
    }

    it('answer rule 1 as a Compatibility Problem naming the CPU and the motherboard when their sockets differ, and as a pass naming both when they match', async () => {
      const cpu = await aPart({ category: 'cpu', specifications: { socket: 'AM5' } });
      const am4Board = await aPart({
        category: 'motherboard',
        name: 'Made-up AM4 board',
        specifications: { socket: 'AM4' },
      });
      const am5Board = await aPart({
        category: 'motherboard',
        name: 'Made-up AM5 board',
        specifications: { socket: 'AM5' },
      });

      expect((await theBuild([am4Board.id, cpu.id])).outcomes).toEqual([
        { rule: 1, outcome: 'problem', parts: [cpu.id, am4Board.id], missing: [] },
      ]);
      expect((await theBuild([am5Board.id, cpu.id])).outcomes).toEqual([
        { rule: 1, outcome: 'passes', parts: [cpu.id, am5Board.id], missing: [] },
      ]);
    });

    it('answer rule 11 as a Compatibility Warning naming the GPU and the PSU for a GPU with a 12V-2x6 socket and a PSU with 6+2-pin connectors but no such cable', async () => {
      const gpu = await aPart({
        category: 'gpu',
        name: 'Made-up GPU',
        specifications: {
          power_connectors: {
            pcie_6_pin: 0,
            pcie_8_pin: 0,
            pcie_12VHPWR: 0,
            pcie_12V_2x6: 1,
          },
        },
      });
      const psu = await aPart({
        category: 'psu',
        name: 'Made-up PSU',
        specifications: { connectors: { pcie_6_plus_2_pin: 2, pcie_12vhpwr: 0 } },
      });

      expect((await theBuild([psu.id, gpu.id])).outcomes).toEqual([
        { rule: 11, outcome: 'warning', parts: [gpu.id, psu.id], missing: [] },
      ]);
    });

    describe('a needed specification the catalog counts as not known', () => {
      // A case that takes a GPU up to 300 mm long in its 7 expansion slots.
      function aCase(): Promise<PartBody> {
        return aPart({
          category: 'case',
          name: 'Made-up case',
          specifications: { max_video_card_length: 300, expansion_slots: 7 },
        });
      }

      // Rule 9 unchecked for want of the GPU's length, and rule 10 passed.
      function lengthNotKnown(gpuId: string, caseId: string): RuleOutcomeBody[] {
        return [
          {
            rule: 9,
            outcome: 'unchecked',
            parts: [],
            missing: [{ part: gpuId, path: 'length', label: 'Length', fieldLabel: null }],
          },
          { rule: 10, outcome: 'passes', parts: [gpuId, caseId], missing: [] },
        ];
      }

      it('stored as 0 where 0 means "not known" is answered as missing, by its path and English label, and its rule is unchecked', async () => {
        const gpu = await aPart({
          category: 'gpu',
          name: 'Made-up GPU',
          specifications: { length: 250, total_slot_width: 2 },
        });
        await keepSpecificationsAsTheyAre(gpu.id, { length: 0, total_slot_width: 2 });
        const pcCase = await aCase();

        expect((await theBuild([gpu.id, pcCase.id])).outcomes).toEqual(
          lengthNotKnown(gpu.id, pcCase.id),
        );
      });

      it('not held by the Part is answered the same', async () => {
        const gpu = await aPart({
          category: 'gpu',
          name: 'Made-up GPU',
          specifications: { total_slot_width: 2 },
        });
        const pcCase = await aCase();

        expect((await theBuild([gpu.id, pcCase.id])).outcomes).toEqual(
          lengthNotKnown(gpu.id, pcCase.id),
        );
      });

      describe("in a field of a row, a PCIe slot's lanes,", () => {
        // A board whose second row of PCIe slots holds the lanes given, or
        // none, and whose first row holds no 16-lane slot.
        const slotsWithLanes = (
          lanes: Record<string, number>,
        ): Record<string, unknown> => ({
          pcie_slots: [
            { gen: 'PCIe 3.0', quantity: 2, lanes: 1 },
            { gen: 'PCIe 4.0', quantity: 1, ...lanes },
          ],
        });

        // Rule 8 unchecked for want of the second row's lanes.
        function lanesNotKnown(boardId: string): RuleOutcomeBody[] {
          return [
            {
              rule: 8,
              outcome: 'unchecked',
              parts: [],
              missing: [
                {
                  part: boardId,
                  path: 'pcie_slots.1.lanes',
                  label: 'PCIe slots',
                  fieldLabel: 'Lanes',
                },
              ],
            },
          ];
        }

        it('stored as 0 leaves rule 8 unchecked when the Build has a GPU, naming the field by its path and both labels', async () => {
          const board = await aPart({
            category: 'motherboard',
            name: 'Made-up board',
            specifications: slotsWithLanes({ lanes: 16 }),
          });
          await keepSpecificationsAsTheyAre(board.id, slotsWithLanes({ lanes: 0 }));
          const gpu = await aPart({ category: 'gpu', name: 'Made-up GPU' });

          expect((await theBuild([board.id, gpu.id])).outcomes).toEqual(
            lanesNotKnown(board.id),
          );
        });

        it('not held leaves it unchecked the same', async () => {
          const board = await aPart({
            category: 'motherboard',
            name: 'Made-up board',
            specifications: slotsWithLanes({}),
          });
          const gpu = await aPart({ category: 'gpu', name: 'Made-up GPU' });

          expect((await theBuild([board.id, gpu.id])).outcomes).toEqual(
            lanesNotKnown(board.id),
          );
        });
      });
    });

    it('answer no outcome for a rule whose Parts the Build lacks: without a case, none for rules 7, 9, 10, 15, 17, 18, 19 and 21, and every other rule in rule order', async () => {
      const values: Record<string, string> = {};
      for (const category of everyCategory) {
        const made = await aPart({ category, name: `Made-up ${category}` });
        values[category] = ['ram', 'storage'].includes(category) ? `${made.id}:1` : made.id;
      }
      const rulesAnswered = async (categories: readonly string[]): Promise<number[]> =>
        (await theBuild(categories.map((category) => values[category]))).outcomes.map(
          ({ rule }) => rule,
        );

      expect(
        await rulesAnswered(everyCategory.filter((category) => category !== 'case')),
      ).toEqual([1, 2, 3, 4, 5, 6, 8, 11, 12, 13, 14, 16, 20]);
      expect(await rulesAnswered(everyCategory)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      ]);
    });

    it('judge every Part, one whose only Vendor was deactivated and one that no Vendor has in stock among them', async () => {
      const cpu = await aPart({ category: 'cpu', specifications: { socket: 'AM5' } });
      const board = await aPart({
        category: 'motherboard',
        name: 'Made-up AM4 board',
        specifications: { socket: 'AM4' },
      });
      const deactivated = await aVendor('Made-up deactivated shop');
      await anOffer(deactivated.id, cpu.id);
      await admin('deactivate', deactivated.id);
      await anOffer((await aVendor('Made-up shop out of stock')).id, board.id, false);
      const { parts, outcomes } = await theBuild([cpu.id, board.id]);

      // The CPU is no longer a Visible Part; the board is one, out of stock.
      expect(parts.map(({ visible }) => visible)).toEqual([false, true]);
      expect(outcomes).toEqual([
        { rule: 1, outcome: 'problem', parts: [cpu.id, board.id], missing: [] },
      ]);
    });

    it("count a RAM kit as many times as the Build holds it: two of a kit of two modules fill a board's two slots twice over, under rule 5", async () => {
      const board = await aPart({
        category: 'motherboard',
        name: 'Made-up board',
        specifications: { memory: { slots: 2 } },
      });
      const kit = await aPart({
        category: 'ram',
        name: 'Made-up kit',
        specifications: { modules: { quantity: 2 } },
      });

      expect(outcomeOf(5, await theBuild([board.id, `${kit.id}:1`]))).toEqual({
        rule: 5,
        outcome: 'passes',
        parts: [board.id, kit.id],
        missing: [],
      });
      expect(outcomeOf(5, await theBuild([board.id, `${kit.id}:2`]))).toEqual({
        rule: 5,
        outcome: 'problem',
        parts: [board.id, kit.id],
        missing: [],
      });
    });
  });

  // As `estimatedPowerDrawOf` answers it, so that no API code adds a TDP.
  describe('the Estimated power draw', () => {
    // A CPU, and a GPU, of the TDP given, or none.
    function aCpu(specifications: Record<string, unknown>): Promise<PartBody> {
      return aPart({ category: 'cpu', name: 'Made-up CPU', specifications });
    }
    function aGpu(specifications: Record<string, unknown>): Promise<PartBody> {
      return aPart({ category: 'gpu', name: 'Made-up GPU', specifications });
    }

    it("is the CPU's TDP plus the GPU's plus 100 W, or the CPU's plus 100 W without a GPU", async () => {
      const cpu = await aCpu({ specifications: { tdp: 65 } });
      const gpu = await aGpu({ tdp: 220 });
      const board = await aPart({ category: 'motherboard', name: 'Made-up board' });

      expect((await theBuild([cpu.id, gpu.id, board.id])).estimatedPowerDraw).toEqual({
        watts: 385,
        missing: [],
      });
      expect((await theBuild([cpu.id, board.id])).estimatedPowerDraw).toEqual({
        watts: 165,
        missing: [],
      });
    });

    it('names each missing TDP by its Part, its path and its English label, with no watts', async () => {
      const cpu = await aCpu({ socket: 'AM5' });
      const gpu = await aGpu({ tdp: 220 });
      await keepSpecificationsAsTheyAre(gpu.id, { tdp: 0 });

      expect((await theBuild([gpu.id, cpu.id])).estimatedPowerDraw).toEqual({
        watts: null,
        missing: [
          { part: cpu.id, path: 'specifications.tdp', label: 'TDP', fieldLabel: null },
          { part: gpu.id, path: 'tdp', label: 'TDP', fieldLabel: null },
        ],
      });
    });

    it('is none for a Build without a CPU, whatever else it holds', async () => {
      const gpu = await aGpu({ tdp: 220 });
      const psu = await aPart({
        category: 'psu',
        name: 'Made-up PSU',
        specifications: { wattage: 750 },
      });

      expect((await theBuild([gpu.id, psu.id])).estimatedPowerDraw).toBeNull();
    });
  });

  describe('who may read it', () => {
    it("answers the same without a token and with any token, an Admin's or a Vendor's among them", async () => {
      const ryzen = await aPart();
      const kit = await aPart({ category: 'ram', name: 'Made-up kit' });
      const shop = await aVendor();
      await anOffer(shop.id, ryzen.id);
      const values = [ryzen.id, `${kit.id}:2`];
      const withoutAToken = await theBuild(values);
      expect(withoutAToken.parts).toHaveLength(2);

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
        const response = await readBuild(values, { currency: 'IQD' }, bearerHeader(token));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(withoutAToken);
      }
    });
  });
});
