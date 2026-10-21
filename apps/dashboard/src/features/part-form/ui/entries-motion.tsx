import { cn } from 'cn';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type * as React from 'react';

// How long an entry takes to fade, and then for its space to close, as the
// dashboard's DESIGN.md's Motion 8 says: 150 ms on `--ease-out`, then 200 ms
// on `--ease-in-out`.
const fading = 150;
const closing = 200;

function motionIsReduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// The entries of a list in the Part's form, a part number or a row of a list
// of rows, as they come and go (redesign ticket 08). An entry the Admin adds
// arrives as Motion 6 says, rising 6 pixels as it fades in; the entries the
// form opened with do not, so that the screen itself never fades in. An
// entry the Admin removes leaves as Motion 8 says: it fades, no longer takes
// a tap, and then its space closes, so the entries below rise into place
// rather than jump; with reduced motion it fades, and its space closes at
// once. It is taken out of the form's values when it has left.
export function useEntriesMotion<Field extends { id: string }>(
  fields: readonly Field[],
  remove: (index: number) => void,
) {
  const [initial] = useState<ReadonlySet<string>>(
    () => new Set(fields.map(({ id }) => id)),
  );
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set());
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());
  // The entries as they are now, for a removal that ends after they changed.
  const current = useRef(fields);
  useLayoutEffect(() => {
    current.current = fields;
  });
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function later(then: () => void, after: number): void {
    timers.current.push(window.setTimeout(then, after));
  }

  function without(set: ReadonlySet<string>, id: string): Set<string> {
    const rest = new Set(set);
    rest.delete(id);
    return rest;
  }

  // Starts the entry with this id on its way out.
  function leave(id: string): void {
    setLeaving((before) => new Set(before).add(id));
    const gone = () => {
      const index = current.current.findIndex((field) => field.id === id);
      if (index !== -1) remove(index);
      setLeaving((before) => without(before, id));
      setClosed((before) => without(before, id));
    };
    later(() => {
      if (motionIsReduced()) return gone();
      setClosed((before) => new Set(before).add(id));
      later(gone, closing);
    }, fading);
  }

  // The entries that stay, in order: those not on their way out.
  const staying = fields.filter(({ id }) => !leaving.has(id));

  return {
    leave,
    staying,
    isLeaving: (id: string) => leaving.has(id),
    entryProps: (id: string) => ({
      leaving: leaving.has(id),
      closed: closed.has(id),
      arriving: !initial.has(id),
    }),
  };
}

// An entry's two boxes: the outer one closes its space, the inner one fades.
export function Entry({
  leaving,
  closed,
  arriving,
  className,
  children,
}: {
  leaving: boolean;
  closed: boolean;
  arriving: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      inert={leaving}
      className={cn(
        'grid transition-[grid-template-rows,margin-bottom] duration-200 ease-in-out motion-reduce:transition-none',
        closed ? '-mb-2 grid-rows-[0fr]' : 'grid-rows-[1fr]',
      )}
    >
      <div
        className={cn(
          'min-h-0',
          leaving
            ? 'overflow-hidden opacity-0 transition-opacity duration-150 ease-out'
            : arriving && 'arrives',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
