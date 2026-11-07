# 04: Drives, clearances and the PSU's connectors: rules 13 to 21

**Spec:** [the compatibility spec](../spec.md)

**What to build:** The library judges the last nine rules: the drives against the motherboard's ports and slots, the case's bays and the PSU's SATA power connectors (rules 13 to 16); an air cooler's height and the PSU's form factor and length against the case (rules 17 to 19); the PSU's CPU power connectors against the board's (rule 20); and a back-connect board against the case (rule 21). Rules 15 and 20 can give a Compatibility Warning. With this ticket every one of the 21 rules is stated. The tests are the proof, written before the code.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] **Rules 13 to 21**, as the spec's table reads OpenDB's values:
  - a SATA drive, for rules 13 and 16, is one whose interface is SATA 1.5, 3.0 or 6.0 Gb/s, and an M.2 SATA, mSATA, SAS or U.2 drive is not; the board's ports are its SATA 6 Gb/s and 3 Gb/s ports together; an M.2 drive needs no SATA power;
  - an M.2 drive, for rule 14, is one whose form factor is an M.2 size; a slot keyed M takes any M.2 drive, a slot keyed B only an M.2 SATA drive, a slot keyed E none, and a slot with no key is unknown; no slot's sizes are compared;
  - rule 15 reads a drive's form factor whatever its interface, lets a 2.5-inch drive take a free 3.5-inch bay, and gives a Warning for a 2.5-inch drive in a case that gives no internal bay at all, as the rule notes say;
  - rule 17 judges an air cooler, one whose "Liquid cooled" is no, against the case's tallest cooler, and a liquid cooler passes;
  - rule 18 lets no form factor stand in for another;
  - rule 20 counts the board's CPU power sockets as the entries of its CPU power connectors, against the PSU's EPS 8-pin connectors, as the rule notes say;
  - rules 13 to 16 count every drive times its quantity.
- [ ] The library's tests are written before the code, and they prove each of these:
  - for each of rules 13 to 21, every outcome it can have, and for rules 15 and 20 their Compatibility Warnings;
  - two of one drive count as two drives in rules 13 to 16, and as many drives as the ports, slots, bays or connectors pass while one more does not;
  - an M.2 SATA drive counts against an M.2 slot and not a SATA port, takes a B-keyed slot, and needs no SATA power; an NVMe drive takes no B-keyed slot; no drive takes an E-keyed slot;
  - rule 15's 2.5-inch drive in a free 3.5-inch bay passes, a 2.5-inch drive with every bay taken is a Problem, and a case with no internal bay is a Warning for a 2.5-inch drive and a Problem for a 3.5-inch one;
  - rule 20's board with two CPU power sockets passes with two EPS connectors, gives a Warning with one, and finds a Problem with none, a 0 given to the library directly, since the catalog stores no 0 there;
  - rule 18's SFX supply in a case that lists only ATX is a Problem;
  - a cooler or a PSU exactly at the case's limit fits;
  - unchecked only when it matters: a Build with no SATA drive passes rule 13 whatever the board's SATA ports; an ordinary board passes rule 21 whatever the case says, and a case that takes back-connect boards passes it whatever the board says; a cooler that fits under the case's limit passes rule 17 whether or not it says it is liquid cooled; a drive with no interface leaves rule 13 unchecked when it could tip the count, and judged when it could not; a slot with no key leaves rule 14 unchecked only when the drives could need it.
- [ ] Shown once and then reverted, each failing its own test: an M.2 SATA drive counted as a SATA drive in rule 13; the free 3.5-inch bay taken away in rule 15; rule 21 unchecked for an ordinary board in a case that does not say.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
