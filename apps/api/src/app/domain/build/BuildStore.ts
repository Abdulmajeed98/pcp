import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Currency } from '../currency/currency';
import { Part } from '../part/Part';
import { InStockOffers } from './in-stock-offers';

// A Part a Build names, as the catalog holds it: what the Compatibility
// Rules read of a Build, its specifications among the Part's own fields.
export class NamedPart {
  constructor(private readonly part: Part) {}

  getPart(): Part {
    return this.part;
  }
}

// A Part a Build names, as the catalog holds it, with whether it is a
// Visible Part and its in-stock Visible Offers, at the moment it was read:
// what reading a Build answers of it beside the rules, its price views.
export class CatalogPart extends NamedPart {
  constructor(
    part: Part,
    private readonly visible: boolean,
    private readonly inStockOffers: InStockOffers,
  ) {
    super(part);
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

  // The Parts with these identifiers that the catalog holds, in no order,
  // and nothing of their Offers: what the picker judges each Part of its
  // list against, the Build's specifications (the builder spec's Handing a
  // stored Part to the rules). An identifier the catalog does not hold gives
  // none.
  abstract readNamedParts(
    partIds: readonly string[],
  ): Promise<Either.Either<readonly NamedPart[], StructuredError>>;
}
