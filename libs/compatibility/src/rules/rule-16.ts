import { sataDrives } from './drives';
import { exceeds, problemWhen } from './findings';
import { rule } from './statement';

// Rule 16: the Build has more SATA drives than the PSU has SATA power
// connectors. SATA drives are read as rule 13 reads them, so an M.2 drive
// needs none.
export const rule16 = rule({
  number: 16,
  involves: { storage: ['interface'], psu: ['connectors.sata'] },
  judge: ({ storage, psu }) =>
    problemWhen(exceeds(sataDrives(storage), psu.read('connectors.sata'))),
});
