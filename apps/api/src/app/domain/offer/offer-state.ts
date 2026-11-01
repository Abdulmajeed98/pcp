// Which of a Vendor's Offers its list holds: every one; those that need
// confirming, which are the Expired Offers and those about to expire, by the
// rules in `expiry.ts`; or those out of stock. The Offers screen's tabs read
// them, and each is counted among the Vendor's counts.
export const offerStates = ['all', 'needs-confirming', 'out-of-stock'] as const;

export type OfferState = (typeof offerStates)[number];
