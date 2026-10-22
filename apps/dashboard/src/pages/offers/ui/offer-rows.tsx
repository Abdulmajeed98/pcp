import type { ListedOfferResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import {
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  type LucideIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import {
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router';

import { categoryName } from '@/entities/category';
import { type ConfirmationState, confirmationOf, OfferPlate } from '@/entities/offer';
import { Trans, useTranslation } from '@/shared/i18n';
import { type ShownRow, whenTheSpaceHasClosed } from '@/shared/lib';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui';

// The Vendor's Offers, as the dashboard's DESIGN.md lays out a list: a table
// from 64rem, two-line rows on a phone, never cards and never a picture. An
// Offer is its Part's name in the Row type and one Note Grey line with its
// manufacturer and Category; its plate, holding both its prices; then its
// last Confirmation, its stock and its warranty. An Offer out of stock has
// its Part's name in Note Grey and its plate muted. A Part's name, its
// manufacturer and the prices are English in every language, and are kept
// apart from the text around them (LANG-3, LANG-5).
//
// The whole row is the link to the Offer's own screen, with a Raised Stone
// ground under the pointer, while the link's name is the Part's alone. The
// link is relative to the Offers screen's route, so that it reaches the
// Offer under either frame.
//
// A row the list has dropped while the Vendor is on it leaves as Motion 8
// says, and a row new to it arrives, through the theme's `leaves`, on the
// rows `useLeavingRows` gives. After Confirm all, `settling`, the
// Confirmation of each of the first ten rows that changed fades from its old
// state to its new, each 30 ms after the one above it (Motion 7); and a row
// whose words take another height follows them over 200 ms, so that the rows
// below move with it and nothing jumps in one frame (the No Snap Rule).

interface RowsProps {
  shown: readonly ShownRow<ListedOfferResponse>[];
  settling: boolean;
}

// What makes the whole row the link: the link's box covers the row, and
// draws the focus outline inside the row's edges.
const linkOverRow =
  'after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring';

// How many rows settle in turn: the first ten that stay.
const settlingRows = 10;

// Each shown row's place in Confirm all's settle, counted among the rows
// that stay, or none for a row that leaves, past the first ten, or when
// nothing settles.
function settleOrders(
  shown: readonly ShownRow<ListedOfferResponse>[],
  settling: boolean,
): (number | undefined)[] {
  let staying = 0;
  return shown.map(({ leaving }) => {
    if (leaving || !settling) return undefined;
    const order = staying;
    staying += 1;
    return order < settlingRows ? order : undefined;
  });
}

// The rows' heights, followed: after each answer, a row that stays and whose
// words now take another height, as "Confirmed today" takes one line where
// an expiry took two, goes from its old height to its new one over 200 ms on
// the in-out curve (150 ms on the out curve with reduced motion), rather than
// in one frame, and the rows below it move with it. What changes is the
// height of the theme's `leaves` in each of its cells, which hold the row's
// padding, so that the row's own content is never squeezed; a leaving or
// arriving row moves by its own transitions instead.
function useRowsFollowTheirHeight<List extends HTMLElement>() {
  const list = useRef<List>(null);
  const heights = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const row of list.current?.querySelectorAll<HTMLElement>('[data-row]') ?? []) {
      const key = row.dataset.row ?? '';
      const spaces = [
        ...row.querySelectorAll<HTMLElement>(':scope > td > .leaves, :scope > .leaves'),
      ];
      // The height the row's words take, whatever is moving now.
      const height = Math.max(
        0,
        ...spaces.map(
          (space) =>
            (space.firstElementChild?.firstElementChild as HTMLElement | null)
              ?.offsetHeight ?? 0,
        ),
      );
      const was = heights.current.get(key);
      heights.current.set(key, height);
      if (
        was === undefined ||
        Math.abs(was - height) < 1 ||
        row.hasAttribute('data-leaving') ||
        row.hasAttribute('data-arriving')
      ) {
        continue;
      }
      for (const space of spaces) {
        space.animate(
          [
            { height: `${was}px`, overflow: 'hidden' },
            { height: `${height}px`, overflow: 'hidden' },
          ],
          reduced
            ? { duration: 150, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
            : { duration: 200, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' },
        );
      }
    }
  });

  return list;
}

// From 64rem: a table of five columns, Part, Price, Last confirmed, Stock and
// Warranty, the Part's given the most width. The rows bleed 8 pixels past
// the text on each side.
export function OffersTable({ shown, settling }: RowsProps) {
  const { t } = useTranslation();
  const orders = settleOrders(shown, settling);
  const list = useRowsFollowTheirHeight<HTMLTableSectionElement>();

  return (
    <div className="-mx-2">
      <Table aria-label={t('OffersScreen.listLabel')}>
        <TableHeader>
          <TableRow className="border-b-0">
            <TableHead className="w-2/5 ps-2">{t('OffersScreen.part')}</TableHead>
            <TableHead className="text-end">{t('OffersScreen.price')}</TableHead>
            <TableHead>{t('OffersScreen.lastConfirmed')}</TableHead>
            <TableHead>{t('OffersScreen.stock')}</TableHead>
            <TableHead className="pe-2">{t('OffersScreen.warranty')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={list} className="border-t border-rule [&_tr:last-child]:border-b">
          {shown.map((row, index) => (
            <OfferTableRow key={row.key} row={row} settleOrder={orders[index]} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OfferTableRow({
  row,
  settleOrder,
}: {
  row: ShownRow<ListedOfferResponse>;
  settleOrder: number | undefined;
}) {
  const { item: offer, leaving, arriving } = row;

  return (
    <TableRow
      data-testid="offer"
      data-row={row.key}
      data-leaving={leaving || undefined}
      data-arriving={arriving || undefined}
      inert={leaving}
      onTransitionEnd={whenTheSpaceHasClosed(row)}
      className="leaves-rule relative hover:bg-secondary"
    >
      <Cell>
        <PartNamed offer={offer} />
      </Cell>
      <Cell className="py-2.5 text-end">
        <OfferPlate offer={offer} />
      </Cell>
      <Cell>
        <Confirmation state={confirmationOf(offer)} settleOrder={settleOrder} />
      </Cell>
      <Cell className="whitespace-nowrap">
        <Stock inStock={offer.inStock} />
      </Cell>
      <Cell className="whitespace-nowrap">
        <Warranty months={offer.warrantyMonths} inTheTable />
      </Cell>
    </TableRow>
  );
}

// A cell of an Offer's row: its content inside the theme's `leaves`, which
// holds the cell's padding, so that a leaving row's space closes whole and an
// arriving row's opens whole.
function Cell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <TableCell className="h-auto p-0 align-top first:ps-0">
      <div className="leaves">
        <div>
          <div className={cn('px-2 py-3.5', className)}>{children}</div>
        </div>
      </div>
    </TableCell>
  );
}

// On a phone: two-line rows, the Part's name on the first line and its
// manufacturer and Category on the second, then the plate on a line of its
// own, so that the name keeps the whole width, then one Small line with the
// Confirmation, the stock and a warranty that is stated.
export function OffersList({ shown, settling }: RowsProps) {
  const { t } = useTranslation();
  const orders = settleOrders(shown, settling);
  const list = useRowsFollowTheirHeight<HTMLUListElement>();

  return (
    <ul
      ref={list}
      aria-label={t('OffersScreen.listLabel')}
      className="-mx-2 border-t border-rule"
    >
      {shown.map((row, index) => (
        <li
          key={row.key}
          data-testid="offer"
          data-row={row.key}
          data-leaving={row.leaving || undefined}
          data-arriving={row.arriving || undefined}
          inert={row.leaving}
          onTransitionEnd={whenTheSpaceHasClosed(row)}
          className="leaves border-b border-rule"
        >
          <div>
            <div className="hover-colour relative flex flex-col gap-2 px-2 py-3 text-sm hover:bg-secondary">
              <PartNamed offer={row.item} />
              <p>
                <OfferPlate offer={row.item} />
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Confirmation
                  state={confirmationOf(row.item)}
                  settleOrder={orders[index]}
                />
                <Stock inStock={row.item.inStock} />
                <Warranty months={row.item.warrantyMonths} />
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// The Part's name, the link to the Offer, and its manufacturer and Category
// on one Note Grey line below it. Out of stock, the name is in Note Grey too.
// A name is English and runs left to right in every language: one that
// wraps does so in its own box, its lines starting on its left, and the box
// stands on the screen's start side, so that a long name is read whole in
// Kurdish and Arabic too (redesign ticket 11's break-ui).
function PartNamed({ offer }: { offer: ListedOfferResponse }) {
  const { part } = offer;

  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <Link
        to={`offers/${offer.id}`}
        className={cn('font-[550]', !offer.inStock && 'text-muted-foreground', linkOverRow)}
      >
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

function Stock({ inStock }: { inStock: boolean }) {
  const { t } = useTranslation();

  return (
    <span
      data-testid="stock"
      data-in-stock={inStock}
      className={inStock ? 'text-success' : 'text-muted-foreground'}
    >
      {inStock ? t('Offer.inStock') : t('Offer.outOfStock')}
    </span>
  );
}

// The warranty in months, in Note Grey. One that is not stated is left out
// of a row on a phone, and is a Note Grey dash named "No warranty stated" in
// the table's column.
function Warranty({
  months,
  inTheTable = false,
}: {
  months: number | null;
  inTheTable?: boolean;
}) {
  const { t } = useTranslation();

  if (months === null) {
    if (!inTheTable) return null;
    return (
      <span className="text-muted-foreground">
        <span aria-hidden="true">–</span>
        <span className="sr-only">{t('OffersScreen.noWarranty')}</span>
      </span>
    );
  }

  return (
    <span data-testid="warranty" className="text-muted-foreground">
      <Trans
        i18nKey="Offer.warranty"
        count={months}
        components={{ count: <>{formatNumber(months)}</> }}
      />
    </span>
  );
}

// Each state's mark and colour: confirmed today in Confirmed Green with a
// circled tick, an older Confirmation in Note Grey with a clock, and an
// Offer about to expire or expired in Action Red at weight 550, with a
// warning triangle and a circled cross, as what needs the Vendor's action.
// Each is also said in words.
const looks: Record<ConfirmationState['state'], { Icon: LucideIcon; className: string }> = {
  today: { Icon: CircleCheckIcon, className: 'text-success' },
  daysAgo: { Icon: ClockIcon, className: 'text-muted-foreground' },
  expiresIn: { Icon: TriangleAlertIcon, className: 'font-[550] text-destructive' },
  expiresToday: { Icon: TriangleAlertIcon, className: 'font-[550] text-destructive' },
  expired: { Icon: CircleXIcon, className: 'font-[550] text-destructive' },
};

// When the Offer was last confirmed, in a sentence that counts its days.
// After Confirm all, `settleOrder` is the row's turn: the Confirmation is
// drawn again at its new state and fades in (the theme's `settles`), while
// its old words, laid over it, fade out in the same turn (`unsettles`), so
// that no words vanish in one frame. A Confirmation whose state did not
// change does not move, nor does one past the first ten.
function Confirmation({
  state,
  settleOrder,
}: {
  state: ConfirmationState;
  settleOrder: number | undefined;
}) {
  const [drawn, setDrawn] = useState(state);
  const [old, setOld] = useState<ConfirmationState | null>(null);
  if (keyOf(drawn) !== keyOf(state)) {
    setOld(settleOrder === undefined ? null : drawn);
    setDrawn(state);
  }

  return (
    <span
      className="relative inline-flex"
      style={
        settleOrder === undefined
          ? undefined
          : ({ '--settle-order': settleOrder } as CSSProperties)
      }
    >
      <ConfirmationLook
        key={keyOf(state)}
        state={state}
        className={settleOrder !== undefined ? 'settles' : undefined}
        testId="confirmation"
      />
      {old !== null && (
        <ConfirmationLook
          key={`old ${keyOf(old)}`}
          state={old}
          className="unsettles pointer-events-none absolute start-0 top-0 whitespace-nowrap"
          onFaded={() => setOld(null)}
        />
      )}
    </span>
  );
}

// What tells one Confirmation from another: its state and its count.
function keyOf(state: ConfirmationState): string {
  return 'count' in state ? `${state.state} ${state.count}` : state.state;
}

// A Confirmation's mark and words, in its state's colour.
function ConfirmationLook({
  state,
  className,
  testId,
  onFaded,
}: {
  state: ConfirmationState;
  className?: string;
  testId?: string;
  onFaded?: () => void;
}) {
  const { Icon, className: look } = looks[state.state];

  return (
    <span
      data-testid={testId}
      data-state={testId === undefined ? undefined : state.state}
      aria-hidden={testId === undefined || undefined}
      onTransitionEnd={(event) => {
        if (event.propertyName === 'opacity') onFaded?.();
      }}
      className={cn('inline-flex items-center gap-1', look, className)}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <ConfirmationWords state={state} />
    </span>
  );
}

function ConfirmationWords({ state }: { state: ConfirmationState }) {
  const { t } = useTranslation();

  switch (state.state) {
    case 'today':
      return <>{t('Offer.confirmedToday')}</>;
    case 'expiresToday':
      return <>{t('Offer.expiresToday')}</>;
    case 'daysAgo':
      return <Counted i18nKey="Offer.confirmedDaysAgo" count={state.count} />;
    case 'expiresIn':
      return <Counted i18nKey="Offer.expiresIn" count={state.count} />;
    case 'expired':
      return <Counted i18nKey="Offer.expired" count={state.count} />;
  }
}

// A sentence that counts days, with its count written by `formatNumber`.
function Counted({
  i18nKey,
  count,
}: {
  i18nKey: 'Offer.confirmedDaysAgo' | 'Offer.expiresIn' | 'Offer.expired';
  count: number;
}) {
  return (
    <span>
      <Trans
        i18nKey={i18nKey}
        count={count}
        components={{ count: <>{formatNumber(count)}</> }}
      />
    </span>
  );
}
