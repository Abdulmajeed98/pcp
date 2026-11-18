import { expiredIfConfirmedBefore } from '../offer/expiry';
import { OfferDetails } from '../offer/OfferDetails';
import { Category } from '../part/Category';
import { Part } from '../part/Part';
import { calendarDaysBetween, theDayOf } from '../the-platforms-day';

// Where a Part Request stands: open until the Admin resolves it, fulfilled
// once the Admin matches it to a Part, or rejected with a reason.
export type PartRequestState = 'open' | 'fulfilled' | 'rejected';

// The Vendor that sent a Part Request: its identifier, its name as it
// writes it, and whether it is active or a Deactivated Vendor.
export class SendingVendor {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly active: boolean,
  ) {}

  getId(): string {
    return this.id;
  }

  // As the Vendor writes it.
  getName(): string {
    return this.name;
  }

  isActive(): boolean {
    return this.active;
  }
}

// How a Part Request was resolved, once it is: fulfilled with the Part, or
// rejected with the Admin's reason, and when, by the API's clock.
export type PartRequestResolution =
  | { readonly state: 'open' }
  | { readonly state: 'fulfilled'; readonly part: Part; readonly resolvedAt: Date }
  | { readonly state: 'rejected'; readonly reason: string; readonly resolvedAt: Date };

// A Vendor's request that the Admin add a Part missing from the catalog
// (REQ-1): the Part's Category, name and manufacturer part number, the Offer
// the Vendor would make, when it was sent, and how it was resolved. Nothing
// changes it but its resolution, which happens once.
export class PartRequest {
  constructor(
    private readonly id: string,
    private readonly vendor: SendingVendor,
    private readonly category: Category,
    private readonly name: string,
    private readonly partNumber: string,
    private readonly offerDetails: OfferDetails,
    private readonly sentAt: Date,
    private readonly resolution: PartRequestResolution,
  ) {}

  getId(): string {
    return this.id;
  }

  getVendor(): SendingVendor {
    return this.vendor;
  }

  // The Category the Vendor gave, which the Part that fulfils it need not
  // have.
  getCategory(): Category {
    return this.category;
  }

  // As the Vendor wrote it.
  getName(): string {
    return this.name;
  }

  // As the catalog cleans a part number.
  getPartNumber(): string {
    return this.partNumber;
  }

  // The Offer the Vendor would make: its Quoted Prices, whether it is in
  // stock, and its warranty.
  getOfferDetails(): OfferDetails {
    return this.offerDetails;
  }

  // When the Vendor sent it, by the API's clock: when it stated its prices.
  getSentAt(): Date {
    return this.sentAt;
  }

  // The day it was sent, in the platform's time, Iraq's: `2026-11-16`.
  getSentOn(): string {
    return theDayOf(this.sentAt);
  }

  // The calendar days, in the platform's time, from the day it was sent to
  // now's: 0 on that day, 1 on the next, whatever the hours between, by the
  // rule a Shared Build's day follows.
  getDaysSinceSent(now: Date): number {
    return calendarDaysBetween(this.sentAt, now);
  }

  // Whether the Offer it makes, confirmed at the moment it was sent, would be
  // an Expired Offer at now, by the expiry rule (OFF-6): one millisecond past
  // 14 days it would.
  offerWouldBeExpired(now: Date): boolean {
    return this.sentAt.getTime() < expiredIfConfirmedBefore(now).getTime();
  }

  getState(): PartRequestState {
    return this.resolution.state;
  }

  isOpen(): boolean {
    return this.resolution.state === 'open';
  }

  // The Part that fulfilled it, or null when it is not fulfilled.
  getPart(): Part | null {
    return this.resolution.state === 'fulfilled' ? this.resolution.part : null;
  }

  // The Admin's reason for rejecting it, as the Admin wrote it, or null when
  // it is not rejected.
  getReason(): string | null {
    return this.resolution.state === 'rejected' ? this.resolution.reason : null;
  }

  // When the Admin resolved it, by the API's clock, or null while it is
  // open.
  getResolvedAt(): Date | null {
    return this.resolution.state === 'open' ? null : this.resolution.resolvedAt;
  }
}

// A Part Request with the identifier of the Vendor's Offer for its Part now,
// when it was fulfilled: null once the Vendor has removed that Offer, and
// for a request that is open or rejected.
export class PartRequestAndOffer {
  constructor(
    private readonly partRequest: PartRequest,
    private readonly offerId: string | null,
  ) {}

  getPartRequest(): PartRequest {
    return this.partRequest;
  }

  getOfferId(): string | null {
    return this.offerId;
  }
}
