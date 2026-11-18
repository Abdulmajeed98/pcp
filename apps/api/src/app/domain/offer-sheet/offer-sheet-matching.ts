import { Part } from '../part/Part';
import { foldedPartNumber } from './offer-sheet-layout';
import { OfferSheetRow } from './offer-sheet-row';
import {
  mostOtherRowsNamed,
  RowOfTheSamePart,
  RowWithNoPart,
  RowWithSeveralParts,
  SkippedRow,
} from './OfferSheetResult';
import { OfferSheetMatches } from './OfferSheetStore';

// Matching an upload's valid rows to Parts by their part numbers (SHT-2),
// as the sheet module's spec's "Matching a row to a Part" says. A row's
// part number is compared with every part number of every Part, both folded
// as `foldedPartNumber` folds them, and the match is otherwise exact: no
// name is read and no near miss is taken.

// A row matched to one Part, and whether by the tie-break.
export class RowMatched {
  constructor(
    private readonly row: OfferSheetRow,
    private readonly part: Part,
    private readonly byYourOffer: boolean,
  ) {}

  getRow(): OfferSheetRow {
    return this.row;
  }

  getPart(): Part {
    return this.part;
  }

  // Whether several Parts hold the row's part number, and the row matched
  // the one of them the Vendor offers.
  isByYourOffer(): boolean {
    return this.byYourOffer;
  }
}

// What matching made of the rows: those matched to one Part each, to be
// applied, and those skipped, each in the file's order.
export type RowsMatched = {
  readonly matched: readonly RowMatched[];
  readonly skipped: readonly SkippedRow[];
};

// The Parts that hold each part number, folded, in the catalog's order.
function holdersIn(matches: OfferSheetMatches): Map<string, Part[]> {
  const holders = new Map<string, Part[]>();
  for (const part of matches.getParts()) {
    for (const partNumber of part.getPartNumbers()) {
      const folded = foldedPartNumber(partNumber);
      const parts = holders.get(folded) ?? [];
      if (!parts.includes(part)) parts.push(part);
      holders.set(folded, parts);
    }
  }
  return holders;
}

// The first rows of a Part other than one of them, in order, at most
// `mostOtherRowsNamed`: read only as far as they go, so that a Part that
// every row of a file names costs each row no more than any other.
function firstOtherRows(rowsOfThePart: readonly number[], row: number): number[] {
  const others: number[] = [];
  for (const other of rowsOfThePart) {
    if (others.length === mostOtherRowsNamed) break;
    if (other !== row) others.push(other);
  }
  return others;
}

// Each valid row matched or skipped:
// - one Part holds its number: that Part;
// - several do, and the Vendor offers exactly one of them: that Offer's
//   Part, the tie-break;
// - several do otherwise: skipped as several Parts, naming them all;
// - none does: skipped as no Part, saying whether the Vendor has an open
//   Part Request for the number.
// The rows that matched one Part are compared last: when two or more
// matched the same Part, every one of them is skipped as the same Part
// twice, each naming the first of the others and counting them all.
export function matchedRows(
  rows: readonly OfferSheetRow[],
  matches: OfferSheetMatches,
): RowsMatched {
  const holders = holdersIn(matches);
  const requested = new Set(matches.getOpenPartRequestNumbers().map(foldedPartNumber));

  const matched: RowMatched[] = [];
  const skipped: SkippedRow[] = [];
  for (const row of rows) {
    const folded = foldedPartNumber(row.getPartNumber());
    const parts = holders.get(folded) ?? [];
    const offered = parts.filter((part) => matches.offers(part.getId()));
    if (parts.length === 1) {
      matched.push(new RowMatched(row, parts[0], false));
    } else if (parts.length > 1 && offered.length === 1) {
      matched.push(new RowMatched(row, offered[0], true));
    } else if (parts.length > 1) {
      skipped.push(new RowWithSeveralParts(row.getRow(), row.getPartNumber(), parts));
    } else {
      skipped.push(
        new RowWithNoPart(
          row.getRow(),
          row.getPartNumber(),
          row.getName(),
          row.getDetails(),
          requested.has(folded),
        ),
      );
    }
  }

  // The rows that matched each Part, in order.
  const rowsOf = new Map<string, number[]>();
  for (const each of matched) {
    const partId = each.getPart().getId();
    const rowsOfThePart = rowsOf.get(partId) ?? [];
    rowsOfThePart.push(each.getRow().getRow());
    rowsOf.set(partId, rowsOfThePart);
  }

  const once: RowMatched[] = [];
  for (const each of matched) {
    const row = each.getRow().getRow();
    const rowsOfThePart = rowsOf.get(each.getPart().getId()) ?? [];
    if (rowsOfThePart.length === 1) {
      once.push(each);
    } else {
      skipped.push(
        new RowOfTheSamePart(
          row,
          each.getRow().getPartNumber(),
          each.getPart(),
          firstOtherRows(rowsOfThePart, row),
          rowsOfThePart.length - 1,
        ),
      );
    }
  }

  return { matched: once, skipped };
}
