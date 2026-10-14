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

  it("marks as needed exactly the CPU's specifications that the Compatibility Rules read", async () => {
    const [cpu] = await readCategories(['admin']);

    // Written out from the MVP spec's table of Compatibility Rules, and not
    // read from the platform: rules 1 and 2 read the socket, rule 3 the
    // memory types and rule 12 the TDP.
    expect(
      cpu.specifications
        .filter((specification) => specification.needed)
        .map((each) => each.path),
    ).toEqual(
      expect.arrayContaining([
        'socket',
        'specifications.memory.types',
        'specifications.tdp',
      ]),
    );
    expect(cpu.specifications.filter((specification) => specification.needed)).toHaveLength(
      3,
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
    expect(memoryTypes?.values).toEqual(['DDR3', 'DDR4', 'DDR5']);
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
