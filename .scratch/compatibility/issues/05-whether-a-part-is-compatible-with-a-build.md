# 05: Whether a Part is compatible with a Build

**Spec:** [the compatibility spec](../spec.md)

**What to build:** The library answers whether a Part is compatible with a Build (CMP-4), the question `builder`'s picker will ask of every Part it might show, so that it hides only the Parts that would cause a Compatibility Problem (BLD-3). The answer comes from judging the Build with the Part, through the same rules, so the picker and the Build page can never disagree. The tests are the proof, written before the code.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] **Where the Part goes.** It replaces the Build's Part of its Category for the six Categories a Build holds one of, and is added beside the Build's others, with a quantity of one, when it is a RAM kit or a drive.
- [x] **The answer.** A Part is compatible unless the Build with it has a Compatibility Problem that names it. A Compatibility Warning or an unchecked rule never makes a Part incompatible, and a Problem the Build already had that does not name the Part leaves it compatible.
- [x] **Written once.** The answer is read from judging the Build with the Part; no rule is judged a second way for it.
- [x] The library's tests are written before the code, and they prove each of these:
  - a motherboard whose socket differs from the Build's CPU's is not compatible, and one whose socket matches is, though the Build's own motherboard makes a Problem with that CPU;
  - a RAM kit is added with a quantity of one: with a board of two slots and a kit of two modules in the Build, another kit of two modules is not compatible;
  - a PSU that brings only rule 11's Warning, the adapter, is compatible;
  - a GPU whose length is missing, which leaves rule 9 unchecked, is compatible;
  - a RAM kit of the board's type is compatible with a Build whose CPU and board already differ in socket;
  - a Part that makes a Problem is not compatible, and the answer agrees with judging the Build with the Part.
- [x] Shown once and then reverted, failing its own test: a Warning making a Part incompatible.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault check are recorded under Comments.
- [x] The work is committed, leaving `pnpm check` passing.

## Comments

### 8 November 2026: whether a Part is compatible with a Build

**Commits.** `40e20d8` adds `isCompatible`, its tests and its lines in the library's entry file. `304d123` merges `compatibility/integration`, which had gained ticket 04's rules 13 to 21, with no conflict. `ba795ed` adds a drive's two tests, which needed rules 13 to 16 to show where a drive goes. Each was gated on `pnpm check`. This record follows.

**The public face.** `isCompatible(category, part, build)` answers `true` when the Part is compatible with the Build and `false` when it is not. The Category is the Build's key for it, `cpu` to `psu`, and the Part is `{ id, specifications }`, a RAM kit or a drive without its quantity, typed by its Category through `PartOf<C>`, which the entry file exports beside it. Of several Categories, `PartOf` is a Part of any of them, so a caller that holds its Category as a `Category` and not as one key, as the tests' table does, can still type its Parts. Written first as a conditional type, it made `PartOf<Category>` a Part with no possible specifications, and the table's rows did not compile until it became a mapped type indexed by the Category.

**Where the Part goes.** In `src/is-compatible.ts`, one entry for each Category, which the type check asks for: the Part in place of the Build's Part of its Category for the six Categories a Build holds one of, and beside the Build's others, with a quantity of one, for a RAM kit or a drive. The quantity is one whatever the Part carries. A kit or a drive the Build already holds is counted once more, and an outcome about it then names its identifier twice, as ticket 02 noted; the answer asks only whether the identifier is among the Parts named.

**The answer, written once.** `isCompatible` judges the Build with the Part through `judgeBuild` and answers that the Part is not compatible when an outcome is a Compatibility Problem whose Parts include the Part's identifier. It judges no rule itself. A Compatibility Warning or an unchecked rule never makes a Part incompatible, and a Problem the Build already had that does not name the Part leaves it compatible. The rest follows from what each rule names, as tickets 03 and 04 noted, and is not tested here: rule 12 never names a GPU whose TDP is missing; a drive of a kind a rule does not count, or whose kind is missing, is never named by that rule's Problem; and rule 20's Problem names the PSU alone, so a motherboard stays compatible with a Build whose PSU has no EPS connector. A rule that counts names every Part it counts by a known value, so in a Build that already has such a Problem, more modules than slots or a PSU too weak for the CPU alone, every kit whose modules are known, or every GPU whose TDP is known, is not compatible until the Problem is fixed, since each would add to it, while one whose value is missing stays compatible. A throwaway test confirmed this once for rules 5 and 12, and was deleted.

