import type { VisiblePartPageResponse } from '@pcp/api-client';
import { connection } from 'next/server';

import type { Category } from '@/entities/category';
import {
  type CategoryQuery,
  listAskedFor,
  type OfferedFilters,
} from '@/features/search-parts';
import { apiClient } from '@/shared/api';
import type { Currency } from '@/shared/currency';

// What a Category page reads first from the API, on the server, for each
// request, with no cache: the Category's filters (`GET v1/visible-parts/
// filters`), each with the values its Visible Parts hold, and the range of
// their Lowest Prices in the chosen currency. The form is built from it, and
// the address is read against it, so that nothing it does not offer is ever
// sent. A read the API does not answer, or refuses, is nothing.
export async function readTheCategoryFilters(
  category: Category,
  currency: Currency,
): Promise<OfferedFilters | undefined> {
  // Rendering waits here for a request, so the page is never built ahead,
  // when the app is built and no API runs, nor kept: prices change by the
  // hour.
  await connection();

  const { data } = await apiClient().readVisiblePartsFilters({
    query: { category, currency },
    cache: 'no-store',
  });
  return data;
}

// What a Category page reads then, for each request (the browse spec's The
// Shopper app): one page of the Category's Visible Parts, as the search,
// the filters, the price range and the page its address holds ask for it
// (`listAskedFor`). The API does the searching, the filtering, the order and
// the prices. A read the API does not answer, or refuses, is nothing.
export async function readTheCategoryPage(
  category: Category,
  query: CategoryQuery,
  currency: Currency,
): Promise<VisiblePartPageResponse | undefined> {
  await connection();

  const { data } = await apiClient().listVisibleParts({
    query: listAskedFor(category, query, currency),
    cache: 'no-store',
  });
  return data;
}
