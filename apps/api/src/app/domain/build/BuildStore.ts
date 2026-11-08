import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Part } from '../part/Part';

// A Part a Build names, as the catalog holds it, with whether it is a
// Visible Part at the moment it was read.
export class CatalogPart {
  constructor(
    private readonly part: Part,
    private readonly visible: boolean,
  ) {}

  getPart(): Part {
    return this.part;
  }

  isVisible(): boolean {
    return this.visible;
  }
}

// Where the Parts a Build names are read. It is the port: the domain says
// what it needs, and infrastructure provides it.
export abstract class BuildStore {
  // The Parts with these identifiers that the catalog holds, in no order,
  // each with whether it is a Visible Part at now by the API's clock, by the
  // rule a Category's list reads: a Part with at least one Visible Offer, by
  // the rule in `visibility.ts`. An identifier the catalog does not hold
  // gives none.
  abstract readParts(
    partIds: readonly string[],
    now: Date,
  ): Promise<Either.Either<readonly CatalogPart[], StructuredError>>;
}
