import { cn } from 'cn';
import { type ReactNode, useLayoutEffect, useRef } from 'react';

import { aFade, aMovement, useKeptWhileChanging } from '@/shared/lib';

// Something whose content changes in place, under the No Snap Rule (the
// dashboard's DESIGN.md, Motion 10, built for the Platform Rate's leading
// plate in the pricing module's ticket 02): when `changeKey` changes, the
// old content fades out, 150 ms, laid over the new at its start, while the
// new fades in, 200 ms, so that nothing vanishes or appears in one frame;
// and its own size along `axis`, its width or its height, follows from the
// old content's to the new over 200 ms on the in-out curve (150 ms on the
// out curve with reduced motion), so that what is after it or below it
// moves with it rather than jumps. Nothing slides, counts or flashes.
//
// The size is set by the content, which a CSS transition cannot follow, so
// it moves with the Web Animations API, through `shared/lib/motion.ts`. A
// change while one is under way takes the size from where it is. While the
// size moves, what it holds is clipped to it. The old content is hidden
// from a reader and takes no tap, and is taken out once it has faded, or
// after 3 seconds should its fade never finish (`shared/lib/leaving.ts`).
//
// The content for a key is taken as it was first shown for that key: the
// key is what it shows, such as a figure, or which state it is in.
export function ChangingInPlace({
  changeKey,
  axis,
  inline = false,
  className,
  children,
  ...props
}: {
  changeKey: string;
  axis: 'width' | 'height';
  // A span inside a line, such as a figure on a plate, or a block.
  inline?: boolean;
  className?: string;
  children: ReactNode;
  'data-testid'?: string;
}) {
  // A new key: what was shown starts to leave.
  const { shown, leaving, left } = useKeptWhileChanging(changeKey, children);

  const holder = useRef<HTMLElement | null>(null);
  const shownElement = useRef<HTMLElement | null>(null);
  const size = useRef<number | null>(null);
  const moving = useRef<Animation | null>(null);
  const firstKey = useRef(changeKey);

  // The size as it is drawn, followed frame by frame while it moves and as
  // the window's width changes it, so that the next change starts from what
  // is drawn, also while a change is under way.
  useLayoutEffect(() => {
    const element = holder.current;
    if (element === null) return;
    const watching = new ResizeObserver(() => {
      size.current = element.getBoundingClientRect()[axis];
    });
    watching.observe(element);
    return () => watching.disconnect();
  }, [axis]);

  useLayoutEffect(() => {
    const element = holder.current;
    if (element === null) return;
    const measured = () => element.getBoundingClientRect()[axis];
    // Shown first, or not changed: nothing moves, and the size is noted.
    if (shown.key === firstKey.current && size.current === null) {
      size.current = measured();
      return;
    }
    const from = size.current;
    moving.current?.cancel();
    moving.current = null;
    const to = measured();
    size.current = to;
    shownElement.current?.animate([{ opacity: 0 }, { opacity: 1 }], aFade('in'));
    if (from === null || Math.abs(from - to) < 0.5) return;
    const movement = element.animate(
      [
        { [axis]: `${from}px`, clipPath: 'inset(0)' },
        { [axis]: `${to}px`, clipPath: 'inset(0)' },
      ],
      aMovement('ease-in-out'),
    );
    moving.current = movement;
    movement.onfinish = () => {
      if (moving.current === movement) moving.current = null;
    };
    movement.oncancel = movement.onfinish;
  }, [shown.key, axis]);

  const Holder = inline ? 'span' : 'div';
  const Layer = inline ? 'span' : 'div';

  return (
    <Holder
      ref={(element: HTMLElement | null) => {
        holder.current = element;
      }}
      data-slot="changing-in-place"
      className={cn('relative', inline ? 'inline-grid' : 'grid', className)}
      {...props}
    >
      <Layer
        key={shown.key}
        ref={(element: HTMLElement | null) => {
          shownElement.current = element;
        }}
        data-shown=""
        className={cn(inline && 'whitespace-nowrap')}
      >
        {children}
      </Layer>
      {leaving.map((each) => (
        <FadingOut key={each.id} inline={inline} onFaded={() => left(each.id)}>
          {each.value}
        </FadingOut>
      ))}
    </Holder>
  );
}

// The old content, laid over the new at its start, fading out once.
function FadingOut({
  inline,
  onFaded,
  children,
}: {
  inline: boolean;
  onFaded: () => void;
  children: ReactNode;
}) {
  const element = useRef<HTMLElement | null>(null);
  const faded = useRef(onFaded);
  useLayoutEffect(() => {
    faded.current = onFaded;
  });

  useLayoutEffect(() => {
    const fading = element.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      ...aFade('out'),
      fill: 'forwards',
    });
    if (fading === undefined) return;
    fading.onfinish = () => faded.current();
    return () => fading.cancel();
  }, []);

  const Layer = inline ? 'span' : 'div';
  return (
    <Layer
      ref={(each: HTMLElement | null) => {
        element.current = each;
      }}
      data-leaving=""
      aria-hidden="true"
      inert
      className={cn(
        'pointer-events-none absolute start-0 top-0',
        inline ? 'whitespace-nowrap' : 'inset-x-0',
      )}
    >
      {children}
    </Layer>
  );
}
