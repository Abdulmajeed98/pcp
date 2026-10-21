import { type ReactNode, useEffect, useState } from 'react';

// Something a screen shows while there is something to show, which leaves as
// DESIGN.md's Motion says (8) once there is not, such as the expiry banner
// once nothing needs confirming: first it fades, in 150 ms, then its space
// closes, in 200 ms, so that what is below rises into place rather than
// jumps. It shows the last value it was given while it leaves, takes no tap,
// and is taken out only once its space has closed (the No Snap Rule). Given a
// value again while it leaves, it comes back from where it is.
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
  const [kept, setKept] = useState<Value | null>(value);
  if (value !== null && value !== kept) setKept(value);

  const leaving = kept !== null && value === null;

  // Should its space never be told closed (a transition that does not run),
  // it is taken out after this long, longer than its leaving slowed fourfold.
  useEffect(() => {
    if (!leaving) return;
    const late = setTimeout(() => setKept(null), 3000);
    return () => clearTimeout(late);
  }, [leaving]);

  if (kept === null) return null;

  return (
    <div
      className="leaves"
      data-leaving={leaving ? '' : undefined}
      inert={leaving}
      onTransitionEnd={(event) => {
        if (
          leaving &&
          event.target === event.currentTarget &&
          event.propertyName === 'grid-template-rows'
        ) {
          setKept(null);
        }
      }}
    >
      <div>{children(kept)}</div>
    </div>
  );
}

export { Leaving };
