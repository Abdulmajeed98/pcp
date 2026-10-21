import { cn } from 'cn';
import { PlusIcon } from 'lucide-react';
import { Link, useOutlet } from 'react-router';

import { useAddressKeepingTheQuery, useWideScreen } from '@/shared/lib';
import { buttonVariants } from '@/shared/ui';

import { useSearchInTheAddress } from '../model/search';
import { CategoryTabs } from './category-tabs';
import { FoundParts } from './found-parts';
import { SearchForm } from './search-form';

// The Admin console's Catalog, as the dashboard's DESIGN.md lays out a list
// (Framed sheet, redesign ticket 07): its title row with New Part, then the
// Categories as tabs, each with its count, the search, the count in words
// and what the search found, a page at a time. It opens on every Part, in
// name order. The Admin console is in English only, so its text is written
// here.
//
// A screen opened from it, a Part, its edit form or a new Part, is its child.
// On a screen as wide as a desk's, the list takes the sheet's whole width
// until one is opened; then the list keeps seven twelfths on the start side
// and the opened screen takes five, past an Edge line. On a phone the opened
// screen takes the whole screen, and the list is not rendered at all, so that
// it asks the API for nothing.
export function CatalogPage() {
  const opened = useOutlet();
  const wide = useWideScreen();

  if (!wide) return opened ?? <TheList />;

  return (
    <div className={cn('grid gap-6', opened !== null && 'grid-cols-12')}>
      <div className={cn('min-w-0', opened !== null && 'col-span-7')}>
        <TheList />
      </div>
      {opened !== null && (
        <div className="col-span-5 min-w-0 border-s border-border ps-6">{opened}</div>
      )}
    </div>
  );
}

function TheList() {
  const [search, show] = useSearchInTheAddress();
  const keepingTheQuery = useAddressKeepingTheQuery();

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="screen-title">Catalog</h1>
        <Link
          to={keepingTheQuery('/catalog/new')}
          className={buttonVariants({ variant: 'outline' })}
        >
          <PlusIcon data-icon="inline-start" />
          New Part
        </Link>
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <CategoryTabs search={search} />
        <SearchForm search={search} onSearch={show} />
        <FoundParts search={search} onSearch={show} />
      </div>
    </div>
  );
}
