// What fulfilling a Part Request did to the Vendor's Offer for the Part
// (REQ-3): made it from the request, replaced its details with the
// request's, or kept it as it was.
export type OfferFulfilment = 'created' | 'replaced' | 'kept';

export const offerFulfilments: readonly OfferFulfilment[] = ['created', 'replaced', 'kept'];

// The rule, written once, for what fulfilling a Part Request sent at a
// moment does to the Vendor's Offer for the Part, given when that Offer was
// last confirmed, or null when the Vendor has none. A request is the
// Vendor's statement of its prices at the moment it sent it, as a
// Confirmation is, so the newer of the two statements wins: with no Offer,
// one is made from the request; an Offer confirmed strictly before the
// request was sent is replaced by it; and one confirmed at or after that
// moment is the Vendor's later word, and is kept.
export function offerFulfilmentOf(
  offerConfirmedAt: Date | null,
  sentAt: Date,
): OfferFulfilment {
  if (offerConfirmedAt === null) return 'created';
  return offerConfirmedAt.getTime() < sentAt.getTime() ? 'replaced' : 'kept';
}
