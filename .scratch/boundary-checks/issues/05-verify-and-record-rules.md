# 05: Verify from a fresh clone and record the rules in the MVP spec

**Spec:** [the boundary checks spec](../spec.md)

**What to build:** The checks are proven sound as a whole, the way the next person to pick them up will meet them: a fresh clone in a new directory, one install, then `pnpm check` and `pnpm boundaries:check`. Steps 1 and 2 showed that results left over from earlier runs can hide a fault, so this run is the one that counts. The proof itself is shown to fail at each of the three levels. The rules, the new command and when to run it are written into [the MVP spec](../../mvp/spec.md), so that every later ticket starts from them, and ADR-0004 is brought up to date. This ticket closes step 3 of the infrastructure.

**Blocked by:** 04

**Status:** resolved

- [x] In a fresh clone in a new directory, one install followed by `pnpm check --skip-nx-cache` passes and prints no skipped-rule warning.
- [x] In the same clone, `pnpm boundaries:check` passes on every line, and Git then reports a clean working tree.
- [x] The proof's output holds a line for every case in the spec's Testing Decisions: the cases between projects, the API's cases, each frontend's cases, the Shopper app's routing folder, and the allowed cases.
- [x] In the fresh clone, for each of the three levels, one ban is weakened by hand and the proof is shown to fail on that line. One ban is also widened so that an allowed case fails. Each change is reverted.
- [x] Checked by hand: a second `pnpm check` with nothing changed completes from the cache. The time `pnpm check --skip-nx-cache` takes is noted beside the baseline from ticket 01.
- [x] Nx's project graph still lists exactly the eight projects, each with its two tags, and the dependencies between them are the ones step 1 recorded.
- [x] Nothing in the source of the three apps or the five libraries has changed in this step. Only their lint configuration and the tags in their package manifests have.
- [x] No ESLint configuration exists, no package manifest lists ESLint and nothing runs it.
- [x] The Technology section of the MVP spec gains the rules between projects as a table, the API's layer rule, and the frontends' bans with the routing folder's rule.
- [x] The MVP spec's table of commands gains `pnpm boundaries:check`, with what it does, that it is run on its own and not while `pnpm check` or a development server is running, and when it has to be run: after a change to the lint configuration, to a project's tags or to the name of a layer folder, after an upgrade of Oxlint or Nx, and when a project is added.
- [x] The MVP spec says that bare `oxlint` is not a boundary check, because Nx's rule is skipped when no project graph is cached, and that Oxlint is pinned exactly and why.
- [x] The MVP spec says that step 3 is finished, with its date and a link to this spec, and its sentence about what is still to come names step 4 only.
- [x] ADR-0004 is brought up to date: the relative-import convention it relies on is now checked, to the depth the spec states, and the Shared layer is imported through each segment's index file.
- [x] A fault found here is fixed in this ticket, and the fix is recorded under Comments.
- [x] The results of the from-scratch run, the fault checks and the by-hand checks are recorded under Comments.
- [x] The work is committed.

## Comments

### 9 October 2026: completed

**From scratch.** A fresh clone in a scratch folder, at the commit that recorded ticket 04, with no `node_modules` and no cached project graph.

- One install passed, in 11 seconds.
- `pnpm check --skip-nx-cache` passed and printed no skipped-rule warning. All 21 tasks ran.
- `pnpm boundaries:check` passed on all 75 lines, in 6 seconds. Git then reported a clean working tree.

**The proof's lines.** There are 75, and every case in the spec's Testing Decisions has one:

| Group | Refused | Allowed | Other |
|---|---|---|---|
| Between projects | 7 | 1 | |
| The API | 5 | 3 | |
| The dashboard | 13 | 7 | |
| The Shopper app | 13 | 7 | |
| The Shopper app's routing folder | 4 | 3 | |
| Each of the five projects that are linted | | | 2: lint skipped no rule, and lint reported nothing unplanted |
| Each frontend | | | 1: its written bans match the statement |

The spec's case "a project imports an app" is covered by the line for a relative path that reaches into an app. Ticket 02 records why.

**The proof seen to fail,** in the fresh clone, each change reverted:

