import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';

import { aFade, aFlap, motionIsReduced } from '@/shared/lib';
import { Plate } from '@/shared/ui';

// The Platform Rate on the changer's board, as the dashboard's DESIGN.md
// gives it (the owner's choice, 2 November 2026): "1 $ =", four split-flap
// tiles, "IQD". The tiles are a fixed four, as a real board has, the comma
// between the first and the second; under 1,000 the first tile is blank and
// the comma hidden, so the board's width never changes. The board is drawn
// left to right and hidden from a reader, who is read its words, "1 dollar
// is 1,575 dinars". A new rate flips the tiles whose digit changes, left to
// right (Motion 10); with reduced motion they fade.
export function RateBoard({ iqdPerUsd }: { iqdPerUsd: number }) {
  const digits = String(iqdPerUsd).padStart(4, ' ').slice(-4).split('');

  return (
    <Plate
      lead
      data-testid="platform-rate-plate"
      className="max-w-full gap-2 px-2.5 py-2.5 lg:gap-4 lg:px-5 lg:py-4"
    >
      <span data-testid="platform-rate-words" className="sr-only">
        1 dollar is {formatNumber(iqdPerUsd)} dinars
      </span>
      <AlwaysEnglish
        data-testid="platform-rate-drawn"
        aria-hidden="true"
        className="flex items-center gap-2 lg:gap-4"
      >
        <span className="flex items-baseline gap-1.5 text-2xl lg:gap-2.5 lg:text-3xl">
          1 <Unit>$</Unit> <Unit>=</Unit>
        </span>
        <span className="flex items-end gap-[3px]">
          <Tile digit={digits[0]} index={0} />
          <span
            className={cn(
              'w-[0.4em] self-end font-sans text-2xl transition-opacity duration-150 ease-out lg:text-[3.5rem]',
              iqdPerUsd < 1000 && 'opacity-0',
            )}
          >
            ,
          </span>
          <Tile digit={digits[1]} index={1} />
          <Tile digit={digits[2]} index={2} />
          <Tile digit={digits[3]} index={3} />
        </span>
        <Unit>IQD</Unit>
      </AlwaysEnglish>
    </Plate>
  );
}

// A unit after a figure, or the equals sign: smaller, in Geist and in Plate
// Unit.
function Unit({ children }: { children: string }) {
  return (
    <span className="font-sans text-sm font-medium text-plate-unit lg:text-base">
      {children}
    </span>
  );
}

// A change of a tile's digit, while its flap turns or, with reduced motion,
// while the old digit fades.
interface Flip {
  from: string;
  to: string;
  id: number;
}

// One split-flap tile: the top and the bottom half of its digit, split by a
// dark line. When its digit changes, the old top half falls forward to its
// edge, uncovering the new top half behind it, and then the new bottom half
// comes down from its edge over the old one; the tile `index` places waits
// 40 ms for each tile before it. The halves' backs are hidden, so a leaf on
// its edge shows nothing, and the leaves are taken away only once the new
// bottom half has landed over a half that already shows the new digit.
function Tile({ digit = ' ', index }: { digit?: string; index: number }) {
  const [shown, setShown] = useState(digit);
  const [flip, setFlip] = useState<Flip | null>(null);
  const [flips, setFlips] = useState(0);
  // A new digit, seen while rendering, starts a flip from the one shown.
  if (digit !== shown) {
    setFlip({ from: shown, to: digit, id: flips });
    setFlips(flips + 1);
    setShown(digit);
  }
  const reduced = motionIsReduced();
  const falling = useRef<HTMLSpanElement>(null);
  const landing = useRef<HTMLSpanElement>(null);
  const fading = useRef<HTMLSpanElement>(null);
  const halves = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (flip === null) return;
    const done = () => setFlip((now) => (now?.id === flip.id ? null : now));
    if (fading.current) {
      // Reduced motion: the old digit fades out over the new, which fades in.
      const out = fading.current.animate([{ opacity: 1 }, { opacity: 0 }], {
        ...aFade('out'),
        fill: 'forwards',
      });
      halves.current?.animate([{ opacity: 0 }, { opacity: 1 }], aFade('in'));
      out.onfinish = done;
      return () => out.cancel();
    }
    const { duration, easing, stagger } = aFlap();
    const delay = index * stagger;
    const top = falling.current?.animate(
      [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }],
      { duration, easing, delay, fill: 'both' },
    );
    const bottom = landing.current?.animate(
      [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }],
      { duration, easing, delay: delay + duration, fill: 'both' },
    );
    if (bottom) bottom.onfinish = done;
    return () => {
      top?.cancel();
      bottom?.cancel();
    };
  }, [flip, index]);

  const flipping = flip !== null && !reduced;

  return (
    <span
      data-testid="board-tile"
      data-digit={shown.trim()}
      className="relative block h-14 w-9 font-mono text-[2.625rem] font-semibold perspective-[25rem] lg:h-[8.75rem] lg:w-[5.875rem] lg:text-[7rem]"
    >
      <span ref={halves} className="absolute inset-0">
        <Half side="top">{shown}</Half>
        <Half side="bottom">{flipping ? flip.from : shown}</Half>
      </span>
      {flipping && (
        <>
          <Half side="top" ref={falling} leaf>
            {flip.from}
          </Half>
          <Half side="bottom" ref={landing} leaf>
            {flip.to}
          </Half>
        </>
      )}
      {flip !== null && reduced && (
        <span ref={fading} data-testid="board-tile-fading" className="absolute inset-0">
          <Half side="top">{flip.from}</Half>
          <Half side="bottom">{flip.from}</Half>
        </span>
      )}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 z-10 h-0.5 -translate-y-1/2 bg-plate-split"
      />
    </span>
  );
}

// One half of a tile, showing that half of its digit: the digit is laid on
// the tile's whole height and the half cuts it. A leaf turns on the split.
function Half({
  side,
  leaf = false,
  ref,
  children,
}: {
  side: 'top' | 'bottom';
  leaf?: boolean;
  ref?: React.Ref<HTMLSpanElement>;
  children: ReactNode;
}) {
  return (
    <span
      ref={ref}
      data-leaf={leaf ? side : undefined}
      className={cn(
        'absolute inset-x-0 h-1/2 overflow-hidden bg-plate-tile backface-hidden',
        side === 'top'
          ? 'top-0 origin-bottom rounded-t-[4px]'
          : 'bottom-0 origin-top rounded-b-[4px]',
      )}
    >
      <span
        className={cn(
          'absolute inset-x-0 flex h-[200%] items-center justify-center',
          side === 'top' ? 'top-0' : 'bottom-0',
        )}
      >
        {children}
      </span>
    </span>
  );
}
