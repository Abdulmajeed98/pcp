import { cn } from 'cn';
import type * as React from 'react';

// A plate: a figure that matters, in amber Geist Mono on graphite, as a money
// changer's board shows the day's rate (the dashboard's DESIGN.md). Plate
// Amber is drawn here and nowhere else. The figure keeps its digits in
// columns, and is always written in Western digits by `formatNumber`.
//
// A screen has at most one large plate.
function Plate({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'span'> & { size?: 'default' | 'large' }) {
  return (
    <span
      data-slot="plate"
      className={cn(
        'inline-flex items-center rounded-sm bg-plate px-2 font-mono font-bold text-plate-figure tabular-nums',
        size === 'large' ? 'py-1 text-3xl' : 'py-0.5 text-xl',
        className,
      )}
      {...props}
    />
  );
}

export { Plate };
