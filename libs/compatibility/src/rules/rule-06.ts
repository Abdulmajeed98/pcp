import { product, total } from './amounts';
import { exceeds, problemWhen } from './findings';
import { rule } from './statement';

// Rule 6: the Build's RAM adds up to more than the motherboard's maximum
// memory, in GB, counting every kit's modules times the capacity of each
// times how many of the kit it holds.
export const rule6 = rule({
  number: 6,
  involves: {
    motherboard: ['memory.max'],
    ram: ['modules.quantity', 'modules.capacity_gb'],
  },
  judge: ({ motherboard, ram }) =>
    problemWhen(
      exceeds(
        total(ram, (kit) =>
          product(
            kit.read('modules.quantity'),
            kit.read('modules.capacity_gb'),
            kit.quantity,
          ),
        ),
        motherboard.read('memory.max'),
      ),
    ),
});
