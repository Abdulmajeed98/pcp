import { cn } from 'cn';
import type { CSSProperties, ReactNode } from 'react';

// An item of a printed sheet (DESIGN.md's The printed sheet): a line, with
// what it names at the start, in Body large, a dotted leader in Half Ink that
// runs to the end, what it is worth at the end, at weight 600 in tabular
// figures, and under them, across the line, its second line in Body Soft Ink.
// An item that starts with an icon gives it as `icon`; one with nothing at
// its end has no leader. A name wraps in full and is never cut, and on a
// phone the leader shrinks to 0.75rem at the least, the end staying on the
// end side.
//
// The end settles into its column as the sheet prints (Motion 2): `place` is
// the item's place on its sheet, from 0, which staggers it.
export function Item({
  icon,
  name,
  end,
  second,
  place = 0,
  className,
  testId,
}: {
  icon?: ReactNode;
  name: ReactNode;
  end?: ReactNode;
  second?: ReactNode;
  place?: number;
  className?: string;
  testId?: string;
}) {
  return (
    <li
      data-testid={testId}
      className={cn(
        'grid items-baseline gap-x-2 text-lg',
        icon === undefined
          ? 'grid-cols-[minmax(0,max-content)_minmax(0.75rem,1fr)_auto] md:grid-cols-[minmax(0,max-content)_minmax(1.5rem,1fr)_auto]'
          : 'grid-cols-[auto_minmax(0,max-content)_minmax(0.75rem,1fr)_auto] md:grid-cols-[auto_minmax(0,max-content)_minmax(1.5rem,1fr)_auto]',
        className,
      )}
    >
      {icon !== undefined && <span className="flex self-center">{icon}</span>}
      <span className={cn('min-w-0 wrap-break-word', end === undefined && 'col-span-3')}>
        {name}
      </span>
      {end !== undefined && (
        <>
          <span aria-hidden="true" className="leader" />
          <span
            data-testid="item-end"
            className="settles figures text-end font-semibold"
            style={{ '--i': place } as CSSProperties}
          >
            {end}
          </span>
        </>
      )}
      {second !== undefined && (
        <span
          data-testid="item-second"
          className="col-span-full text-base text-muted-foreground"
        >
          {second}
        </span>
      )}
    </li>
  );
}
