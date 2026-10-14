# 04: The other seven Categories' specification lists

**Spec:** [the catalog spec](../spec.md)

**What to build:** Every Category has its specification list, so that a Part of any Category can be created with its specifications, and every field that a Compatibility Rule reads is marked as needed. The lists are built with ticket 03's mechanism, from what OpenDB holds at the pinned commit.

The needed specifications, taken from the MVP spec's rule table, are:

| Category | Needed specifications |
|---|---|
| CPU cooler | `cpu_sockets`, `height` |
| Motherboard | `socket`, `form_factor`, `memory.ram_type`, `memory.slots`, `memory.max`, `pcie_slots`, `m2_slots`, `storage_devices`, `power_connectors.cpu_power`, `back_connect_connectors` |
| RAM | `ram_type`, `modules.quantity`, `modules.capacity_gb` |
| Storage | `interface`, `form_factor` |
| GPU | `length`, `total_slot_width`, `tdp`, `power_connectors` |
| Case | `supported_motherboard_form_factors`, `max_video_card_length`, `expansion_slots`, `internal_3_5_bays`, `internal_2_5_bays`, `max_cpu_cooler_height`, `supported_power_supply_form_factors`, `max_psu_length`, `supports_rear_connecting_motherboard` |
| PSU | `wattage`, `form_factor`, `length`, `connectors` |

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Before anything is written, OpenDB's seven other folders at the pinned commit are read from a local copy, which is not committed. The findings are recorded under Comments:
  - every field and the kind of value it holds;
  - the values each compared specification takes;
  - which needed specifications hold 0, and where 0 cannot be true;
  - how many records in each of the eight folders lack a name or a manufacturer. Ticket 08 needs this count.
- [ ] Each list covers every field OpenDB defines for its Category, except retailer and identity data.
- [ ] The needed specifications are exactly those in the table above. Where a rule needs a field that the table does not name, such as whether a cooler is water-cooled for rule 17, it is recorded under Comments for the owner and not marked.
- [ ] Every specification that a rule compares for equality is a fixed set of the values found at the pinned commit: sockets, form factors, RAM types, storage interfaces and the like.
- [ ] Every specification for which 0 cannot be true is marked so, such as lengths, heights, wattages and numbers of slots or bays.
- [ ] Lists of rows, such as a motherboard's PCIe and M.2 slots, have their own fields, and their kinds are checked. A CPU has no list of rows, so ticket 03 could not test one through the API: here a row that is not an object, a row with a field its list does not name, and a row field of the wrong kind are each refused, naming the row's field (`specifications.pcie_slots.0.lanes`), and an empty list of rows is kept as a value.
- [ ] The sockets are one set, shared by the CPU's `socket`, the motherboard's `socket` and the CPU cooler's `cpu_sockets`, holding every value the three use at the pinned commit. Ticket 03 made it from the CPU folder alone. A value one of them spells differently from the others is recorded under Comments for the owner rather than added as a second spelling.
- [ ] `pnpm integration:check` passes with these tests:
  - For each of the seven Categories, a made-up Part with a value for every specification on its list is created and read back unchanged.
  - The Categories' answer holds, for each Category, every field the table above names, marked as needed. The test writes the table out itself, and does not read the platform's lists.
  - A value outside a fixed set and a 0 where 0 cannot be true are refused in a second Category, as they are for a CPU.
- [ ] Shown once and then reverted: the needed mark taken off a case's `max_video_card_length` fails the table's test.
- [ ] `pnpm api-client:write` is run if the description changed.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault check are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
