import { PageableAttributes, PageAttributes, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Currency } from '../currency/currency';
import { Category } from '../part/Category';
import { FilterChoice } from '../specification/filters';

import { Offer } from './Offer';
import { OfferDetails } from './OfferDetails';
import { OfferState } from './offer-state';
import { PriceRange } from './PriceRange';
import { VendorWithExpiringOffers } from './VendorWithExpiringOffers';
import { VisibleOffer } from './VisibleOffer';
import { VisiblePart } from './VisiblePart';
import { VisiblePartsFilters } from './VisiblePartsFilters';

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

// A change to one of a Vendor's Offers: the Vendor and the Offer, its new
// details, which replace all it had, the time of the Confirmation that
// saving it is, and the Caller who changes it, whom its history records.
export class EditOfferParams {
  constructor(
    private readonly vendorId: string,
    private readonly offerId: string,
    private readonly details: OfferDetails,
    private readonly confirmedAt: Date,
    private readonly callerId: string,
  ) {}

  getVendorId(): string {
    return this.vendorId;
  }

  getOfferId(): string {
    return this.offerId;
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

// The removal of one of a Vendor's Offers: the Vendor and the Offer, the time
// of the removal, and the Caller who removes it, whom its history records.
export class RemoveOfferParams {
  constructor(
    private readonly vendorId: string,
    private readonly offerId: string,
    private readonly removedAt: Date,
    private readonly callerId: string,
  ) {}

  getVendorId(): string {
    return this.vendorId;
  }

  getOfferId(): string {
    return this.offerId;
  }

  getRemovedAt(): Date {
    return this.removedAt;
  }

  // The identifier of the Login the request was made with: the Vendor's own,
  // or the Admin's.
  getCallerId(): string {
    return this.callerId;
  }
}

// What a Vendor's list of its Offers asks for: the Vendor, the words every
// Offer's Part holds, the state every Offer is in, the page, and now, by the
// API's clock, which every expiry in the list is judged by.
export class ListVendorsOffersParams {
  constructor(
    private readonly vendorId: string,
    private readonly words: readonly string[],
    private readonly state: OfferState,
    private readonly pageable: PageableAttributes,
    private readonly now: Date,
  ) {}

  getVendorId(): string {
    return this.vendorId;
  }

  getWords(): readonly string[] {
    return this.words;
  }

  getState(): OfferState {
    return this.state;
  }

  getPageable(): PageableAttributes {
    return this.pageable;
  }

  getNow(): Date {
    return this.now;
  }
}

// How many Offers a Vendor has, how many of them are Expired Offers and how
// many are about to expire, at now by the API's clock, of all its Offers
// whatever a search finds and whatever state a list holds: what the Admin's
// list of whom to remind counts.
export class OfferCounts {
  constructor(
    private readonly offers: number,
    private readonly expired: number,
    private readonly aboutToExpire: number,
  ) {}

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

// The same counts, and how many of the Vendor's Offers are out of stock, for
// the tabs of a Vendor's own list.
export class VendorsOfferCounts extends OfferCounts {
  constructor(
    offers: number,
    expired: number,
    aboutToExpire: number,
    private readonly outOfStock: number,
  ) {
    super(offers, expired, aboutToExpire);
  }

  static readonly NONE = new VendorsOfferCounts(0, 0, 0, 0);

  getOutOfStock(): number {
    return this.outOfStock;
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

// What the Admin's list of Vendors to remind asks for: the page, and now, by
// the API's clock, which every expiry in the list is judged by.
export class ListVendorsWithExpiringOffersParams {
  constructor(
    private readonly pageable: PageableAttributes,
    private readonly now: Date,
  ) {}

  getPageable(): PageableAttributes {
    return this.pageable;
  }

  getNow(): Date {
    return this.now;
  }
}

// One page of the Vendors to remind, and where it stands among them all.
export class VendorsWithExpiringOffersPage {
  constructor(
    private readonly vendors: readonly VendorWithExpiringOffers[],
    private readonly page: PageAttributes,
  ) {}

  getVendors(): readonly VendorWithExpiringOffers[] {
    return this.vendors;
  }

  getPageAttributes(): PageAttributes {
    return this.page;
  }
}

// What a Category's list of Visible Parts asks for: the Category, the chosen
// currency every Lowest Price is in, the words every Part holds, the
// manufacturers one of which every Part's is, the choices among the
// Category's filters every Part matches, the range every Part's Lowest Price
// is within, the page, and now, by the API's clock, which every Offer's
// visibility is judged by.
export class ListVisiblePartsParams {
  constructor(
    private readonly category: Category,
    private readonly currency: Currency,
    private readonly words: readonly string[],
    private readonly manufacturers: readonly string[],
    private readonly choices: readonly FilterChoice[],
    private readonly priceRange: PriceRange,
    private readonly pageable: PageableAttributes,
    private readonly now: Date,
  ) {}

  getCategory(): Category {
    return this.category;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  getWords(): readonly string[] {
    return this.words;
  }

  // None asks for every manufacturer.
  getManufacturers(): readonly string[] {
    return this.manufacturers;
  }

  getChoices(): readonly FilterChoice[] {
    return this.choices;
  }

  getPriceRange(): PriceRange {
    return this.priceRange;
  }

  getPageable(): PageableAttributes {
    return this.pageable;
  }

  getNow(): Date {
    return this.now;
  }
}

// One page of a Category's Visible Parts, and where it stands among them all.
export class VisiblePartsPage {
  constructor(
    private readonly parts: readonly VisiblePart[],
    private readonly page: PageAttributes,
  ) {}

  getParts(): readonly VisiblePart[] {
    return this.parts;
  }

  getPageAttributes(): PageAttributes {
    return this.page;
  }
}

// What a Category's filters ask for: the Category, the chosen currency the
// range of Lowest Prices is in, and now, by the API's clock, which every
// Offer's visibility is judged by.
export class ReadVisiblePartsFiltersParams {
  constructor(
    private readonly category: Category,
    private readonly currency: Currency,
    private readonly now: Date,
  ) {}

  getCategory(): Category {
    return this.category;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  getNow(): Date {
    return this.now;
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

  // Replaces the prices, the stock and the warranty of the Vendor's Offer, and
  // sets the time of its last Confirmation, and, when the prices or the stock
  // change, adds a row to its history with the values after the change, the
  // same time and the Caller, in the same transaction (OFF-10). It answers
  // the Offer as changed, or none when there is no such Offer or it is
  // another Vendor's.
  abstract edit(
    params: EditOfferParams,
  ): Promise<Either.Either<Option.Option<Offer>, StructuredError>>;

  // Removes the Vendor's Offer and adds a row to its history that marks the
  // removal, with the time, the Caller and the prices and stock it had, in the
  // same transaction. The history's earlier rows stay. It answers whether
  // there was such an Offer of the Vendor's to remove.
  abstract remove(
    params: RemoveOfferParams,
  ): Promise<Either.Either<boolean, StructuredError>>;

  // The Vendor's Offers in the state asked for whose Parts hold every word,
  // Expired Offers among them, oldest Confirmation first, then by Part name, then by identifier,
  // so that moving between pages never skips or repeats one; and the
  // Vendor's counts of all its Offers, judged at the params' now by the rules
  // in `expiry.ts`.
  abstract listByVendor(
    params: ListVendorsOffersParams,
  ): Promise<Either.Either<VendorsOffersPage, StructuredError>>;

  // The active Vendors that have at least one Expired Offer or Offer about to
  // expire, judged at the params' now by the rules in `expiry.ts`, each with
  // its counts of all its Offers. A Vendor with an Expired Offer comes before
  // every Vendor without one; among those without one, the Vendor whose
  // Offer expires soonest comes first; then by name, then by identifier, so
  // that moving between pages never skips or repeats one.
  abstract listVendorsWithExpiringOffers(
    params: ListVendorsWithExpiringOffersParams,
  ): Promise<Either.Either<VendorsWithExpiringOffersPage, StructuredError>>;

  // Sets the time of the last Confirmation of every Offer of the Vendor,
  // Expired Offers among them, to the time given, in one statement, and
  // answers how many. It adds no history row: a Confirmation changes neither
  // price nor stock.
  abstract confirmAll(
    vendorId: string,
    confirmedAt: Date,
  ): Promise<Either.Either<number, StructuredError>>;

  // The Part's visible Offers at now by the API's clock, by the rule in
  // `visibility.ts`: not Expired Offers, and of active Vendors only. Each has
  // its Shown Price in the currency, converted by the rule in
  // `shown-price.ts` at the current Platform Rate, which is read in the same
  // query as the Offers, so that one answer never mixes two rates. In-stock
  // Offers come first, and within each group the lowest Shown Price, compared
  // as answered, after rounding, with Offers that have none after the
  // others; then the most recent Confirmation, the Vendor's name and the
  // Offer's identifier, so that the order is the same at every read.
  abstract listVisibleByPart(
    partId: string,
    currency: Currency,
    now: Date,
  ): Promise<Either.Either<readonly VisibleOffer[], StructuredError>>;

  // The Category's Visible Parts that hold every word, whose manufacturer is
  // one of those asked, if any, and that match every choice among the
  // Category's filters, by holding any of the values chosen of it; judged at
  // the params' now by the rule for a Visible Part: a Part with at least one
  // Visible Offer, by the rule in `visibility.ts`. A Part missing a filter's
  // specification, or holding a value that stands for "not known", matches no
  // value of that filter. A price range with an end leaves out a Part with no
  // Lowest Price, and keeps those whose Lowest Price, as answered, after
  // rounding, is within both ends. Each has its Lowest Price in the
  // currency, from the Shown Prices of its in-stock Visible Offers at the
  // current Platform Rate, which is read in the same query as the Parts, the
  // page and the total, so that one answer never mixes two rates. Parts with
  // a Lowest Price come first, the lowest first, compared as answered, after
  // rounding (BRW-1, PRC-4); then the in-stock Parts with none, which happens
  // only with no Platform Rate; then the Parts whose Visible Offers are all
  // out of stock; then by name and identifier, so that moving between pages
  // never skips or repeats one.
  abstract listVisibleParts(
    params: ListVisiblePartsParams,
  ): Promise<Either.Either<VisiblePartsPage, StructuredError>>;

  // The Category's filters, read from all its Visible Parts at the params'
  // now, by the same rule as its list, before any filter or search: the
  // manufacturers they have; for each filter in `filters.ts`, the distinct
  // values they hold, numbers by size and text alphabetically, leaving out a
  // value that stands for "not known" and a filter none holds a value of;
  // and the lowest and highest of their Lowest Prices in the currency, at the
  // current Platform Rate, read in the same query as the Parts.
  abstract readVisiblePartsFilters(
    params: ReadVisiblePartsFiltersParams,
  ): Promise<Either.Either<VisiblePartsFilters, StructuredError>>;

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
