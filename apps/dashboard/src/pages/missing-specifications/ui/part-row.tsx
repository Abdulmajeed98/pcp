import type { PartMissingSpecificationsResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { CircleAlertIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, type To, useMatch } from 'react-router';

import { categoryName } from '@/entities/category';
import { type ShownRow, useAddressKeepingTheQuery } from '@/shared/lib';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui';

// A Part on the list, as the dashboard's DESIGN.md lays out a Part missing
// specifications (redesign ticket 10): its name, its manufacturer and its
// Category, its count of Offers, and what it lacks, in Action Red after a
// circled exclamation mark, by the labels of the needed specifications. A
// table from 64rem and two-line rows on a phone, never cards and never a
// picture. The whole row opens the Part's edit form, while the link's name is
// the Part's alone, and the page of the list stays on its address; it takes a
// Raised Stone ground under the pointer, and the row of the Part open beside
// the list is on Active Stone. A Part's name and manufacturer are English in
// every language.

// What makes the whole row the link: the link's box covers the row, and
// draws the focus outline inside the row's edges.
const linkOverRow =
  'after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring';

// The ground of a row: Raised Stone under the pointer, Active Stone when its
// Part is open beside the list.
function rowGround(opened: boolean): string {
  return cn('hover-colour relative', opened ? 'bg-accent' : 'hover:bg-secondary');
}

// Whether this Part is the one open beside the list, and the address of its
// edit form, which keeps the page of the list.
function usePartLink(part: PartMissingSpecificationsResponse): { opened: boolean; to: To } {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const opened =
    useMatch('/missing-specifications/parts/:partId/*')?.params.partId === part.id;
  return {
    opened,
    to: keepingTheQuery(`/missing-specifications/parts/${part.id}/edit`),
  };
}

function PartLink({ part }: { part: PartMissingSpecificationsResponse }) {
  const { opened, to } = usePartLink(part);
  return (
    <Link to={to} aria-current={opened ? 'page' : undefined} className={linkOverRow}>
      <AlwaysEnglish>{part.name}</AlwaysEnglish>
    </Link>
  );
}

// What the Part lacks, by the needed specifications' labels, in Action Red
// after a circled exclamation mark. On a phone the line says "Lacks"; in the
// table its column does.
function Lacks({ part, said }: { part: PartMissingSpecificationsResponse; said: string }) {
  return (
    <p className="flex items-start gap-1.5 font-medium text-destructive">
      <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span data-testid="lacks">
        {said}
        {part.missingSpecifications.map(({ label }) => label).join(', ')}
      </span>
    </p>
  );
}

function offersIn(count: number): string {
  return `${formatNumber(count)} ${count === 1 ? 'Offer' : 'Offers'}`;
}

// On a phone: the Part's name on the first line, its manufacturer, its
// Category and its count of Offers on the second, and what it lacks on the
// third.
export function PartRow({ part }: { part: PartMissingSpecificationsResponse }) {
  const { opened } = usePartLink(part);

  return (
    <div
      className={cn(
        'flex min-h-18 flex-col justify-center gap-0.5 px-2 py-3 text-sm',
        rowGround(opened),
      )}
    >
      <span className="font-[550]">
        <PartLink part={part} />
      </span>
      <p className="text-muted-foreground">
        <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
        {' · '}
        {categoryName(part.category)}
        {' · '}
        <span data-testid="offer-count">{offersIn(part.offerCount)}</span>
      </p>
      <Lacks part={part} said="Lacks " />
    </div>
  );
}

// A table cell's content, which starts at the row's top, so that a Part
// whose name takes two lines keeps the rest level with its first line. It
// holds the cell's padding inside the theme's `leaves`, so that a leaving
// row's space closes whole.
function Cell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <TableCell className="h-auto p-0 align-top">
      <div className="leaves">
        <div>
          <div className={cn('px-2 py-3.5', className)}>{children}</div>
        </div>
      </div>
    </TableCell>
  );
}

// From 64rem: a table of three columns, the Part with its manufacturer and
// Category below its name given half the width, its Offers, a count end
// aligned in tabular figures, and what it lacks. The rows bleed 8 pixels past
// the text on each side.
export function PartsTable({
  shown,
}: {
  shown: ShownRow<PartMissingSpecificationsResponse>[];
}) {
  return (
    <div className="-mx-2">
      <Table aria-label="Parts missing specifications">
        <TableHeader>
          <TableRow className="border-b-0">
            <TableHead className="w-1/2 ps-2">Part</TableHead>
            <TableHead className="text-end">Offers</TableHead>
            <TableHead className="w-2/5 pe-2">Lacks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="border-t border-rule">
          {shown.map(({ item, key, leaving }) => (
            <PartTableRow key={key} part={item} leaving={leaving} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PartTableRow({
  part,
  leaving,
}: {
  part: PartMissingSpecificationsResponse;
  leaving: boolean;
}) {
  const { opened } = usePartLink(part);

  return (
    <TableRow
      className={rowGround(opened)}
      data-leaving={leaving || undefined}
      inert={leaving}
    >
      <Cell>
        <span className="font-[550]">
          <PartLink part={part} />
        </span>
        <p className="text-muted-foreground">
          <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
          {' · '}
          {categoryName(part.category)}
        </p>
      </Cell>
      <Cell className="text-end tabular-nums">
        <span data-testid="offer-count">{formatNumber(part.offerCount)}</span>
      </Cell>
      <Cell>
        <Lacks part={part} said="" />
      </Cell>
    </TableRow>
  );
}
