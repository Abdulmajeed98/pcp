import { formatNumber } from '@pcp/i18n';
import { StoreIcon } from 'lucide-react';

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

import { useVendors } from '../api/list-vendors';
import { VendorRow } from './vendor-row';

// Every Vendor: how many, on the list's one plate, then the Vendors of this
// page as rows, in name order, then the way to the other pages. While the
// first answer is on its way, rows are sketched in its place, and while a
// later one is, the last answer stays, at full strength, and a line beside
// the count says that the next is on its way. No Vendor at all, a refusal and
// an API that cannot be reached are each said in words.
export function ListedVendors({
  page,
  onPage,
}: {
  page: number;
  onPage: (page: number) => void;
}) {
  const listed = useVendors(page);

  if (listed.error) return <NotListed error={listed.error} />;
  if (listed.data === undefined) return <Reading />;
  if (listed.data.totalElements === 0) return <NoVendor />;

  const { content, totalElements, pageNumber, totalPages, first, last } = listed.data;

  return (
    <section
      aria-labelledby="vendors-listed"
      aria-busy={listed.isPlaceholderData}
      className="flex flex-col gap-4"
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Plate data-testid="vendors-count">{formatNumber(totalElements)}</Plate>
        <span id="vendors-listed">{totalElements === 1 ? 'Vendor' : 'Vendors'}</span>
        <span aria-live="polite" className="text-sm text-muted-foreground">
          {listed.isPlaceholderData && 'Reading…'}
        </span>
      </p>

      {content.length > 0 ? (
        <ul aria-label="Vendors" className="divide-y divide-border border-y border-border">
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
          label="Pages of the Vendors"
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
          <li key={row} className="flex flex-col gap-2 py-2.5">
            <span className="h-3.5 w-3/4 rounded-sm bg-secondary" />
            <span className="h-3.5 w-1/3 rounded-sm bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NoVendor() {
  return (
    <Empty data-testid="no-vendor" className="border-y border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <StoreIcon />
        </EmptyMedia>
        <EmptyTitle>No Vendor yet</EmptyTitle>
        <EmptyDescription>
          The platform holds no Vendor. Each Vendor the Admin creates is listed here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

// The list was not answered: the API refused it, or it could not be reached.
function NotListed({ error }: { error: Error }) {
  return (
    <Alert variant="destructive" data-testid="refusal">
      <AlertTitle>The Vendors could not be listed.</AlertTitle>
      <AlertDescription>
        <WhyNotAnswered error={error} />
      </AlertDescription>
    </Alert>
  );
}
