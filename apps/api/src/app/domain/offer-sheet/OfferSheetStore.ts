import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { OfferOnTheSheet, PartNumberHolders } from './OfferOnTheSheet';

// What a Vendor's Offer sheet is written from: every Offer of the Vendor,
// Expired Offers among them, in the sheet's order, and which Parts of the
// catalog hold each of their Parts' part numbers.
export class OfferSheetContents {
  constructor(
    private readonly offers: readonly OfferOnTheSheet[],
    private readonly holders: PartNumberHolders,
  ) {}

  getOffers(): readonly OfferOnTheSheet[] {
    return this.offers;
  }

  getHolders(): PartNumberHolders {
    return this.holders;
  }
}

// The port the Offer sheet reads the platform's data through.
export abstract class OfferSheetStore {
  // Every Offer of the Vendor, Expired Offers among them, ordered by
  // Category in the catalog's order, then by the Part's name, then by the
  // Offer's identifier; with every Part of the catalog that holds one of
  // their Parts' part numbers, compared by the fold. Read in one snapshot,
  // so that the rows and the part numbers they are given agree.
  abstract readOffersOf(
    vendorId: string,
  ): Promise<Either.Either<OfferSheetContents, StructuredError>>;
}
