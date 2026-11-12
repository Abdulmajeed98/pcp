import type { ListVisiblePartsData, VisiblePartPageResponse } from '@pcp/api-client';
import { connection } from 'next/server';

import type { Category } from '@/entities/category';
import { apiClient } from '@/shared/api';
import type { Currency } from '@/shared/currency';

import type { CategoryQuery, OfferedFilters } from '../model/category-query';

// How many Parts a page of a Category's list holds, on a Category page and
// in the picker: as many as the dashboard's lists hold, and within the 12 to
// 24 a printed menu sheet holds.
export const partsAPage = 20;

// The picker's conditions on a Category's list (the builder spec's The
// picker's conditions): in stock only, the Build so far, as `GET v1/build`
// takes its `part` values, which each Part then answers whether it is
// Compatible with, and the switch, which keeps the Parts that are not. A
// Category page asks with none of them.
export interface PickersConditions {
  inStockOnly?: boolean;
  part?: readonly string[];
  keepNotCompatible?: boolean;
}

// What a Category's list reads first from the API, on the server, for each
// request: the Category's filters (`GET v1/visible-parts/filters`), each with
// the values its Visible Parts hold, and the range of their Lowest Prices in
// the chosen currency; in the picker, those of the Parts in stock alone. The
// form is built from it, and the address is read against it, so that nothing
// it does not offer is ever sent. A read the API does not answer, or
// refuses, is nothing.
export async function readTheFilters(
  category: Category,
  currency: Currency,
  { inStockOnly }: Pick<PickersConditions, 'inStockOnly'> = {},
): Promise<OfferedFilters | undefined> {
  // Rendering waits here for a request, so the page is never built ahead,
  // when the app is built and no API runs, nor kept: prices change by the
  // hour and depend on the Shopper's cookie.
  await connection();

  const { data } = await apiClient().readVisiblePartsFilters({
    query: { category, currency, ...(inStockOnly === true ? { inStockOnly } : {}) },
    cache: 'no-store',
  });
  return data;
}

// What a Category's list reads then, for each request (the browse spec's The
// Shopper app): one page of the Category's Visible Parts, in BRW-1's order,
// each with its Lowest Price in the chosen currency, for the search, the
// manufacturers, the filters and the price range the address holds, read
// against what the Category's filters offer, and with the picker's
// conditions when it asks them. A filter with several values repeats its
// parameter. The API does the searching, the filtering, the judging, the
// order and the prices; the page counts its pages from 1 and the API from 0.
// A read the API does not answer, or refuses, is nothing.
export async function readAPageOfTheList(
  category: Category,
  { search, manufacturers, filters, lowest, highest, page }: CategoryQuery,
  currency: Currency,
  { inStockOnly, part, keepNotCompatible }: PickersConditions = {},
  size = partsAPage,
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
      inStockOnly: inStockOnly === true ? true : undefined,
      part: part === undefined || part.length === 0 ? undefined : [...part],
      keepNotCompatible: keepNotCompatible === true ? true : undefined,
      page: page - 1,
      size,
    },
    cache: 'no-store',
  });
  return data;
}
