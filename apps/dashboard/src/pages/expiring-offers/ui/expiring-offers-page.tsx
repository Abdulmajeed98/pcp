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
// keeps a column no wider than a row needs.
export function ExpiringOffersPage() {
  const [page, show] = usePageInTheAddress();

  return (
    <div className="flex max-w-2xl min-w-0 flex-col gap-4">
      <h1 className="text-xl font-semibold sm:text-2xl">Expiring Offers</h1>
      <p className="text-sm text-muted-foreground">
        Active Vendors with Offers expired or about to expire, most urgent first, to remind.
        The platform sends them nothing itself.
      </p>
      <ListedVendors page={page} onPage={show} />
    </div>
  );
}
