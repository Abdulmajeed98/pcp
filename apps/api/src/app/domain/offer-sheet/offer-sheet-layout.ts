import { NotValidError } from '@pcp/core';
import {
  type DashboardMessages,
  dashboardMessages,
  directions,
  type Language,
  languages,
} from '@pcp/i18n';
import { Either } from 'effect';

import { holdsText } from '../vendor/detail-text';
import { offerSheetLanguageRefused } from './offer-sheet-errors';
import type { OfferSheetCellRead } from './OfferSheetFile';

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

// The largest file an upload takes, 5 MB, many times what a file of 5,000
// rows weighs.
export const largestOfferSheetBytes = 5 * 1024 * 1024;

// A heading or a word as an upload compares it: trimmed, its case folded.
function compared(text: string): string {
  return text.trim().toLowerCase();
}

// A word of the file in each of the three languages, as compared. The words
// are read when they are needed, never as the module loads, as every reading
// of `@pcp/i18n`'s words in the API is.
function inEveryLanguage(
  word: (words: DashboardMessages['OfferSheetFile']) => string,
): ReadonlySet<string> {
  return new Set(
    languages.map((language) => compared(word(dashboardMessages[language].OfferSheetFile))),
  );
}

// Whether a file is the platform's layout (SHT-7): each of its first row's
// cells A to F holds its column's heading in any of the three languages,
// trimmed and with its case folded. Each column is matched on its own, so
// headings of different languages are taken together, and the columns after
// F are not read.
export function isTheLayout(headings: readonly OfferSheetCellRead[]): boolean {
  return offerSheetColumns.every((column, index) => {
    const cell = headings[index];
    return (
      cell?.kind === 'text' &&
      inEveryLanguage((words) => words.headings[column]).has(compared(cell.text))
    );
  });
}

// Whether a word says the Part is in stock, in any of the three languages,
// trimmed and with its case folded: true for yes, false for no, and none for
// any other word.
export function inStockSaidBy(word: string): boolean | undefined {
  const said = compared(word);
  if (inEveryLanguage((words) => words.yes).has(said)) return true;
  if (inEveryLanguage((words) => words.no).has(said)) return false;
  return undefined;
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
