import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { type ReactNode, useLayoutEffect, useRef } from 'react';

import { aFade, aFlap, motionIsReduced, useKeptWhileChanging } from '@/shared/lib';
import { Plate } from '@/shared/ui';

// The board's size, from the room its field has (the field is a CSS size
// container, so `cqi` is a hundredth of its width inside its padding), never
// from the window's: the field beside the form at a desk can be as narrow as
// a phone's, and wider than a phone's below 64rem.
//
// The board has two drawings, as the dashboard's DESIGN.md gives them: a
// phone's, its tiles 2.25 by 3.5rem, and a desk's, its tiles 5.875 by 8.75rem
// with the Board figure. In a field with room for the desk's, the board is
// the desk's; in a field with room for less, every size on it, the tiles, the
// type, the gaps and the plate's padding, lies between the two in proportion
// to the room there is, so that the board is as wide as its field; with room
// for less than the phone's, its tiles are narrower still, and only the
// tiles; and where four tiles that narrow would not do (the browser's text at
// 200% on a narrow phone), the "1 $ =" and the "IQD" go to lines of their
// own. Everything drawn is in rem, so that it follows the browser's text
// size, but the plate's 1-pixel edge and the 3 pixels between tiles.
//
// The two drawings' widths, in rem, with the dashboard's own fonts (measured
// in the browser: the "1 $ =" and the "IQD" are as wide as their type makes
// them), and the 14 pixels of the edge and the gaps, which neither changes.
const phoneDrawing = 16.0456;
const deskDrawing = 34.6848;
const unchanging = '14px';
// What the board leaves of its field, for a font that draws a hair wider.
const spare = '0.25rem';
const span = deskDrawing - phoneDrawing;

// The room beyond the phone's drawing, from none to the desk's, and how much
// narrower than the phone's the field is (negative), or nothing.
const beyond = `100cqi - ${phoneDrawing}rem - ${unchanging} - ${spare}`;
const room = `clamp(0rem, ${beyond}, ${span.toFixed(4)}rem)`;
const short = `min(0rem, ${beyond})`;

// A size that is `phone` rem on a phone's drawing and `desk` rem on a
// desk's, and in proportion between them.
function between(phone: number, desk: number): string {
  return `calc(${phone}rem + var(--board-room) * ${((desk - phone) / span).toFixed(6)})`;
}

// A size of a tile that is `phone` rem on a tile 2.25rem wide and `desk` rem
// on one 5.875rem wide, and follows the tile's width on a line through both.
function alongTheTile(phone: number, desk: number): string {
  const slope = (desk - phone) / (5.875 - 2.25);
  const offset = phone - 2.25 * slope;
  return `calc(var(--board-tile) * ${slope.toFixed(6)} ${offset < 0 ? '-' : '+'} ${Math.abs(offset).toFixed(6)}rem)`;
}

// The tile's width: between the two drawings', less a quarter of what the
// field lacks for the phone's; and at least 1.75rem, or as wide as four
// tiles with their comma can be on a line of their own, if that is less.
const tile = `max(min(1.75rem, (100cqi - 2px - 1.25rem - 12px - 0.6rem - ${spare}) / 4), calc(${between(2.25, 5.875)} + var(--board-short) / 4))`;

// The sizes, set on the plate as custom properties, which the pieces drawn
// on it take.
const boardSize = {
  '--board-room': room,
  '--board-short': short,
  '--board-tile': tile,
  '--board-tile-height': alongTheTile(3.5, 8.75),
  '--board-digit': alongTheTile(2.625, 7),
  '--board-padding-x': between(0.625, 1.25),
  '--board-padding-y': between(0.625, 1),
  '--board-gap': between(0.5, 1),
  '--board-one': between(1.5, 1.875),
  '--board-one-leading': between(2, 2.25),
  '--board-one-gap': between(0.375, 0.625),
  '--board-unit': between(0.875, 1),
  '--board-unit-leading': between(1.25, 1.5),
  '--board-comma': between(1.5, 3.5),
} as React.CSSProperties;

// The board's place while the rate is read: as wide and as high as the
// board will be in the room its field has.
const sketchSize = {
  '--board-room': room,
  '--board-short': short,
  width: `calc(${phoneDrawing}rem + ${unchanging} + var(--board-room) + var(--board-short))`,
  height: `calc(${between(4.75, 10.75)} + 2px)`,
} as React.CSSProperties;

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
// (Motion 10); with reduced motion they fade. It is as large as the room its
// field has (`boardSize`).
export function RateBoard({ iqdPerUsd }: { iqdPerUsd: number }) {
  const written = formatNumber(iqdPerUsd);
  const cells = cellsOf(written);

  return (
    <Plate
      lead
      data-testid="platform-rate-plate"
      className="max-w-full px-(--board-padding-x) py-(--board-padding-y)"
      style={boardSize}
    >
      <span data-testid="platform-rate-words" className="sr-only">
        1 dollar is {written} dinars
      </span>
      <AlwaysEnglish
        data-testid="platform-rate-drawn"
        aria-hidden="true"
        className="flex flex-wrap items-center justify-center gap-(--board-gap)"
      >
        <span className="flex items-baseline gap-(--board-one-gap) text-(length:--board-one) leading-(--board-one-leading)">
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
                  'w-[0.4em] self-end font-sans text-(length:--board-comma) leading-[1.3333] transition-opacity duration-150 ease-out',
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

// While the rate is read: the board's place, as large as the board will be,
// sketched a step darker than its field, still, as the dashboard's loading
// sketches are.
export function RateBoardSketch() {
  return (
    <span
      aria-hidden="true"
      data-testid="platform-rate-sketch"
      className="block max-w-full rounded-plate-lead bg-accent"
      style={sketchSize}
    />
  );
}

// A unit after a figure, or the equals sign: smaller, in Geist and in Plate
// Unit.
function Unit({ children }: { children: string }) {
  return (
    <span className="font-sans text-(length:--board-unit) leading-(--board-unit-leading) font-medium text-plate-unit">
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
      className="relative block h-(--board-tile-height) w-(--board-tile) font-mono text-(length:--board-digit) font-semibold perspective-[25rem]"
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
