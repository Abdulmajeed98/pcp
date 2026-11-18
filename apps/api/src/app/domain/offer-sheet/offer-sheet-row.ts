import { westernDigitsIn, westernNumberIn } from '@pcp/i18n';
import { Either } from 'effect';

import { offerDetailsRefusals } from '../offer/offer-errors';
import { OfferDetails, UncheckedOfferDetails } from '../offer/OfferDetails';
import { cleanPartNumber } from '../part/part-numbers';
import {
  longestPartRequestName,
  longestPartRequestPartNumber,
} from '../part-request/PartRequestDetails';
import { holdsText, lengthOf } from '../vendor/detail-text';
import { inStockSaidBy } from './offer-sheet-layout';
import { OfferSheetCellRead, OfferSheetRowRead } from './OfferSheetFile';

// The reading of one row of an uploaded Offer sheet into the details an
// Offer takes, as the sheet module's spec's "Reading an upload" says: each
// cell by the kind of value it holds, and the row's one problem, if it has
// any, the first cell that does not fit in the columns' order.

// The columns a row's problem can name: the part number, and the Offer's
// details. The Part's name is never checked.
export const offerSheetRowFields = [
  'partNumber',
  'usdPrice',
  'iqdPrice',
  'inStock',
  'warrantyMonths',
] as const;

export type OfferSheetRowField = (typeof offerSheetRowFields)[number];

// Why a cell does not fit: the Offer's reasons, as `OfferDetails` gives
// them, taken from the Offer's own list, so that a reason the Offer gains
// is a row's too; the part number's own, `missing`, which the Offer's list
// holds, and `tooLong`, as a Part Request's; and the Offer sheet's own two,
// a word that is neither yes nor no, and a cell that cannot be read.
export const offerSheetRowRefusals = [
  ...offerDetailsRefusals,
  'tooLong',
  'notYesOrNo',
  'notReadable',
] as const;

export type OfferSheetRowRefusal = (typeof offerSheetRowRefusals)[number];

// A row whose cells all fit: its number in the file, its part number as
// cleaned, the Part's name as written, which is never matched, and the
// Offer it states.
export class OfferSheetRow {
  constructor(
    private readonly rowNumber: number,
    private readonly partNumber: string,
    private readonly name: string | null,
    private readonly details: OfferDetails,
  ) {}

  getRowNumber(): number {
    return this.rowNumber;
  }

  // In Western digits, without invisible marks and without the space
  // around it, as the catalog cleans one.
  getPartNumber(): string {
    return this.partNumber;
  }

  // As written, or null when the cell holds none.
  getName(): string | null {
    return this.name;
  }

  getDetails(): OfferDetails {
    return this.details;
  }
}

// A row with a cell that does not fit: its number in the file, its part
// number, as cleaned, or as written when its own cell was the problem, and
// its one problem.
export class OfferSheetRowNotValid {
  constructor(
    private readonly rowNumber: number,
    private readonly partNumber: string,
    private readonly field: OfferSheetRowField,
    private readonly reason: OfferSheetRowRefusal,
  ) {}

  getRowNumber(): number {
    return this.rowNumber;
  }

  getPartNumber(): string {
    return this.partNumber;
  }

  getField(): OfferSheetRowField {
    return this.field;
  }

  getReason(): OfferSheetRowRefusal {
    return this.reason;
  }
}

// A cell's value as text, where text is read: text as written, a number as
// its digits, and TRUE or FALSE as the word; none for an empty cell, or for
// text of nothing but spaces.
function textIn(cell: OfferSheetCellRead): string | null {
  switch (cell.kind) {
    case 'text':
      return holdsText(cell.text) ? cell.text : null;
    case 'number':
      return String(cell.number);
    case 'trueOrFalse':
      return cell.value ? 'TRUE' : 'FALSE';
    default:
      return null;
  }
}

