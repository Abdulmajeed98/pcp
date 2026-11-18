import { describe, expect, it } from '@jest/globals';
import type {
  OfferSheetResultResponse,
  PartSummaryResponse,
  SkippedRowResponse,
  VendorsOffersPageResponse,
} from '@pcp/api-client';

import { answerFromTheMadeUpShop, madeUpShop, type MadeUpShop } from '../made-up-shop.ts';
import { madeUpIdentifier } from '../made-up-vendors.ts';
import { partsHoldingOc } from '../parts-holding-oc.ts';
import { aShopFromTheCatalog, catalogPartsOfTheShop, now } from './catalog-stand-in.ts';

const shop = aShopFromTheCatalog();
const vendorId = shop.vendor.id;

// The upload of an Offer sheet, as the Vendor portal's file field sends it,
// and the shop's answer.
function uploadTo(vendor: string, to: MadeUpShop = shop) {
  return answerFromTheMadeUpShop(to, now, {
    method: 'POST',
    path: `/v1/vendors/${vendor}/offer-sheet`,
  });
}

function theResultOf(to: MadeUpShop = shop): OfferSheetResultResponse {
  const answer = uploadTo(to.vendor.id, to);
  expect(answer?.status).toBe(200);
  return answer?.body as OfferSheetResultResponse;
}

function skippedRow(result: OfferSheetResultResponse, row: number): SkippedRowResponse {
  const found = result.skipped.find((each) => each.row === row);
  if (found === undefined) throw new Error(`No skipped row ${row}.`);
  return found;
}

// The Part of one of the shop's own Offers, by its name.
function theShopsPart(name: string): PartSummaryResponse {
  const offer = shop.offers.find((each) => each.part.name === name);
  if (offer === undefined) throw new Error(`The shop offers no ${name}.`);
  return offer.part;
}

const codePoints = (text: string) => [...text].length;

