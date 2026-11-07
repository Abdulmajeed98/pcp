import type { M2Slot } from '../build';
import {
  type M2SlotKey,
  m2SlotKeys,
  storageFormFactors,
  storageInterfaces,
} from '../fixed-sets';
import { isM2 } from './drives';
import {
  type Amount,
  amountWhatever,
  counted,
  exceeds,
  nothing,
  or,
  problemWhen,
  together,
  total,
} from './findings';
import { type Reading, rule } from './statement';

// Rule 14: the Build has more M.2 drives than the motherboard has M.2 slots
// for them. An M.2 drive is one whose form factor is an M.2 size. A slot
// keyed M takes any M.2 drive, one keyed B only an M.2 SATA drive, and one
// keyed E none, since it is for a wireless card. So the M.2 drives that are
// not SATA, which only a slot keyed M takes, may outnumber those slots, or
// all the M.2 drives the slots keyed M or B.
export const rule14 = rule({
  number: 14,
  involves: { motherboard: ['m2_slots'], storage: ['form_factor', 'interface'] },
  judge: ({ motherboard, storage }) => {
    const slots = motherboard.read('m2_slots');
    // What the rule counts of each drive whose form factor is an M.2 size, and
    // nothing of a drive of another.
    const m2 = (count: (drive: (typeof storage)[number]) => Amount): Amount =>
      total(storage, (drive) =>
        amountWhatever(drive.read('form_factor'), storageFormFactors, (formFactor) =>
          isM2(formFactor) ? count(drive) : nothing,
        ),
      );
    return problemWhen(
      or(
        exceeds(
          m2((drive) =>
            amountWhatever(drive.read('interface'), storageInterfaces, (iface) =>
              iface === 'M.2 SATA' ? nothing : counted(drive),
            ),
          ),
          slotsKeyed(slots, ['M']),
        ),
        exceeds(m2(counted), slotsKeyed(slots, ['M', 'B'])),
      ),
    );
  },
});

// How many of the motherboard's M.2 slots have one of the keys: a limit about
// the board. A slot with no key may have one of them or not, and is named by
// its place among the slots, such as `m2_slots.1.key`, as the API names it. A
// missing list of slots may hold any number of them, as a missing count may.
function slotsKeyed(slots: Reading<readonly M2Slot[]>, keys: readonly M2SlotKey[]): Amount {
  if (slots.value === undefined) {
    return together({ part: slots.part, path: slots.path, value: undefined });
  }
  const keyed = total(
    slots.value.map((slot, index) => ({
      part: slots.part,
      path: `${slots.path}.${index}.key`,
      value: slot.key,
    })),
    (key) =>
      amountWhatever(key, m2SlotKeys, (each) => (keys.includes(each) ? aSlot : nothing)),
  );
  return { ...keyed, about: new Set([slots.part]) };
}

const aSlot: Amount = { least: 1, most: 1, about: new Set(), missing: [] };
