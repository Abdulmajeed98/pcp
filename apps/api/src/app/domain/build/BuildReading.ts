import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Currency } from '../currency/currency';
import { Build, BuildPart } from './Build';
import { BuildStore } from './BuildStore';
import { partsAskedIn } from './parts-asked';

// The reading of a Build that a request gives in its `part` values, written
// once for every endpoint that takes a Build. Each value is a Part's
// identifier, followed for a RAM kit or a drive by `:` and its quantity.
@Injectable()
export class BuildReading {
  constructor(private readonly buildStore: BuildStore) {}

  // The Build the values give, its Parts as the catalog holds them, each
  // with whether it is a Visible Part and its in-stock Visible Offers in the
  // currency, at now by the API's clock and at one Platform Rate, or the
  // refusal of the values, naming `part`.
  async read(
    values: readonly string[],
    currency: Currency,
    now: Date,
  ): Promise<Either.Either<Build, StructuredError>> {
    const asked = partsAskedIn(values);
    if (Either.isLeft(asked)) return Either.left(asked.left);

    const found = await this.buildStore.readParts(
      asked.right.map((part) => part.getPartId()),
      currency,
      now,
    );

    return Either.flatMap(found, (parts) =>
      Build.of(
        asked.right.flatMap((each) => {
          const held = parts.find((part) => part.getPart().getId() === each.getPartId());
          return held === undefined
            ? []
            : [
                new BuildPart(
                  held.getPart(),
                  each.getQuantity(),
                  held.isVisible(),
                  held.getInStockOffers(),
                ),
              ];
        }),
      ),
    );
  }
}
