import { Workbook } from 'exceljs';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../../test-utils/database/test-database';
import { emptyTheRealm } from '../../../test-utils/keycloak/keycloak-administrator';
import { anOfferSheet, thePlatformUnderTest, wordsIn } from './offer-sheet-uploads';

// Matching an uploaded Offer sheet's rows to Parts (SHT-2, SHT-5, SHT-6): by
// the part number alone, its case folded and its invisible marks dropped,
// and otherwise exactly; the tie-break for a number several Parts hold, of
// which the Vendor offers one; a row skipped as no Part, several Parts or
// the same Part twice; a downloaded file uploaded unchanged; and a row that
// matched no Part turned into a Part Request, then applied once the Admin
// has fulfilled it.

// A moment for the API's clock, and a day before it.
const theUpload = new Date('2027-03-14T09:26:53.589Z');
const aDayBefore = new Date(theUpload.getTime() - 24 * 60 * 60 * 1000);

const { yes } = wordsIn('en');

describe("Matching an uploaded Offer sheet's rows to Parts", () => {
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

  describe('one Part', () => {
    it('matches the Part that holds the number, whatever the case of its letters, and with an invisible mark pasted in', async () => {
      const vendor = await platform.aVendor();
      const intel = await platform.aPart(
        'Made-up Core i5-13600K',
        ['BX8071513600K'],
        'cpu',
      );
      const amd = await platform.aPart('Made-up Ryzen 5 7600', ['100-100001015BOX'], 'cpu');

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          ['bx8071513600k', null, 319, null, yes, null],
          ['‎100-100001015box​', null, 199, null, yes, null],
        ]),
      );

      expect(result.added).toEqual([
        { row: 2, part: intel, offerId: expect.any(String) },
        { row: 3, part: amd, offerId: expect.any(String) },
      ]);
      expect(result.matchedByYourOffer).toEqual([]);
    });

    it('matches only the exact number: a prefix of it, or the number with a hyphen added, matches no Part', async () => {
      const vendor = await platform.aVendor();
      await platform.aPart('Made-up Core i5-13600K', ['BX8071513600K'], 'cpu');

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          ['BX8071513600', 'Made-up Core i5-13600K', 319, null, yes, null],
          ['BX-8071513600K', 'Made-up Core i5-13600K', 319, null, yes, null],
        ]),
      );

      expect(result.added).toEqual([]);
      expect(result.skipped.map(({ row, problem }) => ({ row, problem }))).toEqual([
        { row: 2, problem: 'noPart' },
        { row: 3, problem: 'noPart' },
      ]);
    });

    it('matches a Part the Admin created from a Part Request, the Offer its fulfilment made', async () => {
      const vendor = await platform.aVendor();
      moveTheClockTo(aDayBefore);
      const partRequest = await platform.aPartRequest(vendor.id, {
        category: 'gpu',
        name: 'Made-up Pulse Radeon RX 9070 XT 16GB',
        partNumber: '11348-03-20G',
        usdPrice: '649.99',
        inStock: true,
      });
      letTheClockRun();
      const part = await platform.aPart('Made-up Pulse Radeon RX 9070 XT 16GB', [
        '11348-03-20G',
      ]);
      await platform.resolve(partRequest.id, { partId: part.id });
      moveTheClockTo(theUpload);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([['11348-03-20G', null, 629.99, null, yes, null]]),
      );

      expect([result.added, result.changed]).toEqual([[], 1]);
      expect(await platform.theOfferOf(vendor.id, part.id)).toMatchObject({
        usdPrice: '629.99',
        confirmedAt: theUpload.toISOString(),
      });
    });
  });

  describe('several Parts', () => {
    it("skips a row whose number several Parts hold, naming them all in the catalog's order", async () => {
      const vendor = await platform.aVendor();
      const gpuB = await platform.aPart('Made-up OC GPU B', ['OC', 'MU-GPU-B']);
      const cooler = await platform.aPart('Made-up OC Cooler', ['oc'], 'cpuCooler');
      const gpuA = await platform.aPart('Made-up OC GPU A', ['MU-GPU-A', 'Oc']);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([['OC', null, 500, null, yes, null]]),
      );

      expect(result.skipped).toEqual([
        {
          row: 2,
          partNumber: 'OC',
          problem: 'severalParts',
          parts: [cooler, gpuA, gpuB],
          partCount: 3,
        },
      ]);
      expect(result.added).toEqual([]);
    });

    it("names at most the first 10 Parts that hold the number, in the catalog's order, and counts every one", async () => {
      const vendor = await platform.aVendor();
      // Twelve GPUs and a CPU, made out of the catalog's order: the CPU comes
      // first in it, then the GPUs by name.
      const gpus = [];
      for (const letter of 'LKJIHGFEDCBA') {
        gpus.push(await platform.aPart(`Made-up OC GPU ${letter}`, ['OC']));
      }
      const cpu = await platform.aPart('Made-up OC CPU', ['oc'], 'cpu');

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([['OC', null, 500, null, yes, null]]),
      );

      const inTheCatalogsOrder = [cpu, ...[...gpus].reverse()];
      expect(result.skipped).toEqual([
        {
          row: 2,
          partNumber: 'OC',
          problem: 'severalParts',
          parts: inTheCatalogsOrder.slice(0, 10),
          partCount: 13,
        },
      ]);
    });

    it('applies a row whose number several Parts hold to the one the Vendor offers, listing it under matchedByYourOffer', async () => {
      const vendor = await platform.aVendor();
      const offered = await platform.aPart('Made-up OC GPU A', ['OC']);
      await platform.aPart('Made-up OC GPU B', ['OC']);
      moveTheClockTo(aDayBefore);
      await platform.anOffer(vendor.id, offered.id, { usdPrice: '500.00' });
      moveTheClockTo(theUpload);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([['oc', null, 520, null, yes, null]]),
      );

      expect(result).toEqual({
        rows: 1,
        added: [],
        changed: 1,
        confirmed: 0,
        matchedByYourOffer: [{ row: 2, part: offered }],
        skipped: [],
      });
      expect(await platform.theOfferOf(vendor.id, offered.id)).toMatchObject({
        usdPrice: '520.00',
        confirmedAt: theUpload.toISOString(),
      });
    });

    it('skips it as several Parts where the Vendor offers two of them', async () => {
      const vendor = await platform.aVendor();
      const first = await platform.aPart('Made-up OC GPU A', ['OC']);
      const second = await platform.aPart('Made-up OC GPU B', ['OC']);
      await platform.anOffer(vendor.id, first.id);
      await platform.anOffer(vendor.id, second.id);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([['OC', null, 520, null, yes, null]]),
      );

      expect(result.skipped).toEqual([
        {
          row: 2,
          partNumber: 'OC',
          problem: 'severalParts',
          parts: [first, second],
          partCount: 2,
        },
      ]);
      expect([result.changed, result.matchedByYourOffer]).toEqual([0, []]);
    });
  });

  describe('no Part', () => {
    it('skips a row whose number no Part holds, carrying its name and its details as they were checked, with no open Part Request', async () => {
      const vendor = await platform.aVendor();

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          [
            '11348-03-20G',
            'Made-up Pulse Radeon RX 9070 XT 16GB',
            649.99,
            '950,000',
            yes,
            24,
          ],
          ['MU-NAMELESS-1', null, null, 1875000, wordsIn('en').no, null],
        ]),
      );

      expect(result.skipped).toEqual([
        {
          row: 2,
          partNumber: '11348-03-20G',
          problem: 'noPart',
          name: 'Made-up Pulse Radeon RX 9070 XT 16GB',
          usdPrice: '649.99',
          iqdPrice: 950000,
          inStock: true,
          warrantyMonths: 24,
          partRequestOpen: false,
        },
        {
          row: 3,
          partNumber: 'MU-NAMELESS-1',
          problem: 'noPart',
          name: null,
          usdPrice: null,
          iqdPrice: 1875000,
          inStock: false,
          warrantyMonths: null,
          partRequestOpen: false,
        },
      ]);
    });

    it("says a Part Request is open when the Vendor has an open one for the number in another case, and not when its own was rejected or the open one is another Vendor's", async () => {
      const vendor = await platform.aVendor();
      const other = await platform.aVendor('Made-up Other Corner');
      const request = {
        category: 'gpu',
        name: 'Made-up Requested GPU',
        usdPrice: '649.99',
        inStock: true,
      };
      await platform.aPartRequest(vendor.id, { ...request, partNumber: 'MU-OPEN-1' });
      const rejected = await platform.aPartRequest(vendor.id, {
        ...request,
        partNumber: 'MU-REJECTED-1',
      });
      await platform.resolve(rejected.id, { reason: 'Made-up reason.' });
      await platform.aPartRequest(other.id, { ...request, partNumber: 'MU-OTHERS-1' });

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          ['mu-open-1', null, 100, null, yes, null],
          ['MU-REJECTED-1', null, 100, null, yes, null],
          ['MU-OTHERS-1', null, 100, null, yes, null],
        ]),
      );

      expect(
        result.skipped.map(({ row, partRequestOpen }) => ({ row, partRequestOpen })),
      ).toEqual([
        { row: 2, partRequestOpen: true },
        { row: 3, partRequestOpen: false },
        { row: 4, partRequestOpen: false },
      ]);
    });
  });

  describe('the same Part twice', () => {
    it('skips every row that matched the same Part, by one number or by two of its numbers, each naming the others, and applies the rest', async () => {
      const vendor = await platform.aVendor();
      const twice = await platform.aPart('Made-up Twice GPU', ['MU-TWICE-1']);
      const both = await platform.aPart('Made-up Both GPU', ['MU-BOTH-1', 'MU-BOTH-2']);
      const once = await platform.aPart('Made-up Once GPU', ['MU-ONCE-1']);
      moveTheClockTo(aDayBefore);
      const twiceOffer = await platform.anOffer(vendor.id, twice.id, {
        usdPrice: '100.00',
      });
      moveTheClockTo(theUpload);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          ['MU-TWICE-1', null, 110, null, yes, null],
          ['MU-BOTH-1', null, 200, null, yes, null],
          ['MU-ONCE-1', null, 300, null, yes, null],
          ['mu-twice-1', null, 120, null, yes, null],
          ['MU-BOTH-2', null, 210, null, yes, null],
          ['MU-TWICE-1', null, 130, null, yes, null],
        ]),
      );

      expect(result.skipped).toEqual([
        {
          row: 2,
          partNumber: 'MU-TWICE-1',
          problem: 'samePart',
          part: twice,
          rows: [5, 7],
          otherRows: 2,
        },
        {
          row: 3,
          partNumber: 'MU-BOTH-1',
          problem: 'samePart',
          part: both,
          rows: [6],
          otherRows: 1,
        },
        {
          row: 5,
          partNumber: 'mu-twice-1',
          problem: 'samePart',
          part: twice,
          rows: [2, 7],
          otherRows: 2,
        },
        {
          row: 6,
          partNumber: 'MU-BOTH-2',
          problem: 'samePart',
          part: both,
          rows: [3],
          otherRows: 1,
        },
        {
          row: 7,
          partNumber: 'MU-TWICE-1',
          problem: 'samePart',
          part: twice,
          rows: [2, 5],
          otherRows: 2,
        },
      ]);
      expect(result.added.map(({ part }) => part)).toEqual([once]);
      expect(await platform.theOfferOf(vendor.id, twice.id)).toMatchObject({
        id: twiceOffer.id,
        usdPrice: '100.00',
        confirmedAt: aDayBefore.toISOString(),
      });
      expect(await platform.theOfferOf(vendor.id, both.id)).toBeUndefined();
    });

    it('names at most the first 10 other rows that matched the Part, by row number, and counts every other row', async () => {
      const vendor = await platform.aVendor();
      const part = await platform.aPart('Made-up Many GPU', ['MU-MANY-1']);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet(
          Array.from({ length: 13 }, (_, index) => [
            'MU-MANY-1',
            null,
            100 + index,
            null,
            yes,
            null,
          ]),
        ),
      );

      // Rows 2 to 14 named the Part.
      expect(
        result.skipped.map(({ row, problem, part: named, rows, otherRows }) => ({
          row,
          problem,
          part: named,
          rows,
          otherRows,
        })),
      ).toEqual(
        Array.from({ length: 13 }, (_, index) => {
          const row = index + 2;
          const others = Array.from({ length: 13 }, (__, each) => each + 2).filter(
            (other) => other !== row,
          );
          return {
            row,
            problem: 'samePart',
            part,
            rows: others.slice(0, 10),
            otherRows: 12,
          };
        }),
      );
      expect(result.skipped[0].rows).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      expect(result.skipped[12].rows).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      expect(result.added).toEqual([]);
    });

    it('skips two rows the tie-break matched to the same Offer', async () => {
      const vendor = await platform.aVendor();
      const offered = await platform.aPart('Made-up OC GPU A', ['OC', 'MU-OC-A']);
      await platform.aPart('Made-up OC GPU B', ['OC']);
      await platform.anOffer(vendor.id, offered.id);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          ['OC', null, 520, null, yes, null],
          ['MU-OC-A', null, 530, null, yes, null],
        ]),
      );

      expect(
        result.skipped.map(({ row, problem, rows, otherRows }) => ({
          row,
          problem,
          rows,
          otherRows,
        })),
      ).toEqual([
        { row: 2, problem: 'samePart', rows: [3], otherRows: 1 },
        { row: 3, problem: 'samePart', rows: [2], otherRows: 1 },
      ]);
      expect(result.matchedByYourOffer).toEqual([]);
    });
  });

  describe('the round trip', () => {
    // The row of each Part in a downloaded file, found by the Part's name.
    async function rowsNamedIn(file: Buffer): Promise<(name: string) => number> {
      const workbook = new Workbook();
      await workbook.xlsx.load(new Uint8Array(file).buffer);
      return (name) => {
        let found = 0;
        workbook.worksheets[0].eachRow((row, number) => {
          if (row.getCell(2).value === name) found = number;
        });
        return found;
      };
    }

    it('confirms every row of a downloaded Offer sheet uploaded unchanged, a Part whose every number another Part holds among them, and skips the row of a Part with none as its part number missing', async () => {
      const vendor = await platform.aVendor();
      const own = await platform.aPart('Made-up Own GPU', ['MU-OWN-1']);
      const shared = await platform.aPart('Made-up Shared GPU', [
        'MU-SHARED-1',
        'MU-ALONE-1',
      ]);
      await platform.aPart('Made-up Sharing GPU', ['mu-shared-1']);
      const allShared = await platform.aPart('Made-up All Shared GPU', [
        'MU-ALL-1',
        'MU-ALL-2',
      ]);
      await platform.aPart('Made-up Other GPU One', ['mu-all-1']);
      await platform.aPart('Made-up Other GPU Two', ['MU-ALL-2']);
      const none = await platform.aPart('Made-up Numberless GPU', []);
      // A pair whose numbers are the same, of which the Vendor offers one,
      // and a third Part, which the Vendor offers too, holding the pair's
      // first number: only the pair's second number, which no other Part the
      // Vendor offers holds, tells the Vendor's Offer apart.
      const pairOffered = await platform.aPart('Made-up Pair GPU Offered', [
        'MU-PAIR-1',
        'MU-PAIR-2',
      ]);
      await platform.aPart('Made-up Pair GPU Not Offered', ['mu-pair-1', 'MU-PAIR-2']);
      const alsoHolding = await platform.aPart('Made-up Also Holding GPU', [
        'MU-PAIR-1',
        'MU-ALSO-1',
      ]);
      moveTheClockTo(aDayBefore);
      await platform.anOffer(vendor.id, own.id, {
        usdPrice: '349.99',
        iqdPrice: 1875000,
        inStock: true,
        warrantyMonths: 24,
      });
      await platform.anOffer(vendor.id, shared.id, {
        iqdPrice: 950000,
        usdPrice: null,
        inStock: false,
      });
      await platform.anOffer(vendor.id, allShared.id, {
        usdPrice: '350.00',
        warrantyMonths: 6,
      });
      await platform.anOffer(vendor.id, none.id, { usdPrice: '99.50' });
      await platform.anOffer(vendor.id, pairOffered.id, { usdPrice: '459.00' });
      await platform.anOffer(vendor.id, alsoHolding.id, { usdPrice: '479.00' });
      const file = await platform.downloaded(vendor.id, 'ckb');
      const offersBefore = (await platform.theVendorsOffers(vendor.id)).offers;
      moveTheClockTo(theUpload);

      const result = await platform.uploaded(vendor.id, file);

      const rowNamed = await rowsNamedIn(file);
      expect(result).toEqual({
        rows: 6,
        added: [],
        changed: 0,
        confirmed: 5,
        matchedByYourOffer: [
          { row: rowNamed(allShared.name), part: allShared },
          { row: rowNamed(pairOffered.name), part: pairOffered },
        ],
        skipped: [
          {
            row: rowNamed(none.name),
            partNumber: '',
            problem: 'notValid',
            field: 'partNumber',
            reason: 'missing',
          },
        ],
      });
      const offersAfter = (await platform.theVendorsOffers(vendor.id)).offers;
      for (const offer of offersAfter) {
        const before = offersBefore.find(({ id }) => id === offer.id);
        expect(offer).toMatchObject({
          usdPrice: before?.usdPrice,
          iqdPrice: before?.iqdPrice,
          inStock: before?.inStock,
          warrantyMonths: before?.warrantyMonths,
          confirmedAt: (offer.part.id === none.id ? aDayBefore : theUpload).toISOString(),
        });
      }
    });

    it('skips as several Parts the rows of two Offers whose Parts hold exactly the same part numbers, which no number tells apart, changing neither, and applies every other row', async () => {
      const vendor = await platform.aVendor();
      // Two colour editions of one GPU, holding the same numbers, the Vendor
      // offering both.
      const black = await platform.aPart('Made-up Twin GPU Black', [
        'MU-TWIN-1',
        'MU-TWIN-2',
      ]);
      const white = await platform.aPart('Made-up Twin GPU White', [
        'mu-twin-1',
        'MU-TWIN-2',
      ]);
      const own = await platform.aPart('Made-up Own GPU', ['MU-OWN-1']);
      moveTheClockTo(aDayBefore);
      await platform.anOffer(vendor.id, black.id, { usdPrice: '499.00' });
      await platform.anOffer(vendor.id, white.id, { usdPrice: '519.00' });
      await platform.anOffer(vendor.id, own.id, { usdPrice: '349.99' });
      const file = await platform.downloaded(vendor.id, 'en');
      const offersBefore = (await platform.theVendorsOffers(vendor.id)).offers;
      moveTheClockTo(theUpload);

      const result = await platform.uploaded(vendor.id, file);

      const rowNamed = await rowsNamedIn(file);
      expect(result).toEqual({
        rows: 3,
        added: [],
        changed: 0,
        confirmed: 1,
        matchedByYourOffer: [],
        skipped: [
          {
            row: rowNamed(black.name),
            partNumber: 'MU-TWIN-1',
            problem: 'severalParts',
            parts: [black, white],
            partCount: 2,
          },
          {
            row: rowNamed(white.name),
            partNumber: 'mu-twin-1',
            problem: 'severalParts',
            parts: [black, white],
            partCount: 2,
          },
        ],
      });
      const offersAfter = (await platform.theVendorsOffers(vendor.id)).offers;
      for (const offer of offersAfter) {
        const before = offersBefore.find(({ id }) => id === offer.id);
        expect(offer).toMatchObject({
          usdPrice: before?.usdPrice,
          confirmedAt: (offer.part.id === own.id ? theUpload : aDayBefore).toISOString(),
        });
      }
    });
  });

  describe('from a row to an Offer', () => {
    it('takes a row that matched no Part as a Part Request with a Category, says it is open on the next upload, and applies the row once the Admin has fulfilled it', async () => {
      const vendor = await platform.aVendor();
      const file = await anOfferSheet([
        ['11348-03-20G', 'Made-up Pulse Radeon RX 9070 XT 16GB', 649.99, 950000, yes, 24],
      ]);
      const [skipped] = (await platform.uploaded(vendor.id, file)).skipped;
      const { row, problem, partRequestOpen, ...details } = skipped;
      expect([row, problem, partRequestOpen]).toEqual([2, 'noPart', false]);

      const sent = await platform.sendAPartRequest(
        vendor.id,
        { ...details, category: 'gpu' },
        await platform.tokenOfTheOwnLogin(vendor),
      );
      expect(sent.status).toBe(201);
      const partRequest = (await sent.json()) as { id: string };
      expect((await platform.uploaded(vendor.id, file)).skipped).toMatchObject([
        { row: 2, problem: 'noPart', partRequestOpen: true },
      ]);

      const part = await platform.aPart('Made-up Pulse Radeon RX 9070 XT 16GB', [
        '11348-03-20G',
      ]);
      await platform.resolve(partRequest.id, { partId: part.id });
      moveTheClockTo(theUpload);
      const result = await platform.uploaded(vendor.id, file);

      expect([result.skipped, result.added, result.confirmed]).toEqual([[], [], 1]);
      expect(await platform.theOfferOf(vendor.id, part.id)).toMatchObject({
        usdPrice: '649.99',
        iqdPrice: 950000,
        inStock: true,
        warrantyMonths: 24,
        confirmedAt: theUpload.toISOString(),
      });
    });
  });
});
