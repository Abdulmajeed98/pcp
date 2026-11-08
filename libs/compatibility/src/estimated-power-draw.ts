import type { Build, CpuSpecifications, GpuSpecifications } from './build';
import type { MissingSpecification } from './outcome';
import { type Amount, product, total } from './rules/amounts';
import { type PartRead, readPart } from './rules/statement';

// A Build's estimated power draw (CMP-5), in W, or not known, naming each
// missing TDP it needs.
export type EstimatedPowerDraw =
  | { readonly known: true; readonly watts: number }
  | { readonly known: false; readonly missing: readonly MissingSpecification[] };

// What a Build is reckoned to draw for everything but its CPU and its GPU,
// in W.
const everythingElse = 100;

// A Build's estimated power draw, for a Build with a CPU: its CPU's TDP, plus
// its GPU's TDP, 0 W without a GPU, plus 100 W for everything else. It is not
// known when a TDP it needs is missing. A Build without a CPU has none.
export function estimatedPowerDrawOf(build: Build): EstimatedPowerDraw | undefined {
  if (build.cpu === undefined) return undefined;
  const draw = drawOf(readPart(build.cpu), build.gpu && readPart(build.gpu));
  return draw.missing.length === 0
    ? { known: true, watts: draw.least }
    : { known: false, missing: draw.missing };
}

// The estimated power draw as an amount, as rule 12 compares it: at least
// what the known TDPs and the 100 W add up to, and any number more when a
// TDP is missing.
export function drawOf(
  cpu: PartRead<CpuSpecifications, 'specifications.tdp'>,
  gpu: PartRead<GpuSpecifications, 'tdp'> | undefined,
): Amount {
  const tdps =
    gpu === undefined
      ? [cpu.read('specifications.tdp')]
      : [cpu.read('specifications.tdp'), gpu.read('tdp')];
  return total([...tdps, everythingElse], (watts) => product(watts));
}
