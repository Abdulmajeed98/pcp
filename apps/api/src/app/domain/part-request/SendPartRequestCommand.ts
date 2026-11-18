import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { VendorAccessRule } from '../vendor/VendorAccessRule';
import { PartRequest, PartRequestAndOffer } from './PartRequest';
import { PartRequestDetails, UncheckedPartRequestDetails } from './PartRequestDetails';
import { PartRequestStore, SendPartRequestParams } from './PartRequestStore';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly callerRoles: readonly Role[],
    private readonly vendorId: string,
    private readonly details: UncheckedPartRequestDetails,
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

  getDetails(): UncheckedPartRequestDetails {
    return this.details;
  }
}

class Output {
  private constructor(
    private readonly partRequest: PartRequest,
    private readonly sentAt: Date,
  ) {}

  static of(partRequest: PartRequest): Output {
    return new Output(partRequest, partRequest.getSentAt());
  }

  // The request, open, with no Offer yet.
  getPartRequest(): PartRequestAndOffer {
    return new PartRequestAndOffer(this.partRequest, null);
  }

  // Now, by the API's clock, which is when it was sent.
  getReadAt(): Date {
    return this.sentAt;
  }
}

export { Input as SendPartRequestCommandInput };
export { Output as SendPartRequestCommandOutput };

// A Vendor that cannot find a Part in the catalog sends a Part Request for
// it, with the Part's name, its manufacturer part number, its Category and
// the Offer it would make (REQ-1); or the Admin sends one for the Vendor, by
// the rule for which Vendor a request acts for (ACC-6). It is sent at now,
// by the API's clock, and is open until the Admin resolves it.
@Injectable()
export class SendPartRequestCommand {
  constructor(
    private readonly vendorAccessRule: VendorAccessRule,
    private readonly partRequestStore: PartRequestStore,
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

    const details = PartRequestDetails.check(input.getDetails());
    if (Either.isLeft(details)) return Either.left(details.left);

    // The API's clock, never the database's, gives the moment it is sent,
    // so that a test moves time by moving the API's clock.
    const sent = await this.partRequestStore.send(
      new SendPartRequestParams(actedFor.right.getId(), details.right, new Date()),
    );

    return Either.map(sent, Output.of);
  }
}
