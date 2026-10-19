import { formatNumber } from '@pcp/i18n';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from './button';

// The way to the page before and the page after in a list answered in pages,
// and where this one stands, counted from 1 as a person counts. Its words
// are the Admin console's, in English, unless a screen of the Vendor portal
// gives its own, in the portal's language. The chevrons point back and on in
// the reading direction.
function ListPages({
  label,
  pageNumber,
  totalPages,
  first,
  last,
  onPage,
  words,
}: {
  // What the navigation is named, such as "Pages of the results".
  label: string;
  // The page shown, counted from 0, as the API counts it.
  pageNumber: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  onPage: (page: number) => void;
  // The words in another language: the two buttons', and where this page
  // stands, with its numbers written by `formatNumber`.
  words?: { previous: string; next: string; where: ReactNode };
}) {
  return (
    <nav aria-label={label} className="flex items-center justify-between gap-2">
      <Button variant="outline" disabled={first} onClick={() => onPage(pageNumber - 1)}>
        <ChevronLeftIcon data-icon="inline-start" className="rtl:rotate-180" />
        {words?.previous ?? 'Previous'}
      </Button>
      <p className="text-sm text-muted-foreground">
        {words?.where ?? (
          <>
            Page {formatNumber(pageNumber + 1)} of {formatNumber(totalPages)}
          </>
        )}
      </p>
      <Button variant="outline" disabled={last} onClick={() => onPage(pageNumber + 1)}>
        {words?.next ?? 'Next'}
        <ChevronRightIcon data-icon="inline-end" className="rtl:rotate-180" />
      </Button>
    </nav>
  );
}

export { ListPages };
