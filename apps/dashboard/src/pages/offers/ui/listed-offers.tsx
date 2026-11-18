import type { ListedOfferResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { FileSpreadsheetIcon, PackageIcon, PlusIcon, SearchXIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import type { OffersSearch, VendorsOffersAnswered } from '@/entities/offer';
import { Trans, useTranslation } from '@/shared/i18n';
import { useLeavingRows, useWideScreen } from '@/shared/lib';
import {
  buttonVariants,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  ListPages,
  PastTheLastPage,
} from '@/shared/ui';

import { OffersList, OffersTable } from './offer-rows';

// The Vendor's Offers the search found in the tab the Vendor is in: how many,
// in words on the end side of the filter bar, never on a plate, with the way
// to the Offer sheet on its start side, an underlined link with the file
// mark, which costs the phone's full head no height (the owner's d1, taken
// under the standing instruction of 18 November 2026, sheet ticket 03); then
// the
// Offers of this page, oldest Confirmation first, a table from 64rem and
// two-line rows on a phone, then the way to the other pages. While a later
// answer is on its way, the last one stays, at full strength, and a line
// beside the count says that the next is on its way. A search that finds
// nothing says so in the empty state.
export function ListedOffers({
  listed,
  searching,
  settling,
  search,
  onSearch,
}: {
  listed: VendorsOffersAnswered;
  searching: boolean;
  // Whether Confirm all has answered, so that the rows it changed settle.
  settling: boolean;
  search: OffersSearch;
  onSearch: (search: OffersSearch) => void;
}) {
  const { t } = useTranslation();
  const { totalElements, pageNumber, totalPages, first, last, asked } = listed;
  const searched = search.words.trim() !== '';

  if (totalElements === 0 && searched) return <NothingFound words={search.words.trim()} />;

  return (
    <section
      aria-labelledby="offers-listed"
      aria-busy={searching}
      className="flex flex-col gap-4"
    >
      <div className="flex min-h-control flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
        <ToTheOfferSheet testId="to-offer-sheet" words={t('OffersScreen.toOfferSheet')} />
        {/* On a phone the count takes a line of its own, below the way to
            the Offer sheet, whatever it says, and keeps a line's height when
            it says nothing, as on a tab whose last rows have just left, so
            that the rows below never move in one frame (the No Snap Rule);
            from 40rem it stands on the same line, on its end side. */}
        <p className="ms-auto flex min-h-[1lh] basis-full flex-wrap items-center justify-end gap-x-3 sm:basis-auto">
          <span aria-live="polite">{searching && t('OffersScreen.searching')}</span>
          <span id="offers-listed" data-testid="offers-counted">
            {totalElements > 0 && (
              <Trans
                i18nKey={searched ? 'OffersScreen.found' : 'OffersScreen.counted'}
                count={totalElements}
                components={{
                  count: (
                    <span data-testid="offers-count" className="tabular-nums">
                      {formatNumber(totalElements)}
                    </span>
                  ),
                }}
              />
            )}
          </span>
        </p>
      </div>

      {/* The rows of one answer to one search, tab and page: another is drawn
          afresh, as changing what is listed is still (Motion 9). */}
      <TheRows
        key={asked}
        listed={listed}
        settling={settling}
        search={search}
        onSearch={onSearch}
      />

      {totalPages > 1 && (
        <ListPages
          label={t('OffersScreen.pages')}
          pageNumber={pageNumber}
          totalPages={totalPages}
          first={first}
          last={last}
          onPage={(page) => onSearch({ ...search, page })}
          words={{
            previous: t('OffersScreen.previous'),
            next: t('OffersScreen.next'),
            where: (
              <Trans
                i18nKey="OffersScreen.page"
                components={{
                  page: <>{formatNumber(pageNumber + 1)}</>,
                  pages: <>{formatNumber(totalPages)}</>,
                }}
              />
            ),
          }}
        />
      )}
    </section>
  );
}

// The rows, with those the same answer, asked again, no longer holds left in
// their places until they have left, and those new to it arriving, as Motion
// 8 says (`useLeavingRows`), as the Need confirming tab drops its rows after
// Confirm all. A tab with nothing in its state says so in one line, which
// arrives in step as its last rows leave.
function TheRows({
  listed,
  settling,
  search,
  onSearch,
}: {
  listed: VendorsOffersAnswered;
  settling: boolean;
  search: OffersSearch;
  onSearch: (search: OffersSearch) => void;
}) {
  const { t } = useTranslation();
  const wide = useWideScreen();
  const shown = useLeavingRows<ListedOfferResponse>(
    listed.content,
    (offer) => offer.id,
    listed.pageNumber,
  );
  // Whether this answer's rows were ever drawn, so that the line of a tab
  // left with nothing arrives, rather than stands as it does on a tab that
  // had nothing to begin with.
  const [hadRows, setHadRows] = useState(listed.content.length > 0);
  if (!hadRows && listed.content.length > 0) setHadRows(true);
  const Rows = wide ? OffersTable : OffersList;

  return (
    <>
      {shown.length > 0 && <Rows shown={shown} settling={settling} />}
      {listed.totalElements === 0 ? (
        <NoneInTheState search={search} arriving={hadRows} />
      ) : (
        listed.content.length === 0 && (
          <PastTheLastPage
            onFirstPage={() => onSearch({ ...search, page: 0 })}
            words={{
              title: t('OffersScreen.pastTheLast'),
              firstPage: t('OffersScreen.firstPage'),
            }}
          />
        )
      )}
    </>
  );
}

// A tab with no Offer in its state says so in one Note Grey line, between
// Rule lines. When its last rows have just left, it arrives as a row does:
// its space opens in step with theirs closing, and then it fades in.
function NoneInTheState({ search, arriving }: { search: OffersSearch; arriving: boolean }) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="no-offer-in-state"
      data-arriving={arriving || undefined}
      className="leaves"
    >
      <div>
        <p className="flex min-h-control items-center border-y border-rule text-sm text-muted-foreground">
          {search.state === 'out-of-stock'
            ? t('OffersScreen.noneOutOfStock')
            : t('OffersScreen.noneNeedsConfirming')}
        </p>
      </div>
    </div>
  );
}

