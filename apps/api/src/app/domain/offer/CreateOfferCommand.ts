import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { partNotFound } from '../part/part-errors';
import { PartStore } from '../part/PartStore';
import { VendorAccessRule } from '../vendor/VendorAccessRule';
import { Offer } from './Offer';
import { OfferDetails, UncheckedOfferDetails } from './OfferDetails';
import { CreateOfferParams, OfferStore } from './OfferStore';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly callerRoles: readonly Role[],
    private readonly vendorId: string,
    private readonly partId: string,
    private readonly details: UncheckedOfferDetails,
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

  getPartId(): string {
    return this.partId;
  }

  getDetails(): UncheckedOfferDetails {
    return this.details;
  }
}

class Output {
  private constructor(private readonly offer: Offer) {}

  static of(offer: Offer): Output {
    return new Output(offer);
  }

  getOffer(): Offer {
    return this.offer;
  }
}

export { Input as CreateOfferCommandInput };
export { Output as CreateOfferCommandOutput };

// A Vendor adds an Offer for any Part in the catalog (OFF-3), or the Admin
// adds it for the Vendor, by the rule for which Vendor a request acts for.
// Adding it is its first Confirmation, whose time is now by the API's clock
// (OFF-5), and the first row of its history, which records the Caller
// (OFF-10).
@Injectable()
export class CreateOfferCommand {
  constructor(
    private readonly vendorAccessRule: VendorAccessRule,
    private readonly partStore: PartStore,
    private readonly offerStore: OfferStore,
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
    const vendorId = actedFor.right.getId();

    const details = OfferDetails.check(input.getDetails());
    if (Either.isLeft(details)) return Either.left(details.left);

    const partId = input.getPartId();
    const part = await this.partStore.readById(partId);
    if (Either.isLeft(part)) return Either.left(part.left);
    if (Option.isNone(part.right)) return Either.left(partNotFound(partId));

    // A second Offer for the Part is refused by the Store, as taken, by the
    // database's unique pair, so that two requests at once are refused alike.
    // The API's clock, never the database's, gives the time of a
    // Confirmation, so that a test moves time by moving the API's clock.
    const created = await this.offerStore.create(
      new CreateOfferParams(
        vendorId,
        partId,
        details.right,
        new Date(),
        input.getCallerId(),
      ),
    );

    return Either.map(created, Output.of);
  }
}
