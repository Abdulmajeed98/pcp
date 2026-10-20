import { useMutation, useQueryClient } from '@tanstack/react-query';

import { askAgainAfterAChangeToTheOffers, offerKey } from '@/entities/offer';
import { apiClient, dataOf } from '@/shared/api';

// Removes one of the Vendor's Offers (OFF-4). Once it is removed, every query
// a change to the Offers changes is asked again before the screen is left,
// the list and its counts among them, so that the list the Vendor returns to no
// longer holds it, even for a moment. The removed Offer's own query is left
// out, since it would now be answered as not found while its screen is
// still open, and is dropped once the screen has been left.
export function useRemoveOffer(
  vendorId: string,
  offerId: string,
  onRemoved: () => Promise<void>,
) {
  const queryClient = useQueryClient();
  const removed = offerKey(vendorId, offerId);

  return useMutation({
    mutationFn: () => dataOf(apiClient.removeOffer({ path: { vendorId, offerId } })),
    onSuccess: async () => {
      await askAgainAfterAChangeToTheOffers(queryClient, vendorId, {
        refetchType: 'all',
        except: removed,
      });
      await onRemoved();
      queryClient.removeQueries({ queryKey: removed, exact: true });
    },
  });
}
