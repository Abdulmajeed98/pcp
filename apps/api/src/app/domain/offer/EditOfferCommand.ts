import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { VendorAccessRule } from '../vendor/VendorAccessRule';
import { Offer } from './Offer';
import { OfferDetails, UncheckedOfferDetails } from './OfferDetails';
import { offerNotFound } from './offer-errors';
import { EditOfferParams, OfferStore } from './OfferStore';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly callerRoles: readonly Role[],
    private readonly vendorId: string,
    private readonly offerId: string,
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

  getOfferId(): string {
    return this.offerId;
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

export { Input as EditOfferCommandInput };
export { Output as EditOfferCommandOutput };

// A Vendor changes one of its Offers, its prices, its stock and its warranty
// (OFF-4), or the Admin changes it for the Vendor, by the rule for which
// Vendor a request acts for. The details given replace all the Offer had, so
// a detail left out is cleared. Saving it, changed or not, is a Confirmation,
// whose time is now by the API's clock (OFF-5), so an Expired Offer saved is
// current again at once. A change to the prices or the stock is added to the
// Offer's history with the Caller (OFF-10). Another Vendor's Offer is
// answered as one that does not exist.
@Injectable()
export class EditOfferCommand {
  constructor(
    private readonly vendorAccessRule: VendorAccessRule,
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

    const details = OfferDetails.check(input.getDetails());
    if (Either.isLeft(details)) return Either.left(details.left);

    // Whether the prices or the stock changed is decided by the Store, against
    // the Offer as it stands when it is changed, so that two changes at once
    // each add the row their own change needs.
    const edited = await this.offerStore.edit(
      new EditOfferParams(
        actedFor.right.getId(),
        input.getOfferId(),
        details.right,
        new Date(),
        input.getCallerId(),
      ),
    );

    return Either.flatMap(edited, (offer) =>
      Either.fromOption(offer, () => offerNotFound(input.getOfferId())).pipe(
        Either.map(Output.of),
      ),
    );
  }
}
