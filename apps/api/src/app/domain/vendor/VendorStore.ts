import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { PhoneNumber } from '../phone-number/PhoneNumber';
import { City } from './City';
import { ContactDetails } from './ContactDetails';
import { Vendor } from './Vendor';

export class CreateVendorParams {
  constructor(
    private readonly name: string,
    private readonly city: City,
    private readonly contactDetails: ContactDetails,
    private readonly loginPhoneNumber: PhoneNumber,
    private readonly loginId: string,
  ) {}

  getName(): string {
    return this.name;
  }

  getCity(): City {
    return this.city;
  }

  getContactDetails(): ContactDetails {
    return this.contactDetails;
  }

  getLoginPhoneNumber(): PhoneNumber {
    return this.loginPhoneNumber;
  }

  getLoginId(): string {
    return this.loginId;
  }
}

// Where Vendors are kept. It is the port: the domain says what it needs, and
// infrastructure provides it.
export abstract class VendorStore {
  // Stores a new Vendor, active. Two Vendors never share a login phone number
  // or a Login.
  abstract create(
    params: CreateVendorParams,
  ): Promise<Either.Either<Vendor, StructuredError>>;

  // The Vendor with this identifier, or none when there is no such Vendor.
  abstract readById(
    id: string,
  ): Promise<Either.Either<Option.Option<Vendor>, StructuredError>>;

  // The Vendor whose login phone number this is, or none.
  abstract readByLoginPhoneNumber(
    loginPhoneNumber: PhoneNumber,
  ): Promise<Either.Either<Option.Option<Vendor>, StructuredError>>;
}
