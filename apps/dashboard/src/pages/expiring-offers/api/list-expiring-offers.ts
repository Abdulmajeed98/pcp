import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { vendorsKey } from '@/entities/vendor';
import { apiClient, dataOf } from '@/shared/api';

// How many Vendors a page of the list holds, as a page of the Vendors holds.
export const pageSize = 20;

// One page of the active Vendors that have Expired Offers or Offers about to
// expire, most urgent first. It is under the Vendors' key, so that
// deactivating a Vendor, or changing its numbers, asks for the list again.
// While the next page is on its way, the last one stays on screen.
export function useVendorsWithExpiringOffers(page: number) {
  return useQuery({
    queryKey: [...vendorsKey, 'expiring-offers', { page }],
    queryFn: () =>
      dataOf(apiClient.listVendorsWithExpiringOffers({ query: { page, size: pageSize } })),
    placeholderData: keepPreviousData,
  });
}
