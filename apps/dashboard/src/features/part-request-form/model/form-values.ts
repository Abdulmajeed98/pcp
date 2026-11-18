import type { SendPartRequestRequest, SkippedRowResponse } from '@pcp/api-client';
import { westernDigitsIn } from '@pcp/i18n';

import type { CategoryKey } from '@/entities/category';
import {
  newOfferDetailsTyped,
  offerDetailsOf,
  type OfferDetailsTyped,
  offerDetailsTypedOf,
} from '@/entities/offer';

// What the Part Request form holds while the Vendor fills it in: the Part's
// Category, its name and its part number as typed, and the Offer the Vendor
// would make, as the Offer form holds an Offer's details. The Category is
// empty until one is chosen.
export interface PartRequestFormValues extends OfferDetailsTyped {
  category: CategoryKey | '';
  name: string;
  partNumber: string;
}

// What the form starts with: the name and the Category it is given, as from
// an empty catalog search, else nothing, and the Offer as a new Offer's
// form starts, in stock.
export function partRequestFormValues({
  name = '',
  category,
}: {
  name?: string;
  category?: CategoryKey;
}): PartRequestFormValues {
  return { category: category ?? '', name, partNumber: '', ...newOfferDetailsTyped };
}

// A row of an Offer sheet that matched no Part, as the upload's result
// carries it (`noPart` of `SkippedRowResponse`): the Part's name as the row
// wrote it, its part number, and the Offer the row states, each detail as
// an Offer answers it.
export type RowOfAnOfferSheet = Pick<
  SkippedRowResponse,
  'name' | 'partNumber' | 'usdPrice' | 'iqdPrice' | 'inStock' | 'warrantyMonths'
>;

// What the form starts with from a row of an Offer sheet that matched no
// Part (SHT-6): its name as written, its part number, the Offer the row
// states as the Offer form starts from an Offer's, and the Category left
// for the Vendor to choose, which the file does not hold.
export function partRequestFormValuesFromARow(
  row: RowOfAnOfferSheet,
): PartRequestFormValues {
  return {
    category: '',
    name: row.name ?? '',
    partNumber: row.partNumber,
    ...offerDetailsTypedOf(row),
  };
}

// The request as the API is sent it. The name is sent as typed, for the API
// keeps it as written. The part number's digits are read as Western ones, as
// a Kurdish or an Arabic keyboard types them, and the API takes away its
// invisible marks and the space around it. A Category not chosen is sent
// empty, for the API to refuse naming it. The Offer's details are sent as
// the Offer form sends them.
export function partRequestOf(values: PartRequestFormValues): SendPartRequestRequest {
  return {
    category: values.category as CategoryKey,
    name: values.name,
    partNumber: westernDigitsIn(values.partNumber),
    ...offerDetailsOf(values),
  };
}
