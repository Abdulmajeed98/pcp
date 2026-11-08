import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Currency } from '../currency/currency';
import { Part } from '../part/Part';
import { InStockOffers } from './in-stock-offers';

// A Part a Build names, as the catalog holds it, with whether it is a
// Visible Part and its in-stock Visible Offers, at the moment it was read.
export class CatalogPart {
  constructor(
    private readonly part: Part,
    private readonly visible: boolean,
    private readonly inStockOffers: InStockOffers,
  ) {}

  getPart(): Part {
    return this.part;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getInStockOffers(): InStockOffers {
    return this.inStockOffers;
  }
}

// Where the Parts a Build names are read. It is the port: the domain says
// what it needs, and infrastructure provides it.
export abstract class BuildStore {
  // The Parts with these identifiers that the catalog holds, in no order,
  // each with whether it is a Visible Part at now by the API's clock, by the
  // rule a Category's list reads: a Part with at least one Visible Offer, by
  // the rule in `visibility.ts`; and its in-stock Visible Offers, with its
  // Lowest Price among them, as a Category's list reads it, in the currency.
  // All of it is read at one moment and at one Platform Rate, so that no
  // answer mixes two. An identifier the catalog does not hold gives none.
  abstract readParts(
    partIds: readonly string[],
    currency: Currency,
    now: Date,
  ): Promise<Either.Either<readonly CatalogPart[], StructuredError>>;
}
