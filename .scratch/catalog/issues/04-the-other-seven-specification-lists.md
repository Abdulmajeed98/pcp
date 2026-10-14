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

**Status:** resolved

- [x] Before anything is written, OpenDB's seven other folders at the pinned commit are read from a local copy, which is not committed. The findings are recorded under Comments:
  - every field and the kind of value it holds;
  - the values each compared specification takes;
  - which needed specifications hold 0, and where 0 cannot be true;
  - how many records in each of the eight folders lack a name or a manufacturer. Ticket 08 needs this count.
- [x] Each list covers every field OpenDB defines for its Category, except retailer and identity data.
- [x] The needed specifications are exactly those in the table above. Where a rule needs a field that the table does not name, such as whether a cooler is water-cooled for rule 17, it is recorded under Comments for the owner and not marked.
- [x] Every specification that a rule compares for equality is a fixed set of the values found at the pinned commit: sockets, form factors, RAM types, storage interfaces and the like.
- [x] Every specification for which 0 cannot be true is marked so, such as lengths, heights, wattages and numbers of slots or bays.
- [x] Lists of rows, such as a motherboard's PCIe and M.2 slots, have their own fields, and their kinds are checked. A CPU has no list of rows, so ticket 03 could not test one through the API: here a row that is not an object, a row with a field its list does not name, and a row field of the wrong kind are each refused, naming the row's field (`specifications.pcie_slots.0.lanes`), and an empty list of rows is kept as a value.
- [x] The sockets are one set, shared by the CPU's `socket`, the motherboard's `socket` and the CPU cooler's `cpu_sockets`, holding every value the three use at the pinned commit. Ticket 03 made it from the CPU folder alone. A value one of them spells differently from the others is recorded under Comments for the owner rather than added as a second spelling.
- [x] `pnpm integration:check` passes with these tests:
  - For each of the seven Categories, a made-up Part with a value for every specification on its list is created and read back unchanged.
  - The Categories' answer holds, for each Category, every field the table above names, marked as needed. The test writes the table out itself, and does not read the platform's lists.
  - A value outside a fixed set and a 0 where 0 cannot be true are refused in a second Category, as they are for a CPU.
- [x] Shown once and then reverted: the needed mark taken off a case's `max_video_card_length` fails the table's test.
- [x] `pnpm api-client:write` is run if the description changed. It was run, and nothing changed: the description holds no specification values.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault check are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 14 October 2026: completed

**For the owner to decide.**

- **Where the table names a whole object, the needed marks pick the fields in it that a Compatibility Rule counts.**
  - Motherboard: of `storage_devices`, the SATA 6 Gb/s and 3 Gb/s ports for rule 13, and not U.2.
  - GPU: all four power sockets in `power_connectors`, for rule 11.
  - PSU: of `connectors`, the EPS (rule 20), PCIe 6+2-pin and 12VHPWR (rule 11) and SATA (rule 16) connectors, and not the 24-pin, Molex or floppy ones.
- **Fields a rule needs that the table does not name.** Each is recorded here and not marked:
  - **Rule 17** applies to air coolers only, so it needs `water_cooled`.
  - **Rule 14** counts M.2 slots, but 602 of OpenDB's slot rows are keyed E, for wireless cards, and cannot hold a drive. It needs the slots' `key`, which is now a fixed set of B, E and M.
- **Three socket spellings are left out of the shared set.** "LGA 1151v2" (21 coolers and motherboards), "LGA 115" (11) and "LGA 1121" (2) are left out as variants of a value already in the set, or as mistakes.
  - Creating a Part that names one is refused, and the import leaves the value out and counts it.
  - Mapping "LGA 1151v2" to "LGA 1151" instead would keep 21 Parts' sockets. That is the owner's call, and a change to the data rather than to the set.
