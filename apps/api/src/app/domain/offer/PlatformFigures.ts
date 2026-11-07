import { DAYS_AN_OFFER_STAYS_CURRENT } from './expiry';

// What the platform holds, as a Shopper may read it, at one moment: how many
// active Vendors it has, one with no Visible Offer among them; how many
// Visible Offers it lists, by the rule in `visibility.ts`, in stock or not;
// and the current Platform Rate's value alone, or none until the Admin sets
// the first. When the rate was set, and by whom, stay the Admin's.
export class PlatformFigures {
  constructor(
    private readonly activeVendorCount: number,
    private readonly visibleOfferCount: number,
    private readonly iqdPerUsd: number | null,
  ) {}

  getActiveVendorCount(): number {
    return this.activeVendorCount;
  }

  getVisibleOfferCount(): number {
    return this.visibleOfferCount;
  }

  // Whole dinars per dollar, or null until the Admin sets the first rate.
  getIqdPerUsd(): number | null {
    return this.iqdPerUsd;
  }

  // How many days an Offer stays current without a Confirmation, by the
  // rule of an Offer's expiry, the one every Visible Offer is judged by
  // (OFF-6), and no copy of it.
  getDaysAnOfferStaysCurrent(): number {
    return DAYS_AN_OFFER_STAYS_CURRENT;
  }
}
