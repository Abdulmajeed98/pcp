import { cn } from 'cn';
import { PlusIcon } from 'lucide-react';
import { Link, useOutlet } from 'react-router';

import {
  useAddressKeepingTheQuery,
  usePageInTheAddress,
  useWideScreen,
} from '@/shared/lib';
import { buttonVariants } from '@/shared/ui';

import { ListedVendors } from './listed-vendors';

// The Admin console's Vendors, as the dashboard's DESIGN.md lays out a list
// (Framed sheet, redesign ticket 09): its title row with New Vendor, then
// the count in words and every Vendor, active and deactivated, in name
// order, a page at a time. The list has no states to filter by, so it has no
// tabs, and no search. The Admin console is in English only, so its text is
// written here.
//
// A screen opened from it, a Vendor's page, its edit form or the form for a
// new Vendor, is its child. On a screen as wide as a desk's, the list takes
// the sheet's whole width until one is opened; then the list keeps seven
// twelfths on the start side and the opened screen takes five, past an Edge
// line, as the Catalog lays out its list and a Part. On a phone the opened
// screen takes the whole screen, and the list is not rendered at all, so
// that it asks the API for nothing.
export function VendorsPage() {
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
  const [page, show] = usePageInTheAddress();
  const keepingTheQuery = useAddressKeepingTheQuery();

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="screen-title">Vendors</h1>
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
