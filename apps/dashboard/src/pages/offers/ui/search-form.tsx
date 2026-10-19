import { SearchIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import type { OffersSearch } from '@/entities/offer';
import { useTranslation } from '@/shared/i18n';
import { Button, Input, Label } from '@/shared/ui';

// The search of the Vendor's own Offers: the words and the button, on one
// line, every control 44 pixels high. The words are searched when the
// Vendor taps Search or presses Enter, from the first page.
export function SearchForm({
  search,
  onSearch,
}: {
  search: OffersSearch;
  onSearch: (search: OffersSearch) => void;
}) {
  const { t } = useTranslation();

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
    onSearch({ words, page: 0 });
  }

  return (
    <search>
      <form className="flex gap-2" onSubmit={submit}>
        <Label htmlFor="offers-search" className="sr-only">
          {t('OffersScreen.searchLabel')}
        </Label>
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="offers-search"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder={t('OffersScreen.searchPlaceholder')}
            className="ps-9"
            value={words}
            onChange={(event) => setWords(event.target.value)}
          />
        </div>
        <Button type="submit">{t('OffersScreen.search')}</Button>
      </form>
    </search>
  );
}
