import { NotValidError } from '@pcp/core';

// Why a Build's `part` values are refused.
export type PartRefusalReason =
  | 'notAnIdentifier'
  | 'notAQuantity'
  | 'repeated'
  | 'quantityGiven'
  | 'quantityMissing'
  | 'twoOfACategory'
  | 'tooMany';

// A Build refused, naming `part`, the request's parameter, with its reason.
export function partNotValid(reason: PartRefusalReason, message: string): NotValidError {
  return NotValidError.of('NOT_VALID', message, { field: 'part', reason });
}
