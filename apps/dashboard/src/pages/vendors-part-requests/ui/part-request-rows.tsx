import type { PartRequestResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { CircleCheckIcon, CircleXIcon, ClockIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { categoryName } from '@/entities/category';
import { OfferPlate } from '@/entities/offer';
import { Trans, useTranslation } from '@/shared/i18n';
import { movingProps, type ShownRow } from '@/shared/lib';
import { RowCell, Table, TableBody, TableHead, TableHeader, TableRow } from '@/shared/ui';

// The Vendor's Part Requests, as the dashboard's DESIGN.md lays out a
// request in the Vendor's list (the owner's d5, taken under the standing
// instruction of 18 November 2026, part-requests ticket 02): the Offers
// screen's kind of list, which the Vendor reads every day, a table from
// 64rem and two-line rows on a phone, never cards.
//
// A request is the Part as the Vendor wrote it, its name `AsWritten` in the
// Row type and wrapping in full, and one Note Grey line with its Category
// and its part number, as written, in Geist Mono, broken anywhere; its
// prices on one plate as an Offer's, muted when the Part is out of stock;
// when it was sent, its stock and its warranty, a warranty not stated left
// out; and its state, last. A row is not a link: what the Vendor can do
// from it is its state's links.
//
// A row new to the page arrives as Motion 12 says, as a new row does (its
// space opening, then its fade), and one the page no longer holds leaves as
// Motion 8 says, through the theme's `leaves` on the rows `useLeavingRows`
// gives.

interface RowsProps {
  shown: readonly ShownRow<PartRequestResponse>[];
}

// From 64rem: a table of four columns, Part (a third of the table), Price
// (end aligned), Sent (when, then stock and warranty, one under another)
// and State, every cell from the row's top. The rows bleed 8 pixels past
// the text on each side.
export function PartRequestsTable({ shown }: RowsProps) {
  const { t } = useTranslation();

  return (
    <div className="-mx-2">
      <Table aria-label={t('PartRequestsScreen.listLabel')} className="table-fixed">
        <TableHeader>
          <TableRow className="border-b-0">
            <TableHead className="w-1/3 first:ps-2">
              {t('PartRequestsScreen.part')}
            </TableHead>
            <TableHead className="w-1/5 text-end">
              {t('PartRequestsScreen.price')}
            </TableHead>
            <TableHead className="w-1/6">{t('PartRequestsScreen.sent')}</TableHead>
            <TableHead className="pe-2">{t('PartRequestsScreen.state')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="border-t border-rule [&_tr:last-child]:border-b">
          {shown.map((row) => (
            <TableRow
              key={row.key}
              data-testid="part-request"
              data-row={row.key}
              {...movingProps(row)}
              className="leaves-rule hover:bg-transparent"
            >
              <RowCell>
                <PartAsWritten request={row.item} />
              </RowCell>
              <RowCell className="text-end">
                <div className="-my-1 text-end">
                  <OfferPlate offer={row.item} />
                </div>
              </RowCell>
              <RowCell>
                <span className="flex flex-col gap-0.5 text-sm">
                  <Sent days={row.item.daysSinceSent} />
                  <Stock inStock={row.item.inStock} />
                  <Warranty months={row.item.warrantyMonths} />
                </span>
              </RowCell>
              <RowCell>
                <State request={row.item} />
              </RowCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// On a phone: two-line rows, the Part's name and its line, then the plate on
// a line of its own, so that the name keeps the whole width, then one Small
// line with when it was sent, its stock and its warranty, then its state.
export function PartRequestsList({ shown }: RowsProps) {
  const { t } = useTranslation();

  return (
    <ul
      aria-label={t('PartRequestsScreen.listLabel')}
      className="-mx-2 border-t border-rule"
    >
      {shown.map((row) => (
        <li
          key={row.key}
          data-testid="part-request"
          data-row={row.key}
          {...movingProps(row)}
          className="leaves border-b border-rule"
        >
          <div>
            <div className="flex flex-col gap-2 px-2 py-3 text-sm">
              <PartAsWritten request={row.item} />
              <p>
                <OfferPlate offer={row.item} />
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Sent days={row.item.daysSinceSent} />
                <Stock inStock={row.item.inStock} />
                <Warranty months={row.item.warrantyMonths} />
              </p>
              <State request={row.item} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// The Part as the Vendor wrote it: its name, in its own direction, and one
// Note Grey line with its Category, named in the shared terms, and its part
// number, left to right in Geist Mono, broken anywhere so that a long one
// never makes the screen scroll sideways. Out of stock, the name is in Note
// Grey, as an Offer's is.
function PartAsWritten({ request }: { request: PartRequestResponse }) {
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <p className={request.inStock ? 'font-[550]' : 'font-[550] text-muted-foreground'}>
        <AsWritten
          data-testid="part-request-name"
          className="block w-fit max-w-full wrap-anywhere"
        >
          {request.name}
        </AsWritten>
      </p>
      <p className="text-muted-foreground">
        <span data-testid="category" data-category={request.category}>
          {categoryName(request.category)}
        </span>
        {' · '}
        <AsWritten data-testid="part-number" className="font-mono text-sm wrap-anywhere">
          {request.partNumber}
        </AsWritten>
      </p>
    </div>
  );
}

// When the request was sent, in Note Grey: today, or how many days ago,
// counted by the API in Iraq's days.
function Sent({ days }: { days: number }) {
  const { t } = useTranslation();

  return (
    <span data-testid="sent" className="text-muted-foreground">
      {days === 0 ? (
        t('PartRequestsScreen.sentToday')
      ) : (
        <Trans
          i18nKey="PartRequestsScreen.sentDaysAgo"
          count={days}
          components={{ count: <>{formatNumber(days)}</> }}
        />
      )}
    </span>
  );
}

// Whether the Vendor has the Part in stock, in Confirmed Green or Note Grey,
// in the Offer's own words.
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

// The warranty in months, in Note Grey, in the Offer's own words. One that
// is not stated is left out.
function Warranty({ months }: { months: number | null }) {
  if (months === null) return null;

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

// Where the request stands, a word and its own mark, never a colour alone
// and never a pill (DESIGN.md's States), in the portal's plain words, as
// `words.md` gives them, with what goes with each:
// - Waiting, in Note Grey after a clock, with the days it has waited;
// - Added, in Confirmed Green after a circled tick, "Added as" and the
//   catalog's name of the Part, `AlwaysEnglish`, on its own line, then the
//   link to the Vendor's Offer for it, or, once the Vendor has removed that
//   Offer, a Note Grey sentence that it did, and no link;
// - Not added, in Action Red at weight 550 after a circled cross, since it
//   asks the Vendor to correct the request (the Red Is for Action Rule),
//   then the Admin's reason as written, aligned with its own language and
//   wrapping in full, then the link that opens the form again, empty.
// Every link is relative to the route, so that it leads to the same screen
// under either frame.
function State({ request }: { request: PartRequestResponse }) {
  const { t } = useTranslation();

  if (request.state === 'open') {
    return (
      <span
        data-testid="state"
        data-state="open"
        data-days={request.daysSinceSent}
        className="flex items-start gap-1.5 text-sm text-muted-foreground"
      >
        <ClockIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          {request.daysSinceSent === 0 ? (
            t('PartRequestsScreen.waitingToday')
          ) : (
            <Trans
              i18nKey="PartRequestsScreen.waiting"
              count={request.daysSinceSent}
              components={{ count: <>{formatNumber(request.daysSinceSent)}</> }}
            />
          )}
        </span>
      </span>
    );
  }

  if (request.state === 'fulfilled') {
    return (
      <span
        data-testid="state"
        data-state="fulfilled"
        className="flex flex-col items-start text-sm"
      >
        <span className="flex items-start gap-1.5 font-[550] text-success">
          <CircleCheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t('PartRequestsScreen.addedAs')}
        </span>
        <AlwaysEnglish
          data-testid="added-part"
          className="block w-fit max-w-full wrap-anywhere"
        >
          {request.part?.name}
        </AlwaysEnglish>
        {request.offerId === null || request.offerId === undefined ? (
          <span data-testid="offer-removed" className="text-muted-foreground">
            {t('PartRequestsScreen.offerRemoved')}
          </span>
        ) : (
          <UnderlinedLink testId="see-offer" to={`../offers/${request.offerId}`}>
            {t('PartRequestsScreen.seeOffer')}
          </UnderlinedLink>
        )}
      </span>
    );
  }

  return (
    <span
      data-testid="state"
      data-state="rejected"
      className="flex flex-col items-start gap-1 text-sm"
    >
      <span className="flex items-start gap-1.5 font-[550] text-destructive">
        <CircleXIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {t('PartRequestsScreen.notAdded')}
      </span>
      <span className="text-muted-foreground">{t('PartRequestsScreen.reason')}</span>
      <AsWritten
        data-testid="reason"
        className="block w-full whitespace-pre-line wrap-break-word"
      >
        {request.reason}
      </AsWritten>
      <UnderlinedLink testId="send-corrected" to="new">
        {t('PartRequestsScreen.sendCorrected')}
      </UnderlinedLink>
    </span>
  );
}

// A link of a state, underlined and as high as a control, its words on the
// start side.
function UnderlinedLink({
  testId,
  to,
  children,
}: {
  testId: string;
  to: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      data-testid={testId}
      className="hover-colour flex min-h-control items-center self-start underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {children}
    </Link>
  );
}
