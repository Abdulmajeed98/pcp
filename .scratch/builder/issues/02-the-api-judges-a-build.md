# 02: The API judges a Build: every rule's outcome and the Estimated power draw

**Spec:** [the builder spec](../spec.md)

**What to build:** Reading a Build now answers the outcome of every Compatibility Rule that applies to it, and its Estimated power draw. The API hands each stored Part to `@pcp/compatibility` with its needed specifications. It leaves out every value the catalog counts as not known, so that the library never takes a missing value for a real one. That function is written here once, and ticket 04's picker uses it. A Shopper page will show these outcomes in ticket 08. For now the integration tests prove that the library's answers reach the API's surface whole, from Parts as the catalog stores them.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] **Handing a stored Part to the rules.** The API reads each Part's needed specifications, the paths `neededSpecificationsOf` answers for its Category, from its document. It leaves out each value its Specification list counts as missing through `Specification.isMissingIn`, a field of a row (such as a PCIe slot's lanes) included. A RAM kit and a drive carry their quantity. The function is written once in the API and holds no copy of the catalog's rule for what is missing. The compatibility module's conventions leave it to this module.
- [x] **The outcomes.** The answer gains every outcome `judgeBuild` gives, passes included, in rule order. Each has its rule's number and its outcome, `passes`, `problem`, `warning` or `unchecked`. A Problem, a Warning or a pass names its Parts by their identifiers. An unchecked rule names each missing specification by its Part, its path and its English label from the Part's Specification list, so that the Shopper app can name it in English (LANG-3). A rule that does not apply answers nothing (CMP-2).
- [x] **The Estimated power draw**, as `estimatedPowerDrawOf` answers it: the watts, the Parts whose TDP is missing, or none for a Build without a CPU (CMP-5). No API code adds a TDP itself.
- [x] **Every Part is judged**, a Part that is no longer visible and an Unstocked Part among them, since they stay in the Build until the Shopper removes them.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` gains these tests, written before the code, and passes. They prove the wiring on made-up Parts with the specifications each test needs. They do not prove each rule again, which the library's own tests do.
  - A CPU and a motherboard of different sockets answer rule 1 as a Problem naming both, and of the same socket as a pass.
  - A GPU with a 12V-2x6 socket and a PSU with 6+2-pin connectors but no such cable answer rule 11 as a Warning.
  - A needed specification stored as 0 where 0 means "not known", made with `keepSpecificationsAsTheyAre`, is answered as missing by its path and English label, and its rule is unchecked. A specification the Part does not hold does the same.
  - A PCIe slot stored with no lanes leaves rule 8 unchecked when the Build has a GPU, so a field of a row reaches the rules as missing.
  - Two of one RAM kit are counted twice by rule 5: a quantity reaches the rules.
  - A Build with no case answers no outcome for rules 7, 9, 10, 15, 17, 18, 19 and 21.
  - The Estimated power draw is the CPU's TDP plus the GPU's plus 100 W, or the CPU's plus 100 W without a GPU. A missing TDP is named, and a Build without a CPU answers none.
  - A Part whose only Vendor is deactivated is still judged.
- [x] Each of these faults is planted once and then reverted, and each fails its own test: a stored 0 handed to the rules as a value; a kit's quantity left out; the passes left out of the answer; a missing specification answered without its label.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 8 November 2026: judging a Build, the Estimated power draw and the fault checks

**Handing a stored Part to the rules.** `partForTheRules(part)` and `buildForTheRules(build)`, in `apps/api/src/app/domain/build/parts-for-the-rules.ts`, are the function the compatibility module's conventions leave to `builder`; ticket 04 imports both, the first for each candidate and the second for the Build so far. `partForTheRules` gives the library's `{ id, specifications }`, typed `PartOf<CategoryKey>`, and `buildForTheRules` puts each Part under its Category's key and each RAM kit and drive in a list in the Build's order with its quantity.

- The specifications are `SpecificationList.neededHeldIn(document)`: the list's `getNeeded()`, the paths `neededSpecificationsOf` answers, each read with `valueAt` and handed through `Specification.heldIn(value)`. That gives nothing for a value `isMissingIn` counts as missing, the value as it is otherwise, and, for a list of rows, each row with only the fields their own `heldIn` keeps. So no copy of the catalog's rule for what is missing is written: a field of a row is judged by its own `Specification`, as the Part page's `labelled` judges it.
- Two readings no test reaches, since the catalog's checks never keep them, are written so that a document changed by hand cannot crash the library: something stored for a list of rows that is not a list is lacked, and a row that is not a row holds no field, so the rule is unchecked rather than passed.
- The specifications are typed for the library by one cast, in `partForTheRules`, as the catalog checked them when they were kept: each value of a fixed set is one of its set.

**The outcomes.** `judgmentOf(build)`, in `domain/build/judgment.ts`, judges `buildForTheRules(build)` once with `judgeBuild` and labels each missing specification from its Part's Specification list, through `SpecificationList.labelsAt(path)`. The answer's `outcomes` are `RuleOutcomeResponse`s, one flat shape for the four outcomes, as the API's answers are written: `rule`, `outcome` (`passes`, `problem`, `warning` or `unchecked`), `parts`, the identifiers, empty for an unchecked rule, and `missing`, empty unless it is unchecked. Each missing specification is `BuildMissingSpecificationResponse`: `part`, `path`, `label` and `fieldLabel`.

- **A choice the ticket left open: a field of a row has two labels.** The library names a row's missing field by a path such as `pcie_slots.1.lanes`. Its `label` is the list's, "PCIe slots", as Missing specifications names the list, and `fieldLabel` is the field's, "Lanes"; `fieldLabel` is null for any other specification. Neither alone tells a Shopper what is missing ("Lanes" says nothing of where, and "PCIe slots" says the board lacks slots it has), and the API writes no English joining the two: ticket 08 words them, as the Part page's `specificationText` words a row from its fields' labels.
- A path the lists do not hold would be labelled by itself. None can be: the Categories endpoint's test proves every needed path is on its list, and every field a rule reads in a row is one of its list's fields.

**The Estimated power draw** is `estimatedPowerDrawOf(buildForTheRules(build))`, answered as `estimatedPowerDraw`: `{ watts, missing }`, the watts with no missing TDP, or null watts with each missing TDP labelled as an unchecked rule's are; null for a Build without a CPU. No API code adds a TDP.

**Every Part is judged.** `judgmentOf` reads the Build as `BuildReading` gives it, every Part the catalog holds whether or not it is a Visible Part, and ticket 03's prices play no part in it.

**The tests**, 12 new in `apps/api/src/test/infrastructure/build/endpoints/build.controller.integration-spec.ts` and the empty Build's test extended, 42 in the file. They were written one slice at a time, each before its code, and the reason each failed was read:

| Test | First run |
|---|---|
| An empty Build answers no outcome and no Estimated power draw | Red: no `outcomes`, and later no `estimatedPowerDraw`, in the answer |
| Rule 1: a Problem naming both for two sockets, a pass naming both for one | Red: no `outcomes` in the answer |
| A GPU's length stored as 0 with `keepSpecificationsAsTheyAre` | Red: rule 9 passed on the stored 0 |
| A GPU's length not held | Red: the missing length answered with no label |
| A PCIe slot's lanes stored as 0, beside a GPU | Red: rule 8 a Problem on the stored 0 |
| A PCIe slot's lanes not held | Red: labelled by its path, with no field label |
| Rule 11's Warning for a 12V-2x6 socket and a PSU with 6+2-pin connectors only | Passed: the wiring of the first slice already carried it |
| Without a case, rules 1 to 6, 8, 11 to 14, 16 and 20 in rule order; with one, all 21 | Passed, as above |
| A CPU whose only Vendor was deactivated and a board only out of stock are still judged | Passed: the Store reads every Part a Build names |
| Two of a kit of two modules on a board of two slots: a pass for one, a Problem for two | Passed: `buildForTheRules` carried each quantity from the first slice, which was more than that slice needed; the fault check below proves the test |
| The draw: 65 + 220 + 100 W, and 65 + 100 W without a GPU; a missing CPU TDP and a stored 0 GPU TDP named; none without a CPU | Red: no `estimatedPowerDraw` in the answer |

**The fault checks**, each planted by one exact edit on `af75fbb` by a script that refused a dirty tree, ran the test file and reverted by the inverse edit; `git status` was clean after each:

| Fault | Edit | Failed |
|---|---|---|
| A stored 0 handed to the rules as a value | `heldIn`'s `if (this.isMissingIn(value))` to `if (this.isMissingIn(value) && value !== 0)` in `Specification.ts` | 3 of 42: the stored 0 length (rule 9 passed), the stored 0 lanes (rule 8 a Problem) and the draw's stored 0 TDP (the GPU's no longer named) |
| A kit's quantity left out | `{ ...part, quantity }` to `{ ...part, quantity: 1 }` in `parts-for-the-rules.ts` | 1 of 42: two of the kit passed rule 5 |
| The passes left out of the answer | `judgeBuild(judged).map(` given a `.filter` of `outcome !== 'passes'` first, in `judgment.ts` | 4 of 42: rule 1's pass, rule 10's pass beside each unchecked rule 9, and rule 5's pass |
| A missing specification answered without its label | `labels?.label ?? path` to `path` in `judgment.ts` | 5 of 42: every test naming a missing specification, its label answered as its path |

**The pieces.** Each commit was gated on `pnpm check` and `pnpm integration:check` (21 suites; 587 tests after the first, 590 after the second):

- `da78e98` feat: answer every rule's outcome when a Build is read
- `af75fbb` feat: answer a Build's Estimated power draw

**With Docker stopped.** Both commits passed `pnpm check --skip-nx-cache` in a fresh clone in the scratchpad, after `pnpm install --frozen-lockfile --offline`, with `DOCKER_HOST` pointed at a socket that does not exist and `PLAYWRIGHT_BROWSERS_PATH` at an empty folder: 32 tasks succeeded each time. The owner's services stayed up, so Docker itself was not stopped.
