import { formatNumber } from '@pcp/i18n';
import { CircleCheckIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { type ShownRow, useLeavingRows, whenTheSpaceHasClosed } from '@/shared/lib';

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty';
import { ListPages } from './list-pages';
import { PastTheLastPage } from './past-the-last-page';

// A page of a list as the API answers one, as far as the list reads it.
interface AnsweredPage<Item> {
  content: readonly Item[];
  totalElements: number;
  pageNumber: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// A list the Admin console answers in pages, as the dashboard's DESIGN.md
// lays out a list: how many there are, in words on the end side, never on a
// plate, then this page's rows, then the way to the other pages. While a
// later page is on its way, the last answer stays, at full strength, and a
// line beside the count says that the next is on its way. A page past the
// last says so, with the way to the first. A row the list drops while the
// user is on it leaves as the Motion section says, and a row new to the page
// arrives in step with it; paging and the count stay still.
//
// The rows are two-line rows in a list, each drawn by `row`, unless `rows`
// draws them otherwise, as a table from 64rem (redesign ticket 10). Either
// way a leaving row is marked `data-leaving` and inert, an arriving one
// `data-arriving`, their space is closed or opened by the theme's `leaves`,
// each row's rule with it, and a leaving row is taken out once its space has
// closed, so that nothing is ever taken out or put in while it can be seen.
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
  rows,
  onPage,
}: {
  // The identifier of the words after the count, which name the list.
  id: string;
  answered: AnsweredPage<Item>;
  // Whether the answer shown is the last one, kept while the next is on its
  // way.
  reading: boolean;
  // The count's test identifier, and the words after it, which differ for
  // one.
  count: { testId: string; words: (total: number) => string };
  // What the rows and the pages' navigation are named.
  label: string;
  pagesLabel: string;
  // What the line beside the count says while the next answer is on its way.
  readingWords: string;
  keyOf: (item: Item) => string;
  row: (item: Item) => ReactNode;
  // The rows drawn otherwise than as a list, such as a table, named `label`.
  rows?: (shown: ShownRow<Item>[]) => ReactNode;
  onPage: (page: number) => void;
}) {
  const { content, totalElements, pageNumber, totalPages, first, last } = answered;
  const shown = useLeavingRows(content, keyOf, pageNumber);

  return (
    <section aria-labelledby={id} aria-busy={reading} className="flex flex-col gap-4">
      <p className="flex min-h-control flex-wrap items-center justify-end gap-x-3 text-sm text-muted-foreground">
        <span aria-live="polite">{reading && readingWords}</span>
        <span id={id}>
          <span data-testid={count.testId} className="tabular-nums">
            {formatNumber(totalElements)}
          </span>{' '}
          {count.words(totalElements)}
        </span>
      </p>

      {content.length === 0 ? (
        <PastTheLastPage onFirstPage={() => onPage(0)} />
      ) : rows !== undefined ? (
        rows(shown)
      ) : (
        <ul aria-label={label} className="-mx-2 border-t border-rule">
          {shown.map((each) => (
            <li
              key={each.key}
              className="leaves border-b border-rule"
              data-leaving={each.leaving || undefined}
              data-arriving={each.arriving || undefined}
              inert={each.leaving}
              onTransitionEnd={whenTheSpaceHasClosed(each)}
            >
              <div>{row(each.item)}</div>
            </li>
          ))}
        </ul>
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

// Rows sketched in Raised Stone where a list's first answer will be, under a
// line that says what is being read, in the shape of the list's own rows:
// one line from 64rem, two on a phone. They are still: they do not shimmer.
function SketchedRows({ words, wide }: { words: string; wide: boolean }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="flex min-h-control items-center justify-end text-sm text-muted-foreground">
        {words}
      </p>
      <ul aria-hidden="true" className="divide-y divide-rule border-y border-rule">
        {[0, 1, 2, 3, 4].map((sketched) => (
          <li
            key={sketched}
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
    <Empty data-testid={testId} className="border-y border-rule">
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
