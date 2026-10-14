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
