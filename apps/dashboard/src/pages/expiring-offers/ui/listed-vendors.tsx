import { WhyNotAnswered } from '@/shared/api';
import { useWideScreen } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  NothingToDo,
  PagedList,
  SketchedRows,
} from '@/shared/ui';

import { useVendorsWithExpiringOffers } from '../api/list-expiring-offers';
import { VendorRow, VendorsTable } from './vendor-row';

// The Vendors to remind: how many, in words, then the Vendors of this page, a
// table from 64rem and rows on a phone, those with an Expired Offer first,
// then the one whose Offer expires soonest, then the way to the other pages.
// While the first answer is on its way, rows are sketched in its place, and
// while a later one is, the last answer stays, at full strength, and a line
// beside the count says that the next is on its way. A Vendor whose Offers
// were confirmed leaves the list as the Motion section says. An empty list
// says that no Vendor needs reminding, which is what the list is for. A
// refusal and an API that cannot be reached are each said in words.
export function ListedVendors({
  page,
  onPage,
}: {
  page: number;
  onPage: (page: number) => void;
}) {
  const listed = useVendorsWithExpiringOffers(page);
  const wide = useWideScreen();

  if (listed.error) return <NotListed error={listed.error} />;
  if (listed.data === undefined) {
    return <SketchedRows words="Reading the Vendors…" wide={wide} />;
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
      rows={wide ? (shown) => <VendorsTable shown={shown} /> : undefined}
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
