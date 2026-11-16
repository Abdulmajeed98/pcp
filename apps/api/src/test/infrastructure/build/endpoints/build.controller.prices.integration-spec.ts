import { randomUUID } from 'node:crypto';

import { bearerHeader } from '@pcp/core/test-utils';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import {
  changeTheRateAndDeactivateAVendorWhileReading,
  changeTheRateAndTheOffersWhileReading,
  emptyTheDatabase,
} from '../../../test-utils/database/test-database';
import { emptyTheRealm } from '../../../test-utils/keycloak/keycloak-administrator';

// A Build's two price views, read by anyone without a token, in the chosen
// currency (BLD-7 to BLD-9, PRC-4, PRC-5). The first gives each Part its
// Lowest Price, the lowest Shown Price among its in-stock Visible Offers, with
// the Vendor it comes from, and the Build's total across Vendors. The second
// lists each Vendor that has any of the Build's Parts in stock, with its own
// total, the Parts it has and the Parts it lacks. An Unstocked Part, which no
// Vendor has in stock among its Visible Offers, is left out of every total.

// The currencies a Shopper may choose.
type Currency = 'USD' | 'IQD';

// A price as the API shows it, in the currency asked for.
type ShownPriceBody = { currency: Currency; amount: string; converted: boolean };

// A Shown Price that is the Quoted Price in the currency, and one that is, or
// holds, a Converted Price.
function quoted(currency: Currency, amount: string): ShownPriceBody {
  return { currency, amount, converted: false };
}
function converted(currency: Currency, amount: string): ShownPriceBody {
  return { currency, amount, converted: true };
}

// A Part's Lowest Price as a Build answers it: the price, the price times the
// Part's quantity, and the Vendor whose Offer it comes from.
type LowestPriceBody = {
  shownPrice: ShownPriceBody;
  timesQuantity: ShownPriceBody;
  vendor: { id: string; name: string };
};

// A Part of a Build as the API answers it, as far as these tests read it.
type BuildPartBody = {
  id: string;
  quantity: number | null;
  visible: boolean;
  unstocked: boolean;
  priceNotShown: boolean;
  lowestPrice: LowestPriceBody | null;
};

// A Part a Vendor of the second view has in stock, as the API answers it.
type PartInStockBody = {
  partId: string;
  shownPrice: ShownPriceBody | null;
  timesQuantity: ShownPriceBody | null;
};

// A Vendor of the second view, as the API answers it.
type BuildVendorBody = {
  id: string;
  name: string;
  total: ShownPriceBody | null;
  partsInStock: PartInStockBody[];
  partsLacked: string[];
};

// A Build as the API answers it, as far as these tests read it.
type BuildBody = {
  parts: BuildPartBody[];
  totalAcrossVendors: ShownPriceBody | null;
  vendors: BuildVendorBody[];
};

// A Part, a Vendor and one of a Part's Offers as the API answers them, as far
// as these tests read them.
type PartBody = { id: string };
type VendorBody = { id: string; name: string };
type PartOfferBody = { vendor: { id: string }; inStock: boolean };

const adminLoginId = randomUUID();

// A moment for the API's clock, and a moment some time after another.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');
const aDay = 24 * 60 * 60 * 1000;
function after(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() + milliseconds);
}

