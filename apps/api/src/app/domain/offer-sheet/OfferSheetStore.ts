import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { OfferDetails } from '../offer/OfferDetails';
import { Part } from '../part/Part';
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

// What an upload's rows are matched against, read once for the whole file:
// every Part of the catalog that holds one of the file's part numbers,
// compared by the fold, in the catalog's order; which of them the Vendor
// has an Offer for; and the part numbers of the Vendor's open Part
// Requests, as they were sent.
export class OfferSheetMatches {
  constructor(
    private readonly parts: readonly Part[],
    private readonly offeredPartIds: ReadonlySet<string>,
    private readonly openPartRequestNumbers: readonly string[],
  ) {}

  getParts(): readonly Part[] {
    return this.parts;
  }

  // Whether the Vendor has an Offer for the Part, an Expired Offer among
  // them.
  offers(partId: string): boolean {
    return this.offeredPartIds.has(partId);
  }

  getOpenPartRequestNumbers(): readonly string[] {
    return this.openPartRequestNumbers;
  }
}

// One row an upload applies: the Part it matched and the Offer it states,
// whole.
export class OfferSheetRowToApply {
  constructor(
    private readonly partId: string,
    private readonly details: OfferDetails,
  ) {}

  getPartId(): string {
    return this.partId;
  }

  getDetails(): OfferDetails {
    return this.details;
  }
}

// An upload's rows to apply for the Vendor, in the file's order, the moment
// of the upload, which is every row's Confirmation and the time of every
// history row, and the Caller, whom the history records.
export class ApplyOfferSheetParams {
  constructor(
    private readonly vendorId: string,
    private readonly rows: readonly OfferSheetRowToApply[],
    private readonly appliedAt: Date,
    private readonly callerId: string,
  ) {}

  getVendorId(): string {
    return this.vendorId;
  }

  getRows(): readonly OfferSheetRowToApply[] {
    return this.rows;
  }

  getAppliedAt(): Date {
    return this.appliedAt;
  }

  // The identifier of the Login the request was made with: the Vendor's own,
  // or the Admin's.
  getCallerId(): string {
    return this.callerId;
  }
}

// What applying one row did: made the Vendor's Offer, answering its
// identifier, or replaced the details of the Offer the Vendor had, answering
// them as they were.
export type OfferSheetRowApplied =
  | { readonly kind: 'added'; readonly offerId: string }
  | { readonly kind: 'replaced'; readonly before: OfferDetails };

// The port the Offer sheet reads and changes the platform's data through.
export abstract class OfferSheetStore {
  // Every Offer of the Vendor, Expired Offers among them, ordered by
  // Category in the catalog's order, then by the Part's name, then by the
  // Offer's identifier; with every Part of the catalog that holds one of
  // their Parts' part numbers, compared by the fold. Read in one snapshot,
  // so that the rows and the part numbers they are given agree.
  abstract readOffersOf(
    vendorId: string,
  ): Promise<Either.Either<OfferSheetContents, StructuredError>>;

  // What an upload's rows are matched against, for the part numbers given,
  // folded: read once for the whole file, in one snapshot.
  abstract readMatchesOf(
    vendorId: string,
    foldedPartNumbers: readonly string[],
  ): Promise<Either.Either<OfferSheetMatches, StructuredError>>;

  // Applies every row in one transaction, through the Offer module's own
  // writing, so that all are applied or none: a row for a Part the Vendor
  // has no Offer for makes it, confirmed and made at the moment given, with
  // its `created` history row; any other replaces the Offer's prices, stock
  // and warranty, as an edit does, and moves its Confirmation to the moment
  // given, with a `changed` row only when a price or the stock changed. An
  // Offer the Vendor adds for a row's Part while this runs is replaced by
  // the row, the later statement. It answers what it did to each row, in
  // the rows' order.
  abstract apply(
    params: ApplyOfferSheetParams,
  ): Promise<Either.Either<readonly OfferSheetRowApplied[], StructuredError>>;
}
