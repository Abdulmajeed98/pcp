import { powerSupplyFormFactors } from '../fixed-sets';
import { includes, not, problemWhen, whatever } from './findings';
import { rule } from './statement';

// Rule 18: the case does not take the PSU's form factor. No form factor
// stands in for another: an SFX supply in a case that lists only ATX is a
// Compatibility Problem.
export const rule18 = rule({
  number: 18,
  involves: { case: ['supported_power_supply_form_factors'], psu: ['form_factor'] },
  judge: ({ case: pcCase, psu }) =>
    problemWhen(
      whatever(psu.read('form_factor'), powerSupplyFormFactors, (formFactor) =>
        not(includes(pcCase.read('supported_power_supply_form_factors'), formFactor)),
      ),
    ),
});
