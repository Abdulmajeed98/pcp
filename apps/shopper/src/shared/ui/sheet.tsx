import { cn } from 'cn';
import type { ReactNode } from 'react';

import { PrintInView } from './print-in-view';

// The printed sheet (DESIGN.md's The printed sheet): every list is one,
// Sheet Paper 40rem wide with its top and bottom edges scalloped, 64 pixels
// of padding, set centred like a printed card, its printer's marks standing
// off its corners from 48rem. On a phone it spans the screen but for the
// ground its section leaves at each side, with 40 pixels of padding above
// and below and 18 at the sides. Its stamp, if it has one, is clipped inside
// it as it lands.
//
// It prints as it arrives (Motion 1): `print` is `arrival` for a sheet on the
// first screen, which prints from the page's first paint by CSS alone, and
// `in-view` for one below it, which the page's script prints as it comes
// into view. A sheet set in a grid's columns, as a Category page's is beside
// its swing tag, gives its frame's own width as `frameClassName`.
export function Sheet({
  print,
  className,
  frameClassName,
  children,
}: {
  print: 'arrival' | 'in-view';
  className?: string;
  frameClassName?: string;
  children: ReactNode;
}) {
  const sheet = cn(
    'scalloped relative overflow-clip bg-card px-sheet-phone py-10 text-card-foreground md:p-sheet',
    className,
  );
  const frame = cn('relative w-full max-w-[40rem]', frameClassName);

  if (print === 'in-view') {
    return (
      <PrintInView
        frameClassName={frame}
        className={sheet}
        testId="sheet"
        beside={<PrintersMarks />}
      >
        {children}
      </PrintInView>
    );
  }
  return (
    <div className={frame}>
      <PrintersMarks />
      <div data-testid="sheet" className={cn(sheet, 'print-on-arrival')}>
        {children}
      </div>
    </div>
  );
}

// Printer's marks (DESIGN.md's Shapes): corner marks 22 pixels long in 2
// pixels, 30 pixels off each of the sheet's corners, and the ink bar under
// it, three swatches of 16 by 9 pixels in the Board, the Ink and Print Green,
// from 48rem. Every sheet lies over a dim photograph, on which the Soft Ink
// would be lost, so they are drawn in the bone the photograph's dimmed light
// reads against, in both schemes. They are decoration, and hidden from
// readers.
function PrintersMarks() {
  const mark = 'absolute size-[22px] border-printers-marks';
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -inset-[30px] hidden md:block"
    >
      <i className={cn(mark, 'start-0 top-0 border-e-2 border-b-2')} />
      <i className={cn(mark, 'end-0 top-0 border-s-2 border-b-2')} />
      <i className={cn(mark, 'start-0 bottom-0 border-e-2 border-t-2')} />
      <i className={cn(mark, 'end-0 bottom-0 border-s-2 border-t-2')} />
      <b className="absolute inset-x-0 bottom-1 mx-auto flex w-max gap-[3px]">
        <i className="h-[9px] w-4 bg-secondary" />
        <i className="h-[9px] w-4 bg-foreground" />
        <i className="h-[9px] w-4 bg-primary" />
      </b>
    </span>
  );
}

// A sheet's title, in the Sheet title type, centred. It is the page's `h1`
// on a page whose first piece the sheet is, and an `h2` elsewhere. A word
// longer than the sheet is wide, as a Kurdish one is at a phone's largest
// text, breaks where it must rather than widening the sheet past the window
// (break-ui, browse ticket 13).
export function SheetTitle({
  as: Heading = 'h2',
  id,
  children,
}: {
  as?: 'h1' | 'h2';
  id?: string;
  children: ReactNode;
}) {
  return (
    <Heading id={id} className="type-sheet-title text-center wrap-anywhere">
      {children}
    </Heading>
  );
}

// The one-line note under a sheet's title, in Small Soft Ink. A note that is
// what its page says, as the not-found page's is, is its `lead`: Body large
// in the Ink, as the card's sentence is.
export function SheetNote({
  lead = false,
  children,
}: {
  lead?: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        'text-center',
        lead ? 'mt-4 text-lg' : 'mt-2.5 text-sm text-muted-foreground',
      )}
    >
      {children}
    </p>
  );
}

// A group of a sheet's items, 56 pixels below what comes before it, under a
// centred heading in the Label type, its items 16 pixels apart. Its one
// column may shrink to the sheet's width, so that an item too wide for its
// text, as with a phone's text made larger, stacks inside the sheet rather
// than running past it (break-ui, browse ticket 12).
export function SheetGroup({
  heading,
  as: Heading = 'h3',
  testId,
  children,
}: {
  heading: ReactNode;
  as?: 'h2' | 'h3';
  testId?: string;
  children: ReactNode;
}) {
  return (
    <section data-testid={testId} className="mt-group grid gap-4">
      <Heading className="type-label text-center">{heading}</Heading>
      <ul className="@container grid grid-cols-[minmax(0,1fr)] gap-4">{children}</ul>
    </section>
  );
}

// A sheet's closing lines, in Small Soft Ink, centred.
export function SheetClose({ children }: { children: ReactNode }) {
  return <p className="mt-group text-center text-sm text-muted-foreground">{children}</p>;
}
