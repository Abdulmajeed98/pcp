# 03: The GPU and power: rules 8 to 12 and the estimated power draw

**Spec:** [the compatibility spec](../spec.md)

**What to build:** The library judges the GPU against the motherboard, the case and the PSU, and the PSU's wattage against the Build's estimated power draw. Rule 11 is the first rule that can give a Compatibility Warning: a GPU with a 12VHPWR or 12V-2x6 socket and a PSU without that cable but with 6+2-pin connectors works only with the adapter that usually comes with the GPU. The library also answers a Build's estimated power draw (CMP-5), so that no Shopper code adds up a TDP. The tests are the proof, written before the code.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] **Rules 8 to 12**, as the spec's table reads OpenDB's values:
  - rule 8: a Problem when no row of the board's PCIe slots has 16 lanes; an empty list of slots is a value, the board has none; a row with no lanes is unknown;
  - rule 9: the GPU's length against the case's longest GPU, in millimetres, equal fitting;
  - rule 10: the slots the GPU occupies, which may be a fraction such as 2.5, against the case's expansion slots, more than the case has being a Problem;
  - rule 11: as the MVP spec's rule notes say, with the GPU's 6-pin and 8-pin sockets counted together against the PSU's 6+2-pin connectors, and a 12V-2x6 socket and a 12VHPWR socket both taking the PSU's 12VHPWR cable;
  - rule 12: the PSU's wattage below 1.3 times the estimated power draw, compared in whole numbers, ten times the wattage against thirteen times the draw.
- [x] **The estimated power draw**, for a Build with a CPU: the CPU's TDP plus the GPU's TDP, 0 W without a GPU, plus 100 W. It is not known when a TDP it needs is missing, and rule 12 is then unchecked.
- [x] The library's tests are written before the code, and they prove each of these:
  - for each of rules 8 to 12, every outcome it can have, and for rule 11 its Compatibility Warning;
  - a GPU exactly as long as the case allows fits, and one a tenth of a millimetre longer does not;
  - a 2.5-slot GPU fits a case with three expansion slots and not one with two;
  - a PSU of exactly 1.3 times the estimated power draw passes, and one a watt less does not;
  - rule 11's sockets: a 6-pin and an 8-pin socket need two 6+2-pin connectors; a 12VHPWR socket passes with the PSU's 12VHPWR cable; without the cable but with a 6+2-pin connector it is a Warning; with neither, a 0 given to the library directly, it is a Problem; a 12V-2x6 socket reads as a 12VHPWR one; and without the cable, the PSU's 6+2-pin count missing leaves the rule unchecked, since it could make a Problem or a Warning;
  - rule 8's board with no 16-lane row and its board with an empty list of slots are Problems; a board with a row of unknown lanes and no 16-lane row is unchecked; a board with a 16-lane row passes whatever its other rows hold;
  - the estimated power draw counts 0 W for a Build without a GPU, is unknown when the GPU's TDP is missing, and rule 12 does not apply to a Build without a CPU.
- [x] Shown once and then reverted, each failing its own test: rule 9's comparison turned from `>` to `>=`, failing the GPU exactly as long as the case allows; rule 11's adapter answered as a Problem, failing its Warning.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 8 November 2026: the GPU and power

**Commits.** `ef6485c` gives a rule its Compatibility Warning, with rule 11, in a commit of its own so that ticket 04's rules 15 and 20 can reuse it. `915d8bb` adds rule 8, `da839ea` rules 9 and 10, and `feac356` rule 12 and the estimated power draw. `92670e0` merges `compatibility/integration`, which had gained rule 1's Narrow boards. Each was gated on `pnpm check`. This record follows.

**The Warning.** A judgment is `problemWhen(problem, { warningWhen })`, and a rule that gives no Warning leaves the second finding out. `outcomeOf`, in `judge-build.ts`, answers a Problem when the Problem's finding holds; otherwise unchecked when either finding is open, naming the missing values of both, each once; otherwise a Warning, naming the Parts whose values make it, or a pass. So a Warning's finding need not leave out its Problem's: a GPU with two 8-pin sockets and a 12VHPWR socket, on a PSU with one 6+2-pin connector and no 12VHPWR cable, is a Problem, though the adapter's Warning holds too, and a test proves it.

