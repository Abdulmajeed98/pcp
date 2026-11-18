import { expectErrorResponse } from '@pcp/core/test-utils';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import {
  emptyTheDatabase,
  offerHistoryRows,
  uploadedWhileTheVendorAddsAnOffer,
  whileTheDatabaseRefusesTheOfferOf,
} from '../../../test-utils/database/test-database';
import { internalServerError } from '../../../test-utils/error-bodies';
import { emptyTheRealm } from '../../../test-utils/keycloak/keycloak-administrator';
import { anOfferSheet, thePlatformUnderTest, wordsIn } from './offer-sheet-uploads';

// Applying an uploaded Offer sheet's rows (SHT-3, SHT-4, OFF-5): each row
// matched to one Part changes or creates the Vendor's Offer for it, all in
// one transaction, each a Confirmation at the upload's moment, and an Offer
// no row names is left as it was. What the Offers then are is read through
// the Vendor's Offers and a Part's Visible Offers, and their history from
// the database with `offerHistoryRows()`, which no endpoint answers.

// A moment for the API's clock, with milliseconds, so that a time stored
// with less precision would show.
const theUpload = new Date('2027-03-14T09:26:53.589Z');

// A day of 24 hours, and a moment some time before another.
const aDay = 24 * 60 * 60 * 1000;
function before(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() - milliseconds);
}
function aSecondAfter(moment: Date): Date {
  return new Date(moment.getTime() + 1000);
}

const yes = wordsIn('en').yes;
const no = wordsIn('en').no;

