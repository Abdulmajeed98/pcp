import { useSearchParams } from 'react-router';

import type { CategoryKey } from '@/entities/category';

// A search of the catalog from the Vendor portal: the words typed, the one
// Category it is limited to if any, and the page of the results, counted
// from 0 as the API counts them.
export interface CatalogSearch {
  words: string;
  category?: CategoryKey;
  page: number;
}

// The search the screen's address holds, and a way to show another. The
// address holds it, `add?search=ryzen&category=cpu&page=2`, as the Admin
// console's Catalog does, so that the Offer form opened from a result keeps
// it, the way back after a save returns to it as it was, and the browser's
// back button returns to the one before. The page is counted from 1 in the
// address, as a person counts. The query is kept on the screen's own
// address, so it serves the portal's own router and the acting frame alike.
export function useSearchInTheAddress(): [CatalogSearch, (search: CatalogSearch) => void] {
  const [params, setParams] = useSearchParams();

  const written = Number.parseInt(params.get('page') ?? '', 10);
  const search: CatalogSearch = {
    words: params.get('search') ?? '',
    // The API refuses a Category it does not have, and the screen shows the
    // refusal, so the address's Category is passed on as it is.
    category: (params.get('category') || undefined) as CategoryKey | undefined,
    page: Number.isInteger(written) && written > 1 ? written - 1 : 0,
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
