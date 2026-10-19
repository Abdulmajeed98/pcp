import { formatNumber } from '@pcp/i18n';
import { CircleCheckIcon } from 'lucide-react';

import { WhyNotAnswered } from '@/shared/api';
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

import { usePartsMissingSpecifications } from '../api/list-missing-specifications';
import { PartRow } from './part-row';

// The Parts that have an Offer and lack a needed specification: how many, on
// the list's one plate, then the Parts of this page as rows, by Category,
// then by Offers, most first, then by name, then the way to the other pages.
// While the first answer is on its way, rows are sketched in its place, and
// while a later one is, the last answer stays, at full strength, and a line
// beside the count says that the next is on its way. An empty list says that
// nothing is missing, which is what the list is for. A refusal and an API that
// cannot be reached are each said in words.
export function ListedParts({
  page,
  onPage,
}: {
  page: number;
  onPage: (page: number) => void;
}) {
  const listed = usePartsMissingSpecifications(page);

  if (listed.error) return <NotListed error={listed.error} />;
  if (listed.data === undefined) return <Reading />;
  if (listed.data.totalElements === 0) return <NothingMissing />;

  const { content, totalElements, pageNumber, totalPages, first, last } = listed.data;

  return (
    <section
      aria-labelledby="parts-missing-specifications"
      aria-busy={listed.isPlaceholderData}
      className="flex flex-col gap-4"
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Plate data-testid="missing-specifications-count">
          {formatNumber(totalElements)}
        </Plate>
        <span id="parts-missing-specifications">
          {totalElements === 1
            ? 'Part missing specifications'
            : 'Parts missing specifications'}
        </span>
        <span aria-live="polite" className="text-sm text-muted-foreground">
          {listed.isPlaceholderData && 'Reading…'}
        </span>
      </p>

      {content.length > 0 ? (
        <ul
          aria-label="Parts missing specifications"
          className="divide-y divide-border border-y border-border"
        >
          {content.map((part) => (
            <li key={part.id}>
              <PartRow part={part} />
            </li>
          ))}
        </ul>
      ) : (
        <PastTheLastPage onFirstPage={() => onPage(0)} />
      )}

      {totalPages > 1 && (
        <ListPages
          label="Pages of the Parts missing specifications"
          pageNumber={pageNumber}
          totalPages={totalPages}
          first={first}
          last={last}
          onPage={onPage}
        />
      )}
    </section>
  );
}

// Rows sketched where the first answer will be.
function Reading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Reading the Parts…</p>
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

// The aim: every Part with an Offer has its needed specifications.
function NothingMissing() {
  return (
    <Empty data-testid="nothing-missing" className="border-y border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleCheckIcon />
        </EmptyMedia>
        <EmptyTitle>Nothing is missing</EmptyTitle>
        <EmptyDescription>
          Every Part with an Offer has all its needed specifications.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

// The list was not answered: the API refused it, or it could not be reached.
function NotListed({ error }: { error: Error }) {
  return (
    <Alert variant="destructive" data-testid="refusal">
      <AlertTitle>The Parts missing specifications could not be listed.</AlertTitle>
      <AlertDescription>
        <WhyNotAnswered error={error} />
      </AlertDescription>
    </Alert>
  );
}
