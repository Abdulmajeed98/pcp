import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { OfferStore } from '../offer/OfferStore';
import { existingPartRequest, withTheVendorsOffer } from './existing-part-request';
import { PartRequestAndOffer } from './PartRequest';
import { PartRequestStore } from './PartRequestStore';

class Input {
  constructor(private readonly partRequestId: string) {}

  getPartRequestId(): string {
    return this.partRequestId;
  }
}

class Output {
  private constructor(
    private readonly partRequest: PartRequestAndOffer,
    private readonly readAt: Date,
  ) {}

  static of(partRequest: PartRequestAndOffer, readAt: Date): Output {
    return new Output(partRequest, readAt);
  }

  getPartRequest(): PartRequestAndOffer {
    return this.partRequest;
  }

  // Now, by the API's clock, when it was read: its days since it was sent,
  // and whether its Offer would be expired, are judged at it.
  getReadAt(): Date {
    return this.readAt;
  }
}

export { Input as ReadPartRequestQueryInput };
export { Output as ReadPartRequestQueryOutput };

// The Admin reads one Part Request in any state, with its Vendor: everything
// the Vendor sent, so as to resolve it without asking again, or how it was
// resolved, for one opened from an old link. A fulfilled one comes with the
// Vendor's Offer for its Part now, if it still has one.
@Injectable()
export class ReadPartRequestQuery {
  constructor(
    private readonly partRequestStore: PartRequestStore,
    private readonly offerStore: OfferStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const id = input.getPartRequestId();
    const now = new Date();
    const partRequest = existingPartRequest(id, await this.partRequestStore.readById(id));
    if (Either.isLeft(partRequest)) return Either.left(partRequest.left);

    const answered = await withTheVendorsOffer(partRequest.right, this.offerStore);
    return Either.map(answered, (found) => Output.of(found, now));
  }
}
