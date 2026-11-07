import { type MotherboardFormFactor, motherboardFormFactors } from '../fixed-sets';
import { includes, not, problemWhen, some, whatever } from './findings';
import { rule } from './statement';

// Rule 7: the case does not take the motherboard's form factor. A Thin
// Mini-ITX board fits any case that takes Mini-ITX, and a Flex ATX board any
// case that takes Micro ATX, since they share the mounting (the owner's
// decision of 15 October 2026).
export const rule7 = rule({
  number: 7,
  involves: { motherboard: ['form_factor'], case: ['supported_motherboard_form_factors'] },
  judge: ({ motherboard, case: pcCase }) =>
    problemWhen(
      whatever(motherboard.read('form_factor'), motherboardFormFactors, (formFactor) =>
        not(
          some(mountingsOf(formFactor), (mounting) =>
            includes(pcCase.read('supported_motherboard_form_factors'), mounting),
          ),
        ),
      ),
    ),
});

const sharesTheMountingOf: Partial<Record<MotherboardFormFactor, MotherboardFormFactor>> = {
  'Thin Mini-ITX': 'Mini-ITX',
  'Flex ATX': 'Micro ATX',
};

// The form factors a case may take for a board of this one.
function mountingsOf(formFactor: MotherboardFormFactor): MotherboardFormFactor[] {
  const shared = sharesTheMountingOf[formFactor];
  return shared === undefined ? [formFactor] : [formFactor, shared];
}
