import { PageableAttributes, PageAttributes, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Offer } from './Offer';
import { OfferDetails } from './OfferDetails';

// A new Offer: the Vendor and the Part, its details, the time of its first
// Confirmation, and the Caller who adds it, whom its history records.
export class CreateOfferParams {
  constructor(
    private readonly vendorId: string,
    private readonly partId: string,
    private readonly details: OfferDetails,
    private readonly confirmedAt: Date,
    private readonly callerId: string,
  ) {}

  getVendorId(): string {
    return this.vendorId;
  }

  getPartId(): string {
    return this.partId;
  }

  getDetails(): OfferDetails {
    return this.details;
  }

  getConfirmedAt(): Date {
    return this.confirmedAt;
  }

  // The identifier of the Login the request was made with: the Vendor's own,
  // or the Admin's.
  getCallerId(): string {
    return this.callerId;
  }
}

// What a Vendor's list of its Offers asks for: the Vendor, the words every
// Offer's Part holds, the page, and now, by the API's clock, which every
// expiry in the list is judged by.
export class ListVendorsOffersParams {
  constructor(
    private readonly vendorId: string,
    private readonly words: readonly string[],
    private readonly pageable: PageableAttributes,
    private readonly now: Date,
  ) {}

  getVendorId(): string {
    return this.vendorId;
  }

  getWords(): readonly string[] {
    return this.words;
  }

  getPageable(): PageableAttributes {
    return this.pageable;
  }

  getNow(): Date {
    return this.now;
  }
}

// How many Offers a Vendor has, how many of them are Expired Offers, and how
// many are about to expire, at now by the API's clock, of all its Offers
// whatever a search finds.
export class VendorsOfferCounts {
  constructor(
    private readonly offers: number,
    private readonly expired: number,
    private readonly aboutToExpire: number,
  ) {}

  static readonly NONE = new VendorsOfferCounts(0, 0, 0);

  getOffers(): number {
    return this.offers;
  }

  getExpired(): number {
    return this.expired;
  }

  getAboutToExpire(): number {
    return this.aboutToExpire;
  }
}

// One page of a Vendor's Offers, where the page stands among those the search
// found, and the Vendor's counts of all its Offers.
export class VendorsOffersPage {
  constructor(
    private readonly offers: readonly Offer[],
    private readonly page: PageAttributes,
    private readonly counts: VendorsOfferCounts,
  ) {}

  getCounts(): VendorsOfferCounts {
    return this.counts;
  }

  getOffers(): readonly Offer[] {
    return this.offers;
  }

  getPageAttributes(): PageAttributes {
    return this.page;
  }
}

// Where Offers and their history are kept. It is the port: the domain says
// what it needs, and infrastructure provides it.
export abstract class OfferStore {
  // Stores a new Offer, confirmed and created at the time given, and adds the
  // first row of its history, with the same time and the Caller, in the same
  // transaction (OFF-10). A second Offer for the same Vendor and Part is
  // refused as taken, `NOT_VALID` on `partId`, also when two requests to add
  // one arrive at once (OFF-1).
  abstract create(
    params: CreateOfferParams,
  ): Promise<Either.Either<Offer, StructuredError>>;

  // The Vendor's Offers whose Parts hold every word, Expired Offers among
  // them, oldest Confirmation first, then by Part name, then by identifier,
  // so that moving between pages never skips or repeats one; and the
  // Vendor's counts of all its Offers, judged at the params' now by the rules
  // in `expiry.ts`.
  abstract listByVendor(
    params: ListVendorsOffersParams,
  ): Promise<Either.Either<VendorsOffersPage, StructuredError>>;

  // Sets the time of the last Confirmation of every Offer of the Vendor,
  // Expired Offers among them, to the time given, in one statement, and
  // answers how many. It adds no history row: a Confirmation changes neither
  // price nor stock.
  abstract confirmAll(
    vendorId: string,
    confirmedAt: Date,
  ): Promise<Either.Either<number, StructuredError>>;

  // The Vendor's Offer with this identifier, or none when there is no such
  // Offer or it is another Vendor's.
  abstract readById(
    vendorId: string,
    offerId: string,
  ): Promise<Either.Either<Option.Option<Offer>, StructuredError>>;

  // The Vendor's Offer for this Part, or none, so that adding an Offer, and
  // later the sheet and Part Requests, find the one a Vendor already has.
  abstract readByPart(
    vendorId: string,
    partId: string,
  ): Promise<Either.Either<Option.Option<Offer>, StructuredError>>;
}
