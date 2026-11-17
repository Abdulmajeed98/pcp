import { StoreIcon } from 'lucide-react';

import { WhyNotAnswered } from '@/shared/api';
import { useWideScreen } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  PagedList,
  SketchedRows,
} from '@/shared/ui';

import { useReferralCounts } from '../api/list-referral-counts';
import { VendorRow, VendorsTable } from './vendor-row';

// Every Vendor with its Referral count: how many Vendors, in words, then the
// Vendors of this page, a table from 64rem and rows on a phone, the most
// Referrals first, then the way to the other pages. While the first answer
// is on its way, rows are sketched in its place, and while a later one is,
// the last answer stays, at full strength, and a line beside the count says
// that the next is on its way. No Vendor at all, a refusal and an API that
// cannot be reached are each said in words.
export function ListedVendors({
  page,
  onPage,
}: {
  page: number;
  onPage: (page: number) => void;
}) {
  const listed = useReferralCounts(page);
  const wide = useWideScreen();

  if (listed.error) return <NotListed error={listed.error} />;
  if (listed.data === undefined) {
    return <SketchedRows words="Reading the Referrals…" wide={wide} />;
  }
  if (listed.data.totalElements === 0) return <NoVendor />;

  return (
    <PagedList
      id="referrals-by-vendor"
      answered={listed.data}
      reading={listed.isPlaceholderData}
      count={{
        testId: 'vendors-count',
        words: (total) => (total === 1 ? 'Vendor' : 'Vendors'),
      }}
      label="Referrals by Vendor"
      pagesLabel="Pages of the Referrals by Vendor"
      readingWords="Reading…"
      keyOf={(vendor) => vendor.id}
      row={(vendor) => <VendorRow vendor={vendor} />}
      rows={wide ? (shown) => <VendorsTable shown={shown} /> : undefined}
      onPage={onPage}
    />
  );
}

// The platform holds no Vendor yet, so no count can be shown. The list
// holds every Vendor, those with no Referral among them, so this is the only
// empty list it can be.
function NoVendor() {
  return (
    <Empty data-testid="no-vendor" className="border-y border-rule">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <StoreIcon />
        </EmptyMedia>
        <EmptyTitle>No Vendor yet</EmptyTitle>
        <EmptyDescription>
          Each Vendor the Admin creates is listed here with its Referral count.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

// The list was not answered: the API refused it, or it could not be reached.
function NotListed({ error }: { error: Error }) {
  return (
    <Alert variant="destructive" data-testid="refusal">
      <AlertTitle>The Referrals could not be listed.</AlertTitle>
      <AlertDescription>
        <WhyNotAnswered error={error} />
      </AlertDescription>
    </Alert>
  );
}
