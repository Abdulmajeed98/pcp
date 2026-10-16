import { useSearchInTheAddress } from '../model/search';
import { FoundParts } from './found-parts';
import { SearchForm } from './search-form';

// The Admin console's Catalog: a search of the whole catalog by name,
// manufacturer or part number, optionally in one Category, and what it found,
// a page at a time. It opens on every Part, in name order. The Admin console
// is in English only, so its text is written here.
export function CatalogPage() {
  const [search, show] = useSearchInTheAddress();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold sm:text-2xl">Catalog</h1>
      <SearchForm search={search} onSearch={show} />
      <FoundParts search={search} onSearch={show} />
    </div>
  );
}
