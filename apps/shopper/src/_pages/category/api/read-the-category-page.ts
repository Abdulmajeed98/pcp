import type { ListVisiblePartsData, VisiblePartPageResponse } from '@pcp/api-client';
import { connection } from 'next/server';

import type { Category } from '@/entities/category';
import type { CategoryQuery, OfferedFilters } from '@/features/search-parts';
import { apiClient } from '@/shared/api';
import type { Currency } from '@/shared/currency';

// How many Parts a page of a Category's list holds: as many as the
// dashboard's lists hold, and within the 12 to 24 a printed menu sheet holds.
export const partsAPage = 20;

// What a Category page reads first from the API, on the server, for each
// request: the Category's filters (`GET v1/visible-parts/filters`), each with
// the values its Visible Parts hold, and the range of their Lowest Prices in
// the chosen currency. The form is built from it, and the address is read
// against it, so that nothing it does not offer is ever sent. A read the API
// does not answer, or refuses, is nothing.
export async function readTheCategoryFilters(
  category: Category,
  currency: Currency,
): Promise<OfferedFilters | undefined> {
  // Rendering waits here for a request, so the page is never built ahead,
  // when the app is built and no API runs, nor kept: prices change by the
  // hour and depend on the Shopper's cookie.
  await connection();

  const { data } = await apiClient().readVisiblePartsFilters({
    query: { category, currency },
    cache: 'no-store',
  });
  return data;
}

// What a Category page reads then, for each request (the browse spec's The
// Shopper app): one page of the Category's Visible Parts, in BRW-1's order,
// each with its Lowest Price in the chosen currency, for the search, the
// manufacturers, the filters and the price range the address holds, read
// against what the Category's filters offer. A filter with several values
// repeats its parameter. The API does the searching, the filtering, the order
// and the prices; the page counts its pages from 1 and the API from 0. A read
// the API does not answer, or refuses, is nothing.
export async function readTheCategoryPage(
  category: Category,
  { search, manufacturers, filters, lowest, highest, page }: CategoryQuery,
  currency: Currency,
): Promise<VisiblePartPageResponse | undefined> {
  await connection();

  // Each filter is asked by the parameter the API answered it with, which
  // the generated client knows by name for the filters it was written with.
  const chosen = Object.fromEntries(
    filters.map(({ parameter, values }) => [parameter, [...values]]),
  ) as Partial<ListVisiblePartsData['query']>;

  const { data } = await apiClient().listVisibleParts({
    query: {
      ...chosen,
      category,
      currency,
      search: search === '' ? undefined : search,
      manufacturer: manufacturers.length === 0 ? undefined : [...manufacturers],
      lowest: lowest ?? undefined,
      highest: highest ?? undefined,
      page: page - 1,
      size: partsAPage,
    },
    cache: 'no-store',
  });
  return data;
}
