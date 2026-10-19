import { Part } from '../part/Part';
import {
  aboutToExpireIfConfirmedBefore,
  expiredIfConfirmedBefore,
  wholeDaysSince,
} from './expiry';

// One Vendor's price and in-stock status for one Part in new condition. A
// Vendor has at most one Offer for a Part (OFF-1).
export class Offer {
  constructor(
    private readonly id: string,
    private readonly vendorId: string,
    private readonly part: Part,
    private readonly usdPriceCents: number | null,
    private readonly iqdPrice: number | null,
    private readonly inStock: boolean,
    private readonly warrantyMonths: number | null,
    private readonly confirmedAt: Date,
    private readonly createdAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  getVendorId(): string {
    return this.vendorId;
  }

  // The Part offered.
  getPart(): Part {
    return this.part;
  }

  // The Quoted Price in USD, in whole cents, or null when the Vendor quotes
  // none. At least one of the two Quoted Prices is given.
  getUsdPriceCents(): number | null {
    return this.usdPriceCents;
  }

  // The Quoted Price in IQD, in whole dinars, or null when the Vendor quotes
  // none.
  getIqdPrice(): number | null {
    return this.iqdPrice;
  }

  isInStock(): boolean {
    return this.inStock;
  }

  // In whole months, or null when the Vendor states none.
  getWarrantyMonths(): number | null {
    return this.warrantyMonths;
  }

  // The time of the last Confirmation, by the API's clock.
  getConfirmedAt(): Date {
    return this.confirmedAt;
  }

  // The time the Offer was added, which was its first Confirmation.
  getCreatedAt(): Date {
    return this.createdAt;
  }

  // The whole days of 24 hours since the last Confirmation, rounded down, at
  // now by the API's clock (OFF-7).
  getDaysSinceConfirmation(now: Date): number {
    return wholeDaysSince(this.confirmedAt, now);
  }

  // Whether the Offer is an Expired Offer at now: its last Confirmation is
  // more than 14 days old (OFF-6).
  isExpired(now: Date): boolean {
    return this.confirmedAt.getTime() < expiredIfConfirmedBefore(now).getTime();
  }

  // Whether the Offer is about to expire at now: it is not expired, and will
  // be within 3 days (OFF-8).
  isAboutToExpire(now: Date): boolean {
    return (
      !this.isExpired(now) &&
      this.confirmedAt.getTime() < aboutToExpireIfConfirmedBefore(now).getTime()
    );
  }
}
