import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { vendorsCatalogSearchKey } from '@/entities/offer';
import { apiClient, dataOf } from '@/shared/api';

import type { CatalogSearch } from '../model/search';

// How many Parts a page of the results holds, as a page of the Admin
// console's Catalog does.
export const pageSize = 20;

// One page of the Parts the search finds, in name order, each with the
// Vendor's Offer for it when it has one. It is under the key of the Vendor's
// catalog search, which both an Admin's change to a Part and a change to
// the Vendor's Offers ask again, so the Part just offered is then marked.
// While the next page or the next search is on its way, the last answer
// stays on screen, unless it was another Vendor's, as when the Admin acts as
// one Vendor after another.
export function useSearchTheCatalog(
  vendorId: string,
  { words, category, page }: CatalogSearch,
) {
  const search = words.trim();
  const searchKey = vendorsCatalogSearchKey(vendorId);

  return useQuery({
    queryKey: [...searchKey, { search, category, page }],
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
      searchKey.every((part, index) => previousQuery?.queryKey[index] === part)
        ? keepPreviousData(previous)
        : undefined,
  });
}
