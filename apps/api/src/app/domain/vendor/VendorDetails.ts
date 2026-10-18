import { NotValidError } from '@pcp/core';
import { Either } from 'effect';

import { PhoneNumber } from '../phone-number/PhoneNumber';
import { City } from './City';
import { ContactDetails, UncheckedContactDetails } from './ContactDetails';
import { holdsText, lengthOf } from './detail-text';
import { vendorDetailRefused } from './vendor-errors';

// The longest name a Vendor may have, in characters as `lengthOf` counts
// them.
export const longestVendorName = 100;

// Every detail of a Vendor as it was typed, before it is checked: what
// creating a Vendor and the Admin's edit both send. A detail that was not
// given is null.
export class UncheckedVendorDetails {
  constructor(
    private readonly name: string | null,
    private readonly cityKey: string | null,
    private readonly contactDetails: UncheckedContactDetails,
    private readonly loginPhoneNumber: string | null,
  ) {}

  getName(): string | null {
    return this.name;
  }

  // The key of the city it names.
  getCityKey(): string | null {
    return this.cityKey;
  }

  getContactDetails(): UncheckedContactDetails {
    return this.contactDetails;
  }

  getLoginPhoneNumber(): string | null {
    return this.loginPhoneNumber;
  }
}

// Every detail of a Vendor as it will be kept: its name, its city, its
// contact details and its login phone number.
export class VendorDetails {
  private constructor(
    private readonly name: string,
    private readonly city: City,
    private readonly contactDetails: ContactDetails,
    private readonly loginPhoneNumber: PhoneNumber,
  ) {}

  // The details as they will be kept, or the refusal of the first that does
  // not fit, in the order the Vendor form asks for them.
  static check(typed: UncheckedVendorDetails): Either.Either<VendorDetails, NotValidError> {
    const name = typed.getName();
    if (!holdsText(name)) return Either.left(vendorDetailRefused('name', 'missing'));
    if (lengthOf(name) > longestVendorName) {
      return Either.left(vendorDetailRefused('name', 'tooLong'));
    }

    const cityKey = typed.getCityKey();
    if (!holdsText(cityKey)) return Either.left(vendorDetailRefused('city', 'missing'));
    const city = City.withKey(cityKey);
    if (city === undefined) return Either.left(vendorDetailRefused('city', 'notInTheSet'));

    const contactDetails = ContactDetails.check(typed.getContactDetails());
    if (Either.isLeft(contactDetails)) return Either.left(contactDetails.left);

    const typedLoginPhoneNumber = typed.getLoginPhoneNumber();
    if (!holdsText(typedLoginPhoneNumber)) {
      return Either.left(vendorDetailRefused('loginPhoneNumber', 'missing'));
    }
    const loginPhoneNumber = PhoneNumber.readMobile(typedLoginPhoneNumber);
    if (Either.isLeft(loginPhoneNumber)) {
      return Either.left(vendorDetailRefused('loginPhoneNumber', loginPhoneNumber.left));
    }

    return Either.right(
      new VendorDetails(name, city, contactDetails.right, loginPhoneNumber.right),
    );
  }

  // As the Vendor writes it.
  getName(): string {
    return this.name;
  }

  getCity(): City {
    return this.city;
  }

  getContactDetails(): ContactDetails {
    return this.contactDetails;
  }

  // Always a mobile number.
  getLoginPhoneNumber(): PhoneNumber {
    return this.loginPhoneNumber;
  }
}
