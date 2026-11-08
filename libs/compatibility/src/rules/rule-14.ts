import type { M2Slot } from '../build';
import { type M2SlotKey, m2SlotKeys } from '../fixed-sets';
import { type Amount, amountWhatever, nothing, totalOfRows } from './amounts';
import { m2Drives, m2DrivesNotSata } from './drives';
import { exceeds, or, problemWhen } from './findings';
import type { Reading } from './reading';
import { rule } from './statement';

// Rule 14: the Build has more M.2 drives than the motherboard has M.2 slots
// for them. An M.2 drive is one whose form factor is an M.2 size, and an M.2
// SATA drive one whose interface is M.2 SATA, or SATA 1.5, 3.0 or 6.0 Gb/s
// (the owner's decision of 8 November 2026). A slot keyed M takes any M.2
// drive, one keyed B only an M.2 SATA drive, and one keyed E none, since it
// is for a wireless card. So the M.2 drives that are not SATA, which only a
// slot keyed M takes, may outnumber those slots, or all the M.2 drives the
// slots keyed M or B.
export const rule14 = rule({
  number: 14,
  involves: { motherboard: ['m2_slots'], storage: ['form_factor', 'interface'] },
  judge: ({ motherboard, storage }) => {
    const slots = motherboard.read('m2_slots');
    return problemWhen(
      or(
        exceeds(m2DrivesNotSata(storage), slotsKeyed(slots, ['M'])),
        exceeds(m2Drives(storage), slotsKeyed(slots, ['M', 'B'])),
      ),
    );
  },
});

// How many of the motherboard's M.2 slots have one of the keys: a limit about
// the board. A slot with no key may have one of them or not, and is named by
// its place among the slots, such as `m2_slots.1.key`, as the API names it. A
// missing list of slots may hold any number of them.
function slotsKeyed(slots: Reading<readonly M2Slot[]>, keys: readonly M2SlotKey[]): Amount {
  return totalOfRows(slots, 'key', (key) =>
    amountWhatever(key, m2SlotKeys, (each) => (keys.includes(each) ? aSlot : nothing)),
  );
}

const aSlot: Amount = { least: 1, most: 1, about: new Set(), missing: [] };
