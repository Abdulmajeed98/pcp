# 05: Whether a Part is compatible with a Build

**Spec:** [the compatibility spec](../spec.md)

**What to build:** The library answers whether a Part is compatible with a Build (CMP-4), the question `builder`'s picker will ask of every Part it might show, so that it hides only the Parts that would cause a Compatibility Problem (BLD-3). The answer comes from judging the Build with the Part, through the same rules, so the picker and the Build page can never disagree. The tests are the proof, written before the code.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] **Where the Part goes.** It replaces the Build's Part of its Category for the six Categories a Build holds one of, and is added beside the Build's others, with a quantity of one, when it is a RAM kit or a drive.
- [ ] **The answer.** A Part is compatible unless the Build with it has a Compatibility Problem that names it. A Compatibility Warning or an unchecked rule never makes a Part incompatible, and a Problem the Build already had that does not name the Part leaves it compatible.
- [ ] **Written once.** The answer is read from judging the Build with the Part; no rule is judged a second way for it.
- [ ] The library's tests are written before the code, and they prove each of these:
  - a motherboard whose socket differs from the Build's CPU's is not compatible, and one whose socket matches is, though the Build's own motherboard makes a Problem with that CPU;
  - a RAM kit is added with a quantity of one: with a board of two slots and a kit of two modules in the Build, another kit of two modules is not compatible;
  - a PSU that brings only rule 11's Warning, the adapter, is compatible;
  - a GPU whose length is missing, which leaves rule 9 unchecked, is compatible;
  - a RAM kit of the board's type is compatible with a Build whose CPU and board already differ in socket;
  - a Part that makes a Problem is not compatible, and the answer agrees with judging the Build with the Part.
- [ ] Shown once and then reverted, failing its own test: a Warning making a Part incompatible.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault check are recorded under Comments.
- [ ] The work is committed, leaving `pnpm check` passing.
