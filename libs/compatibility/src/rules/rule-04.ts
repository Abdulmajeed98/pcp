import { ramTypes } from '../fixed-sets';
import { fact, problemWhen, some, whatever } from './findings';
import { rule } from './statement';

// Rule 4: a RAM kit's type differs from the motherboard's. Each kit is judged.
// The board has one type for every kit, so its type is taken before the
// kits': two kits of different types make a Problem even when the board's
// type is missing, since no board takes both.
export const rule4 = rule({
  number: 4,
  involves: { motherboard: ['memory.ram_type'], ram: ['ram_type'] },
  judge: ({ motherboard, ram }) =>
    problemWhen(
      whatever(motherboard.read('memory.ram_type'), ramTypes, (board) =>
        some(ram, (kit) =>
          whatever(kit.read('ram_type'), ramTypes, (own) => fact(own !== board)),
        ),
      ),
    ),
});
