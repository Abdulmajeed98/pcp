import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { PackagePlusIcon, SearchIcon, SearchXIcon } from 'lucide-react';
import { Link } from 'react-router';

import { categoryName } from '@/entities/category';
import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
import { useWideScreen } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
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
  if (found.data.totalElements === 0) {
    return <NothingFound search={search} onSearch={onSearch} />;
  }

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

// A search that found nothing, as the dashboard's DESIGN.md has it (the
// owner's d3, taken under the standing instruction of 18 November 2026,
// part-requests ticket 02): the empty state, its title a heading and the
// whole result a status (`output`), so that it is announced; the words searched,
// `AlwaysEnglish`, and the Category it was limited to, if any; and, since a
// Part the catalog lacks can be asked for, the way on. One Note Grey
// sentence says that the Admin can add it and that the form starts with the
// Vendor's words; then, when a Category narrowed the search, the outlined
// Search every Category, which searches the same words in every Category,
// so that a Part filed under another Category is found before it is asked
// for; and after it the outlined Ask for it to be added, which opens the
// Part Request form with the words as the Part's name and the Category,
// carried in the address. A search of no words keeps no request action.
function NothingFound({
  search,
  onSearch,
}: {
  search: CatalogSearch;
  onSearch: (search: CatalogSearch) => void;
}) {
  const { t } = useTranslation();
  const words = search.words.trim();
  const category =
    search.category === undefined ? undefined : categoryName(search.category);

  return (
    <output className="block">
      <Empty data-testid="nothing-found" className="border-y border-rule">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle level={2}>{t('CatalogSearch.nothingFound')}</EmptyTitle>
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
        {words !== '' && (
          <EmptyContent>
            <p className="text-muted-foreground">
              {search.category === undefined
                ? t('CatalogSearch.askIntroEveryCategory')
                : t('CatalogSearch.askIntro')}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {search.category !== undefined && (
                <Button
                  variant="outline"
                  data-testid="search-every-category"
                  onClick={() => onSearch({ words: search.words, page: 0 })}
                >
                  <SearchIcon data-icon="inline-start" />
                  {t('CatalogSearch.searchEveryCategory')}
                </Button>
              )}
              <Link
                to={{ pathname: '../part-requests/new', search: askedFor(words, search) }}
                data-testid="ask-for-it"
                className={buttonVariants({ variant: 'outline' })}
              >
                <PackagePlusIcon data-icon="inline-start" />
                {t('CatalogSearch.ask')}
              </Link>
            </div>
          </EmptyContent>
        )}
      </Empty>
    </output>
  );
}

// The Part Request form's query for a search that found nothing: its words,
// which start the form as the Part's name, and its Category, if one narrowed
// it. The form's address is written relative to the search's route, so that
// it leads to the form under either frame.
function askedFor(words: string, { category }: CatalogSearch): string {
  const query = new URLSearchParams({ search: words });
  if (category !== undefined) query.set('category', category);
  return `?${query.toString()}`;
}
