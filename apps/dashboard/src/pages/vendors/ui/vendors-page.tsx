import { MousePointerClickIcon, PlusIcon } from 'lucide-react';
import { Link, useOutlet } from 'react-router';

import { useAddressKeepingTheQuery, useWideScreen } from '@/shared/lib';
import { buttonVariants } from '@/shared/ui';

import { usePageInTheAddress } from '../model/page';
import { ListedVendors } from './listed-vendors';

// The Admin console's Vendors: every Vendor, active and deactivated, in name
// order, a page at a time. The Admin console is in English only, so its text
// is written here.
//
// A screen opened from it, a Vendor's page or the form for a new Vendor, is
// its child. On a screen as wide as a desk's, the list keeps the start side
// and the opened screen shows beside it, as the Catalog lays out its list and
// a Part. On a phone the opened screen takes the whole screen, and the list
// is not rendered at all, so that it asks the API for nothing.
export function VendorsPage() {
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
  const [page, show] = usePageInTheAddress();
  const keepingTheQuery = useAddressKeepingTheQuery();

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold sm:text-2xl">Vendors</h1>
        <Link
          to={keepingTheQuery('/vendors/new')}
          className={buttonVariants({ variant: 'outline' })}
        >
          <PlusIcon data-icon="inline-start" />
          New Vendor
        </Link>
      </div>
      <ListedVendors page={page} onPage={show} />
    </div>
  );
}

// The pane beside the list, before a Vendor is opened.
function NothingOpened() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
      <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        <MousePointerClickIcon aria-hidden="true" className="size-5" />
      </span>
      <p>Open a Vendor from the list to see it here, or create a new one.</p>
    </div>
  );
}
