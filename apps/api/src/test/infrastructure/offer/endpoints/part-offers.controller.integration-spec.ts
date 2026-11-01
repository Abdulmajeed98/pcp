import { randomUUID } from 'node:crypto';

import {
  bearerHeader,
  expectErrorResponse,
  type ExpectedErrorResponse,
  notValid,
} from '@pcp/core/test-utils';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import {
  changeTheRateAndTheOffersWhileReading,
  emptyTheDatabase,
} from '../../../test-utils/database/test-database';
import {
  emptyTheRealm,
  loginsNamed,
} from '../../../test-utils/keycloak/keycloak-administrator';

// A Part's visible Offers, which anyone may read without a token: those that
// are not Expired Offers and whose Vendor is active (CAT-7, OFF-6, ACC-7),
// each with how many days ago it was confirmed (OFF-7) and its Shown Price in
// the chosen currency (PRC-3), in-stock Offers first and then the lowest
// Shown Price (OFF-11, PRC-4).

// The price a visible Offer shows in the currency asked for.
type ShownPriceBody = { currency: Currency; amount: string; converted: boolean };

// A visible Offer as the API answers it.
type VisibleOfferBody = {
  vendor: { id: string; name: string };
  usdPrice: string | null;
  iqdPrice: number | null;
  shownPrice: ShownPriceBody | null;
  inStock: boolean;
  warrantyMonths: number | null;
  confirmedAt: string;
  daysSinceConfirmation: number;
};

// The currencies a Shopper may choose.
type Currency = 'USD' | 'IQD';

// A Shown Price that is the Quoted Price in the currency, and one that is a
// Converted Price.
function quoted(currency: Currency, amount: string): ShownPriceBody {
  return { currency, amount, converted: false };
}
function converted(currency: Currency, amount: string): ShownPriceBody {
  return { currency, amount, converted: true };
}

// A Vendor as the API answers it, as far as these tests read it.
type VendorBody = { id: string; name: string; loginPhoneNumber: { international: string } };

// The refusals these tests expect, each as a whole.
function refusal(code: string): ExpectedErrorResponse[] {
  const key = code.toLowerCase();
  return [{ code, title: `${key}_title`, detail: `${key}_details` }];
}
const partNotFound = refusal('PART_NOT_FOUND');

const adminLoginId = randomUUID();

// A moment for the API's clock, with milliseconds, so that a time stored
// with less precision would show.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');

// A day of 24 hours, and a moment some time after another.
const aDay = 24 * 60 * 60 * 1000;
function after(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() + milliseconds);
}

