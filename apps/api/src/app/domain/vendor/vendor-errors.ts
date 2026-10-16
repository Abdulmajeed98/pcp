import { NotFoundError, NotValidError } from '@pcp/core';

// The error for a Vendor that does not exist, the same for every use case.
export function vendorNotFound(vendorId: string): NotFoundError {
  return NotFoundError.of('VENDOR_NOT_FOUND', `There is no Vendor ${vendorId}`);
}

// A detail of a Vendor that does not fit, naming its field and why, so that a
// form can say what is wrong beside the field.
export function vendorDetailRefused(field: string, reason: string): NotValidError {
  return NotValidError.of('NOT_VALID', `The Vendor's ${field} was refused: ${reason}`, {
    field,
    reason,
  });
}
