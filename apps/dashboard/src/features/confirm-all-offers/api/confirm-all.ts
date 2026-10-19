import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vendorsOffersKey } from '@/entities/offer';
import { apiClient, dataOf } from '@/shared/api';

// Confirms every Offer of a Vendor, Expired Offers among them, as of now
// (OFF-5), and answers how many it confirmed. Every query about the Vendor's
// Offers is then asked again, so that the list, its counts and the banner
// show them confirmed.
export function useConfirmAllOffers(vendorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dataOf(apiClient.confirmAllOffers({ path: { vendorId } })),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: vendorsOffersKey(vendorId) }),
  });
}
