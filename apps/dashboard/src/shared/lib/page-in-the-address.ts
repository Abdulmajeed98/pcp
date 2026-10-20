import { useSearchParams } from 'react-router';

// The page an address's query holds, counted from 0 as the API counts it.
// The address counts from 1, as a person counts, so `page=2` is 1; a page
// left out, not a whole number, or below 2 is the first.
export function pageIn(params: URLSearchParams): number {
  const written = Number.parseInt(params.get('page') ?? '', 10);
  return Number.isInteger(written) && written > 1 ? written - 1 : 0;
}

// Writes a page, counted from 0, into an address's query, counted from 1,
// and leaves the first page out, so that it is the bare address.
export function writePageInto(params: URLSearchParams, page: number): void {
  if (page > 0) params.set('page', String(page + 1));
}

// The page of a list the address holds, counted from 0 as the API counts it,
// and a way to show another, for a list that has no search, such as the
// Vendors. The address holds it, `/vendors?page=2`, counted from 1 as a
// person counts, so that the page can be reloaded and shared, and the
// browser's back button returns to the one before. The first page is the
// bare address. A list with a search reads and writes its page with
// `pageIn` and `writePageInto`, beside its other terms.
export function usePageInTheAddress(): [number, (page: number) => void] {
  const [params, setParams] = useSearchParams();

  function show(next: number): void {
    const written = new URLSearchParams();
    writePageInto(written, next);
    setParams(written);
  }

  return [pageIn(params), show];
}
