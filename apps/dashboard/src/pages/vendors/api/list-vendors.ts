import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { vendorsKey } from '@/entities/vendor';
import { apiClient, dataOf } from '@/shared/api';

// How many Vendors a page of the list holds: a phone's screen of rows and a
// little more, as a page of the Catalog's results holds.
export const pageSize = 20;

// One page of every Vendor, active and deactivated, in name order. While the
// next page is on its way, the last one stays on screen.
export function useVendors(page: number) {
  return useQuery({
    queryKey: [...vendorsKey, 'list', { page }],
    queryFn: () => dataOf(apiClient.listVendors({ query: { page, size: pageSize } })),
    placeholderData: keepPreviousData,
  });
}
