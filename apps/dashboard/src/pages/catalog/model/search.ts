import { useSearchParams } from 'react-router';

import type { CategoryKey } from '@/entities/category';
import { pageIn, writePageInto } from '@/shared/lib';

// A search of the catalog: the words typed, the one Category it is limited to
// if any, and the page of the results, counted from 0 as the API counts them.
export interface CatalogSearch {
  words: string;
  category?: CategoryKey;
  page: number;
}

// The search the Catalog's address holds, and a way to show another. The
// address holds it, `/catalog?search=ryzen&category=cpu&page=2`, so that a
// search can be reloaded and shared, and the browser's back button returns
// to the one before. The page is counted from 1 in the address, as a person
// counts. A search with nothing in it is the bare `/catalog`.
export function useSearchInTheAddress(): [CatalogSearch, (search: CatalogSearch) => void] {
  const [params, setParams] = useSearchParams();

  const search: CatalogSearch = {
    words: params.get('search') ?? '',
    // The API refuses a Category it does not have, and the Catalog shows the
    // refusal, so the address's Category is passed on as it is.
    category: (params.get('category') || undefined) as CategoryKey | undefined,
    page: pageIn(params),
  };

  function show(next: CatalogSearch): void {
    setParams(paramsOf(next));
  }

  return [search, show];
}

// The query of the address that holds a search, such as
// `?search=ryzen&category=cpu`, for a link to it, as a Category's tab is.
export function addressOf(search: CatalogSearch): string {
  const query = paramsOf(search).toString();
  return query === '' ? '' : `?${query}`;
}

function paramsOf({ words, category, page }: CatalogSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (words.trim() !== '') params.set('search', words.trim());
  if (category !== undefined) params.set('category', category);
  writePageInto(params, page);
  return params;
}
