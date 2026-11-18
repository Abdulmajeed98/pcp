import type { SendingVendorResponse } from '@pcp/api-client';
import { AsWritten } from '@pcp/ui';
import { cn } from 'cn';
import { Link } from 'react-router';

import { DeactivatedMark } from '@/entities/vendor';
import { linkAboveRow } from '@/shared/ui';

// The Vendor that sent a Part Request: its name as it writes it, a link of
// its own to its page under the Vendors, underlined and as high as a
// control, and the "Deactivated" mark for a Deactivated Vendor. It is not
// the row's own link, as `VendorLink` is on the Referrals, since a queue's
// row leads to the request: it is raised above the row's link, so that a tap
// on it opens the Vendor's page, and only there (part-requests ticket 02's
// break-ui, which found a 20-pixel link under the 44 a phone needs). A name
// with no space to break at breaks anywhere. `className` lets a table's cell
// pull it into the row's padding, so that a row of one line stays 48 pixels.
export function VendorOfTheRequest({
  vendor,
  className,
}: {
  vendor: SendingVendorResponse;
  className?: string;
}) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-2">
      <Link
        to={`/vendors/${vendor.id}`}
        className={cn(linkAboveRow, 'max-w-full', className)}
      >
        <AsWritten className="wrap-anywhere">{vendor.name}</AsWritten>
      </Link>
      {!vendor.active && <DeactivatedMark />}
    </span>
  );
}
