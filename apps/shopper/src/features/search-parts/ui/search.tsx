import { getLocale, getTranslations } from 'next-intl/server';

import { type Category, categoryAddress } from '@/entities/category';

import type { CategoryQuery, OfferedFilters, PriceEnd } from '../model/category-query';
import { FiltersFold } from './filters-fold';
import { SearchForm } from './search-form';

// A Category page's search and filters, as the server draws them: the form,
// sent to the Category page's own address, with the search the address holds
// and the filters the API's answer offers, each chip ticked as the address
// chose it and each end of the price range as it was typed, and the words in
// the page's language. Without the API's answer of the filters, the form
// holds the search alone, with Show Parts and Clear all.
export async function Search({
  category,
  query,
  offered,
  range,
  className,
}: {
  category: Category;
  query: CategoryQuery;
  offered: OfferedFilters | undefined;
  range: { lowest: PriceEnd; highest: PriceEnd };
  className?: string;
}) {
  const [language, t] = await Promise.all([getLocale(), getTranslations('SearchParts')]);
  const priceRange =
    offered?.priceRange.lowest != null && offered.priceRange.highest != null
      ? offered.priceRange
      : null;

  return (
    <SearchForm
      action={categoryAddress(language, category)}
      search={query.search}
      priceRange={priceRange}
      words={{
        title: t('title'),
        label: t('label', { category }),
        placeholder: t('placeholder'),
      }}
      className={className}
    >
      <FiltersFold category={category} query={query} offered={offered} range={range} />
    </SearchForm>
  );
}
