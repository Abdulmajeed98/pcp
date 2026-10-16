import { type Path, useLocation } from 'react-router';

// An address with the query of the one shown now kept on it. The Catalog's
// search is in that query, and every screen opened from the Catalog keeps it,
// so that the list beside it on a wide screen, and the way back on a phone,
// show the same search.
export function useAddressKeepingTheQuery(): (pathname: string) => Partial<Path> {
  const { search } = useLocation();
  return (pathname) => ({ pathname, search });
}
