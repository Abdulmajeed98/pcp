import { Injectable, Logger } from '@nestjs/common';
import { ServerError, StructuredError } from '@pcp/core';
import { Either } from 'effect';
import {
  type Cell,
  type DataValidation,
  ValueType,
  Workbook,
  type Worksheet,
} from 'exceljs';

import { OfferSheetCellKind } from '~/domain/offer-sheet/offer-sheet-layout';
import {
  emptyCell,
  OfferSheetCell,
  OfferSheetCellRead,
  OfferSheetFile,
  OfferSheetNotRead,
  OfferSheetRead,
  OfferSheetRowRead,
  OfferSheetWritten,
} from '~/domain/offer-sheet/OfferSheetFile';

import { archiveOf, partsUnpacked } from './bounded-archive';

// The most the parts ExcelJS reads of an uploaded file may unpack to, all
// together: 8 MiB, four times what the platform's own Offer sheet of 5,000
// rows unpacks to, about 2 MB, and far below what takes the API down. Past
// it, the file is not read and is answered too large, whether it is
// crafted or a Vendor's own file of about 21,000 rows or more, which the
// portal then tells to split its rows (the code review of `sheet`).
const mostUnpackedBytes = 8 * 1024 * 1024;

// The parts of an .xlsx file ExcelJS reads to find the first worksheet and
// its cells: the workbook, its relationships, its shared strings, its
// styles, which tell a date from a number, and its worksheets. Every other
// part, such as a picture, a comment, a drawing, a table or a theme, is set
// aside and never unpacked.
function isReadForTheCells(name: string): boolean {
  return (
    [
      'xl/workbook.xml',
      'xl/_rels/workbook.xml.rels',
      'xl/sharedStrings.xml',
      'xl/styles.xml',
    ].includes(name) || /^xl\/worksheets\/sheet\d+\.xml$/.test(name)
  );
}

// Every node of a worksheet that ExcelJS 4.4 reads, its `WorkSheetXform`'s,
// but its cells, `sheetData`: set aside while it parses a stranger's file.
// ExcelJS spreads a range over every cell it covers as it reads a list a
// cell is chosen from, a merge or a column's width, so a file of a few
// kilobytes that names the whole worksheet held it for minutes or took the
// process down (`sheet` tickets 01 and 02). An upload reads cells alone.
const everyNodeButTheCells = [
  'sheetPr',
  'dimension',
  'sheetViews',
  'sheetFormatPr',
  'cols',
  'autoFilter',
  'mergeCells',
  'rowBreaks',
  'hyperlinks',
  'pageMargins',
  'dataValidations',
  'pageSetup',
  'headerFooter',
  'printOptions',
  'picture',
  'drawing',
  'sheetProtection',
  'tableParts',
  'conditionalFormatting',
  'extLst',
];

// Where the element of a name next opens in an XML text, from a place on:
// `<name` followed by a space, a slash or `>`; or -1.
function nextOpening(text: string, name: string, from: number): number {
  const opening = `<${name}`;
  for (
    let at = text.indexOf(opening, from);
    at !== -1;
    at = text.indexOf(opening, at + 1)
  ) {
    if (/[\s/>]/.test(text.charAt(at + opening.length))) return at;
  }
  return -1;
}

// The workbook's part with its defined names set aside: ExcelJS spreads each
// name over every cell its range covers as it reads it, as it does a list,
// and an upload reads cells alone. They are found by plain search, not a
// pattern, so that a crafted part cannot make the search itself slow. A
// part that opens them and never closes them is cut there, and ExcelJS then
// cannot read it.
function withoutDefinedNames(workbook: Buffer): Buffer {
  const text = workbook.toString('utf8');
  const closing = '</definedNames>';
  const kept: string[] = [];
  let from = 0;
  for (let start = nextOpening(text, 'definedNames', from); start !== -1;) {
    kept.push(text.slice(from, start));
    const tagEnds = text.indexOf('>', start);
    const selfClosing = tagEnds !== -1 && text.charAt(tagEnds - 1) === '/';
    const end = selfClosing ? tagEnds + 1 : text.indexOf(closing, start);
    if (tagEnds === -1 || end === -1) return Buffer.from(kept.join(''));
    from = selfClosing ? end : end + closing.length;
    start = nextOpening(text, 'definedNames', from);
  }
  kept.push(text.slice(from));
  return Buffer.from(kept.join(''));
}

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

