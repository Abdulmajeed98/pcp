import { SearchIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { type CategoryKey, categoryName, useCategories } from '@/entities/category';
import { Button, Input, Label, NativeSelect, NativeSelectOption } from '@/shared/ui';

import type { CatalogSearch } from '../model/search';

// The Catalog's search: the words, the Category, and the button. Where the
// list is narrow, on a phone or beside a Part on a desk, the words take the
// whole width and the Category shares the next line with the button; where
// it is wider all three sit on one line. Every control is 44 pixels high.
//
// The words are searched when the Admin taps Search or presses Enter. A new
// Category is searched at once, with the words as they are typed. Either
// starts again at the first page.
export function SearchForm({
  search,
  onSearch,
}: {
  search: CatalogSearch;
  onSearch: (search: CatalogSearch) => void;
}) {
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
      <form className="flex flex-col gap-2 @lg:flex-row" onSubmit={submit}>
        <Label htmlFor="catalog-search" className="sr-only">
          Search the catalog
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
            placeholder="Name, manufacturer or part number"
            className="ps-9"
            value={words}
            onChange={(event) => setWords(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Label htmlFor="catalog-category" className="sr-only">
            Category
          </Label>
          <NativeSelect
            id="catalog-category"
            className="flex-1 @lg:w-48 @lg:flex-none"
            value={search.category ?? ''}
            onChange={(event) => choose(event.target.value)}
          >
            <NativeSelectOption value="">All Categories</NativeSelectOption>
            {categories.data?.map(({ key }) => (
              <NativeSelectOption key={key} value={key}>
                {categoryName(key)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button type="submit">Search</Button>
        </div>
      </form>
    </search>
  );
}
