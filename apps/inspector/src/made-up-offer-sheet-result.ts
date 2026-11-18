import type {
  AddedOfferResponse,
  OfferSheetResultResponse,
  PartSummaryResponse,
  SkippedRowResponse,
} from '@pcp/api-client';

import {
  type CatalogPart,
  core14600K,
  focusGx750,
  furyBeast16,
  rm850e,
  ryzen9800X3D,
  theLongestName,
  tuf7800XT,
} from './made-up-offers.ts';
import { madeUpIdentifier } from './made-up-vendors.ts';
import { theSharedPartNumber } from './parts-holding-oc.ts';

// The made-up results of an upload of the shop's Vendor's Offer sheet, which
// the Vendor portal's Offer sheet screen is designed and inspected with (the
// sheet spec's The inspector). The made-up shop answers an upload,
// `POST v1/vendors/{vendorId}/offer-sheet`, with one of them, whatever file
// is chosen, and writes nothing, as it writes nothing for every other call.
//
// The made-up result tells one upload's story. The Vendor downloaded its
// Offer sheet, its 13 Offers in rows 2 to 14 in the download's order
// (Category, then the Part's name), changed prices in seven of them, wrote
// the code on the box of its GPU, which another Part of the catalog holds
// too, and typed nine rows below them: three Parts it now sells, two the
// catalog lacks, one of them already asked for, a code two CPUs share, a
// second row for its PSU, a price in words and a row without a part number.
// It also typed a word for "in stock" the platform does not read on its
// Samsung drive's row. So the result holds added Offers of real Parts, a
// row applied by the tie-break and one skipped row of each problem.
//
// Every Part a result names is a real Part of the catalog (ADR-0001), read
// by its Category and exact name when the command starts, and everything is
// typed by the API client's types, so a change to the API's answer fails
// the type-check. Three of the API's rules are stated here, each beside the
// API's, which is the rule that counts: the rows a row of the same Part
// twice names, the Parts a row of several Parts names, and whether a row
// that matched no Part was already asked for.

// The results shown: the made-up one; one with every row applied; and the
// made-up one at its worst, for `break-ui`.
export type OfferSheetResultShown = 'madeUp' | 'clean' | 'worstCase';

// Two CPUs of the catalog that share the code on their box, BX8071512400.
const core12400: CatalogPart = { category: 'cpu', name: 'Intel Core i5 12400' };
const core12400F: CatalogPart = { category: 'cpu', name: 'Intel Core i5 12400F' };

// The Parts of the catalog the results name, which the command reads from
// the catalog beside those the shop offers. Those holding "OC", which only
// the worst case names, are read apart (`parts-holding-oc.ts`).
export const partsTheOfferSheetResultsName: readonly CatalogPart[] = [
  ryzen9800X3D,
  furyBeast16,
  focusGx750,
  core12400,
  core12400F,
  core14600K,
  theLongestName,
];

// The most other rows a row of the same Part twice names, as the API names
// them (`mostOtherRowsNamed`).
export const mostOtherRowsNamed = 10;

// The most Parts a row of several Parts names, the first in the catalog's
// order, as the API names them (`mostPartsNamed`); the catalog search with
// the row's part number shows them all.
export const mostPartsNamed = 10;

// The longest name a row that matched no Part carries and the longest part
// number a row carries, in code points, as the API cuts them: the longest a
// Part Request takes.
export const longestNameCarried = 300;
export const longestPartNumberCarried = 100;

// A text cut to its first `most` code points, never inside a character, as
// the API cuts what a result carries from a cell.
function cutTo(most: number, text: string): string {
  return [...text].slice(0, most).join('');
}