**The findings it gained**, in `src/rules/findings.ts`. `exceeds` compares an amount, a value a Part holds or a plain number, on either side, so a limit may be an amount, and `exceeds(count, 0)` asks whether there is any. `times` multiplies an amount by a plain number. `and` and `or` join findings, `and` deciding on a finding that does not hold whatever the others lack. `equals` compares a value with one given, a missing value leaving it open. `someRow` judges the rows of a list at one field, naming a row's missing field by the list's path, the row's place and the field, `pcie_slots.1.lanes`, as the API names it; an empty list holds no row, and a missing one leaves the finding open, naming the list. `theBuildHolds(part)` puts a Part whose values a rule does not read in its Problem: rule 8's GPU. `missingIn` names the missing values of several findings once.

**A Category read when held.** Rule 12 reads the GPU's TDP and applies without a GPU. A statement may now name `readsWhenHeld: { gpu: ['tdp'] }` beside `involves`. Its judgment is handed the GPU, or `undefined` when the Build holds none; whether the rule applies is still read from `involves` alone; its outcomes name the GPU when it is held, in the catalog's order of Categories; and `neededSpecificationsOf` reads those paths after the rule's own, so a GPU's `tdp` is needed.

**The estimated power draw.** The library's face gains `estimatedPowerDrawOf(build)` and its type, `EstimatedPowerDraw`. For a Build with a CPU it answers `{ known: true, watts }`, the CPU's TDP plus the GPU's, 0 W without a GPU, plus 100 W; or `{ known: false, missing }`, naming each missing TDP by its Part and path; and for a Build without a CPU, `undefined`. Rule 12 compares the same draw, `drawOf` in `src/estimated-power-draw.ts`, as an amount, so a TDP is added up in one place.

**Rules 8 to 12, as the spec's table reads them.**

- Rule 8 involves the GPU and reads none of its values, and its Problem names the board and the GPU. A row of 16 lanes is a 16-lane slot; no imported row has more (7,070 rows, 6 of them without lanes, read from the development database on 8 November 2026, imported Parts only). An empty list of slots is a Problem; a missing list leaves the rule unchecked, naming `pcie_slots`; a row without lanes, and no 16-lane row beside it, leaves it unchecked, naming that row's lanes; and a 16-lane row passes whatever the others hold.
- Rules 9 and 10 compare the GPU's length with the case's longest GPU and the slots it occupies with the case's expansion slots, equal fitting, each through `exceeds`. A fraction is compared as it is: a 2.5-slot GPU fits three slots and not two.
- Rule 11 counts the GPU's 6-pin and 8-pin sockets together against the PSU's 6+2-pin connectors, and reads a 12V-2x6 socket as a 12VHPWR one. Its two clauses on those sockets read whether the GPU has one, as the rule notes word them, not how many. 4 imported GPUs hold two between the two kinds: two RTX 5070 Ti cards, the ASUS ProArt OC and the MSI VENTUS 3X OC, list their one socket under both kinds, and counting would make a false Problem of them with a PSU of one 12VHPWR cable; the GALAX HOF RTX 4090 and the MSI RTX 5090 LIGHTNING Z carry two, and pass with a PSU of one cable. 39 imported PSUs have two cables or more.
- Rule 12 compares ten times the PSU's wattage with thirteen times the draw. With a TDP missing, the draw is not known and rule 12 is unchecked, naming it, unless the PSU is too weak even with the missing TDP taken as 0: then the known values prove a Problem, as the spec's "unchecked only when it matters" has it. A 125 W CPU on a 250 W PSU is a Problem whatever its GPU draws, naming the CPU and the PSU.

