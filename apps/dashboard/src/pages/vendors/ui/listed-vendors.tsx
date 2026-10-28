import { formatNumber } from '@pcp/i18n';
import { PlusIcon, StoreIcon } from 'lucide-react';
import { Link } from 'react-router';

import { WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery, useWideScreen } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  buttonVariants,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  ListPages,
  PastTheLastPage,
} from '@/shared/ui';

import { useVendors } from '../api/list-vendors';
import { VendorsList, VendorsTable } from './vendors-found';

// Every Vendor: how many, in words on the end side of the list's bar, never
// on a plate, then the Vendors of this page, in name order, a table from
// 64rem and two-line rows on a phone, then the way to the other pages. While
// the first answer is on its way, rows are sketched in its place, still, and
// while a later one is, the last answer stays, at full strength, and a line
// beside the count says that the next is on its way. No Vendor at all, a
// refusal and an API that cannot be reached are each said in words.
export function ListedVendors({
  page,
  onPage,
}: {
  page: number;
  onPage: (page: number) => void;
}) {
  const listed = useVendors(page);
  const wide = useWideScreen();

  if (listed.error) return <NotListed error={listed.error} />;
  if (listed.data === undefined) return <Reading wide={wide} />;
  if (listed.data.totalElements === 0) return <NoVendor />;

  const { content, totalElements, pageNumber, totalPages, first, last } = listed.data;

  return (
    <section
      aria-labelledby="vendors-listed"
      aria-busy={listed.isPlaceholderData}
      className="flex flex-col gap-4"
    >
      <p className="flex min-h-control flex-wrap items-center justify-end gap-x-3 text-sm text-muted-foreground">
        <span aria-live="polite">{listed.isPlaceholderData && 'Reading…'}</span>
        <span id="vendors-listed" data-testid="vendors-count">
          <span className="tabular-nums">{formatNumber(totalElements)}</span>{' '}
          {totalElements === 1 ? 'Vendor' : 'Vendors'}
        </span>
      </p>

      {content.length === 0 ? (
        <PastTheLastPage onFirstPage={() => onPage(0)} />
      ) : wide ? (
        <VendorsTable vendors={content} />
      ) : (
        <VendorsList vendors={content} />
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

// Rows sketched in Raised Stone where the first answer will be, in the shape
// of the rows to come, still: they do not shimmer.
function Reading({ wide }: { wide: boolean }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="flex min-h-control items-center justify-end text-sm text-muted-foreground">
        Reading the Vendors…
      </p>
      <ul aria-hidden="true" className="divide-y divide-rule border-y border-rule">
        {[0, 1, 2, 3, 4].map((row) => (
          <li
            key={row}
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

function NoVendor() {
  const keepingTheQuery = useAddressKeepingTheQuery();

  return (
    <Empty data-testid="no-vendor" className="border-y border-rule">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <StoreIcon />
        </EmptyMedia>
        <EmptyTitle>No Vendor yet</EmptyTitle>
        <EmptyDescription>
          The platform holds no Vendor. Each Vendor the Admin creates is listed here.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link
          to={keepingTheQuery('/vendors/new')}
          className={buttonVariants({ variant: 'outline' })}
        >
          <PlusIcon data-icon="inline-start" />
          Create a Vendor
        </Link>
      </EmptyContent>
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
