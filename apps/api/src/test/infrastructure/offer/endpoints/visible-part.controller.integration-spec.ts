import { randomUUID } from 'node:crypto';

import {
  bearerHeader,
  expectErrorResponse,
  type ExpectedErrorResponse,
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
import {
  emptyTheRealm,
  loginsNamed,
} from '../../../test-utils/keycloak/keycloak-administrator';

// One Visible Part, which anyone may read without a token: a Part with at
// least one Visible Offer, an Offer that is not an Expired Offer and whose
// Vendor is active (CAT-7), with its specifications labelled in English
// (LANG-3), as a Part page shows it (BRW-3).

// One specification a Part holds, as the API answers it: a list of rows holds
// its rows, each a list of the fields it holds, answered the same way.
type LabelledSpecificationBody = {
  path: string;
  label: string;
  kind: string;
  unit: string | null;
  value: unknown;
};

// A Visible Part as the API answers it.
type VisiblePartBody = {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  partNumbers: string[];
  photoPath: string | null;
  specifications: LabelledSpecificationBody[];
};

// A Vendor as the API answers it, as far as these tests read it.
type VendorBody = { id: string; name: string; loginPhoneNumber: { international: string } };

// A Part as the API answers it, as far as these tests read it.
type PartBody = { id: string; photoPath: string | null };

// The refusal of a Part that is not visible, as a whole.
const partNotFound: ExpectedErrorResponse[] = [
  {
    code: 'PART_NOT_FOUND',
    title: 'part_not_found_title',
    detail: 'part_not_found_details',
  },
];

const adminLoginId = randomUUID();

// A moment for the API's clock, with milliseconds, so that a time stored
// with less precision would show.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');

// A day of 24 hours, and a moment some time after another.
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

// A specification as the API answers it, with no unit unless one is given.
function labelled(
  path: string,
  label: string,
  kind: string,
  value: unknown,
  unit: string | null = null,
): LabelledSpecificationBody {
  return { path, label, kind, unit, value };
}

describe('a Visible Part', () => {
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

  // An Offer the Admin adds for the Vendor, with the clock as it is.
  async function anOffer(vendorId: string, partId: string): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ partId, iqdPrice: 500000, inStock: true }),
    });
    expect(response.status).toBe(201);
  }

  // A Part that a made-up Vendor of its own offers, with the fields given.
  async function anOfferedPart(fields: Record<string, unknown> = {}): Promise<PartBody> {
    const offered = await aPart(fields);
    await anOffer((await aVendor()).id, offered.id);
    return offered;
  }

  // The Admin acts on a Vendor: deactivates it, reactivates it, or confirms
  // all its Offers at the time of the clock. Deactivating and reactivating
  // call Keycloak, so they run with the clock running.
  async function admin(
    action: 'deactivate' | 'reactivate' | 'offers/confirm',
    vendorId: string,
  ): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/${action}`, {
      method: 'POST',
      headers: bearerHeader(await adminToken()),
    });
    expect(response.status).toBe(200);
  }

  // A token of the Vendor's own Login, as Keycloak issues it.
  async function tokenOfTheOwnLogin(vendor: VendorBody): Promise<string> {
    const [login] = await loginsNamed(vendor.loginPhoneNumber.international);
    return testApp.tokenOf({
      subject: login.id,
      loginName: vendor.loginPhoneNumber.international,
      roles: ['vendor'],
    });
  }

  // The Visible Part with this identifier, asked for with the headers given.
  function readVisiblePart(
    partId: string,
    headers: Record<string, string> = {},
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/visible-parts/${partId}`, { headers });
  }

  // The Visible Part with this identifier, read without a token.
  async function theVisiblePart(partId: string): Promise<VisiblePartBody> {
    const response = await readVisiblePart(partId);
    expect(response.status).toBe(200);
    return (await response.json()) as VisiblePartBody;
  }

  // Its specifications, read without a token.
  async function theSpecificationsOf(partId: string): Promise<LabelledSpecificationBody[]> {
    return (await theVisiblePart(partId)).specifications;
  }

  describe('the answer', () => {
    it("gives the Part's identifier, Category, name, manufacturer, part numbers, photo and specifications", async () => {
      const ryzen = await withAPhoto(
        (
          await anOfferedPart({
            name: 'Made-up Ryzen 5 7600',
            manufacturer: 'AMD',
            partNumbers: ['100-100001015BOX', '100-000001015'],
            specifications: {
              socket: 'AM5',
              specifications: { tdp: 65, memory: { types: ['DDR5'] } },
            },
          })
        ).id,
      );

      expect(await theVisiblePart(ryzen.id)).toEqual({
        id: ryzen.id,
        category: 'cpu',
        name: 'Made-up Ryzen 5 7600',
        manufacturer: 'AMD',
        partNumbers: ['100-100001015BOX', '100-000001015'],
        photoPath: ryzen.photoPath,
        specifications: [
          labelled('socket', 'Socket', 'oneOf', 'AM5'),
          labelled('specifications.tdp', 'TDP', 'wholeNumber', 65, 'W'),
          labelled('specifications.memory.types', 'Memory types', 'severalOf', ['DDR5']),
        ],
      });
      expect(ryzen.photoPath).toMatch(/^\/v1\/photos\//);
    });
  });

  describe('a Part that is not visible', () => {
    it('answers 404 with PART_NOT_FOUND for a Part with no Offer, an unknown Part and an identifier of no Part', async () => {
      const unoffered = await aPart();

      for (const partId of [unoffered.id, randomUUID(), 'not-a-part']) {
        await expectErrorResponse(await readVisiblePart(partId), 404, partNotFound);
      }
    });

    it('answers 404 for a Part whose only Offer is an Expired Offer, and the Part again once the Offer is confirmed', async () => {
      const ryzen = await aPart();
      const shop = await aVendor();
      moveTheClockTo(aMovedMoment);
      await anOffer(shop.id, ryzen.id);

      // Confirmed 14 days ago to the millisecond, it is still visible.
      moveTheClockTo(after(aMovedMoment, 14 * aDay));
      expect((await theVisiblePart(ryzen.id)).id).toBe(ryzen.id);

      moveTheClockTo(after(aMovedMoment, 14 * aDay + 1));
      await expectErrorResponse(await readVisiblePart(ryzen.id), 404, partNotFound);

      await admin('offers/confirm', shop.id);
      expect((await theVisiblePart(ryzen.id)).id).toBe(ryzen.id);
    });

    it('answers 404 for a Part whose only Vendor is deactivated, and the Part again once the Vendor is reactivated', async () => {
      const ryzen = await aPart();
      const shop = await aVendor();
      await anOffer(shop.id, ryzen.id);

      await admin('deactivate', shop.id);
      await expectErrorResponse(await readVisiblePart(ryzen.id), 404, partNotFound);

      await admin('reactivate', shop.id);
      expect((await theVisiblePart(ryzen.id)).id).toBe(ryzen.id);
    });

    it('stays visible while another Vendor has a Visible Offer for it', async () => {
      const ryzen = await aPart();
      const shop = await aVendor();
      const store = await aVendor('Made-up Computer Store');
      await anOffer(shop.id, ryzen.id);
      await anOffer(store.id, ryzen.id);

      await admin('deactivate', shop.id);
      expect((await theVisiblePart(ryzen.id)).id).toBe(ryzen.id);
    });
  });

  describe('its specifications', () => {
    it("are in the order of its Category's list whatever order they were given in, with labels and units, yes or no as booleans, a 0 that can be true kept, and leaving out what the Part does not hold", async () => {
      const ryzen = await anOfferedPart({
        specifications: {
          specifications: {
            memory: { types: ['DDR5', 'DDR4'] },
            includesCooler: true,
            eccSupport: false,
            tdp: 65,
          },
          clocks: { performance: { boost: 5.1 } },
          cores: { efficiency: 0, total: 6 },
          socket: 'AM5',
        },
      });

      expect(await theSpecificationsOf(ryzen.id)).toEqual([
        labelled('socket', 'Socket', 'oneOf', 'AM5'),
        labelled('cores.total', 'Cores', 'wholeNumber', 6),
        // A CPU may have no efficiency cores, so 0 is true here.
        labelled('cores.efficiency', 'Efficiency cores', 'wholeNumber', 0),
        labelled(
          'clocks.performance.boost',
          'Performance core boost clock',
          'decimalNumber',
          5.1,
          'GHz',
        ),
        labelled('specifications.tdp', 'TDP', 'wholeNumber', 65, 'W'),
        labelled('specifications.eccSupport', 'ECC memory support', 'yesNo', false),
        labelled('specifications.includesCooler', 'Cooler included', 'yesNo', true),
        labelled('specifications.memory.types', 'Memory types', 'severalOf', [
          'DDR5',
          'DDR4',
        ]),
      ]);
    });

    it('leave out a stored 0 where 0 means "not known", and a stored null, empty text or empty choice', async () => {
      const ryzen = await anOfferedPart();
      // As a Part kept before its list said so would hold them. No endpoint
      // stores such values.
      await keepSpecificationsAsTheyAre(ryzen.id, {
        socket: 'AM5',
        series: '',
        microarchitecture: null,
        cores: { total: 0, efficiency: 0 },
        clocks: { performance: { base: 0 } },
        specifications: { tdp: 0, memory: { types: [] } },
      });

      expect(await theSpecificationsOf(ryzen.id)).toEqual([
        labelled('socket', 'Socket', 'oneOf', 'AM5'),
        labelled('cores.efficiency', 'Efficiency cores', 'wholeNumber', 0),
      ]);
    });

    it("answer a list of rows as rows of the fields each holds, labelled, in the order of the list's fields, and no rows as none", async () => {
      const board = await anOfferedPart({
        category: 'motherboard',
        name: 'Made-up B650 board',
        specifications: {
          m2_slots: [],
          pcie_slots: [
            { gen: '5.0', quantity: 1, lanes: 16 },
            { lanes: 4, quantity: 2 },
          ],
          socket: 'AM5',
        },
      });

      expect(await theSpecificationsOf(board.id)).toEqual([
        labelled('socket', 'Socket', 'oneOf', 'AM5'),
        labelled('pcie_slots', 'PCIe slots', 'listOfRows', [
          [
            labelled('gen', 'Generation', 'text', '5.0'),
            labelled('quantity', 'Slots', 'wholeNumber', 1),
            labelled('lanes', 'Lanes', 'wholeNumber', 16),
          ],
          [
            labelled('quantity', 'Slots', 'wholeNumber', 2),
            labelled('lanes', 'Lanes', 'wholeNumber', 4),
          ],
        ]),
        labelled('m2_slots', 'M.2 slots', 'listOfRows', []),
      ]);
    });

    it('leave out of a row a stored 0 where 0 means "not known"', async () => {
      const board = await anOfferedPart({ category: 'motherboard', name: 'Made-up board' });
      await keepSpecificationsAsTheyAre(board.id, {
        pcie_slots: [{ gen: '4.0', quantity: 0, lanes: 4 }],
      });

      expect(await theSpecificationsOf(board.id)).toEqual([
        labelled('pcie_slots', 'PCIe slots', 'listOfRows', [
          [
            labelled('gen', 'Generation', 'text', '4.0'),
            labelled('lanes', 'Lanes', 'wholeNumber', 4),
          ],
        ]),
      ]);
    });

    it('are none for a Part that holds none', async () => {
      const ryzen = await anOfferedPart();

      expect(await theSpecificationsOf(ryzen.id)).toEqual([]);
    });
  });

  describe('who may read it', () => {
    it("answers the same without a token and with any token, an Admin's or a Vendor's among them", async () => {
      const shop = await aVendor();
      const ryzen = await aPart({ specifications: { socket: 'AM5' } });
      await anOffer(shop.id, ryzen.id);
      const withoutAToken = await theVisiblePart(ryzen.id);

      const tokens = [
        await adminToken(),
        await tokenOfTheOwnLogin(shop),
        await testApp.tokenOf({ roles: ['shopper'] }),
        await testApp.tokenOf({
          roles: ['admin'],
          expiresAt: new Date(Date.now() - 60_000),
        }),
        'nonsense',
      ];
      for (const token of tokens) {
        const response = await readVisiblePart(ryzen.id, bearerHeader(token));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(withoutAToken);
      }
    });

    it("answers 404 for a Part that is not visible with an Admin's token and with a Vendor's", async () => {
      const shop = await aVendor();
      const unoffered = await aPart();
      const deactivatedOnly = await aPart({ name: 'Made-up Ryzen 7 7700' });
      const deactivated = await aVendor('Made-up Computer Store');
      await anOffer(deactivated.id, deactivatedOnly.id);
      const tokenOfTheStore = await tokenOfTheOwnLogin(deactivated);
      await admin('deactivate', deactivated.id);

      for (const token of [
        await adminToken(),
        await tokenOfTheOwnLogin(shop),
        tokenOfTheStore,
      ]) {
        for (const partId of [unoffered.id, deactivatedOnly.id]) {
          await expectErrorResponse(
            await readVisiblePart(partId, bearerHeader(token)),
            404,
            partNotFound,
          );
        }
      }
    });
  });
});
