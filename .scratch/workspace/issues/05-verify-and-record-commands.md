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
