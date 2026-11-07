import { exceeds, problemWhen } from './findings';
import { rule } from './statement';

// Rule 10: the GPU occupies more slots than the case has. A GPU may occupy a
// fraction of a slot, such as 2.5, which takes a third.
export const rule10 = rule({
  number: 10,
  involves: { gpu: ['total_slot_width'], case: ['expansion_slots'] },
  judge: ({ gpu, case: pcCase }) =>
    problemWhen(exceeds(gpu.read('total_slot_width'), pcCase.read('expansion_slots'))),
});
