import { and, exceeds, not, or, problemWhen, product, total } from './findings';
import { rule } from './statement';

// Rule 11: the PSU cannot power the GPU. It is a Compatibility Problem when
// the PSU has fewer 6+2-pin connectors than the GPU has 6-pin and 8-pin
// sockets, counted together, or when the GPU has a 12VHPWR socket and the PSU
// has neither that cable nor any 6+2-pin connector. It is a Compatibility
// Warning when the GPU has such a socket and the PSU has no such cable but
// has 6+2-pin connectors: the Build works only with the adapter that usually
// comes with the GPU (the owner's decision of 15 October 2026). A 12V-2x6
// socket takes the PSU's 12VHPWR cable as a 12VHPWR socket does, and that
// cable is the only such connector OpenDB lists for a PSU.
export const rule11 = rule({
  number: 11,
  involves: {
    gpu: [
      'power_connectors.pcie_6_pin',
      'power_connectors.pcie_8_pin',
      'power_connectors.pcie_12VHPWR',
      'power_connectors.pcie_12V_2x6',
    ],
    psu: ['connectors.pcie_6_plus_2_pin', 'connectors.pcie_12vhpwr'],
  },
  judge: ({ gpu, psu }) => {
    const sockets = total(
      [gpu.read('power_connectors.pcie_6_pin'), gpu.read('power_connectors.pcie_8_pin')],
      (count) => product(count),
    );
    const twelvePinSockets = total(
      [
        gpu.read('power_connectors.pcie_12VHPWR'),
        gpu.read('power_connectors.pcie_12V_2x6'),
      ],
      (count) => product(count),
    );
    const connectors = psu.read('connectors.pcie_6_plus_2_pin');
    const lacksTheCable = and(
      exceeds(twelvePinSockets, 0),
      not(exceeds(psu.read('connectors.pcie_12vhpwr'), 0)),
    );
    return problemWhen(
      or(exceeds(sockets, connectors), and(lacksTheCable, not(exceeds(connectors, 0)))),
      { warningWhen: and(lacksTheCable, exceeds(connectors, 0)) },
    );
  },
});
