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
  if (listed.data === undefined) return <Reading />;
  if (listed.data.totalElements === 0) return <NobodyToRemind />;

  const { content, totalElements, pageNumber, totalPages, first, last } = listed.data;

  return (
    <section
      aria-labelledby="vendors-to-remind"
      aria-busy={listed.isPlaceholderData}
      className="flex flex-col gap-4"
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Plate data-testid="vendors-to-remind-count">{formatNumber(totalElements)}</Plate>
        <span id="vendors-to-remind">
          {totalElements === 1 ? 'Vendor to remind' : 'Vendors to remind'}
        </span>
        <span aria-live="polite" className="text-sm text-muted-foreground">
          {listed.isPlaceholderData && 'Reading…'}
        </span>
      </p>

      {content.length > 0 ? (
        <ul
          aria-label="Vendors to remind"
          className="divide-y divide-border border-y border-border"
        >
          {content.map((vendor) => (
            <li key={vendor.id}>
              <VendorRow vendor={vendor} />
            </li>
          ))}
        </ul>
      ) : (
        <PastTheLastPage onFirstPage={() => onPage(0)} />
      )}

      {totalPages > 1 && (
        <ListPages
          label="Pages of the Vendors to remind"
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
      <p className="text-sm text-muted-foreground">Reading the Vendors…</p>
      <ul aria-hidden="true" className="divide-y divide-border border-y border-border">
        {[0, 1, 2, 3].map((row) => (
          <li key={row} className="flex flex-col gap-2 py-3">
            <span className="h-3.5 w-3/4 rounded-sm bg-secondary" />
            <span className="h-3.5 w-1/2 rounded-sm bg-muted" />
            <span className="h-3.5 w-2/3 rounded-sm bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// The aim: every active Vendor's Offers are current.
function NobodyToRemind() {
  return (
    <Empty data-testid="nobody-to-remind" className="border-y border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleCheckIcon />
        </EmptyMedia>
        <EmptyTitle>No Vendor needs reminding</EmptyTitle>
        <EmptyDescription>
          No active Vendor has an Offer expired or about to expire.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
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
