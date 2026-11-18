import type { OfferSheetResultResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { cn } from 'cn';
import { CircleCheckIcon, TriangleAlertIcon } from 'lucide-react';
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from 'react';
import { Link } from 'react-router';

import { Trans, useTranslation } from '@/shared/i18n';
import { aScroll, motionIsReduced } from '@/shared/lib';
import { linkOverRow } from '@/shared/ui';

import { type KeptResult, resultShown } from '../model/kept-result';
import { groupsOf } from '../model/skipped-rows';
import { PartLine, RowNumber } from './rows';
import { SkippedGroup } from './skipped-group';

// The upload's result, as the dashboard's DESIGN.md composes it (the owner's
// d3, taken under the standing instruction of 18 November 2026, sheet
// ticket 03): what needs the Vendor first. Its head is a note, a Sheet panel
// with a Confirmed Green edge, that says the file was uploaded, how many rows
// were read, applied and skipped, and the counts as words, never on plates.
// Then the rows skipped, grouped by problem, with the block's one red mark;
// then the Offers added and the rows applied by the tie-break, each with its
// Part. It is kept in the page for the visit, and replaced by the next
// upload's.
//
// The visit's first result arrives as a row does (Motion 13): its space
// opens, then it fades in, and the page then moves to its head, which takes
// the focus, since on a phone the answer lies below the fold. A later one
// replaces it in place, at once, and the page moves to its head the same
// way. Coming back to it from the Part Request form, it is drawn at once,
// and the page moves to the row asked for.
export function UploadResult({
  vendorId,
  kept,
  askedNow,
  className,
}: {
  vendorId: string;
  kept: KeptResult;
  // The row just asked for, on the way back from the form.
  askedNow: number | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  const head = useRef<HTMLHeadingElement>(null);
  const { result, fresh, arrives } = kept;
  const groups = groupsOf(result.skipped);

  // A new result: once its space has opened, or at once when it replaces
  // another, the page moves to its head, which takes the focus.
  useEffect(() => {
    if (!fresh) return;
    const wait = arrives ? (motionIsReduced() ? 300 : 350) : 0;
    const moving = setTimeout(() => {
      head.current?.focus({ preventScroll: true });
      head.current?.scrollIntoView({ behavior: aScroll(), block: 'start' });
      resultShown(vendorId, result);
    }, wait);
    return () => clearTimeout(moving);
  }, [vendorId, result, fresh, arrives]);

  // Back from the form: the row asked for is brought into view, once, as
  // the screen is drawn again.
  const askedOnTheWayBack = useRef(fresh ? undefined : askedNow);
  useEffect(() => {
    const row = askedOnTheWayBack.current;
    if (row === undefined) return;
    const frame = requestAnimationFrame(() => {
      document
        .querySelector(`[data-testid="skipped-row"][data-row="${row}"]`)
        ?.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      data-testid="upload-result"
      data-rows={result.rows}
      data-arriving={arrives || undefined}
      // It is a place of the screen's grid, whose gap above it it gives back
      // while its space opens, so that nothing below moves in one frame.
      style={{ '--gap-before': '1.5rem' } as CSSProperties}
      className={cn('leaves', className)}
    >
      <div className="flex min-w-0 flex-col gap-8">
        <ResultHead result={result} head={head} />
        {groups.length > 0 && (
          <section aria-labelledby="rows-skipped" className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2
                id="rows-skipped"
                className="flex flex-wrap items-center gap-x-2 text-base font-semibold text-destructive"
              >
                <TriangleAlertIcon aria-hidden="true" className="size-4 shrink-0" />
                {t('OfferSheetScreen.skippedTitle')}
                <span className="font-normal tabular-nums">
                  {formatNumber(result.skipped.length)}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('OfferSheetScreen.skippedIntro')}
              </p>
            </div>
            {groups.map((group) => (
              <SkippedGroup key={group.problem} group={group} asked={kept.asked} />
            ))}
          </section>
        )}
        {result.added.length > 0 && (
          <AppliedRows
            id="offers-added"
            title={t('OfferSheetScreen.addedTitle')}
            intro={t('OfferSheetScreen.addedIntro')}
          >
            {result.added.map(({ row, part, offerId }) => (
              <AppliedRow key={row} testId="added-row" row={row}>
                <Link
                  to={`../offers/${offerId}`}
                  className={cn('flex min-w-0 flex-col gap-0.5', linkOverRow)}
                >
                  <PartLine part={part} />
                </Link>
              </AppliedRow>
            ))}
          </AppliedRows>
        )}
        {result.matchedByYourOffer.length > 0 && (
          <AppliedRows
            id="matched-by-your-offer"
            title={t('OfferSheetScreen.matchedTitle')}
            intro={t('OfferSheetScreen.matchedIntro')}
          >
            {result.matchedByYourOffer.map(({ row, part }) => (
              <AppliedRow key={row} testId="matched-by-your-offer-row" row={row}>
                <PartLine part={part} />
              </AppliedRow>
            ))}
          </AppliedRows>
        )}
      </div>
    </div>
  );
}

// The result's head: a Sheet panel with a Confirmed Green edge and 8-pixel
// corners, a circled tick and its title in Confirmed Green, one sentence of
// how many rows were read, applied and skipped, and the counts as words in
// one list that wraps. The title takes the focus when the result arrives, so
// that a screen reader starts there; it is no control, so it draws no focus
// outline. The counts are each at weight 650 in tabular figures, the
// rows skipped in Action Red.
function ResultHead({
  result,
  head,
}: {
  result: OfferSheetResultResponse;
  head: RefObject<HTMLHeadingElement | null>;
}) {
  const { t } = useTranslation();
  const skipped = result.skipped.length;
  const applied = result.rows - skipped;
  const figure = (count: number) => (
    <strong className="font-[650] tabular-nums">{formatNumber(count)}</strong>
  );

  return (
    <div className="flex flex-col gap-2 rounded-card border border-success bg-card p-4 text-sm">
      <h2
        ref={head}
        tabIndex={-1}
        data-testid="result-head"
        className="flex items-center gap-2 text-base font-semibold text-success outline-none"
      >
        <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
        {t('OfferSheetScreen.resultTitle')}
      </h2>
      <p>
        {result.rows === 0 ? (
          t('OfferSheetScreen.readNone')
        ) : (
          <Trans
            i18nKey={
              skipped === 0 ? 'OfferSheetScreen.readAllApplied' : 'OfferSheetScreen.read'
            }
            count={result.rows}
            components={{
              count: <span className="tabular-nums">{formatNumber(result.rows)}</span>,
              applied: <span className="tabular-nums">{formatNumber(applied)}</span>,
              skipped: <span className="tabular-nums">{formatNumber(skipped)}</span>,
            }}
          />
        )}
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        <Count kind="added" count={result.added.length} figure={figure} />
        <Count kind="changed" count={result.changed} figure={figure} />
        <Count kind="confirmed" count={result.confirmed} figure={figure} />
        {skipped > 0 && (
          <Count
            kind="skipped"
            count={skipped}
            figure={figure}
            className="font-[550] text-destructive"
          />
        )}
      </ul>
    </div>
  );
}

// One of the result's counts, in words.
function Count({
  kind,
  count,
  figure,
  className,
}: {
  kind: 'added' | 'changed' | 'confirmed' | 'skipped';
  count: number;
  figure: (count: number) => ReactNode;
  className?: string;
}) {
  return (
    <li
      data-testid="result-count"
      data-kind={kind}
      data-count={count}
      className={className}
    >
      <Trans
        i18nKey={`OfferSheetScreen.${kind}`}
        count={count}
        components={{ count: <>{figure(count)}</> }}
      />
    </li>
  );
}

// The Offers added, or the rows applied by the tie-break: a heading with its
// count, one Note Grey sentence and the rows.
function AppliedRows({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro: string;
  children: ReactNode[];
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="flex flex-wrap items-baseline gap-x-2 text-base font-semibold">
        {title}
        <span className="text-sm font-normal text-muted-foreground tabular-nums">
          {formatNumber(children.length)}
        </span>
      </h2>
      <p className="text-sm text-muted-foreground">{intro}</p>
      <ul className="@container/rows -mx-2 border-t border-rule">{children}</ul>
    </section>
  );
}

// A row the upload applied: its number, and its Part. A row of an Offer
// added is its link whole, to the Offer, as an Offer's row is.
function AppliedRow({
  testId,
  row,
  children,
}: {
  testId: string;
  row: number;
  children: ReactNode;
}) {
  return (
    <li
      data-testid={testId}
      data-row={row}
      className="hover-colour relative grid gap-x-4 gap-y-1 border-b border-rule px-2 py-3 text-sm has-[a:hover]:bg-secondary @min-[40rem]/rows:grid-cols-[6.5rem_minmax(0,1fr)] @min-[40rem]/rows:py-3.5"
    >
      <RowNumber row={row} />
      <div className="min-w-0">{children}</div>
    </li>
  );
}
