import { SearchIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Input, Label, ScreenSearch } from '@/shared/ui';

import type { CatalogSearch } from '../model/search';

// The Catalog's search, of the whole catalog by name, manufacturer or part
// number (DESIGN.md's Layout). From 64rem it sits in the centre of the
// frame's top bar, on the Sheet ground; on a phone it is the first row of
// the sheet below the tabs, as wide as the sheet. It has no button of its
// own: the words are searched when the Admin presses Enter or the keyboard's
// search key, in the Category the Admin is in, from the first page. A
// magnifier in Note Grey stands on its start side.
export function SearchForm({
  search,
  onSearch,
}: {
  search: CatalogSearch;
  onSearch: (search: CatalogSearch) => void;
}) {
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

  return (
    <ScreenSearch>
      <search>
        <form onSubmit={submit}>
          <Label htmlFor="catalog-search" className="sr-only">
            Search the catalog
          </Label>
          <div className="relative min-w-0">
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
        </form>
      </search>
    </ScreenSearch>
  );
}
