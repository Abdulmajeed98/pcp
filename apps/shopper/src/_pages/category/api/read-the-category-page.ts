import type { VisiblePartPageResponse } from '@pcp/api-client';
import { connection } from 'next/server';

import type { Category } from '@/entities/category';
import type { CategoryQuery } from '@/features/search-parts';
import { apiClient } from '@/shared/api';
import type { Currency } from '@/shared/currency';

// How many Parts a page of a Category's list holds: as many as the
// dashboard's lists hold, and within the 12 to 24 a printed menu sheet holds.
export const partsAPage = 20;

// What a Category page reads from the API, on the server, for each request
// (the browse spec's The Shopper app): one page of the Category's Visible
// Parts, in BRW-1's order, each with its Lowest Price in the chosen currency,
// for the search the address holds. The API does the searching, the order
// and the prices; the page counts its pages from 1 and the API from 0. A read
// the API does not answer, or refuses, is nothing, as the API's client
// answers both with no data.
export async function readTheCategoryPage(
  category: Category,
  { search, page }: CategoryQuery,
  currency: Currency,
): Promise<VisiblePartPageResponse | undefined> {
  // Rendering waits here for a request, so the page is never built ahead,
  // when the app is built and no API runs, nor kept: prices change by the
  // hour and depend on the Shopper's cookie.
  await connection();

  const { data } = await apiClient().listVisibleParts({
    query: {
      category,
      currency,
      search: search === '' ? undefined : search,
      page: page - 1,
      size: partsAPage,
    },
    cache: 'no-store',
  });
  return data;
}
