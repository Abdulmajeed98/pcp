import { cn } from 'cn';
import type { CSSProperties, ReactNode } from 'react';

// Where a long name stands: on its own line, its leader and what it is worth
// on the line under it, on a phone (below 48rem) or at every width.
export type NameAlone = 'on-a-phone' | 'always';

// An item of a printed sheet (DESIGN.md's The printed sheet): a line, with
// what it names at the start, in Body large, a dotted leader in Half Ink that
// runs to the end, what it is worth at the end, at weight 600 in tabular
// figures, and under them, across the line, its second line in Body Soft Ink.
// An item that starts with an icon gives it as `icon`, on the line; one that
// starts with a picture gives it as `picture`, a square beside its lines, as
// a Part on a Category page has its photo or its Category's icon (DESIGN.md's
// A Part on a Category page). One with nothing at its end has no leader. A
// name wraps in full and is never cut, and on a phone the leader shrinks to
// 0.75rem at the least, the end staying on the end side.
//
// A name too long to wrap beside what it is worth in a few lines takes the
// whole line, as a printed menu sets a long dish, and its leader runs to the
// end on the line under it (`nameAlone`): on a phone, or at every width.
//
// An item with a picture on a list too narrow for its text, a phone's at 320
// pixels or one with its text made larger, stacks: its picture and its name,
// then its leader and what it is worth, then its second line, by the theme's
// `data-item` rule, which measures the list in its own text's size.
//
// The end settles into its column as the sheet prints (Motion 2): `place` is
// the item's place on its sheet, from 0, which staggers it.
export function Item({
  icon,
  picture,
  name,
  end,
  second,
  nameAlone,
  place = 0,
  className,
  testId,
  data,
}: {
  icon?: ReactNode;
  picture?: ReactNode;
  name: ReactNode;
  end?: ReactNode;
  second?: ReactNode;
  nameAlone?: NameAlone;
  place?: number;
  className?: string;
  testId?: string;
  // What a test may read of the item, as `data-*` attributes.
  data?: Record<`data-${string}`, string>;
}) {
  const first = icon ?? picture;
  // A long name spans the name's, the leader's and the end's columns, and
  // the leader and the end take the line under it, the leader spanning the
  // name's column and its own; from 48rem, one long only on a phone goes
  // back to its place on the line.
  const alone = end === undefined ? undefined : nameAlone;
  const nameSpans = {
    'on-a-phone': 'col-span-3 md:col-span-1',
    always: 'col-span-3',
  };
  const leaderSpans = {
    'on-a-phone': 'col-span-2 col-start-2 md:col-span-1 md:col-start-auto',
    always: 'col-span-2 col-start-2',
  };

  return (
    <li
      data-testid={testId}
      data-item={picture === undefined ? undefined : 'with-picture'}
      data-name-alone={alone}
      {...data}
      className={cn(
        'grid items-baseline gap-x-2 text-lg',
        first === undefined
          ? 'grid-cols-[minmax(0,max-content)_minmax(0.75rem,1fr)_auto] md:grid-cols-[minmax(0,max-content)_minmax(1.5rem,1fr)_auto]'
          : 'grid-cols-[auto_minmax(0,max-content)_minmax(0.75rem,1fr)_auto] md:grid-cols-[auto_minmax(0,max-content)_minmax(1.5rem,1fr)_auto]',
        className,
      )}
    >
      {icon !== undefined && <span className="flex self-center">{icon}</span>}
      {picture !== undefined && (
        <span
          data-item-picture=""
          className={cn(
            'me-1.5 flex self-start',
            alone === undefined ? 'row-span-2' : 'row-span-3',
            alone === 'on-a-phone' && 'md:row-span-2',
          )}
        >
          {picture}
        </span>
      )}
      <span
        data-item-name=""
        className={cn(
          'min-w-0 wrap-break-word',
          end === undefined && 'col-span-3',
          alone !== undefined && nameSpans[alone],
        )}
      >
        {name}
      </span>
      {end !== undefined && (
        <>
          <span
            aria-hidden="true"
            data-item-leader=""
            className={cn('leader', alone !== undefined && leaderSpans[alone])}
          />
          <span
            data-testid="item-end"
            data-item-end=""
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
          data-item-second=""
          className={cn(
            'text-base text-muted-foreground',
            picture === undefined ? 'col-span-full' : 'col-span-3',
          )}
        >
          {second}
        </span>
      )}
    </li>
  );
}
