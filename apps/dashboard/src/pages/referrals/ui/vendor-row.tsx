import type { VendorsReferralCountResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AsWritten } from '@pcp/ui';
import { cn } from 'cn';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { DeactivatedMark } from '@/entities/vendor';
import { type ShownRow, movingProps } from '@/shared/lib';
import {
  linkOverRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

// A Vendor with its Referral count, as the dashboard's DESIGN.md lays it out
// (sharing ticket 03): its name as it writes it, in the Row type, wrapping in
// full; whether it is deactivated, the "Deactivated" mark drawn as on the
// Vendors' list; and its count in Western digits, in words and never on a
// plate, since no price is on this list. A table from 64rem and two-line rows
// on a phone, never cards. The whole row leads to the Vendor's page, under
// the Vendors, while the link's name is the Vendor's alone, and takes a
// Raised Stone ground under the pointer.

function VendorLink({ vendor }: { vendor: VendorsReferralCountResponse }) {
  return (
    <Link
      to={`/vendors/${vendor.id}`}
      className={cn('font-[550] wrap-anywhere', linkOverRow)}
    >
      <AsWritten>{vendor.name}</AsWritten>
    </Link>
  );
}

function Count({ vendor }: { vendor: VendorsReferralCountResponse }) {
  return <span data-testid="referral-count">{formatNumber(vendor.count)}</span>;
}

// On a phone: the Vendor's name on the first line, and on the second its
// count in words, in Note Grey, and, for a deactivated Vendor, its mark.
export function VendorRow({ vendor }: { vendor: VendorsReferralCountResponse }) {
  return (
    <div className="hover-colour relative flex min-h-18 flex-col justify-center gap-0.5 px-2 py-3 text-sm hover:bg-secondary">
      <span>
        <VendorLink vendor={vendor} />
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

// A table cell's content, which starts at the row's top, so that a Vendor
// whose name takes two lines keeps its state and its count level with the
// name's first line. It holds the cell's padding inside the theme's
// `leaves`, so that a leaving row's space closes whole. A figure is end
// aligned, in tabular figures, its cell with it.
function Cell({
  figure = false,
  className,
  children,
}: {
  figure?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <TableCell className={cn('h-auto p-0 align-top', figure && 'text-end', className)}>
      <div className="leaves">
        <div>
          <div className={cn('px-2 py-3.5', figure && 'text-end tabular-nums')}>
            {children}
          </div>
        </div>
      </div>
    </TableCell>
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
              <Cell>
                <span>
                  <VendorLink vendor={row.item} />
                </span>
              </Cell>
              <Cell className="whitespace-nowrap">
                {/* Only "Deactivated" is marked, as on the Vendors' list: an
                    active Vendor's cell is empty to the eye, and says
                    "Active" to a screen reader, never nothing. */}
                {row.item.active ? (
                  <span className="sr-only">Active</span>
                ) : (
                  <DeactivatedMark className="-ms-1.5" />
                )}
              </Cell>
              <Cell figure>
                <Count vendor={row.item} />
              </Cell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