- **Sockets kept as OpenDB has them, although no CPU is sold for them.**
  - Dual-socket boards: "2 x LGA 2011", "2 x LGA 2011-3", "2 x LGA 2011-3 Narrow", "2 x LGA 1366" and "2 x G34".
  - Boards with a CPU built in: "Integrated Atom", "Integrated Xeon D", "Integrated Pentium" and "Integrated AMD".
  - Rule 1 will call a CPU of socket LGA 2011 on a "2 x LGA 2011" board a Compatibility Problem. These are server boards that an Erbil shop is unlikely to stock.
- **Zeros taken as "not known" where OpenDB's own data shows that they are:**
  - 1,051 motherboards give 0 SATA 6 Gb/s ports, current boards such as the Gigabyte B850 AI TOP among them.
  - 477 ATX power supplies of 650 W or more give 0 EPS connectors, and 513 give 0 PCIe 6+2-pin connectors.
  - A few supplies also give 0 SATA or 24-pin connectors.

  Without this, rules 11, 13, 16 and 20 would report Compatibility Problems that do not exist. The cost is that those rules are unchecked for those Parts until the Admin fills the value in (CAT-8).
- **Zeros kept as true, against the ticket's own example of "slots or bays":**
  - 498 cases give 0 internal 2.5-inch bays, older towers among them that take such drives in their 3.5-inch bays. Rule 15 may report those as a Compatibility Problem for a build with 2.5-inch drives.
  - 0 drive bays of other kinds, a 0 cache on an SSD without DRAM, 0 fans on a liquid cooler sold without them, and 0 power sockets or video outputs of one kind on a GPU are all true.
- **"Thin Mini-ITX"** is a motherboard form factor in the shared set. No case lists it, so rule 7 will call a Thin Mini-ITX board in any case a Compatibility Problem, unless `compatibility` treats it as Mini-ITX.
- **Shared sets beyond sockets.** The ticket asked for one shared set of sockets. RAM types and the motherboard and PSU form factors are shared too, because Compatibility Rules compare them across Categories. A CPU's memory types therefore offer DDR1 and DDR2, which no CPU at the pinned commit uses.
- **Not in OpenDB's schema, and so not in the lists:** `weight` in 75 coolers and 29 RAM kits, and `display_outputs` in 2 GPUs. The import ignores them.

**OpenDB's eight folders at commit `ef7e601b`,** read from a local copy outside the repository:

| Folder | Records | Without a name | Without a manufacturer | Part numbers only as `mpn` identifiers |
|---|---|---|---|---|
| CPU | 789 | 0 | 1 | 0 |
| CPUCooler | 2,413 | 0 | 1 | 192 |
| Motherboard | 3,701 | 0 | 4 | 69 |
| RAM | 4,876 | 0 | 0 | 368 |
| Storage | 3,495 | 0 | 2 | 0 |
| GPU | 3,865 | 0 | 1 | 332 |
| PCCase | 3,804 | 0 | 15 | 598 |
| PSU | 3,297 | 0 | 4 | 4 |
| **Total** | **26,240** | **0** | **28** | **1,563** |

Every record's ID matches its file name. Ticket 08 leaves the 28 records without a manufacturer out and names them. That is more than a handful, so the owner is told here first.

**Units.** Each unit was checked against the description OpenDB's schema gives for the field. The review found that a case's weight is in pounds, which the list first gave as kilograms. A RAM kit's speed is in MHz as OpenDB and the shops give it, and a cooler's noise is in dB.

**The code review also found:**

- a 0 taken as unknown for a cooler's fans and a drive's cache, where it can be true;
- a test of the CPU's needed specifications that the test of every Category made redundant;
- a test of the shared sets that passed when both values it compared were missing;
- test names that read "a cpuCooler".

All are corrected.

**Fault.** With the needed mark taken off a case's `max_video_card_length`, the test of every Category's needed specifications failed, and nothing else. The file was restored from its commit.

**Results.**

- `pnpm check` passes.
- `pnpm integration:check` passes 44 tests:
  - one round trip for each of the seven Categories, with a value for every specification on its list;
  - refusals in a motherboard and a case;
  - four tests of a list of rows.
