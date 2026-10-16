import { Injectable, Logger } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { identityServiceUnavailable, isLoginNameTaken } from '../login/login-errors';
import { CreateLoginParams, LoginStore } from '../login/LoginStore';
import { makeTemporaryPassword } from '../login/temporary-password';
import { PhoneNumber } from '../phone-number/PhoneNumber';
import { City } from './City';
import { ContactDetails, TypedContactDetails } from './ContactDetails';
import { holdsText, lengthOf } from './text-as-written';
import { Vendor } from './Vendor';
import { vendorDetailRefused } from './vendor-errors';
import { CreateVendorParams, VendorStore } from './VendorStore';

// The longest name a Vendor may have, in characters as `lengthOf` counts
// them.
export const longestVendorName = 100;

// A Vendor's details as they were typed, before they are checked. A detail
// that was not given is null.
class Input {
  constructor(
    private readonly name: string | null,
    private readonly cityKey: string | null,
    private readonly contactDetails: TypedContactDetails,
    private readonly loginPhoneNumber: string | null,
  ) {}

  getName(): string | null {
    return this.name;
  }

  // The key of the city it names.
  getCityKey(): string | null {
    return this.cityKey;
  }

  getContactDetails(): TypedContactDetails {
    return this.contactDetails;
  }

  getLoginPhoneNumber(): string | null {
    return this.loginPhoneNumber;
  }
}

class Output {
  private constructor(
    private readonly vendor: Vendor,
    private readonly temporaryPassword: string,
  ) {}

  static of(vendor: Vendor, temporaryPassword: string): Output {
    return new Output(vendor, temporaryPassword);
  }

  getVendor(): Vendor {
    return this.vendor;
  }

  // The Login's temporary password. This answer is the only place it is kept.
  getTemporaryPassword(): string {
    return this.temporaryPassword;
  }
}

export { Input as CreateVendorCommandInput };
export { Output as CreateVendorCommandOutput };

// The Admin creates a Vendor, and with it the Vendor's Login, named by its
// login phone number and holding a temporary password the platform makes.
// The Login is made first and the Vendor second, and the Login is deleted
// again when the Vendor cannot be stored (ADR-0009).
@Injectable()
export class CreateVendorCommand {
  private readonly logger = new Logger(CreateVendorCommand.name);

  constructor(
    private readonly vendorStore: VendorStore,
    private readonly loginStore: LoginStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Every check comes before anything is made in Keycloak, and the first
    // detail that does not fit, in the order the Vendor form asks for them,
    // is the one named.
    const name = input.getName();
    if (!holdsText(name)) return Either.left(vendorDetailRefused('name', 'missing'));
    if (lengthOf(name) > longestVendorName) {
      return Either.left(vendorDetailRefused('name', 'tooLong'));
    }

    const cityKey = input.getCityKey();
    if (cityKey === null) return Either.left(vendorDetailRefused('city', 'missing'));
    const city = City.withKey(cityKey);
    if (city === undefined) return Either.left(vendorDetailRefused('city', 'notInTheSet'));

    const contactDetails = ContactDetails.check(input.getContactDetails());
    if (Either.isLeft(contactDetails)) return Either.left(contactDetails.left);

    const typedLoginPhoneNumber = input.getLoginPhoneNumber();
    if (!holdsText(typedLoginPhoneNumber)) {
      return Either.left(vendorDetailRefused('loginPhoneNumber', 'missing'));
    }
    const loginPhoneNumber = PhoneNumber.readMobile(typedLoginPhoneNumber);
    if (Either.isLeft(loginPhoneNumber)) {
      return Either.left(vendorDetailRefused('loginPhoneNumber', loginPhoneNumber.left));
    }

    const holder = await this.vendorStore.readByLoginPhoneNumber(loginPhoneNumber.right);
    if (Either.isLeft(holder)) return Either.left(holder.left);
    if (Option.isSome(holder.right)) {
      return Either.left(vendorDetailRefused('loginPhoneNumber', 'taken'));
    }

    const temporaryPassword = makeTemporaryPassword();
    const login = await this.loginStore.create(
      new CreateLoginParams(
        loginPhoneNumber.right.getInternational(),
        Role.VENDOR,
        temporaryPassword,
      ),
    );
    if (Either.isLeft(login)) {
      // A Login with no Vendor behind it holds the number, as when putting
      // one back failed: it stays taken until the Login is deleted in
      // Keycloak's own console.
      return Either.left(
        isLoginNameTaken(login.left)
          ? vendorDetailRefused('loginPhoneNumber', 'taken')
          : login.left,
      );
    }

    const vendor = await this.vendorStore.create(
      new CreateVendorParams(
        name,
        city,
        contactDetails.right,
        loginPhoneNumber.right,
        login.right,
      ),
    );
    if (Either.isLeft(vendor)) {
      const deleted = await this.loginStore.delete(login.right);
      if (Either.isLeft(deleted)) {
        // Two failures in a row: the Login is left with no Vendor behind it,
        // holding the number, until it is deleted in Keycloak's own console.
        this.logger.error(
          `The Login ${login.right} was made for a Vendor that could not be stored, and could not be deleted`,
        );
        return Either.left(
          identityServiceUnavailable(`The Login ${login.right} could not be deleted`),
        );
      }
      return Either.left(vendor.left);
    }

    return Either.right(Output.of(vendor.right, temporaryPassword));
  }
}