**Test first.** 48 tests in `rules/rule-08.spec.ts` to `rule-12.spec.ts` and `estimated-power-draw.spec.ts`, and `needed-specifications.spec.ts` gains the paths of rules 8 to 12 in rule order, the GPU's `tdp` after its sockets. The library's 117 tests in 15 files pass on the merged tree. 15 were seen failing before their code, each on its assertion: the first test of each rule, with no outcome for it; rule 11's Problem with neither the cable nor a 6+2-pin connector and its Warning, each received as a pass, and the same two for a 12V-2x6 socket; rule 8's Problem, which named no Part, and its missing list and its row without lanes, each received as a Problem; rule 12's PSU of exactly 1.3 times and of a watt less, with the GPU neither counted nor named; and the draw's first test, once a stub on the library's face answered nothing, since calling the function before it existed failed with a TypeError. The GPU's `tdp` among the needed specifications was written before its test, so its line in `needed-specifications.ts` was taken out, the test seen failing without it, and the line put back. The other 33 passed when written, since the code written for earlier tests, and ticket 02's amounts, already gave them: rule 11's Problem with one connector, its two passes with the cable, its two unchecked tests, its six of "unchecked only when it matters" and its Problem before the Warning; rule 8's empty list and its 16-lane row among others; all of rules 9 and 10 but the first; rule 12's two of a Build without a GPU, its three unchecked, its Build without a CPU and its Problem proven without the GPU's TDP; and all of the draw's but the first. The faults below show several of them failing.

**Faults shown once and then reverted.** Each planted with one exact edit on committed work and taken out by the inverse edit, with `git status` clean and the library's tests passing after each:

- Rule 9's comparison turned from `>` to `>=`, after `da839ea`. Rule 9 compares through `exceeds`, which every rule that counts shares, so the fault was its `counted.least > bound.most` made `>=`. "passes a GPU exactly as long as the case allows" failed, receiving `problem` for `passes`. 12 more failed with it: the exact limits of rules 5, 6 and 10, and nine of rule 11's tests, since the fault made two sockets too many for two connectors and made "more than none" hold of none.
- Rule 11's adapter answered as a Problem, after `da839ea`: in `rule-11.ts`, the Problem's `and(lacksTheCable, not(exceeds(connectors, 0)))` made `lacksTheCable`. "finds a Warning without the cable but with a 6+2-pin connector, for the adapter" failed, receiving `problem` for `warning`; so did the 12V-2x6 socket's Warning, and the 12VHPWR socket left unchecked when the 6+2-pin count is missing, which received `problem`.
- One more, since ticket 04's rules will rely on it: a Warning put before a Problem, after `92670e0`, in `judge-build.ts` `problem.holds === true` made `problem.holds === true && warning.holds !== true`. "finds a Problem, not a Warning, when the 6+2-pin connectors are too few for the GPU's 8-pin sockets" failed, receiving `warning` for `problem`, and no other test.

**Checks.** `pnpm check --skip-nx-cache` passes on the final tree, 32 tasks, the library's tests among them, with every `*.tsbuildinfo` outside `node_modules` deleted first, `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`, as earlier tickets stood in for Docker stopped; Docker itself was left running for the owner's services and the other worktrees. No file of the API changed, so `pnpm integration:check` was not run, and no project gained a target, so `pnpm boundaries:check` was not either.

**For the next tickets.**

- Ticket 04 states rules 15 and 20 with `problemWhen(problem, { warningWhen })`. The Problem comes first, so the Warning's finding need not leave it out: rule 20 can be `problemWhen(not(exceeds(eps, 0)), { warningWhen: exceeds(sockets, eps) })`. `exceeds` takes an amount as its limit, such as rule 13's SATA 6 Gb/s and 3 Gb/s ports added with `total`. `someRow` asks whether some row holds; rule 14 counts slots, so it needs a form that counts rows by a field.
- Ticket 04 meets this branch in `rules.ts`, `findings.ts` and `needed-specifications.spec.ts`. The PSU's needed paths now begin with rule 11's two connectors and rule 12's `wattage`, the case's with rules 9 and 10's two limits after rule 7's, and the motherboard's end with rule 8's `pcie_slots` before ticket 04's.
- Ticket 05: a Warning names the Parts whose values make it, as a Problem does, and makes no Part incompatible; rule 11's adapter Build is the one its PSU test needs. Rule 12 names the GPU in a Problem only when the GPU's TDP is known, so a GPU whose TDP is missing is never the Part that makes it.
- Ticket 06: `neededSpecificationsOf` reads `readsWhenHeld` too, and the API's table already holds the CPU's `specifications.tdp`, the GPU's `tdp` and the PSU's `wattage`.
- Ticket 08 records `estimatedPowerDrawOf`, the Warning's form and `readsWhenHeld` among the library's conventions.
