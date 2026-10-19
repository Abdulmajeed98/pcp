import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { partNotFound } from '../part/part-errors';
import { PartStore } from '../part/PartStore';
import { OfferStore } from './OfferStore';
import { VisibleOffer } from './VisibleOffer';

class Input {
  constructor(private readonly partId: string) {}

  getPartId(): string {
    return this.partId;
  }
}

class Output {
  private constructor(
    private readonly offers: readonly VisibleOffer[],
    private readonly now: Date,
  ) {}

  static of(offers: readonly VisibleOffer[], now: Date): Output {
    return new Output(offers, now);
  }

  getOffers(): readonly VisibleOffer[] {
    return this.offers;
  }

  // The moment the Offers were read at, by the API's clock, which their
  // visibility was judged by and their days since Confirmation are counted
  // from.
  getNow(): Date {
    return this.now;
  }
}

export { Input as ListVisibleOffersOfPartQueryInput };
export { Output as ListVisibleOffersOfPartQueryOutput };

// A Part's visible Offers, for anyone, with no Login: those that are not
// Expired Offers and whose Vendor is active, by the rule in `visibility.ts`
// (CAT-7, OFF-6, ACC-7). In-stock Offers come first, and within each group the
// most recent Confirmation, until `pricing` orders them by price (OFF-11).
@Injectable()
export class ListVisibleOffersOfPartQuery {
  constructor(
    private readonly partStore: PartStore,
    private readonly offerStore: OfferStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const partId = input.getPartId();
    const part = await this.partStore.readById(partId);
    if (Either.isLeft(part)) return Either.left(part.left);
    if (Option.isNone(part.right)) return Either.left(partNotFound(partId));

    // Read once, so that which Offers are visible and how many days ago each
    // was confirmed are judged at the same moment.
    const now = new Date();
    const offers = await this.offerStore.listVisibleByPart(partId, now);

    return Either.map(offers, (found) => Output.of(found, now));
  }
}
