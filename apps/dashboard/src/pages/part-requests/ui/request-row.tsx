import type { PartRequestWithVendorResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { cn } from 'cn';
import { CircleAlertIcon } from 'lucide-react';
import { Link, type To, useMatch } from 'react-router';

import { categoryName } from '@/entities/category';
import { movingProps, type ShownRow, useAddressKeepingTheQuery } from '@/shared/lib';
import {
  linkOverRow,
  RowCell,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

import { VendorOfTheRequest } from './vendor-of-the-request';

// A Part Request on the queue, as the dashboard's DESIGN.md lays it out (the
// owner's d6, part-requests ticket 02): the Part first, as the Admin decides
// by it, its name as the Vendor wrote it and one Note Grey line with its
// Category and its part number; then the Vendor, a link of its own; then the
// days it has waited, from the API, which counts them; and, when the API
// says its Offer would be expired, one line in Action Red that ends the row,
// as every row that needs action ends. No plate: the queue is read for which
// request to take next. A table from 64rem and two-line rows on a phone,
// never cards. The whole row opens the request, while the link's name is the
// request's alone, and the page of the queue stays on its address; it takes
// a Raised Stone ground under the pointer, and the row of the request open
// beside the queue is on Active Stone.

type Request = PartRequestWithVendorResponse;

// Whether this request is the one open beside the queue, and its address,
// which keeps the page of the queue.
function useRequestLink(partRequest: Request): { opened: boolean; to: To } {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const opened =
    useMatch('/part-requests/:partRequestId/*')?.params.partRequestId === partRequest.id;
  return { opened, to: keepingTheQuery(`/part-requests/${partRequest.id}`) };
}

// The ground of a row: Raised Stone under the pointer, Active Stone when its
// request is open beside the queue.
function rowGround(opened: boolean): string {
  return cn('relative', opened ? 'bg-accent' : 'hover:bg-secondary');
}

// The Part as the Vendor gave it: its name, the row's link, and its
// Category and part number below. A name or a part number with no space to
// break at breaks anywhere.
function ThePart({ partRequest }: { partRequest: Request }) {
  const { opened, to } = useRequestLink(partRequest);
  return (
    <span className="flex flex-col gap-0.5">
      <Link
        to={to}
        aria-current={opened ? 'page' : undefined}
        className={cn('font-[550]', linkOverRow)}
      >
        <AsWritten className="block w-fit max-w-full wrap-anywhere">
          {partRequest.name}
        </AsWritten>
      </Link>
      <span className="text-muted-foreground">
        {categoryName(partRequest.category)}
        {' · '}
        <AlwaysEnglish className="font-mono wrap-anywhere">
          {partRequest.partNumber}
        </AlwaysEnglish>
      </span>
    </span>
  );
}

// The line that ends the row of a request whose Offer would be listed as
// expired once it is fulfilled.
// On the row of the request open beside the queue, Active Stone's ground
// leaves Action Red's words at 4.2:1 in the dark scheme, under the 4.5:1
// every text needs, so there they are in Ink, after the mark in Action Red
// (the inspector, part-requests ticket 04).
function WillBeExpired({ opened, className }: { opened: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'flex items-start gap-1.5 font-[550]',
        opened ? 'text-foreground' : 'text-destructive',
        className,
      )}
    >
      <CircleAlertIcon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-destructive"
      />
      Its Offer will be listed as expired
    </span>
  );
}

function days(count: number): string {
  return `${formatNumber(count)} ${count === 1 ? 'day' : 'days'}`;
}

// On a phone: the Part on the first lines, then one Note Grey line with the
// Vendor and how long the request has waited, then the red line, if any.
export function RequestRow({ partRequest }: { partRequest: Request }) {
  const { opened } = useRequestLink(partRequest);

  return (
    <div
      className={cn(
        'hover-colour flex min-h-18 flex-col justify-center gap-1 px-2 py-3 text-sm',
        rowGround(opened),
      )}
    >
      <ThePart partRequest={partRequest} />
      <p className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
        <VendorOfTheRequest vendor={partRequest.vendor} />
        <span aria-hidden="true">·</span>
        <span data-testid="waiting" className="tabular-nums">
          {partRequest.daysSinceSent === 0
            ? 'Waiting since today'
            : `Waiting ${days(partRequest.daysSinceSent)}`}
        </span>
      </p>
      {partRequest.offerWouldBeExpired && <WillBeExpired opened={opened} />}
    </div>
  );
}

// From 64rem: a table of three columns, the Part given half the width, its
// Vendor, and how long it has waited, end aligned in tabular figures, its
// heading with it. The rows bleed 8 pixels past the text on each side. The
// columns' widths are fixed by their headings, so that no column moves when
// a row leaves or arrives, and every row has its rule below it, the last
// too, so that a rule comes and goes only with its row.
export function RequestsTable({ shown }: { shown: ShownRow<Request>[] }) {
  return (
    <div className="-mx-2">
      <Table aria-label="Open Part Requests" className="table-fixed">
        <TableHeader>
          <TableRow className="border-b-0">
            <TableHead className="w-1/2 first:ps-2">Part</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="w-48 pe-2 text-end">Waiting</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="border-t border-rule [&_tr:last-child]:border-b">
          {shown.map((row) => (
            <RequestTableRow key={row.key} row={row} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RequestTableRow({ row }: { row: ShownRow<Request> }) {
  const { item: partRequest } = row;
  const { opened } = useRequestLink(partRequest);

  return (
    <TableRow className={cn('leaves-rule', rowGround(opened))} {...movingProps(row)}>
      <RowCell>
        <ThePart partRequest={partRequest} />
      </RowCell>
      <RowCell>
        {/* The link reaches into the row's padding, so that a row of one
            line stays 48 pixels under a mouse. */}
        <VendorOfTheRequest vendor={partRequest.vendor} className="-my-2" />
      </RowCell>
      <RowCell figure>
        <span className="flex flex-col items-end gap-0.5">
          <span data-testid="waiting">
            {partRequest.daysSinceSent === 0
              ? 'Sent today'
              : days(partRequest.daysSinceSent)}
          </span>
          {partRequest.offerWouldBeExpired && (
            <WillBeExpired opened={opened} className="text-end" />
          )}
        </span>
      </RowCell>
    </TableRow>
  );
}
