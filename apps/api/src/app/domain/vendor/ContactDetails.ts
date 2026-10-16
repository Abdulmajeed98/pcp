import { NotValidError } from '@pcp/core';
import { Either } from 'effect';

import { PhoneNumber } from '../phone-number/PhoneNumber';
import { readInstagramName } from './instagram-name';
import { MapLocation } from './MapLocation';
import { holdsText, lengthOf } from './text-as-written';
import { vendorDetailRefused } from './vendor-errors';

// The longest address and opening hours a Vendor may have, in characters as
// `lengthOf` counts them.
export const longestAddress = 300;
export const longestOpeningHours = 300;

// A detail a Vendor may leave out, left empty in a form, is taken as not
// given.
function givenText(text: string | null): string | null {
  return holdsText(text) ? text : null;
}

// A Vendor's contact details as they were typed, before they are checked.
// A detail that was not given is null.
export class TypedContactDetails {
  constructor(
    private readonly address: string | null,
    private readonly latitude: number | null,
    private readonly longitude: number | null,
    private readonly phoneNumber: string | null,
    private readonly whatsAppNumber: string | null,
    private readonly instagramName: string | null,
    private readonly openingHours: string | null,
  ) {}

  getAddress(): string | null {
    return this.address;
  }

  getLatitude(): number | null {
    return this.latitude;
  }

  getLongitude(): number | null {
    return this.longitude;
  }

  getPhoneNumber(): string | null {
    return this.phoneNumber;
  }

  getWhatsAppNumber(): string | null {
    return this.whatsAppNumber;
  }

  getInstagramName(): string | null {
    return this.instagramName;
  }

  getOpeningHours(): string | null {
    return this.openingHours;
  }
}

// A Vendor's address, map location, phone number, WhatsApp number, Instagram
// name and opening hours: the details the Vendor may change itself. Those it
// may leave out are null when it has none.
export class ContactDetails {
  constructor(
    private readonly address: string,
    private readonly mapLocation: MapLocation | null,
    private readonly phoneNumber: PhoneNumber,
    private readonly whatsAppNumber: PhoneNumber | null,
    private readonly instagramName: string | null,
    private readonly openingHours: string | null,
  ) {}

  // The contact details as they will be kept, or the refusal of the first
  // that does not fit, in the order the Vendor form asks for them.
  static check(typed: TypedContactDetails): Either.Either<ContactDetails, NotValidError> {
    const address = typed.getAddress();
    if (!holdsText(address)) return Either.left(vendorDetailRefused('address', 'missing'));
    if (lengthOf(address) > longestAddress) {
      return Either.left(vendorDetailRefused('address', 'tooLong'));
    }

    const latitude = typed.getLatitude();
    const longitude = typed.getLongitude();
    if (latitude === null && longitude !== null) {
      return Either.left(vendorDetailRefused('mapLocation.latitude', 'missing'));
    }
    if (latitude !== null && longitude === null) {
      return Either.left(vendorDetailRefused('mapLocation.longitude', 'missing'));
    }
    let mapLocation: MapLocation | null = null;
    if (latitude !== null && longitude !== null) {
      const location = MapLocation.of(latitude, longitude);
      if (Either.isLeft(location)) {
        return Either.left(vendorDetailRefused('mapLocation', location.left));
      }
      mapLocation = location.right;
    }

    const typedPhoneNumber = typed.getPhoneNumber();
    if (!holdsText(typedPhoneNumber)) {
      return Either.left(vendorDetailRefused('phoneNumber', 'missing'));
    }
    const phoneNumber = PhoneNumber.read(typedPhoneNumber);
    if (Either.isLeft(phoneNumber)) {
      return Either.left(vendorDetailRefused('phoneNumber', phoneNumber.left));
    }

    const typedWhatsAppNumber = givenText(typed.getWhatsAppNumber());
    let whatsAppNumber: PhoneNumber | null = null;
    if (typedWhatsAppNumber !== null) {
      const read = PhoneNumber.readMobile(typedWhatsAppNumber);
      if (Either.isLeft(read)) {
        return Either.left(vendorDetailRefused('whatsAppNumber', read.left));
      }
      whatsAppNumber = read.right;
    }

    const typedInstagramName = givenText(typed.getInstagramName());
    let instagramName: string | null = null;
    if (typedInstagramName !== null) {
      const read = readInstagramName(typedInstagramName);
      if (Either.isLeft(read)) {
        return Either.left(vendorDetailRefused('instagramName', read.left));
      }
      instagramName = read.right;
    }

    const openingHours = givenText(typed.getOpeningHours());
    if (openingHours !== null && lengthOf(openingHours) > longestOpeningHours) {
      return Either.left(vendorDetailRefused('openingHours', 'tooLong'));
    }

    return Either.right(
      new ContactDetails(
        address,
        mapLocation,
        phoneNumber.right,
        whatsAppNumber,
        instagramName,
        openingHours,
      ),
    );
  }

  // As it was written, on one or more lines.
  getAddress(): string {
    return this.address;
  }

  getMapLocation(): MapLocation | null {
    return this.mapLocation;
  }

  // A mobile number or a landline.
  getPhoneNumber(): PhoneNumber {
    return this.phoneNumber;
  }

  // Always a mobile number.
  getWhatsAppNumber(): PhoneNumber | null {
    return this.whatsAppNumber;
  }

  // Bare, with no @ before it, and in lower case.
  getInstagramName(): string | null {
    return this.instagramName;
  }

  // As they were written, on one or more lines.
  getOpeningHours(): string | null {
    return this.openingHours;
  }
}
