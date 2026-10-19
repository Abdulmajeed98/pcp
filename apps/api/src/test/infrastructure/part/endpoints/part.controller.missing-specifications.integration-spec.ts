import {
  accessDenied,
  bearerHeader,
  expectErrorResponse,
  unauthorized,
} from '@pcp/core/test-utils';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import {
  emptyTheDatabase,
  keepSpecificationsAsTheyAre,
} from '../../../test-utils/database/test-database';
import {
  emptyTheRealm,
  loginsNamed,
} from '../../../test-utils/keycloak/keycloak-administrator';

// The Admin's list of the Parts that have an Offer and lack a needed
// specification (CAT-8).

// A missing needed specification, as the list names it.
type MissingSpecificationBody = { path: string; label: string };

// A Part on the list, as the API answers it.
type PartMissingSpecificationsBody = {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  missingSpecifications: MissingSpecificationBody[];
  offerCount: number;
};

type ListBody = {
  content: PartMissingSpecificationsBody[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

// A made-up CPU's every needed specification, and nothing else.
const aWholeCpu = {
  socket: 'AM5',
  specifications: { tdp: 65, memory: { types: ['DDR5'] } },
};

// The same CPU without its TDP.
const aCpuWithoutTdp = { socket: 'AM5', specifications: { memory: { types: ['DDR5'] } } };

const tdp = { path: 'specifications.tdp', label: 'TDP' };

describe('the Parts missing specifications', () => {
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

  // A token of the Admin. Made when it is needed, so that it is judged by
  // the clock that is current then.
  function adminToken(): Promise<string> {
    return testApp.tokenOf({ roles: ['admin'] });
  }

  async function asTheAdmin(
    method: string,
    address: string,
    body?: unknown,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}${address}`, {
      method,
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  // A made-up Part the Admin adds to the catalog, by its identifier.
  async function aPart(fields: Record<string, unknown>): Promise<string> {
    const response = await asTheAdmin('POST', '/v1/parts', {
      category: 'cpu',
      name: 'Made-up Ryzen 5 7600',
      manufacturer: 'AMD',
      ...fields,
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { id: string }).id;
  }

  // A made-up Vendor the Admin creates. Each has a login phone number of its
  // own.
  let vendorsMade = 0;
  async function aVendor(): Promise<{ id: string; loginName: string }> {
    vendorsMade += 1;
    const response = await asTheAdmin('POST', '/v1/vendors', {
      name: `Made-up Computer Shop ${vendorsMade}`,
      city: 'erbil',
      address: 'Made-up Street, Erbil',
      phoneNumber: '066 223 4567',
      loginPhoneNumber: `0750 123 ${String(4500 + vendorsMade)}`,
    });
    expect(response.status).toBe(201);
    const { vendor } = (await response.json()) as {
      vendor: { id: string; loginPhoneNumber: { international: string } };
    };
    return { id: vendor.id, loginName: vendor.loginPhoneNumber.international };
  }

  // An Offer for the Part from the Vendor, as the Admin adds it.
  async function anOffer(vendorId: string, partId: string): Promise<void> {
    const response = await asTheAdmin('POST', `/v1/vendors/${vendorId}/offers`, {
      partId,
      usdPrice: '349.99',
      inStock: true,
    });
    expect(response.status).toBe(201);
  }

  // A Part with an Offer from each of as many Vendors as asked.
  async function anOfferedPart(
    fields: Record<string, unknown>,
    vendorIds: readonly string[],
  ): Promise<string> {
    const partId = await aPart(fields);
    for (const vendorId of vendorIds) await anOffer(vendorId, partId);
    return partId;
  }

  async function listMissing(token: string | null, query = ''): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/parts/missing-specifications${query}`, {
      headers: token === null ? {} : bearerHeader(token),
    });
  }

  async function theList(query = ''): Promise<ListBody> {
    const response = await listMissing(await adminToken(), query);
    expect(response.status).toBe(200);
    return (await response.json()) as ListBody;
  }

  async function idsOnTheList(query = ''): Promise<string[]> {
    return (await theList(query)).content.map((each) => each.id);
  }

  it('lists a Part with an Offer and an empty needed specification, naming it', async () => {
    const vendor = await aVendor();
    const partId = await anOfferedPart(
      { partNumbers: ['100-100001015BOX'], specifications: aCpuWithoutTdp },
      [vendor.id],
    );

    expect(await theList()).toEqual({
      content: [
        {
          id: partId,
          category: 'cpu',
          name: 'Made-up Ryzen 5 7600',
          manufacturer: 'AMD',
          missingSpecifications: [tdp],
          offerCount: 1,
        },
      ],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });
  });

  it('names every missing needed specification, in its list order, with its label', async () => {
    const vendor = await aVendor();
    await anOfferedPart({ specifications: {} }, [vendor.id]);

    const [listed] = (await theList()).content;
    expect(listed.missingSpecifications).toEqual([
      { path: 'socket', label: 'Socket' },
      tdp,
      { path: 'specifications.memory.types', label: 'Memory types' },
    ]);
  });

  it('leaves out a Part with the same gap and no Offer', async () => {
    await aPart({ specifications: aCpuWithoutTdp });

    expect(await theList()).toMatchObject({ content: [], totalElements: 0 });
  });

  it('leaves out a Part with an Offer that lacks only specifications that are not needed', async () => {
    const vendor = await aVendor();
    // A CPU's series, cores and clocks are left out, and none is needed.
    await anOfferedPart({ specifications: aWholeCpu }, [vendor.id]);

    expect(await theList()).toMatchObject({ content: [], totalElements: 0 });
  });

  it('drops a Part once the Admin fills its gaps through its edit', async () => {
    const vendor = await aVendor();
    const partId = await anOfferedPart({ specifications: aCpuWithoutTdp }, [vendor.id]);
    expect(await idsOnTheList()).toEqual([partId]);

    const edited = await asTheAdmin('PUT', `/v1/parts/${partId}`, {
      name: 'Made-up Ryzen 5 7600',
      manufacturer: 'AMD',
      specifications: aWholeCpu,
    });
    expect(edited.status).toBe(200);

    expect(await theList()).toMatchObject({ content: [], totalElements: 0 });
  });

  it('counts 0 as missing where 0 means "not known", as the Part itself does', async () => {
    const vendor = await aVendor();
    const partId = await anOfferedPart({ specifications: aWholeCpu }, [vendor.id]);
    // As a Part kept before 0 meant "not known" for a CPU's TDP would hold it.
    await keepSpecificationsAsTheyAre(partId, {
      ...aWholeCpu,
      specifications: { ...aWholeCpu.specifications, tdp: 0 },
    });

    const [listed] = (await theList()).content;
    expect(listed).toMatchObject({ id: partId, missingSpecifications: [tdp] });

    const read = await asTheAdmin('GET', `/v1/parts/${partId}`);
    expect(
      ((await read.json()) as { missingNeededSpecifications: string[] })
        .missingNeededSpecifications,
    ).toEqual(['specifications.tdp']);
  });

  it('counts every Offer, from a deactivated Vendor and an expired one among them', async () => {
    const [active, leaving, longAgo] = [await aVendor(), await aVendor(), await aVendor()];
    const partId = await aPart({ specifications: aCpuWithoutTdp });
    await anOffer(active.id, partId);
    await anOffer(leaving.id, partId);
    // Confirmed a year ago, so long Expired.
    moveTheClockTo(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
    await anOffer(longAgo.id, partId);
    letTheClockRun();
    const deactivated = await asTheAdmin('POST', `/v1/vendors/${leaving.id}/deactivate`);
    expect(deactivated.status).toBe(200);

    expect((await theList()).content).toEqual([
      expect.objectContaining({ id: partId, offerCount: 3 }),
    ]);
  });

  it('orders by Category in the order of the eight, then by Offers, most first, then by name', async () => {
    const vendors = [await aVendor(), await aVendor(), await aVendor()];
    const ids = (count: number): string[] => vendors.slice(0, count).map((each) => each.id);
    // A PSU lacking its form factor, and CPUs lacking their TDP.
    const psu = await anOfferedPart(
      {
        category: 'psu',
        name: 'Made-up 650 W',
        manufacturer: 'Made-up Power',
        specifications: {},
      },
      ids(3),
    );
    const cpuOfferedOnce = await anOfferedPart(
      { name: 'Made-up Athlon 3000G', specifications: aCpuWithoutTdp },
      ids(1),
    );
    const cpuOfferedTwiceB = await anOfferedPart(
      { name: 'Made-up Ryzen 7 9700X', specifications: aCpuWithoutTdp },
      ids(2),
    );
    const cpuOfferedTwiceA = await anOfferedPart(
      { name: 'Made-up Ryzen 5 9600X', specifications: aCpuWithoutTdp },
      ids(2),
    );

    expect(await idsOnTheList()).toEqual([
      cpuOfferedTwiceA,
      cpuOfferedTwiceB,
      cpuOfferedOnce,
      psu,
    ]);
  });

  it('answers a page at a time, with the total', async () => {
    const vendor = await aVendor();
    const names = ['Made-up A', 'Made-up B', 'Made-up C'];
    const parts: string[] = [];
    for (const name of names) {
      parts.push(
        await anOfferedPart({ name, specifications: aCpuWithoutTdp }, [vendor.id]),
      );
    }

    const second = await theList('?page=1&size=2');
    expect(second).toMatchObject({
      pageNumber: 1,
      pageSize: 2,
      totalElements: 3,
      totalPages: 2,
      first: false,
      last: true,
    });
    expect(second.content.map((each) => each.id)).toEqual([parts[2]]);
  });

  it('refuses a Vendor', async () => {
    const vendor = await aVendor();
    const [login] = await loginsNamed(vendor.loginName);
    const vendorToken = await testApp.tokenOf({
      subject: login.id,
      loginName: vendor.loginName,
      roles: ['vendor'],
    });

    await expectErrorResponse(await listMissing(vendorToken), 403, accessDenied);
  });

  it('refuses a call without a token', async () => {
    await expectErrorResponse(await listMissing(null), 401, unauthorized);
  });
});
