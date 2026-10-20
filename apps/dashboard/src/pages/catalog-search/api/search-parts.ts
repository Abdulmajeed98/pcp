import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { vendorsOffersKey } from '@/entities/offer';
import { apiClient, dataOf } from '@/shared/api';

import type { CatalogSearch } from '../model/search';

// How many Parts a page of the results holds, as a page of the Admin
// console's Catalog does.
export const pageSize = 20;

// One page of the Parts the search finds, in name order, each with the
// Vendor's Offer for it when it has one. Which Parts the Vendor offers is
// about its Offers, so the query is under their key: adding an Offer asks it
// again, and the Part just offered is then marked. While the next page or
// the next search is on its way, the last answer stays on screen, unless it
// was another Vendor's, as when the Admin acts as one Vendor after another.
export function useSearchTheCatalog(
  vendorId: string,
  { words, category, page }: CatalogSearch,
) {
  const search = words.trim();

  return useQuery({
    queryKey: [...vendorsOffersKey(vendorId), 'catalog', { search, category, page }],
    queryFn: () =>
      dataOf(
        apiClient.searchParts({
          query: {
            vendorId,
            page,
            size: pageSize,
            ...(search === '' ? {} : { search }),
            ...(category === undefined ? {} : { category }),
          },
        }),
      ),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === vendorId ? keepPreviousData(previous) : undefined,
  });
}
