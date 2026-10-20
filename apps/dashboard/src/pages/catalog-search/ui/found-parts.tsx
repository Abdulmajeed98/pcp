import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { SearchXIcon } from 'lucide-react';

import { categoryName } from '@/entities/category';
import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  ListPages,
  PastTheLastPage,
  Plate,
} from '@/shared/ui';

import { useSearchTheCatalog } from '../api/search-parts';
import type { CatalogSearch } from '../model/search';
import { FoundPartRow } from './found-part-row';

// What the search found: how many, on the screen's one plate, inside its
// sentence, then the Parts of this page as rows, then the way to the other
// pages. While the first answer is on its way, rows are sketched in its
// place, and while a later one is, the last answer stays, at full strength,
// and a line beside the count says that the next is on its way. A refusal
// and an API that cannot be reached are each said in words.
export function FoundParts({
  vendorId,
  search,
  onSearch,
}: {
  vendorId: string;
  search: CatalogSearch;
  onSearch: (search: CatalogSearch) => void;
}) {
  const { t } = useTranslation();
  const found = useSearchTheCatalog(vendorId, search);

  if (found.error) {
    return (
      <Alert variant="destructive" data-testid="refusal">
        <AlertTitle>{t('CatalogSearch.notSearched')}</AlertTitle>
        <AlertDescription>
          <WhyNotAnsweredInThePortal error={found.error} />
        </AlertDescription>
      </Alert>
    );
  }
  if (found.data === undefined) return <Searching />;
  if (found.data.totalElements === 0) return <NothingFound search={search} />;

  const { content, totalElements, pageNumber, totalPages, first, last } = found.data;

  return (
    <section
      aria-labelledby="parts-found"
      aria-busy={found.isPlaceholderData}
      className="flex flex-col gap-4"
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          id="parts-found"
          data-testid="parts-found"
          className="flex items-center gap-2"
        >
          <Trans
            i18nKey="CatalogSearch.found"
            count={totalElements}
            components={{
              count: (
                <Plate data-testid="parts-found-count">{formatNumber(totalElements)}</Plate>
              ),
            }}
          />
        </span>
        <span aria-live="polite" className="text-sm text-muted-foreground">
          {found.isPlaceholderData && t('CatalogSearch.searching')}
        </span>
      </p>

      {content.length > 0 ? (
        <ul
          aria-label={t('CatalogSearch.listLabel')}
          className="divide-y divide-border border-y border-border"
        >
          {content.map((part) => (
            <li key={part.id}>
              <FoundPartRow part={part} />
            </li>
          ))}
        </ul>
      ) : (
        <PastTheLastPage
          onFirstPage={() => onSearch({ ...search, page: 0 })}
          words={{
            title: t('CatalogSearch.pastTheLast'),
            firstPage: t('CatalogSearch.firstPage'),
          }}
        />
      )}

      {totalPages > 1 && (
        <ListPages
          label={t('CatalogSearch.pages')}
          pageNumber={pageNumber}
          totalPages={totalPages}
          first={first}
          last={last}
          onPage={(page) => onSearch({ ...search, page })}
          words={{
            previous: t('CatalogSearch.previous'),
            next: t('CatalogSearch.next'),
            where: (
              <Trans
                i18nKey="CatalogSearch.page"
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

// Rows sketched where the first answer will be.
function Searching() {
  const { t } = useTranslation();

  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t('CatalogSearch.reading')}</p>
      <ul aria-hidden="true" className="divide-y divide-border border-y border-border">
        {[0, 1, 2, 3].map((row) => (
          <li key={row} className="flex items-center gap-3 py-2">
            <span className="size-10 shrink-0 rounded-lg bg-secondary" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-3.5 w-3/4 rounded-sm bg-secondary" />
              <span className="h-3.5 w-1/2 rounded-sm bg-muted" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// A search that found nothing: the words searched, `AlwaysEnglish`, and the
// Category it was limited to, if any. Turning it into a Part Request waits
// for `part-requests`.
function NothingFound({ search }: { search: CatalogSearch }) {
  const { t } = useTranslation();
  const words = search.words.trim();
  const category =
    search.category === undefined ? undefined : categoryName(search.category);

  return (
    <Empty data-testid="nothing-found" className="border-y border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>{t('CatalogSearch.nothingFound')}</EmptyTitle>
        <EmptyDescription>
          {words === '' ? (
            t('CatalogSearch.nothingInTheCategory')
          ) : (
            <Trans
              i18nKey={
                category === undefined
                  ? 'CatalogSearch.nothingFoundDescription'
                  : 'CatalogSearch.nothingFoundInTheCategory'
              }
              components={{
                words: <AlwaysEnglish>{words}</AlwaysEnglish>,
                category: <>{category}</>,
              }}
            />
          )}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