describe("a Build's price views", () => {
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

  // An Offer the Admin adds for the Vendor, at the time of the clock, with
  // the details given, and its identifier.
  async function anOffer(
    vendorId: string,
    partId: string,
    details: Record<string, unknown>,
  ): Promise<string> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ partId, ...details }),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { id: string }).id;
  }

  // The Admin changes an Offer for the Vendor, at the time of the clock,
  // which is a Confirmation.
  async function changeTheOffer(
    vendorId: string,
    offerId: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    const response = await fetch(
      `${testApp.baseUrl}/v1/vendors/${vendorId}/offers/${offerId}`,
      {
        method: 'PUT',
        headers: {
          ...bearerHeader(await adminToken()),
          'content-type': 'application/json',
        },
        body: JSON.stringify(details),
      },
    );
    expect(response.status).toBe(200);
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

  // The Admin sets the Platform Rate, in whole dinars per dollar.
  async function setThePlatformRate(iqdPerUsd: number): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/platform-rate`, {
      method: 'PUT',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ iqdPerUsd }),
    });
    expect(response.status).toBe(200);
  }

  // A Part's Visible Offers in the order its Part page lists them.
  async function theOffersOf(partId: string): Promise<PartOfferBody[]> {
    const response = await fetch(
      `${testApp.baseUrl}/v1/parts/${partId}/offers?currency=IQD`,
    );
    expect(response.status).toBe(200);
    return (await response.json()) as PartOfferBody[];
  }

  // The Build of these `part` values, read without a token in the currency
  // given.
  async function theBuild(
    values: readonly string[],
    currency: Currency = 'IQD',
  ): Promise<BuildBody> {
    const search = new URLSearchParams({ currency });
    for (const value of values) search.append('part', value);
    const response = await fetch(`${testApp.baseUrl}/v1/build?${search.toString()}`);
    expect(response.status).toBe(200);
    return (await response.json()) as BuildBody;
  }

  // What the first price view says of a Build: whether each Part is visible
  // and whether it is an Unstocked Part, its Lowest Price's amount, by
  // identifier, and the total across Vendors.
  async function theFirstViewOf(values: readonly string[]): Promise<{
    parts: Record<string, { visible: boolean; unstocked: boolean; lowest: string | null }>;
    total: ShownPriceBody | null;
  }> {
    const build = await theBuild(values);
    return {
      parts: Object.fromEntries(
        build.parts.map(({ id, visible, unstocked, lowestPrice }) => [
          id,
          { visible, unstocked, lowest: lowestPrice?.shownPrice.amount ?? null },
        ]),
      ),
      total: build.totalAcrossVendors,
    };
  }

  // The Lowest Price of each of the Build's Parts, by identifier.
  async function lowestPricesIn(
    values: readonly string[],
    currency: Currency = 'IQD',
  ): Promise<Record<string, LowestPriceBody | null>> {
    const { parts } = await theBuild(values, currency);
    return Object.fromEntries(parts.map(({ id, lowestPrice }) => [id, lowestPrice]));
  }

  describe('the first price view', () => {
    describe("each Part's Lowest Price", () => {
      it("is the lowest Shown Price among its in-stock Visible Offers, leaving out an out-of-stock Offer, an Expired Offer and a deactivated Vendor's Offer, and names the Vendor it comes from", async () => {
        const ryzen = await aPart();
        const shop = await aVendor('Made-up Computer Shop');
        const outOfStock = await aVendor('Made-up Out of Stock Shop');
        const expired = await aVendor('Made-up Expired Shop');
        const deactivated = await aVendor('Made-up Deactivated Shop');
        moveTheClockTo(aMovedMoment);
        await anOffer(expired.id, ryzen.id, { iqdPrice: 410000, inStock: true });
        moveTheClockTo(after(aMovedMoment, 10 * aDay));
        await anOffer(shop.id, ryzen.id, { iqdPrice: 525000, inStock: true });
        await anOffer(outOfStock.id, ryzen.id, { iqdPrice: 400000, inStock: false });
        await anOffer(deactivated.id, ryzen.id, { iqdPrice: 420000, inStock: true });
        letTheClockRun();
        await admin('deactivate', deactivated.id);

        // 15 days after the first Offer's Confirmation, 5 after the others'.
        moveTheClockTo(after(aMovedMoment, 15 * aDay));
        expect(await lowestPricesIn([ryzen.id])).toEqual({
          [ryzen.id]: {
            shownPrice: quoted('IQD', '525000'),
            timesQuantity: quoted('IQD', '525000'),
            vendor: { id: shop.id, name: 'Made-up Computer Shop' },
          },
        });
      });

      it('comes, of two equal prices, from the Offer the Part page lists first: the one confirmed last, and of two confirmed at once the one whose Vendor comes first by name', async () => {
        const confirmedApart = await aPart({ name: 'Made-up Ryzen 5 7600' });
        const confirmedAtOnce = await aPart({
          category: 'motherboard',
          name: 'Made-up B650 board',
        });
        const zed = await aVendor('Made-up Zed Computers');
        const alpha = await aVendor('Made-up Alpha Computers');
        const price = { iqdPrice: 525000, inStock: true };
        moveTheClockTo(aMovedMoment);
        await anOffer(alpha.id, confirmedApart.id, price);
        await anOffer(zed.id, confirmedAtOnce.id, price);
        await anOffer(alpha.id, confirmedAtOnce.id, price);
        moveTheClockTo(after(aMovedMoment, aDay));
        await anOffer(zed.id, confirmedApart.id, price);

        const lowest = await lowestPricesIn([confirmedApart.id, confirmedAtOnce.id]);
        expect(lowest[confirmedApart.id]?.vendor).toEqual({
          id: zed.id,
          name: 'Made-up Zed Computers',
        });
        expect(lowest[confirmedAtOnce.id]?.vendor).toEqual({
          id: alpha.id,
          name: 'Made-up Alpha Computers',
        });
        for (const each of [confirmedApart, confirmedAtOnce]) {
          const [first] = await theOffersOf(each.id);
          expect(first.vendor.id).toBe(lowest[each.id]?.vendor.id);
        }
      });
    });

    describe('the total across Vendors', () => {
      it("is each Part's Lowest Price times its quantity, added up, whichever Vendor each comes from", async () => {
        const ryzen = await aPart();
        const kit = await aPart({ category: 'ram', name: 'Made-up 32 GB kit' });
        const drive = await aPart({ category: 'storage', name: 'Made-up 1 TB drive' });
        const shop = await aVendor('Made-up Computer Shop');
        const store = await aVendor('Made-up Computer Store');
        await anOffer(shop.id, ryzen.id, { iqdPrice: 525000, inStock: true });
        await anOffer(store.id, kit.id, { iqdPrice: 60000, inStock: true });
        await anOffer(shop.id, drive.id, { iqdPrice: 90000, inStock: true });
        await anOffer(store.id, drive.id, { iqdPrice: 85000, inStock: true });

        const build = await theBuild([ryzen.id, `${kit.id}:2`, `${drive.id}:3`]);

        expect(build.parts.map(({ lowestPrice }) => lowestPrice)).toEqual([
          {
            shownPrice: quoted('IQD', '525000'),
            timesQuantity: quoted('IQD', '525000'),
            vendor: { id: shop.id, name: 'Made-up Computer Shop' },
          },
          {
            shownPrice: quoted('IQD', '60000'),
            timesQuantity: quoted('IQD', '120000'),
            vendor: { id: store.id, name: 'Made-up Computer Store' },
          },
          {
            shownPrice: quoted('IQD', '85000'),
            timesQuantity: quoted('IQD', '255000'),
            vendor: { id: store.id, name: 'Made-up Computer Store' },
          },
        ]);
        // 525,000 + 2 × 60,000 + 3 × 85,000.
        expect(build.totalAcrossVendors).toEqual(quoted('IQD', '900000'));
      });

      it('is marked converted when any Lowest Price is a Converted Price, and is answered in each currency', async () => {
        const ryzen = await aPart();
        const kit = await aPart({ category: 'ram', name: 'Made-up 32 GB kit' });
        const drive = await aPart({ category: 'storage', name: 'Made-up 1 TB drive' });
        const shop = await aVendor('Made-up Computer Shop');
        await setThePlatformRate(1500);
        await anOffer(shop.id, ryzen.id, { usdPrice: '350.00', inStock: true });
        await anOffer(shop.id, kit.id, { iqdPrice: 60000, inStock: true });
        await anOffer(shop.id, drive.id, {
          usdPrice: '60.25',
          iqdPrice: 90000,
          inStock: true,
        });
        const everyPart = [ryzen.id, `${kit.id}:2`, `${drive.id}:1`];

        // 350 $ at 1,500 is 525,000 IQD; 525,000 + 2 × 60,000 + 90,000.
        expect((await theBuild(everyPart, 'IQD')).totalAcrossVendors).toEqual(
          converted('IQD', '735000'),
        );
        // 60,000 IQD at 1,500 is 40 $; 350 + 2 × 40 + 60.25.
        expect((await theBuild(everyPart, 'USD')).totalAcrossVendors).toEqual(
          converted('USD', '490.25'),
        );
        // A Build of Quoted Prices alone is not converted.
        expect((await theBuild([`${drive.id}:2`], 'IQD')).totalAcrossVendors).toEqual(
          quoted('IQD', '180000'),
        );
        expect((await theBuild([`${drive.id}:2`], 'USD')).totalAcrossVendors).toEqual(
          quoted('USD', '120.50'),
        );
      });
    });

    describe('an Unstocked Part', () => {
      // A Part in stock at 525,000 IQD and a kit, two of it, at 60,000.
      const inStock = { visible: true, unstocked: false, lowest: '525000' };
      const kitInStock = { visible: true, unstocked: false, lowest: '60000' };

      it('made so by putting its only Offer out of stock, is answered as one, still visible, with no Lowest Price and left out of the total, and is back once the Offer is in stock again', async () => {
        const ryzen = await aPart();
        const kit = await aPart({ category: 'ram', name: 'Made-up 32 GB kit' });
        const shop = await aVendor();
        const offerId = await anOffer(shop.id, ryzen.id, {
          iqdPrice: 525000,
          inStock: true,
        });
        await anOffer(shop.id, kit.id, { iqdPrice: 60000, inStock: true });
        const values = [ryzen.id, `${kit.id}:2`];

        expect(await theFirstViewOf(values)).toEqual({
          parts: { [ryzen.id]: inStock, [kit.id]: kitInStock },
          total: quoted('IQD', '645000'),
        });

        await changeTheOffer(shop.id, offerId, { iqdPrice: 525000, inStock: false });
        expect(await theFirstViewOf(values)).toEqual({
          parts: {
            [ryzen.id]: { visible: true, unstocked: true, lowest: null },
            [kit.id]: kitInStock,
          },
          total: quoted('IQD', '120000'),
        });

        await changeTheOffer(shop.id, offerId, { iqdPrice: 525000, inStock: true });
        expect(await theFirstViewOf(values)).toEqual({
          parts: { [ryzen.id]: inStock, [kit.id]: kitInStock },
          total: quoted('IQD', '645000'),
        });
      });

      it('made so by letting its only Offer expire past 14 days, is answered as one and left out of the total, and is back once the Offer is confirmed again', async () => {
        const ryzen = await aPart();
        const kit = await aPart({ category: 'ram', name: 'Made-up 32 GB kit' });
        const shop = await aVendor('Made-up Computer Shop');
        const store = await aVendor('Made-up Computer Store');
        moveTheClockTo(aMovedMoment);
        await anOffer(shop.id, ryzen.id, { iqdPrice: 525000, inStock: true });
        moveTheClockTo(after(aMovedMoment, 10 * aDay));
        await anOffer(store.id, kit.id, { iqdPrice: 60000, inStock: true });
        const values = [ryzen.id, `${kit.id}:2`];

        // Confirmed 14 days ago to the millisecond, it is still in stock.
        moveTheClockTo(after(aMovedMoment, 14 * aDay));
        expect(await theFirstViewOf(values)).toEqual({
          parts: { [ryzen.id]: inStock, [kit.id]: kitInStock },
          total: quoted('IQD', '645000'),
        });

        moveTheClockTo(after(aMovedMoment, 14 * aDay + 1));
        expect(await theFirstViewOf(values)).toEqual({
          parts: {
            [ryzen.id]: { visible: false, unstocked: true, lowest: null },
            [kit.id]: kitInStock,
          },
          total: quoted('IQD', '120000'),
        });

        await admin('offers/confirm', shop.id);
        expect(await theFirstViewOf(values)).toEqual({
          parts: { [ryzen.id]: inStock, [kit.id]: kitInStock },
          total: quoted('IQD', '645000'),
        });
      });

      it('made so by deactivating its only Vendor, is answered as one and left out of the total, a Build of Unstocked Parts alone has no total, and both are back once the Vendor is reactivated', async () => {
        const ryzen = await aPart();
        const kit = await aPart({ category: 'ram', name: 'Made-up 32 GB kit' });
        const shop = await aVendor('Made-up Computer Shop');
        const store = await aVendor('Made-up Computer Store');
        await anOffer(shop.id, ryzen.id, { iqdPrice: 525000, inStock: true });
        await anOffer(store.id, kit.id, { iqdPrice: 60000, inStock: true });
        const values = [ryzen.id, `${kit.id}:2`];

        await admin('deactivate', shop.id);
        expect(await theFirstViewOf(values)).toEqual({
          parts: {
            [ryzen.id]: { visible: false, unstocked: true, lowest: null },
            [kit.id]: kitInStock,
          },
          total: quoted('IQD', '120000'),
        });
        expect((await theFirstViewOf([ryzen.id])).total).toBeNull();

        await admin('reactivate', shop.id);
        expect(await theFirstViewOf(values)).toEqual({
          parts: { [ryzen.id]: inStock, [kit.id]: kitInStock },
          total: quoted('IQD', '645000'),
        });
        expect((await theFirstViewOf([ryzen.id])).total).toEqual(quoted('IQD', '525000'));
      });
    });

    describe('with no Platform Rate', () => {
      // What the Build says of each Part's price, by identifier, and its
      // total across Vendors, in the currency given.
      async function thePricesOf(
        values: readonly string[],
        currency: Currency,
      ): Promise<{
        parts: Record<
          string,
          { unstocked: boolean; priceNotShown: boolean; lowest: ShownPriceBody | null }
        >;
        total: ShownPriceBody | null;
      }> {
        const build = await theBuild(values, currency);
        return {
          parts: Object.fromEntries(
            build.parts.map(({ id, unstocked, priceNotShown, lowestPrice }) => [
              id,
              { unstocked, priceNotShown, lowest: lowestPrice?.timesQuantity ?? null },
            ]),
          ),
          total: build.totalAcrossVendors,
        };
      }

      it('leaves out of the total a Part in stock only in the other currency, says its price could not be shown, and shows it once a rate is set', async () => {
        const ryzen = await aPart();
        const kit = await aPart({ category: 'ram', name: 'Made-up 32 GB kit' });
        const shop = await aVendor();
        await anOffer(shop.id, ryzen.id, { usdPrice: '350.00', inStock: true });
        await anOffer(shop.id, kit.id, { iqdPrice: 60000, inStock: true });
        const values = [ryzen.id, `${kit.id}:2`];
        const notShown = { unstocked: false, priceNotShown: true, lowest: null };

        expect(await thePricesOf(values, 'IQD')).toEqual({
          parts: {
            [ryzen.id]: notShown,
            [kit.id]: {
              unstocked: false,
              priceNotShown: false,
              lowest: quoted('IQD', '120000'),
            },
          },
          total: quoted('IQD', '120000'),
        });
        expect(await thePricesOf(values, 'USD')).toEqual({
          parts: {
            [ryzen.id]: {
              unstocked: false,
              priceNotShown: false,
              lowest: quoted('USD', '350.00'),
            },
            [kit.id]: notShown,
          },
          total: quoted('USD', '350.00'),
        });
        expect((await thePricesOf([ryzen.id], 'IQD')).total).toBeNull();

        await setThePlatformRate(1500);
        expect(await thePricesOf(values, 'IQD')).toEqual({
          parts: {
            [ryzen.id]: {
              unstocked: false,
              priceNotShown: false,
              lowest: converted('IQD', '525000'),
            },
            [kit.id]: {
              unstocked: false,
              priceNotShown: false,
              lowest: quoted('IQD', '120000'),
            },
          },
          total: converted('IQD', '645000'),
        });
      });
    });
  });

  describe('the second price view', () => {
    // The names of the Vendors the second view lists, in its order.
    async function theVendorsListedFor(
      values: readonly string[],
      currency: Currency = 'IQD',
    ): Promise<string[]> {
      return (await theBuild(values, currency)).vendors.map(({ name }) => name);
    }

    it("lists only the active Vendors with one of the Build's Parts in stock among their Visible Offers", async () => {
      const ryzen = await aPart();
      const board = await aPart({ category: 'motherboard', name: 'Made-up B650 board' });
      const elsewhere = await aPart({ category: 'gpu', name: 'Made-up GPU' });
      const inStock = await aVendor('Made-up In Stock Shop');
      const outOfStock = await aVendor('Made-up Out of Stock Shop');
      const expired = await aVendor('Made-up Expired Shop');
      const deactivated = await aVendor('Made-up Deactivated Shop');
      const otherPart = await aVendor('Made-up Other Part Shop');
      moveTheClockTo(aMovedMoment);
      await anOffer(expired.id, ryzen.id, { iqdPrice: 410000, inStock: true });
      moveTheClockTo(after(aMovedMoment, 10 * aDay));
      await anOffer(inStock.id, board.id, { iqdPrice: 300000, inStock: true });
      await anOffer(outOfStock.id, ryzen.id, { iqdPrice: 400000, inStock: false });
      await anOffer(deactivated.id, ryzen.id, { iqdPrice: 420000, inStock: true });
      await anOffer(otherPart.id, elsewhere.id, { iqdPrice: 900000, inStock: true });
      letTheClockRun();
      await admin('deactivate', deactivated.id);

      // 15 days after the first Offer's Confirmation, 5 after the others'.
      moveTheClockTo(after(aMovedMoment, 15 * aDay));
      expect(await theVendorsListedFor([ryzen.id, board.id])).toEqual([
        'Made-up In Stock Shop',
      ]);
    });

    it('gives each Vendor its total, its Shown Prices times their quantities, marked converted when any is, with the Parts it has and the Parts it lacks, and never an Unstocked Part', async () => {
      const ryzen = await aPart();
      const kit = await aPart({ category: 'ram', name: 'Made-up 32 GB kit' });
      const drive = await aPart({ category: 'storage', name: 'Made-up 1 TB drive' });
      const gpu = await aPart({ category: 'gpu', name: 'Made-up GPU' });
      const pcCase = await aPart({ category: 'case', name: 'Made-up case' });
      const shop = await aVendor('Made-up Computer Shop');
      const store = await aVendor('Made-up Computer Store');
      await setThePlatformRate(1500);
      await anOffer(shop.id, ryzen.id, { usdPrice: '350.00', inStock: true });
      await anOffer(shop.id, drive.id, { iqdPrice: 90000, inStock: true });
      await anOffer(shop.id, gpu.id, { iqdPrice: 700000, inStock: false });
      await anOffer(store.id, kit.id, { iqdPrice: 60000, inStock: true });
      await anOffer(store.id, drive.id, { iqdPrice: 85000, inStock: true });

      const build = await theBuild([
        pcCase.id,
        gpu.id,
        `${drive.id}:3`,
        `${kit.id}:2`,
        ryzen.id,
      ]);

      expect(build.vendors).toEqual([
        {
          id: store.id,
          name: 'Made-up Computer Store',
          // 2 × 60,000 + 3 × 85,000.
          total: quoted('IQD', '375000'),
          partsInStock: [
            {
              partId: kit.id,
              shownPrice: quoted('IQD', '60000'),
              timesQuantity: quoted('IQD', '120000'),
            },
            {
              partId: drive.id,
              shownPrice: quoted('IQD', '85000'),
              timesQuantity: quoted('IQD', '255000'),
            },
          ],
          partsLacked: [ryzen.id],
        },
        {
          id: shop.id,
          name: 'Made-up Computer Shop',
          // 350 $ at 1,500 is 525,000 IQD; 525,000 + 3 × 90,000.
          total: converted('IQD', '795000'),
          partsInStock: [
            {
              partId: ryzen.id,
              shownPrice: converted('IQD', '525000'),
              timesQuantity: converted('IQD', '525000'),
            },
            {
              partId: drive.id,
              shownPrice: quoted('IQD', '90000'),
              timesQuantity: quoted('IQD', '270000'),
            },
          ],
          partsLacked: [kit.id],
        },
      ]);
      expect(
        build.parts
          .filter(({ unstocked }) => unstocked)
          .map(({ id }) => id)
          .sort(),
      ).toEqual([gpu.id, pcCase.id].sort());
    });

    it('orders the Vendors by how many Parts they lack, fewest first, then by their total, lowest first, then by name, then by identifier', async () => {
      const ryzen = await aPart();
      const board = await aPart({ category: 'motherboard', name: 'Made-up B650 board' });
      // Each Vendor and what it has in stock, in thousands of dinars.
      const offered: [string, Record<string, number>][] = [
        ['Made-up Delta Computers', { [board.id]: 300 }],
        ['Made-up Charlie Computers', { [ryzen.id]: 300 }],
        ['Made-up Whole Shop', { [ryzen.id]: 600, [board.id]: 600 }],
        ['Made-up Alpha Computers', { [ryzen.id]: 200 }],
        ['Made-up Delta Computers', { [board.id]: 300 }],
        ['Made-up Bravo Computers', { [board.id]: 300 }],
        ['Made-up Zed Computers', { [ryzen.id]: 100 }],
      ];
      const made: VendorBody[] = [];
      for (const [name, prices] of offered) {
        const vendor = await aVendor(name);
        made.push(vendor);
        for (const [partId, thousands] of Object.entries(prices)) {
          await anOffer(vendor.id, partId, { iqdPrice: thousands * 1000, inStock: true });
        }
      }
      const deltas = made
        .filter(({ name }) => name === 'Made-up Delta Computers')
        .map(({ id }) => id)
        .sort();

      const { vendors } = await theBuild([ryzen.id, board.id]);
      expect(
        vendors.map(({ id, name }) => (name === 'Made-up Delta Computers' ? id : name)),
      ).toEqual([
        // Lacks none.
        'Made-up Whole Shop',
        // Each lacks one: the lowest total first, whatever the name.
        'Made-up Zed Computers',
        'Made-up Alpha Computers',
        // Each lacks one and asks 300,000: by name, whatever it has.
        'Made-up Bravo Computers',
        'Made-up Charlie Computers',
        // The same name: by identifier.
        ...deltas,
      ]);
    });

    it('orders the Vendors by their totals in the chosen currency, which can differ between the two', async () => {
      const ryzen = await aPart();
      const alpha = await aVendor('Made-up Alpha Computers');
      const bravo = await aVendor('Made-up Bravo Computers');
      await setThePlatformRate(1500);
      await anOffer(alpha.id, ryzen.id, { iqdPrice: 150240, inStock: true });
      await anOffer(bravo.id, ryzen.id, { usdPrice: '100.05', inStock: true });

      // 100.05 $ at 1,500 is 150,075 IQD, shown as 150,000; 150,240 IQD at
      // 1,500 is 100.16 $, shown as 100 $.
      const inDinars = (await theBuild([ryzen.id], 'IQD')).vendors;
      expect(inDinars.map(({ name, total }) => [name, total])).toEqual([
        ['Made-up Bravo Computers', converted('IQD', '150000')],
        ['Made-up Alpha Computers', quoted('IQD', '150240')],
      ]);
      const inDollars = (await theBuild([ryzen.id], 'USD')).vendors;
      expect(inDollars.map(({ name, total }) => [name, total])).toEqual([
        ['Made-up Alpha Computers', converted('USD', '100.00')],
        ['Made-up Bravo Computers', quoted('USD', '100.05')],
      ]);
    });

    it('with no Platform Rate, gives a Part a Vendor has in stock only in the other currency no Shown Price, leaves it out of its total, and puts a Vendor with no total after those with one', async () => {
      const ryzen = await aPart();
      const alpha = await aVendor('Made-up Alpha Computers');
      const bravo = await aVendor('Made-up Bravo Computers');
      const charlie = await aVendor('Made-up Charlie Computers');
      await anOffer(alpha.id, ryzen.id, { usdPrice: '350.00', inStock: true });
      await anOffer(bravo.id, ryzen.id, { iqdPrice: 600000, inStock: true });
      await anOffer(charlie.id, ryzen.id, { usdPrice: '340.00', inStock: true });

      const notShown = { partId: ryzen.id, shownPrice: null, timesQuantity: null };
      expect((await theBuild([ryzen.id], 'IQD')).vendors).toEqual([
        {
          id: bravo.id,
          name: 'Made-up Bravo Computers',
          total: quoted('IQD', '600000'),
          partsInStock: [
            {
              partId: ryzen.id,
              shownPrice: quoted('IQD', '600000'),
              timesQuantity: quoted('IQD', '600000'),
            },
          ],
          partsLacked: [],
        },
        {
          id: alpha.id,
          name: 'Made-up Alpha Computers',
          total: null,
          partsInStock: [notShown],
          partsLacked: [],
        },
        {
          id: charlie.id,
          name: 'Made-up Charlie Computers',
          total: null,
          partsInStock: [notShown],
          partsLacked: [],
        },
      ]);
    });
  });

  describe('one answer', () => {
    // A read that took the rate and the Offers at different moments would
    // answer 20 $ at 1,500, 30,000 IQD, or 10 $ at 2,000, 20,000 IQD, where
    // one statement answers 20 $ at 2,000, 40,000 IQD.
    for (const lockedTable of ['offer', 'platform_rate'] as const) {
      it(`gives every price at the rate of the same moment as its Offers, read in one statement, while ${lockedTable} is locked`, async () => {
        const ryzen = await aPart();
        const kit = await aPart({ category: 'ram', name: 'Made-up 32 GB kit' });
        const shop = await aVendor('Made-up Computer Shop');
        const store = await aVendor('Made-up Computer Store');
        // The API's clock moved, and the rate set at its time, as every rate
        // is set by the API's clock and not the database's.
        moveTheClockTo(aMovedMoment);
        await setThePlatformRate(1500);
        await anOffer(shop.id, ryzen.id, { usdPrice: '10.00', inStock: true });
        await anOffer(store.id, kit.id, { usdPrice: '10.00', inStock: true });

        const answer = await changeTheRateAndTheOffersWhileReading(
          { iqdPerUsd: 2000, setAt: new Date(), usdPriceCents: 2000, lockedTable },
          () => theBuild([ryzen.id, `${kit.id}:2`]),
        );

        expect(answer.parts.map(({ lowestPrice }) => lowestPrice?.timesQuantity)).toEqual([
          converted('IQD', '40000'),
          converted('IQD', '80000'),
        ]);
        expect(answer.totalAcrossVendors).toEqual(converted('IQD', '120000'));
        expect(
          answer.vendors.map(({ id, total, partsLacked }) => ({ id, total, partsLacked })),
        ).toEqual([
          { id: shop.id, total: converted('IQD', '40000'), partsLacked: [kit.id] },
          { id: store.id, total: converted('IQD', '80000'), partsLacked: [ryzen.id] },
        ]);
      });
    }

    // A read that judged the Offers and took the rate at different moments
    // would answer the kit as visible but unstocked, or the CPU's Lowest
    // Price from the deactivated Vendor, or at the old rate.
    for (const lockedTable of ['vendor', 'offer', 'platform_rate'] as const) {
      it(`judges every Offer and gives every price at one moment and one rate, read in one statement, while ${lockedTable} is locked`, async () => {
        const ryzen = await aPart();
        const kit = await aPart({ category: 'ram', name: 'Made-up 32 GB kit' });
        const shop = await aVendor('Made-up Computer Shop');
        const store = await aVendor('Made-up Computer Store');
        moveTheClockTo(aMovedMoment);
        await setThePlatformRate(1500);
        await anOffer(shop.id, ryzen.id, { usdPrice: '10.00', inStock: true });
        await anOffer(store.id, ryzen.id, { usdPrice: '12.00', inStock: true });
        await anOffer(shop.id, kit.id, { usdPrice: '10.00', inStock: true });

        const answer = await changeTheRateAndDeactivateAVendorWhileReading(
          { iqdPerUsd: 2000, setAt: new Date(), vendorId: shop.id, lockedTable },
          () => theBuild([ryzen.id, `${kit.id}:2`]),
        );

        // 12 $ at 2,000 is 24,000 IQD.
        expect(
          answer.parts.map(({ visible, unstocked, lowestPrice }) => ({
            visible,
            unstocked,
            lowest: lowestPrice?.shownPrice ?? null,
            vendor: lowestPrice?.vendor.id ?? null,
          })),
        ).toEqual([
          {
            visible: true,
            unstocked: false,
            lowest: converted('IQD', '24000'),
            vendor: store.id,
          },
          { visible: false, unstocked: true, lowest: null, vendor: null },
        ]);
        expect(answer.totalAcrossVendors).toEqual(converted('IQD', '24000'));
        expect(
          answer.vendors.map(({ id, total, partsLacked }) => ({ id, total, partsLacked })),
        ).toEqual([{ id: store.id, total: converted('IQD', '24000'), partsLacked: [] }]);
      });
    }
  });
});
