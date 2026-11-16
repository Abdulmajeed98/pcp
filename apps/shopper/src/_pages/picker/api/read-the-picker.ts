import type { VisiblePartPageResponse } from '@pcp/api-client';
import { connection } from 'next/server';

import { type Build, partValuesOf } from '@/entities/build';
import type { Category } from '@/entities/category';
import {
  listAskedFor,
  type OfferedFilters,
  type PickerQuery,
} from '@/features/search-parts';
import { apiClient, refusesTheBuild } from '@/shared/api';
import type { Currency } from '@/shared/currency';

// What the picker reads first from the API, on the server, for each request,
// with no cache: the Category's filters in stock only (BLD-2), so that its
// choices are the values its Parts in stock hold. The form is built from it,
// and the address is read against it. A read the API does not answer, or
// refuses, is nothing.
export async function readThePickersFilters(
  category: Category,
  currency: Currency,
): Promise<OfferedFilters | undefined> {
  // Rendering waits here for a request, so the page is never built ahead
  // nor kept: prices change by the hour and depend on the Shopper's cookie.
  await connection();

  const { data } = await apiClient().readVisiblePartsFilters({
    query: { category, currency, inStockOnly: true },
    cache: 'no-store',
  });
  return data;
}

// What the picker reads of its list then, for each request (the builder
// spec's The picker's conditions): the page its address asks for, as a
// Category page asks for its own (`listAskedFor`), with the picker's
// conditions: in stock only; the Build from the Shopper's cookie as `part`
// once it holds a Part, so that each Part answers whether it is Compatible
// with it and those that are not are left out; and the switch, which keeps
// them. The answer then says, in the same statement, how many of the Parts
// it judged are Compatible and how many are not, so the list is asked once.
// An empty Build is not sent, since a query cannot tell it from none, and
// every Part is Compatible with it. The browser never calls the API. A Build
// the API refuses, as a cookie edited by hand can make it, is said so
// (`build-refused`); a read the API does not answer, or refuses otherwise,
// is nothing.
export async function readThePickersList(
  category: Category,
  query: PickerQuery,
  currency: Currency,
  build: Build,
): Promise<VisiblePartPageResponse | 'build-refused' | undefined> {
  await connection();

  const { data, error, response } = await apiClient().listVisibleParts({
    query: {
      ...listAskedFor(category, query, currency),
      inStockOnly: true,
      part: build.length > 0 ? partValuesOf(build) : undefined,
      keepNotCompatible: query.showAll ? true : undefined,
    },
    cache: 'no-store',
  });
  return refusesTheBuild({ status: response?.status, error }) ? 'build-refused' : data;
}
