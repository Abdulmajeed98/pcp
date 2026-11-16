import { NotValidError } from '@pcp/core';
import { Either } from 'effect';

import { isUuid } from '../uuid';
import { MOST_OF_ONE_KIT_OR_DRIVE } from './Build';
import { partNotValid } from './build-errors';

// One Part a Build's `part` values name, as read before the catalog is
// asked: its identifier, and the quantity given with it, if any.
export class PartAsked {
  constructor(
    private readonly partId: string,
    private readonly quantity: number | undefined,
  ) {}

  getPartId(): string {
    return this.partId;
  }

  getQuantity(): number | undefined {
    return this.quantity;
  }
}

// The Parts the values name, in their order, or the refusal of the first
// value that cannot be read. Each value is a Part's identifier, followed for
// a RAM kit or a drive by `:` and its quantity. One Part named twice is
// refused, whatever its quantities, since a Build counts a kit or a drive
// by its quantity.
export function partsAskedIn(
  values: readonly string[],
): Either.Either<readonly PartAsked[], NotValidError> {
  return Either.flatMap(Either.all(values.map(partAskedIn)), (asked) => {
    const partIds = asked.map((part) => part.getPartId());
    return new Set(partIds).size === partIds.length
      ? Either.right(asked)
      : Either.left(partNotValid('repeated', 'A Build names one Part twice'));
  });
}

function partAskedIn(value: string): Either.Either<PartAsked, NotValidError> {
  const colon = value.indexOf(':');
  const partId = colon === -1 ? value : value.slice(0, colon);
  if (!isUuid(partId)) {
    return Either.left(
      partNotValid('notAnIdentifier', "A Build's Part is not named by an identifier"),
    );
  }

  const quantity = colon === -1 ? undefined : quantityIn(value.slice(colon + 1));
  if (quantity === null) {
    return Either.left(
      partNotValid('notAQuantity', "A Build's Part has a quantity it cannot hold"),
    );
  }
  // An identifier is written in either case, and the catalog writes it in
  // small letters.
  return Either.right(new PartAsked(partId.toLowerCase(), quantity));
}

// A quantity as a request writes it: a whole number from 1 to the most of
// one kit or drive, in Western digits. Null for anything else.
function quantityIn(text: string): number | null {
  if (!/^[0-9]+$/.test(text)) return null;
  const quantity = Number(text);
  return quantity >= 1 && quantity <= MOST_OF_ONE_KIT_OR_DRIVE ? quantity : null;
}
