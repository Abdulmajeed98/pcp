import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { SearchXIcon } from 'lucide-react';

import { categoryName } from '@/entities/category';
import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
import { useWideScreen } from '@/shared/lib';
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
} from '@/shared/ui';

import { useSearchTheCatalog } from '../api/search-parts';
import type { CatalogSearch } from '../model/search';
import { FoundPartsList, FoundPartsTable } from './found-part-row';

// What the search found: how many, in words on the end side of the filter
// bar, never on a plate, then the Parts of this page, a table from 64rem and
// two-line rows on a phone, then the way to the other pages. While the first
// answer is on its way, rows are sketched in its place, still, and while a
// later one is, the last answer stays, at full strength, and a line beside
// the count says that the next is on its way. A refusal and an API that
// cannot be reached are each said in words.
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
  const wide = useWideScreen();

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
  if (found.data === undefined) return <Searching wide={wide} />;
  if (found.data.totalElements === 0) return <NothingFound search={search} />;

  const { content, totalElements, pageNumber, totalPages, first, last } = found.data;

  return (
    <section
      aria-labelledby="parts-found"
      aria-busy={found.isPlaceholderData}
      className="flex flex-col gap-4"
    >
      <p className="flex min-h-control flex-wrap items-center justify-end gap-x-3 text-sm text-muted-foreground">
        <span aria-live="polite">
          {found.isPlaceholderData && t('CatalogSearch.searching')}
        </span>
        <span id="parts-found" data-testid="parts-found">
          <Trans
            i18nKey="CatalogSearch.found"
            count={totalElements}
            components={{
              count: (
                <span data-testid="parts-found-count" className="tabular-nums">
                  {formatNumber(totalElements)}
                </span>
              ),
            }}
          />
        </span>
      </p>

      {content.length > 0 ? (
        wide ? (
          <FoundPartsTable parts={content} />
        ) : (
          <FoundPartsList parts={content} />
        )
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

// Rows sketched in Raised Stone where the first answer will be, in the shape
// of the rows to come, still: they do not shimmer.
function Searching({ wide }: { wide: boolean }) {
  const { t } = useTranslation();

  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="flex min-h-control items-center justify-end text-sm text-muted-foreground">
        {t('CatalogSearch.reading')}
      </p>
      <ul aria-hidden="true" className="divide-y divide-rule border-y border-rule">
        {[0, 1, 2, 3].map((row) => (
          <li
            key={row}
            className={
              wide
                ? 'flex h-12 items-center gap-4'
                : 'flex h-18 flex-col justify-center gap-2'
            }
          >
            <span className="h-3.5 w-2/5 rounded-plate bg-secondary" />
            <span className="h-3.5 w-1/4 rounded-plate bg-secondary" />
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
    <Empty data-testid="nothing-found" className="border-y border-rule">
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
                words: <AlwaysEnglish className="wrap-anywhere">{words}</AlwaysEnglish>,
                category: <>{category}</>,
              }}
            />
          )}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
