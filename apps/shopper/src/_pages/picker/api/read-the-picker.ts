import type { VisiblePartPageResponse } from '@pcp/api-client';

import { type Build, partValuesOf } from '@/entities/build';
import type { Category } from '@/entities/category';
import { type PickerQuery, readAPageOfTheList } from '@/features/search-parts';
import type { Currency } from '@/shared/currency';

// What the picker reads of its list from the API, on the server, for each
// request, in the chosen currency, with no cache (the builder spec's The
// picker's conditions): the page its address asks for, of the Category's
// Parts in stock only, with the Build from the Shopper's cookie as `part`
// once it holds a Part, so that each answers whether it is Compatible with
// it and those that are not are left out, unless the switch keeps them. The
// answer then says, in the same statement, how many of the Parts it judged
// are Compatible and how many are not, so the list is asked once. An empty
// Build is not sent, since a query cannot tell it from none, and every Part
// fits it. The browser never calls the API. A read the API does not answer,
// or refuses, is nothing.
export function readThePickersList(
  category: Category,
  query: PickerQuery,
  currency: Currency,
  build: Build,
): Promise<VisiblePartPageResponse | undefined> {
  return readAPageOfTheList(category, query, currency, {
    inStockOnly: true,
    part: build.length > 0 ? partValuesOf(build) : undefined,
    keepNotCompatible: query.showAll,
  });
}