// A skipped row as it is written here: its Parts named as the shop names
// them. The rows a row of the same Part names are counted when the result
// is made (`theRowsOfEachPart`).
type MadeUpSkippedRow =
  | {
      row: number;
      partNumber: string;
      problem: 'noPart';
      name: string | null;
      usdPrice: string | null;
      iqdPrice: number | null;
      inStock: boolean;
      warrantyMonths: number | null;
    }
  | {
      row: number;
      partNumber: string;
      problem: 'severalParts';
      parts: 'oc' | CatalogPart[];
    }
  | { row: number; partNumber: string; problem: 'samePart'; part: CatalogPart }
  | {
      row: number;
      partNumber: string;
      problem: 'notValid';
      field: NonNullable<SkippedRowResponse['field']>;
      reason: NonNullable<SkippedRowResponse['reason']>;
    };

interface MadeUpResult {
  rows: number;
  added: readonly { row: number; part: CatalogPart; offer: number }[];
  changed: number;
  confirmed: number;
  matchedByYourOffer: readonly { row: number; part: CatalogPart }[];
  skipped: readonly MadeUpSkippedRow[];
}

// The rows the Vendor typed below its own: three Parts it now sells, each
// added with an Offer of an identifier the shop does not hold, since it
// writes nothing.
const addedRows = [
  { row: 15, part: ryzen9800X3D, offer: 301 },
  { row: 16, part: furyBeast16, offer: 302 },
  { row: 17, part: focusGx750, offer: 303 },
];

// Its GPU's row, with the code on the box, which the Asus TUF's white
// edition holds too: applied to the Offer the Vendor has, and counted
// changed, since its price changed.
const theTieBreaksRow = { row: 10, part: tuf7800XT };

const madeUp: MadeUpResult = {
  rows: 22,
  added: addedRows,
  changed: 7,
  confirmed: 4,
  matchedByYourOffer: [theTieBreaksRow],
  skipped: [
    {
      // The Samsung drive's row, its stock typed as a word the platform
      // does not read: its Offer is left as it was.
      row: 8,
      partNumber: 'MZ-V9P2T0B/AM',
      problem: 'notValid',
      field: 'inStock',
      reason: 'notYesOrNo',
    },
    // The PSU's own row and a second row the Vendor typed for it with the
    // code of its UK edition: both skipped, each naming the other.
    { row: 14, partNumber: 'CP-9020249-EU', problem: 'samePart', part: rm850e },
    {
      row: 18,
      partNumber: 'PSL-120-ARGB-3P',
      problem: 'noPart',
      name: 'Pretend Shadowline 120 ARGB Fan 3-Pack',
      usdPrice: '24.00',
      iqdPrice: 38000,
      inStock: true,
      warrantyMonths: 12,
    },
    {
      // The cooler the shop's Vendor already asked for, three days ago
      // (`made-up-part-requests.ts`).
      row: 19,
      partNumber: 'PFL-240-ARGB-BK',
      problem: 'noPart',
      name: 'Pretend Frostline 240 ARGB Liquid Cooler',
      usdPrice: null,
      iqdPrice: 95000,
      inStock: true,
      warrantyMonths: 24,
    },
    {
      row: 20,
      partNumber: 'BX8071512400',
      problem: 'severalParts',
      parts: [core12400, core12400F],
    },
    { row: 21, partNumber: 'CP-9020249-UK', problem: 'samePart', part: rm850e },
    {
      row: 22,
      partNumber: 'BX8071514600K',
      problem: 'notValid',
      field: 'iqdPrice',
      reason: 'notANumber',
    },
    {
      row: 23,
      partNumber: '',
      problem: 'notValid',
      field: 'partNumber',
      reason: 'missing',
    },
  ],
};

// The same download uploaded with its changes and its three new Parts alone:
// every row applied.
const clean: MadeUpResult = {
  rows: 16,
  added: addedRows,
  changed: 9,
  confirmed: 4,
  matchedByYourOffer: [theTieBreaksRow],
  skipped: [],
};

// The rows the worst case adds after the made-up result's, as a Vendor that
// uploaded the wrong file would see them: the catalog's longest Part name
// among the added, then 4,800 skipped rows of every problem, numbered into
// the thousands.
export const skippedRowsAtTheWorst = 4800;
const theWorstsAddedRow = { row: 24, part: theLongestName, offer: 304 };
const theWorstsFirstSkippedRow = 25;