// A search of the Vendor's Offers that found none.
function NothingFound({ words }: { words: string }) {
  const { t } = useTranslation();

  return (
    <Empty data-testid="no-offer-found" className="border-y border-rule">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>{t('OffersScreen.nothingFound')}</EmptyTitle>
        <EmptyDescription>
          <Trans
            i18nKey="OffersScreen.nothingFoundDescription"
            components={{
              words: <AlwaysEnglish className="wrap-anywhere">{words}</AlwaysEnglish>,
            }}
          />
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

// What the screen says to a Vendor with no Offer yet, in place of the tabs,
// the search and the list, with the way to add one from the catalog search,
// and below it the way to add every Part it sells in one Offer sheet, since
// a file of headings alone is the way to add them all at once (the owner's
// d1, sheet ticket 03; its words, the code review of `sheet`).
export function NoOffers() {
  const { t } = useTranslation();

  return (
    <Empty data-testid="no-offers" className="border-y border-rule">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageIcon />
        </EmptyMedia>
        <EmptyTitle>{t('OffersScreen.none')}</EmptyTitle>
        <EmptyDescription>{t('OffersScreen.noneDescription')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link
          to="add"
          data-testid="add-first-offer"
          className={buttonVariants({ variant: 'outline' })}
        >
          <PlusIcon data-icon="inline-start" />
          {t('OffersScreen.addFirst')}
        </Link>
        <ToTheOfferSheet
          testId="fill-in-an-offer-sheet"
          words={t('OffersScreen.fillInAnOfferSheet')}
        />
      </EmptyContent>
    </Empty>
  );
}

// The way to the Offer sheet screen, an underlined link as high as a
// control, with the file mark, in Ink.
function ToTheOfferSheet({ testId, words }: { testId: string; words: string }) {
  return (
    <Link
      to="offer-sheet"
      data-testid={testId}
      className="hover-colour inline-flex min-h-control items-center gap-1.5 text-sm text-foreground underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <FileSpreadsheetIcon aria-hidden="true" className="size-4 shrink-0" />
      {words}
    </Link>
  );
}
