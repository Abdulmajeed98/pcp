import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient, dataOf, partRequestsKey } from '@/shared/api';

// How many Part Requests a page of the list holds, as a page of the Offers
// holds.
export const pageSize = 20;

// One page of the Vendor's Part Requests, in every state, newest first. It
// is under the key of every query about Part Requests, so that a send, a
// fulfilment or a rejection asks it again. While the next page is on its
// way, the last answer stays on screen, unless it was another Vendor's, as
// when the Admin acts as one Vendor after another.
export function useVendorsPartRequests(vendorId: string, page: number) {
  return useQuery({
    queryKey: [...partRequestsKey, 'of-vendor', vendorId, { page }],
    queryFn: () =>
      dataOf(
        apiClient.listVendorsPartRequests({
          path: { vendorId },
          query: { page, size: pageSize },
        }),
      ),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === vendorId ? keepPreviousData(previous) : undefined,
  });
}
