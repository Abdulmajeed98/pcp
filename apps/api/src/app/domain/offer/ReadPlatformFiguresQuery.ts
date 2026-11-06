import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { OfferStore } from './OfferStore';
import { PlatformFigures } from './PlatformFigures';

// The read asks for nothing: the figures are the whole platform's.
class Input {}

class Output {
  private constructor(private readonly figures: PlatformFigures) {}

  static of(figures: PlatformFigures): Output {
    return new Output(figures);
  }

  getFigures(): PlatformFigures {
    return this.figures;
  }
}

export { Input as ReadPlatformFiguresQueryInput };
export { Output as ReadPlatformFiguresQueryOutput };

// The platform's figures, for anyone, with no Login, as the Shopper app's
// home page and a Part's price slip print them: how many active Vendors it
// has, how many Visible Offers it lists (CAT-7, OFF-6, ACC-7), the current
// Platform Rate's value alone (PRC-1), and how many days an Offer stays
// current without a Confirmation (OFF-6). When and by whom the rate was set
// stay the Admin's.
@Injectable()
export class ReadPlatformFiguresQuery {
  constructor(private readonly offerStore: OfferStore) {}

  async execute(_input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Read once, so that every Offer's visibility is judged at one moment.
    const figures = await this.offerStore.readPlatformFigures(new Date());

    return Either.map(figures, Output.of);
  }
}
