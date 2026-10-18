import { Injectable, Logger } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { identityServiceUnavailable, isLoginNameTaken } from '../login/login-errors';
import { LoginStore, RenameLoginParams } from '../login/LoginStore';
import { Vendor } from './Vendor';
import { UncheckedVendorDetails, VendorDetails } from './VendorDetails';
import { vendorDetailRefused, vendorNotFound } from './vendor-errors';
import { EditVendorParams, VendorStore } from './VendorStore';

class Input {
  constructor(
    private readonly vendorId: string,
    private readonly details: UncheckedVendorDetails,
  ) {}

  getVendorId(): string {
    return this.vendorId;
  }

  // Every detail of the Vendor as it was typed, before it is checked.
  getDetails(): UncheckedVendorDetails {
    return this.details;
  }
}

class Output {
  private constructor(private readonly vendor: Vendor) {}

  static of(vendor: Vendor): Output {
    return new Output(vendor);
  }

  getVendor(): Vendor {
    return this.vendor;
  }
}

export { Input as EditVendorCommandInput };
export { Output as EditVendorCommandOutput };

// The Admin edits every detail of a Vendor, its name, its city and its login
// phone number among them (ACC-8). The details are replaced as a whole, so a
// detail the Vendor may leave out and that is left out is cleared, and each
// is checked as when the Vendor was created.
//
// A new login phone number renames the Vendor's Login, so that the Vendor
// logs in with it and the password it had. The Login is renamed first and
// the Vendor second, and the Login's name is put back when the Vendor cannot
// be stored (ADR-0009).
@Injectable()
export class EditVendorCommand {
  private readonly logger = new Logger(EditVendorCommand.name);

  constructor(
    private readonly vendorStore: VendorStore,
    private readonly loginStore: LoginStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const vendorId = input.getVendorId();
    const read = await this.vendorStore.readById(vendorId);
    if (Either.isLeft(read)) return Either.left(read.left);
    if (Option.isNone(read.right)) return Either.left(vendorNotFound(vendorId));
    const vendor = read.right.value;

    // Every check comes before anything is changed in Keycloak.
    const checked = VendorDetails.check(input.getDetails());
    if (Either.isLeft(checked)) return Either.left(checked.left);
    const details = checked.right;

    const oldName = vendor.getLoginPhoneNumber().getInternational();
    const newName = details.getLoginPhoneNumber().getInternational();
    if (newName === oldName) return this.store(vendorId, details);

    const holder = await this.vendorStore.readByLoginPhoneNumber(
      details.getLoginPhoneNumber(),
    );
    if (Either.isLeft(holder)) return Either.left(holder.left);
    if (Option.isSome(holder.right)) {
      return Either.left(vendorDetailRefused('loginPhoneNumber', 'taken'));
    }

    const loginId = vendor.getLoginId();
    const renamed = await this.loginStore.rename(new RenameLoginParams(loginId, newName));
    if (Either.isLeft(renamed)) {
      // A Login with no Vendor behind it may hold the number, as when putting
      // one back failed.
      return Either.left(
        isLoginNameTaken(renamed.left)
          ? vendorDetailRefused('loginPhoneNumber', 'taken')
          : renamed.left,
      );
    }

    const stored = await this.store(vendorId, details);
    if (Either.isRight(stored)) return stored;

    const putBack = await this.loginStore.rename(new RenameLoginParams(loginId, oldName));
    if (Either.isLeft(putBack)) {
      // Two failures in a row: the Login is named by a number its Vendor
      // does not hold, until it is renamed in Keycloak's own console.
      this.logger.error(
        `The Login ${loginId} was renamed for a Vendor that could not be stored, and its name could not be put back`,
      );
      return Either.left(
        identityServiceUnavailable(`The Login ${loginId} could not be renamed back`),
      );
    }
    return stored;
  }

  private async store(
    vendorId: string,
    details: VendorDetails,
  ): Promise<Either.Either<Output, StructuredError>> {
    const edited = await this.vendorStore.edit(new EditVendorParams(vendorId, details));

    return Either.flatMap(edited, (editedVendor) =>
      Option.match(editedVendor, {
        onNone: () => Either.left(vendorNotFound(vendorId)),
        onSome: (vendor) => Either.right(Output.of(vendor)),
      }),
    );
  }
}
