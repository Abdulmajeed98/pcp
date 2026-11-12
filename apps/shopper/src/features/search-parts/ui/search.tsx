import { getLocale, getTranslations } from 'next-intl/server';

import { type Category, categoryAddress } from '@/entities/category';

import {
  type CategoryQuery,
  fieldsTheFormKeeps,
  type OfferedFilters,
  type PickerQuery,
  type PriceEnd,
} from '../model/category-query';
import { FiltersFold } from './filters-fold';
import { SearchForm } from './search-form';

// A Category page's search and filters, as the server draws them: the form,
// sent to the list's own address, a Category page's or the picker's
// (`list`), with the search the address holds and the filters the API's
// answer offers, each chip ticked as the address chose it and each end of
// the price range as it was typed, and the words in the page's language. In
// the picker the form keeps the switch as it is (`fieldsTheFormKeeps`).
// Without the API's answer of the filters, the form holds the search alone,
// with Show Parts and Clear all.
export async function Search({
  category,
  query,
  offered,
  range,
  list,
  className,
}: {
  category: Category;
  query: CategoryQuery | PickerQuery;
  offered: OfferedFilters | undefined;
  range: { lowest: PriceEnd; highest: PriceEnd };
  // The list's own address with no query, a Category page's when left out.
  list?: string;
  className?: string;
}) {
  const [language, t] = await Promise.all([getLocale(), getTranslations('SearchParts')]);
  const priceRange =
    offered?.priceRange.lowest != null && offered.priceRange.highest != null
      ? offered.priceRange
      : null;

  return (
    <SearchForm
      action={list ?? categoryAddress(language, category)}
      kept={fieldsTheFormKeeps(query)}
      search={query.search}
      priceRange={priceRange}
      words={{
        title: t('title'),
        label: t('label', { category }),
        placeholder: t('placeholder'),
      }}
      className={className}
    >
      <FiltersFold
        query={query}
        offered={offered}
        range={range}
        list={list ?? categoryAddress(language, category)}
      />
    </SearchForm>
  );
}
