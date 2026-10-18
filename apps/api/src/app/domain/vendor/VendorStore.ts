import { PageableAttributes, PageAttributes, StructuredError } from '@pcp/core';
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

// One page of the Vendors, in name order, and where the page stands among
// them all.
export class VendorsPage {
  constructor(
    private readonly vendors: readonly Vendor[],
    private readonly page: PageAttributes,
  ) {}

  getVendors(): readonly Vendor[] {
    return this.vendors;
  }

  getPageAttributes(): PageAttributes {
    return this.page;
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

  // Every Vendor, active and deactivated, ordered by name and then by
  // identifier, so that moving between pages never skips or repeats one.
  abstract list(
    pageable: PageableAttributes,
  ): Promise<Either.Either<VendorsPage, StructuredError>>;

  // The Vendor with this identifier, or none when there is no such Vendor.
  abstract readById(
    id: string,
  ): Promise<Either.Either<Option.Option<Vendor>, StructuredError>>;

  // The Vendor whose login phone number this is, or none.
  abstract readByLoginPhoneNumber(
    loginPhoneNumber: PhoneNumber,
  ): Promise<Either.Either<Option.Option<Vendor>, StructuredError>>;
}
