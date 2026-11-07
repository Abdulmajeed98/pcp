import { drawOf } from '../estimated-power-draw';
import { exceeds, problemWhen, times } from './findings';
import { rule } from './statement';

// Rule 12: the PSU's wattage is below 1.3 times the Build's estimated power
// draw. They are compared in whole numbers, ten times the wattage against
// thirteen times the draw, so a PSU of exactly 1.3 times passes. The rule
// reads the GPU's TDP when the Build holds a GPU, and applies without one.
export const rule12 = rule({
  number: 12,
  involves: { cpu: ['specifications.tdp'], psu: ['wattage'] },
  readsWhenHeld: { gpu: ['tdp'] },
  judge: ({ cpu, gpu, psu }) =>
    problemWhen(exceeds(times(drawOf(cpu, gpu), 13), times(psu.read('wattage'), 10))),
});
