import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import {
  mostRowsOfAnOfferSheet,
  OfferSheetColumnWritten,
  OfferSheetLayout,
} from './offer-sheet-layout';
import { partNumberOfTheRow } from './OfferOnTheSheet';
import { OfferSheetContents } from './OfferSheetStore';

// A cell of an Offer sheet as it is written: text, a number, or nothing.
export type OfferSheetCell = string | number | null;

// An Offer sheet as it is written, in one language: its one worksheet, its
// direction, its six columns with their headings, the two words "in stock"
// is chosen from, and its rows below the headings, six cells each.
export class OfferSheetWritten {
  private constructor(
    private readonly worksheetName: string,
    private readonly rightToLeft: boolean,
    private readonly columns: readonly OfferSheetColumnWritten[],
    private readonly choices: readonly [string, string],
    private readonly rows: readonly (readonly OfferSheetCell[])[],
  ) {}

  // The Offer sheet the layout writes from the Vendor's Offers.
  static of(layout: OfferSheetLayout, contents: OfferSheetContents): OfferSheetWritten {
    const holders = contents.getHolders();
    const rows = contents.getOffers().map((offer) => {
      const details = offer.getDetails();
      const cents = details.getUsdPriceCents();
      return [
        partNumberOfTheRow(offer.getPart(), holders),
        offer.getPart().getName(),
        cents === null ? null : cents / 100,
        details.getIqdPrice(),
        layout.inStockWord(details.isInStock()),
        details.getWarrantyMonths(),
      ];
    });
    return new OfferSheetWritten(
      layout.getWorksheetName(),
      layout.readsRightToLeft(),
      layout.getColumns(),
      [layout.getYes(), layout.getNo()],
      rows,
    );
  }

  getWorksheetName(): string {
    return this.worksheetName;
  }

  readsRightToLeft(): boolean {
    return this.rightToLeft;
  }

  getColumns(): readonly OfferSheetColumnWritten[] {
    return this.columns;
  }

  // Yes and no, in the order a list offers them.
  getChoices(): readonly [string, string] {
    return this.choices;
  }

  getRows(): readonly (readonly OfferSheetCell[])[] {
    return this.rows;
  }

  // How many rows below the headings a column's list covers: every row
  // written and every row an upload takes, so that a row the Vendor adds
  // offers the list too.
  getRowsTheListCovers(): number {
    return Math.max(this.rows.length, mostRowsOfAnOfferSheet);
  }
}

// The port an Offer sheet is turned into a file through. Its implementation
// is the only code that names the file library, so that the domain never
// does and the library can be replaced.
export abstract class OfferSheetFile {
  // The .xlsx file's bytes.
  abstract write(
    sheet: OfferSheetWritten,
  ): Promise<Either.Either<Uint8Array, StructuredError>>;
}
