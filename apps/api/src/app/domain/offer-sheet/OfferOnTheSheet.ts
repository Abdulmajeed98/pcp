import { OfferDetails } from '../offer/OfferDetails';
import { foldedPartNumber } from './offer-sheet-layout';

// A Part as an Offer sheet's row needs it: its name, in English as the
// catalog holds it (LANG-3), and its part numbers, in the catalog's order.
export class PartOnTheSheet {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly partNumbers: readonly string[],
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getPartNumbers(): readonly string[] {
    return this.partNumbers;
  }
}

// One of the Vendor's Offers, as its row of the Offer sheet is written from
// it: its Part and its details.
export class OfferOnTheSheet {
  constructor(
    private readonly offerId: string,
    private readonly part: PartOnTheSheet,
    private readonly details: OfferDetails,
  ) {}

  getOfferId(): string {
    return this.offerId;
  }

  getPart(): PartOnTheSheet {
    return this.part;
  }

  getDetails(): OfferDetails {
    return this.details;
  }
}

// A part number of a Part in the catalog, as it is kept: the Part that holds
// it and the number.
export class PartNumberHeld {
  constructor(
    private readonly partId: string,
    private readonly partNumber: string,
  ) {}

  getPartId(): string {
    return this.partId;
  }

  getPartNumber(): string {
    return this.partNumber;
  }
}

// Which Parts of the catalog hold each part number, compared by the fold, as
// far as the part numbers asked about go.
export class PartNumberHolders {
  private readonly holders = new Map<string, Set<string>>();

  constructor(held: readonly PartNumberHeld[]) {
    for (const each of held) {
      const folded = foldedPartNumber(each.getPartNumber());
      const parts = this.holders.get(folded) ?? new Set<string>();
      parts.add(each.getPartId());
      this.holders.set(folded, parts);
    }
  }

  // Whether a Part other than this one holds the part number.
  heldByAnotherPart(partNumber: string, partId: string): boolean {
    const parts = this.holders.get(foldedPartNumber(partNumber)) ?? new Set<string>();
    return [...parts].some((holder) => holder !== partId);
  }
}

// The part number an Offer sheet's row is given: the first of the Part's
// part numbers that no other Part holds, compared by the fold, so that the
// upload matches the row back to this Part alone; when another Part holds
// every one, the Part's first, which the upload's tie-break matches back to
// the Vendor's Offer; and none for a Part that has none.
export function partNumberOfTheRow(
  part: PartOnTheSheet,
  holders: PartNumberHolders,
): string | null {
  const partNumbers = part.getPartNumbers();
  const own = partNumbers.find(
    (partNumber) => !holders.heldByAnotherPart(partNumber, part.getId()),
  );
  return own ?? partNumbers[0] ?? null;
}
