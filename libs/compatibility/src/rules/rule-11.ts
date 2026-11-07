import { gpuPowerSockets } from '../fixed-sets';
import { larger, product, total } from './amounts';
import { and, exceeds, not, or, problemWhen } from './findings';
import { rule } from './statement';

// Rule 11: the PSU cannot power the GPU. It is a Compatibility Problem when
// the PSU has fewer 6+2-pin connectors than the GPU has 6-pin and 8-pin
// sockets, counted together, or when it has fewer 12VHPWR cables than the GPU
// needs and no 6+2-pin connector. It is a Compatibility Warning when the PSU
// has fewer such cables than the GPU needs but has 6+2-pin connectors: the
// Build works only with the adapter that usually comes with the GPU (the
// owner's decision of 15 October 2026). A 12V-2x6 socket takes the PSU's
// 12VHPWR cable as a 12VHPWR socket does, and that cable is the only such
// connector OpenDB lists for a PSU. The GPU needs as many cables as the
// larger of its 12VHPWR and 12V-2x6 counts, so a card that lists its one
// socket under both kinds needs one (the owner's decision of 8 November
// 2026).
export const rule11 = rule({
  number: 11,
  involves: {
    gpu: gpuPowerSockets.map((socket) => `power_connectors.${socket}` as const),
    psu: ['connectors.pcie_6_plus_2_pin', 'connectors.pcie_12vhpwr'],
  },
  judge: ({ gpu, psu }) => {
    const sockets = total(
      [gpu.read('power_connectors.pcie_6_pin'), gpu.read('power_connectors.pcie_8_pin')],
      (count) => product(count),
    );
    const cablesNeeded = larger(
      gpu.read('power_connectors.pcie_12VHPWR'),
      gpu.read('power_connectors.pcie_12V_2x6'),
    );
    const connectors = psu.read('connectors.pcie_6_plus_2_pin');
    const shortOfCables = exceeds(cablesNeeded, psu.read('connectors.pcie_12vhpwr'));
    return problemWhen(
      or(exceeds(sockets, connectors), and(shortOfCables, not(exceeds(connectors, 0)))),
      { warningWhen: and(shortOfCables, exceeds(connectors, 0)) },
    );
  },
});
