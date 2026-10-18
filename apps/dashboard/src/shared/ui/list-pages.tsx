import { formatNumber } from '@pcp/i18n';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from './button';

// The way to the page before and the page after in a list answered in pages,
// and where this one stands, counted from 1 as a person counts. Its words
// are the Admin console's, in English. The chevrons point back and on in the
// reading direction.
function ListPages({
  label,
  pageNumber,
  totalPages,
  first,
  last,
  onPage,
}: {
  // What the navigation is named, such as "Pages of the results".
  label: string;
  // The page shown, counted from 0, as the API counts it.
  pageNumber: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <nav aria-label={label} className="flex items-center justify-between gap-2">
      <Button variant="outline" disabled={first} onClick={() => onPage(pageNumber - 1)}>
        <ChevronLeftIcon data-icon="inline-start" className="rtl:rotate-180" />
        Previous
      </Button>
      <p className="text-sm text-muted-foreground">
        Page {formatNumber(pageNumber + 1)} of {formatNumber(totalPages)}
      </p>
      <Button variant="outline" disabled={last} onClick={() => onPage(pageNumber + 1)}>
        Next
        <ChevronRightIcon data-icon="inline-end" className="rtl:rotate-180" />
      </Button>
    </nav>
  );
}

export { ListPages };
