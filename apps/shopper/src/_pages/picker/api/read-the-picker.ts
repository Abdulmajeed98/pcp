import { type Build, partValuesOf } from '@/entities/build';
import type { Category } from '@/entities/category';
import { type PickerQuery, readAPageOfTheList } from '@/features/search-parts';
import type { Currency } from '@/shared/currency';

import { asksTheOtherWay, type PickerAnswers } from '../model/what-the-picker-shows';

// What the picker reads of its list from the API, on the server, for each
// request, in the chosen currency, with no cache (the builder spec's The
// picker's conditions): the page its address asks for, of the Category's
// Parts in stock only, with the Build from the Shopper's cookie as `part`
// once it holds a Part, so that each answers whether it is Compatible with
// it and those that are not are left out, unless the switch keeps them. An
// empty Build is not sent, since a query cannot tell it from none, and every
// Part fits it. The browser never calls the API.
//
// When its sheet needs it (`asksTheOtherWay`), it then reads how many Parts
// the list holds with the switch the other way, one Part to a page, since
// the count alone is wanted: those that fit when the switch shows every
// Part, or every Part in stock when the Build leaves the list empty. A read
// the API does not answer, or refuses, is nothing.
export async function readThePickersList(
  category: Category,
  query: PickerQuery,
  currency: Currency,
  build: Build,
): Promise<PickerAnswers> {
  const judged = build.length > 0;
  const conditions = {
    inStockOnly: true,
    part: judged ? partValuesOf(build) : undefined,
  };
  const page = await readAPageOfTheList(category, query, currency, {
    ...conditions,
    keepNotCompatible: query.showAll,
  });
  if (!asksTheOtherWay(page, query, judged)) return { page };

  const otherWay = await readAPageOfTheList(
    category,
    { ...query, page: 1 },
    currency,
    { ...conditions, keepNotCompatible: !query.showAll },
    1,
  );
  return { page, otherWay: otherWay?.totalElements };
}
