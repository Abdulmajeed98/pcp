import { WhyNotAnswered } from '@/shared/api';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  NothingToDo,
  PagedList,
  SketchedRows,
} from '@/shared/ui';

import { usePartsMissingSpecifications } from '../api/list-missing-specifications';
import { PartRow, PartsTable } from './part-row';

// The Parts that have an Offer and lack a needed specification: how many, in
// words, then the Parts of this page, a table from 64rem and two-line rows on
// a phone, by Category, then by Offers, most first, then by name, then the
// way to the other pages. While the first answer is on its way, rows are
// sketched in its place, and while a later one is, the last answer stays, at
// full strength, and a line beside the count says that the next is on its
// way. A Part whose gaps were filled leaves the list as the Motion section
// says. An empty list says that nothing is missing, which is what the list is
// for. A refusal and an API that cannot be reached are each said in words.
export function ListedParts({
  page,
  onPage,
  wide,
}: {
  page: number;
  onPage: (page: number) => void;
  wide: boolean;
}) {
  const listed = usePartsMissingSpecifications(page);

  if (listed.error) return <NotListed error={listed.error} />;
  if (listed.data === undefined) {
    return <SketchedRows words="Reading the Parts…" wide={wide} />;
  }
  // The aim: every Part with an Offer has its needed specifications.
  if (listed.data.totalElements === 0) {
    return (
      <NothingToDo
        testId="nothing-missing"
        title="Nothing is missing"
        description="Every Part with an Offer has all its needed specifications."
      />
    );
  }

  return (
    <PagedList
      id="parts-missing-specifications"
      answered={listed.data}
      reading={listed.isPlaceholderData}
      count={{
        testId: 'missing-specifications-count',
        words: (total) =>
          total === 1 ? 'Part missing specifications' : 'Parts missing specifications',
      }}
      label="Parts missing specifications"
      pagesLabel="Pages of the Parts missing specifications"
      readingWords="Reading…"
      keyOf={(part) => part.id}
      row={(part) => <PartRow part={part} />}
      rows={wide ? (shown) => <PartsTable shown={shown} /> : undefined}
      onPage={onPage}
    />
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
