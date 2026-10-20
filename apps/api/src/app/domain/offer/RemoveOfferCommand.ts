import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { VendorAccessRule } from '../vendor/VendorAccessRule';
import { offerNotFound } from './offer-errors';
import { OfferStore, RemoveOfferParams } from './OfferStore';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly callerRoles: readonly Role[],
    private readonly vendorId: string,
    private readonly offerId: string,
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

  getOfferId(): string {
    return this.offerId;
  }
}

export { Input as RemoveOfferCommandInput };

// A Vendor removes one of its Offers, for a Part it no longer sells (OFF-4),
// or the Admin removes it for the Vendor, by the rule for which Vendor a
// request acts for. The removal is added to the Offer's history with the
// Caller, at now by the API's clock, and the history's earlier rows stay, so
// that it goes on when the Vendor offers the Part again (OFF-10). Another
// Vendor's Offer is answered as one that does not exist.
@Injectable()
export class RemoveOfferCommand {
  constructor(
    private readonly vendorAccessRule: VendorAccessRule,
    private readonly offerStore: OfferStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<void, StructuredError>> {
    const actedFor = await this.vendorAccessRule.vendorActedFor(
      input.getCallerId(),
      input.getCallerRoles(),
      input.getVendorId(),
    );
    if (Either.isLeft(actedFor)) return Either.left(actedFor.left);

    const removed = await this.offerStore.remove(
      new RemoveOfferParams(
        actedFor.right.getId(),
        input.getOfferId(),
        new Date(),
        input.getCallerId(),
      ),
    );

    return Either.flatMap(removed, (wasThere) =>
      wasThere ? Either.right(undefined) : Either.left(offerNotFound(input.getOfferId())),
    );
  }
}
