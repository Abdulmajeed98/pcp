import {
  CircuitBoard,
  Cpu,
  Fan,
  Gpu,
  HardDrive,
  type LucideProps,
  MemoryStick,
  PcCase,
  PlugZap,
} from 'lucide-react';

// The icon of each Category, from lucide, the icon set both apps' shadcn/ui
// components use. The keys are the Categories' own, which the API and the
// shared terms use too, so that a Category the API adds and this list lacks
// fails type-checking where an app passes it in.
const icons = {
  cpu: Cpu,
  cpuCooler: Fan,
  motherboard: CircuitBoard,
  ram: MemoryStick,
  storage: HardDrive,
  gpu: Gpu,
  case: PcCase,
  psu: PlugZap,
} as const;

export type CategoryKey = keyof typeof icons;

// The picture of a Part that has no photo: its Category's icon (CAT-6). It is
// drawn in the colour of the text around it, at the size the app gives it.
//
// None of the eight points along the reading direction, so none is mirrored
// on a right-to-left page.
//
// It is decorative: wherever it is shown, the Category's name or the Part's
// is shown in words beside it, so a screen reader is not told it again. It
// says which Category it is drawn for, so that a test can read it.
export function CategoryIcon({
  category,
  ...props
}: { category: CategoryKey } & Omit<LucideProps, 'ref'>) {
  const Icon = icons[category];

  return (
    <Icon
      aria-hidden="true"
      data-testid="category-icon"
      data-category={category}
      {...props}
    />
  );
}
