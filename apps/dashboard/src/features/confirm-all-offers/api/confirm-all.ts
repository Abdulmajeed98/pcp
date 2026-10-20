import { useMutation, useQueryClient } from '@tanstack/react-query';

import { askAgainAfterAChangeToTheOffers } from '@/entities/offer';
import { apiClient, dataOf } from '@/shared/api';

// Confirms every Offer of a Vendor, Expired Offers among them, as of now
// (OFF-5), and answers how many it confirmed. Every query a change to the
// Offers changes is then asked again, so that the list, its counts and the
// banner show them confirmed, and so do the Admin's lists.
export function useConfirmAllOffers(vendorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dataOf(apiClient.confirmAllOffers({ path: { vendorId } })),
    onSuccess: () => askAgainAfterAChangeToTheOffers(queryClient, vendorId),
  });
}
