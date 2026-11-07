# 06: Missing specifications asks for exactly what the rules read

**Spec:** [the compatibility spec](../spec.md)

**What to build:** The API's specification lists stop marking needed specifications by hand: a specification is needed when the library's statement of the rules names its path for its Category. The Categories endpoint, a Part's missing needed specifications and the Admin's Missing specifications list all read it so, and can no longer drift from the rules. The needed specifications stay what they are, with one addition: a CPU cooler's "Liquid cooled", which rule 17 reads to tell an air cooler from a liquid one. A cooler that lacks it now shows on Missing specifications once a Vendor offers it, and its form and page mark it as needed, as they mark every needed specification already.

**Blocked by:** 03, 04

**Status:** ready-for-agent

- [ ] **Read from the rules.** No specification list marks a needed specification by hand. Whether a specification is needed is read from the library's statements, and every path the library names is in its Category's list.
- [ ] **The table.** The Categories endpoint's test, which writes out the needed specifications from the MVP spec's table and does not read them from the platform, gains "Liquid cooled" for CPU coolers and passes. No other Category's needed specifications change.
- [ ] `pnpm integration:check` gains these tests, written before the code, and passes:
  - a CPU cooler that lacks "Liquid cooled", once offered, is on Missing specifications with "Liquid cooled" among its missing needed specifications, read through the API as the Admin;
  - the same cooler's Part, read through the API, names the same path among its missing needed specifications;
  - the existing tests of Missing specifications and of a Part's missing needed specifications pass unchanged.
- [ ] Shown once and then reverted, failing its own test: rule 17's reading of "Liquid cooled" taken out of its statement, which the Categories endpoint's table catches.
- [ ] `pnpm integration:check` and `pnpm check` pass, `pnpm check` with Docker stopped.
- [ ] The results of the fault check are recorded under Comments.
- [ ] The work is committed in pieces, each leaving both checks passing.
