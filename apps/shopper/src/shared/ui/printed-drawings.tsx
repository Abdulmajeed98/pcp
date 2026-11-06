import type { CategoryKey } from '@pcp/ui';
import { cn } from 'cn';
import type { ReactNode } from 'react';

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

// A drawing's frame: as wide as two thirds of its paper and 22rem at the
// most, centred under the paper's title and note.
function Drawing({
  viewBox,
  className,
  testId,
  children,
}: {
  viewBox: string;
  className?: string;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={viewBox}
      aria-hidden="true"
      data-testid={testId}
      className={cn(
        'mx-auto mt-7 block h-auto w-[min(68%,22rem)] text-foreground',
        className,
      )}
    >
      {children}
    </svg>
  );
}

// The numbers from `from` up to `to`, `step` apart.
function steps(from: number, to: number, step: number): number[] {
  return Array.from(
    { length: Math.floor((to - from) / step) + 1 },
    (_, n) => from + n * step,
  );
}

// A tower heat sink, the drawing at the head of the home page's sheet of the
// eight Categories, and a CPU cooler's: a stack of 26 fins, four pipes rising
// through them, the loop of the pipes under them, and its base.
function heatSink() {
  return (
    <>
      {[130, 230, 330, 430].map((x) => (
        <path key={x} d={`M${x} 330 V40`} {...outline} />
      ))}
      {steps(40, 540, 20).map((x) => (
        <rect key={x} x={x} y={20} width={11} height={250} {...outline} />
      ))}
      <path d="M100 330 C 100 380, 460 380, 460 330" {...outline} />
      <rect x={150} y={320} width={260} height={56} {...outline} />
      <rect x={190} y={376} width={180} height={20} {...outline} />
    </>
  );
}

export function HeatSinkDrawing({ className }: { className?: string }) {
  return (
    <Drawing viewBox="0 0 600 400" className={className}>
      {heatSink()}
    </Drawing>
  );
}

// A CPU package seen from above: its square substrate with the pin-1 corner
// cut and marked, a row of capacitors along two edges, and the heat
// spreader with the side notches of its lid.
function cpu() {
  return (
    <>
      <polygon points="64,0 400,0 400,400 0,400 0,64" {...outline} />
      <polygon points="16,40 40,16 40,40" {...outline} />
      {steps(70, 310, 30).map((x) => (
        <g key={x}>
          <rect x={x} y={14} width={14} height={22} {...outline} />
          <rect x={x} y={364} width={14} height={22} {...outline} />
        </g>
      ))}
      <path d="M60 60 H340 V150 H352 V250 H340 V340 H60 V250 H48 V150 H60 Z" {...outline} />
    </>
  );
}

// A motherboard seen from above: the board with its screw holes, the rear
// ports along its edge, the CPU socket and its frame, four memory slots, the
// chipset, an M.2 slot and three expansion slots.
function motherboard() {
  return (
    <>
      <rect x={0} y={0} width={400} height={440} {...outline} />
      {[
        [22, 22],
        [378, 22],
        [22, 418],
        [378, 418],
        [200, 236],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={7} {...outline} />
      ))}
      <rect x={14} y={48} width={34} height={150} {...outline} />
      <rect x={110} y={44} width={138} height={138} {...outline} />
      <rect x={130} y={64} width={98} height={98} {...outline} />
      <polygon points="136,82 136,70 148,70" {...outline} />
      {[278, 296, 314, 332].map((x) => (
        <rect key={x} x={x} y={36} width={10} height={196} {...outline} />
      ))}
      <rect x={270} y={316} width={64} height={64} {...outline} />
      <rect x={76} y={270} width={150} height={16} {...outline} />
      <rect x={48} y={306} width={198} height={14} {...outline} />
      <rect x={48} y={346} width={110} height={12} {...outline} />
      <rect x={48} y={384} width={198} height={14} {...outline} />
    </>
  );
}

// A DDR memory stick: the heat spreader's ridges along its top, the board
// with its key notch, eight chips, and the gold contacts along its edge.
function ram() {
  return (
    <>
      {steps(20, 748, 56).map((x) => (
        <rect key={x} x={x} y={0} width={36} height={16} {...outline} />
      ))}
      <path d="M0 14 H800 V150 H434 V174 H404 V150 H0 Z" {...outline} />
      {steps(40, 670, 90).map((x) => (
        <rect key={x} x={x} y={62} width={64} height={58} {...outline} />
      ))}
      {steps(22, 778, 12)
        .filter((x) => x <= 404 || x >= 430)
        .map((x) => (
          <rect key={x} x={x} y={152} width={7} height={22} {...outline} />
        ))}
    </>
  );
}

