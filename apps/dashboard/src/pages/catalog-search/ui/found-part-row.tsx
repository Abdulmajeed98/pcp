import type { FoundPartResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { CircleCheckIcon } from 'lucide-react';
import { Link, type To, useLocation } from 'react-router';

import { categoryName } from '@/entities/category';
import { PartNumbers } from '@/entities/part';
import { useTranslation } from '@/shared/i18n';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui';

// The Parts the search found, as the dashboard's DESIGN.md lays out a list
// (redesign ticket 12): a table from 64rem and two-line rows on a phone,
// never cards and never a picture. A Part is its name in the Row type, one
// Note Grey line with its manufacturer and its Category, and its part
// numbers on a line of their own, in Geist Mono, left to right, so that the
// number a Vendor matches against the box is read whole; the owner chose it
// on 20 October 2026 over the Catalog's one secondary line.
//
// A Part the Vendor offers is marked, in Confirmed Green with a circled tick,
// on a line of its own, and leads to the Offer, so that the Vendor does not
// try to add a second one (OFF-1). Any other leads to the form for a new
// Offer of it, which keeps the search in its address. The whole row is the
// link, with a Raised Stone ground under the pointer, while the link's name
// is the Part's alone. A Part's name, its manufacturer and its part numbers
// are English in every language (LANG-3); a long name wraps in a box of its
// own, its lines starting on its left, on the screen's start side, so that
// it is read whole in Kurdish and Arabic too.

// What makes the whole row the link: the link's box covers the row, and
// draws the focus outline inside the row's edges.
const linkOverRow =
  'after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring';

// Where a found Part leads: its Offer, or the form for a new one, which
// keeps the search.
function useWhereItLeads(part: FoundPartResponse): To {
  const { search } = useLocation();
  return part.offerId === null
    ? { pathname: part.id, search }
    : `../offers/${part.offerId}`;
}

// The Part's name, the link, and its manufacturer and Category on one Note
// Grey line below it, and the mark of a Part the Vendor offers.
function PartNamed({ part }: { part: FoundPartResponse }) {
  const to = useWhereItLeads(part);

  return (
    <div className="flex flex-col gap-0.5">
      <Link to={to} className={cn('font-[550]', linkOverRow)}>
        <AlwaysEnglish data-testid="part-name" className="block w-fit max-w-full">
          {part.name}
        </AlwaysEnglish>
      </Link>
      <p className="text-muted-foreground">
        <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
        {' · '}
        <span data-testid="category" data-category={part.category}>
          {categoryName(part.category)}
        </span>
      </p>
    </div>
  );
}

function Offered({ part }: { part: FoundPartResponse }) {
  const { t } = useTranslation();
  if (part.offerId === null) return null;

  return (
    <p
      data-testid="offered"
      className="flex items-center gap-1 text-sm font-medium text-success"
    >
      <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
      {t('CatalogSearch.offered')}
    </p>
  );
}

// From 64rem: a table of two columns, Part and Part numbers, the Part's
// given half the table. The rows bleed 8 pixels past the text on each side,
// the headings starting where their column's text does, and every cell
// starts at the row's top.
export function FoundPartsTable({ parts }: { parts: readonly FoundPartResponse[] }) {
  const { t } = useTranslation();

  return (
    <div className="-mx-2">
      <Table aria-label={t('CatalogSearch.listLabel')}>
        <TableHeader>
          <TableRow className="border-b-0">
            <TableHead className="w-1/2 first:ps-2">{t('CatalogSearch.part')}</TableHead>
            <TableHead className="last:pe-2">{t('CatalogSearch.partNumbers')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="border-t border-rule [&_tr:last-child]:border-b">
          {parts.map((part) => (
            <TableRow
              key={part.id}
              data-testid="found-part"
              data-offered={part.offerId !== null}
              className="hover-colour relative hover:bg-secondary"
            >
              <TableCell className="py-3.5 align-top first:ps-2">
                <div className="flex flex-col gap-1">
                  <PartNamed part={part} />
                  <Offered part={part} />
                </div>
              </TableCell>
              <TableCell className="py-3.5 align-top last:pe-2">
                <PartNumbers part={part} className="block w-fit max-w-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// On a phone: two-line rows, the name on the first line and its manufacturer
// and Category on the second, then its part numbers and the mark of a Part
// offered, each on a line of its own.
export function FoundPartsList({ parts }: { parts: readonly FoundPartResponse[] }) {
  const { t } = useTranslation();

  return (
    <ul
      aria-label={t('CatalogSearch.listLabel')}
      className="-mx-2 divide-y divide-rule border-y border-rule"
    >
      {parts.map((part) => (
        <li key={part.id}>
          <div
            data-testid="found-part"
            data-offered={part.offerId !== null}
            className="hover-colour relative flex min-h-18 flex-col justify-center gap-1 px-2 py-3 text-sm hover:bg-secondary"
          >
            <PartNamed part={part} />
            <PartNumbers part={part} className="block w-fit max-w-full" />
            <Offered part={part} />
          </div>
        </li>
      ))}
    </ul>
  );
}
