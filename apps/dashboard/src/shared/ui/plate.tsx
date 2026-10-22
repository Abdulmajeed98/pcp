import { cn } from 'cn';
import type * as React from 'react';

// A plate: a figure that matters, in amber Geist Mono on graphite, as a money
// changer's board shows the day's rate (the dashboard's DESIGN.md). Plate
// Amber is drawn here and nowhere else. The figure keeps its digits in
// columns, and is always written in Western digits by `formatNumber`.
//
// It is drawn at the Figure size, 18 pixels at weight 600, on 4-pixel
// corners with 10 pixels each side, sized to its figures; in the dark scheme
// a lit 1-pixel edge holds it apart from the Night Sheet. A muted plate, for
// a price that cannot be bought now, is Muted Plate with its figures in its
// grey and no edge; what it holds reads it as `group-data-[muted]/plate`. A
// screen's one leading plate arrives with the first screen that has one
// (redesign ticket 12).
function Plate({
  className,
  muted = false,
  ...props
}: React.ComponentProps<'span'> & { muted?: boolean }) {
  return (
    <span
      data-slot="plate"
      data-muted={muted ? '' : undefined}
      className={cn(
        'group/plate inline-flex items-center rounded-plate border px-[9px] py-0.5 font-mono text-lg font-semibold tabular-nums',
        muted
          ? 'border-transparent bg-plate-muted text-plate-muted-figure'
          : 'border-plate-edge bg-plate text-plate-figure',
        className,
      )}
      {...props}
    />
  );
}

export { Plate };
