import { sataDrives } from './drives';
import { exceeds, problemWhen, together } from './findings';
import { rule } from './statement';

// Rule 13: the Build has more SATA drives than the motherboard has SATA ports,
// its SATA 6 Gb/s and 3 Gb/s ports together.
export const rule13 = rule({
  number: 13,
  involves: {
    motherboard: ['storage_devices.sata_6_gb_s', 'storage_devices.sata_3_gb_s'],
    storage: ['interface'],
  },
  judge: ({ motherboard, storage }) =>
    problemWhen(
      exceeds(
        sataDrives(storage),
        together(
          motherboard.read('storage_devices.sata_6_gb_s'),
          motherboard.read('storage_devices.sata_3_gb_s'),
        ),
      ),
    ),
});
