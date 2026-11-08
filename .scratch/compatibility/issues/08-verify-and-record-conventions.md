# 08: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the compatibility spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, followed by the install, the checks, the services, the catalog's import from GitHub and `pnpm platform:check`, with none of the three apps started by hand. Results left over from earlier runs can hide a fault, so this run is the one that counts.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `builder` and every later module start from them. This ticket closes `compatibility`.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 05, 06, 07

**Status:** ready-for-agent

- [x] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand:
  - one install;
  - `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed, the library's tests among it;
  - `pnpm boundaries:check`;
  - `pnpm integration:check`;
  - `pnpm services:up`, and then `pnpm services:check`;
  - `pnpm catalog:import`, from GitHub, whose report gives the 695 GPUs' four power sockets as left out with their reason;
  - the browser's one-time install, and then `pnpm platform:check`, under the e2e lock.
- [x] Git reports a clean working tree after every command above. No password and no secret is committed.
- [x] No check by hand and no check on a phone is added, since no screen changes. Whether the owner wants to look at anything, such as Missing specifications showing a cooler's "Liquid cooled", is asked, and the answer is recorded under Comments.
- [x] **Recorded in the MVP spec.** The Technology section gains `compatibility`'s place in the order of work and a part of its own, **The compatibility module's conventions**: the library's public face; the Build it reads, and the contract that whoever hands it a Part leaves out what the catalog counts as missing; when a rule is unchecked; each rule's reading of OpenDB's values; the needed specifications and the fixed sets read from the library; the import's reading of GPU power sockets; and the library's test seam. CMP-3 and the testing strategy say that rules 11, 15 and 20 can produce a Compatibility Warning. The description of the `compatibility` library, the catalog's conventions on specification lists and on the import, `browse`'s note that `compatibility` can start now, and the commands and directory layout, where the library's `test` target adds to them, are brought up to date, and so is any figure of the import the MVP spec cites.
- [x] Whether an ADR is needed for any of the module's decisions, which the spec proposes none of, is decided with the owner, and the answer is recorded under Comments.
- [ ] The spec's Status becomes `resolved`, and each ticket's too.
- [ ] The work is committed, leaving `pnpm check` passing.

## Comments

### 8 November 2026: the fresh clone

The repository was cloned at `compatibility/integration`, `cd593c7` (tickets 01 to 07 and the code review's fixes), into a new folder in the session's scratchpad, `fresh-clone-08`, with `git clone --branch compatibility/integration`. Compose named a project of its own after the folder, `fresh-clone-08`, so its services got a volume of their own; no `COMPOSE_PROJECT_NAME` was set in the clone. Before the first step the clone held no `.env`, only `.env.example`, and Docker held no volume and no container of that project. The images of PostgreSQL, Keycloak and Testcontainers' helper were already on the machine, and so was Chromium in Playwright's cache.

The e2e lock, the folder `e2e.lock` in the session's scratchpad, was taken with `mkdir` at 00:14 UTC, 03:14 in Erbil, when nothing listened on ports 3000 to 3002, and held until the owner's services were running again. The owner's containers and data were recorded first, read only: `pc-part-pickers-keycloak-1` and `pc-part-pickers-postgres-1`, both up and healthy for 19 hours, the volume `pc-part-pickers_postgres-data`, and in the database 34,065 Parts (25,974 imported from OpenDB), 398 photos, 7,123 Vendors (7,112 active), 4,025 Offers, 4,675 rows of Offer history, 1,115 Platform Rates set (the current one 1,500), 13 migrations, and 7,125 Logins in the realm, one of them the API's client's service account; and a hash of each table's rows, in the order of their identifiers. They were then stopped with `pnpm services:down` from the owner's checkout (`COMPOSE_PROJECT_NAME=pc-part-pickers`, `NX_DAEMON=false`), which keeps the volume; nothing listened on 5432 or 8080 after. One script ran every step in order, wrote each step's log and read `git status --porcelain` in the clone after each.

| Step | Outcome | Time | Working tree |
|---|---|---|---|
| `pnpm install --frozen-lockfile` | Passed, from pnpm's store on the machine | 5 s | Clean |
| `pnpm check --skip-nx-cache`, with Docker unreachable and no browser installed | Passed: every step, then lint, type-check, test and build, 32 tasks for the 12 projects, none from Nx's cache, the library's tests among them | 21 s | Clean |
| `pnpm boundaries:check` | Passed all 128 lines | 9 s | Clean |
| `pnpm integration:check` | Passed 548 tests in 20 files, on its first run, against its own PostgreSQL and Keycloak containers | 107 s | Clean |
| `pnpm services:up` | Passed: "Created .env with new local passwords and a new secret.", made the volume `fresh-clone-08_postgres-data`, imported the realm, made the development Admin's Login and applied the migrations | 16 s | Clean: Git ignores `.env` |
| `pnpm services:check` | Passed all 37 lines, every committed migration among them | 1 s | Clean |
| `pnpm catalog:import`, from GitHub | Passed; its report is below, from a second clone | 16 s | Clean |
| `pnpm exec playwright install chromium` | Passed, Chromium being in Playwright's cache already | 0 s | Clean |
| `pnpm platform:check` | Passed **391 tests**, none failed, flaky or skipped. No app listened on ports 3000 to 3002 before it; it started all three and stopped them, and none listened after | 1,004 s (16.6 minutes of tests) | Clean |
| `pnpm services:reset` in the clone | Passed: the clone's two containers, its network and its volume removed; no container, volume or network of `fresh-clone-08` left, and the owner's volume kept | 2 s | Clean |

- **Docker stopped** was as earlier tickets did it: `pnpm check` ran with `DOCKER_HOST` pointed at a socket that does not exist, so `docker info` failed there (exit 1), and with the owner's services stopped nothing answered on 5432 or 8080. Docker Desktop itself was left running, since nothing in `pnpm check` could reach it.
- **No browser installed**: `PLAYWRIGHT_BROWSERS_PATH` pointed at an empty folder, still empty after `pnpm check`.
- **The library's tests** ran in `pnpm check` as `@pcp/compatibility:test`, one of its 32 tasks, which are 12 lint, 12 type-check, 5 test and 3 build tasks, where `browse`'s run had 31; the same tree holds 272 tests in 25 files, all passing, read with static output in this ticket's worktree.
- **What Nx showed, and a second clone.** Nx 23.3 tells an agent's environment by variables such as `AI_AGENT` and `CLAUDECODE`, which the session's shell holds, and there resolves an output style left unnamed to `summary`: of `pnpm catalog:import` and of the migrations `pnpm services:up` applies, the script's logs hold only "1 task: 1 succeeded" and "Re-run with --output-style=static to inline logs". A person sees what the task prints: in this worktree, with those variables taken out of the environment, the library's tests printed every line in a pseudo-terminal of 120 by 40 and with their output sent to a file alike, and with them, in a pseudo-terminal too, only the summary. So, from 00:39 to 00:40 UTC, under the lock again and with the owner's services stopped again as before, a second fresh clone at `cd593c7`, in the same folder, ran the install (3 s), `pnpm services:up` (18 s), `pnpm services:check` (2 s, 37 lines) and `pnpm catalog:import` from GitHub (14 s) in a person's environment, six variables and none of the agent's. Each passed with a clean tree; `pnpm services:up` printed "Applied 13 migrations.", and the import printed the report below. That clone, its services and its volume were removed as the first's were. The three checks whose lines are read here, `boundaries:check`, `integration:check` and `platform:check`, ask Nx for static output, so the first clone's logs hold every line of theirs.
- **The import's report**, from the second clone, which read OpenDB at commit `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf`:

  ```
  Category       Imported   Already there   Records left out   Values left out
  cpu                 774               0                 15             3,550
  cpuCooler         2,403               0                 10               162
  motherboard       3,691               0                 10             1,100
  ram               4,753               0                123                51
  storage           3,443               0                 52                 0
  gpu               3,852               0                 13             7,269
  case              3,781               0                 23               111
  psu               3,277               0                 20             1,656
  Total            25,974               0                266            13,899
  ```

  Its 266 records left out are 242 that have "the name, manufacturer and specifications of another record, whose Part takes its part numbers", 20 that have "no manufacturer, and another record has its part number", 2 with "no manufacturer" and 2 that copy "another record, as the list of known copies says"; 4 manufacturers were taken from the name. Its 58 lines of values left out sum to 13,899, and the five that `compatibility`'s readings add are:

  ```
  motherboard, m2_slots, an empty list, where the board's socket came in 2017 or later: 36
  gpu, power_connectors.pcie_12VHPWR, 0 for each power socket, where the GPU draws more than the 75 W a PCIe slot supplies: 695
  gpu, power_connectors.pcie_12V_2x6, 0 for each power socket, where the GPU draws more than the 75 W a PCIe slot supplies: 695
  gpu, power_connectors.pcie_6_pin, 0 for each power socket, where the GPU draws more than the 75 W a PCIe slot supplies: 695
  gpu, power_connectors.pcie_8_pin, 0 for each power socket, where the GPU draws more than the 75 W a PCIe slot supplies: 695
  ```

  The figures are those of the import's in-memory run of the pinned commit with the code review's fixes: the GPUs' 7,269 values left out, the motherboards' 1,100 and the total's 13,899.
- **The line no run had tried.** In `admin-part.spec.ts`, *lists each Category with how many specifications its form asks for, and how many are needed* passed, the 88th of the 391 lines, with a CPU cooler's "13 specifications, 3 needed", the count ticket 06 changed.
- **What the apps logged during `pnpm platform:check`**, none of it failing a line: the Shopper app once "The destination stream errored while writing data", a line leaving a page before its answer ended, as `browse`'s runs saw; the API's refusal of a test's picture that is not one, "A picture was refused: Input buffer contains unsupported image format", as that test means; and, as the run ended, Nx's notes that `next dev` and `vite` exited with a status other than 0, when Playwright stopped them. Neither Next's request for `loading="eager"` nor `pg`'s warning of a query sent to a busy client, which `browse`'s run logged, appeared.
- **No password and no secret is committed.** `.env` is ignored in the clone, and no commit reachable from the clone's 30 branches (875 commits) touches a file of that name. None of the 7 passwords and secrets in the owner's `.env`, nor of the 6 in each clone's, appears in any commit: every commit's message and patch, merges against each parent, was searched for them all with `git log --all -p -m --text`, and for each of the first clone's and the owner's with `git log --all -S` too. Nor does any appear in a file of this run: 27 searched after the first clone's steps, its logs and scripts and the end-to-end tests' report and results, and 53 after the second's, the logs and scripts of both. The scripts printed counts only, and the lists of secrets they searched for were deleted.
- **Afterwards**, after each clone, its services and volume were deleted with `pnpm services:reset` (`COMPOSE_PROJECT_NAME=fresh-clone-08` given as well, so that the reset could reach no other project), its Nx daemon was stopped, after which no process named the clone, no plugin worker of the daemon among them, and the folder was removed. In the owner's checkout `pnpm services:up` and `pnpm services:check` (`COMPOSE_PROJECT_NAME=pc-part-pickers`, `NX_DAEMON=false`) passed after each session: the same two containers run, healthy, on the same volume, `pnpm services:check` passes all 37 lines, and every count is as it was before, and so is each table's hash: 34,065 Parts (25,974 imported), 398 photos, 7,123 Vendors (7,112 active), 4,025 Offers, 4,675 rows of Offer history, 1,115 Platform Rates (the current 1,500), 13 migrations and 7,125 Logins. The owner's services were stopped from 00:14 to 00:34 UTC and from 00:39 to 00:40, and the lock was released after each, at 00:34 and at 00:40, last; nothing listened on ports 3000 to 3002, 3100 or 3101 after.

### 8 November 2026: the records

- **The MVP spec's Order of work** places `compatibility` after `browse`, with links to its spec, its code review's fixes and ADR-0005's amendment of 8 November 2026, says what it covers and what it changed in the catalog, the owner's decisions, the correction of CMP-3 and the testing strategy, that no other decision has an ADR, that it adds no check by hand and none on a phone, and that `builder` comes next. `browse`'s paragraph no longer says that `compatibility` can start now.
- **The Technology section** gains **The compatibility module's conventions**: the library's public face (`judgeBuild` and `RuleOutcome`, `isCompatible` with `PartOf` and where the Part goes, `estimatedPowerDrawOf`, `neededSpecificationsOf` and the types); the Build it reads, with `CategoryKey` and `SpecificationsOf`, and the contract that whoever hands it a Part leaves out what the catalog counts as missing; when a rule applies and when it is unchecked, with rules 13 to 16 passing a Build with no drive of their kind (answer 4) and the Warning's form; each rule stated once, with `PathsRead` and `readsWhenHeld`, the findings, the amounts of `amounts.ts` (`larger` and `totalOfRows` among them), `Reading` and `rowsOf` in `reading.ts`, and the drives' readings with `drivesWhose` and `driveWhose`; each rule's reading of OpenDB's values, pointing to the compatibility spec's table and the rule notes, with answers 2 and 3; the needed specifications and the fixed sets read from the library, `gpuPowerSockets` beside the sets; the import's reading of a GPU's power sockets; and the library's test seam, with `made-up-parts.ts`, and what the API's seams prove.
- **Elsewhere in the MVP spec.** CMP-3 and the testing strategy's first list name rules 11, 15 and 20. CAT-8 says the needed specifications are the ones the rules read. The description of the `compatibility` library says what it holds and who asks it. The catalog's _Specifications_ has no needed mark on a list's entries, a list naming its Category's key, and the fixed sets in the library. _The import_ gains the two readings of `compatibility`, the GPU's pointing to the new part and the empty list of M.2 slots' in full (answer 1: the reading, `socketsOf2017OrLater` and its years in `opendb-record.ts`, the reason `noM2SlotSince2017` and its words in the report, the 36 boards and the development database's correction of 8 November 2026), and this run's report. The offers module's Missing specifications reads the needed specifications from the rules. The commands give the library's `test` target, when `pnpm boundaries:check` is run, as this module ran it, and what `pnpm catalog:import` prints. The layout names the library's rules and tests and its lint rules for test files, the import rules the ban on its test files, and the testing strategy's last paragraph the library's tests. The toolchain's note on what Nx 23.3 prints gains an agent's environment, from this run. The figures of the import the MVP spec cites are this run's: 25,974 Parts, and CAT-2's 26,240 records, the 25,974 and the 266 left out.
- **The compatibility spec's table**: rule 1 gains the Narrow boards (ticket 02, 8 November 2026); rule 11 counts the larger of the GPU's 12VHPWR and 12V-2x6 counts against the PSU's cables (answer 3); rules 13, 14 and 16 tell an M.2 SATA drive by its form factor and its interface (answer 2), and rule 14 an empty list of M.2 slots on a socket of 2017 or later as not known (answer 1); and rules 13, 15 and 16 apply to a Build with any drive and pass one with none of their kind (answer 4). Rule 14 is worded the same way, since the library applies it to any drive and passes a Build with no M.2 drive, though the code review's question named only rules 13, 15 and 16; a line under the table says so. Its figures are dated 7 November 2026, and 8 November for the readings decided that day. Its line on why no ADR is needed gains the empty lists of M.2 slots beside the GPU's zeros.
- **Checked and left as they were**: ADR-0005's amendment of 8 November 2026 (the code review's fixes); the MVP spec's rule notes, which tickets 02 and the code review's fixes brought to rules 1, 11, 13, 14 and 16; and CONTEXT.md's **Compatible** and **Estimated power draw** (ticket 02).

### 8 November 2026: the owner's answers

The owner answered in the orchestrator's chat on 8 November 2026, as the orchestrator relayed it.

- **The ADR question.** Asked "Should the compatibility module get an ADR of its own? The code review's fixes already added an amendment to ADR-0005: the needed specifications are now read from the rules, and the fixed sets live in the library. Nothing else is hard to undo. The sets and the rules are code, and the GPU zeros and empty M.2 lists come back from OpenDB at the pinned commit.", the owner chose "No new ADR (Recommended)". No decision of `compatibility` has an ADR beyond ADR-0005's amendment, and the MVP spec's Order of work and its conventions say so.
- **Looking at anything by hand.** Asked "When the fresh-clone check passes, do you want to look at anything yourself? No screen changed. The only visible change is the CPU cooler's needed count going from 2 to 3 ("Liquid cooled"), and the end-to-end test checks it.", the owner chose "No, the tests are enough (Recommended)". No check by hand and no check on a phone is added, nothing is recorded as seen by the owner, and the end-to-end line above checks the cooler's count.
