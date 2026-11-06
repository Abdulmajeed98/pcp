'use client';

import { cn } from 'cn';
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';

// What a printed piece below the first screen is doing (DESIGN.md's When a
// movement plays): held back, waiting to be reached, or printing as it comes
// into view. With no state it is shown printed, which is how the server
// sends it and how it stays without script.
type PrintState = 'waiting' | 'printing';

// A printed piece below the first screen, which prints as it comes into view
// (Motion 1, and the slip's feed, Motion 4): the page's script, which is this
// component, holds it back as the page opens, and prints it when its top is
// about nine tenths of the way down the window, once. No piece is hidden by
// the stylesheet alone, so a page whose script is late or blocked shows it
// printed. A piece already within reach when the script runs, as on a page
// the Shopper scrolled before it did, is left printed; so is every piece on a
// page come back to by back or forward (`data-returned`, which the document
// marks before it draws) and under reduced motion. The theme's
// `print-in-view` draws each state; keyboard focus inside a piece shows it
// printed at once.
//
// The piece lies in a frame of its own, which the page's script watches:
// Chrome measures a piece clipped shut as empty, so the frame is what comes
// into view. `beside` is what lies in the frame beside the piece, such as a
// sheet's printer's marks.
export function PrintInView({
  className,
  frameClassName,
  testId,
  beside,
  children,
}: {
  className?: string;
  frameClassName?: string;
  testId?: string;
  beside?: ReactNode;
  children: ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PrintState>();

  // Before the browser paints what the script drew, so that a piece out of
  // sight is held back before anyone could see it.
  useLayoutEffect(() => {
    const watched = frame.current;
    if (watched === null) return;
    if (document.documentElement.hasAttribute('data-returned')) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (watched.getBoundingClientRect().top < innerHeight * 0.9) return;

    setState('waiting');
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setState('printing');
        observer.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(watched);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frame} className={frameClassName}>
      {beside}
      <div
        data-testid={testId}
        data-print={state}
        className={cn('print-in-view', className)}
      >
        {children}
      </div>
    </div>
  );
}
