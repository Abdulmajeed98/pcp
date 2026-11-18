import { Injectable, Logger } from '@nestjs/common';
import { ServerError, StructuredError } from '@pcp/core';
import { Either } from 'effect';
import { type DataValidation, Workbook, type Worksheet } from 'exceljs';

import { OfferSheetCellKind } from '~/domain/offer-sheet/offer-sheet-layout';
import {
  OfferSheetCell,
  OfferSheetFile,
  OfferSheetWritten,
} from '~/domain/offer-sheet/OfferSheetFile';

// The number format each kind of cell is written with. It is the column's,
// so that a cell the Vendor types into later takes it too: a part number of
// digits stays text, and a price keeps its decimals.
const numberFormatOf: Record<OfferSheetCellKind, string> = {
  text: '@',
  twoDecimals: '0.00',
  wholeNumber: '0',
  yesOrNo: '@',
};

// A column's width, in characters: wide enough for its heading and for
// what is written below it, within bounds a phone's spreadsheet app shows.
function widthOf(heading: string, cells: readonly OfferSheetCell[]): number {
  const longest = Math.max(
    [...heading].length,
    ...cells.map((cell) => (cell === null ? 0 : [...String(cell)].length)),
  );
  return Math.min(Math.max(longest + 2, 10), 60);
}

// The letter of a column, counted from 1, for the six columns A to F.
function letterOf(column: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + column - 1);
}

// ExcelJS 4.4 writes a list over a range of cells through the worksheet's
// `dataValidations`, which its published types leave out.
type WithDataValidations = Worksheet & {
  dataValidations: { add(range: string, validation: DataValidation): void };
};

// The Offer sheet written as an .xlsx file with ExcelJS: the only code that
// names the library (the sheet module's spec).
@Injectable()
export class ExcelJsOfferSheetFile extends OfferSheetFile {
  private readonly logger = new Logger(ExcelJsOfferSheetFile.name);

  async write(
    sheet: OfferSheetWritten,
  ): Promise<Either.Either<Uint8Array, StructuredError>> {
    try {
      const workbook = new Workbook();
      // Row 1, the headings, stays in view as the Vendor scrolls, and the
      // worksheet reads in the language's direction.
      const worksheet = workbook.addWorksheet(sheet.getWorksheetName(), {
        views: [
          {
            state: 'frozen',
            xSplit: 0,
            ySplit: 1,
            topLeftCell: 'A2',
            rightToLeft: sheet.readsRightToLeft(),
          },
        ],
      }) as WithDataValidations;

      const columns = sheet.getColumns();
      const rows = sheet.getRows();
      worksheet.columns = columns.map((column, index) => ({
        header: column.getHeading(),
        width: widthOf(
          column.getHeading(),
          rows.map((row) => row[index]),
        ),
        style: { numFmt: numberFormatOf[column.getKind()] },
      }));
      worksheet.getRow(1).font = { bold: true };
      for (const row of rows) worksheet.addRow([...row]);

      // "In stock" is chosen from the language's yes and no, on every row
      // written and on the rows below, where the Vendor adds a Part's row.
      const [yes, no] = sheet.getChoices();
      const lastRow = 1 + sheet.getRowsTheListCovers();
      columns.forEach((column, index) => {
        if (column.getKind() !== 'yesOrNo') return;
        const letter = letterOf(index + 1);
        worksheet.dataValidations.add(`${letter}2:${letter}${lastRow}`, {
          type: 'list',
          allowBlank: false,
          formulae: [`"${yes},${no}"`],
          showErrorMessage: true,
        });
      });

      return Either.right(new Uint8Array(await workbook.xlsx.writeBuffer()));
    } catch (error) {
      this.logger.error(error, 'An Offer sheet could not be written');
      return Either.left(ServerError.of('An Offer sheet could not be written'));
    }
  }
}