// Texts a Vendor's file may hold, each longer than the API carries, so that
// each is cut as the API cuts it.
const aLongName =
  'Pretend Hyperion X870E Extreme Gaming WiFi 7 AM5 DDR5 E-ATX Motherboard with five M.2 slots, PCIe 5.0 x16, 10 Gb LAN, USB4 40 Gbps, 24+2+1 power stages, Wi-Fi 7 and Bluetooth 5.4, dual BIOS, debug LEDs, three ARGB headers, front USB-C 60 W, with antenna, M.2 heatsinks, SATA cables, quick start guide and a made-up warranty card that goes on and on';
const aLongKurdishName =
  'پانکەی خەیاڵیی ١٢٠ ملم بە ڕووناکیی ARGB و سێ دانە لە یەک قوتوودا، بۆ کەیسی گەورە و مامناوەند، بە کۆنترۆڵەر و کێبڵی درێژ و پێچ و ڕێنمایی دامەزراندن، ڕەنگی ڕەش، بێدەنگ لە کاتی کارکردندا، گونجاو بۆ ساردکەرەوەی شل و هەوایی، لەگەڵ گەرەنتیی خەیاڵیی سێ ساڵە و کارتی تۆمارکردن و دیاریی بچووک';
const aCodeWithNoSpace =
  'PRETEND-HYPERION-X870E-EXTREME-WIFI7-AM5-DDR5-EATX-REV1.2-RETAIL-BOX-EU-90MB1JR0-M0EAY0-MADE-UP-NOT-A-REAL-CODE-0001';
const aCodeWithSpaces =
  'MADE UP PART NUMBER WITH SPACES BETWEEN ITS WORDS FROM A FILE THAT IS NOT AN OFFER SHEET AT ALL, ROW AFTER ROW';

// The names a row that matched no Part carries, in turn: as a Vendor writes
// them in English, Kurdish or Arabic script, one that starts with a digit,
// the longest the API carries in English and in Kurdish, and none.
const namesInTurn: readonly (string | null)[] = [
  'Pretend Shadowline 140 PWM Fan',
  'کارتی گرافیکی خەیاڵی RTX 5070 بە ١٢ گێگابایت بیرگە',
  'مزود طاقة تجريبي 650 واط بشهادة برونزية',
  cutTo(longestNameCarried, aLongName),
  null,
  '2TB Pretend NV3 M.2 2280 PCIe 4.0 NVMe SSD',
  cutTo(longestNameCarried, aLongKurdishName),
];

// Prices, stock and warranties in turn, at the API's limits among them.
const detailsInTurn: readonly Pick<
  Extract<MadeUpSkippedRow, { problem: 'noPart' }>,
  'usdPrice' | 'iqdPrice' | 'inStock' | 'warrantyMonths'
>[] = [
  { usdPrice: '24.00', iqdPrice: 38000, inStock: true, warrantyMonths: 12 },
  { usdPrice: null, iqdPrice: 95000, inStock: false, warrantyMonths: null },
  { usdPrice: '100000.00', iqdPrice: 150000000, inStock: true, warrantyMonths: 120 },
  { usdPrice: '0.01', iqdPrice: null, inStock: true, warrantyMonths: 6 },
];

// A row that is not valid, in each way the API can say it, in turn: its
// column and why, and its part number as cleaned, or as written when its
// own cell was the problem.
const notValidInTurn: readonly Pick<
  Extract<MadeUpSkippedRow, { problem: 'notValid' }>,
  'field' | 'reason'
