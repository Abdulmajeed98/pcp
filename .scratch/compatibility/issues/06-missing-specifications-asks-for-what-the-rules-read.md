# 06: Missing specifications asks for exactly what the rules read

**Spec:** [the compatibility spec](../spec.md)

**What to build:** The API's specification lists stop marking needed specifications by hand: a specification is needed when the library's statement of the rules names its path for its Category. The Categories endpoint, a Part's missing needed specifications and the Admin's Missing specifications list all read it so, and can no longer drift from the rules. The needed specifications stay what they are, with one addition: a CPU cooler's "Liquid cooled", which rule 17 reads to tell an air cooler from a liquid one. A cooler that lacks it now shows on Missing specifications once a Vendor offers it, and its form and page mark it as needed, as they mark every needed specification already.

**Blocked by:** 03, 04

**Status:** resolved

- [x] **Read from the rules.** No specification list marks a needed specification by hand. Whether a specification is needed is read from the library's statements, and every path the library names is in its Category's list.
- [x] **The table.** The Categories endpoint's test, which writes out the needed specifications from the MVP spec's table and does not read them from the platform, gains "Liquid cooled" for CPU coolers and passes. No other Category's needed specifications change.
- [x] `pnpm integration:check` gains these tests, written before the code, and passes:
  - a CPU cooler that lacks "Liquid cooled", once offered, is on Missing specifications with "Liquid cooled" among its missing needed specifications, read through the API as the Admin;
  - the same cooler's Part, read through the API, names the same path among its missing needed specifications;
  - the existing tests of Missing specifications and of a Part's missing needed specifications pass unchanged.
- [x] Shown once and then reverted, failing its own test: rule 17's reading of "Liquid cooled" taken out of its statement, which the Categories endpoint's table catches.
- [x] `pnpm integration:check` and `pnpm check` pass, `pnpm check` with Docker stopped.
- [x] The results of the fault check are recorded under Comments.
- [x] The work is committed in pieces, each leaving both checks passing.

## Comments

### 8 November 2026: the needed specifications, read from the rules

**Commits.** `324c20d` reads the needed specifications from the rules, with its tests. It changes the API and one end-to-end test, so it takes no scope. This record follows it.

**Where it is.** A `SpecificationList` takes its Category's key, typed as the library's `Category`, before its specifications, and keeps the paths `neededSpecificationsOf` answers for that Category. `getNeeded()` gives the list's specifications at those paths, in the list's order, and `isNeeded(specification)` answers for one of them. `Specification` lost its `needed` option, its field and `isNeeded()`, so no list can mark a needed specification by hand: a `{ needed: true }` fails the type check. Each of the eight lists names its key, as `new SpecificationList('cpuCooler', [...])`, and holds no mark. The Categories endpoint asks the list, through `SpecificationResponse.of(specification, needed)`, and answers `false` for each field of a row, since a rule that reads a list of rows names the list. A Part's missing needed specifications (`missingNeeded`) and Missing specifications (`ListPartsMissingSpecificationsQuery`) read `getNeeded()` as before, so neither changed but in a comment.

**What changes for the Admin.** As sets, the needed specifications are the ones the lists marked, with one addition, a CPU cooler's `water_cooled`, "Liquid cooled". The Categories endpoint marks it as needed, so a cooler's form and page mark it as they mark the others, and Missing specifications lists an offered cooler that lacks it. A Part's missing needed specifications are still in its list's order, a cooler's `cpu_sockets`, `water_cooled`, `height`. The OpenAPI document and the client did not change.

**Every path the library names is in its Category's list.** A path the statements name that the list lacks marks nothing, and the API still starts (ADR-0004: domain code never throws), as a filter whose path its list lacks is left out. The Categories endpoint's test proves that none is: its table, written out from the MVP spec's table with "Liquid cooled", holds as sets the paths the library's own `needed-specifications.spec.ts` holds, so a path the library names that its list lacks is missing from the endpoint's answer, and the test fails. The second fault below shows it.

**Tests, first.**

