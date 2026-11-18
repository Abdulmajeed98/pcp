import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { OfferStore } from '../offer/OfferStore';
import { partNotFound } from '../part/part-errors';
import { PartStore } from '../part/PartStore';
import { existingPartRequest, withTheVendorsOffer } from './existing-part-request';
import { OfferFulfilment } from './offer-fulfilment';
import { partRequestResolved } from './part-request-errors';
import { PartRequestAndOffer } from './PartRequest';
import { FulfilPartRequestParams, PartRequestStore } from './PartRequestStore';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly partRequestId: string,
    private readonly partId: string,
  ) {}

  // The identifier of the Login the request was made with: the Admin's.
  getCallerId(): string {
    return this.callerId;
  }

  getPartRequestId(): string {
    return this.partRequestId;
  }

  getPartId(): string {
    return this.partId;
  }
}

class Output {
  private constructor(
    private readonly partRequest: PartRequestAndOffer,
    private readonly offer: OfferFulfilment,
    private readonly fulfilledAt: Date,
  ) {}

  static of(
    partRequest: PartRequestAndOffer,
    offer: OfferFulfilment,
    fulfilledAt: Date,
  ): Output {
    return new Output(partRequest, offer, fulfilledAt);
  }

  // The request, fulfilled, with the Vendor's Offer for the Part.
  getPartRequest(): PartRequestAndOffer {
    return this.partRequest;
  }

  // What fulfilling it did to the Vendor's Offer.
  getOffer(): OfferFulfilment {
    return this.offer;
  }

  // Now, by the API's clock, when it was fulfilled.
  getReadAt(): Date {
    return this.fulfilledAt;
  }
}

export { Input as FulfilPartRequestCommandInput };
export { Output as FulfilPartRequestCommandOutput };

// The Admin fulfils a Part Request with a Part of any Category, found in
// the catalog or just created from the request (REQ-2), whatever the
// Vendor's state, and so makes the Vendor's Offer for the Part with the
// details from the request (REQ-3). The Offer counts as confirmed when the
// request was sent, the Vendor's statement of its prices, and the newer of
// that and an Offer the Vendor already has wins. A request is resolved once
// only.
@Injectable()
export class FulfilPartRequestCommand {
  constructor(
    private readonly partRequestStore: PartRequestStore,
    private readonly partStore: PartStore,
    private readonly offerStore: OfferStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // In the order of the refusals: the request, whether it is still open,
    // then the Part. The Store asks again whether it is open, holding its
    // row, so that two calls at once resolve it once.
    const id = input.getPartRequestId();
    const partRequest = existingPartRequest(id, await this.partRequestStore.readById(id));
    if (Either.isLeft(partRequest)) return Either.left(partRequest.left);
    if (!partRequest.right.isOpen()) return Either.left(partRequestResolved(id));

    const partId = input.getPartId();
    const part = await this.partStore.readById(partId);
    if (Either.isLeft(part)) return Either.left(part.left);
    if (Option.isNone(part.right)) return Either.left(partNotFound(partId));

    // The API's clock, never the database's, gives the moment it is
    // fulfilled, at which the Offer is made or changed.
    const now = new Date();
    const fulfilled = await this.partRequestStore.fulfil(
      new FulfilPartRequestParams(id, part.right.value.getId(), now, input.getCallerId()),
    );
    if (Either.isLeft(fulfilled)) return Either.left(fulfilled.left);

    // Read again, as every read is, with the Part and the Vendor's Offer.
    const read = existingPartRequest(id, await this.partRequestStore.readById(id));
    if (Either.isLeft(read)) return Either.left(read.left);
    const answered = await withTheVendorsOffer(read.right, this.offerStore);
    return Either.map(answered, (found) => Output.of(found, fulfilled.right, now));
  }
}