| Level | Change | What failed |
|---|---|---|
| Between projects | `scope:api` allowed to depend on `scope:web` | "The API cannot import a frontend library" |
| The API | The alias pattern removed | The four lines for an import written with the alias: plain, type-only, re-exported and lazy. The relative-path line passed. |
| The frontends | The index ban removed from the statement and written out | All three index lines in each frontend, and the routing folder's two |
| A ban widened | The ban on crossing layers also refusing a neighbouring Shared segment | "A relative import between two Shared segments is allowed", in each frontend |

**By hand.**

- A second `pnpm check` with nothing changed completed from the cache: 21 of 21 tasks, in a third of a second.
- **The time.** `pnpm check --skip-nx-cache` took 4 seconds, with Nx reporting a run of 3.1 to 3.2 seconds. The baseline in ticket 01 was 4 seconds and a run of 3.0. The first run in the fresh clone took 9 seconds, because it also started Nx's background process and built the project graph.
- Nx's project graph lists exactly the eight projects, each with its two tags, and the dependencies between them are the ones step 1 recorded.
- No file under any project's `src` folder, or under the Shopper app's routing folder, has changed in this step. What changed in the eight projects is their package manifests, which gained tags, three lint configurations, and the two written files of bans.
- No ESLint configuration exists and no package manifest lists ESLint. It is still installed, as a peer of Nx's own packages, as ADR-0004 says.

**What was recorded.**

- The MVP spec's Technology section has a new part, "Import rules": the table of what each project may import, the API's layer rule, the frontends' layers and bans, and the routing folder's rule. It says when the boundary rule does not run: under bare `oxlint`, and when Nx is told not to cache the project graph.
- The table of commands has `pnpm boundaries:check` and `pnpm boundaries:write`, and the text below it says when the proof has to be run and that it is run on its own.
- The MVP spec says that Oxlint is pinned exactly and why, that step 3 is finished, and that step 4 is still to come.
- ADR-0004 says that relative imports are now checked and to what depth, how Shared, App and the routing folder are imported, why the bans are stated in a script and written out as JSON, and that Oxlint is pinned.
- This step's spec has two sentences corrected, each marked with its date: that the project graph is always there under Nx, and that an import of an app is refused by the rule.

**Faults found in this ticket:** none. Three things found earlier are recorded where they were dealt with: Oxlint not linting a planted file that Git ignores (ticket 01), an app that cannot be imported by its name (ticket 02), and the boundary rule being skipped under Nx when the graph is not cached (ticket 02).

### 9 October 2026: the code review

Two reviews were run over everything since the commit that added this step's spec: one against the repository's standards and one against the spec. Neither found a broken standard. Both found ways round the frontends' bans, and the first found faults in the proof command itself. Each hole was first written as a case in the proof and seen to fail, and then closed.

**Changed as a result.**

- **A relative import could step round every ban by its spelling.** The bans count the `../` an import starts with. `./../../other-slice` starts with `./`, and `../model/../../other-slice` climbs after going down, so neither was counted. A relative import must now be in its shortest form.
- **A climb out of the App and Shared layers is now counted, as it is for a slice.** It had been refused by the name of the folder it reached. That refused `../widgets` inside Shared, where a folder may well be named like a layer, and it let `../../../src/pages/x` back in. The ban now reads "may not leave its own layer".
- **The `@/` alias reaches the six layers and nothing else.** `@/i18n/request` had passed from any layer and from a route file, although the spec says that a route file imports project code only from the App layer and from a page. Rust's regular expressions have no lookahead, so the pattern for "a folder that is none of the layers" is worked out by the script from the layers' names. It was checked against 94 words outside Oxlint before it was used.
- **A layer is never imported with nothing named after it.** `@/entities` and `@/shared` had passed.
- **A file put straight into a layer that has slices may make no relative import.** It belongs to no slice, and it could reach into every slice beside it.
- **A route file reaches the layers through the alias only.** A relative path from the routing folder into `src` is refused wherever it goes, with a message of its own.
- **The boundary rule now applies to every file of a project.** It had been switched on for `src` and `app` folders, so a file at a project's root, such as a middleware file, could import any project. Ticket 04 said that the rules between projects applied to such a file. They did not then, and they do now. The files outside the projects have a configuration of their own, which extends the root's and switches the one rule off, because they are linted before Nx has cached a project graph.
- **`pnpm check` compares the written bans with their statement.** Before, a statement that was changed and not written out left `pnpm check` green, with lint reading the old bans. This adds a part to `pnpm check`, which the spec said would gain none. It takes a twentieth of a second and plants nothing. The owner can take it out again: the proof makes the same comparison.
- **An allowed case can no longer pass because its file was never linted.** Every planted file ends with a `debugger` statement, which lint always reports. A file with no such report fails its line.
- **The proof removes only what it planted.** It had removed a folder it created together with everything in it, and a real file added to that folder during the run would have gone with it. It now removes its own files and then each folder it made, if the folder is empty again. Checked by hand: a file written into a created folder while the proof ran was still there afterwards.
- **A report that cannot be read fails its lines.** It had ended the command with a stack trace. A lint that has not finished after two minutes is stopped, and two cases that would plant the same file are refused at the start.
- **The proof's cases are built by one pair of helpers,** and every line has the same form. The two relative-path cases between projects moved to the API, because in a frontend the new layer ban reports them too.
- **An index ban, a layer ban and a slice ban are each planted at a second depth.** Each depth of a layer with slices has a block of its own, and only the segment's block had been proven for the alias bans.

