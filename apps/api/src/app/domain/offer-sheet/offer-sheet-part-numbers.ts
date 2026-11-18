import { cleanPartNumber } from '../part/part-numbers';

// The part numbers of an Offer sheet, compared as the download chooses one
// and the upload matches one, written once for both: the fold, and the one
// index of which Parts hold each number.

// A part number folded as the upload compares it and the download chooses
// it: cleaned as the catalog cleans one, then in lower case, as the
// catalog's search text folds it. Nothing else of it is dropped, so a match
// is exact but for case and invisible marks.
export function foldedPartNumber(partNumber: string): string {
  return cleanPartNumber(partNumber).toLowerCase();
}

// A Part as far as its part numbers go: the Part of the catalog, or the
// part numbers the download reads of one.
export interface HoldsPartNumbers {
  getId(): string;
  getPartNumbers(): readonly string[];
}

// Which Parts hold each part number, compared by the fold, in the order the
// Parts were given, as far as the Parts given go.
export class PartNumberHolders<Holder extends HoldsPartNumbers> {
  private readonly holders = new Map<string, Holder[]>();

  constructor(parts: readonly Holder[]) {
    for (const part of parts) {
      for (const partNumber of part.getPartNumbers()) {
        const folded = foldedPartNumber(partNumber);
        const holding = this.holders.get(folded) ?? [];
        // A Part's numbers are read together, so a Part that already holds
        // the number in another case is the last one added.
        if (holding.at(-1) !== part) holding.push(part);
        this.holders.set(folded, holding);
      }
    }
  }

  // The Parts that hold the part number, compared by the fold, in the order
  // they were given.
  of(partNumber: string): readonly Holder[] {
    return this.holders.get(foldedPartNumber(partNumber)) ?? [];
  }
}

// The part number an Offer sheet's row is given: the first of the Part's
// part numbers that no other Part holds, compared by the fold, so that the
// upload matches the row back to this Part alone; when another Part holds
// every one, the Part's first, which the upload's tie-break matches back to
// the Vendor's Offer; and none for a Part that has none.
export function partNumberOfTheRow(
  part: HoldsPartNumbers,
  holders: PartNumberHolders<HoldsPartNumbers>,
): string | null {
  const partNumbers = part.getPartNumbers();
  const own = partNumbers.find((partNumber) =>
    holders.of(partNumber).every((holder) => holder.getId() === part.getId()),
  );
  return own ?? partNumbers[0] ?? null;
}
