import { cn } from 'cn';
import { useLayoutEffect, useRef, useState } from 'react';
import type * as React from 'react';

// The entries of a list in the Part's form, a part number or a row of a list
// of rows, as they come and go (redesign ticket 08), under the No Snap Rule.
// An entry the Admin adds arrives: its space and the gap below it open from
// none as it fades in, so that what is below moves down over the frames; the
// entries the form opened with do not, so that the screen itself never fades
// in. An entry the Admin removes leaves: it fades, no longer takes a tap, and
// then its space and its gap close, so the entries below rise into place.
// It is taken out of the form's values only once its space has closed, at
// the end of that transition, whatever its speed. The theme's `entry-opens`.
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
  // The entries whose space has closed, taken out of the form together in
  // the frame they closed in, by their places in the entries as they are
  // then: several that close in one frame, such as every row of a list made
  // not known, all go at once.
  const gone = useRef<string[]>([]);

  // Starts the entry with this id on its way out.
  function leave(id: string): void {
    setLeaving((before) => new Set(before).add(id));
  }

  // Takes the entry out once its space has closed.
  function left(id: string): void {
    if (gone.current.includes(id)) return;
    gone.current.push(id);
    if (gone.current.length > 1) return;
    requestAnimationFrame(() => {
      const ids = gone.current;
      gone.current = [];
      const places = ids
        .map((each) => current.current.findIndex((field) => field.id === each))
        .filter((place) => place !== -1);
      if (places.length > 0) remove(places);
      setLeaving((before) => new Set([...before].filter((each) => !ids.includes(each))));
    });
  }

  // The entries that stay, in order: those not on their way out.
  const staying = fields.filter(({ id }) => !leaving.has(id));

  return {
    leave,
    staying,
    entryProps: (id: string) => ({
      leaving: leaving.has(id),
      arriving: !initial.has(id),
      onLeft: () => left(id),
    }),
  };
}

// An entry: the outer box opens and closes its space and the gap below it,
// the inner one holds what it shows. Entries sit in a box of their own with
// no gap, each holding its gap below it as its margin.
export function Entry({
  leaving,
  arriving,
  onLeft,
  className,
  children,
}: {
  leaving: boolean;
  arriving: boolean;
  onLeft: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      inert={leaving}
      data-leaving={leaving || undefined}
      data-arriving={(arriving && !leaving) || undefined}
      className="entry-opens mb-2"
      onTransitionEnd={(event) => {
        if (
          leaving &&
          event.target === event.currentTarget &&
          event.propertyName === 'grid-template-rows'
        ) {
          onLeft();
        }
      }}
    >
      <div className={cn(className)}>{children}</div>
    </div>
  );
}

// The box the entries sit in, with no gap of its own: each entry holds its
// gap below it, and the box gives back the last one's.
export function Entries({ children }: { children: React.ReactNode }) {
  return <div className="-mb-2 flex flex-col">{children}</div>;
}
