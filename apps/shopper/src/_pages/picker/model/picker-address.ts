import type { Language } from '@pcp/i18n';

import { type Category, pickerAddress } from '@/entities/category';
import { addressOfAList, type PickerQuery } from '@/features/search-parts';

// The picker's address, in a language, written from its query (the builder
// spec's The Shopper's addresses): the picker's own, `/<language>/build/
// cpu-cooler` (`pickerAddress`), with a Category page's query written by the
// function that writes a Category page's (`addressOfAList`), and the
// switch's parameter when it shows every Part. The address holds only what
// is on, and reads back as the same query (`readPickerQuery`).
export function pickerPageAddress(
  language: Language,
  category: Category,
  query: PickerQuery,
): string {
  return addressOfAList(pickerAddress(language, category), query);
}
