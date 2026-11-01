import type { ReactNode } from 'react';

import { movingProps, useKeptUntilClosed } from '@/shared/lib';

// Something a screen shows while there is something to show, which leaves as
// DESIGN.md's Motion says (8) once there is not, such as the expiry banner
// once nothing needs confirming: first it fades, in 150 ms, then its space
// closes, in 200 ms, so that what is below rises into place rather than
// jumps. It shows the last value it was given while it leaves, takes no tap,
// and is taken out only once its space has closed (the No Snap Rule), or at
// the latest after the shared mechanism's wait (`shared/lib/leaving.ts`).
// Given a value again while it leaves, it comes back from where it is.
//
// It is the theme's `leaves`. What it holds holds the gap the screen keeps
// above it, so that the gap closes with it.
function Leaving<Value>({
  value,
  children,
}: {
  // What it shows, or null once there is nothing to show.
  value: Value | null;
  children: (value: Value) => ReactNode;
}) {
  const { kept, ...moving } = useKeptUntilClosed(value);

  if (kept === null) return null;

  return (
    <div className="leaves" {...movingProps(moving)}>
      <div>{children(kept)}</div>
    </div>
  );
}

export { Leaving };
