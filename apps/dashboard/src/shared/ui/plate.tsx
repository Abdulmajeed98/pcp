import { cn } from 'cn';
import type * as React from 'react';

// A plate: a figure that matters, in amber Geist Mono on graphite, as a money
// changer's board shows the day's rate (the dashboard's DESIGN.md). Plate
// Amber is drawn here and nowhere else. The figure keeps its digits in
// columns, and is always written in Western digits by `formatNumber`.
//
// It is drawn at the Figure size, 18 pixels at weight 600, on 4-pixel
// corners with 10 pixels each side, sized to its figures; in the dark scheme
// a lit 1-pixel edge holds it apart from the Night Sheet. A screen's one
// leading plate, and a figure's quiet unit, arrive with the first screens
// that have them (redesign tickets 11 and 12).
function Plate({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="plate"
      className={cn(
        'inline-flex items-center rounded-plate border border-plate-edge bg-plate px-[9px] py-0.5 font-mono text-lg font-semibold text-plate-figure tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

export { Plate };
