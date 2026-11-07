import { ramTypes } from '../fixed-sets';
import { includes, not, problemWhen, some, whatever } from './findings';
import { rule } from './statement';

// Rule 3: the CPU does not support a RAM kit's type. Each kit is judged.
export const rule3 = rule({
  number: 3,
  involves: { cpu: ['specifications.memory.types'], ram: ['ram_type'] },
  judge: ({ cpu, ram }) =>
    problemWhen(
      some(ram, (kit) =>
        whatever(kit.read('ram_type'), ramTypes, (type) =>
          not(includes(cpu.read('specifications.memory.types'), type)),
        ),
      ),
    ),
});