// An M.2 drive: the long board, its key notch, the half-circle for its
// screw, the controller and two flash chips, and its contacts.
function m2() {
  return (
    <>
      <path
        d="M30 10 H786 V104 H770 V120 H786 V170 H30 A 22 22 0 0 1 30 126 A 38 38 0 0 0 30 54 A 22 22 0 0 1 30 10 Z"
        {...outline}
      />
      <rect x={120} y={36} width={120} height={108} {...outline} />
      <rect x={290} y={30} width={190} height={120} {...outline} />
      <rect x={520} y={30} width={190} height={120} {...outline} />
      {steps(14, 165, 10.4)
        .filter((y) => y <= 96 || y >= 124)
        .map((y) => (
          <rect key={y} x={744} y={y} width={30} height={5} {...outline} />
        ))}
    </>
  );
}

// One fan's blades, centred on (cx, cy), and its hub, as a graphics card's
// shroud and a power supply hold them.
function fan(cx: number, cy: number, r: number, count: number) {
  const blade = `M${cx} ${cy - r * 0.26} C ${cx + r * 0.32} ${cy - r * 0.42}, ${cx + r * 0.52} ${cy - r * 0.72}, ${cx + r * 0.2} ${cy - r * 0.96} C ${cx + r * 0.02} ${cy - r * 0.7}, ${cx - r * 0.06} ${cy - r * 0.46}, ${cx} ${cy - r * 0.26} Z`;
  return (
    <>
      {Array.from({ length: count }, (_, n) => (
        <path
          key={n}
          d={blade}
          transform={`rotate(${(n * 360) / count} ${cx} ${cy})`}
          {...outline}
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.27} {...outline} />
      <circle cx={cx} cy={cy} r={r * 0.17} {...outline} />
    </>
  );
}

// A graphics card seen from its fans: the bracket with its ports, the
// shroud, two fans, the power socket and the PCIe contacts.
function gpu() {
  return (
    <>
      <rect x={0} y={0} width={44} height={360} {...outline} />
      <rect x={12} y={40} width={20} height={60} {...outline} />
      <rect x={12} y={130} width={20} height={60} {...outline} />
      <rect x={12} y={220} width={20} height={40} {...outline} />
      <path d="M60 10 H860 L890 40 V320 L860 336 H60 Z" {...outline} />
      <rect x={700} y={0} width={90} height={22} {...outline} />
      {[300, 640].map((x) => (
        <g key={x}>
          <circle cx={x} cy={170} r={138} {...outline} />
          {fan(x, 170, 132, 11)}
        </g>
      ))}
      {steps(150, 535, 11)
        .filter((x) => x <= 236 || x >= 262)
        .map((x) => (
          <rect key={x} x={x} y={336} width={6} height={24} {...outline} />
        ))}
    </>
  );
}

// A tower case from the front: its body, the power button and two ports at
// its top, the mesh of its front with three fans behind it, and its feet.
function pcCase() {
  return (
    <>
      <rect x={0} y={0} width={240} height={430} {...outline} />
      <circle cx={196} cy={22} r={9} {...outline} />
      <rect x={136} y={16} width={10} height={12} {...outline} />
      <rect x={152} y={16} width={10} height={12} {...outline} />
      <rect x={20} y={44} width={200} height={360} {...outline} />
      {[106, 224, 342].map((y) => (
        <g key={y}>
          <circle cx={120} cy={y} r={54} {...outline} />
          <circle cx={120} cy={y} r={14} {...outline} />
        </g>
      ))}
      <rect x={14} y={430} width={40} height={10} {...outline} />
      <rect x={186} y={430} width={40} height={10} {...outline} />
    </>
  );
}

// A power supply: its box with the four screws of its fan, the fan's guard
// of rings and struts, and the fan behind it.
function psu() {
  return (
    <>
      <rect x={0} y={0} width={400} height={260} {...outline} />
      {[
        [94, 24],
        [306, 24],
        [94, 236],
        [306, 236],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={6} {...outline} />
      ))}
      {[112, 84, 56].map((r) => (
        <circle key={r} cx={200} cy={130} r={r} {...outline} />
      ))}
      <path d="M200 18 V242 M88 130 H312" {...outline} />
      {fan(200, 130, 50, 7)}
      <rect x={20} y={20} width={44} height={30} {...outline} />
    </>
  );
}

// The drawing of each Category, and the shape of its frame.
const drawings: Record<CategoryKey, { viewBox: string; draw: () => ReactNode }> = {
  cpu: { viewBox: '0 0 400 400', draw: cpu },
  cpuCooler: { viewBox: '0 0 600 400', draw: heatSink },
  motherboard: { viewBox: '0 0 400 440', draw: motherboard },
  ram: { viewBox: '0 0 800 180', draw: ram },
  storage: { viewBox: '0 0 800 180', draw: m2 },
  gpu: { viewBox: '0 0 900 370', draw: gpu },
  case: { viewBox: '0 0 240 440', draw: pcCase },
  psu: { viewBox: '0 0 400 260', draw: psu },
};

// The drawing of a Category, at the head of its sheet on a Category page,
// and on a Part's box label.
export function CategoryDrawing({
  category,
  className,
}: {
  category: CategoryKey;
  className?: string;
}) {
  const { viewBox, draw } = drawings[category];
  return (
    <Drawing viewBox={viewBox} className={className} testId="category-drawing">
      {draw()}
    </Drawing>
  );
}
