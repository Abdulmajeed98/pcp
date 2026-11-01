import { cn } from 'cn';
import { useLayoutEffect, useRef } from 'react';
import type * as React from 'react';

import { useKeptUntilClosed } from '@/shared/lib';

// A space in a form that opens smoothly when something is put in it, such as
// a field's refusal or a form's refusal panel, and closes smoothly when it is
// taken away, under the dashboard's No Snap Rule (redesign ticket 08). It is
// always there: closed, it takes no room, and it gives back the gap its
// parent puts beside it, which it measures, so that putting something in
// moves nothing in one frame. What it shows stays in it while it closes, and
// leaves it once its space has closed, whatever the transition's speed, or
// at the latest after the shared mechanism's wait (`shared/lib/leaving.ts`).
// It is the theme's `leaves`, closed while it is marked as leaving, opening
// at once as a form's spaces do (or in step, `inStep`), and what it shows is
// always clipped to it.
//
// Used by `FieldError`, so every form's refusals beside its fields take it,
// and around a form's refusal panel by the form, as the Part's form does:
// `<OpeningSpace>{refusal && <Alert … />}</OpeningSpace>`. Tickets 09, 12 and
// 13 use the same components.
function OpeningSpace({
  children,
  className,
  inStep = false,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  children?: React.ReactNode;
  // Whether it opens as a row arrives in a list, its space first and then
  // its fade, as a Vendor's reset arrives; a form's spaces open at once.
  inStep?: boolean;
}) {
  const space = useRef<HTMLDivElement>(null);
  const shown = Boolean(children);
  // What the space showed last, kept while it closes.
  const { kept, onTransitionEnd } = useKeptUntilClosed<React.ReactNode>(
    shown ? children : null,
  );

  // The one gap the parent adds for the space while it takes no room, the
  // one before it, or after it when it comes first, given back while it is
  // closed.
  useLayoutEffect(() => {
    const element = space.current;
    const parent = element?.parentElement;
    if (!element || !parent) return;
    const gap = Number.parseFloat(getComputedStyle(parent).rowGap) || 0;
    const before = element.previousElementSibling !== null;
    const after = !before && element.nextElementSibling !== null;
    // Set before the first paint, with no transition, so that the form
    // itself never moves as it is drawn.
    element.style.transition = 'none';
    element.style.setProperty('--gap-before', before ? `${gap}px` : '0px');
    element.style.setProperty('--gap-after', after ? `${gap}px` : '0px');
    void element.offsetHeight;
    element.style.transition = '';
  }, []);

  return (
    <div
      ref={space}
      data-slot="opening-space"
      data-leaving={shown ? undefined : ''}
      data-opens-at-once={inStep ? undefined : ''}
      aria-hidden={shown ? undefined : true}
      className={cn('leaves', className)}
      onTransitionEnd={onTransitionEnd}
      {...props}
    >
      <div className="overflow-clip [overflow-clip-margin:0.25rem]">
        {shown ? children : kept}
      </div>
    </div>
  );
}

export { OpeningSpace };
