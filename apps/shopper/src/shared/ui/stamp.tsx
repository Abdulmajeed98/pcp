import { cn } from 'cn';
import type { ReactNode } from 'react';

// The stamp (DESIGN.md's The stamp): words in Print Green in the Label type,
// inside a 3-pixel double frame of the green, on the paper at 70%, turned 5
// degrees back from true, in the end corner of its paper and kept inside it.
// It lands once its paper has printed (Motion 3). It is decoration, hidden
// from readers, since the words it stamps are also printed beside it. Its
// place on its paper is the piece's to give.
export function Stamp({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="stamp"
      className={cn(
        'stamp-lands type-label pointer-events-none absolute z-[1] inline-block border-[3px] border-double border-primary bg-[color-mix(in_srgb,var(--card)_70%,transparent)] px-3.5 py-1.5 text-primary',
        className,
      )}
    >
      {children}
    </span>
  );
}
