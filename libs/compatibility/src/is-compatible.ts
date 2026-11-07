import type { Build, Category, Part, SpecificationsOf } from './build';
import { judgeBuild } from './judge-build';

// A Part of a Category, as `isCompatible` takes it: with the specifications
// a Part of its Category holds, and, a RAM kit or a drive, without its
// quantity. Of several Categories, it is a Part of any of them.
export type PartOf<C extends Category> = {
  readonly [Of in Category]: Part<SpecificationsOf<Of>>;
}[C];

// Whether a Part is compatible with a Build (CMP-4): it is, unless the Build
// with it has a Compatibility Problem that names it, by the identifier the
// caller gave it. A Compatibility Warning or an unchecked rule never makes a
// Part incompatible, nor does a Problem the Build already had that does not
// name it. The answer is read from judging the Build with the Part, and no
// rule is judged a second way for it, so the picker and the Build page give
// one answer.
export function isCompatible<C extends Category>(
  category: C,
  part: PartOf<C>,
  build: Build,
): boolean {
  return !judgeBuild(put[category](build, part)).some(
    (outcome) => outcome.outcome === 'problem' && outcome.parts.includes(part.id),
  );
}

// Where a Part goes in a Build: in place of the Build's Part of its Category,
// for the six Categories a Build holds one of, and beside the Build's others,
// with a quantity of one, for a RAM kit or a drive. A kit or a drive the
// Build already holds is counted once more, and an outcome about it then
// names its identifier twice.
const put: { readonly [C in Category]: (build: Build, part: PartOf<C>) => Build } = {
  cpu: (build, cpu) => ({ ...build, cpu }),
  cpuCooler: (build, cpuCooler) => ({ ...build, cpuCooler }),
  motherboard: (build, motherboard) => ({ ...build, motherboard }),
  ram: (build, kit) => ({ ...build, ram: [...(build.ram ?? []), { ...kit, quantity: 1 }] }),
  storage: (build, drive) => ({
    ...build,
    storage: [...(build.storage ?? []), { ...drive, quantity: 1 }],
  }),
  gpu: (build, gpu) => ({ ...build, gpu }),
  case: (build, pcCase) => ({ ...build, case: pcCase }),
  psu: (build, psu) => ({ ...build, psu }),
};
