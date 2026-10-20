import type { VendorsOffersPageResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { PackageIcon, PlusIcon, SearchXIcon } from 'lucide-react';
import { Link } from 'react-router';

import type { OffersSearch } from '@/entities/offer';
import { Trans, useTranslation } from '@/shared/i18n';
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
  Plate,
} from '@/shared/ui';

import { OfferRow } from './offer-row';

// The Vendor's Offers the search found: how many, on the list's one plate,
// then the Offers of this page as rows, oldest Confirmation first, then the
// way to the other pages. While a later answer is on its way, the last one
// stays, at full strength, and a line beside the count says that the next is
// on its way.
export function ListedOffers({
  listed,
  searching,
  search,
  onSearch,
}: {
  listed: VendorsOffersPageResponse;
  searching: boolean;
  search: OffersSearch;
  onSearch: (search: OffersSearch) => void;
}) {
  const { t } = useTranslation();
  const { content, totalElements, pageNumber, totalPages, first, last } = listed;
  const searched = search.words.trim() !== '';

  if (totalElements === 0) return <NothingFound words={search.words.trim()} />;

  return (
    <section
      aria-labelledby="offers-listed"
      aria-busy={searching}
      className="flex flex-col gap-4"
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          id="offers-listed"
          data-testid="offers-counted"
          className="flex items-center gap-2"
        >
          <Trans
            i18nKey={searched ? 'OffersScreen.found' : 'OffersScreen.counted'}
            count={totalElements}
            components={{
              count: (
                <Plate data-testid="offers-count">{formatNumber(totalElements)}</Plate>
              ),
            }}
          />
        </span>
        <span aria-live="polite" className="text-sm text-muted-foreground">
          {searching && t('OffersScreen.searching')}
        </span>
      </p>

      {content.length > 0 ? (
        <ul
          aria-label={t('OffersScreen.listLabel')}
          className="divide-y divide-border border-y border-border"
        >
          {content.map((offer) => (
            <li key={offer.id}>
              <OfferRow offer={offer} />
            </li>
          ))}
        </ul>
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

// A search of the Vendor's Offers that found none.
function NothingFound({ words }: { words: string }) {
  const { t } = useTranslation();

  return (
    <Empty data-testid="no-offer-found" className="border-y border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>{t('OffersScreen.nothingFound')}</EmptyTitle>
        <EmptyDescription>
          <Trans
            i18nKey="OffersScreen.nothingFoundDescription"
            components={{ words: <AlwaysEnglish>{words}</AlwaysEnglish> }}
          />
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

// What the screen says to a Vendor with no Offer yet, with the way to add one
// from the catalog search.
export function NoOffers() {
  const { t } = useTranslation();

  return (
    <Empty data-testid="no-offers" className="border-y border-border">
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
