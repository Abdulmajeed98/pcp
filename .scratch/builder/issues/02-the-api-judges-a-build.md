# 02: The API judges a Build: every rule's outcome and the Estimated power draw

**Spec:** [the builder spec](../spec.md)

**What to build:** Reading a Build now answers the outcome of every Compatibility Rule that applies to it, and its Estimated power draw. The API hands each stored Part to `@pcp/compatibility` with its needed specifications. It leaves out every value the catalog counts as not known, so that the library never takes a missing value for a real one. That function is written here once, and ticket 04's picker uses it. A Shopper page will show these outcomes in ticket 08. For now the integration tests prove that the library's answers reach the API's surface whole, from Parts as the catalog stores them.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] **Handing a stored Part to the rules.** The API reads each Part's needed specifications, the paths `neededSpecificationsOf` answers for its Category, from its document. It leaves out each value its Specification list counts as missing through `Specification.isMissingIn`, a field of a row (such as a PCIe slot's lanes) included. A RAM kit and a drive carry their quantity. The function is written once in the API and holds no copy of the catalog's rule for what is missing. The compatibility module's conventions leave it to this module.
- [ ] **The outcomes.** The answer gains every outcome `judgeBuild` gives, passes included, in rule order. Each has its rule's number and its outcome, `passes`, `problem`, `warning` or `unchecked`. A Problem, a Warning or a pass names its Parts by their identifiers. An unchecked rule names each missing specification by its Part, its path and its English label from the Part's Specification list, so that the Shopper app can name it in English (LANG-3). A rule that does not apply answers nothing (CMP-2).
- [ ] **The Estimated power draw**, as `estimatedPowerDrawOf` answers it: the watts, the Parts whose TDP is missing, or none for a Build without a CPU (CMP-5). No API code adds a TDP itself.
- [ ] **Every Part is judged**, a Part that is no longer visible and an Unstocked Part among them, since they stay in the Build until the Shopper removes them.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` gains these tests, written before the code, and passes. They prove the wiring on made-up Parts with the specifications each test needs. They do not prove each rule again, which the library's own tests do.
  - A CPU and a motherboard of different sockets answer rule 1 as a Problem naming both, and of the same socket as a pass.
  - A GPU with a 12V-2x6 socket and a PSU with 6+2-pin connectors but no such cable answer rule 11 as a Warning.
  - A needed specification stored as 0 where 0 means "not known", made with `keepSpecificationsAsTheyAre`, is answered as missing by its path and English label, and its rule is unchecked. A specification the Part does not hold does the same.
  - A PCIe slot stored with no lanes leaves rule 8 unchecked when the Build has a GPU, so a field of a row reaches the rules as missing.
  - Two of one RAM kit are counted twice by rule 5: a quantity reaches the rules.
  - A Build with no case answers no outcome for rules 7, 9, 10, 15, 17, 18, 19 and 21.
  - The Estimated power draw is the CPU's TDP plus the GPU's plus 100 W, or the CPU's plus 100 W without a GPU. A missing TDP is named, and a Build without a CPU answers none.
  - A Part whose only Vendor is deactivated is still judged.
- [ ] Each of these faults is planted once and then reverted, and each fails its own test: a stored 0 handed to the rules as a value; a kit's quantity left out; the passes left out of the answer; a missing specification answered without its label.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
