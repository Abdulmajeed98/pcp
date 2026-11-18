import { NotValidError } from '@pcp/core';
import { dashboardMessages, directions, type Language, languages } from '@pcp/i18n';
import { Either } from 'effect';

import { cleanPartNumber } from '../part/part-numbers';
import { holdsText } from '../vendor/detail-text';
import { offerSheetLanguageRefused } from './offer-sheet-errors';

// The Offer sheet's layout, written once, for the download that writes it and
// the upload that reads it back (SHT-7), so that a downloaded file is always
// the layout an upload takes. Its words are the dashboard's, in `@pcp/i18n`,
// where every text of the platform is kept (ADR-0008): none holds a
// placeholder or a plural, so each is read as it is.

// The six columns, A to F, in SHT-1's order.
export const offerSheetColumns = [
  'partNumber',
  'name',
  'usdPrice',
  'iqdPrice',
  'inStock',
  'warrantyMonths',
] as const;

export type OfferSheetColumn = (typeof offerSheetColumns)[number];

// How a column's cells are written: as text, so that a code of digits keeps
// its leading zeros; as a number with two decimals, the USD price; as a whole
// number, the IQD price and the warranty; or as the word for yes or no,
// chosen from a list of the two.
export type OfferSheetCellKind = 'text' | 'twoDecimals' | 'wholeNumber' | 'yesOrNo';

const kindOf: Record<OfferSheetColumn, OfferSheetCellKind> = {
  partNumber: 'text',
  name: 'text',
  usdPrice: 'twoDecimals',
  iqdPrice: 'wholeNumber',
  inStock: 'yesOrNo',
  warrantyMonths: 'wholeNumber',
};

// The most rows that are not empty an upload takes, more than the largest
// Category of the catalog holds. A Vendor with more splits its file.
export const mostRowsOfAnOfferSheet = 5_000;

// A part number folded as the upload compares it and the download chooses
// it: cleaned as the catalog cleans one, then in lower case, as the
// catalog's search text folds it. Nothing else of it is dropped, so a match
// is exact but for case and invisible marks.
export function foldedPartNumber(partNumber: string): string {
  return cleanPartNumber(partNumber).toLowerCase();
}

// The language an Offer sheet was asked for in, or why it was refused: none
// was given, or it is not one of the platform's three, compared exactly.
export function offerSheetLanguage(
  asked: string | null,
): Either.Either<Language, NotValidError> {
  if (!holdsText(asked)) return Either.left(offerSheetLanguageRefused('missing'));
  const language = languages.find((each) => each === asked);
  return language === undefined
    ? Either.left(offerSheetLanguageRefused('notInTheSet'))
    : Either.right(language);
}

// A column as it is written in one language: its heading and its cells' kind.
export class OfferSheetColumnWritten {
  constructor(
    private readonly heading: string,
    private readonly kind: OfferSheetCellKind,
  ) {}

  getHeading(): string {
    return this.heading;
  }

  getKind(): OfferSheetCellKind {
    return this.kind;
  }
}

// The layout in one language: the words the download writes in it.
export class OfferSheetLayout {
  private constructor(private readonly language: Language) {}

  static in(language: Language): OfferSheetLayout {
    return new OfferSheetLayout(language);
  }

  private words() {
    return dashboardMessages[this.language].OfferSheetFile;
  }

  // The six columns, A to F, with their headings in this language.
  getColumns(): OfferSheetColumnWritten[] {
    const { headings } = this.words();
    return offerSheetColumns.map(
      (column) => new OfferSheetColumnWritten(headings[column], kindOf[column]),
    );
  }

  getYes(): string {
    return this.words().yes;
  }

  getNo(): string {
    return this.words().no;
  }

  // The word for whether the Part is in stock.
  inStockWord(inStock: boolean): string {
    return inStock ? this.getYes() : this.getNo();
  }

  getWorksheetName(): string {
    return this.words().worksheet;
  }

  // Kurdish and Arabic read right to left (LANG-2).
  readsRightToLeft(): boolean {
    return directions[this.language] === 'rtl';
  }

  // The file's name: its word, then the day it was made in the platform's
  // time, `2026-11-18`, in Western digits.
  fileName(day: string): string {
    return `${this.words().file} ${day}.xlsx`;
  }
}
