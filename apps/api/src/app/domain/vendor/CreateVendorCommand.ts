import { Injectable, Logger } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { identityServiceUnavailable, isLoginNameTaken } from '../login/login-errors';
import { CreateLoginParams, LoginStore } from '../login/LoginStore';
import { makeTemporaryPassword } from '../login/temporary-password';
import { Vendor } from './Vendor';
import { UncheckedVendorDetails, VendorDetails } from './VendorDetails';
import { vendorDetailRefused } from './vendor-errors';
import { CreateVendorParams, VendorStore } from './VendorStore';

// Every detail of the new Vendor as it was typed, before it is checked.
class Input {
  constructor(private readonly details: UncheckedVendorDetails) {}

  getDetails(): UncheckedVendorDetails {
    return this.details;
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
    // Every check comes before anything is made in Keycloak.
    const checked = VendorDetails.check(input.getDetails());
    if (Either.isLeft(checked)) return Either.left(checked.left);
    const details = checked.right;
    const loginPhoneNumber = details.getLoginPhoneNumber();

    const holder = await this.vendorStore.readByLoginPhoneNumber(loginPhoneNumber);
    if (Either.isLeft(holder)) return Either.left(holder.left);
    if (Option.isSome(holder.right)) {
      return Either.left(vendorDetailRefused('loginPhoneNumber', 'taken'));
    }

    const temporaryPassword = makeTemporaryPassword();
    const login = await this.loginStore.create(
      new CreateLoginParams(
        loginPhoneNumber.getInternational(),
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
        details.getName(),
        details.getCity(),
        details.getContactDetails(),
        loginPhoneNumber,
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