>[] = [
  { field: 'partNumber', reason: 'missing' },
  { field: 'partNumber', reason: 'tooLong' },
  { field: 'partNumber', reason: 'notReadable' },
  { field: 'usdPrice', reason: 'missing' },
  { field: 'usdPrice', reason: 'notANumber' },
  { field: 'usdPrice', reason: 'notPositive' },
  { field: 'usdPrice', reason: 'tooManyDecimals' },
  { field: 'usdPrice', reason: 'tooLarge' },
  { field: 'usdPrice', reason: 'notReadable' },
  { field: 'iqdPrice', reason: 'notANumber' },
  { field: 'iqdPrice', reason: 'notPositive' },
  { field: 'iqdPrice', reason: 'tooManyDecimals' },
  { field: 'iqdPrice', reason: 'tooLarge' },
  { field: 'iqdPrice', reason: 'notReadable' },
  { field: 'inStock', reason: 'missing' },
  { field: 'inStock', reason: 'notYesOrNo' },
  { field: 'inStock', reason: 'notReadable' },
  { field: 'warrantyMonths', reason: 'notANumber' },
  { field: 'warrantyMonths', reason: 'notPositive' },
  { field: 'warrantyMonths', reason: 'notWholeMonths' },
  { field: 'warrantyMonths', reason: 'tooLarge' },
  { field: 'warrantyMonths', reason: 'notReadable' },
];

function partNumberWhenNotValid(field: string, reason: string, index: number): string {
  if (field !== 'partNumber') return `ITEM-${String(index).padStart(5, '0')}`;
  if (reason === 'missing') return '';
  if (reason === 'notReadable') return '#REF!';
  return cutTo(longestPartNumberCarried, aCodeWithNoSpace);
}

// One of the 4,800 skipped rows the worst case adds, by its place among
// them: every sixteenth names the 14600K, which 300 rows name; every
// four-hundredth from the eighth gives "OC", which 81 Parts hold; two in
// sixteen give the code two CPUs share; one in eight is not valid, in each
// way in turn; and the rest matched no Part, a few of them already asked
// for, their part numbers 100 code points long, with and without spaces,
// among them.
function aWorstRow(index: number, theCodeOf14600K: string): MadeUpSkippedRow {
  const row = theWorstsFirstSkippedRow + index;
  if (index % 16 === 15) {
    return { row, partNumber: theCodeOf14600K, problem: 'samePart', part: core14600K };
  }
  if (index % 400 === 7) {
    return { row, partNumber: theSharedPartNumber, problem: 'severalParts', parts: 'oc' };
  }
  if (index % 16 === 3 || index % 16 === 11) {
    return {
      row,
      partNumber: 'BX8071512400',
      problem: 'severalParts',
      parts: [core12400, core12400F],
    };
  }
  if (index % 8 === 5) {
    const { field, reason } = notValidInTurn[Math.floor(index / 8) % notValidInTurn.length];
    return {
      row,
      partNumber: partNumberWhenNotValid(field, reason, index),
      problem: 'notValid',
      field,
      reason,
    };
  }
  const partNumber =
    index % 97 === 0
      ? // A part number the made-up shop's Vendor has already asked for.
        'PPC-750G-FM'
      : index % 5 === 1
        ? cutTo(longestPartNumberCarried, aCodeWithNoSpace)
        : index % 5 === 3
          ? cutTo(longestPartNumberCarried, aCodeWithSpaces)
          : `PSL-${String(index).padStart(4, '0')}`;
  return {
    row,
    partNumber,
    problem: 'noPart',
    name: namesInTurn[index % namesInTurn.length],
    ...detailsInTurn[index % detailsInTurn.length],
  };
}

function worstCase(theCodeOf14600K: string): MadeUpResult {
  return {
    ...madeUp,
    rows: madeUp.rows + 1 + skippedRowsAtTheWorst,
    added: [...madeUp.added, theWorstsAddedRow],
    skipped: [
      ...madeUp.skipped,
      ...Array.from({ length: skippedRowsAtTheWorst }, (_, index) =>
        aWorstRow(index, theCodeOf14600K),
      ),
    ],
  };
}

