import type { ListedOfferResponse } from '@pcp/api-client';

// How many days an Offer stays current after its Confirmation, as the API's
// domain states it, the same for every Vendor (OFF-6). The API answers
// whether an Offer is expired or about to expire, and its whole days since
// its Confirmation. The days left are counted from those days here, so that
// they follow the API's count and not the browser's clock.
const daysAnOfferStaysCurrent = 14;

// What an Offer's row says about its last Confirmation, and the count it
// says it with:
//
// - `today`: confirmed today, not "0 days ago";
// - `daysAgo`: confirmed that many days ago, and not about to expire;
// - `expiresIn`: about to expire, in that many days;
// - `expiresToday`: about to expire before tomorrow;
// - `expired`: an Expired Offer, confirmed that many days ago, which
//   Shoppers no longer see.
export type ConfirmationState =
  | { state: 'today' }
  | { state: 'daysAgo'; count: number }
  | { state: 'expiresIn'; count: number }
  | { state: 'expiresToday' }
  | { state: 'expired'; count: number };

export function confirmationOf(
  offer: Pick<ListedOfferResponse, 'daysSinceConfirmation' | 'expired' | 'aboutToExpire'>,
): ConfirmationState {
  const days = offer.daysSinceConfirmation;
  if (offer.expired) return { state: 'expired', count: days };
  if (offer.aboutToExpire) {
    const left = daysAnOfferStaysCurrent - days;
    return left > 0 ? { state: 'expiresIn', count: left } : { state: 'expiresToday' };
  }
  return days === 0 ? { state: 'today' } : { state: 'daysAgo', count: days };
}
