import { useSearchParams } from 'react-router';

// The page of a list the address holds, counted from 0 as the API counts it,
// and a way to show another, for a list that has no search, such as the
// Vendors. The address holds it, `/vendors?page=2`, counted from 1 as a
// person counts, so that the page can be reloaded and shared, and the
// browser's back button returns to the one before. The first page is the
// bare address.
export function usePageInTheAddress(): [number, (page: number) => void] {
  const [params, setParams] = useSearchParams();

  const written = Number.parseInt(params.get('page') ?? '', 10);
  const page = Number.isInteger(written) && written > 1 ? written - 1 : 0;

  function show(next: number): void {
    setParams(next > 0 ? { page: String(next + 1) } : {});
  }

  return [page, show];
}
