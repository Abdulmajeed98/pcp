import { formatNumber } from '@pcp/i18n';
import { CircleCheckIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty';
import { ListPages } from './list-pages';
import { PastTheLastPage } from './past-the-last-page';
import { Plate } from './plate';

// A page of a list as the API answers one, as far as the list reads it.
interface AnsweredPage<Item> {
  content: readonly Item[];
  totalElements: number;
  pageNumber: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// A list the Admin console answers in pages: how many there are, on the
// list's one plate, then this page's rows, then the way to the other pages.
// While a later page is on its way, the last answer stays, at full strength,
// and a line beside the count says that the next is on its way. A page past
// the last says so, with the way to the first.
function PagedList<Item>({
  id,
  answered,
  reading,
  count,
  label,
  pagesLabel,
  readingWords,
  keyOf,
  row,
  onPage,
}: {
  // The identifier of the words after the count, which name the list.
  id: string;
  answered: AnsweredPage<Item>;
  // Whether the answer shown is the last one, kept while the next is on its
  // way.
  reading: boolean;
  // The plate's test identifier, and the words after the count, which differ
  // for one.
  count: { testId: string; words: (total: number) => string };
  // What the rows and the pages' navigation are named.
  label: string;
  pagesLabel: string;
  // What the line beside the count says while the next answer is on its way.
  readingWords: string;
  keyOf: (item: Item) => string;
  row: (item: Item) => ReactNode;
  onPage: (page: number) => void;
}) {
  const { content, totalElements, pageNumber, totalPages, first, last } = answered;

  return (
    <section aria-labelledby={id} aria-busy={reading} className="flex flex-col gap-4">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Plate data-testid={count.testId}>{formatNumber(totalElements)}</Plate>
        <span id={id}>{count.words(totalElements)}</span>
        <span aria-live="polite" className="text-sm text-muted-foreground">
          {reading && readingWords}
        </span>
      </p>

      {content.length > 0 ? (
        <ul aria-label={label} className="divide-y divide-border border-y border-border">
          {content.map((item) => (
            <li key={keyOf(item)}>{row(item)}</li>
          ))}
        </ul>
      ) : (
        <PastTheLastPage onFirstPage={() => onPage(0)} />
      )}

      {totalPages > 1 && (
        <ListPages
          label={pagesLabel}
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

// Rows sketched where a list's first answer will be, under a line that says
// what is being read. Each sketched row holds what it is given, in the
// shape of the list's own rows.
function SketchedRows({
  words,
  rowClassName,
  children,
}: {
  words: string;
  rowClassName: string;
  children: ReactNode;
}) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{words}</p>
      <ul aria-hidden="true" className="divide-y divide-border border-y border-border">
        {[0, 1, 2, 3].map((sketched) => (
          <li key={sketched} className={rowClassName}>
            {children}
          </li>
        ))}
      </ul>
    </div>
  );
}

// What an empty list says when an empty list is the aim, as for a list of
// work to do: a circled tick, a title and a sentence.
function NothingToDo({
  testId,
  title,
  description,
}: {
  testId: string;
  title: string;
  description: string;
}) {
  return (
    <Empty data-testid={testId} className="border-y border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleCheckIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export { NothingToDo, PagedList, SketchedRows };
