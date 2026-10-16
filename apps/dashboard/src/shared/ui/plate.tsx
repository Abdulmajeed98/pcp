import { cn } from 'cn';
import type * as React from 'react';

// A plate: a figure that matters, in amber Geist Mono on graphite, as a money
// changer's board shows the day's rate (the dashboard's DESIGN.md). Plate
// Amber is drawn here and nowhere else. The figure keeps its digits in
// columns, and is always written in Western digits by `formatNumber`.
//
// A screen has one plate at most.
function Plate({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="plate"
      className={cn(
        'inline-flex items-center rounded-sm bg-plate px-2 py-0.5 font-mono text-xl font-bold text-plate-figure tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

export { Plate };
