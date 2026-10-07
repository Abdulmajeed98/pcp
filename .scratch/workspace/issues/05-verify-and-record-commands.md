# 05: Verify from a clean clone and record the commands

**Spec:** [the workspace spec](../spec.md)

**What to build:** The workspace is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, one install, one check. The three apps are shown running together, and the commands and directory layout are written into [the MVP spec](../../mvp/spec.md), so that every later ticket starts from them. This ticket closes step 1 of the infrastructure.

**Blocked by:** 04

**Status:** resolved

- [x] In a fresh clone in a new directory, one install followed by `pnpm check` passes: the format check for the whole repository, lint for all eight projects, type-checking for all eight, tests for the API and `core`, and builds for the three apps.
- [x] Nx lists exactly eight projects: `@pcp/api`, `@pcp/shopper`, `@pcp/dashboard`, `@pcp/core`, `@pcp/compatibility`, `@pcp/api-client`, `@pcp/ui` and `@pcp/i18n`.
- [x] Nx's project graph shows exactly the dependencies in the spec's table: the API on `core` and `compatibility`; the Shopper app on `compatibility`, `api-client`, `ui` and `i18n`; the dashboard on `api-client`, `ui` and `i18n`. No library depends on another library.
- [x] A second run of `pnpm check` with nothing changed completes from Nx's cache.
- [x] A single target can be run for a single project.
- [x] Checked by hand: all three apps run at the same time, the Shopper app on port 3000, the API on 3001 and the dashboard on 3002. The API answers a request to its placeholder endpoint and each frontend serves its placeholder page.
- [x] No ESLint configuration exists and no package manifest lists ESLint. (Reworded on 7 October 2026: see the Comments of ticket 02.) No environment file or secret is needed for the install, the check or starting any app.
- [x] Only the API and `core` have a test target, and only the three apps have a build target.
- [x] The Technology section of the MVP spec gains the commands that now exist (install, check, format, starting each app, running one target for one project) and the directory layout. Its sentence promising them is amended to say what is still to come from steps 2 to 4.
- [x] A fault found here is fixed in this ticket, and the fix is recorded under Comments.
- [x] The results of the by-hand checks are recorded under Comments.
- [x] The work is committed.

## Comments

### 7 October 2026: completed

Every check below was made on a fresh clone in a scratch directory, after `pnpm install --frozen-lockfile`.

| Check | Result |
|---|---|
| `pnpm check --skip-nx-cache` | Passes. The format check passes, and 21 tasks run: lint for 8 projects, type-check for 8, tests for the API and `core`, and builds for the 3 apps. |
| Projects Nx lists | Exactly eight: `@pcp/api`, `@pcp/shopper`, `@pcp/dashboard`, `@pcp/core`, `@pcp/compatibility`, `@pcp/api-client`, `@pcp/ui`, `@pcp/i18n`. |
| Dependencies between projects | Nine, matching the spec's table. The API: `core`, `compatibility`. The Shopper app: `compatibility`, `api-client`, `ui`, `i18n`. The dashboard: `api-client`, `ui`, `i18n`. No library depends on another. |
| Projects with a test target | `@pcp/api` and `@pcp/core` only. |
| Projects with a build target | `@pcp/api`, `@pcp/shopper` and `@pcp/dashboard` only. |
| A second `pnpm check` with nothing changed | "Nx read the output from the cache instead of running the command for 21 out of 21 tasks." |
| One target for one project | `pnpm exec nx test @pcp/core` runs that one test and passes. |
| All three apps started together | All three listen at once: the Shopper app on 3000, the API on 3001, the dashboard on 3002. |
| The API's placeholder endpoint | Returns `{"name":"@pcp/api","libraries":["@pcp/core","@pcp/compatibility"]}`. |
| The Shopper app's page | Its HTML holds "Shopper app placeholder. Libraries: @pcp/compatibility, @pcp/api-client, @pcp/ui, @pcp/i18n." |
| The dashboard's page, in headless Chrome | Shows "Dashboard placeholder. Libraries: @pcp/api-client, @pcp/ui, @pcp/i18n." |
| ESLint | No configuration file exists and no package manifest names it. It is present in the installed dependencies through Nx's own plugins; ticket 02 explains why. |
| Environment files and secrets | None exists and none is needed to install, check or start anything. |
| Working tree after all of the above | Clean. |

**The MVP spec** now holds the commands and the directory layout in its Technology section, and says what is still to come from steps 2 to 4.

**Faults found in this ticket:** none. Two were found earlier and are recorded where they were fixed: pnpm not enforcing the Node version (ticket 01), and the API's build and type-check sharing an output folder (ticket 02).

### 7 October 2026: after the code review

Two reviewers read the whole change, one against the repository's standards and one against this spec. Each finding was checked before anything was changed.

**Changed as a result.**

| Finding | What was done |
|---|---|
| The files at the repository root were never linted. A fault planted in the install guard passed `pnpm check`. | `pnpm check` now lints everything outside `apps/` and `libs/` as its own step. The same planted fault now fails it. |
| The base TypeScript settings loosened two of TypeScript 6's defaults, against "the strictest setting is the starting point". | Both lines were removed. The Shopper app also stops accepting JavaScript source files. |
| The API had three packaging targets, which the spec puts out of scope. | Removed. The API keeps only its serve target. |
| The frontends' lint used an accessibility rule set and a React performance rule set. The spec allows only the rule sets for a project's frameworks. | Both removed. Turning the accessibility rules on is one line, and it is a choice for when frontend work begins. |
| The claim that ESLint cannot be kept out of the install was untested. | Tested, and it was wrong. The owner then chose to keep ESLint installed, for the reason recorded in ticket 02 and ADR-0004. |
| The Shopper app's build had never been seen to fail by itself, because its type-check stopped every earlier fault first. | A fault that only the build can catch was planted: a client-only hook in a server-rendered page. Lint and type-check passed, the build failed, and `pnpm check` exited 1. Reverted. |
| "The code is ES modules throughout" was not accurate: the API's bundle and a few tool configuration files are CommonJS. | The spec's sentence was corrected. The code was not changed; this is how the workplace backend is built too. |
| The dashboard's port settings were written twice, and the API test worked out its own address by hand. | Both simplified. |

After these changes every task was run from scratch three more times with the cache skipped. All 21 tasks passed each time.

**Left as it is, with the reason.**

- **Nx's support for pnpm 12 is tested, not documented.** Nx's documentation does not mention pnpm versions, so the criterion's word "confirm" could not be met from the documentation. The evidence is the tests in ticket 01.
- **One commit did not pass from scratch.** The commit that added the API shell left a type-check that failed on a fresh clone with the cache skipped. The next code commit fixed it. History was not rewritten.
- **Next.js telemetry is switched off only when the app is run through Nx.** Running `next` directly uses the machine's own setting, which is on. A switch in the app's configuration file was tried and could not be shown to work: Next.js's debug output prints its events whether or not telemetry is off, so it cannot tell the two apart. Running `next telemetry disable` once in the Shopper app's folder switches it off for the whole machine.
- **Framework versions appear in the root manifest and in each app's.** The root copies are what Nx's plugins resolve as their peers, so removing them would let a plugin pull in a different version from the app's.
- **The Jest and SWC settings are repeated in the API and `core`.** Nx generates them per project.
- **A few generated settings do nothing yet:** the custom export condition in the base TypeScript settings, two exclusion patterns in the Nx settings, and a rule that tests wait for the builds of their dependencies.
- **Some tool configuration files are JavaScript,** as their tools generate them.
