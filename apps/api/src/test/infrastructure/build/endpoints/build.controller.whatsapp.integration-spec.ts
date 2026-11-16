import { randomUUID } from 'node:crypto';

import { bearerHeader } from '@pcp/core/test-utils';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../../test-utils/database/test-database';
import { emptyTheRealm } from '../../../test-utils/keycloak/keycloak-administrator';

// Whether each Vendor of a Build's second price view gave a WhatsApp number,
// so that the Build page and the Shared Build page draw "send on WhatsApp"
// only beside a Vendor it can reach (SHR-5). The number itself is answered
// only by a Referral, once one is recorded.

// A Vendor of the second view, and a Part's Lowest Price, as the API answers
// them, as far as these tests read them.
type BuildBody = {
  parts: { id: string; lowestPrice: { vendor: Record<string, unknown> } | null }[];
  vendors: Record<string, unknown>[];
};

// A Part and a Vendor as the API answers their creation, as far as these
// tests read them.
type PartBody = { id: string };
type VendorBody = { id: string; name: string };

const adminLoginId = randomUUID();

describe("the second price view's WhatsApp field", () => {
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
    return testApp.tokenOf({ subject: adminLoginId, roles: ['admin'] });
  }

  // Sends the Admin's request with a JSON body, and answers it.
  async function asTheAdmin(
    method: 'POST' | 'PUT',
    address: string,
    body: Record<string, unknown>,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}${address}`, {
      method,
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  // A made-up CPU the Admin adds to the catalog.
  async function aPart(name: string): Promise<PartBody> {
    const response = await asTheAdmin('POST', '/v1/parts', {
      category: 'cpu',
      name,
      manufacturer: 'Made-up Chips',
    });
    expect(response.status).toBe(201);
    return (await response.json()) as PartBody;
  }

  // Made-up Vendors are numbered, so that each has a Login phone number of
  // its own.
  let vendors = 0;

  // A made-up Vendor the Admin creates, with the WhatsApp number given, or
  // none.
  async function aVendor(name: string, whatsAppNumber: string | null): Promise<VendorBody> {
    vendors += 1;
    const response = await asTheAdmin('POST', '/v1/vendors', {
      name,
      city: 'erbil',
      address: 'Made-up Street, Erbil',
      phoneNumber: '066 223 4567',
      whatsAppNumber,
      loginPhoneNumber: `0750 100 ${String(1000 + vendors)}`,
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { vendor: VendorBody }).vendor;
  }

  // An Offer of the Part, in stock, that the Admin adds for the Vendor.
  async function anOffer(
    vendorId: string,
    partId: string,
    iqdPrice: number,
  ): Promise<void> {
    const response = await asTheAdmin('POST', `/v1/vendors/${vendorId}/offers`, {
      partId,
      iqdPrice,
      inStock: true,
    });
    expect(response.status).toBe(201);
  }

  // The Build of these Parts, read without a token, in dinars.
  async function theBuild(partIds: readonly string[]): Promise<BuildBody> {
    const search = new URLSearchParams({ currency: 'IQD' });
    for (const partId of partIds) search.append('part', partId);
    const response = await fetch(`${testApp.baseUrl}/v1/build?${search.toString()}`);
    expect(response.status).toBe(200);
    return (await response.json()) as BuildBody;
  }

  it('answers for each Vendor whether it gave a WhatsApp number, and never the number', async () => {
    const ryzen = await aPart('Made-up Ryzen 5 7600');
    const withNumber = await aVendor('Made-up WhatsApp Shop', '0770 123 4567');
    const withoutNumber = await aVendor('Made-up Phone Shop', null);
    await anOffer(withNumber.id, ryzen.id, 300000);
    await anOffer(withoutNumber.id, ryzen.id, 310000);

    const build = await theBuild([ryzen.id]);

    expect(
      build.vendors.map(({ id, hasWhatsAppNumber }) => ({ id, hasWhatsAppNumber })),
    ).toEqual([
      { id: withNumber.id, hasWhatsAppNumber: true },
      { id: withoutNumber.id, hasWhatsAppNumber: false },
    ]);
    expect(JSON.stringify(build)).not.toContain('7701234567');
    expect(build.parts[0].lowestPrice?.vendor).toEqual({
      id: withNumber.id,
      name: 'Made-up WhatsApp Shop',
    });
  });

  it('follows the Vendor: a number cleared from its contact details answers no, and one added answers yes', async () => {
    const ryzen = await aPart('Made-up Ryzen 5 7600');
    const shop = await aVendor('Made-up Computer Shop', '0770 123 4567');
    await anOffer(shop.id, ryzen.id, 300000);
    const contactDetails = {
      address: 'Made-up Street, Erbil',
      phoneNumber: '066 223 4567',
    };

    const cleared = await asTheAdmin('PUT', `/v1/vendors/${shop.id}/contact-details`, {
      ...contactDetails,
      whatsAppNumber: null,
    });
    expect(cleared.status).toBe(200);
    expect((await theBuild([ryzen.id])).vendors[0].hasWhatsAppNumber).toBe(false);

    const added = await asTheAdmin('PUT', `/v1/vendors/${shop.id}/contact-details`, {
      ...contactDetails,
      whatsAppNumber: '0770 765 4321',
    });
    expect(added.status).toBe(200);
    expect((await theBuild([ryzen.id])).vendors[0].hasWhatsAppNumber).toBe(true);
  });
});
