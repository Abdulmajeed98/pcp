import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { OfferSheetFileRefusal } from './offer-sheet-errors';
import {
  mostRowsOfAnOfferSheet,
  OfferSheetColumn,
  offerSheetColumns,
  OfferSheetColumnWritten,
  OfferSheetLayout,
} from './offer-sheet-layout';
import { partNumberOfTheRow } from './offer-sheet-part-numbers';
import { OfferSheetContents } from './OfferSheetStore';

// A cell of an Offer sheet as it is written: text, a number, or nothing.
export type OfferSheetCell = string | number | null;

// An Offer sheet as it is written, in one language: its one worksheet, its
// direction, its six columns with their headings, the two words "in stock"
// is chosen from, and its rows below the headings, six cells each. The
// columns and each row's cells are in `offerSheetColumns`' order, so that
// a heading and the cells below it always move together.
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
      const cells: Record<OfferSheetColumn, OfferSheetCell> = {
        partNumber: partNumberOfTheRow(offer.getPart(), holders, (partId) =>
          contents.offers(partId),
        ),
        name: offer.getPart().getName(),
        usdPrice: cents === null ? null : cents / 100,
        iqdPrice: details.getIqdPrice(),
        inStock: layout.inStockWord(details.isInStock()),
        warrantyMonths: details.getWarrantyMonths(),
      };
      return offerSheetColumns.map((column) => cells[column]);
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

// A cell of an uploaded file as it was read, by the kind of value it holds:
// nothing; text, rich text joined; a number; TRUE or FALSE; or a value that
// cannot be read, such as an error or a formula saved with no value, with
// its text as written, where it has one. A formula is read by the value it
// was saved with.
export type OfferSheetCellRead =
  | { readonly kind: 'empty' }
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'number'; readonly number: number }
  | { readonly kind: 'trueOrFalse'; readonly value: boolean }
  | { readonly kind: 'notReadable'; readonly text: string };

// The empty cell.
export const emptyCell: OfferSheetCellRead = { kind: 'empty' };

// A row of an uploaded file's first worksheet, as it was read: its number,
// as the spreadsheet numbers it, and its six cells, A to F, in
// `offerSheetColumns`' order.
export class OfferSheetRowRead {
  constructor(
    private readonly rowNumber: number,
    private readonly cells: readonly OfferSheetCellRead[],
  ) {}

  getRowNumber(): number {
    return this.rowNumber;
  }

  // The six cells, A to F, a cell the file does not hold empty.
  getCells(): readonly OfferSheetCellRead[] {
    return this.cells;
  }

  // The cell of a column, in the place the layout gives the column, empty
  // when the file holds none.
  cellOf(column: OfferSheetColumn): OfferSheetCellRead {
    return this.cells[offerSheetColumns.indexOf(column)] ?? emptyCell;
  }
}

// An uploaded file's first worksheet as it was read: every row that holds
// a value, in the order of their numbers, row 1 among them. A workbook with
// no worksheet has none.
export class OfferSheetRead {
  constructor(private readonly rows: readonly OfferSheetRowRead[]) {}

  getRows(): readonly OfferSheetRowRead[] {
    return this.rows;
  }
}

// Why an uploaded file was not read: it is not an .xlsx file that can be
// read, `notReadable`; or what it holds unpacks past the bound of memory
// an upload is read within, more than the platform takes, `tooLarge`,
// whether it is a Vendor's very large file or a crafted one.
export type OfferSheetNotRead = Extract<OfferSheetFileRefusal, 'notReadable' | 'tooLarge'>;

// The port an Offer sheet is turned into a file through, and a file read
// back through. Its implementation is the only code that names the file
// library, so that the domain never does and the library can be replaced.
export abstract class OfferSheetFile {
  // The .xlsx file's bytes.
  abstract write(
    offerSheet: OfferSheetWritten,
  ): Promise<Either.Either<Uint8Array, StructuredError>>;

  // The first worksheet of an uploaded file, sent by a stranger, as it was
  // read, within bounds of memory and time; or why it was not read.
  abstract read(
    file: Uint8Array,
  ): Promise<Either.Either<OfferSheetRead, OfferSheetNotRead>>;
}
