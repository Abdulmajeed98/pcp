import { cn } from 'cn';

// Printed drawings (DESIGN.md's Printed drawings): hardware drawn in the Ink
// as outlines, 1.6-pixel strokes and no fill, with no text, as the engraving
// at the head of an old price list. A drawing is geometry: it stands for a
// kind of Part, never for a Part on sale. It is decoration, hidden from
// readers, and never mirrored.
const outline = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  vectorEffect: 'non-scaling-stroke',
} as const;

// A tower heat sink, the drawing at the head of the home page's sheet of the
// eight Categories: a stack of 26 fins, four pipes rising through them, the
// loop of the pipes under them, and its base.
export function HeatSinkDrawing({ className }: { className?: string }) {
  const fins = Array.from({ length: 26 }, (_, fin) => 40 + fin * 20);
  return (
    <svg
      viewBox="0 0 600 400"
      aria-hidden="true"
      className={cn(
        'mx-auto mt-7 block h-auto w-[min(68%,22rem)] text-foreground',
        className,
      )}
    >
      {[130, 230, 330, 430].map((x) => (
        <path key={x} d={`M${x} 330 V40`} {...outline} />
      ))}
      {fins.map((x) => (
        <rect key={x} x={x} y={20} width={11} height={250} {...outline} />
      ))}
      <path d="M100 330 C 100 380, 460 380, 460 330" {...outline} />
      <rect x={150} y={320} width={260} height={56} {...outline} />
      <rect x={190} y={376} width={180} height={20} {...outline} />
    </svg>
  );
}