**Test first.** 16 tests in `src/test/is-compatible.spec.ts`, in six groups: a motherboard in place of the Build's, a RAM kit beside the Build's kits, a drive beside the Build's drives, a Problem the Build already had, a Warning or an unchecked rule, and a Part that makes a Problem. The last is a table of one row for each of the six Categories a Build holds one of, each asserting that the Part is not compatible and that judging the Build with it finds the Problem, naming it, both written out and not worked out the way the code does. The library has 253 tests in 25 files, all passing. 5 were seen failing before their code, each on its assertion:

- the motherboard whose socket differs from the CPU's, first with a TypeError, since `isCompatible` did not exist yet, and then, with a stub on the library's face that answered every Part compatible, receiving `true` for `false`. Its code judged the Build with the Part in place, a kit or a drive then taking the place of the Build's, and answered compatible only when every outcome passed;
- the GPU whose length is missing, receiving `false` for `true`, since rule 9's unchecked outcome counted against it; an unchecked rule stopped counting;
- the PSU with rule 11's Warning, receiving `false` for `true`, since the Warning counted; only a Problem counted then;
- the kit of two modules beside a kit of two on a board of two slots, receiving `true` for `false`, since the kit took the place of the Build's kit; a kit or a drive went beside the Build's others;
- the kit of the board's type in a Build whose CPU and board differ in socket, receiving `false` for `true`, since rule 1's Problem counted though it did not name the kit; only a Problem naming the Part counted then.

The other 11 passed when written, since code that an earlier failing test brought already gave them: the board whose socket matches, which the first test's code already put in place of the Build's own; the kit that fills four slots exactly and the kit the Build already holds; the table's six rows; and a drive's two tests, written after the merge, since before it no rule read a drive, and a drive's entry had come with the first commit. The faults below show 5 of them failing.

**Faults shown once and then reverted.** Each planted with one exact edit on committed work and taken out by the inverse edit, with `git status` clean and the library's tests passing after each, the first four after `40e20d8` and the last two after `ba795ed`:

- A Warning making a Part incompatible, the ticket's fault: in `is-compatible.ts`, `outcome.outcome === 'problem'` made `(outcome.outcome === 'problem' || outcome.outcome === 'warning')`. "leaves compatible a PSU that brings only rule 11's Warning, for the adapter" failed, receiving `false` for `true`, and no other test.
- A kit added with a quantity of two: `{ ...kit, quantity: 1 }` made `{ ...kit, quantity: 2 }`. "is compatible when a kit of two modules joins a kit of two on a motherboard's four slots" failed, receiving `false` for `true`, and no other.
- A kit the Build already holds taken in place of itself: the Build's kits filtered of the Part's identifier before the kit joined them. "counts a kit the Build already holds once more" failed, receiving `true` for `false`, and no other.
- A PSU put in the GPU's place: `({ ...build, psu })` made `({ ...build, gpu: psu })`. The table's row "a PSU below 1.3 times the estimated power draw" failed, receiving `true` for `false`, and no other: the PSU's Warning test still passed, since a PSU alone in the GPU's place makes no rule apply. The type check accepted the fault, since a PSU's specifications and a GPU's share `length` and are all optional, so only the table's rows catch a Part put in another Category's place.
- A drive put in place of the Build's drives: `[...(build.storage ?? []), { ...drive, quantity: 1 }]` made `[{ ...drive, quantity: 1 }]`. "is not compatible when a SATA drive joins a SATA drive on a motherboard's one SATA port" failed, receiving `true` for `false`, and no other.
- A drive added with a quantity of two: `{ ...drive, quantity: 1 }` made `{ ...drive, quantity: 2 }`. "is compatible when a SATA drive joins a SATA drive on a motherboard's two SATA ports" failed, receiving `false` for `true`, and no other.

**Checks.** `pnpm boundaries:check`, run on its own since the library gains a test file, passes on all 128 lines, the library's three among them, and left nothing planted. `pnpm check --skip-nx-cache` passes on the final tree, 32 tasks, the library's tests among them, with every `*.tsbuildinfo` outside `node_modules` deleted first, `DOCKER_HOST` pointed at a socket that does not exist and `PLAYWRIGHT_BROWSERS_PATH` at an empty folder, as earlier tickets stood in for Docker stopped; Docker itself was left running for the owner's services and the other worktrees. No file of the API changed, so `pnpm integration:check` was not run.

**For the next tickets.**

- `builder`: the picker asks `isCompatible(category, part, build)` of each Part it might show, handing the Part through the catalog's rule for what is missing, as it hands the Build's own Parts. The Part's identifier is its Part's identifier, the one the Build uses for the same Part, since the answer reads whether a Problem names it: a kit or a drive the Build already holds is then counted once more, as adding one more of it would be.
- Ticket 08 records `isCompatible` and `PartOf` among the library's public face, where the Part goes, and that the answer is read from `judgeBuild` alone.
