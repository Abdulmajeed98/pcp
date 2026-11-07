import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';

import { barsOfALabel } from './code-39';
import { ScansOnce } from './scans-once';

// How tall the bars are, in pixels (DESIGN.md's The specifications).
const barHeight = 64;

// A text as a printed label carries it (DESIGN.md's The specifications): its
// Code 39 barcode, black bars on white in both schemes, 64 pixels tall, with
// the text under it, the whole one figure named for a screen reader by
// `label`, which says the text once. The bars are drawn at a pixel a
// module, a narrow bar a pixel wide, wide ones three, so that they stay
// sharp on every screen, and only as narrow as the room they have makes
// them; the quiet zone at each end is part of the drawing, on the white.
// A text Code 39 cannot write, such as one with a small
// letter or a bracket, or one too long to read as bars on a phone, has no
// bars, and the label carries the text alone. The bars are never mirrored,
// and they are scanned once when they come into view (Motion 6).
export function Barcode({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const written = barsOfALabel(text);

  return (
    <figure
      aria-label={label}
      data-testid="barcode"
      data-bars={written === undefined ? 'none' : 'code-39'}
      className={cn(
        'grid w-fit max-w-full justify-items-center gap-1 bg-barcode-ground px-0 pt-3 pb-2 text-barcode',
        className,
      )}
    >
      {written !== undefined && (
        <ScansOnce>
          <svg
            viewBox={`0 0 ${written.modules} ${barHeight}`}
            width={written.modules}
            height={barHeight}
            preserveAspectRatio="none"
            shapeRendering="crispEdges"
            aria-hidden="true"
            className="block h-16 max-w-full"
          >
            {written.bars.map(({ x, width }) => (
              <rect key={x} x={x} width={width} height={barHeight} fill="currentColor" />
            ))}
          </svg>
        </ScansOnce>
      )}
      <figcaption aria-hidden="true" className="max-w-full px-3 text-sm break-all">
        <AlwaysEnglish>{text}</AlwaysEnglish>
      </figcaption>
    </figure>
  );
}
