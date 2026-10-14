import { bearerHeader, expectErrorResponse, unauthorized } from '@pcp/core/test-utils';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';

// A specification as the API describes it.
type SpecificationBody = {
  path: string;
  label: string;
  kind: string;
  unit?: string;
  values?: string[];
  needed: boolean;
  zeroMeansMissing: boolean;
};

type CategoryBody = { key: string; specifications: SpecificationBody[] };

describe('the Categories endpoint', () => {
  let testApp: TestAppWithLogins;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
  });

  afterAll(async () => {
    await testApp.close();
  });

  async function readCategories(roles: string[]): Promise<CategoryBody[]> {
    const token = await testApp.tokenOf({ roles });
    const response = await fetch(`${testApp.baseUrl}/v1/categories`, {
      headers: bearerHeader(token),
    });
    expect(response.status).toBe(200);
    return (await response.json()) as CategoryBody[];
  }

  it('answers the eight Categories, in their order', async () => {
    const categories = await readCategories(['admin']);

    expect(categories.map((category) => category.key)).toEqual([
      'cpu',
      'cpuCooler',
      'motherboard',
      'ram',
      'storage',
      'gpu',
      'case',
      'psu',
    ]);
  });

  // Each Category's needed specifications, written out from the MVP spec's
  // table of Compatibility Rules and not read from the platform. Where the
  // table names an object, the specifications in it that a rule counts are
  // listed: a motherboard's SATA ports (rule 13), a GPU's power sockets
  // (rule 11) and a PSU's connectors (rules 11, 16 and 20).
  const neededByTheRules: Record<string, string[]> = {
    cpu: ['socket', 'specifications.memory.types', 'specifications.tdp'],
    cpuCooler: ['cpu_sockets', 'height'],
    motherboard: [
      'socket',
      'form_factor',
      'memory.ram_type',
      'memory.slots',
      'memory.max',
      'pcie_slots',
      'm2_slots',
      'storage_devices.sata_6_gb_s',
      'storage_devices.sata_3_gb_s',
      'power_connectors.cpu_power',
      'back_connect_connectors',
    ],
    ram: ['ram_type', 'modules.quantity', 'modules.capacity_gb'],
    storage: ['interface', 'form_factor'],
    gpu: [
      'length',
      'total_slot_width',
      'tdp',
      'power_connectors.pcie_6_pin',
      'power_connectors.pcie_8_pin',
      'power_connectors.pcie_12VHPWR',
      'power_connectors.pcie_12V_2x6',
    ],
    case: [
      'supported_motherboard_form_factors',
      'max_video_card_length',
      'expansion_slots',
      'internal_3_5_bays',
      'internal_2_5_bays',
      'max_cpu_cooler_height',
      'supported_power_supply_form_factors',
      'max_psu_length',
      'supports_rear_connecting_motherboard',
    ],
    psu: [
      'wattage',
      'form_factor',
      'length',
      'connectors.eps_8_pin',
      'connectors.pcie_6_plus_2_pin',
      'connectors.pcie_12vhpwr',
      'connectors.sata',
    ],
  };

  it('marks as needed exactly the specifications the Compatibility Rules read, in every Category', async () => {
    const categories = await readCategories(['admin']);

    for (const category of categories) {
      const needed = category.specifications
        .filter((each) => each.needed)
        .map((each) => each.path);
      expect({ category: category.key, needed: [...needed].sort() }).toEqual({
        category: category.key,
        needed: [...neededByTheRules[category.key]].sort(),
      });
    }
  });

  it('gives every Category a specification list', async () => {
    const categories = await readCategories(['admin']);

    for (const category of categories) {
      expect({
        category: category.key,
        empty: category.specifications.length === 0,
      }).toEqual({
        category: category.key,
        empty: false,
      });
    }
  });

  it('gives the values a Compatibility Rule compares one set for every Category that has them', async () => {
    const categories = await readCategories(['admin']);
    const valuesOf = (key: string, path: string) => {
      const values = categories
        .find((category) => category.key === key)
        ?.specifications.find((each) => each.path === path)?.values;
      expect({ key, path, values }).toEqual({ key, path, values: expect.any(Array) });
      return values;
    };

    expect(valuesOf('motherboard', 'socket')).toEqual(valuesOf('cpu', 'socket'));
    expect(valuesOf('cpuCooler', 'cpu_sockets')).toEqual(valuesOf('cpu', 'socket'));
    expect(valuesOf('motherboard', 'memory.ram_type')).toEqual(valuesOf('ram', 'ram_type'));
    expect(valuesOf('cpu', 'specifications.memory.types')).toEqual(
      valuesOf('ram', 'ram_type'),
    );
    expect(valuesOf('case', 'supported_motherboard_form_factors')).toEqual(
      valuesOf('motherboard', 'form_factor'),
    );
    expect(valuesOf('case', 'supported_power_supply_form_factors')).toEqual(
      valuesOf('psu', 'form_factor'),
    );
  });

  it("gives the CPU's socket as one of a fixed set, and its memory types as several of one", async () => {
    const [cpu] = await readCategories(['admin']);
    const socket = cpu.specifications.find((each) => each.path === 'socket');
    const memoryTypes = cpu.specifications.find(
      (each) => each.path === 'specifications.memory.types',
    );

    expect(socket?.kind).toBe('oneOf');
    expect(socket?.values).toEqual(expect.arrayContaining(['AM5', 'LGA 1700', 'LGA 1851']));
    expect(memoryTypes?.kind).toBe('severalOf');
    expect(memoryTypes?.values).toEqual(['DDR1', 'DDR2', 'DDR3', 'DDR4', 'DDR5']);
  });

  it('gives each specification an English label, and a number its unit', async () => {
    const [cpu] = await readCategories(['admin']);
    const tdp = cpu.specifications.find((each) => each.path === 'specifications.tdp');

    expect(cpu.specifications.every((each) => each.label.length > 0)).toBe(true);
    expect(tdp).toMatchObject({ kind: 'wholeNumber', unit: 'W', zeroMeansMissing: true });
  });

  it('answers a Vendor as it answers the Admin', async () => {
    expect(await readCategories(['vendor'])).toEqual(await readCategories(['admin']));
  });

  it('refuses a call without a token', async () => {
    const response = await fetch(`${testApp.baseUrl}/v1/categories`);

    await expectErrorResponse(response, 401, unauthorized);
  });
});
