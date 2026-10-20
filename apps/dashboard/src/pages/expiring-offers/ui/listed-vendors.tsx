import { WhyNotAnswered } from '@/shared/api';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  NothingToDo,
  PagedList,
  SketchedRows,
} from '@/shared/ui';

import { useVendorsWithExpiringOffers } from '../api/list-expiring-offers';
import { VendorRow } from './vendor-row';

// The Vendors to remind: how many, on the list's one plate, then the Vendors
// of this page as rows, those with an Expired Offer first, then the one whose
// Offer expires soonest, then the way to the other pages. While the first
// answer is on its way, rows are sketched in its place, and while a later one
// is, the last answer stays, at full strength, and a line beside the count
// says that the next is on its way. An empty list says that no Vendor needs
// reminding, which is what the list is for. A refusal and an API that cannot
// be reached are each said in words.
export function ListedVendors({
  page,
  onPage,
}: {
  page: number;
  onPage: (page: number) => void;
}) {
  const listed = useVendorsWithExpiringOffers(page);

  if (listed.error) return <NotListed error={listed.error} />;
  if (listed.data === undefined) {
    return (
      <SketchedRows words="Reading the Vendors…" rowClassName="flex flex-col gap-2 py-3">
        <span className="h-3.5 w-3/4 rounded-sm bg-secondary" />
        <span className="h-3.5 w-1/2 rounded-sm bg-muted" />
        <span className="h-3.5 w-2/3 rounded-sm bg-muted" />
      </SketchedRows>
    );
  }
  // The aim: no active Vendor has an Offer expired or about to expire. The
  // sentence names no number of days, which the API's domain holds.
  if (listed.data.totalElements === 0) {
    return (
      <NothingToDo
        testId="nobody-to-remind"
        title="No Vendor needs reminding"
        description="No active Vendor has an Offer expired or about to expire."
      />
    );
  }

  return (
    <PagedList
      id="vendors-to-remind"
      answered={listed.data}
      reading={listed.isPlaceholderData}
      count={{
        testId: 'vendors-to-remind-count',
        words: (total) => (total === 1 ? 'Vendor to remind' : 'Vendors to remind'),
      }}
      label="Vendors to remind"
      pagesLabel="Pages of the Vendors to remind"
      readingWords="Reading…"
      keyOf={(vendor) => vendor.id}
      row={(vendor) => <VendorRow vendor={vendor} />}
      onPage={onPage}
    />
  );
}

// The list was not answered: the API refused it, or it could not be reached.
function NotListed({ error }: { error: Error }) {
  return (
    <Alert variant="destructive" data-testid="refusal">
      <AlertTitle>The Vendors to remind could not be listed.</AlertTitle>
      <AlertDescription>
        <WhyNotAnswered error={error} />
      </AlertDescription>
    </Alert>
  );
}
