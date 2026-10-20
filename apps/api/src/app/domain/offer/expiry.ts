// The rules of an Offer's expiry, written once, the same for every Vendor
// (OFF-6, OFF-8). The `Offer` entity answers them for one Offer, and the
// Offer Store's queries use the same moments, so that a list and an entity
// cannot disagree. Now is always the API's clock, passed in, never the
// database's.

// A day of 24 hours, in milliseconds. Days are counted by elapsed time, not by
// the calendar.
export const A_DAY = 24 * 60 * 60 * 1000;

// An Offer is an Expired Offer when its last Confirmation is more than this
// many days old (OFF-6).
export const DAYS_AN_OFFER_STAYS_CURRENT = 14;

// An Offer is about to expire when it is not expired and will be within this
// many days (OFF-8).
export const DAYS_OF_WARNING = 3;

// The moment, given now, that an Offer last confirmed before it is an Expired
// Offer. At exactly 14 days it is not yet; one millisecond later it is.
export function expiredIfConfirmedBefore(now: Date): Date {
  return new Date(now.getTime() - DAYS_AN_OFFER_STAYS_CURRENT * A_DAY);
}

// The moment, given now, that an Offer last confirmed before it, and not
// expired, is about to expire: 3 days before it expires, which is 11 days
// after its Confirmation.
export function aboutToExpireIfConfirmedBefore(now: Date): Date {
  return new Date(now.getTime() - (DAYS_AN_OFFER_STAYS_CURRENT - DAYS_OF_WARNING) * A_DAY);
}

// The whole days of 24 hours from a moment to now, rounded down (OFF-7).
export function wholeDaysSince(moment: Date, now: Date): number {
  return Math.floor((now.getTime() - moment.getTime()) / A_DAY);
}

// The whole days of 24 hours left, given now, until an Offer last confirmed
// at a moment expires, rounded down: 3 at exactly 11 days after its
// Confirmation, 2 a millisecond later, and 0 once less than a whole day is
// left, which a Vendor reads as "expires today", and for an Expired Offer.
export function wholeDaysLeft(confirmedAt: Date, now: Date): number {
  const left = confirmedAt.getTime() + DAYS_AN_OFFER_STAYS_CURRENT * A_DAY - now.getTime();
  return Math.max(0, Math.floor(left / A_DAY));
}