// The Vendor portal's Offer sheet screen: the upload's result (the sheet
// spec's The inspector).
describe("the made-up shop's answer to an upload of its Offer sheet", () => {
  it('is the upload’s result, as the API answers it', () => {
    const answer = uploadTo(vendorId);

    expect(answer?.status).toBe(200);
    const result = answer?.body as OfferSheetResultResponse;
    expect(result).toMatchObject({ rows: 22, changed: 7, confirmed: 4 });
  });

  it('adds Offers of real Parts the shop does not offer yet, each with its row', () => {
    const { added } = theResultOf();

    expect(added.map((each) => [each.row, each.part.name])).toEqual([
      [15, 'AMD Ryzen 7 9800X3D'],
      [16, 'Kingston FURY Beast 16GB (2x8GB) DDR4 3200 CL16 Black'],
      [17, 'SeaSonic FOCUS GX-750 Black ATX 3.0 750W Fully Modular 80+ Gold Certified'],
    ]);
    const catalog = catalogPartsOfTheShop();
    for (const each of added) {
      expect(each.part).toEqual(catalog.get(each.part.name));
      expect(shop.offers.map((offer) => offer.part.id)).not.toContain(each.part.id);
      expect(shop.offers.map((offer) => offer.id)).not.toContain(each.offerId);
    }
    expect(added.map((each) => each.offerId)).toEqual([
      madeUpIdentifier(301),
      madeUpIdentifier(302),
      madeUpIdentifier(303),
    ]);
  });

  it('applies a row by the tie-break to the Offer the Vendor has', () => {
    const { matchedByYourOffer } = theResultOf();

    expect(matchedByYourOffer).toEqual([
      {
        row: 10,
        part: theShopsPart('Asus TUF GAMING OC Radeon RX 7800 XT 16GB GDDR6 Black'),
      },
    ]);
  });

  it('skips one row of each problem at least, ordered by row number', () => {
    const { skipped } = theResultOf();

    expect(skipped.map((each) => [each.row, each.problem])).toEqual([
      [8, 'notValid'],
      [14, 'samePart'],
      [18, 'noPart'],
      [19, 'noPart'],
      [20, 'severalParts'],
      [21, 'samePart'],
      [22, 'notValid'],
      [23, 'notValid'],
    ]);
  });

  it('counts every row it read once: added, changed, confirmed or skipped', () => {
    const result = theResultOf();

    expect(
      result.added.length + result.changed + result.confirmed + result.skipped.length,
    ).toBe(result.rows);
  });

  it('carries a row that matched no Part with its details, saying whether the Vendor already asked for it', () => {
    const result = theResultOf();

    expect(skippedRow(result, 18)).toEqual({
      row: 18,
      partNumber: 'PSL-120-ARGB-3P',
      problem: 'noPart',
      name: 'Pretend Shadowline 120 ARGB Fan 3-Pack',
      usdPrice: '24.00',
      iqdPrice: 38000,
      inStock: true,
      warrantyMonths: 12,
      partRequestOpen: false,
    });
    // The cooler of the shop's own open Part Request, sent three days ago.
    expect(skippedRow(result, 19)).toEqual({
      row: 19,
      partNumber: 'PFL-240-ARGB-BK',
      problem: 'noPart',
      name: 'Pretend Frostline 240 ARGB Liquid Cooler',
      usdPrice: null,
      iqdPrice: 95000,
      inStock: true,
      warrantyMonths: 24,
      partRequestOpen: true,
    });
  });

  it('says a row was asked for only while the shop’s Vendor has that open Part Request', () => {
    const withNone = madeUpShop(now, catalogPartsOfTheShop(), { partRequests: 'none' });

    expect(skippedRow(theResultOf(withNone), 19)).toMatchObject({
      partRequestOpen: false,
    });
  });

  it('names every Part that holds a code several Parts hold', () => {
    const catalog = catalogPartsOfTheShop();

    expect(skippedRow(theResultOf(), 20)).toEqual({
      row: 20,
      partNumber: 'BX8071512400',
      problem: 'severalParts',
      parts: [catalog.get('Intel Core i5 12400'), catalog.get('Intel Core i5 12400F')],
    });
  });

  it('names each row of the same Part twice to the other', () => {
    const result = theResultOf();
    const psu = theShopsPart(
      'Corsair RM850e (2022) Black 850W Fully Modular 80+ Gold Certified',
    );

    expect(skippedRow(result, 14)).toEqual({
      row: 14,
      partNumber: 'CP-9020249-EU',
      problem: 'samePart',
      part: psu,
      rows: [21],
      otherRows: 1,
    });
    expect(skippedRow(result, 21)).toEqual({
      row: 21,
      partNumber: 'CP-9020249-UK',
      problem: 'samePart',
      part: psu,
      rows: [14],
      otherRows: 1,
    });
  });

  it('says which column of a row that is not valid does not fit, and why', () => {
    const result = theResultOf();

    expect(skippedRow(result, 8)).toEqual({
      row: 8,
      partNumber: 'MZ-V9P2T0B/AM',
      problem: 'notValid',
      field: 'inStock',
      reason: 'notYesOrNo',
    });
    expect(skippedRow(result, 22)).toEqual({
      row: 22,
      partNumber: 'BX8071514600K',
      problem: 'notValid',
      field: 'iqdPrice',
      reason: 'notANumber',
    });
    expect(skippedRow(result, 23)).toEqual({
      row: 23,
      partNumber: '',
      problem: 'notValid',
      field: 'partNumber',
      reason: 'missing',
    });
  });

  it('writes nothing: the Vendor’s Offers are as they were', () => {
    const theOffers = () =>
      answerFromTheMadeUpShop(shop, now, {
        method: 'GET',
        path: `/v1/vendors/${vendorId}/offers?page=0&size=100`,
      })?.body as VendorsOffersPageResponse;
    const before = theOffers();

    uploadTo(vendorId);

    expect(theOffers()).toEqual(before);
    expect(before.content.map((offer) => offer.part.name)).not.toContain(
      'AMD Ryzen 7 9800X3D',
    );
  });

  it('is the shop’s Vendor’s alone: another Vendor’s upload is refused as every write is', () => {
    const answer = uploadTo(madeUpIdentifier(2));

    expect(answer?.status).toBe(405);
    expect(answer?.body).toMatchObject({
      errors: [expect.objectContaining({ code: 'MADE_UP_SHOP_IS_READ_ONLY' })],
    });
    expect(
      answerFromTheMadeUpShop(shop, now, {
        method: 'POST',
        path: `/v1/vendors/${vendorId}/offers`,
      })?.status,
    ).toBe(405);
  });
});