describe("Applying an uploaded Offer sheet's rows", () => {
  let testApp: TestAppWithLogins;
  let platform: ReturnType<typeof thePlatformUnderTest>;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
    platform = thePlatformUnderTest(testApp);
  });

  afterAll(async () => {
    await testApp.close();
  });

  afterEach(async () => {
    letTheClockRun();
    await emptyTheDatabase();
    await emptyTheRealm();
  });

  describe('a row for a Part the Vendor has no Offer for', () => {
    it("adds the Offer with the row's details, confirmed and made at the upload's moment, and answers it added with its Part", async () => {
      const vendor = await platform.aVendor();
      const part = await platform.aPart('Made-up Radeon RX 9070 XT', ['11348-03-20G']);
      const file = await anOfferSheet([
        ['11348-03-20G', 'Made-up Radeon RX 9070 XT', 649.99, 950000, yes, 24],
      ]);
      moveTheClockTo(theUpload);

      const response = await platform.upload(
        vendor.id,
        file,
        await platform.tokenOfTheOwnLogin(vendor),
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      const { offers } = await platform.theVendorsOffers(vendor.id);
      expect(offers).toMatchObject([
        {
          part,
          usdPrice: '649.99',
          iqdPrice: 950000,
          inStock: true,
          warrantyMonths: 24,
          confirmedAt: theUpload.toISOString(),
          createdAt: theUpload.toISOString(),
        },
      ]);
      expect(result).toEqual({
        rows: 1,
        added: [{ row: 2, part, offerId: offers[0].id }],
        changed: 0,
        confirmed: 0,
        matchedByYourOffer: [],
        skipped: [],
      });
    });

    it("records the Offer's creation once, at the upload's moment, by the Caller's Login: the Vendor's own, or the Admin's", async () => {
      const vendor = await platform.aVendor();
      const own = await platform.aPart('Made-up Own GPU', ['MU-OWN-1']);
      const admins = await platform.aPart('Made-up Admin GPU', ['MU-ADMIN-1']);
      moveTheClockTo(theUpload);

      expect(
        (
          await platform.upload(
            vendor.id,
            await anOfferSheet([['MU-OWN-1', null, '349.99', null, yes, null]]),
            await platform.tokenOfTheOwnLogin(vendor),
          )
        ).status,
      ).toBe(200);
      moveTheClockTo(aSecondAfter(theUpload));
      await platform.uploaded(
        vendor.id,
        await anOfferSheet([['MU-ADMIN-1', null, null, 1875000, no, null]]),
      );

      expect(await offerHistoryRows()).toEqual([
        {
          changedAt: theUpload,
          vendorId: vendor.id,
          partId: own.id,
          change: 'created',
          usdPriceCents: 34999,
          iqdPrice: null,
          inStock: true,
          changedBy: vendor.loginId,
        },
        {
          changedAt: aSecondAfter(theUpload),
          vendorId: vendor.id,
          partId: admins.id,
          change: 'created',
          usdPriceCents: null,
          iqdPrice: 1875000,
          inStock: false,
          changedBy: platform.adminLoginId,
        },
      ]);
    });
  });

  describe('a row for a Part the Vendor has an Offer for', () => {
    it("replaces the Offer's prices, stock and warranty with the row's, moves its Confirmation to the upload's moment, records the change, and counts it changed", async () => {
      const vendor = await platform.aVendor();
      const part = await platform.aPart('Made-up Radeon RX 9070 XT', ['11348-03-20G']);
      moveTheClockTo(before(theUpload, 3 * aDay));
      const offer = await platform.anOffer(vendor.id, part.id, {
        usdPrice: '599.00',
        iqdPrice: null,
        inStock: false,
        warrantyMonths: 12,
      });
      moveTheClockTo(theUpload);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([['11348-03-20G', 'Made-up', 649.99, 950000, yes, 24]]),
      );

      expect(result).toEqual({
        rows: 1,
        added: [],
        changed: 1,
        confirmed: 0,
        matchedByYourOffer: [],
        skipped: [],
      });
      expect(await platform.theOfferOf(vendor.id, part.id)).toMatchObject({
        id: offer.id,
        usdPrice: '649.99',
        iqdPrice: 950000,
        inStock: true,
        warrantyMonths: 24,
        confirmedAt: theUpload.toISOString(),
        createdAt: before(theUpload, 3 * aDay).toISOString(),
      });
      expect(
        (await offerHistoryRows()).map(
          ({ change, changedAt, changedBy, usdPriceCents }) => ({
            change,
            changedAt,
            changedBy,
            usdPriceCents,
          }),
        ),
      ).toEqual([
        {
          change: 'created',
          changedAt: before(theUpload, 3 * aDay),
          changedBy: platform.adminLoginId,
          usdPriceCents: 59900,
        },
        {
          change: 'changed',
          changedAt: theUpload,
          changedBy: platform.adminLoginId,
          usdPriceCents: 64999,
        },
      ]);
    });

    it('counts a change of the warranty alone changed, with no history row', async () => {
      const vendor = await platform.aVendor();
      const part = await platform.aPart('Made-up Radeon RX 9070 XT', ['11348-03-20G']);
      moveTheClockTo(before(theUpload, aDay));
      await platform.anOffer(vendor.id, part.id, {
        usdPrice: '599.00',
        warrantyMonths: 12,
      });
      moveTheClockTo(theUpload);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([['11348-03-20G', null, 599, null, yes, 36]]),
      );

      expect([result.changed, result.confirmed]).toEqual([1, 0]);
      expect(await platform.theOfferOf(vendor.id, part.id)).toMatchObject({
        warrantyMonths: 36,
        confirmedAt: theUpload.toISOString(),
      });
      expect((await offerHistoryRows()).map(({ change }) => change)).toEqual(['created']);
    });

    it('counts a row that changes nothing confirmed, moves the Confirmation, and adds no history row', async () => {
      const vendor = await platform.aVendor();
      const part = await platform.aPart('Made-up Radeon RX 9070 XT', ['11348-03-20G']);
      moveTheClockTo(before(theUpload, 5 * aDay));
      await platform.anOffer(vendor.id, part.id, {
        usdPrice: '599.00',
        iqdPrice: 950000,
        inStock: true,
        warrantyMonths: 12,
      });
      moveTheClockTo(theUpload);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([['11348-03-20G', null, '599', '950,000', yes, 12]]),
      );

      expect(result).toMatchObject({ rows: 1, added: [], changed: 0, confirmed: 1 });
      expect(await platform.theOfferOf(vendor.id, part.id)).toMatchObject({
        usdPrice: '599.00',
        iqdPrice: 950000,
        confirmedAt: theUpload.toISOString(),
      });
      expect((await offerHistoryRows()).map(({ change }) => change)).toEqual(['created']);
    });

    it('takes a row as the Offer whole: an empty USD cell beside an IQD price makes it IQD-only, and an empty warranty cell removes the warranty', async () => {
      const vendor = await platform.aVendor();
      const part = await platform.aPart('Made-up Radeon RX 9070 XT', ['11348-03-20G']);
      await platform.anOffer(vendor.id, part.id, {
        usdPrice: '599.00',
        iqdPrice: 950000,
        warrantyMonths: 12,
      });

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([['11348-03-20G', null, null, 950000, yes, null]]),
      );

      expect(result.changed).toBe(1);
      expect(await platform.theOfferOf(vendor.id, part.id)).toMatchObject({
        usdPrice: null,
        iqdPrice: 950000,
        warrantyMonths: null,
      });
    });

    it('makes an Expired Offer a Visible Offer at once, its days since Confirmation 0', async () => {
      const vendor = await platform.aVendor();
      const part = await platform.aPart('Made-up Radeon RX 9070 XT', ['11348-03-20G']);
      moveTheClockTo(before(theUpload, 20 * aDay));
      await platform.anOffer(vendor.id, part.id, { usdPrice: '599.00' });
      moveTheClockTo(theUpload);
      expect(await platform.theVisibleOffersOf(part.id)).toEqual([]);

      await platform.uploaded(
        vendor.id,
        await anOfferSheet([['11348-03-20G', null, 599, null, yes, null]]),
      );

      expect(await platform.theVisibleOffersOf(part.id)).toMatchObject([
        {
          vendor: { id: vendor.id },
          usdPrice: '599.00',
          confirmedAt: theUpload.toISOString(),
          daysSinceConfirmation: 0,
        },
      ]);
    });
  });

  describe('Offers no applied row names (SHT-4)', () => {
    it('leaves an Offer no row names, and one named only by a skipped row, with its details and its Confirmation', async () => {
      const vendor = await platform.aVendor();
      const named = await platform.aPart('Made-up Named GPU', ['MU-NAMED-1']);
      const unnamed = await platform.aPart('Made-up Unnamed GPU', ['MU-UNNAMED-1']);
      const skipped = await platform.aPart('Made-up Skipped GPU', ['MU-SKIPPED-1']);
      moveTheClockTo(before(theUpload, 4 * aDay));
      await platform.anOffer(vendor.id, named.id, { usdPrice: '100.00' });
      const unnamedOffer = await platform.anOffer(vendor.id, unnamed.id, {
        usdPrice: '200.00',
        warrantyMonths: 6,
      });
      const skippedOffer = await platform.anOffer(vendor.id, skipped.id, {
        usdPrice: '300.00',
      });
      moveTheClockTo(theUpload);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          ['MU-NAMED-1', null, 150, null, yes, null],
          ['MU-SKIPPED-1', null, 'three hundred', null, yes, null],
        ]),
      );

      expect([result.changed, result.skipped.map(({ row }) => row)]).toEqual([1, [3]]);
      const { offers } = await platform.theVendorsOffers(vendor.id);
      const byId = new Map(offers.map((offer) => [offer.id, offer]));
      expect(byId.get(unnamedOffer.id)).toMatchObject({
        usdPrice: '200.00',
        warrantyMonths: 6,
        confirmedAt: before(theUpload, 4 * aDay).toISOString(),
      });
      expect(byId.get(skippedOffer.id)).toMatchObject({
        usdPrice: '300.00',
        confirmedAt: before(theUpload, 4 * aDay).toISOString(),
      });
      expect((await offerHistoryRows()).map(({ change }) => change)).toEqual([
        'created',
        'created',
        'created',
        'changed',
      ]);
    });

    it("leaves another Vendor's Offer for the same Part alone", async () => {
      const vendor = await platform.aVendor();
      const other = await platform.aVendor('Made-up Other Corner');
      const part = await platform.aPart('Made-up Radeon RX 9070 XT', ['11348-03-20G']);
      moveTheClockTo(before(theUpload, aDay));
      const othersOffer = await platform.anOffer(other.id, part.id, { usdPrice: '599.00' });
      moveTheClockTo(theUpload);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([['11348-03-20G', null, 649.99, null, yes, null]]),
      );

      expect(result.added).toHaveLength(1);
      expect(await platform.theOfferOf(other.id, part.id)).toMatchObject({
        id: othersOffer.id,
        usdPrice: '599.00',
        confirmedAt: before(theUpload, aDay).toISOString(),
      });
    });
  });

  describe('all or none', () => {
    it("changes no Offer and writes no history row when the database refuses one row's write, and answers a server error", async () => {
      const vendor = await platform.aVendor();
      const first = await platform.aPart('Made-up First GPU', ['MU-FIRST-1']);
      const second = await platform.aPart('Made-up Second GPU', ['MU-SECOND-1']);
      const refused = await platform.aPart('Made-up Refused GPU', ['MU-REFUSED-1']);
      moveTheClockTo(before(theUpload, 2 * aDay));
      await platform.anOffer(vendor.id, first.id, { usdPrice: '100.00' });
      await platform.anOffer(vendor.id, second.id, { usdPrice: '200.00' });
      moveTheClockTo(theUpload);
      const offersBefore = (await platform.theVendorsOffers(vendor.id)).offers;
      const historyBefore = await offerHistoryRows();
      const file = await anOfferSheet([
        ['MU-FIRST-1', null, 110, null, yes, null],
        ['MU-SECOND-1', null, 220, null, no, null],
        ['MU-REFUSED-1', null, 330, null, yes, null],
      ]);
      const token = await platform.adminToken();

      let response: Response | undefined;
      await whileTheDatabaseRefusesTheOfferOf(vendor.id, refused.id, async () => {
        response = await platform.upload(vendor.id, file, token);
      });

      await expectErrorResponse(response as Response, 500, internalServerError);
      expect((await platform.theVendorsOffers(vendor.id)).offers).toEqual(offersBefore);
      expect(await offerHistoryRows()).toEqual(historyBefore);
    });
  });

  describe("the Vendor's own add while an upload runs", () => {
    it("succeeds, and the row replaces the Offer the Vendor added, counted against it, with the change recorded after the Vendor's creation", async () => {
      const vendor = await platform.aVendor();
      const part = await platform.aPart('Made-up Radeon RX 9070 XT', ['11348-03-20G']);
      const addedAt = before(theUpload, 1000);
      moveTheClockTo(theUpload);
      const file = await anOfferSheet([['11348-03-20G', null, 649.99, 950000, yes, 24]]);
      const token = await platform.adminToken();

      const response = await uploadedWhileTheVendorAddsAnOffer(
        {
          vendorId: vendor.id,
          partId: part.id,
          usdPriceCents: 59900,
          iqdPrice: 900000,
          inStock: false,
          warrantyMonths: 12,
          addedAt,
          addedBy: vendor.loginId,
        },
        () => platform.upload(vendor.id, file, token),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        rows: 1,
        added: [],
        changed: 1,
        confirmed: 0,
        skipped: [],
      });
      expect(await platform.theOfferOf(vendor.id, part.id)).toMatchObject({
        usdPrice: '649.99',
        iqdPrice: 950000,
        inStock: true,
        warrantyMonths: 24,
        confirmedAt: theUpload.toISOString(),
        createdAt: addedAt.toISOString(),
      });
      expect(
        (await offerHistoryRows()).map(({ change, changedBy }) => ({ change, changedBy })),
      ).toEqual([
        { change: 'created', changedBy: vendor.loginId },
        { change: 'changed', changedBy: platform.adminLoginId },
      ]);
    });
  });

  describe('a Deactivated Vendor', () => {
    it("has its Offers changed and added by the Admin's upload, hidden from Shoppers until it is reactivated", async () => {
      const vendor = await platform.aVendor();
      const offered = await platform.aPart('Made-up Offered GPU', ['MU-OFFERED-1']);
      const fresh = await platform.aPart('Made-up Fresh GPU', ['MU-FRESH-1']);
      await platform.anOffer(vendor.id, offered.id, { usdPrice: '100.00' });
      await platform.admin('deactivate', vendor.id);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          ['MU-OFFERED-1', null, 120, null, yes, null],
          ['MU-FRESH-1', null, 80, null, yes, null],
        ]),
      );

      expect([result.changed, result.added.map(({ part }) => part.id)]).toEqual([
        1,
        [fresh.id],
      ]);
      expect(await platform.theVisibleOffersOf(offered.id)).toEqual([]);
      expect(await platform.theVisibleOffersOf(fresh.id)).toEqual([]);
      await platform.admin('reactivate', vendor.id);
      expect(await platform.theVisibleOffersOf(offered.id)).toMatchObject([
        { vendor: { id: vendor.id }, usdPrice: '120.00' },
      ]);
      expect(await platform.theVisibleOffersOf(fresh.id)).toMatchObject([
        { vendor: { id: vendor.id }, usdPrice: '80.00' },
      ]);
    });
  });
});
