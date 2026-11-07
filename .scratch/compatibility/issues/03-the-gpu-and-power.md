# 03: The GPU and power: rules 8 to 12 and the estimated power draw

**Spec:** [the compatibility spec](../spec.md)

**What to build:** The library judges the GPU against the motherboard, the case and the PSU, and the PSU's wattage against the Build's estimated power draw. Rule 11 is the first rule that can give a Compatibility Warning: a GPU with a 12VHPWR or 12V-2x6 socket and a PSU without that cable but with 6+2-pin connectors works only with the adapter that usually comes with the GPU. The library also answers a Build's estimated power draw (CMP-5), so that no Shopper code adds up a TDP. The tests are the proof, written before the code.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] **Rules 8 to 12**, as the spec's table reads OpenDB's values:
  - rule 8: a Problem when no row of the board's PCIe slots has 16 lanes; an empty list of slots is a value, the board has none; a row with no lanes is unknown;
  - rule 9: the GPU's length against the case's longest GPU, in millimetres, equal fitting;
  - rule 10: the slots the GPU occupies, which may be a fraction such as 2.5, against the case's expansion slots, more than the case has being a Problem;
  - rule 11: as the MVP spec's rule notes say, with the GPU's 6-pin and 8-pin sockets counted together against the PSU's 6+2-pin connectors, and a 12V-2x6 socket and a 12VHPWR socket both taking the PSU's 12VHPWR cable;
  - rule 12: the PSU's wattage below 1.3 times the estimated power draw, compared in whole numbers, ten times the wattage against thirteen times the draw.
- [ ] **The estimated power draw**, for a Build with a CPU: the CPU's TDP plus the GPU's TDP, 0 W without a GPU, plus 100 W. It is not known when a TDP it needs is missing, and rule 12 is then unchecked.
- [ ] The library's tests are written before the code, and they prove each of these:
  - for each of rules 8 to 12, every outcome it can have, and for rule 11 its Compatibility Warning;
  - a GPU exactly as long as the case allows fits, and one a tenth of a millimetre longer does not;
  - a 2.5-slot GPU fits a case with three expansion slots and not one with two;
  - a PSU of exactly 1.3 times the estimated power draw passes, and one a watt less does not;
  - rule 11's sockets: a 6-pin and an 8-pin socket need two 6+2-pin connectors; a 12VHPWR socket passes with the PSU's 12VHPWR cable; without the cable but with a 6+2-pin connector it is a Warning; with neither, a 0 given to the library directly, it is a Problem; a 12V-2x6 socket reads as a 12VHPWR one; and without the cable, the PSU's 6+2-pin count missing leaves the rule unchecked, since it could make a Problem or a Warning;
  - rule 8's board with no 16-lane row and its board with an empty list of slots are Problems; a board with a row of unknown lanes and no 16-lane row is unchecked; a board with a 16-lane row passes whatever its other rows hold;
  - the estimated power draw counts 0 W for a Build without a GPU, is unknown when the GPU's TDP is missing, and rule 12 does not apply to a Build without a CPU.
- [ ] Shown once and then reverted, each failing its own test: rule 9's comparison turned from `>` to `>=`, failing the GPU exactly as long as the case allows; rule 11's adapter answered as a Problem, failing its Warning.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