// `pnpm dashboard:inspect --offer-sheet-result clean`.
describe('the result with every row applied', () => {
  it('skips no row, and adds and applies the same rows by the tie-break', () => {
    const cleanShop = madeUpShop(now, catalogPartsOfTheShop(), {
      offerSheetResult: 'clean',
    });
    const result = theResultOf(cleanShop);

    expect(result).toMatchObject({ rows: 16, changed: 9, confirmed: 4, skipped: [] });
    expect(result.added.map((each) => each.row)).toEqual([15, 16, 17]);
    expect(result.matchedByYourOffer.map((each) => each.row)).toEqual([10]);
    expect(result.added.length + result.changed + result.confirmed).toBe(result.rows);
  });
});

// The 81 GPUs that hold "OC", as the catalog would give them: two of them
// share one name.
function theGpusHoldingOc(): PartSummaryResponse[] {
  return [...partsHoldingOc, partsHoldingOc[64]].map((wanted, index) => ({
    id: `oc-gpu-${String(index).padStart(2, '0')}`,
    category: 'gpu',
    name: wanted.name,
    manufacturer: 'From the catalog',
    partNumbers: ['OC', `GPU-${index}`],
    photoPath: null,
  }));
}

// `pnpm dashboard:inspect --offer-sheet-result worstCase`, for `break-ui`.
describe('the result at its worst', () => {
  const holders = theGpusHoldingOc();
  const worstShop = madeUpShop(now, catalogPartsOfTheShop(), {
    offerSheetResult: 'worstCase',
    partsHoldingOc: holders,
  });
  const worst = theResultOf(worstShop);
  const madeUp = theResultOf();
  const added = worst.skipped.filter((each) => each.row > 24);

  it('keeps the made-up result', () => {
    for (const row of madeUp.skipped) expect(worst.skipped).toContainEqual(row);
    for (const offer of madeUp.added) expect(worst.added).toContainEqual(offer);
    expect(worst.matchedByYourOffer).toEqual(madeUp.matchedByYourOffer);
    expect(worst).toMatchObject({ changed: 7, confirmed: 4 });
  });

  it('adds 4,800 skipped rows of every problem, numbered into the thousands, in row order', () => {
    expect(added).toHaveLength(4800);
    expect(new Set(added.map((each) => each.problem))).toEqual(
      new Set(['noPart', 'severalParts', 'samePart', 'notValid']),
    );
    expect(Math.max(...added.map((each) => each.row))).toBeGreaterThan(4000);
    const rows = worst.skipped.map((each) => each.row);
    expect(rows).toEqual([...rows].sort((a, b) => a - b));
    expect(new Set(rows).size).toBe(rows.length);
  });

  it('reads no more rows than a file may hold, and counts each once', () => {
    expect(worst.rows).toBeLessThanOrEqual(5000);
    expect(
      worst.added.length + worst.changed + worst.confirmed + worst.skipped.length,
    ).toBe(worst.rows);
  });

  it('adds the catalog’s longest Part name among the added Offers', () => {
    const longest = worst.added.find((each) => each.part.name.length === 276);

    expect(longest?.part).toEqual(
      catalogPartsOfTheShop().get(
        'Corsair Hydro Series H100i RGB PLATINUM Extreme Performance Liquid CPU Cooler, Mounting kit for most modern CPU sockets, Two ML PRO RGB Series PWM 140mm fans, Fan and radiator mounting screws, USB 2.0 motherboard header cable, Thermal compound (pre-applied), Quick Start Guide',
      ),
    );
  });

  it('carries part numbers of 100 code points, with spaces and with none', () => {
    const partNumbers = added.map((each) => each.partNumber);

    expect(partNumbers.every((each) => codePoints(each) <= 100)).toBe(true);
    const longest = partNumbers.filter((each) => codePoints(each) === 100);
    expect(longest.some((each) => /\s/.test(each))).toBe(true);
    expect(longest.some((each) => !/\s/.test(each))).toBe(true);
  });

  it('names 81 Parts for a row whose part number is "OC", in the catalog’s order', () => {
    const oc = added.filter((each) => each.partNumber === 'OC');

    expect(oc.length).toBeGreaterThan(0);
    for (const row of oc) {
      expect(row.problem).toBe('severalParts');
      expect(row.parts).toEqual(holders);
      expect(row.parts).toHaveLength(81);
    }
  });

  it('carries names in Kurdish and Arabic script, the longest the API carries, and none', () => {
    const names = added
      .filter((each) => each.problem === 'noPart')
      .map((each) => each.name ?? null);

    expect(names.some((name) => name !== null && /[ڕێۆەڵ]/.test(name))).toBe(true);
    expect(names.some((name) => name?.includes('مزود طاقة') === true)).toBe(true);
    expect(names.some((name) => name !== null && codePoints(name) === 300)).toBe(true);
    expect(names.every((name) => name === null || codePoints(name) <= 300)).toBe(true);
    expect(names).toContain(null);
  });

  it('says some of its rows that matched no Part were already asked for', () => {
    const asked = added.filter((each) => each.partRequestOpen === true);

    expect(asked.length).toBeGreaterThan(0);
    expect(new Set(asked.map((each) => each.partNumber.toLowerCase()))).toEqual(
      new Set(['ppc-750g-fm']),
    );
  });

  it('names at most ten other rows of the same Part, by row number, and counts every one', () => {
    const many = added.filter(
      (each) => each.problem === 'samePart' && each.part?.name === 'Intel Core i5 14600K',
    );

    expect(many.length).toBeGreaterThan(100);
    for (const row of many) {
      const others = many.map((each) => each.row).filter((each) => each !== row.row);
      expect(row.rows).toEqual(others.slice(0, 10));
      expect(row.otherRows).toBe(many.length - 1);
    }
    expect(skippedRow(worst, 14)).toMatchObject({ rows: [21], otherRows: 1 });
  });

  it('says every reason a row may not be valid, in each column', () => {
    const said = new Set(
      added
        .filter((each) => each.problem === 'notValid')
        .map((each) => `${each.field} ${each.reason}`),
    );

    expect(said).toEqual(
      new Set([
        'partNumber missing',
        'partNumber tooLong',
        'partNumber notReadable',
        'usdPrice missing',
        'usdPrice notANumber',
        'usdPrice notPositive',
        'usdPrice tooManyDecimals',
        'usdPrice tooLarge',
        'usdPrice notReadable',
        'iqdPrice notANumber',
        'iqdPrice notPositive',
        'iqdPrice tooManyDecimals',
        'iqdPrice tooLarge',
        'iqdPrice notReadable',
        'inStock missing',
        'inStock notYesOrNo',
        'inStock notReadable',
        'warrantyMonths notANumber',
        'warrantyMonths notPositive',
        'warrantyMonths notWholeMonths',
        'warrantyMonths tooLarge',
        'warrantyMonths notReadable',
      ]),
    );
  });

  it('stays a few megabytes, as the API’s bounded result does', () => {
    expect(JSON.stringify(worst).length).toBeLessThan(5_000_000);
  });

  it('cannot be made without the Parts that hold "OC"', () => {
    expect(() =>
      madeUpShop(now, catalogPartsOfTheShop(), { offerSheetResult: 'worstCase' }),
    ).toThrow('The worst result names the Parts that hold "OC".');
  });
});
