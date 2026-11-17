import type { VendorsReferralCountResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';

import { DeactivatedMark, VendorLink } from '@/entities/vendor';
import { type ShownRow, movingProps } from '@/shared/lib';
import { RowCell, Table, TableBody, TableHead, TableHeader, TableRow } from '@/shared/ui';

// A Vendor with its Referral count, as the dashboard's DESIGN.md lays it out
// (sharing ticket 03): its name as it writes it, in the Row type, wrapping in
// full; whether it is deactivated, the "Deactivated" mark drawn as on the
// Vendors' list; and its count in Western digits, in words and never on a
// plate, since no price is on this list. A table from 64rem and two-line rows
// on a phone, never cards. The whole row leads to the Vendor's page, under
// the Vendors, while the link's name is the Vendor's alone, and takes a
// Raised Stone ground under the pointer. A name with no space to break at
// breaks anywhere.

function Count({ vendor }: { vendor: VendorsReferralCountResponse }) {
  return <span data-testid="referral-count">{formatNumber(vendor.count)}</span>;
}

// On a phone: the Vendor's name on the first line, and on the second its
// count in words, in Note Grey, and, for a deactivated Vendor, its mark.
export function VendorRow({ vendor }: { vendor: VendorsReferralCountResponse }) {
  return (
    <div className="hover-colour relative flex min-h-18 flex-col justify-center gap-0.5 px-2 py-3 text-sm hover:bg-secondary">
      <span>
        <VendorLink vendor={vendor} className="wrap-anywhere" />
      </span>
      <p className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
        <span className="tabular-nums">
          <Count vendor={vendor} /> {vendor.count === 1 ? 'Referral' : 'Referrals'}
        </span>
        {!vendor.active && <DeactivatedMark />}
      </p>
    </div>
  );
}

// From 64rem: a table of three columns, the Vendor given half the width, its
// state, and its count, end aligned in tabular figures so that the digits
// line up down the column. The rows bleed 8 pixels past the text on each
// side. The columns' widths are fixed by their headings, so that no column
// moves when a row leaves or arrives, and every row has its rule below it,
// the last too, so that a rule comes and goes only with its row.
export function VendorsTable({
  shown,
}: {
  shown: ShownRow<VendorsReferralCountResponse>[];
}) {
  return (
    <div className="-mx-2">
      <Table aria-label="Referrals by Vendor" className="table-fixed">
        <TableHeader>
          <TableRow className="border-b-0">
            <TableHead className="w-1/2 first:ps-2">Vendor</TableHead>
            <TableHead>State</TableHead>
            <TableHead className="w-32 pe-2 text-end">Referrals</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="border-t border-rule [&_tr:last-child]:border-b">
          {shown.map((row) => (
            <TableRow
              key={row.key}
              className="hover-colour leaves-rule relative hover:bg-secondary"
              {...movingProps(row)}
            >
              <RowCell>
                <span>
                  <VendorLink vendor={row.item} className="wrap-anywhere" />
                </span>
              </RowCell>
              <RowCell className="whitespace-nowrap">
                {/* Only "Deactivated" is marked, as on the Vendors' list: an
                    active Vendor's cell is empty to the eye, and says
                    "Active" to a screen reader, never nothing. */}
                {row.item.active ? (
                  <span className="sr-only">Active</span>
                ) : (
                  <DeactivatedMark className="-ms-1.5" />
                )}
              </RowCell>
              <RowCell figure>
                <Count vendor={row.item} />
              </RowCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
