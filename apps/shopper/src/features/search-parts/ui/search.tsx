import { getLocale, getTranslations } from 'next-intl/server';

import { type Category, categoryAddress } from '@/entities/category';

import type { CategoryQuery } from '../model/category-query';
import { SearchForm } from './search-form';

// A Category page's search, as the server draws it: the form, sent to the
// Category page's own address, with the search the address holds and its
// words in the page's language.
export async function Search({
  category,
  query,
  className,
}: {
  category: Category;
  query: CategoryQuery;
  className?: string;
}) {
  const [language, t] = await Promise.all([getLocale(), getTranslations('SearchParts')]);

  return (
    <SearchForm
      action={categoryAddress(language, category)}
      search={query.search}
      words={{
        title: t('title'),
        label: t('label', { category }),
        placeholder: t('placeholder'),
        show: t('show'),
      }}
      className={className}
    />
  );
}
