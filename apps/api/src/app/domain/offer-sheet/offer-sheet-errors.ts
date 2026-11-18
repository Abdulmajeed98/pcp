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
