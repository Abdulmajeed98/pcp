import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { OfferStore } from '../offer/OfferStore';
import { PartStore } from '../part/PartStore';
import { toFulfil } from './existing-part-request';
import { OfferFulfilment, offerFulfilmentOf } from './offer-fulfilment';
import { PartRequestStore } from './PartRequestStore';

class Input {
  constructor(
    private readonly partRequestId: string,
    private readonly partId: string,
  ) {}

  getPartRequestId(): string {
    return this.partRequestId;
  }

  getPartId(): string {
    return this.partId;
  }
}

class Output {
  private constructor(
    private readonly offer: OfferFulfilment,
    private readonly expired: boolean,
  ) {}

  static of(offer: OfferFulfilment, expired: boolean): Output {
    return new Output(offer, expired);
  }

  // What fulfilling the request with the Part would do to the Vendor's Offer
  // for it.
  getOffer(): OfferFulfilment {
    return this.offer;
  }

  // Whether the Vendor's Offer would then be an Expired Offer, by the API's
  // clock.
  offerWouldBeExpired(): boolean {
    return this.expired;
  }
}

export { Input as ReadPartRequestFulfilmentQueryInput };
export { Output as ReadPartRequestFulfilmentQueryOutput };

// The Admin asks, before matching an open Part Request to a Part, what
// fulfilling it with that Part would do to the Vendor's Offer for the Part
// (the part-requests spec: "Choosing a Part asks once, saying what fulfilling
// will do"): made, replaced or kept, by the rule a fulfilment follows,
// written once in `offer-fulfilment.ts`, and whether the Offer would then be
// an Expired Offer, by the expiry rule, so that no frontend holds the 14
// days. It changes nothing, and refuses as a fulfilment refuses, in the same
// order. The Vendor's Offer may change before the Admin answers the
// question; the fulfilment judges again, and answers what it did.
@Injectable()
export class ReadPartRequestFulfilmentQuery {
  constructor(
    private readonly partRequestStore: PartRequestStore,
    private readonly partStore: PartStore,
    private readonly offerStore: OfferStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const now = new Date();
    const named = await toFulfil(
      this.partRequestStore,
      this.partStore,
      input.getPartRequestId(),
      input.getPartId(),
    );
    if (Either.isLeft(named)) return Either.left(named.left);
    const { partRequest, part } = named.right;

    const offer = await this.offerStore.readByPart(
      partRequest.getVendor().getId(),
      part.getId(),
    );
    return Either.map(offer, (found) => {
      const confirmedAt = Option.getOrNull(
        Option.map(found, (each) => each.getConfirmedAt()),
      );
      const fulfilment = offerFulfilmentOf(confirmedAt, partRequest.getSentAt());
      return Output.of(
        fulfilment,
        partRequest.offerWouldBeExpiredOnceFulfilled(fulfilment, now),
      );
    });
  }
}
