import {
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

// One result of a search, and a page of them, as the API answers.
type FoundPart = {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  partNumbers: string[];
};

type PageOfParts = {
  content: FoundPart[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

describe('searching the catalog', () => {
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

  async function aPart(
    category: string,
    name: string,
    manufacturer: string,
    partNumbers: string[] = [],
  ): Promise<FoundPart> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(adminToken), 'content-type': 'application/json' },
      body: JSON.stringify({ category, name, manufacturer, partNumbers }),
    });
    expect(response.status).toBe(201);
    const { id } = (await response.json()) as { id: string };
    return { id, category, name, manufacturer, partNumbers };
  }

  function search(query: Record<string, string>, token = adminToken): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/parts?${new URLSearchParams(query)}`, {
      headers: bearerHeader(token),
    });
  }

  async function namesFound(query: Record<string, string>): Promise<string[]> {
    const response = await search(query);
    expect(response.status).toBe(200);
    return ((await response.json()) as PageOfParts).content.map((part) => part.name);
  }

  it('finds a Part by a word of its name, of its manufacturer or of a part number, in any case', async () => {
    const ryzen = await aPart('cpu', 'Made-up Ryzen 5 7600', 'AMD', ['100-100001015BOX']);
    await aPart('gpu', 'Made-up RTX 4060', 'NVIDIA', ['RTX4060-MU']);

    for (const word of ['ryzen', 'RYZEN', 'amd', '100001015box']) {
      const response = await search({ search: word });
      expect({ word, found: ((await response.json()) as PageOfParts).content }).toEqual({
        word,
        found: [ryzen],
      });
    }
  });

  it('finds only the Parts that hold every word, in any order', async () => {
    await aPart('cpu', 'Made-up Ryzen 5 7600', 'AMD');
    await aPart('cpu', 'Made-up Ryzen 7 7700', 'AMD');
    await aPart('cpuCooler', 'Made-up Wraith for Ryzen', 'Made-up Cooling');

    expect(await namesFound({ search: '7600 ryzen' })).toEqual(['Made-up Ryzen 5 7600']);
    expect(await namesFound({ search: 'amd ryzen' })).toEqual([
      'Made-up Ryzen 5 7600',
      'Made-up Ryzen 7 7700',
    ]);
  });

  it('finds every Part when the term is empty or left out', async () => {
    await aPart('cpu', 'Made-up B', 'AMD');
    await aPart('gpu', 'Made-up A', 'NVIDIA');

    expect(await namesFound({})).toEqual(['Made-up A', 'Made-up B']);
    expect(await namesFound({ search: '   ' })).toEqual(['Made-up A', 'Made-up B']);
  });

  it('finds only the Parts of a Category when one is given', async () => {
    await aPart('cpu', 'Made-up Ryzen 5 7600', 'AMD');
    await aPart('cpuCooler', 'Made-up Wraith for Ryzen', 'Made-up Cooling');

    expect(await namesFound({ search: 'ryzen', category: 'cpuCooler' })).toEqual([
      'Made-up Wraith for Ryzen',
    ]);
  });

  it('takes % and _ in a term as themselves, not as patterns', async () => {
    await aPart('ram', 'Made-up 100% DDR5', 'Made-up Memory');
    await aPart('ram', 'Made-up 1000 DDR5', 'Made-up Memory');

    expect(await namesFound({ search: '100%' })).toEqual(['Made-up 100% DDR5']);
    expect(await namesFound({ search: '1_00' })).toEqual([]);
  });

  it('takes a backslash in a term as itself', async () => {
    await aPart('storage', 'Made-up C:\\ Drive', 'Made-up Storage');
    await aPart('storage', 'Made-up C: Drive', 'Made-up Storage');

    expect(await namesFound({ search: 'c:\\' })).toEqual(['Made-up C:\\ Drive']);
  });

  it('answers a page far past the last one as empty, and refuses a page number past the largest', async () => {
    await aPart('psu', 'Made-up A', 'Made-up Power');

    const farPast = await search({ page: '1000000' });
    expect(((await farPast.json()) as PageOfParts).content).toEqual([]);

    await expectErrorResponse(await search({ page: '1e20' }), 400, [notValid('page')]);
  });

  it('gives each Part once across the pages, in name order, with the totals', async () => {
    for (const letter of ['E', 'C', 'A', 'D', 'B'])
      await aPart('psu', `Made-up ${letter}`, 'Made-up Power');

    const pages = await Promise.all(
      ['0', '1', '2'].map(async (page) => {
        const response = await search({ page, size: '2' });
        return (await response.json()) as PageOfParts;
      }),
    );

    expect(pages.flatMap((page) => page.content.map((part) => part.name))).toEqual([
      'Made-up A',
      'Made-up B',
      'Made-up C',
      'Made-up D',
      'Made-up E',
    ]);
    expect(pages.map(({ content: _content, ...paging }) => paging)).toEqual([
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
  });

  it('gives an empty page past the last one', async () => {
    await aPart('psu', 'Made-up A', 'Made-up Power');

    const response = await search({ page: '5', size: '2' });

    expect(((await response.json()) as PageOfParts).content).toEqual([]);
  });

  it('refuses a page size over the largest, naming it', async () => {
    const response = await search({ size: '1000' });

    await expectErrorResponse(response, 400, [notValid('size')]);
  });

  it('refuses a Category outside the eight, naming it', async () => {
    const response = await search({ category: 'monitor' });

    await expectErrorResponse(response, 400, [notValid('category')]);
  });

  it('answers a Vendor as it answers the Admin', async () => {
    await aPart('cpu', 'Made-up Ryzen 5 7600', 'AMD');
    const vendorToken = await testApp.tokenOf({ roles: ['vendor'] });

    const asVendor = await search({ search: 'ryzen' }, vendorToken);
    const asAdmin = await search({ search: 'ryzen' });

    expect(asVendor.status).toBe(200);
    expect(await asVendor.json()).toEqual(await asAdmin.json());
  });

  it('refuses a call without a token', async () => {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`);

    await expectErrorResponse(response, 401, unauthorized);
  });
});