// Whether a cell holds nothing: no value, or text of nothing but spaces.
function isEmpty(cell: OfferSheetCellRead): boolean {
  return cell.kind === 'empty' || (cell.kind === 'text' && !holdsText(cell.text));
}

// Whether every cell of a row, A to F, holds nothing: a row the upload
// passes over and does not count.
export function isEmptyRow(row: OfferSheetRowRead): boolean {
  return row.getCells().every(isEmpty);
}

// What a cell gives a detail of the Offer: its value, nothing, or the
// reason it does not fit, found while it was read.
type Read<T> =
  | { readonly value: T | null }
  | { readonly refused: 'notANumber' | 'notYesOrNo' | 'notReadable' };

// A decimal number as the API reads one, in Western digits, as the Offer
// form reads one too.
const decimalNumber = /^-?\d+(?:\.\d+)?$/;

// The USD price: a number cell written as the shortest decimal text that
// reads back as the same number, so that 349.99 is "349.99", and text as a
// keyboard writes it, its digits made Western and its thousands separators
// dropped, for `OfferDetails` to read digit by digit.
function usdPriceIn(cell: OfferSheetCellRead): Read<string> {
  if (cell.kind === 'notReadable') return { refused: 'notReadable' };
  if (isEmpty(cell)) return { value: null };
  if (cell.kind === 'number') return { value: String(cell.number) };
  return { value: westernNumberIn(textIn(cell) ?? '') };
}

// The IQD price or the warranty: a number cell's number, and text read as
// the Offer form reads it, which is not a number unless it is a decimal
// number once its digits are Western and its thousands separators dropped.
function numberIn(cell: OfferSheetCellRead): Read<number> {
  if (cell.kind === 'notReadable') return { refused: 'notReadable' };
  if (isEmpty(cell)) return { value: null };
  if (cell.kind === 'number') return { value: cell.number };
  const western = westernNumberIn(textIn(cell) ?? '');
  return decimalNumber.test(western)
    ? { value: Number(western) }
    : { refused: 'notANumber' };
}

// Whether the Part is in stock: yes or no in any of the three languages, or
// a TRUE or FALSE cell.
function inStockIn(cell: OfferSheetCellRead): Read<boolean> {
  if (cell.kind === 'notReadable') return { refused: 'notReadable' };
  if (isEmpty(cell)) return { value: null };
  if (cell.kind === 'trueOrFalse') return { value: cell.value };
  const said = cell.kind === 'text' ? inStockSaidBy(cell.text) : undefined;
  return said === undefined ? { refused: 'notYesOrNo' } : { value: said };
}

// A text cut to its first code points, as many as given at most, never
// inside a character, so that what a result carries from a cell is bounded
// by the most the platform takes for it, however long the cell: a cell of a
// spreadsheet holds up to 32,767 characters, and one cell of the shared
// strings can stand in every row of a file.
function cutTo(text: string, most: number): string {
  let codePoints = 0;
  let end = 0;
  for (const character of text) {
    if (codePoints === most) return text.slice(0, end);
    codePoints += 1;
    end += character.length;
  }
  return text;
}

// The part number as written in its cell, for a row whose part number is
// its problem, cut to the longest a part number may be.
function partNumberAsWritten(cell: OfferSheetCellRead): string {
  const written =
    cell.kind === 'text' || cell.kind === 'notReadable' ? cell.text : (textIn(cell) ?? '');
  return cutTo(written, longestPartRequestPartNumber);
}

// The Part's name as written in its cell, or none, cut to the longest name a
// Part Request takes, which a row that matched no Part carries to start one.
function nameIn(cell: OfferSheetCellRead): string | null {
  const name = textIn(cell);
  return name === null ? null : cutTo(name, longestPartRequestName);
}

