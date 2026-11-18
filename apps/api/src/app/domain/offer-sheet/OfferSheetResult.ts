import { OfferDetails } from '../offer/OfferDetails';
import { Part } from '../part/Part';
import { OfferSheetRowNotValid } from './offer-sheet-row';

// The upload's result (SHT-5): what the upload did with each row of the
// file. It is answered once and never kept.

// The most other rows a row skipped as the same Part twice names.
export const mostOtherRowsNamed = 10;

// The most Parts a row skipped as several Parts names.
export const mostPartsNamed = 10;

// An Offer an applied row made: the row's number, the Part and the Offer.
export class AddedOffer {
  constructor(
    private readonly row: number,
    private readonly part: Part,
    private readonly offerId: string,
  ) {}

  getRow(): number {
    return this.row;
  }

  getPart(): Part {
    return this.part;
  }

  getOfferId(): string {
    return this.offerId;
  }
}

// An applied row whose part number several Parts hold, of which the Vendor
// offers exactly one: the row's number and the Part it was applied to, the
// tie-break's choice, which the result shows.
export class RowMatchedByYourOffer {
  constructor(
    private readonly row: number,
    private readonly part: Part,
  ) {}

  getRow(): number {
    return this.row;
  }

  getPart(): Part {
    return this.part;
  }
}

// A row skipped as no Part: its part number matched no Part. It carries the
// row's details as they were checked, everything a Part Request takes but
// the Category, and whether the Vendor has an open Part Request for its
// part number already.
export class RowWithNoPart {
  constructor(
    private readonly row: number,
    private readonly partNumber: string,
    private readonly name: string | null,
    private readonly details: OfferDetails,
    private readonly partRequestOpen: boolean,
  ) {}

  getRow(): number {
    return this.row;
  }

  getPartNumber(): string {
    return this.partNumber;
  }

  // The Part's name as written in the row, or null when it gives none.
  getName(): string | null {
    return this.name;
  }

  getDetails(): OfferDetails {
    return this.details;
  }

  isPartRequestOpen(): boolean {
    return this.partRequestOpen;
  }
}

// A row skipped as several Parts: its part number matched more than one
// Part, and the Vendor offers none of them or more than one.
export class RowWithSeveralParts {
  constructor(
    private readonly row: number,
    private readonly partNumber: string,
    private readonly parts: readonly Part[],
    private readonly partCount: number,
  ) {}

  getRow(): number {
    return this.row;
  }

  getPartNumber(): string {
    return this.partNumber;
  }

  // The first Parts that hold the number, in the catalog's order, at most
  // `mostPartsNamed`, so that a number dozens of Parts hold, such as "OC",
  // costs a row no more than any other; the catalog search with the number
  // shows them all.
  getParts(): readonly Part[] {
    return this.parts;
  }

  // How many Parts hold the number, every one of them.
  getPartCount(): number {
    return this.partCount;
  }
}

// A row skipped as the same Part twice: another row matched the same Part,
// so neither is applied and the platform never chooses between two of a
// Vendor's prices. It names the first of the other rows, at most
// `mostOtherRowsNamed`, and counts them all, so that a result grows with
// its rows and never with the square of them.
export class RowOfTheSamePart {
  constructor(
    private readonly row: number,
    private readonly partNumber: string,
    private readonly part: Part,
    private readonly otherRows: readonly number[],
    private readonly otherRowCount: number,
  ) {}

  getRow(): number {
    return this.row;
  }

  getPartNumber(): string {
    return this.partNumber;
  }

  getPart(): Part {
    return this.part;
  }

  // The numbers of the first other rows that matched the Part, in order, at
  // most `mostOtherRowsNamed`.
  getOtherRows(): readonly number[] {
    return this.otherRows;
  }

  // How many other rows matched the Part, every one of them.
  getOtherRowCount(): number {
    return this.otherRowCount;
  }
}

// A row skipped, for one of the four reasons: no Part, several Parts, the
// same Part twice, or not valid.
export type SkippedRow =
  | RowWithNoPart
  | RowWithSeveralParts
  | RowOfTheSamePart
  | OfferSheetRowNotValid;

// The upload's result: how many rows were read, not counting empty ones;
// the Offers added; how many were changed and how many only confirmed; the
// rows applied by the tie-break; and every skipped row, by row number.
export class OfferSheetResult {
  constructor(
    private readonly rows: number,
    private readonly added: readonly AddedOffer[],
    private readonly changed: number,
    private readonly confirmed: number,
    private readonly matchedByYourOffer: readonly RowMatchedByYourOffer[],
    private readonly skipped: readonly SkippedRow[],
  ) {}

  getRows(): number {
    return this.rows;
  }

  getAdded(): readonly AddedOffer[] {
    return this.added;
  }

  getChanged(): number {
    return this.changed;
  }

  getConfirmed(): number {
    return this.confirmed;
  }

  getMatchedByYourOffer(): readonly RowMatchedByYourOffer[] {
    return this.matchedByYourOffer;
  }

  getSkipped(): readonly SkippedRow[] {
    return this.skipped;
  }
}
