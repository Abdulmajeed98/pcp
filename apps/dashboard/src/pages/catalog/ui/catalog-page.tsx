import { MousePointerClickIcon, PlusIcon } from 'lucide-react';
import { Link, useOutlet } from 'react-router';

import { useAddressKeepingTheQuery, useWideScreen } from '@/shared/lib';
import { buttonVariants } from '@/shared/ui';

import { useSearchInTheAddress } from '../model/search';
import { FoundParts } from './found-parts';
import { SearchForm } from './search-form';

// The Admin console's Catalog: a search of the whole catalog by name,
// manufacturer or part number, optionally in one Category, and what it found,
// a page at a time. It opens on every Part, in name order. The Admin console
// is in English only, so its text is written here.
//
// A screen opened from it, a Part, its edit form or a new Part, is its child.
// On a screen as wide as a desk's, the list keeps the start side and the
// opened screen shows beside it, as the dashboard's DESIGN.md lays a list and
// its detail out. On a phone the opened screen takes the whole screen, and
// the list is not rendered at all, so that it asks the API for nothing.
export function CatalogPage() {
  const opened = useOutlet();
  const wide = useWideScreen();

  if (!wide) return opened ?? <TheList />;

  return (
    <div className="grid grid-cols-[minmax(0,26rem)_minmax(0,1fr)] gap-8">
      <TheList />
      <div className="min-w-0 border-s border-border ps-8">
        {opened ?? <NothingOpened />}
      </div>
    </div>
  );
}

function TheList() {
  const [search, show] = useSearchInTheAddress();
  const keepingTheQuery = useAddressKeepingTheQuery();

  return (
    <div className="@container flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold sm:text-2xl">Catalog</h1>
        <Link
          to={keepingTheQuery('/catalog/new')}
          className={buttonVariants({ variant: 'outline' })}
        >
          <PlusIcon data-icon="inline-start" />
          New Part
        </Link>
      </div>
      <SearchForm search={search} onSearch={show} />
      <FoundParts search={search} onSearch={show} />
    </div>
  );
}

// The pane beside the list, before a Part is opened.
function NothingOpened() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
      <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        <MousePointerClickIcon aria-hidden="true" className="size-5" />
      </span>
      <p>Open a Part from the list to see it here, or create a new one.</p>
    </div>
  );
}
