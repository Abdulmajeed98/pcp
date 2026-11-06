import type { FilterResponse, ListVisiblePartsData } from '@pcp/api-client';
import { formatNumber, type ShopperMessages } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import type { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import type { FilterValue } from '../model/category-query';

// The translator of the Category page's search and filters.
export type SearchWords = Awaited<ReturnType<typeof getTranslations<'SearchParts'>>>;

// The parameters a Category's list is narrowed by, beside its own, as the
// API's description names them: one for each filter of BRW-2.
type FilterParameter = Exclude<
  keyof ListVisiblePartsData['query'],
  | 'page'
  | 'size'
  | 'category'
  | 'currency'
  | 'search'
  | 'manufacturer'
  | 'lowest'
  | 'highest'
>;

// The filters named in the Shopper set (`SearchParts.filterNames`), keyed by
// the parameter the API asks each by. The Shopper app holds no list of the
// filters, only their names: the form is built from the API's answer.
type NamedFilter = keyof ShopperMessages['SearchParts']['filterNames'];

// Every filter the API's description names has its name in the Shopper set,
// in all three languages, and no name is kept for a filter it does not name:
// a filter the API adds, renames or drops fails `pnpm check`'s type check
// here until the Shopper set names it.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const everyFilterIsNamed: Same<FilterParameter, NamedFilter> = true;
void everyFilterIsNamed;

// Whether the Shopper set names a filter the API answered. One it does not,
// as when the API is newer than the page, is left out of the form, and its
// values out of the address, rather than shown by its parameter.
export function isNamed(parameter: string, t: SearchWords): parameter is NamedFilter {
  return t.has(`filterNames.${parameter as NamedFilter}`);
}

// A filter's name in the page's language: "Socket", or the manufacturer's.
export function nameOfFilter(parameter: NamedFilter, t: SearchWords): string {
  return t(`filterNames.${parameter}`);
}

// What a value of a filter is called on the page, as words to draw and as
// plain text for a name read by a screen reader:
//
// - text, such as a socket's "AM5", and a manufacturer, in English, left to
//   right in every language (LANG-3, `AlwaysEnglish`);
// - a number in Western digits, with its unit when it has one, "240 mm"; one
//   with no unit, as a CPU's cores, is named by its filter where it stands
//   alone, "Cores 8" (`named`), so that it is never read as a bare figure;
// - yes or no in the page's language: a CPU cooler's "Air" and "Liquid",
//   and "Yes" and "No" for any other.
export function wordsOfAValue(
  filter: Pick<FilterResponse, 'parameter' | 'kind' | 'unit'>,
  value: FilterValue,
  t: SearchWords,
  { named = false }: { named?: boolean } = {},
): { words: ReactNode; text: string } {
  const english = (chunks: ReactNode) => <AlwaysEnglish>{chunks}</AlwaysEnglish>;
  const plain = (chunks: string) => chunks;

  if (typeof value === 'boolean') {
    const text =
      filter.parameter === 'waterCooled'
        ? t('waterCooled', { liquid: String(value) })
        : t('yesOrNo', { yes: String(value) });
    return { words: text, text };
  }
  if (typeof value === 'number') {
    const figure = formatNumber(value);
    if (filter.unit !== undefined) {
      const text = `${figure} ${filter.unit}`;
      return { words: english(text), text };
    }
    if (named && isNamed(filter.parameter, t)) {
      const name = nameOfFilter(filter.parameter, t);
      return {
        words: t.rich('valueOfName', { name, value: figure, english }),
        text: t.markup('valueOfName', { name, value: figure, english: plain }),
      };
    }
    return { words: english(figure), text: figure };
  }
  return { words: english(value), text: value };
}
