import { useSearchParams } from 'react-router';

import { type OffersSearch, offersStates } from '@/entities/offer';
import { pageIn, writePageInto } from '@/shared/lib';

// The search of the Vendor's own Offers the address holds, and a way to show
// another. The address holds it, `?tab=needs-confirming&search=ryzen&page=2`,
// as the Catalog's does, so that a search can be reloaded and the browser's
// back button returns to the one before. The state is the tab the Vendor is
// in, All when it is left out or unknown; it is `tab` in the address, never
// `state`, which is OAuth's own: keycloak-js reads an address holding it as
// the login's answer, and a reload of it fails at Keycloak. The page is counted from 1 in the
// address, as a person counts. The query is kept on the screen's own
// address, so it serves the portal's own router and the acting frame alike.
export function useSearchInTheAddress(): [OffersSearch, (search: OffersSearch) => void] {
  const [params, setParams] = useSearchParams();

  const written = params.get('tab');
  const search: OffersSearch = {
    words: params.get('search') ?? '',
    state: offersStates.find((state) => state === written) ?? 'all',
    page: pageIn(params),
  };

  function show(next: OffersSearch): void {
    setParams(paramsOf(next));
  }

  return [search, show];
}

// The query of the address that holds a search, such as
// `?tab=out-of-stock&search=ryzen`, for a link to it, as a tab is.
export function addressOf(search: OffersSearch): string {
  const query = paramsOf(search).toString();
  return query === '' ? '' : `?${query}`;
}

function paramsOf({ words, state, page }: OffersSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (state !== 'all') params.set('tab', state);
  if (words.trim() !== '') params.set('search', words.trim());
  writePageInto(params, page);
  return params;
}
