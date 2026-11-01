import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { PlusIcon, SearchXIcon } from 'lucide-react';
import { Link } from 'react-router';

import { categoryName } from '@/entities/category';
import { WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery, useWideScreen } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
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

import { useSearchParts } from '../api/search-parts';
import type { CatalogSearch } from '../model/search';
import { PartsList, PartsTable } from './parts-found';

// What the search found: how many, in words on the end side of the filter
// bar, never on a plate, then the Parts of this page, a table from 64rem and
// two-line rows on a phone, then the way to the other pages. While the first
// answer is on its way, rows are sketched in its place, still, and while a
// later one is, the last answer stays, at full strength, and a line beside
// the count says that the next is on its way. A refusal and an API that
// cannot be reached are each said in words.
export function FoundParts({
  search,
  onSearch,
}: {
  search: CatalogSearch;
  onSearch: (search: CatalogSearch) => void;
}) {
  const found = useSearchParts(search);
  const wide = useWideScreen();

  if (found.error) return <NotSearched error={found.error} />;
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
        <span aria-live="polite">{found.isPlaceholderData && 'Searching…'}</span>
        <span id="parts-found" data-testid="parts-found">
          <span data-testid="parts-found-count" className="tabular-nums">
            {formatNumber(totalElements)}
          </span>{' '}
          {totalElements === 1 ? 'Part' : 'Parts'}
        </span>
      </p>

      {content.length === 0 ? (
        <PastTheLastPage onFirstPage={() => onSearch({ ...search, page: 0 })} />
      ) : wide ? (
        <PartsTable parts={content} />
      ) : (
        <PartsList parts={content} />
      )}

      {totalPages > 1 && (
        <ListPages
          label="Pages of the results"
          pageNumber={pageNumber}
          totalPages={totalPages}
          first={first}
          last={last}
          onPage={(page) => onSearch({ ...search, page })}
        />
      )}
    </section>
  );
}

// Rows sketched in Raised Stone where the first answer will be, in the shape
// of the rows to come, still: they do not shimmer.
function Searching({ wide }: { wide: boolean }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="flex min-h-control items-center justify-end text-sm text-muted-foreground">
        Searching the catalog…
      </p>
      <ul aria-hidden="true" className="divide-y divide-rule border-y border-rule">
        {[0, 1, 2, 3, 4].map((row) => (
          <li
            key={row}
            className={
              wide
                ? 'flex h-12 items-center gap-4'
                : 'flex h-18 flex-col justify-center gap-2'
            }
          >
            <span className="h-3.5 w-2/5 rounded-plate bg-secondary" />
            <span className="h-3.5 w-1/5 rounded-plate bg-secondary" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NothingFound({ search }: { search: CatalogSearch }) {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const where =
    search.category === undefined
      ? 'the catalog'
      : `the Category ${categoryName(search.category)}`;

  return (
    <Empty data-testid="nothing-found" className="border-y border-rule">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>No Part found</EmptyTitle>
        <EmptyDescription>
          {search.words.trim() === '' ? (
            <>Nothing in {where} yet.</>
          ) : (
            <>
              No Part in {where} holds every word of “
              <AlwaysEnglish className="wrap-anywhere">{search.words.trim()}</AlwaysEnglish>
              ” in its name, its manufacturer or a part number. Check the spelling
              {search.category === undefined ? '.' : ', or search every Category.'}
            </>
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <p className="text-muted-foreground">A Part that OpenDB lacks can be created.</p>
        <Link
          to={keepingTheQuery('/catalog/new')}
          className={buttonVariants({ variant: 'outline' })}
        >
          <PlusIcon data-icon="inline-start" />
          Create a Part
        </Link>
      </EmptyContent>
    </Empty>
  );
}

// The search was not answered: the API refused it, or it could not be
// reached.
function NotSearched({ error }: { error: Error }) {
  return (
    <Alert variant="destructive" data-testid="refusal">
      <AlertTitle>The catalog could not be searched.</AlertTitle>
      <AlertDescription>
        <WhyNotAnswered error={error} />
      </AlertDescription>
    </Alert>
  );
}
