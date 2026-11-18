// The rules of an Offer's expiry, as the API states them in its description,
// written once for the made-up shop: an Offer is an Expired Offer when its
// last Confirmation is more than 14 days old, and about to expire when it is
// not expired and will be within 3 days. They judge the shop's own Offers
// and the Offer a fulfilment of a made-up Part Request would make, which is
// confirmed at the moment the request was sent. The API's are the rules that
// count; the shop states them because no fixed data can carry what changes
// with the clock, and the stand-in API answers the 14 days among the
// platform's figures.
export const aDay = 24 * 60 * 60 * 1000;
export const daysAnOfferStaysCurrent = 14;
export const daysOfWarning = 3;

// Whether an Offer last confirmed at `confirmedAt` is an Expired Offer at
// `now`: at exactly 14 days it is not yet, and one millisecond later it is.
export function isExpiredAt(confirmedAt: Date, now: Date): boolean {
  return now.getTime() - confirmedAt.getTime() > daysAnOfferStaysCurrent * aDay;
}