// The rows that named each Part, for every row of the same Part twice: by
// the Part's name, in row order.
function theRowsOfEachPart(skipped: readonly MadeUpSkippedRow[]): Map<string, number[]> {
  const rowsOf = new Map<string, number[]>();
  for (const each of skipped) {
    if (each.problem !== 'samePart') continue;
    rowsOf.set(each.part.name, [...(rowsOf.get(each.part.name) ?? []), each.row]);
  }
  for (const rows of rowsOf.values()) rows.sort((a, b) => a - b);
  return rowsOf;
}

// What the made-up results need of the shop: its Vendor's open Part
// Requests' part numbers, folded as the API folds them, and the Parts that
// hold "OC" in the catalog's order, which only the worst case names.
export interface WhatTheResultNeeds {
  openPartNumbers: ReadonlySet<string>;
  partsHoldingOc: readonly PartSummaryResponse[];
}

// A result as the API answers it, with the Parts the catalog gave for the
// names. A row of the same Part twice names the first ten other rows of its
// Part and counts all of them, a row of several Parts names the first ten
// Parts and counts all of them, and a row that matched no Part says whether
// the Vendor has an open Part Request of its part number, whatever the
// case of its letters, as the API answers them.
export function theOfferSheetResult(
  shown: OfferSheetResultShown,
  catalogParts: ReadonlyMap<string, PartSummaryResponse>,
  { openPartNumbers, partsHoldingOc }: WhatTheResultNeeds,
): OfferSheetResultResponse {
  const partOf = (wanted: CatalogPart): PartSummaryResponse => {
    const part = catalogParts.get(wanted.name);
    if (part === undefined) {
      throw new Error(`The catalog gave no Part named "${wanted.name}".`);
    }
    return part;
  };
  let made: MadeUpResult;
  if (shown === 'worstCase') {
    const [theCodeOf14600K] = partOf(core14600K).partNumbers;
    if (theCodeOf14600K === undefined) {
      throw new Error(`The catalog gave "${core14600K.name}" no part number.`);
    }
    if (partsHoldingOc.length === 0) {
      throw new Error(
        `The worst result names the Parts that hold "${theSharedPartNumber}".`,
      );
    }
    made = worstCase(theCodeOf14600K);
  } else {
    made = shown === 'clean' ? clean : madeUp;
  }

  const rowsOf = theRowsOfEachPart(made.skipped);
  const skipped = made.skipped.map((each): SkippedRowResponse => {
    const { row, partNumber } = each;
    switch (each.problem) {
      case 'noPart': {
        const { name, usdPrice, iqdPrice, inStock, warrantyMonths } = each;
        return {
          row,
          partNumber,
          problem: 'noPart',
          name,
          usdPrice,
          iqdPrice,
          inStock,
          warrantyMonths,
          partRequestOpen: openPartNumbers.has(partNumber.toLowerCase()),
        };
      }
      case 'severalParts': {
        const parts = each.parts === 'oc' ? partsHoldingOc : each.parts.map(partOf);
        return {
          row,
          partNumber,
          problem: 'severalParts',
          parts: parts.slice(0, mostPartsNamed),
          partCount: parts.length,
        };
      }
      case 'samePart': {
        const others = (rowsOf.get(each.part.name) ?? []).filter((other) => other !== row);
        return {
          row,
          partNumber,
          problem: 'samePart',
          part: partOf(each.part),
          rows: others.slice(0, mostOtherRowsNamed),
          otherRows: others.length,
        };
      }
      case 'notValid':
        return {
          row,
          partNumber,
          problem: 'notValid',
          field: each.field,
          reason: each.reason,
        };
    }
  });

  return {
    rows: made.rows,
    added: made.added.map(({ row, part, offer }): AddedOfferResponse => ({
      row,
      part: partOf(part),
      offerId: madeUpIdentifier(offer),
    })),
    changed: made.changed,
    confirmed: made.confirmed,
    matchedByYourOffer: made.matchedByYourOffer.map(({ row, part }) => ({
      row,
      part: partOf(part),
    })),
    skipped: skipped.sort((a, b) => a.row - b.row),
  };
}
