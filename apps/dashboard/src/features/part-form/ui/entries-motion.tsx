import { cn } from 'cn';
import { useLayoutEffect, useRef, useState } from 'react';
import type * as React from 'react';

import { type Moving, movingProps, useTakenOutOnceEnded } from '@/shared/lib';

// The entries of a list in the Part's form, a part number or a row of a list
// of rows, as they come and go (redesign ticket 08), under the No Snap Rule.
// An entry the Admin adds arrives: its space and the gap below it open from
// none as it fades in, so that what is below moves down over the frames; the
// entries the form opened with do not, so that the screen itself never fades
// in. An entry the Admin removes leaves: it fades, no longer takes a tap, and
// then its space and its gap close, so the entries below rise into place.
// It is taken out of the form's values only once its space has closed, or at
// the latest after the shared mechanism's wait should its transition never
// end (`shared/lib/leaving.ts`). Several that close in one frame, such as
// every row of a list made not known, are taken out together. Each entry is
// the theme's `leaves`, opening at once as a form's spaces do.
export function useEntriesMotion<Field extends { id: string }>(
  fields: readonly Field[],
  remove: (places: number[]) => void,
) {
  const [initial] = useState<ReadonlySet<string>>(
    () => new Set(fields.map(({ id }) => id)),
  );
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set());
  // The entries as they are now, for removals that end after they changed.
  const current = useRef(fields);
  useLayoutEffect(() => {
    current.current = fields;
  });

  // Takes the entries whose space has closed out of the form, by their
  // places in the entries as they are then.
  const whenEnded = useTakenOutOnceEnded([...leaving], (ids) => {
    const places = ids
      .map((each) => current.current.findIndex((field) => field.id === each))
      .filter((place) => place !== -1);
    if (places.length > 0) remove(places);
    setLeaving((before) => new Set([...before].filter((each) => !ids.includes(each))));
  });

  // Starts the entry with this id on its way out.
  function leave(id: string): void {
    setLeaving((before) => new Set(before).add(id));
  }

  // The entries that stay, in order: those not on their way out.
  const staying = fields.filter(({ id }) => !leaving.has(id));

  return {
    leave,
    staying,
    entryProps: (id: string): Moving => ({
      leaving: leaving.has(id),
      arriving: !initial.has(id),
      onTransitionEnd: leaving.has(id) ? whenEnded(id) : undefined,
    }),
  };
}

// An entry: the outer box opens and closes its space and the gap below it,
// the inner one holds what it shows. Entries sit in a box of their own with
// no gap, each holding its gap below it as its margin.
export function Entry({
  className,
  children,
  ...moving
}: Moving & { className?: string; children: React.ReactNode }) {
  return (
    <div {...movingProps(moving)} data-opens-at-once="" className="leaves mb-2">
      <div className={cn(className)}>{children}</div>
    </div>
  );
}

// The box the entries sit in, with no gap of its own: each entry holds its
// gap below it, and the box gives back the last one's.
export function Entries({ children }: { children: React.ReactNode }) {
  return <div className="-mb-2 flex flex-col">{children}</div>;
}
