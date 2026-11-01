import type { VendorSummaryResponse } from '@pcp/api-client';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { cn } from 'cn';
import { Link, type To, useMatch } from 'react-router';

import { DeactivatedMark } from '@/entities/vendor';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import {
  linkOverRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

// The Vendors of a page of the list, as the dashboard's DESIGN.md lays out a
// list: a table from 64rem, two-line rows on a phone, never cards. A Vendor
// is its name as it writes it, in the Row type, its login phone number in
// Iraq's own form, which is English in every language, in Note Grey, and
// whether it is deactivated, the "Deactivated" mark drawn as the "Needed"
// mark is. The whole row opens the Vendor's page, while the link's name is
// the Vendor's alone, and the page of the list stays on its address; it
// takes a Raised Stone ground under the pointer, and the row of the Vendor
// open beside the list is on Active Stone.

// The ground of a row: Raised Stone under the pointer, Active Stone when its
// Vendor is open beside the list.
function rowGround(opened: boolean): string {
  return cn('hover-colour relative', opened ? 'bg-accent' : 'hover:bg-secondary');
}

// Whether this Vendor is the one open beside the list, and the address of
// its page, which keeps the page of the list.
function useVendorLink(vendor: VendorSummaryResponse): { opened: boolean; to: To } {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const opened = useMatch('/vendors/:vendorId/*')?.params.vendorId === vendor.id;
  return { opened, to: keepingTheQuery(`/vendors/${vendor.id}`) };
}

// A table cell's text starts at the row's top, so that a Vendor whose name
// takes two lines keeps its phone number and its state level with the
// name's first line.
const cellAtTop = 'align-top py-3.5';

// From 64rem: a table of three columns, the Vendor's name given the most
// width, then its state, then its login phone number, end-aligned in
// tabular figures so that the numbers' digits line up down the column, as
// Taste's inspector asks of figures in a table. The rows bleed 8 pixels past
// the text on each side.
export function VendorsTable({ vendors }: { vendors: readonly VendorSummaryResponse[] }) {
  return (
    <div className="-mx-2">
      <Table aria-label="Vendors">
        <TableHeader>
          <TableRow className="border-b-0">
            <TableHead className="w-1/2 first:ps-2">Vendor</TableHead>
            <TableHead>State</TableHead>
            <TableHead className="pe-2 text-end">Login phone number</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="border-t border-rule">
          {vendors.map((vendor) => (
            <VendorTableRow key={vendor.id} vendor={vendor} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function VendorTableRow({ vendor }: { vendor: VendorSummaryResponse }) {
  const { opened, to } = useVendorLink(vendor);

  return (
    <TableRow className={rowGround(opened)}>
      <TableCell className={cn(cellAtTop, 'font-[550] wrap-anywhere first:ps-2')}>
        <Link to={to} aria-current={opened ? 'page' : undefined} className={linkOverRow}>
          <AsWritten>{vendor.name}</AsWritten>
        </Link>
      </TableCell>
      <TableCell className={cn(cellAtTop, 'whitespace-nowrap')}>
        {/* Only "Deactivated" is marked (the owner's "Only Deactivated",
            redesign ticket 09): an active Vendor's cell is empty to the eye,
            and says "Active" to a screen reader, never nothing. */}
        {vendor.active ? (
          <span className="sr-only">Active</span>
        ) : (
          <DeactivatedMark className="-ms-1.5" />
        )}
      </TableCell>
      <TableCell
        className={cn(
          cellAtTop,
          'pe-2 text-end whitespace-nowrap text-muted-foreground tabular-nums',
        )}
      >
        <AlwaysEnglish>{vendor.loginPhoneNumber.national}</AlwaysEnglish>
      </TableCell>
    </TableRow>
  );
}

// On a phone: two-line rows, the Vendor's name on the first line, its login
// phone number and, for a deactivated Vendor, its mark on the second.
export function VendorsList({ vendors }: { vendors: readonly VendorSummaryResponse[] }) {
  return (
    <ul aria-label="Vendors" className="-mx-2 divide-y divide-rule border-y border-rule">
      {vendors.map((vendor) => (
        <li key={vendor.id}>
          <VendorListRow vendor={vendor} />
        </li>
      ))}
    </ul>
  );
}

function VendorListRow({ vendor }: { vendor: VendorSummaryResponse }) {
  const { opened, to } = useVendorLink(vendor);

  return (
    <div
      className={cn(
        'flex min-h-18 flex-col justify-center gap-0.5 px-2 py-3 text-sm',
        rowGround(opened),
      )}
    >
      <Link
        to={to}
        aria-current={opened ? 'page' : undefined}
        className={cn('font-[550] wrap-anywhere', linkOverRow)}
      >
        <AsWritten>{vendor.name}</AsWritten>
      </Link>
      <p className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
        <AlwaysEnglish className="tabular-nums">
          {vendor.loginPhoneNumber.national}
        </AlwaysEnglish>
        {!vendor.active && <DeactivatedMark />}
      </p>
    </div>
  );
}
