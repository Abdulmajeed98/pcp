# 02: The library judges a Build: its seam, its public face and rules 1 to 7

**Spec:** [the compatibility spec](../spec.md)

**What to build:** The tracer bullet. `@pcp/compatibility` gets its test seam, the one the owner added on 7 November 2026, and its public face, and the first seven Compatibility Rules, the ones between a CPU, its cooler, its motherboard, its RAM and its case. Given a Build, the library answers the outcome of every rule that applies to it, in rule order, naming the Parts each outcome is about. A rule is unchecked only when a missing needed specification could change its outcome, and an unchecked rule is never passed. No caller uses the library yet: its tests are the proof, written before the code.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] **The words.** CONTEXT.md gains two terms under Shoppers and builds, before any code uses them, each with the words to avoid. **Compatible**: said of a Part and a Build, when adding the Part to the Build would cause no Compatibility Problem; a Compatibility Warning or an unchecked rule does not make a Part incompatible (CMP-4). **Estimated power draw**: what a Build is reckoned to draw, its CPU's TDP plus its GPU's TDP, none without a GPU, plus 100 W for everything else (CMP-5). The wording may be bettered; the meaning is CMP-4's and CMP-5's.
- [ ] **The seam.** Jest, as `core` has it: the workspace's Jest preset with SWC, a `test` target that `pnpm check` runs, the tests under the library's own `src/test`, and the test files' eight lint rules. The tests use Jest's globals and import nothing from Jest or any other package, since the library's ban on npm packages covers its test files. A helper that asserts is named in the lint rules' list of assertions. What the seam tests, and what it never does, is written where its tests live.
- [ ] **The Build as the rules read it.** At most one each of CPU, CPU cooler, motherboard, GPU, case and PSU, and any number of RAM kits and drives, each with its quantity, at least one. Each Part carries an identifier the caller gives and its needed specifications in OpenDB's names and nesting, as the catalog holds them, with each one the catalog counts as missing left out. The library holds no copy of the catalog's rule for what is missing: a value it is given is known, and a value it is not given is missing.
- [ ] **Judging a Build.** The library answers the outcome of every rule that applies (CMP-2), in rule order: the rule's number, its outcome (it passes, a Compatibility Problem, a Compatibility Warning, or unchecked), and the Parts it is about. For a Problem or a Warning those are the Parts whose values make it, every counted kit among them for a rule that counts. For an unchecked rule they are each Part whose missing needed specification could change the outcome, with that specification's path.
- [ ] **Unchecked only when it matters.** A missing value is taken to be any value its specification could hold, 0 among them. One outcome per rule: a Problem when the values present prove one; otherwise unchecked when a missing value could still change the outcome; otherwise a Warning or a pass, as the values say.
- [ ] **Each rule stated once**, with its number, the Categories it involves, the specifications it reads in each and its judgment. From those statements the library answers each Category's needed specifications by their paths; the API reads them in ticket 06.
- [ ] **Rules 1 to 7**, as the spec's table reads OpenDB's values: rule 1's "2 x \<socket\>" boards take a CPU of that socket and its "Integrated …" boards make any CPU a Problem; rules 3 and 4 judge each RAM kit; rules 5 and 6 count every kit's modules, and their capacity, times the kit's quantity; rule 7 fits a Thin Mini-ITX board where Mini-ITX fits and a Flex ATX board where Micro ATX fits.
- [ ] The library's tests are written before the code, and they prove each of these:
  - for each of rules 1 to 7, every outcome it can have: it passes, it finds a Compatibility Problem, and it is unchecked;
  - rule 1's dual-socket boards and its boards with a CPU built in, an "Integrated …" board making a Problem of a CPU whose own socket is missing;
  - rule 7's Thin Mini-ITX and Flex ATX boards;
  - two of one kit count as two kits' modules and capacity in rules 5 and 6, as many modules as the board's slots pass and one more does not, and as much memory as the board's maximum passes and one more GB does not;
  - a Build without the Parts a rule involves gets no outcome for it, and an empty Build gets none at all;
  - unchecked only when it matters: of two kits, one whose type is missing and one whose known type the board does not take make a Problem naming the known kit and the board, while two kits of which the known one fits leave rule 4 unchecked, naming the other kit and its type; and a board whose slots are missing leaves rule 5 unchecked whatever the kits hold;
  - each outcome names the Parts it is about by the identifiers the caller gave.
- [ ] Shown once and then reverted, each failing its own test: a missing socket read as a pass in rule 1; a kit's quantity ignored in rule 5.
- [ ] `pnpm boundaries:check`, run on its own since the library gains a target and test files, passes.
- [ ] `pnpm check` passes with Docker stopped, the library's tests among it.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
