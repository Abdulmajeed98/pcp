import { cn } from 'cn';
import { useOutlet } from 'react-router';

import { usePageInTheAddress, useWideScreen } from '@/shared/lib';
import { OpenedBesideAList } from '@/shared/ui';

import { ListedParts } from './listed-parts';

// The Admin console's Missing specifications: every Part that has an Offer
// and lacks a needed specification, a page at a time, so that compatibility
// checking stays whole (CAT-8). A Part leaves it once its gaps are filled,
// and the aim is to keep it empty. A Part on it is still shown to Shoppers.
// The Admin console is in English only, so its text is written here.
//
// A Part's edit form, opened from a row, is its child, and saving returns to
// the list. On a screen as wide as a desk's, the list takes the sheet's whole
// width until a Part is opened; then the list keeps seven twelfths on the
// start side and the form takes five, past an Edge line, as the Catalog lays
// out its list and a Part (redesign ticket 10). The list stays drawn through
// both, so that the Part whose gaps were just filled is seen leaving it. On a
// phone the form takes the whole screen, and the list is not rendered at
// all, so that it asks the API for nothing.
export function MissingSpecificationsPage() {
  const opened = useOutlet();
  const wide = useWideScreen();

  if (!wide) return opened ?? <TheList wide={false} />;

  return (
    <div className={cn('grid gap-6', opened !== null && 'grid-cols-12')}>
      <div className={cn('min-w-0', opened !== null && 'col-span-7')}>
        <TheList wide />
      </div>
      {opened !== null && (
        <div className="col-span-5 min-w-0 border-s border-border ps-6">
          {/* The form's title is of the second level under the list's
              (redesign ticket 08). */}
          <OpenedBesideAList>{opened}</OpenedBesideAList>
        </div>
      )}
    </div>
  );
}

function TheList({ wide }: { wide: boolean }) {
  const [page, show] = usePageInTheAddress();

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="screen-title">Missing specifications</h1>
        <p className="text-sm text-muted-foreground">
          Parts with an Offer that lack a specification a Compatibility Rule reads. They are
          still shown to Shoppers.
        </p>
      </div>
      <ListedParts page={page} onPage={show} wide={wide} />
    </div>
  );
}
