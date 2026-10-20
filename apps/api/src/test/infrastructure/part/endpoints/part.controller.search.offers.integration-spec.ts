import { randomUUID } from 'node:crypto';

import {
  bearerHeader,
  expectErrorResponse,
  type ExpectedErrorResponse,
  notValid,
} from '@pcp/core/test-utils';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../../test-utils/database/test-database';
import {
  emptyTheRealm,
  loginsNamed,
} from '../../../test-utils/keycloak/keycloak-administrator';

// The catalog search, asked for a Vendor, names that Vendor's Offer for each
// Part it finds, so that a result in the Vendor portal leads to the Offer
// rather than to a second one (OFF-1, OFF-3). It never names another
// Vendor's.

// One result of a search, as far as these tests read it.
type FoundPart = { id: string; name: string; offerId: string | null };

type PageOfParts = { content: FoundPart[]; totalElements: number };

// The refusals these tests expect, each as a whole.
function refusal(code: string): ExpectedErrorResponse[] {
  const key = code.toLowerCase();
  return [{ code, title: `${key}_title`, detail: `${key}_details` }];
}
const vendorAccessDenied = refusal('VENDOR_ACCESS_DENIED');
const vendorDeactivated = refusal('VENDOR_DEACTIVATED');
const vendorNotFound = refusal('VENDOR_NOT_FOUND');