**Left as it is, with the reason.**

- **"A project imports an app" still has no line of its own.** The rule's own wording for it cannot be reached while the apps export nothing, as ticket 02 records. The line for a relative path into an app is the case that can happen.
- **A file with no imports, put straight into a layer that has slices, can be imported as if it were a slice.** `@/features/helpers` reads the same whether `helpers` is a folder or a file. The MVP spec says so.
- **A file in `src` outside the six layers is under no ban itself.** Nothing in a layer or in the routing folder can import it. The MVP spec says so.
- **The frontends' folder names are written out in the proof as well as in the statement.** That is deliberate, like the messages: the proof would prove nothing if it read its expectations from what it checks. A comment now says so.
- **The proof compares the written bans with the statement,** although the spec says it does not assert the contents of the lint configuration. It asserts nothing about what the bans are, only that the file lint reads is the one the statement produces.
- **Three scripts and a second command, where the spec named one of each.** Ticket 03 records why the bans are written out by a script.
- **The proof knows a skipped rule by Nx's wording.** If the wording changed, the refused lines between projects would still fail, because a skipped rule reports nothing.

**The proof after the review** has 100 lines:

| Group | Refused | Allowed | Other |
|---|---|---|---|
| Between projects | 8 | 1 | |
| The API | 5 | 3 | |
| The dashboard | 22 | 9 | |
| The Shopper app | 22 | 9 | |
| The Shopper app's routing folder | 6 | 3 | |
| Each of the five projects that are linted | | | 2 |
| Each frontend | | | 1 |

**Fault checks,** each made in the statement or the root configuration and reverted:

| Fault | What failed |
|---|---|
| The alias allowed to reach any folder | The line for a folder that is not a layer, in each frontend and in the routing folder |
| Any spelling of a relative import allowed | Both lines for leaving a slice by a longer spelling, in each frontend, and the routing folder's |
| A file outside any slice allowed its relative imports | Its line, in each frontend |
| A whole layer allowed to be imported | Its line, in each frontend |
| The App and Shared layers allowed to be left | All three lines for leaving a layer, in each frontend |
| The shortest-form ban widened to refuse every climb | Every allowed relative import, in each frontend and in the routing folder, and three refused lines, each reported twice |
| The boundary rule limited to source folders again | The Shopper app's line for a file at its root |

**From scratch again,** in a second fresh clone at the commit that brought the documents in line:

- One install, then `pnpm check --skip-nx-cache` passed with no skipped-rule warning.
- `pnpm boundaries:check` passed on all 100 lines in 6 seconds, and Git reported a clean working tree.
- A second `pnpm check` came from the cache, 21 of 21. `pnpm check --skip-nx-cache` took 4 seconds, with a run of 3.2 seconds, against the baseline of 4 and 3.0.
- With a written file edited by hand, and again with the statement changed and not written out, `pnpm check` failed at the comparison and named the file.
- Interrupted with SIGINT and with SIGTERM while 88 files were planted, the proof left nothing behind.
