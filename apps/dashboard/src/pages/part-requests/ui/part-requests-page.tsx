import { cn } from 'cn';
import { useLocation, useOutlet } from 'react-router';

import { usePageInTheAddress, useWideScreen } from '@/shared/lib';
import { Announced, OpenedBesideAList, OpeningSpace } from '@/shared/ui';

import { resolvedIn } from '../model/resolution';
import { ListedRequests } from './listed-requests';
import { ResolutionNote } from './resolution-note';

// The Admin console's Part Requests, its seventh section: the queue of open
// Part Requests of every Vendor, the oldest first, a page at a time, so that
// the Admin deals with them in the order they came (REQ-2). A request leaves
// it once the Admin fulfils it or rejects it, so the aim is to keep it
// empty. The Admin console is in English only, so its text is written here.
//
// A request, opened from a row, is its child, and so is the form for a new
// Part opened from a request. On a screen as wide as a desk's, the queue
// takes the sheet's whole width until a request is opened; then the queue
// keeps seven twelfths on the start side, as two-line rows, and the request
// takes five, past an Edge line, as Missing specifications lays out its list
// and a Part's form (the owner's d7, part-requests ticket 02). The queue
// stays drawn through both, so that a resolved request is seen leaving it,
// and the note after it opens its space above the count's line in step. On
// a phone the request takes the whole screen, and the queue is not rendered
// at all, so that it asks the API for nothing; coming back, the queue draws
// what it last read, and the resolved request leaves it as it is read again.
export function PartRequestsPage() {
  const opened = useOutlet();
  const wide = useWideScreen();

  if (!wide) return opened ?? <TheQueue asATable={false} />;

  return (
    <div className={cn('grid gap-6', opened !== null && 'grid-cols-12')}>
      <div className={cn('min-w-0', opened !== null && 'col-span-7')}>
        <TheQueue asATable={opened === null} />
      </div>
      {opened !== null && (
        <div className="col-span-5 min-w-0 border-s border-border ps-6">
          {/* The request's title is of the second level under the queue's
              (redesign ticket 08). */}
          <OpenedBesideAList>{opened}</OpenedBesideAList>
        </div>
      )}
    </div>
  );
}

function TheQueue({ asATable }: { asATable: boolean }) {
  const [page, show] = usePageInTheAddress();
  const resolved = resolvedIn(useLocation().state);

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-col gap-1">
        <h1 className="screen-title">Part Requests</h1>
        <p className="text-sm text-muted-foreground">
          Parts Vendors asked to have added to the catalog, the longest waiting first. Each
          leaves the queue once you match it to a Part, create the Part or reject it.
        </p>
      </div>
      {/* The note after a resolution, which arrives in the live region once
          the region is in the page, so that it is announced. Its space
          opens in step with the resolved row's leaving, so that the list
          below moves down rather than jumps (Motion 12), and closes again on
          another page. The gap above it is its own, so that it closes with
          it. */}
      <output className="block">
        <OpeningSpace inStep>
          {resolved !== null && (
            <div className="pt-4">
              <Announced key={resolved.requestId}>
                <ResolutionNote resolved={resolved} />
              </Announced>
            </div>
          )}
        </OpeningSpace>
      </output>
      <div className="pt-4">
        <ListedRequests page={page} onPage={show} asATable={asATable} />
      </div>
    </div>
  );
}
