import { useSearchParams } from 'react-router';

import type { CategoryKey } from '@/entities/category';

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
    page: pageFrom(params.get('page')),
  };

  function show({ words, category, page }: CatalogSearch): void {
    const next = new URLSearchParams();
    if (words.trim() !== '') next.set('search', words.trim());
    if (category !== undefined) next.set('category', category);
    if (page > 0) next.set('page', String(page + 1));
    setParams(next);
  }

  return [search, show];
}

function pageFrom(written: string | null): number {
  const page = Number.parseInt(written ?? '', 10);
  return Number.isInteger(page) && page > 1 ? page - 1 : 0;
}
