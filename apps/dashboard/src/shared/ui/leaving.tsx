import { type ReactNode, useState } from 'react';

// Something a screen shows while there is something to show, which leaves as
// DESIGN.md's Motion says (8) once there is not, such as the expiry banner
// once nothing needs confirming: first it fades, in 150 ms, then its space
// closes, in 200 ms, so that what is below rises into place rather than
// jumps. It shows the last value it was given while it leaves, takes no tap,
// and is gone once its space has closed. Given a value again while it
// leaves, it comes back from where it is.
//
// It is the theme's `leaves`, whose `--leaves-gap` is the gap the screen
// puts below it, which closes with its space.
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

  if (kept === null) return null;
  const leaving = value === null;

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