// A formula's value as it was saved, read by its kind as a cell's is: none
// when it was saved with none.
function savedValueOf(result: unknown): OfferSheetCellRead {
  if (typeof result === 'number') return { kind: 'number', number: result };
  if (typeof result === 'string') return { kind: 'text', text: result };
  if (typeof result === 'boolean') return { kind: 'trueOrFalse', value: result };
  if (typeof result === 'object' && result !== null && 'error' in result) {
    return { kind: 'notReadable', text: String(result.error) };
  }
  return { kind: 'notReadable', text: '' };
}

// A cell as ExcelJS read it, by the kind of value it holds. A cell merged
// into another holds nothing of its own.
function cellRead(cell: Cell): OfferSheetCellRead {
  switch (cell.type) {
    case ValueType.Null:
    case ValueType.Merge:
      return emptyCell;
    case ValueType.Number:
      return { kind: 'number', number: cell.value as number };
    case ValueType.String:
    case ValueType.SharedString:
    case ValueType.RichText:
    case ValueType.Hyperlink:
      return { kind: 'text', text: cell.text };
    case ValueType.Boolean:
      return { kind: 'trueOrFalse', value: cell.value as boolean };
    case ValueType.Formula:
      return savedValueOf(cell.result);
    case ValueType.Error:
      return { kind: 'notReadable', text: cell.text };
    default:
      // A date, which no column of the Offer sheet holds.
      return { kind: 'notReadable', text: '' };
  }
}

// The Offer sheet written as an .xlsx file with ExcelJS, and a file read
// back with it: the only code that names the library (the sheet module's
// spec).
@Injectable()
export class ExcelJsOfferSheetFile extends OfferSheetFile {
  private readonly logger = new Logger(ExcelJsOfferSheetFile.name);

  async write(
    offerSheet: OfferSheetWritten,
  ): Promise<Either.Either<Uint8Array, StructuredError>> {
    try {
      const workbook = new Workbook();
      // Row 1, the headings, stays in view as the Vendor scrolls, and the
      // worksheet reads in the language's direction.
      const worksheet = workbook.addWorksheet(offerSheet.getWorksheetName(), {
        views: [
          {
            state: 'frozen',
            xSplit: 0,
            ySplit: 1,
            topLeftCell: 'A2',
            rightToLeft: offerSheet.readsRightToLeft(),
          },
        ],
      }) as WithDataValidations;

      const columns = offerSheet.getColumns();
      const rows = offerSheet.getRows();
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
      const [yes, no] = offerSheet.getChoices();
      const lastRow = 1 + offerSheet.getRowsTheListCovers();
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

  async read(file: Uint8Array): Promise<Either.Either<OfferSheetRead, OfferSheetNotRead>> {
    // The parts ExcelJS needs, unpacked within the bound before it sees any
    // of them, and only those handed to it, in an archive of their own. A
    // file with no workbook, such as an .ods, is not an .xlsx file.
    const unpacked = await partsUnpacked(file, isReadForTheCells, mostUnpackedBytes);
    if (Either.isLeft(unpacked)) {
      return Either.left(unpacked.left === 'pastTheBound' ? 'tooLarge' : 'notReadable');
    }
    const parts = unpacked.right;
    const workbookPart = parts.get('xl/workbook.xml');
    if (workbookPart === undefined) return Either.left('notReadable');
    parts.set('xl/workbook.xml', withoutDefinedNames(workbookPart));

    try {
      const workbook = new Workbook();
      // A copy in an ArrayBuffer of its own, which ExcelJS's types take.
      await workbook.xlsx.load(new Uint8Array(archiveOf(parts)).buffer, {
        ignoreNodes: everyNodeButTheCells,
      });

      const [worksheet] = workbook.worksheets;
      const rows: OfferSheetRowRead[] = [];
      worksheet?.eachRow((row, number) => {
        rows.push(
          new OfferSheetRowRead(
            number,
            [1, 2, 3, 4, 5, 6].map((column) => cellRead(row.getCell(column))),
          ),
        );
      });
      return Either.right(new OfferSheetRead(rows));
    } catch {
      return Either.left('notReadable');
    }
  }
}
