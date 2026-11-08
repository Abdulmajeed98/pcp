import { Category } from '../part/Category';
import { Part } from '../part/Part';
import { coolerIncluded, integratedGraphics } from '../specification/cpu.specifications';
import { Specification } from '../specification/Specification';
import { valueAt } from '../specification/specification-document';
import { Build } from './Build';

// The values of a Build's CPU that the rule for a Complete Build reads:
// whether it has integrated graphics, and whether it includes a cooler.
export const cpuValues = ['integratedGraphics', 'includesCooler'] as const;
export type CpuValue = (typeof cpuValues)[number];

// Whether a Build is a Complete Build, and what it still needs (BLD-5).
export class Completeness {
  constructor(
    private readonly stillNeeded: readonly Category[],
    private readonly cpuValuesNotKnown: readonly CpuValue[],
  ) {}

  isComplete(): boolean {
    return this.stillNeeded.length === 0;
  }

  // The Categories the Build still needs, in the catalog's order.
  getStillNeeded(): readonly Category[] {
    return this.stillNeeded;
  }

  // The values of the Build's CPU the rule reads that the CPU does not hold,
  // in the order of `cpuValues`.
  getCpuValuesNotKnown(): readonly CpuValue[] {
    return this.cpuValuesNotKnown;
  }
}

// What a CPU provides in place of a Part of another Category: the
// specification that says so, the Category it stands in for, and whether a
// value it holds provides it.
type Provision = {
  specification: Specification;
  insteadOf: Category;
  provides: (value: unknown) => boolean;
};

// A CPU has integrated graphics when its Integrated graphics is held and is
// not "None", as OpenDB writes a CPU without them. It includes a cooler when
// its Cooler included is yes.
const provisions: Record<CpuValue, Provision> = {
  integratedGraphics: {
    specification: integratedGraphics,
    insteadOf: Category.GPU,
    provides: (value) => value !== 'None',
  },
  includesCooler: {
    specification: coolerIncluded,
    insteadOf: Category.CPU_COOLER,
    provides: (value) => value === true,
  },
};

// Whether the CPU holds the value: a value its specification counts as
// missing, as the catalog counts it, is not held.
function holds(cpu: Part, provision: Provision): boolean {
  return !provision.specification.isMissingIn(
    valueAt(cpu.getSpecifications(), provision.specification.getPath()),
  );
}

// Whether the CPU provides it: a CPU that does not hold the value counts as
// not providing it.
function provides(cpu: Part, provision: Provision): boolean {
  const value = valueAt(cpu.getSpecifications(), provision.specification.getPath());
  return holds(cpu, provision) && provision.provides(value);
}

// The rule for a Complete Build, written once (BLD-5): a CPU, a motherboard,
// at least one RAM kit, at least one drive, a case and a PSU, with a GPU
// unless the CPU has integrated graphics, and a CPU cooler unless the CPU
// includes one. Without a CPU, the GPU and the CPU cooler are needed.
export function completenessOf(build: Build): Completeness {
  const cpu = build
    .getParts()
    .find((each) => each.getPart().getCategory() === Category.CPU)
    ?.getPart();
  // Whether the Build needs a Part of the Category, held or not.
  function needs(category: Category): boolean {
    const provision = Object.values(provisions).find((each) => each.insteadOf === category);
    return provision === undefined || cpu === undefined || !provides(cpu, provision);
  }

  return new Completeness(
    Category.values().filter((category) => needs(category) && !build.holds(category)),
    cpu === undefined ? [] : cpuValues.filter((value) => !holds(cpu, provisions[value])),
  );
}
