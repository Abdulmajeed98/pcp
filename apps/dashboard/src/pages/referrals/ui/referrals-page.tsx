import { usePageInTheAddress } from '@/shared/lib';

import { ListedVendors } from './listed-vendors';

// The Admin console's Referrals: every Vendor, active and deactivated, with
// its Referral count, the most first, a page at a time, so that the Admin can
// show a Vendor what the platform sends it (SHR-7). A Referral is one tap by
// a Shopper on the button that sends their Build to the Vendor on WhatsApp.
// The Admin console is in English only, so its text is written here.
//
// It is the Catalog's kind of list, as the Expiring Offers are: the count of
// Vendors in words, the rows, a table from 64rem, and the pages. A row leads
// to the Vendor's page, under the Vendors. The list has nothing beside it,
// so it takes the sheet's whole width.
export function ReferralsPage() {
  const [page, show] = usePageInTheAddress();

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="screen-title">Referrals</h1>
        <p className="text-sm text-muted-foreground">
          How many times Shoppers have sent each Vendor their Build on WhatsApp, the most
          first. Each Vendor sees its own count in its portal.
        </p>
      </div>
      <ListedVendors page={page} onPage={show} />
    </div>
  );
}
