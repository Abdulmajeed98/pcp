import { cn } from 'cn';
import type { ReactNode } from 'react';

import { TableCell } from './table';

// A cell of a list's table from 64rem (the dashboard's DESIGN.md, Rows and
// tables), whose content starts at the row's top, so that a row whose first
// cell takes two lines keeps the others level with its first line. It holds
// the cell's padding inside the theme's `leaves`, so that a leaving row's
// space closes whole. A figure is end aligned, in tabular figures, its cell
// with it. Missing specifications and the Referrals draw their cells so.
export function RowCell({
  figure = false,
  className,
  children,
}: {
  figure?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <TableCell className={cn('h-auto p-0 align-top', figure && 'text-end', className)}>
      <div className="leaves">
        <div>
          <div className={cn('px-2 py-3.5', figure && 'text-end tabular-nums')}>
            {children}
          </div>
        </div>
      </div>
    </TableCell>
  );
}