describe("a Part's visible Offers", () => {
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

  // A made-up Vendor the Admin creates, with a Login of its own.
  async function aVendor(name: string, loginPhoneNumber: string): Promise<VendorBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        city: 'erbil',
        address: 'Made-up Street, Erbil',
        phoneNumber: '066 223 4567',
        loginPhoneNumber,
      }),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { vendor: VendorBody }).vendor;
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

  // A made-up Part the Admin adds to the catalog, and its identifier.
  async function aPart(name = 'Made-up Ryzen 5 7600'): Promise<string> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'cpu',
        name,
        manufacturer: 'AMD',
        partNumbers: ['100-100001015BOX'],
      }),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { id: string }).id;
  }

  // An Offer the Admin adds for the Vendor, with the clock as it is, and its
  // identifier.
  async function anOffer(
    vendorId: string,
    partId: string,
    details: Record<string, unknown> = { usdPrice: '349.99', inStock: true },
  ): Promise<string> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ partId, ...details }),
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { id: string }).id;
  }

  // An Offer the Admin adds for the Vendor with the clock at a moment, which
  // is then the time of its Confirmation, and its identifier. The clock stays
  // there.
  async function anOfferConfirmedAt(
    vendorId: string,
    partId: string,
    moment: Date,
    details?: Record<string, unknown>,
  ): Promise<string> {
    moveTheClockTo(moment);
    return anOffer(vendorId, partId, details);
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

  // The Part's visible Offers, asked for with the query given, `currency`
  // among it unless a test leaves it out.
  function readVisibleOffers(
    partId: string,
    query: Record<string, string> = { currency: 'IQD' },
    headers: Record<string, string> = {},
  ): Promise<Response> {
    const search = new URLSearchParams(query).toString();
    return fetch(`${testApp.baseUrl}/v1/parts/${partId}/offers?${search}`, { headers });
  }

  // The Part's visible Offers in a currency, read without a token at the time
  // of the clock.
  async function theVisibleOffersOf(
    partId: string,
    currency: Currency = 'IQD',
  ): Promise<VisibleOfferBody[]> {
    const response = await readVisibleOffers(partId, { currency });
    expect(response.status).toBe(200);
    return (await response.json()) as VisibleOfferBody[];
  }

  describe('the answer', () => {
    it("gives each Offer with its Vendor's name, both Quoted Prices as entered, its Shown Price, the stock, the warranty, and when it was confirmed", async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      const store = await aVendor('شەقامی ٦٠ کۆمپیوتەر', '0750 765 4321');
      await anOfferConfirmedAt(shop.id, partId, aMovedMoment, {
        usdPrice: '349.99',
        inStock: true,
        warrantyMonths: 36,
      });
      await anOfferConfirmedAt(store.id, partId, after(aMovedMoment, 2 * aDay), {
        iqdPrice: 525000,
        inStock: true,
      });
      moveTheClockTo(after(aMovedMoment, 3 * aDay + 1));

      expect(await theVisibleOffersOf(partId)).toEqual([
        {
          vendor: { id: store.id, name: 'شەقامی ٦٠ کۆمپیوتەر' },
          usdPrice: null,
          iqdPrice: 525000,
          shownPrice: { currency: 'IQD', amount: '525000', converted: false },
          inStock: true,
          warrantyMonths: null,
          confirmedAt: after(aMovedMoment, 2 * aDay).toISOString(),
          daysSinceConfirmation: 1,
        },
        {
          vendor: { id: shop.id, name: 'Made-up Computer Shop' },
          usdPrice: '349.99',
          iqdPrice: null,
          shownPrice: null,
          inStock: true,
          warrantyMonths: 36,
          confirmedAt: aMovedMoment.toISOString(),
          daysSinceConfirmation: 3,
        },
      ]);
    });

    it("leaves out every other Part's Offers", async () => {
      const partId = await aPart();
      const another = await aPart('Made-up Ryzen 7 7700');
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      await anOffer(shop.id, another);

      expect(await theVisibleOffersOf(partId)).toEqual([]);
    });

    it('answers 404 with PART_NOT_FOUND for a Part that does not exist', async () => {
      for (const partId of [randomUUID(), 'not-a-part']) {
        await expectErrorResponse(await readVisibleOffers(partId), 404, partNotFound);
      }
    });

    it('refuses a missing currency, and one that is neither USD nor IQD, with 400, naming the currency', async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      await anOffer(shop.id, partId);

      const queries: Record<string, string>[] = [
        {},
        { currency: 'EUR' },
        { currency: 'usd' },
        { currency: '' },
      ];
      for (const query of queries) {
        await expectErrorResponse(await readVisibleOffers(partId, query), 400, [
          notValid('currency'),
        ]);
      }
    });

    it('answers an empty list for a Part with no Offer', async () => {
      expect(await theVisibleOffersOf(await aPart())).toEqual([]);
    });
  });

  describe('the Shown Price', () => {
    // The one visible Offer of the Part's, its Shown Price in a currency.
    async function theShownPriceOf(
      partId: string,
      currency: Currency,
    ): Promise<ShownPriceBody | null> {
      const [only] = await theVisibleOffersOf(partId, currency);
      return only.shownPrice;
    }

    // A Part with one Offer, in stock, of a made-up Vendor of its own, with
    // these prices.
    let parts = 0;
    async function aPartOfferedAt(prices: Record<string, unknown>): Promise<string> {
      parts += 1;
      const partId = await aPart(`Made-up Ryzen 5 76${String(parts).padStart(2, '0')}`);
      const shop = await aVendor(
        `Made-up Computer Shop ${parts}`,
        `0750 200 ${String(1000 + parts)}`,
      );
      await anOffer(shop.id, partId, { ...prices, inStock: true });
      return partId;
    }

    it('of an Offer quoted only in USD is its Quoted Price with its cents in USD, and in IQD the conversion rounded to 250, marked converted', async () => {
      await setThePlatformRate(1575);
      const partId = await aPartOfferedAt({ usdPrice: '349.99' });

      expect(await theShownPriceOf(partId, 'USD')).toEqual(quoted('USD', '349.99'));
      // 349.99 × 1,575 = 551,234.25, nearer to 551,250 than to 551,000.
      expect(await theShownPriceOf(partId, 'IQD')).toEqual(converted('IQD', '551250'));
    });

    it('of an Offer quoted only in IQD is its dinars as entered in IQD, not a multiple of 250, and whole dollars in USD, marked converted', async () => {
      await setThePlatformRate(1575);
      const partId = await aPartOfferedAt({ iqdPrice: 1574990 });

      expect(await theShownPriceOf(partId, 'IQD')).toEqual(quoted('IQD', '1574990'));
      // 1,574,990 ÷ 1,575 = 999.99…, nearer to 1,000 than to 999.
      expect(await theShownPriceOf(partId, 'USD')).toEqual(converted('USD', '1000.00'));
    });

    it('of an Offer quoted in both is its own Quoted Price in each, never converted, even where the rate gives another figure', async () => {
      await setThePlatformRate(1575);
      // At 1,575, 100 $ would be 157,500 IQD, and 160,000 IQD about 102 $.
      const partId = await aPartOfferedAt({ usdPrice: '100.00', iqdPrice: 160000 });

      expect(await theShownPriceOf(partId, 'USD')).toEqual(quoted('USD', '100.00'));
      expect(await theShownPriceOf(partId, 'IQD')).toEqual(quoted('IQD', '160000'));
    });

    it('rounds exactly half a step up and just below it down, both ways', async () => {
      await setThePlatformRate(1500);
      // 0.25 $ × 1,500 = 375 IQD, half-way from 250 to 500; 0.24 $ is 360.
      const half = await aPartOfferedAt({ usdPrice: '0.25' });
      const belowHalf = await aPartOfferedAt({ usdPrice: '0.24' });
      // 2,250 IQD ÷ 1,500 = 1.5 $; 2,249 IQD is just below.
      const halfADollar = await aPartOfferedAt({ iqdPrice: 2250 });
      const belowHalfADollar = await aPartOfferedAt({ iqdPrice: 2249 });

      expect(await theShownPriceOf(half, 'IQD')).toEqual(converted('IQD', '500'));
      expect(await theShownPriceOf(belowHalf, 'IQD')).toEqual(converted('IQD', '250'));
      expect(await theShownPriceOf(halfADollar, 'USD')).toEqual(converted('USD', '2.00'));
      expect(await theShownPriceOf(belowHalfADollar, 'USD')).toEqual(
        converted('USD', '1.00'),
      );
    });

    it('is never below one step, where the conversion would round to 0, in each direction', async () => {
      await setThePlatformRate(1500);
      // 0.08 $ × 1,500 = 120 IQD, nearer to 0 than to 250.
      const cents = await aPartOfferedAt({ usdPrice: '0.08' });
      // 749 IQD ÷ 1,500 = 0.499… $, nearer to 0 than to 1.
      const dinars = await aPartOfferedAt({ iqdPrice: 749 });
      const oneDinar = await aPartOfferedAt({ iqdPrice: 1 });

      expect(await theShownPriceOf(cents, 'IQD')).toEqual(converted('IQD', '250'));
      expect(await theShownPriceOf(dinars, 'USD')).toEqual(converted('USD', '1.00'));
      expect(await theShownPriceOf(oneDinar, 'USD')).toEqual(converted('USD', '1.00'));
    });

    it("converts a price at the top of the Offers' limits exactly, at the highest rate and at one just below it", async () => {
      const largestUsd = await aPartOfferedAt({ usdPrice: '100000.00' });
      const justBelowLargestUsd = await aPartOfferedAt({ usdPrice: '99999.99' });
      const largestIqd = await aPartOfferedAt({ iqdPrice: 150000000 });
      const justBelowLargestIqd = await aPartOfferedAt({ iqdPrice: 149999999 });

      await setThePlatformRate(5000);
      expect(await theShownPriceOf(largestUsd, 'IQD')).toEqual(
        converted('IQD', '500000000'),
      );
      // 150,000,000 ÷ 5,000 = 30,000 $.
      expect(await theShownPriceOf(largestIqd, 'USD')).toEqual(
        converted('USD', '30000.00'),
      );

      await setThePlatformRate(4999);
      // 99,999.99 × 4,999 = 499,899,950.01, nearer to 499,900,000 than to
      // 499,899,750.
      expect(await theShownPriceOf(justBelowLargestUsd, 'IQD')).toEqual(
        converted('IQD', '499900000'),
      );
      // 149,999,999 ÷ 4,999 = 30,006.0010…, nearer to 30,006 than to 30,007.
      expect(await theShownPriceOf(justBelowLargestIqd, 'USD')).toEqual(
        converted('USD', '30006.00'),
      );

      await setThePlatformRate(500);
      // 150,000,000 ÷ 500 = 300,000 $, above the largest Quoted Price in USD.
      expect(await theShownPriceOf(largestIqd, 'USD')).toEqual(
        converted('USD', '300000.00'),
      );
    });

    it('changes every Converted Price at the next read after a new rate, and no Quoted Price', async () => {
      const usdOnly = await aPartOfferedAt({ usdPrice: '10.00' });
      const iqdOnly = await aPartOfferedAt({ iqdPrice: 30000 });
      const both = await aPartOfferedAt({ usdPrice: '10.00', iqdPrice: 16000 });
      // The Shown Prices of the three, in IQD and in USD.
      async function theShownPrices(): Promise<(ShownPriceBody | null)[]> {
        const shown = [];
        for (const currency of ['IQD', 'USD'] as const) {
          for (const partId of [usdOnly, iqdOnly, both]) {
            shown.push(await theShownPriceOf(partId, currency));
          }
        }
        return shown;
      }

      await setThePlatformRate(1500);
      expect(await theShownPrices()).toEqual([
        converted('IQD', '15000'),
        quoted('IQD', '30000'),
        quoted('IQD', '16000'),
        quoted('USD', '10.00'),
        converted('USD', '20.00'),
        quoted('USD', '10.00'),
      ]);

      await setThePlatformRate(2000);
      expect(await theShownPrices()).toEqual([
        converted('IQD', '20000'),
        quoted('IQD', '30000'),
        quoted('IQD', '16000'),
        quoted('USD', '10.00'),
        converted('USD', '15.00'),
        quoted('USD', '10.00'),
      ]);
    });

    it('is null with no rate for an Offer not quoted in the chosen currency, which keeps both Quoted Prices', async () => {
      const usdOnly = await aPartOfferedAt({ usdPrice: '349.99' });
      const iqdOnly = await aPartOfferedAt({ iqdPrice: 525000 });

      expect(await theVisibleOffersOf(usdOnly, 'IQD')).toMatchObject([
        { usdPrice: '349.99', iqdPrice: null, shownPrice: null },
      ]);
      expect(await theVisibleOffersOf(usdOnly, 'USD')).toMatchObject([
        { usdPrice: '349.99', iqdPrice: null, shownPrice: quoted('USD', '349.99') },
      ]);
      expect(await theVisibleOffersOf(iqdOnly, 'USD')).toMatchObject([
        { usdPrice: null, iqdPrice: 525000, shownPrice: null },
      ]);
      expect(await theVisibleOffersOf(iqdOnly, 'IQD')).toMatchObject([
        { usdPrice: null, iqdPrice: 525000, shownPrice: quoted('IQD', '525000') },
      ]);
    });
  });

  describe('one answer', () => {
    // A read that took the rate and the Offers at different moments would
    // answer 10 $ at 2,000, or 20 $ at 1,500, 30,000 IQD.
    for (const lockedTable of ['offer', 'platform_rate'] as const) {
      it(`converts every price at the rate of the same moment as its Offers, read in one query, while ${lockedTable} is locked`, async () => {
        await setThePlatformRate(1500);
        const partId = await aPart();
        const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
        const store = await aVendor('Made-up Computer Store', '0750 765 4321');
        await anOffer(shop.id, partId, { usdPrice: '10.00', inStock: true });
        await anOffer(store.id, partId, { usdPrice: '10.00', inStock: false });

        const answer = await changeTheRateAndTheOffersWhileReading(
          { iqdPerUsd: 2000, usdPriceCents: 2000, lockedTable },
          () => theVisibleOffersOf(partId, 'IQD'),
        );

        // Both after the change, as a read in one query sees them.
        expect(answer.map(({ usdPrice, shownPrice }) => [usdPrice, shownPrice])).toEqual([
          ['20.00', converted('IQD', '40000')],
          ['20.00', converted('IQD', '40000')],
        ]);
      });
    }
  });

  describe('who may read them', () => {
    it('answers the same without a token and with any token', async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      await anOffer(shop.id, partId);
      const withoutAToken = await theVisibleOffersOf(partId);
      expect(withoutAToken).toHaveLength(1);

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
        const response = await readVisibleOffers(
          partId,
          { currency: 'IQD' },
          bearerHeader(token),
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(withoutAToken);
      }
    });

    it("holds nothing of the Vendor's Login", async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      await anOffer(shop.id, partId);
      const [login] = await loginsNamed(shop.loginPhoneNumber.international);

      const response = await readVisibleOffers(partId);
      const text = await response.text();

      expect(response.status).toBe(200);
      for (const secret of [login.id, '+9647501234567', '07501234567', '750 123 4567']) {
        expect(text).not.toContain(secret);
      }
    });
  });

  describe('the order', () => {
    // Made-up Vendors, one for each name, made with the clock running, since
    // that calls Keycloak; then each one's Offer for the Part, confirmed one
    // day apart in the order given, with the clock then a day after the last.
    async function offersConfirmedInTurn(
      partId: string,
      offers: [name: string, details: Record<string, unknown>][],
    ): Promise<VendorBody[]> {
      const vendors = [];
      for (const [index, [name]] of offers.entries()) {
        vendors.push(await aVendor(name, `0750 300 ${String(1000 + index)}`));
      }
      for (const [index, [, details]] of offers.entries()) {
        await anOfferConfirmedAt(
          vendors[index].id,
          partId,
          after(aMovedMoment, index * aDay),
          details,
        );
      }
      moveTheClockTo(after(aMovedMoment, offers.length * aDay));
      return vendors;
    }

    // The names of the Vendors of the Part's visible Offers, in the order
    // answered in a currency.
    async function theVendorsInOrder(
      partId: string,
      currency: Currency,
    ): Promise<string[]> {
      return (await theVisibleOffersOf(partId, currency)).map(({ vendor }) => vendor.name);
    }

    it('puts in-stock Offers before out-of-stock ones, whatever their prices', async () => {
      await setThePlatformRate(1575);
      const partId = await aPart();
      await offersConfirmedInTurn(partId, [
        ['Out of stock, cheapest', { iqdPrice: 100000, inStock: false }],
        ['In stock, dearest', { usdPrice: '900.00', inStock: true }],
        ['Out of stock, dearest', { usdPrice: '950.00', inStock: false }],
        ['In stock, cheapest', { iqdPrice: 200000, inStock: true }],
      ]);

      for (const currency of ['IQD', 'USD'] as const) {
        expect(await theVendorsInOrder(partId, currency)).toEqual([
          'In stock, cheapest',
          'In stock, dearest',
          'Out of stock, cheapest',
          'Out of stock, dearest',
        ]);
      }
    });

    it('puts the lowest Shown Price first within each stock group, compared after rounding', async () => {
      await setThePlatformRate(1575);
      const partId = await aPart();
      // In IQD, 349.99 $ is 551,234.25 before rounding, below 551,240, and
      // 551,250 after it, above. In USD, 551,240 IQD is 349.99… before
      // rounding, above 349.99, and 350.00 after it, above as well.
      await offersConfirmedInTurn(partId, [
        ['Quoted 349.99 $', { usdPrice: '349.99', inStock: true }],
        ['Quoted 551,240 IQD', { iqdPrice: 551240, inStock: true }],
        ['Quoted 600,000 IQD', { iqdPrice: 600000, inStock: true }],
        ['Quoted 300.00 $', { usdPrice: '300.00', inStock: true }],
        ['Out of stock, 1,000 IQD', { iqdPrice: 1000, inStock: false }],
        ['Out of stock, 0.10 $', { usdPrice: '0.10', inStock: false }],
      ]);

      expect(await theVendorsInOrder(partId, 'IQD')).toEqual([
        'Quoted 300.00 $',
        'Quoted 551,240 IQD',
        'Quoted 349.99 $',
        'Quoted 600,000 IQD',
        // 0.10 $ is 157.50 IQD, which is shown as 250.
        'Out of stock, 0.10 $',
        'Out of stock, 1,000 IQD',
      ]);
      expect(await theVendorsInOrder(partId, 'USD')).toEqual([
        'Quoted 300.00 $',
        'Quoted 349.99 $',
        'Quoted 551,240 IQD',
        'Quoted 600,000 IQD',
        // 0.10 $ as entered; 1,000 IQD is 0.63 $, which is shown as 1 $.
        'Out of stock, 0.10 $',
        'Out of stock, 1,000 IQD',
      ]);
    });

    it('puts an Offer quoted at 100 $ and 160,000 IQD before one quoted only at 101 $ in USD, and after it in IQD at 1,575', async () => {
      await setThePlatformRate(1575);
      const partId = await aPart();
      await offersConfirmedInTurn(partId, [
        ['Quoted in both', { usdPrice: '100.00', iqdPrice: 160000, inStock: true }],
        ['Quoted only in USD', { usdPrice: '101.00', inStock: true }],
      ]);

      expect(await theVendorsInOrder(partId, 'USD')).toEqual([
        'Quoted in both',
        'Quoted only in USD',
      ]);
      // 101 $ × 1,575 = 159,075, shown as 159,000.
      expect(await theVendorsInOrder(partId, 'IQD')).toEqual([
        'Quoted only in USD',
        'Quoted in both',
      ]);
    });

    it("falls back on equal Shown Prices to the most recent Confirmation, then the Vendor's name, then the identifier", async () => {
      await setThePlatformRate(1500);
      const partId = await aPart();
      // Every one shown as 300,000 IQD: 200 $ × 1,500 is a Converted Price
      // equal to the Quoted Prices.
      const equal = { iqdPrice: 300000, inStock: true };
      // Three more confirmed at one moment, the day after the last of these
      // two, two of them under one name; their Vendors are made first.
      const others = [];
      for (const [index, name] of [
        'Made-up Shop B',
        'Made-up Shop A',
        'Made-up Shop A',
      ].entries()) {
        others.push(await aVendor(name, `0750 400 ${String(1000 + index)}`));
      }
      const [first, second] = await offersConfirmedInTurn(partId, [
        ['Made-up Shop Z, confirmed first', equal],
        ['Made-up Shop Y, confirmed later', { usdPrice: '200.00', inStock: true }],
      ]);
      const named = [];
      for (const vendor of others) {
        const offerId = await anOfferConfirmedAt(
          vendor.id,
          partId,
          after(aMovedMoment, 2 * aDay),
          equal,
        );
        named.push({ vendor, offerId });
      }
      moveTheClockTo(after(aMovedMoment, 3 * aDay));
      const [b, ...theAs] = named;
      // Of the two named A, the lower identifier of an Offer first.
      const [lowerA, higherA] = theAs.sort((one, other) =>
        one.offerId < other.offerId ? -1 : 1,
      );

      const answer = await theVisibleOffersOf(partId, 'IQD');

      expect(answer.map(({ shownPrice }) => shownPrice?.amount)).toEqual(
        Array(5).fill('300000'),
      );
      expect(answer.map(({ vendor }) => vendor.id)).toEqual([
        lowerA.vendor.id,
        higherA.vendor.id,
        b.vendor.id,
        second.id,
        first.id,
      ]);
    });

    it('puts Offers with no Shown Price after the others in their stock group', async () => {
      // No Platform Rate is set.
      const partId = await aPart();
      await offersConfirmedInTurn(partId, [
        ['In stock, only in USD', { usdPrice: '10.00', inStock: true }],
        ['Out of stock, only in USD', { usdPrice: '10.00', inStock: false }],
        ['Out of stock, in IQD', { iqdPrice: 900000, inStock: false }],
        ['In stock, in IQD', { iqdPrice: 900000, inStock: true }],
      ]);

      expect(await theVendorsInOrder(partId, 'IQD')).toEqual([
        'In stock, in IQD',
        'In stock, only in USD',
        'Out of stock, in IQD',
        'Out of stock, only in USD',
      ]);
      expect(await theVendorsInOrder(partId, 'USD')).toEqual([
        'In stock, only in USD',
        'In stock, in IQD',
        'Out of stock, only in USD',
        'Out of stock, in IQD',
      ]);
    });
  });

  describe("a deactivated Vendor's Offers", () => {
    // The Admin deactivates or reactivates a Vendor, with the clock running,
    // since it calls Keycloak.
    async function admin(action: 'deactivate' | 'reactivate', vendorId: string) {
      const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/${action}`, {
        method: 'POST',
        headers: bearerHeader(await adminToken()),
      });
      expect(response.status).toBe(200);
    }

    async function theVendorsVisible(partId: string): Promise<string[]> {
      return (await theVisibleOffersOf(partId)).map(({ vendor }) => vendor.id);
    }

    it('are left out, with a rate set, and come back when the Vendor is reactivated', async () => {
      await setThePlatformRate(1575);
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      const store = await aVendor('Made-up Computer Store', '0750 765 4321');
      await anOffer(shop.id, partId);
      await anOffer(store.id, partId);

      await admin('deactivate', shop.id);
      expect(await theVendorsVisible(partId)).toEqual([store.id]);

      await admin('reactivate', shop.id);
      expect((await theVendorsVisible(partId)).sort()).toEqual([shop.id, store.id].sort());
    });
  });

  describe('an Expired Offer, with the clock moved', () => {
    // The Vendors whose Offers for the Part are visible with the clock moved
    // to a moment.
    async function theVendorsVisibleAt(partId: string, moment: Date): Promise<string[]> {
      moveTheClockTo(moment);
      return (await theVisibleOffersOf(partId)).map(({ vendor }) => vendor.id);
    }

    it('is visible when confirmed 14 days ago to the millisecond, and left out one millisecond later, with a rate set', async () => {
      await setThePlatformRate(1575);
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      await anOfferConfirmedAt(shop.id, partId, aMovedMoment);

      expect(await theVendorsVisibleAt(partId, after(aMovedMoment, 14 * aDay))).toEqual([
        shop.id,
      ]);
      expect(await theVendorsVisibleAt(partId, after(aMovedMoment, 14 * aDay + 1))).toEqual(
        [],
      );
    });

    it('is visible again at once when its Vendor confirms all its Offers', async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      await anOfferConfirmedAt(shop.id, partId, aMovedMoment);
      const later = after(aMovedMoment, 20 * aDay);
      moveTheClockTo(later);
      expect(await theVisibleOffersOf(partId)).toEqual([]);

      const confirmation = await fetch(
        `${testApp.baseUrl}/v1/vendors/${shop.id}/offers/confirm`,
        { method: 'POST', headers: bearerHeader(await tokenOfTheOwnLogin(shop)) },
      );
      expect(confirmation.status).toBe(200);

      expect(await theVisibleOffersOf(partId)).toMatchObject([
        {
          vendor: { id: shop.id },
          confirmedAt: later.toISOString(),
          daysSinceConfirmation: 0,
        },
      ]);
    });

    it('is visible again at once when its Vendor saves it, unchanged or changed', async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      const offerId = await anOfferConfirmedAt(shop.id, partId, aMovedMoment);

      for (const [daysLater, details] of [
        [20, { usdPrice: '349.99', inStock: true }],
        [40, { iqdPrice: 500000, inStock: false, warrantyMonths: 6 }],
      ] as const) {
        const later = after(aMovedMoment, daysLater * aDay);
        moveTheClockTo(later);
        expect(await theVisibleOffersOf(partId)).toEqual([]);

        const saved = await fetch(
          `${testApp.baseUrl}/v1/vendors/${shop.id}/offers/${offerId}`,
          {
            method: 'PUT',
            headers: {
              ...bearerHeader(await tokenOfTheOwnLogin(shop)),
              'content-type': 'application/json',
            },
            body: JSON.stringify(details),
          },
        );
        expect(saved.status).toBe(200);

        expect(await theVisibleOffersOf(partId)).toEqual([
          {
            vendor: { id: shop.id, name: 'Made-up Computer Shop' },
            usdPrice: null,
            iqdPrice: null,
            shownPrice:
              'iqdPrice' in details
                ? { currency: 'IQD', amount: String(details.iqdPrice), converted: false }
                : null,
            warrantyMonths: null,
            ...details,
            confirmedAt: later.toISOString(),
            daysSinceConfirmation: 0,
          },
        ]);
      }
    });
  });

  describe('a removed Offer', () => {
    it('is left out, and is there again once its Vendor offers the Part again', async () => {
      const partId = await aPart();
      const shop = await aVendor('Made-up Computer Shop', '0750 123 4567');
      const store = await aVendor('Made-up Computer Store', '0750 765 4321');
      const offerId = await anOffer(shop.id, partId);
      await anOffer(store.id, partId);

      const removal = await fetch(
        `${testApp.baseUrl}/v1/vendors/${shop.id}/offers/${offerId}`,
        { method: 'DELETE', headers: bearerHeader(await tokenOfTheOwnLogin(shop)) },
      );
      expect(removal.status).toBe(204);
      expect((await theVisibleOffersOf(partId)).map(({ vendor }) => vendor.id)).toEqual([
        store.id,
      ]);

      await anOffer(shop.id, partId, { iqdPrice: 500000, inStock: true });
      expect(
        (await theVisibleOffersOf(partId)).map(({ vendor }) => vendor.id).sort(),
      ).toEqual([shop.id, store.id].sort());
    });
  });
});
