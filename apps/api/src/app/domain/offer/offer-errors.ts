import { NotFoundError, NotValidError } from '@pcp/core';

// The details of an Offer a refusal can name.
export type OfferField = 'partId' | 'usdPrice' | 'iqdPrice' | 'inStock' | 'warrantyMonths';

// Why a detail was refused: it is missing, which for a price means that
// neither was given; it is not a number; it is zero or less; it has more
// decimal places than its currency has; it is over its limit; it is not a
// whole number of months; or the Vendor already has an Offer for the Part.
export type OfferDetailRefusal =
  | 'missing'
  | 'notANumber'
  | 'notPositive'
  | 'tooManyDecimals'
  | 'tooLarge'
  | 'notWholeMonths'
  | 'taken';

// The error for an Offer that does not exist, or is another Vendor's, the
// same for both, so that a Vendor learns nothing of another's Offers.
export function offerNotFound(offerId: string): NotFoundError {
  return NotFoundError.of('OFFER_NOT_FOUND', `The Vendor has no Offer ${offerId}`);
}

// A detail of an Offer that does not fit, naming its field and why, so that a
// form can say what is wrong beside the field.
export function offerDetailRefused(
  field: OfferField,
  reason: OfferDetailRefusal,
): NotValidError {
  return NotValidError.of('NOT_VALID', `The Offer's ${field} was refused: ${reason}`, {
    field,
    reason,
  });
}
