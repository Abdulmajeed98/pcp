import { exceeds, problemWhen, product } from './findings';
import { rule } from './statement';

// Rule 19: the PSU is longer than the case allows, equal fitting.
export const rule19 = rule({
  number: 19,
  involves: { case: ['max_psu_length'], psu: ['length'] },
  judge: ({ case: pcCase, psu }) =>
    problemWhen(exceeds(product(psu.read('length')), pcCase.read('max_psu_length'))),
});
