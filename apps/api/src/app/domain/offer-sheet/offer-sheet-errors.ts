import { NotValidError } from '@pcp/core';

// Why the language an Offer sheet was asked for in was refused: none was
// given, or it is not one of the platform's three.
export type OfferSheetLanguageRefusal = 'missing' | 'notInTheSet';

// The language of a download that does not fit, naming `language` and why.
export function offerSheetLanguageRefused(
  reason: OfferSheetLanguageRefusal,
): NotValidError {
  return NotValidError.of(
    'NOT_VALID',
    `The Offer sheet's language was refused: ${reason}`,
    { field: 'language', reason },
  );
}

// Why an uploaded file was refused as a whole, with nothing applied, in the
// order they are checked: no file was sent; it is too large; it is not an
// .xlsx file that can be read within bounds; its first worksheet's first
// row is not the six headings (SHT-7); or it holds too many rows that are
// not empty.
export type OfferSheetFileRefusal =
  | 'missing'
  | 'tooLarge'
  | 'notReadable'
  | 'notTheLayout'
  | 'tooManyRows';

// An uploaded file refused as a whole, naming `offerSheet` and why.
export function offerSheetRefused(reason: OfferSheetFileRefusal): NotValidError {
  return NotValidError.of('NOT_VALID', `The Offer sheet was refused: ${reason}`, {
    field: 'offerSheet',
    reason,
  });
}