1. The Categories endpoint's test, in `category.controller.spec.ts`, gains `water_cooled` for CPU coolers in its table, and its comment says why. Run before the code, it failed on the cooler alone, whose needed specifications were `cpu_sockets` and `height`.
2. In `part.controller.missing-specifications.integration-spec.ts`, under "a CPU cooler that does not say whether it is liquid cooled", a made-up cooler with its sockets and its height and no "Liquid cooled", which a made-up Vendor offers: *is listed, once offered, with "Liquid cooled" missing*, its whole row read through the API as the Admin, `{ path: 'water_cooled', label: 'Liquid cooled' }` its one missing specification; and *has the same path among the missing needed specifications its Part names*, `['water_cooled']`, read through `GET /v1/parts/{partId}` as the Admin. The cooler lacks only "Liquid cooled", so it is on the list for that alone. Run before the code, both failed for their own reason: the list was empty, and the Part named no missing needed specification.

All three passed once the lists read the library. The 12 earlier tests of Missing specifications and the 52 of `part.controller.integration-spec.ts`, a Part's missing needed specifications among them, passed unchanged.

**The import's made-up cooler.** One earlier test failed once "Liquid cooled" was needed: the import's *keeps a cooler's sockets when the one outside the set is LGA 1151v2 beside LGA 1151*, which expects the made-up folder's "Made-up Low Profile Cooler" to lack no needed specification, received `['water_cooled']`, since its record gave none. The test is about the sockets the import keeps. The record, a cooler 47 mm tall, now gives `"water_cooled": false`, as the folder's other cooler does, so it holds every needed specification again, as it did before, and the test passes unchanged. No other test reads that record's values, and the report's counts are as they were.

**The end-to-end test.** In `admin-part.spec.ts`, *lists each Category with how many specifications its form asks for, and how many are needed* now expects "13 specifications, 3 needed" for a CPU cooler, where it expected 2. It was not run: `pnpm platform:check` takes the shared lock, and this ticket does not run it. Ticket 08's run from a fresh clone does.

**The development database**, read only through `psql` on 8 November 2026: 2,403 imported CPU coolers, of which 1 lacks "Liquid cooled", as the spec says, the ID-COOLING ZOOMFLOW 360X SNOW 360mm White, which lacks its height too; none of the 10 made-up coolers lacks it. No cooler that lacks it has an Offer, so Missing specifications there is unchanged until a Vendor offers that one.

### 8 November 2026: the fault checks

Each was planted on `324c20d` with one exact edit and taken out by the inverse edit; `git status` was clean after each, and the tests passed again.

| Fault | Failing tests | Why they failed |
|---|---|---|
| Rule 17's reading of "Liquid cooled" taken out of its statement: in `rule-17.ts`, `involves: { cpuCooler: ['water_cooled', 'height'], … }` made `cpuCooler: ['height']` | The Categories endpoint's *marks as needed exactly the specifications the Compatibility Rules read, in every Category*; the library's *of a Category, cpuCooler, are the paths the rules read in it*; and both new integration tests | The library named only `cpu_sockets` and `height` for a cooler, so the endpoint did not mark "Liquid cooled" as needed, Missing specifications was empty where the cooler was expected, and its Part named no missing needed specification. Rule 17's own tests passed, its judgment unchanged. The library's type check refused the fault too: the judgment reads `water_cooled`, which its statement no longer named |
| One more, for the second half of the first box: the cooler's list naming the specification `liquid_cooled`, where the library names `water_cooled` | The Categories endpoint's *marks as needed exactly …* | The API started, and marked only `cpu_sockets` and `height` as needed for a cooler: the path the library names was in no list |

### 8 November 2026: the checks

`324c20d` was gated on `pnpm integration:check`, which passed with 543 tests in 20 files, and on `pnpm check`. This record follows it, gated on `pnpm check --skip-nx-cache`, 32 tasks, with every `*.tsbuildinfo` outside `node_modules` deleted first, `DOCKER_HOST` pointed at a socket that does not exist and `PLAYWRIGHT_BROWSERS_PATH` at an empty folder, as earlier tickets stood in for Docker stopped; Docker itself was left running for the owner's services and the other worktrees. No project gained a target or an import of another, so `pnpm boundaries:check` was not run.

**For the next tickets.**

- Ticket 08: the MVP spec's _Specifications_ says each list's entry gives whether it is a needed specification, and _The two Admin lists_ that the needed specifications are read from each Category's specification list in code; ADR-0005 says a list states "whether a Compatibility Rule needs it". A list now names its Category's key and reads them from the library's statements. The end-to-end count of a cooler's needed specifications waits for its run of `pnpm platform:check`.
- The inspector's stand-in of the catalog, `apps/inspector/src/test/shoppers-catalog-stand-in.ts`, marks a cooler's "Liquid cooled" as not needed, among values made up for its own tests that nothing compares with the API, and was left as it is.
