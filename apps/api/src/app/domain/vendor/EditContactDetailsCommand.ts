import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { ContactDetails, UncheckedContactDetails } from './ContactDetails';
import { Vendor } from './Vendor';
import { VendorAccessRule } from './VendorAccessRule';
import { vendorNotFound } from './vendor-errors';
import { EditContactDetailsParams, VendorStore } from './VendorStore';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly callerRoles: readonly Role[],
    private readonly vendorId: string,
    private readonly contactDetails: UncheckedContactDetails,
  ) {}

  // The identifier of the Login the request was made with.
  getCallerId(): string {
    return this.callerId;
  }

  getCallerRoles(): readonly Role[] {
    return this.callerRoles;
  }

  getVendorId(): string {
    return this.vendorId;
  }

  getContactDetails(): UncheckedContactDetails {
    return this.contactDetails;
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

export { Input as EditContactDetailsCommandInput };
export { Output as EditContactDetailsCommandOutput };

// A Vendor changes its contact details itself, with no one's approval
// (ACC-8), or the Admin changes them for it, by the rule for which Vendor a
// request acts for. They are replaced as a whole, so a detail the Vendor may
// leave out and that is left out is cleared, and each is checked as when the
// Vendor was created. Its name, its city and its login phone number stay.
@Injectable()
export class EditContactDetailsCommand {
  constructor(
    private readonly vendorAccessRule: VendorAccessRule,
    private readonly vendorStore: VendorStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Who may act comes first, so that a Vendor learns nothing about another
    // Vendor from the refusal of a detail.
    const actedFor = await this.vendorAccessRule.vendorActedFor(
      input.getCallerId(),
      input.getCallerRoles(),
      input.getVendorId(),
    );
    if (Either.isLeft(actedFor)) return Either.left(actedFor.left);

    const contactDetails = ContactDetails.check(input.getContactDetails());
    if (Either.isLeft(contactDetails)) return Either.left(contactDetails.left);

    const vendorId = actedFor.right.getId();
    const edited = await this.vendorStore.editContactDetails(
      new EditContactDetailsParams(vendorId, contactDetails.right),
    );

    return Either.flatMap(edited, (editedVendor) =>
      Option.match(editedVendor, {
        onNone: () => Either.left(vendorNotFound(vendorId)),
        onSome: (vendor) => Either.right(Output.of(vendor)),
      }),
    );
  }
}
