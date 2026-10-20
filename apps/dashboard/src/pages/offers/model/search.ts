import { useSearchParams } from 'react-router';

import type { OffersSearch } from '@/entities/offer';
import { pageIn, writePageInto } from '@/shared/lib';

// The search of the Vendor's own Offers the address holds, and a way to show
// another. The address holds it, `?search=ryzen&page=2`, as the Catalog's
// does, so that a search can be reloaded and the browser's back button
// returns to the one before. The page is counted from 1 in the address, as a
// person counts. The query is kept on the screen's own address, so it serves
// the portal's own router and the acting frame alike.
export function useSearchInTheAddress(): [OffersSearch, (search: OffersSearch) => void] {
  const [params, setParams] = useSearchParams();

  const search: OffersSearch = {
    words: params.get('search') ?? '',
    page: pageIn(params),
  };

  function show({ words, page }: OffersSearch): void {
    const next = new URLSearchParams();
    if (words.trim() !== '') next.set('search', words.trim());
    writePageInto(next, page);
    setParams(next);
  }

  return [search, show];
}
