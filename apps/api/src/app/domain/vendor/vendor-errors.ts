import { ForbiddenError, NotFoundError, NotValidError } from '@pcp/core';

import { PhoneNumberRefusal } from '../phone-number/PhoneNumber';
import { InstagramNameRefusal } from './instagram-name';
import { MapLocationRefusal } from './MapLocation';

// The details of a Vendor a refusal can name.
export type VendorField =
  | 'name'
  | 'city'
  | 'address'
  | 'mapLocation'
  | 'mapLocation.latitude'
  | 'mapLocation.longitude'
  | 'phoneNumber'
  | 'whatsAppNumber'
  | 'instagramName'
  | 'openingHours'
  | 'loginPhoneNumber';

// Why a detail was refused: it is missing, it is too long, it is not one of a
// fixed set, it is a phone number of the wrong kind, it is a place outside
// Iraq, it is not an Instagram name, or another Vendor or Login holds it.
export type VendorDetailRefusal =
  | 'missing'
  | 'tooLong'
  | 'notInTheSet'
  | 'taken'
  | PhoneNumberRefusal
  | MapLocationRefusal
  | InstagramNameRefusal;

// The error for a Vendor that does not exist, the same for every use case.
export function vendorNotFound(vendorId: string): NotFoundError {
  return NotFoundError.of('VENDOR_NOT_FOUND', `There is no Vendor ${vendorId}`);
}

// The error for a Login with no Vendor behind it, answered as a Vendor that
// does not exist is.
export function callersVendorNotFound(loginId: string): NotFoundError {
  return NotFoundError.of(
    'VENDOR_NOT_FOUND',
    `There is no Vendor behind the Login ${loginId}`,
  );
}

// The error for a Vendor's Login that names a Vendor other than its own,
// the same whether that Vendor exists or not.
export function vendorAccessDenied(loginId: string, vendorId: string): ForbiddenError {
  return ForbiddenError.of(
    'VENDOR_ACCESS_DENIED',
    `The Login ${loginId} may not act for the Vendor ${vendorId}`,
  );
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
