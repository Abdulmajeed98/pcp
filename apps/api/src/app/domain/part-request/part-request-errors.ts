import { NotFoundError, NotValidError } from '@pcp/core';

// The details of a Part Request a refusal can name, the Offer's apart, which
// `OfferDetails.check` names; and the reason the Admin gives for rejecting
// one.
export type PartRequestField = 'category' | 'name' | 'partNumber' | 'reason';

// Why a detail was refused: it is missing, it is too long, or it is not one
// of a fixed set.
export type PartRequestDetailRefusal = 'missing' | 'tooLong' | 'notInTheSet';

// The error for a Part Request that does not exist, the same for every use
// case, and for a text that is not an identifier.
export function partRequestNotFound(partRequestId: string): NotFoundError {
  return NotFoundError.of(
    'PART_REQUEST_NOT_FOUND',
    `There is no Part Request ${partRequestId}`,
  );
}

// The error for a Part Request the Admin has already fulfilled or rejected,
// which is resolved once only, so that a screen can show how it was
// resolved instead.
export function partRequestResolved(partRequestId: string): NotValidError {
  return NotValidError.of(
    'PART_REQUEST_RESOLVED',
    `The Part Request ${partRequestId} is already resolved`,
  );
}

// A detail of a Part Request that does not fit, naming its field and why, so
// that a form can say what is wrong beside the field.
export function partRequestDetailRefused(
  field: PartRequestField,
  reason: PartRequestDetailRefusal,
): NotValidError {
  return NotValidError.of(
    'NOT_VALID',
    `The Part Request's ${field} was refused: ${reason}`,
    { field, reason },
  );
}
