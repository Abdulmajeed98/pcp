import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { VendorAccessRule } from '../vendor/VendorAccessRule';
import { Offer } from './Offer';
import { offerNotFound } from './offer-errors';
import { OfferStore } from './OfferStore';

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

class Output {
  private constructor(private readonly offer: Offer) {}

  static of(offer: Offer): Output {
    return new Output(offer);
  }

  getOffer(): Offer {
    return this.offer;
  }
}

export { Input as ReadOfferQueryInput };
export { Output as ReadOfferQueryOutput };

// One of a Vendor's Offers, with its Part, for the Admin or for the Vendor's
// own Login, by the rule for which Vendor a request acts for. Another
// Vendor's Offer is answered as one that does not exist.
@Injectable()
export class ReadOfferQuery {
  constructor(
    private readonly vendorAccessRule: VendorAccessRule,
    private readonly offerStore: OfferStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const actedFor = await this.vendorAccessRule.vendorActedFor(
      input.getCallerId(),
      input.getCallerRoles(),
      input.getVendorId(),
    );
    if (Either.isLeft(actedFor)) return Either.left(actedFor.left);

    const found = await this.offerStore.readById(
      actedFor.right.getId(),
      input.getOfferId(),
    );

    return Either.flatMap(found, (offer) =>
      Either.fromOption(offer, () => offerNotFound(input.getOfferId())).pipe(
        Either.map(Output.of),
      ),
    );
  }
}
