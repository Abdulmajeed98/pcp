import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { PlusIcon, SearchXIcon } from 'lucide-react';
import { Link } from 'react-router';

import { categoryName } from '@/entities/category';
import { WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';
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
  Plate,
} from '@/shared/ui';

import { useSearchParts } from '../api/search-parts';
import type { CatalogSearch } from '../model/search';
import { PartRow } from './part-row';

// What the search found: how many, on the Catalog's one plate, then the
// Parts of this page as rows, then the way to the other pages. While the
// first answer is on its way, rows are sketched in its place, and while a
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

  if (found.error) return <NotSearched error={found.error} />;
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
        <Plate data-testid="parts-found-count">{formatNumber(totalElements)}</Plate>
        <span id="parts-found">
          {totalElements === 1 ? 'Part found' : 'Parts found'}
          {search.category !== undefined && ` in ${categoryName(search.category)}`}
        </span>
        <span aria-live="polite" className="text-sm text-muted-foreground">
          {found.isPlaceholderData && 'Searching…'}
        </span>
      </p>

      {content.length > 0 ? (
        <ul
          aria-label="Parts found"
          className="divide-y divide-border border-y border-border"
        >
          {content.map((part) => (
            <li key={part.id}>
              <PartRow part={part} />
            </li>
          ))}
        </ul>
      ) : (
        <PastTheLastPage onFirstPage={() => onSearch({ ...search, page: 0 })} />
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

// Rows sketched where the first answer will be.
function Searching() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Searching the catalog…</p>
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

// An address can ask for a page past the last, as when a search's results
// have shrunk since the address was written.
function PastTheLastPage({ onFirstPage }: { onFirstPage: () => void }) {
  return (
    <Empty className="border-y border-border">
      <EmptyHeader>
        <EmptyTitle>This page is past the last one.</EmptyTitle>
      </EmptyHeader>
      <Button variant="outline" onClick={onFirstPage}>
        Go to the first page
      </Button>
    </Empty>
  );
}

function NothingFound({ search }: { search: CatalogSearch }) {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const where =
    search.category === undefined
      ? 'the catalog'
      : `the Category ${categoryName(search.category)}`;

  return (
    <Empty data-testid="nothing-found" className="border-y border-border">
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
              <AlwaysEnglish>{search.words.trim()}</AlwaysEnglish>” in its name, its
              manufacturer or a part number. Check the spelling
              {search.category === undefined ? '.' : ', or search every Category.'}
            </>
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <p>A Part that OpenDB lacks can be created.</p>
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
