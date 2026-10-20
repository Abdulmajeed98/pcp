import { SearchIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { type CategoryKey, categoryName, useCategories } from '@/entities/category';
import { useTranslation } from '@/shared/i18n';
import { Button, Input, Label, NativeSelect, NativeSelectOption } from '@/shared/ui';

import type { CatalogSearch } from '../model/search';

// The search of the catalog, in the portal's language: the words on a line
// of their own, then the Category, named in the shared terms, sharing the
// next line with the button, every control 44 pixels high. On a wider screen
// all three share one line.
//
// The words are searched when the Vendor taps Search or presses Enter. A new
// Category is searched at once, with the words as they are typed. Either
// starts again at the first page.
export function SearchForm({
  search,
  onSearch,
}: {
  search: CatalogSearch;
  onSearch: (search: CatalogSearch) => void;
}) {
  const { t } = useTranslation();
  const categories = useCategories();

  // The words as typed. They follow the address when it changes, as when the
  // browser goes back to an earlier search.
  const [words, setWords] = useState(search.words);
  const [searchedWords, setSearchedWords] = useState(search.words);
  if (search.words !== searchedWords) {
    setSearchedWords(search.words);
    setWords(search.words);
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSearch({ words, category: search.category, page: 0 });
  }

  function choose(category: string): void {
    onSearch({
      words,
      category: (category || undefined) as CategoryKey | undefined,
      page: 0,
    });
  }

  return (
    <search>
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
        <Label htmlFor="catalog-search" className="sr-only">
          {t('CatalogSearch.searchLabel')}
        </Label>
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="catalog-search"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder={t('CatalogSearch.searchPlaceholder')}
            className="ps-9"
            value={words}
            onChange={(event) => setWords(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Label htmlFor="catalog-category" className="sr-only">
            {t('CatalogSearch.category')}
          </Label>
          <NativeSelect
            id="catalog-category"
            className="flex-1 sm:w-48 sm:flex-none"
            value={search.category ?? ''}
            onChange={(event) => choose(event.target.value)}
          >
            <NativeSelectOption value="">
              {t('CatalogSearch.allCategories')}
            </NativeSelectOption>
            {categories.data?.map(({ key }) => (
              <NativeSelectOption key={key} value={key}>
                {categoryName(key)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button type="submit">{t('CatalogSearch.search')}</Button>
        </div>
      </form>
    </search>
  );
}
