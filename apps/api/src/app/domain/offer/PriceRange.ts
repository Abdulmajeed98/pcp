import { NotValidError } from '@pcp/core';
import { Either } from 'effect';

// A range of Lowest Prices a Shopper narrows a Category's list by, in whole
// ones of the chosen currency, whole dollars or whole dinars, as a Shopper
// types them: each end included, and either left out. It is compared with
// the Lowest Price as answered, after rounding, as the list is ordered
// (PRC-4), and a Part with no Lowest Price is within no range that has an end.
export class PriceRange {
  private constructor(
    private readonly lowest: number | undefined,
    private readonly highest: number | undefined,
  ) {}

  // The range between the ends given, or a refusal naming `lowest` when it is
  // above `highest`, which no Part's Lowest Price could be within.
  static between(
    lowest: number | undefined,
    highest: number | undefined,
  ): Either.Either<PriceRange, NotValidError> {
    if (lowest !== undefined && highest !== undefined && lowest > highest) {
      return Either.left(
        NotValidError.of('NOT_VALID', 'The price range starts above its end', {
          field: 'lowest',
        }),
      );
    }
    return Either.right(new PriceRange(lowest, highest));
  }

  getLowest(): number | undefined {
    return this.lowest;
  }

  getHighest(): number | undefined {
    return this.highest;
  }
}
