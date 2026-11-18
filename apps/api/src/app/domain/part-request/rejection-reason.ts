import { NotValidError } from '@pcp/core';
import { Either } from 'effect';

import { holdsText, lengthOf } from '../vendor/detail-text';
import { partRequestDetailRefused } from './part-request-errors';

// The longest reason the Admin may give for rejecting a Part Request, in
// characters as `lengthOf` counts them.
export const longestRejectionReason = 300;

// The Admin's reason for rejecting a Part Request, kept as the Admin wrote
// it, in any language, so that the Vendor reads it so (REQ-2); or the
// refusal of one that is missing, only spaces, or too long, naming
// `reason`. No Vendor is turned down without one.
export function checkedRejectionReason(
  typed: string | null,
): Either.Either<string, NotValidError> {
  if (!holdsText(typed)) return Either.left(partRequestDetailRefused('reason', 'missing'));
  if (lengthOf(typed) > longestRejectionReason) {
    return Either.left(partRequestDetailRefused('reason', 'tooLong'));
  }

  return Either.right(typed);
}
