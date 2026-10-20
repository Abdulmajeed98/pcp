import { expiredIfConfirmedBefore } from './expiry';

// The rule for a visible Offer, written once (CAT-7): an Offer a Shopper may
// see is not an Expired Offer (OFF-6), and its Vendor is active (ACC-7).
//
// Every answer for Shoppers, in `pricing`, `browse`, `builder` and `sharing`,
// goes through the Offer Store's queries of visible Offers, which ask the
// database for exactly these conditions, with now passed in from the API's
// clock, never the database's. A query for Shoppers that reads the `offer`
// table some other way breaks the rule.
export interface VisibleOfferRule {
  // Its Vendor is active.
  readonly vendorActive: true;
  // It is not an Expired Offer: it was last confirmed at this moment or
  // after. One confirmed exactly 14 days before now is still visible; one a
  // millisecond earlier is an Expired Offer, by the same moment the `Offer`
  // entity judges expiry by.
  readonly confirmedFrom: Date;
}

// The rule for a visible Offer at now, by the API's clock.
export function visibleOfferRuleAt(now: Date): VisibleOfferRule {
  return { vendorActive: true, confirmedFrom: expiredIfConfirmedBefore(now) };
}
