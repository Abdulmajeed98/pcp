import { MousePointerClickIcon } from 'lucide-react';
import { useOutlet } from 'react-router';

import { usePageInTheAddress, useWideScreen } from '@/shared/lib';

import { ListedParts } from './listed-parts';

// The Admin console's Missing specifications: every Part that has an Offer
// and lacks a needed specification, a page at a time, so that compatibility
// checking stays whole (CAT-8). A Part leaves it once its gaps are filled,
// and the aim is to keep it empty. A Part on it is still shown to Shoppers.
// The Admin console is in English only, so its text is written here.
//
// A Part's edit form, opened from a row, is its child, and saving returns to
// the list. On a screen as wide as a desk's, the list keeps the start side
// and the form shows beside it, as the Catalog lays out its list and a Part.
// On a phone the form takes the whole screen, and the list is not rendered at
// all, so that it asks the API for nothing.
export function MissingSpecificationsPage() {
  const opened = useOutlet();
  const wide = useWideScreen();

  if (!wide) return opened ?? <TheList />;

  return (
    <div className="grid grid-cols-[minmax(0,26rem)_minmax(0,1fr)] gap-8">
      <TheList />
      <div className="min-w-0 border-s border-border ps-8">
        {opened ?? <NothingOpened />}
      </div>
    </div>
  );
}

function TheList() {
  const [page, show] = usePageInTheAddress();

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h1 className="text-xl font-semibold sm:text-2xl">Missing specifications</h1>
      <p className="text-sm text-muted-foreground">
        Parts with an Offer that lack a specification a Compatibility Rule reads. They are
        still shown to Shoppers.
      </p>
      <ListedParts page={page} onPage={show} />
    </div>
  );
}

// The pane beside the list, before a Part is opened.
function NothingOpened() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
      <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        <MousePointerClickIcon aria-hidden="true" className="size-5" />
      </span>
      <p>Open a Part from the list to fill in what it lacks.</p>
    </div>
  );
}
