import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { type ReactNode, useLayoutEffect, useRef } from 'react';

import { aFade, aFlap, motionIsReduced, useKeptWhileChanging } from '@/shared/lib';
import { Plate } from '@/shared/ui';

// The fewest tiles the board has, as a real board has four: every rate the
// API takes today, up to 5,000, fits them, and a rate of three digits leaves
// the first blank, so the board's width does not change between the two.
const fewestTiles = 4;

// A cell of the board, by its place counted from the end, where the figure's
// last digit is, so that a tile gained on the left leaves the others as they
// are: a tile with its digit, blank (' ') where the figure has none, and how
// many tiles are before it, which it waits for; or a comma, shown where the
// figure has one.
type Cell = { fromTheEnd: number } & (
  | { tile: string; tilesBefore: number }
  | { comma: boolean }
);

// The board's cells for a figure as `formatNumber` writes it, so that its
// grouping is written there alone: the figure laid from the right over the
// shape `formatNumber` gives a figure of as many digits, at least four, such
// as "1,000". The tiles follow the figure: a rate of more digits than four,
// which the API's limits do not allow today, gains a tile for each.
function cellsOf(written: string): Cell[] {
  const digits = written.replace(/\D/g, '').length;
  const shape = formatNumber(10 ** (Math.max(digits, fewestTiles) - 1));
  const unwritten = shape.length - written.length;
  let tilesBefore = 0;
  return [...shape].map((mark, at) => {
    const shown = written[at - unwritten];
    const fromTheEnd = shape.length - at;
    return /\d/.test(mark)
      ? { fromTheEnd, tile: shown ?? ' ', tilesBefore: tilesBefore++ }
      : { fromTheEnd, comma: shown !== undefined };
  });
}

// The Platform Rate on the changer's board, as the dashboard's DESIGN.md
// gives it (the owner's choice, 2 November 2026): "1 $ =", split-flap tiles,
// "IQD". The tiles and the comma between them are the figure as `formatNumber`
// writes it (`cellsOf`); under 1,000 the first tile is blank and the comma
// hidden, so the board's width does not change. The board is drawn left to
// right and hidden from a reader, who is read its words, "1 dollar is 1,575
// dinars". A new rate flips the tiles whose digit changes, left to right
// (Motion 10); with reduced motion they fade.
export function RateBoard({ iqdPerUsd }: { iqdPerUsd: number }) {
  const written = formatNumber(iqdPerUsd);
  const cells = cellsOf(written);

  return (
    <Plate
      lead
      data-testid="platform-rate-plate"
      className="max-w-full gap-2 px-2.5 py-2.5 lg:gap-4 lg:px-5 lg:py-4"
    >
      <span data-testid="platform-rate-words" className="sr-only">
        1 dollar is {written} dinars
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
          {cells.map((cell) =>
            'tile' in cell ? (
              <Tile key={cell.fromTheEnd} digit={cell.tile} index={cell.tilesBefore} />
            ) : (
              <span
                key={cell.fromTheEnd}
                data-testid="board-comma"
                data-blank={cell.comma ? undefined : ''}
                className={cn(
                  'w-[0.4em] self-end font-sans text-2xl transition-opacity duration-150 ease-out lg:text-[3.5rem]',
                  !cell.comma && 'opacity-0',
                )}
              >
                ,
              </span>
            ),
          )}
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

// One split-flap tile: the top and the bottom half of its digit, split by a
// dark line. When its digit changes, the old top half falls forward to its
// edge, uncovering the new top half behind it, and then the new bottom half
// comes down from its edge over the old one; the tile `index` places waits
// 40 ms for each tile before it. The halves' backs are hidden, so a leaf on
// its edge shows nothing, and the leaves are taken away only once the new
// bottom half has landed over a half that already shows the new digit, or
// after 3 seconds should it never land (`shared/lib/leaving.ts`).
function Tile({ digit = ' ', index }: { digit?: string; index: number }) {
  // A new digit starts a flip from the one shown: the flip under way is from
  // the digit shown before the newest change, which covers any before it.
  const { shown: kept, leaving, left } = useKeptWhileChanging(digit, digit);
  const shown = kept.value;
  const flip = leaving.at(-1);
  const reduced = motionIsReduced();
  const falling = useRef<HTMLSpanElement>(null);
  const landing = useRef<HTMLSpanElement>(null);
  const fading = useRef<HTMLSpanElement>(null);
  const halves = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (flip === undefined) return;
    const done = () => left(flip.id);
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
  }, [flip, index, left]);

  const flipping = flip !== undefined && !reduced;

  return (
    <span
      data-testid="board-tile"
      data-digit={shown.trim()}
      className="relative block h-14 w-9 font-mono text-[2.625rem] font-semibold perspective-[25rem] lg:h-[8.75rem] lg:w-[5.875rem] lg:text-[7rem]"
    >
      <span ref={halves} className="absolute inset-0">
        <Half side="top">{shown}</Half>
        <Half side="bottom">{flipping ? flip.value : shown}</Half>
      </span>
      {flipping && (
        <>
          <Half side="top" ref={falling} leaf>
            {flip.value}
          </Half>
          <Half side="bottom" ref={landing} leaf>
            {shown}
          </Half>
        </>
      )}
      {flip !== undefined && reduced && (
        <span ref={fading} data-testid="board-tile-fading" className="absolute inset-0">
          <Half side="top">{flip.value}</Half>
          <Half side="bottom">{flip.value}</Half>
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
