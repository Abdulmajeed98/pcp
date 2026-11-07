import { and, equals, not, problemWhen, someRow, theBuildHolds } from './findings';
import { rule } from './statement';

// Rule 8: the Build has a GPU and the motherboard has no 16-lane PCIe slot.
// The board's PCIe slots are rows, each of the slots of one kind, and a row
// of 16 lanes is a 16-lane slot. An empty list of slots is a value: the board
// has none. A row whose lanes are missing could be a 16-lane one.
export const rule8 = rule({
  number: 8,
  involves: { gpu: [], motherboard: ['pcie_slots'] },
  judge: ({ gpu, motherboard }) =>
    problemWhen(
      and(
        theBuildHolds(gpu),
        not(someRow(motherboard.read('pcie_slots'), 'lanes', (lanes) => equals(lanes, 16))),
      ),
    ),
});
