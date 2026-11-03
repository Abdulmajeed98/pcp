import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Part } from '../part/Part';
import { partNotFound } from '../part/part-errors';
import { OfferStore } from './OfferStore';

class Input {
  constructor(private readonly partId: string) {}

  getPartId(): string {
    return this.partId;
  }
}

class Output {
  private constructor(private readonly part: Part) {}

  static of(part: Part): Output {
    return new Output(part);
  }

  // A Visible Part, whose specifications Shoppers read labelled.
  getPart(): Part {
    return this.part;
  }
}

export { Input as ReadVisiblePartQueryInput };
export { Output as ReadVisiblePartQueryOutput };

// One Visible Part, for anyone, with no Login, as a Part page shows it
// (CAT-7, BRW-3): a Part with at least one Visible Offer, by the rule a
// Category's list reads. A Part that is not visible is answered as one that
// does not exist, whoever asks, so that an old link finds nothing.
@Injectable()
export class ReadVisiblePartQuery {
  constructor(private readonly offerStore: OfferStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const partId = input.getPartId();
    const found = await this.offerStore.readVisiblePart(partId, new Date());

    return Either.flatMap(found, (part) =>
      Option.match(part, {
        onNone: () => Either.left(partNotFound(partId)),
        onSome: (visible) => Either.right(Output.of(visible)),
      }),
    );
  }
}
