import type { ListedOfferResponse } from '@pcp/api-client';

// What an Offer's row says about its last Confirmation, and the count it
// says it with. The API answers every count, judged by its own clock and its
// domain's constants, so that no frontend counts days or holds the 14 days:
//
// - `today`: confirmed today, not "0 days ago";
// - `daysAgo`: confirmed that many days ago, and not about to expire;
// - `expiresIn`: about to expire, with that many whole days left;
// - `expiresToday`: about to expire, with less than a whole day left;
// - `expired`: an Expired Offer, confirmed that many days ago, which
//   Shoppers no longer see.
export type ConfirmationState =
  | { state: 'today' }
  | { state: 'daysAgo'; count: number }
  | { state: 'expiresIn'; count: number }
  | { state: 'expiresToday' }
  | { state: 'expired'; count: number };

export function confirmationOf(
  offer: Pick<
    ListedOfferResponse,
    'daysSinceConfirmation' | 'daysLeft' | 'expired' | 'aboutToExpire'
  >,
): ConfirmationState {
  const days = offer.daysSinceConfirmation;
  if (offer.expired) return { state: 'expired', count: days };
  if (offer.aboutToExpire) {
    return offer.daysLeft > 0
      ? { state: 'expiresIn', count: offer.daysLeft }
      : { state: 'expiresToday' };
  }
  return days === 0 ? { state: 'today' } : { state: 'daysAgo', count: days };
}
