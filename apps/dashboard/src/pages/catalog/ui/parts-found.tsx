import type { PartSummaryResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { Link, type To, useMatch } from 'react-router';

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

// The Parts a search found, as the dashboard's DESIGN.md lays out a list:
// a table from 64rem, two-line rows on a phone, never cards and never a
// picture. A Part is its name in the Row type, its manufacturer in Note
// Grey, and its part numbers in Geist Mono at the small size in Note Grey,
// left to right. The whole row opens the Part's page, while the link's name
// is the Part's alone, and the search stays on its address; it takes a
// Raised Stone ground under the pointer, and the row of the Part open beside
// the list is on Active Stone. A Part's name, its manufacturer and its part
// numbers are English in every language, and are kept apart from the text
// around them.

// The ground of a row: Raised Stone under the pointer, Active Stone when its
// Part is open beside the list.
function rowGround(opened: boolean): string {
  return cn('hover-colour relative', opened ? 'bg-accent' : 'hover:bg-secondary');
}

// Whether this Part is the one open beside the list, and the address of its
// page, which keeps the search.
function usePartLink(part: PartSummaryResponse): { opened: boolean; to: To } {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const opened = useMatch('/catalog/parts/:partId/*')?.params.partId === part.id;
  return { opened, to: keepingTheQuery(`/catalog/parts/${part.id}`) };
}

// A Part's part numbers. Each is kept whole on its line, as the number on a
// box is read whole, and wraps inside itself only when it is longer than the
// line (redesign ticket 07's break-ui).
function PartNumbers({ part }: { part: PartSummaryResponse }) {
  if (part.partNumbers.length === 0) return null;
  return (
    <AlwaysEnglish className="font-mono text-sm text-muted-foreground">
      {part.partNumbers.map((partNumber, index) => (
        <span key={index}>
          {index > 0 && ' '}
          <span className="inline-block max-w-full wrap-anywhere">
            {partNumber}
            {index < part.partNumbers.length - 1 && ','}
          </span>
        </span>
      ))}
    </AlwaysEnglish>
  );
}

// A table cell's text starts at the row's top, so that a Part whose name
// takes two lines or more keeps its manufacturer and part numbers level with
// the name's first line.
const cellAtTop = 'align-top py-3.5';

// From 64rem: a table of three columns, the Part's name given the most
// width. The rows bleed 8 pixels past the text on each side.
export function PartsTable({ parts }: { parts: readonly PartSummaryResponse[] }) {
  return (
    <div className="-mx-2">
      <Table aria-label="Parts found">
        <TableHeader>
          <TableRow className="border-b-0">
            <TableHead className="w-1/2 ps-2">Part</TableHead>
            <TableHead className="w-1/5">Manufacturer</TableHead>
            <TableHead className="pe-2">Part numbers</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="border-t border-rule">
          {parts.map((part) => (
            <PartTableRow key={part.id} part={part} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PartTableRow({ part }: { part: PartSummaryResponse }) {
  const { opened, to } = usePartLink(part);

  return (
    <TableRow className={rowGround(opened)}>
      <TableCell className={cn(cellAtTop, 'ps-2 font-[550]')}>
        <Link to={to} aria-current={opened ? 'page' : undefined} className={linkOverRow}>
          <AlwaysEnglish>{part.name}</AlwaysEnglish>
        </Link>
      </TableCell>
      <TableCell className={cn(cellAtTop, 'text-muted-foreground')}>
        <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
      </TableCell>
      <TableCell className={cn(cellAtTop, 'pe-2')}>
        <PartNumbers part={part} />
      </TableCell>
    </TableRow>
  );
}

// On a phone: two-line rows, the Part's name on the first line, its
// manufacturer and its part numbers on the second.
export function PartsList({ parts }: { parts: readonly PartSummaryResponse[] }) {
  return (
    <ul
      aria-label="Parts found"
      className="-mx-2 divide-y divide-rule border-y border-rule"
    >
      {parts.map((part) => (
        <li key={part.id}>
          <PartListRow part={part} />
        </li>
      ))}
    </ul>
  );
}

function PartListRow({ part }: { part: PartSummaryResponse }) {
  const { opened, to } = usePartLink(part);

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
        className={cn('font-[550]', linkOverRow)}
      >
        <AlwaysEnglish>{part.name}</AlwaysEnglish>
      </Link>
      <p className="flex flex-wrap gap-x-2 text-muted-foreground">
        <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
        <PartNumbers part={part} />
      </p>
    </div>
  );
}
