import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { PackageIcon, PlusIcon, SearchXIcon } from 'lucide-react';
import { Link } from 'react-router';

import type { OffersSearch, VendorsOffersAnswered } from '@/entities/offer';
import { Trans, useTranslation } from '@/shared/i18n';
import { useWideScreen, useWithTheLeaving } from '@/shared/lib';
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
// in words on the end side of the filter bar, never on a plate, then the
// Offers of this page, oldest Confirmation first, a table from 64rem and
// two-line rows on a phone, then the way to the other pages. While a later
// answer is on its way, the last one stays, at full strength, and a line
// beside the count says that the next is on its way. A row the list drops
// while the Vendor is on it, as the Need confirming tab does after Confirm
// all, leaves as Motion 8 says.
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
  const wide = useWideScreen();
  const { content, totalElements, pageNumber, totalPages, first, last, asked } = listed;
  const [shown, left] = useWithTheLeaving(content, (offer) => offer.id, asked);
  const searched = search.words.trim() !== '';

  if (shown.length === 0 && totalElements === 0) {
    return searched ? (
      <NothingFound words={search.words.trim()} />
    ) : (
      <NoneInTheState search={search} />
    );
  }

  const Rows = wide ? OffersTable : OffersList;

  return (
    <section
      aria-labelledby="offers-listed"
      aria-busy={searching}
      className="flex flex-col gap-4"
    >
      <p className="flex min-h-control flex-wrap items-center justify-end gap-x-3 text-sm text-muted-foreground">
        <span aria-live="polite">{searching && t('OffersScreen.searching')}</span>
        <span id="offers-listed" data-testid="offers-counted">
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
        </span>
      </p>

      {shown.length > 0 ? (
        <Rows shown={shown} settling={settling} onLeft={left} />
      ) : (
        <PastTheLastPage
          onFirstPage={() => onSearch({ ...search, page: 0 })}
          words={{
            title: t('OffersScreen.pastTheLast'),
            firstPage: t('OffersScreen.firstPage'),
          }}
        />
      )}

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

// A tab with no Offer in its state says so in one Note Grey line, between
// Rule lines, and arrives as Motion 6 says when its last row has left.
function NoneInTheState({ search }: { search: OffersSearch }) {
  const { t } = useTranslation();

  return (
    <p
      data-testid="no-offer-in-state"
      className="arrives flex min-h-control items-center border-y border-rule text-sm text-muted-foreground"
    >
      {search.state === 'out-of-stock'
        ? t('OffersScreen.noneOutOfStock')
        : t('OffersScreen.noneNeedsConfirming')}
    </p>
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
// the search and the list, with the way to add one from the catalog search.
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
      </EmptyContent>
    </Empty>
  );
}
