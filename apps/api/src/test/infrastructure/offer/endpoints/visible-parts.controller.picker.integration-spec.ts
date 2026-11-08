import { randomUUID } from 'node:crypto';

import { bearerHeader } from '@pcp/core/test-utils';

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
};

type PageOfVisibleParts = {
  content: VisiblePartBody[];
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
});
