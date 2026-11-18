import type { SkippedRowResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { cn } from 'cn';
import {
  ChevronDownIcon,
  CircleCheckIcon,
  PackagePlusIcon,
  SearchIcon,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router';

import { Trans, useTranslation } from '@/shared/i18n';
import { queryOfWordsAndCategory } from '@/shared/lib';
import { buttonVariants, linkInText } from '@/shared/ui';

import {
  cellRefusalOf,
  rowsShownFirst,
  rowsShownMore,
  type SkippedGroup as Group,
} from '../model/skipped-rows';
import { PartLine, RowNumber } from './rows';

// A link among text, with its mark beside its words.
const underlined = cn(linkInText, 'gap-1.5 text-sm');

// One group of skipped rows, of one problem: its heading with its count in
// Note Grey, one Note Grey sentence that says what to do, and its rows by
// row number. A long group shows its first ten rows, then "10 of 3,290
// shown" and "Show 50 more", which adds the next fifty below, in place, as
// one block whose space opens and then fades in (the owner's d4 and d6); the
// line keeps a control's height once the last are shown and the button
// goes, so that nothing below it moves in one frame. So
// that a phone never draws thousands of rows and every group's heading and
// count stand on the screen.
export function SkippedGroup({
  group,
  askedFor,
}: {
  group: Group;
  // Whether a part number was asked to be added, from any of its rows.
  askedFor: (partNumber: string) => boolean;
}) {
  const { t } = useTranslation();
  const { problem, rows } = group;
  // How many rows each block shows: the first ten, then fifty each time.
  const [blocks, setBlocks] = useState<number[]>([Math.min(rowsShownFirst, rows.length)]);
  const shown = blocks.reduce((sum, size) => sum + size, 0);
  const left = rows.length - shown;
  const id = `skipped-${problem}`;

  return (
    <section
      data-testid="skipped-group"
      data-problem={problem}
      data-count={rows.length}
      aria-labelledby={id}
      className="flex flex-col gap-2"
    >
      <h3 id={id} className="flex flex-wrap items-baseline gap-x-2 text-base font-semibold">
        {t(`OfferSheetScreen.problems.${problem}.title`)}
        <span className="text-sm font-normal text-muted-foreground tabular-nums">
          {formatNumber(rows.length)}
        </span>
      </h3>
      <p className="text-sm text-muted-foreground">
        {t(`OfferSheetScreen.problems.${problem}.intro`)}
      </p>
      <div className="@container/rows -mx-2 border-t border-rule">
        {blocks.map((size, index) => {
          const from = blocks.slice(0, index).reduce((sum, each) => sum + each, 0);
          const list = (
            <ul>
              {rows.slice(from, from + size).map((row) => (
                <SkippedRow key={row.row} row={row} asked={askedFor(row.partNumber)} />
              ))}
            </ul>
          );
          return index === 0 ? (
            <div key={index}>{list}</div>
          ) : (
            <div key={index} data-testid="more-rows" data-arriving="" className="leaves">
              <div>{list}</div>
            </div>
          );
        })}
      </div>
      {rows.length > rowsShownFirst && (
        <div className="flex min-h-control flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1">
          <span
            data-testid="rows-shown"
            className="text-sm text-muted-foreground tabular-nums"
          >
            <Trans
              i18nKey="OfferSheetScreen.shown"
              count={rows.length}
              components={{
                shown: <>{formatNumber(shown)}</>,
                count: <>{formatNumber(rows.length)}</>,
              }}
            />
          </span>
          {left > 0 && (
            <button
              type="button"
              data-testid="show-more"
              className={buttonVariants({ variant: 'outline' })}
              onClick={() => setBlocks([...blocks, Math.min(rowsShownMore, left)])}
            >
              <ChevronDownIcon data-icon="inline-start" aria-hidden="true" />
              <Trans
                i18nKey="OfferSheetScreen.showMore"
                count={Math.min(rowsShownMore, left)}
                components={{ count: <>{formatNumber(Math.min(rowsShownMore, left))}</> }}
              />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// A skipped row: its number; its part number as the file gave it, or
// nothing when the cell was empty; what happened to it, by its problem; and
// its one action in one fixed place at the end, whatever the row holds.
// Where the list is 40rem wide or more, a container query on the list and
// never the window, the number has a column of its own, 6.5rem; on a phone
// they stand one under another (DESIGN.md's Rows and tables). No plate, and
// no red: the block's heading carries its one red mark.
function SkippedRow({ row, asked }: { row: SkippedRowResponse; asked: boolean }) {
  return (
    <li
      data-testid="skipped-row"
      data-row={row.row}
      data-problem={row.problem}
      data-part-count={row.partCount}
      className="relative grid gap-x-4 gap-y-1 border-b border-rule px-2 py-3 text-sm @min-[40rem]/rows:grid-cols-[6.5rem_minmax(0,1fr)_minmax(12rem,auto)] @min-[40rem]/rows:items-start @min-[40rem]/rows:py-3.5"
    >
      <RowNumber row={row.row} />
      <div className="flex min-w-0 flex-col gap-1 @min-[40rem]/rows:col-start-2 @min-[40rem]/rows:row-start-1">
        {row.partNumber !== '' && (
          <p>
            <AsWritten
              data-testid="part-number"
              className="font-mono text-sm text-muted-foreground wrap-anywhere"
            >
              {row.partNumber}
            </AsWritten>
          </p>
        )}
        <WhatHappened row={row} />
      </div>
      <RowAction row={row} asked={asked} />
    </li>
  );
}

// What happened to a skipped row, by its problem, in plain words.
function WhatHappened({ row }: { row: SkippedRowResponse }) {
  const { t } = useTranslation();

  switch (row.problem) {
    case 'noPart':
      return row.name === null || row.name === undefined || row.name === '' ? (
        <p className="text-muted-foreground">{t('OfferSheetScreen.noName')}</p>
      ) : (
        <p className="font-[550]">
          {/* What the Vendor wrote, sized by its own direction (DESIGN.md's
              Typography). */}
          <AsWritten
            data-testid="row-name"
            className="wrap-anywhere [&:dir(rtl)]:text-[0.9375rem] [&:dir(rtl)]:leading-[1.6]"
          >
            {row.name}
          </AsWritten>
        </p>
      );
    case 'severalParts':
      return <SeveralParts row={row} />;
    case 'samePart':
      return <SamePart row={row} />;
    case 'notValid':
      return (
        <p data-testid="cell" data-field={row.field} data-reason={row.reason}>
          <Trans
            i18nKey="OfferSheetScreen.cellRefused"
            components={{
              heading: (
                <span className="font-medium">
                  {row.field === undefined ? '' : t(`OfferSheetFile.headings.${row.field}`)}
                </span>
              ),
              reason: <>{t(cellRefusalOf(row))}</>,
            }}
          />
        </p>
      );
  }
}

// The Parts that hold a row's part number, named as the catalog search
// names them: how many hold it, from the API's count of every one; three of
// those it names and a way to unfold the rest it names when it names more
// than four; and, when more hold it than the ten it names, that the catalog
// search shows them all (sheet ticket 02b's bound).
function SeveralParts({ row }: { row: SkippedRowResponse }) {
  const named = row.parts ?? [];
  const count = row.partCount ?? named.length;
  const [unfolded, setUnfolded] = useState(named.length <= 4);
  const shown = unfolded ? named : named.slice(0, 3);
  const more = count - named.length;

  return (
    <>
      <p className="text-muted-foreground">
        <Trans
          i18nKey="OfferSheetScreen.holding"
          count={count}
          components={{
            count: <span className="tabular-nums">{formatNumber(count)}</span>,
          }}
        />
      </p>
      <ul className="flex flex-col gap-2 pt-1">
        {shown.map((part) => (
          <li key={part.id}>
            <PartLine part={part} />
          </li>
        ))}
      </ul>
      {!unfolded && (
        <button
          type="button"
          data-testid="show-the-parts"
          className={cn(underlined, 'self-start')}
          onClick={() => setUnfolded(true)}
        >
          <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0" />
          <Trans
            i18nKey={more > 0 ? 'OfferSheetScreen.showFirst' : 'OfferSheetScreen.showAll'}
            count={named.length}
            components={{ count: <>{formatNumber(named.length)}</> }}
          />
        </button>
      )}
      {unfolded && more > 0 && (
        <p className="text-muted-foreground">
          <Trans
            i18nKey="OfferSheetScreen.moreInTheSearch"
            count={more}
            components={{
              count: <span className="tabular-nums">{formatNumber(more)}</span>,
            }}
          />
        </p>
      )}
    </>
  );
}

// The Part a row and other rows named, and the other rows: the first ten,
// by row number, and how many more.
function SamePart({ row }: { row: SkippedRowResponse }) {
  const { t } = useTranslation();
  const others = row.rows ?? [];
  const more = (row.otherRows ?? others.length) - others.length;

  return (
    <>
      {row.part !== undefined && (
        <p className="pt-1">
          <PartLine part={row.part} />
        </p>
      )}
      <p
        data-testid="other-rows"
        data-rows={others.join(',')}
        className="text-muted-foreground"
      >
        <Trans
          i18nKey="OfferSheetScreen.alsoInRows"
          count={others.length}
          components={{
            rows: (
              <span className="tabular-nums">
                {others
                  .map((each) => formatNumber(each))
                  .join(t('OfferSheetScreen.listSeparator'))}
              </span>
            ),
          }}
        />
        {more > 0 && (
          <>
            {t('OfferSheetScreen.listSeparator')}
            <Trans
              i18nKey="OfferSheetScreen.andMore"
              count={more}
              components={{
                count: <span className="tabular-nums">{formatNumber(more)}</span>,
              }}
            />
          </>
        )}
      </p>
    </>
  );
}

// A row's one action, in its fixed place: for a row that matched no Part,
// "Ask for it to be added", which opens the Part Request form from the row;
// once it or another row of its part number is asked for, "Asked for"; and when the Vendor already has an open request
// of its part number, that it was asked for, with a way to its Part
// Requests, and no second request. For a row of several Parts, the catalog
// search with its part number. The other problems are corrected in the
// file, and their rows have none.
function RowAction({ row, asked }: { row: SkippedRowResponse; asked: boolean }) {
  const { t } = useTranslation();
  let action: ReactNode = null;

  if (row.problem === 'noPart') {
    action = asked ? (
      <p
        data-testid="asked"
        className="inline-flex min-h-control items-center gap-1.5 font-medium text-success"
      >
        <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
        {t('OfferSheetScreen.asked')}
      </p>
    ) : row.partRequestOpen === true ? (
      <p className="flex flex-col items-start">
        <span data-testid="already-asked" className="text-muted-foreground">
          {t('OfferSheetScreen.alreadyAsked')}
        </span>
        <Link to="../part-requests" className={underlined}>
          {t('OfferSheetScreen.seeRequests')}
        </Link>
      </p>
    ) : (
      <Link
        data-testid="ask-for-it"
        to={`rows/${row.row}/part-request`}
        className={buttonVariants({ variant: 'outline' })}
      >
        <PackagePlusIcon data-icon="inline-start" aria-hidden="true" />
        {t('OfferSheetScreen.ask')}
      </Link>
    );
  } else if (row.problem === 'severalParts') {
    action = (
      <Link
        data-testid="search-the-catalog"
        to={{
          pathname: '../add',
          search: queryOfWordsAndCategory({ words: row.partNumber }),
        }}
        className={cn(underlined, 'text-foreground')}
      >
        <SearchIcon aria-hidden="true" className="size-4 shrink-0" />
        <span>
          <Trans
            i18nKey="OfferSheetScreen.searchCatalog"
            components={{
              partNumber: (
                <AlwaysEnglish className="font-mono wrap-anywhere">
                  {row.partNumber}
                </AlwaysEnglish>
              ),
            }}
          />
        </span>
      </Link>
    );
  }

  return action === null ? null : (
    <div className="justify-self-start pt-1 @min-[40rem]/rows:col-start-3 @min-[40rem]/rows:row-start-1 @min-[40rem]/rows:justify-self-end @min-[40rem]/rows:pt-0">
      {action}
    </div>
  );
}
