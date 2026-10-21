import { usePageInTheAddress } from '@/shared/lib';

import { ListedVendors } from './listed-vendors';

// The Admin console's Expiring Offers: the active Vendors that have Expired
// Offers or Offers about to expire, a page at a time, most urgent first, so
// that the Admin can remind them personally, by a call or in WhatsApp
// (OFF-9). The platform sends nothing itself. A Vendor leaves the list once
// its Offers are confirmed. The Admin console is in English only, so its text
// is written here.
//
// A row leads to the Vendor's page, under the Vendors, which shows it beside
// their list on a wide screen. The list itself has nothing beside it, so it
// takes the sheet's whole width, as the dashboard's DESIGN.md lays out a
// list (redesign ticket 10).
export function ExpiringOffersPage() {
  const [page, show] = usePageInTheAddress();

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="screen-title">Expiring Offers</h1>
        <p className="text-sm text-muted-foreground">
          Active Vendors with Offers expired or about to expire, most urgent first, to
          remind. The platform sends them nothing itself.
        </p>
      </div>
      <ListedVendors page={page} onPage={show} />
    </div>
  );
}
