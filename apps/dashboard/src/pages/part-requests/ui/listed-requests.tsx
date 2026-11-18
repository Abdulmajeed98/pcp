import { WhyNotAnswered } from '@/shared/api';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  NothingToDo,
  PagedList,
  SketchedRows,
} from '@/shared/ui';

import { useOpenPartRequests } from '../api/part-requests';
import { RequestRow, RequestsTable } from './request-row';

// The open Part Requests: how many, in words, then those of this page, the
// oldest first, then the way to the other pages. A table from 64rem while no
// request is open beside the queue, and two-line rows on a phone and beside
// an open request, where the queue keeps seven twelfths of the sheet. While
// the first answer is on its way, rows are sketched in its place, and while a
// later one is, the last answer stays, at full strength, and a line beside
// the count says that the next is on its way. A request resolved leaves the
// queue as the Motion section says. An empty queue says that nothing is
// waiting, which is what the queue is for. A refusal and an API that cannot
// be reached are each said in words.
export function ListedRequests({
  page,
  onPage,
  asATable,
}: {
  page: number;
  onPage: (page: number) => void;
  asATable: boolean;
}) {
  const listed = useOpenPartRequests(page);

  if (listed.error) return <NotListed error={listed.error} />;
  if (listed.data === undefined) {
    return <SketchedRows words="Reading the Part Requests…" wide={asATable} />;
  }
  if (listed.data.totalElements === 0) {
    return (
      <NothingToDo
        testId="nothing-waiting"
        title="No Part Request is waiting"
        description="Vendors’ requests arrive here as they are sent, the longest waiting first."
      />
    );
  }

  return (
    <PagedList
      id="open-part-requests"
      answered={listed.data}
      reading={listed.isPlaceholderData}
      count={{
        testId: 'part-requests-count',
        words: (total) => (total === 1 ? 'Part Request waiting' : 'Part Requests waiting'),
      }}
      label="Open Part Requests"
      pagesLabel="Pages of the Open Part Requests"
      readingWords="Reading…"
      keyOf={(partRequest) => partRequest.id}
      row={(partRequest) => <RequestRow partRequest={partRequest} />}
      rows={asATable ? (shown) => <RequestsTable shown={shown} /> : undefined}
      onPage={onPage}
    />
  );
}

// The queue was not answered: the API refused it, or it could not be
// reached.
function NotListed({ error }: { error: Error }) {
  return (
    <Alert variant="destructive" data-testid="refusal">
      <AlertTitle>The Part Requests could not be listed.</AlertTitle>
      <AlertDescription>
        <WhyNotAnswered error={error} />
      </AlertDescription>
    </Alert>
  );
}
