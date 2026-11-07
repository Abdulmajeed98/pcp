import { exceeds, problemWhen, product, total } from './findings';
import { rule } from './statement';

// Rule 5: the Build has more RAM modules than the motherboard has memory
// slots, counting every kit's modules times how many of the kit it holds.
export const rule5 = rule({
  number: 5,
  involves: { motherboard: ['memory.slots'], ram: ['modules.quantity'] },
  judge: ({ motherboard, ram }) =>
    problemWhen(
      exceeds(
        total(ram, (kit) => product(kit.read('modules.quantity'), kit.quantity)),
        motherboard.read('memory.slots'),
      ),
    ),
});
