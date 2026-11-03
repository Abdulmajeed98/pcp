import { cn } from 'cn';
import { Fragment } from 'react';
import type * as React from 'react';

// A plate: a figure that matters, in amber Geist Mono on graphite, as a money
// changer's board shows the day's rate (the dashboard's DESIGN.md). Plate
// Amber is drawn here and nowhere else. The figure keeps its digits in
// columns, and is always written in Western digits by `formatNumber`.
//
// It is drawn at the Figure size, 18 pixels at weight 600, on 4-pixel
// corners with 10 pixels each side, sized to its figures; in the dark scheme
// a lit 1-pixel edge holds it apart from the Night Sheet. A muted plate, for
// a price that cannot be bought now, is Muted Plate with its figures in its
// grey and no edge; what it holds reads it as `group-data-[muted]/plate`.
//
// A screen's one leading plate, `lead`, where one figure is the screen's
// answer (an Offer's own screen, redesign ticket 12), is drawn at the Figure
// lead size, 30 pixels, on 6-pixel corners with 16 pixels each side.
function Plate({
  className,
  muted = false,
  lead = false,
  ...props
}: React.ComponentProps<'span'> & { muted?: boolean; lead?: boolean }) {
  return (
    <span
      data-slot="plate"
      data-muted={muted ? '' : undefined}
      data-lead={lead ? '' : undefined}
      className={cn(
        'group/plate inline-flex items-center border font-mono font-semibold tabular-nums',
        lead
          ? 'rounded-plate-lead px-[15px] py-[7px] text-3xl/[1.2]'
          : 'rounded-plate px-[9px] py-0.5 text-lg',
        muted
          ? 'border-transparent bg-plate-muted text-plate-muted-figure'
          : 'border-plate-edge bg-plate text-plate-figure',
        className,
      )}
      {...props}
    />
  );
}

// A figure on a plate, as `formatNumber` writes it: its grouping commas and
// its decimal point are set in Geist, so that neither takes a whole cell of
// the figure, "266,000" and "349.99", never "266 , 000" or "349 . 99"
// (redesign ticket 12). Every figure written on a plate takes it.
function PlateFigure({ figure }: { figure: string }) {
  // The figure's digits, and the comma or point between each run of them.
  return figure
    .split(/([,.])/)
    .map((piece, index) => (
      <Fragment key={index}>
        {piece === ',' || piece === '.' ? (
          <span className="font-sans">{piece}</span>
        ) : (
          piece
        )}
      </Fragment>
    ));
}

export { Plate, PlateFigure };
