import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { partsKey } from '@/entities/part';
import { apiClient, dataOf } from '@/shared/api';

// How many Parts a page of the list holds, as a page of the Catalog's
// results holds.
export const pageSize = 20;

// One page of the Parts that have an Offer and lack a needed specification.
// It is under the Parts' key, so that saving a Part's edit asks for the list
// again, and a Part whose gaps were filled leaves it. While the next page is
// on its way, the last one stays on screen.
export function usePartsMissingSpecifications(page: number) {
  return useQuery({
    queryKey: [...partsKey, 'missing-specifications', { page }],
    queryFn: () =>
      dataOf(apiClient.listPartsMissingSpecifications({ query: { page, size: pageSize } })),
    placeholderData: keepPreviousData,
  });
}
