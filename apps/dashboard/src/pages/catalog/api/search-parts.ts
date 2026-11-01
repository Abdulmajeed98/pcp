import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';

import type { CategoryKey } from '@/entities/category';
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

// How many Parts the words find in every Category, and in each of those
// given, for the Category tabs. The API counts a search with every page it
// answers, so each count is asked for as a page of one Part. While the next
// words' counts are on their way, the last ones stay. A count not answered,
// or refused, is left out.
export function useCountsByCategory(
  words: string,
  categories: readonly CategoryKey[],
): Map<CategoryKey | undefined, number> {
  const tabs: (CategoryKey | undefined)[] = [undefined, ...categories];
  const answers = useQueries({
    queries: tabs.map((category) => ({
      queryKey: [...partsKey, 'count', { words, category }],
      queryFn: () =>
        dataOf(
          apiClient.searchParts({ query: { search: words, category, page: 0, size: 1 } }),
        ).then(({ totalElements }) => totalElements),
      placeholderData: keepPreviousData,
    })),
  });

  return new Map(
    tabs.flatMap((category, index) => {
      const count = answers[index]?.data;
      return count === undefined ? [] : [[category, count] as const];
    }),
  );
}
