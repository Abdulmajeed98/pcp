import { NotValidError } from '@pcp/core';

// Why a rate was refused: it was not given; it is not a number; it is not a
// whole number of dinars; or it is outside the allowed range.
export type PlatformRateRefusal = 'missing' | 'notANumber' | 'notWhole' | 'outOfRange';

// A rate that does not fit, naming its field and why, so that a form can say
// what is wrong beside the field. The refusal names no limit, as the Offers'
// limits do not.
export function platformRateRefused(reason: PlatformRateRefusal): NotValidError {
  return NotValidError.of('NOT_VALID', `The Platform Rate was refused: ${reason}`, {
    field: 'iqdPerUsd',
    reason,
  });
}