// The row's part number, its digits made Western and then cleaned as the
// catalog cleans one, or why it does not fit: `missing` when nothing is
// left, `tooLong` over 100 code points, as for a Part Request, and
// `notReadable`.
function partNumberIn(
  cell: OfferSheetCellRead,
): Either.Either<string, 'missing' | 'tooLong' | 'notReadable'> {
  if (cell.kind === 'notReadable') return Either.left('notReadable');
  const partNumber = cleanPartNumber(westernDigitsIn(textIn(cell) ?? ''));
  if (partNumber === '') return Either.left('missing');
  if (lengthOf(partNumber) > longestPartRequestPartNumber) return Either.left('tooLong');
  return Either.right(partNumber);
}

// A detail's value as `OfferDetails` is given it: the cell's value, or, for
// a cell that was refused while it was read, a value that fits, standing in
// while the cells before it are checked, so that the row's problem is the
// first cell that does not fit, and so that a price that could not be read
// is never taken for no price at all.
function standingIn<T>(read: Read<T>, fits: T): T | null {
  return 'refused' in read ? fits : read.value;
}

// The row's cells read into a row that fits, or into its one problem: the
// first cell that does not fit, in the columns' order. The prices, the
// stock and the warranty are checked by `OfferDetails.check`, unchanged,
// after the cells are read, so that a row with no price at all is
// `usdPrice`, `missing`, as the Offer form says it, and every limit is the
// Offer's own.
export function checkedRow(
  read: OfferSheetRowRead,
): Either.Either<OfferSheetRow, OfferSheetRowNotValid> {
  const rowNumber = read.getRowNumber();
  const partNumberCell = read.cellOf('partNumber');

  const partNumber = partNumberIn(partNumberCell);
  if (Either.isLeft(partNumber)) {
    return Either.left(
      new OfferSheetRowNotValid(
        rowNumber,
        partNumberAsWritten(partNumberCell),
        'partNumber',
        partNumber.left,
      ),
    );
  }
  const notValid = (field: OfferSheetRowField, reason: OfferSheetRowRefusal) =>
    new OfferSheetRowNotValid(rowNumber, partNumber.right, field, reason);

  const usdPrice = usdPriceIn(read.cellOf('usdPrice'));
  const iqdPrice = numberIn(read.cellOf('iqdPrice'));
  const inStock = inStockIn(read.cellOf('inStock'));
  const warrantyMonths = numberIn(read.cellOf('warrantyMonths'));
  const cells = [
    ['usdPrice', usdPrice],
    ['iqdPrice', iqdPrice],
    ['inStock', inStock],
    ['warrantyMonths', warrantyMonths],
  ] as const;
  const details = OfferDetails.check(
    new UncheckedOfferDetails(
      standingIn(usdPrice, '1'),
      standingIn(iqdPrice, 1),
      standingIn(inStock, true),
      standingIn(warrantyMonths, 1),
    ),
  );

  // The first cell refused while it was read, and what `OfferDetails` says,
  // which never names a cell that was stood in for: the earlier in the
  // columns' order is the row's problem.
  const refusedAt = cells.findIndex(([, cell]) => 'refused' in cell);
  const refusal = Either.isLeft(details)
    ? details.left.getAdditionalInformation()
    : undefined;
  const detailsRefusedAt =
    refusal === undefined ? -1 : cells.findIndex(([field]) => field === refusal.field);
  if (refusedAt !== -1 && (detailsRefusedAt === -1 || refusedAt < detailsRefusedAt)) {
    const [field, cell] = cells[refusedAt];
    if ('refused' in cell) return Either.left(notValid(field, cell.refused));
  }
  if (Either.isLeft(details)) {
    const { field, reason } = details.left.getAdditionalInformation();
    // `OfferDetails` names only the Offer's own fields, and gives only the
    // reasons of `offerDetailsRefusals`, each of them a row's.
    return Either.left(
      notValid(field as OfferSheetRowField, reason as OfferSheetRowRefusal),
    );
  }

  return Either.right(
    new OfferSheetRow(
      rowNumber,
      partNumber.right,
      nameIn(read.cellOf('name')),
      details.right,
    ),
  );
}
