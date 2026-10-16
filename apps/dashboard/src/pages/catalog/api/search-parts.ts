import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { partsKey } from '@/entities/part';
import { apiClient, dataOf } from '@/shared/api';

import type { CatalogSearch } from '../model/search';

// How many Parts a page of the results holds: a phone's screen of rows and a
// little more, so that a broad search stays quick on mobile data.
export const pageSize = 20;

// One page of the Parts the search finds, in name order. While the next page
// or the next search is on its way, the last answer stays on screen.
export function useSearchParts({ words, category, page }: CatalogSearch) {
  return useQuery({
    queryKey: [...partsKey, 'search', { words, category, page }],
    queryFn: () =>
      dataOf(
        apiClient.searchParts({ query: { search: words, category, page, size: pageSize } }),
      ),
    placeholderData: keepPreviousData,
  });
}
