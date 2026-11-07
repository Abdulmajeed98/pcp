import { exceeds, not, problemWhen } from './findings';
import { type Reading, rule } from './statement';

// Rule 20: the PSU has no CPU power connector. The motherboard's CPU power
// sockets are the entries of its CPU power connectors, one to three, against
// the PSU's EPS 8-pin connectors. It is a Compatibility Problem when the PSU
// has no EPS connector at all, which the PSU alone makes. It is a
// Compatibility Warning when the PSU has at least one but fewer than the
// motherboard has sockets, since the extra socket is often optional (the
// owner's decision of 15 October 2026).
export const rule20 = rule({
  number: 20,
  involves: { motherboard: ['power_connectors.cpu_power'], psu: ['connectors.eps_8_pin'] },
  judge: ({ motherboard, psu }) => {
    const connectors = psu.read('connectors.eps_8_pin');
    return problemWhen(not(exceeds(connectors, 0)), {
      warningWhen: exceeds(
        socketsIn(motherboard.read('power_connectors.cpu_power')),
        connectors,
      ),
    });
  },
});

// How many CPU power sockets a motherboard has: one for each of its CPU
// power connectors, named by the list's path when it is missing.
function socketsIn(connectors: Reading<readonly string[]>): Reading<number> {
  return { ...connectors, value: connectors.value?.length };
}
