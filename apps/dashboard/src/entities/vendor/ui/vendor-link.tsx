import { AsWritten } from '@pcp/ui';
import { cn } from 'cn';
import { Link } from 'react-router';

import { linkOverRow } from '@/shared/ui';

// A Vendor's name on a row of the Admin console's lists, as the Vendor
// writes it, in its own direction, as the link to its page under the
// Vendors, which covers the whole row (the dashboard's DESIGN.md, Rows and
// tables). Expiring Offers and the Referrals draw it so; a list may give it
// a class of its own, as the Referrals let a name with no space break
// anywhere.
export function VendorLink({
  vendor,
  className,
}: {
  vendor: { id: string; name: string };
  className?: string;
}) {
  return (
    <Link to={`/vendors/${vendor.id}`} className={cn('font-[550]', className, linkOverRow)}>
      <AsWritten>{vendor.name}</AsWritten>
    </Link>
  );
}