describe('searching the catalog for a Vendor', () => {
  let testApp: TestAppWithLogins;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
  });

  afterAll(async () => {
    await testApp.close();
  });

  afterEach(async () => {
    await emptyTheDatabase();
    await emptyTheRealm();
  });

  function adminToken(): Promise<string> {
    return testApp.tokenOf({ roles: ['admin'] });
  }

  async function asTheAdmin(address: string, body?: unknown): Promise<Response> {
    return fetch(`${testApp.baseUrl}${address}`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  // A made-up Vendor the Admin creates, with a Login of its own, and a token
  // of that Login, as Keycloak issues it.
  let vendorsMade = 0;
  async function aVendor(): Promise<{ id: string; token: string }> {
    vendorsMade += 1;
    const response = await asTheAdmin('/v1/vendors', {
      name: `Made-up Computer Shop ${String(vendorsMade)}`,
      city: 'erbil',
      address: 'Made-up Street, Erbil',
      phoneNumber: '066 223 4567',
      loginPhoneNumber: `0750 123 ${String(4600 + vendorsMade)}`,
    });
    expect(response.status).toBe(201);
    const { vendor } = (await response.json()) as {
      vendor: { id: string; loginPhoneNumber: { international: string } };
    };
    const [login] = await loginsNamed(vendor.loginPhoneNumber.international);
    const token = await testApp.tokenOf({
      subject: login.id,
      loginName: vendor.loginPhoneNumber.international,
      roles: ['vendor'],
    });
    return { id: vendor.id, token };
  }

  // A made-up Part the Admin adds to the catalog, by its identifier.
  async function aPart(name: string): Promise<string> {
    const response = await asTheAdmin('/v1/parts', {
      category: 'cpu',
      name,
      manufacturer: 'AMD',
      partNumbers: [`MU-${name.replaceAll(' ', '-')}`],
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { id: string }).id;
  }

  // The Vendor's Offer for the Part, as the Admin adds it, by its identifier.
  async function anOffer(vendorId: string, partId: string): Promise<string> {
    const response = await asTheAdmin(`/v1/vendors/${vendorId}/offers`, {
      partId,
      usdPrice: '349.99',
      inStock: true,
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { id: string }).id;
  }

  function search(query: Record<string, string>, token: string): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/parts?${new URLSearchParams(query)}`, {
      headers: bearerHeader(token),
    });
  }

  // What a search found, each Part by its name with the Offer it names.
  async function offersNamed(
    query: Record<string, string>,
    token: string,
  ): Promise<Record<string, string | null>> {
    const response = await search(query, token);
    expect(response.status).toBe(200);
    const { content } = (await response.json()) as PageOfParts;
    return Object.fromEntries(content.map(({ name, offerId }) => [name, offerId]));
  }

  // Three Parts: one the Vendor offers, one only another Vendor offers, and
  // one both offer.
  async function twoVendorsAndTheirOffers() {
    const vendor = await aVendor();
    const another = await aVendor();
    const onlyOurs = await aPart('Made-up Ryzen 5 7600');
    const onlyTheirs = await aPart('Made-up Ryzen 7 7700');
    const both = await aPart('Made-up Ryzen 9 7900');
    const ours = {
      onlyOurs: await anOffer(vendor.id, onlyOurs),
      both: await anOffer(vendor.id, both),
    };
    const theirs = {
      onlyTheirs: await anOffer(another.id, onlyTheirs),
      both: await anOffer(another.id, both),
    };
    return { vendor, another, ours, theirs };
  }

  it("names the Vendor's own Offer for each Part it offers, and no other Vendor's, for its own Login", async () => {
    const { vendor, ours } = await twoVendorsAndTheirOffers();

    const expected = {
      'Made-up Ryzen 5 7600': ours.onlyOurs,
      'Made-up Ryzen 7 7700': null,
      'Made-up Ryzen 9 7900': ours.both,
    };
    expect(await offersNamed({ search: 'ryzen' }, vendor.token)).toEqual(expected);
    expect(
      await offersNamed({ search: 'ryzen', vendorId: vendor.id }, vendor.token),
    ).toEqual(expected);
  });

  it('names each Part once, also when several Vendors offer it', async () => {
    const { vendor } = await twoVendorsAndTheirOffers();

    const response = await search({ search: 'ryzen' }, vendor.token);
    const { content, totalElements } = (await response.json()) as PageOfParts;

    expect(content.map(({ name }) => name)).toEqual([
      'Made-up Ryzen 5 7600',
      'Made-up Ryzen 7 7700',
      'Made-up Ryzen 9 7900',
    ]);
    expect(totalElements).toBe(3);
  });

  it("names the Offers of the Vendor the Admin gives, and no Vendor's when none is given", async () => {
    const { another, theirs } = await twoVendorsAndTheirOffers();

    expect(
      await offersNamed({ search: 'ryzen', vendorId: another.id }, await adminToken()),
    ).toEqual({
      'Made-up Ryzen 5 7600': null,
      'Made-up Ryzen 7 7700': theirs.onlyTheirs,
      'Made-up Ryzen 9 7900': theirs.both,
    });
    expect(await offersNamed({ search: 'ryzen' }, await adminToken())).toEqual({
      'Made-up Ryzen 5 7600': null,
      'Made-up Ryzen 7 7700': null,
      'Made-up Ryzen 9 7900': null,
    });
  });

  it("names a deactivated Vendor's Offers for the Admin, and refuses the Vendor's own token with 403 and VENDOR_DEACTIVATED", async () => {
    const vendor = await aVendor();
    const partId = await aPart('Made-up Ryzen 5 7600');
    const offerId = await anOffer(vendor.id, partId);
    expect((await asTheAdmin(`/v1/vendors/${vendor.id}/deactivate`)).status).toBe(200);

    expect(
      await offersNamed({ search: 'ryzen', vendorId: vendor.id }, await adminToken()),
    ).toEqual({ 'Made-up Ryzen 5 7600': offerId });
    await expectErrorResponse(
      await search({ search: 'ryzen' }, vendor.token),
      403,
      vendorDeactivated,
    );
  });

  it("refuses a Vendor's token that names another Vendor with 403 and VENDOR_ACCESS_DENIED, whether that Vendor exists or not", async () => {
    const { vendor, another } = await twoVendorsAndTheirOffers();

    for (const vendorId of [another.id, randomUUID(), 'not-an-identifier']) {
      await expectErrorResponse(
        await search({ search: 'ryzen', vendorId }, vendor.token),
        403,
        vendorAccessDenied,
      );
    }
  });

  it('answers the Admin naming a Vendor that does not exist with 404 and VENDOR_NOT_FOUND', async () => {
    await aPart('Made-up Ryzen 5 7600');

    await expectErrorResponse(
      await search({ vendorId: randomUUID() }, await adminToken()),
      404,
      vendorNotFound,
    );
  });

  it('names no Offer for a Login with no Vendor behind it', async () => {
    const { another } = await twoVendorsAndTheirOffers();
    const noVendor = await testApp.tokenOf({ roles: ['vendor'] });

    expect(await offersNamed({ search: 'ryzen' }, noVendor)).toEqual({
      'Made-up Ryzen 5 7600': null,
      'Made-up Ryzen 7 7700': null,
      'Made-up Ryzen 9 7900': null,
    });
    await expectErrorResponse(
      await search({ vendorId: another.id }, noVendor),
      403,
      vendorAccessDenied,
    );
  });

  it('refuses a vendorId that is not text, naming it', async () => {
    const response = await fetch(`${testApp.baseUrl}/v1/parts?vendorId=a&vendorId=b`, {
      headers: bearerHeader(await adminToken()),
    });

    await expectErrorResponse(response, 400, [notValid('vendorId')]);
  });
});
