import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Currency } from '../currency/currency';
import { Build } from './Build';
import { BuildReading } from './BuildReading';
import { Completeness, completenessOf } from './complete-build';
import { PriceViews } from './price-views';

class Input {
  constructor(
    private readonly partValues: readonly string[],
    private readonly currency: Currency,
  ) {}

  // The `part` values the request gives, as it gives them, before they are
  // read as the Build.
  getPartValues(): readonly string[] {
    return this.partValues;
  }

  // The chosen currency, which every price is answered in.
  getCurrency(): Currency {
    return this.currency;
  }
}

class Output {
  private constructor(
    private readonly build: Build,
    private readonly completeness: Completeness,
    private readonly priceViews: PriceViews,
  ) {}

  static of(build: Build, completeness: Completeness, priceViews: PriceViews): Output {
    return new Output(build, completeness, priceViews);
  }

  getBuild(): Build {
    return this.build;
  }

  getCompleteness(): Completeness {
    return this.completeness;
  }

  getPriceViews(): PriceViews {
    return this.priceViews;
  }
}

export { Input as ReadBuildQueryInput };
export { Output as ReadBuildQueryOutput };

// A Build that a request gives, read for anyone, with no Login, and stored
// nowhere: its Parts as the catalog holds them, whether it is a Complete
// Build, and its price views in the chosen currency (BLD-1, BLD-5, BLD-7).
@Injectable()
export class ReadBuildQuery {
  constructor(private readonly buildReading: BuildReading) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Read once, so that every Part's visibility and every Offer's are judged
    // at one moment.
    const now = new Date();
    const build = await this.buildReading.read(
      input.getPartValues(),
      input.getCurrency(),
      now,
    );

    return Either.map(build, (read) =>
      Output.of(read, completenessOf(read), PriceViews.of(read)),
    );
  }
}
