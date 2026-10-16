import { NotFoundError, NotValidError } from '@pcp/core';

import { PhoneNumberRefusal } from '../phone-number/PhoneNumber';

// The details of a Vendor a refusal can name.
type VendorField = 'name' | 'city' | 'loginPhoneNumber';

// Why a detail was refused: it is missing, it is too long, it is not one of a
// fixed set, it is a phone number of the wrong kind, or another Vendor or
// Login holds it.
type VendorDetailRefusal =
  | 'missing'
  | 'tooLong'
  | 'notInTheSet'
  | 'taken'
  | PhoneNumberRefusal;

// The error for a Vendor that does not exist, the same for every use case.
export function vendorNotFound(vendorId: string): NotFoundError {
  return NotFoundError.of('VENDOR_NOT_FOUND', `There is no Vendor ${vendorId}`);
}

// A detail of a Vendor that does not fit, naming its field and why, so that a
// form can say what is wrong beside the field.
export function vendorDetailRefused(
  field: VendorField,
  reason: VendorDetailRefusal,
): NotValidError {
  return NotValidError.of('NOT_VALID', `The Vendor's ${field} was refused: ${reason}`, {
    field,
    reason,
  });
}
