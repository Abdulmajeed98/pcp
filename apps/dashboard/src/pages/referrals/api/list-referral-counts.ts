import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient, dataOf, referralCountsKey } from '@/shared/api';

// How many Vendors a page of the list holds, as a page of the Vendors holds.
export const pageSize = 20;

// One page of every Vendor, active and deactivated, with its Referral count,
// the most first, as the API orders them. While the next page is on its way,
// the last one stays on screen.
export function useReferralCounts(page: number) {
  return useQuery({
    queryKey: [...referralCountsKey, { page }],
    queryFn: () =>
      dataOf(apiClient.listReferralCounts({ query: { page, size: pageSize } })),
    placeholderData: keepPreviousData,
  });
}
