# 05: Verify from a clean clone and record the commands

**Spec:** [the workspace spec](../spec.md)

**What to build:** The workspace is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, one install, one check. The three apps are shown running together, and the commands and directory layout are written into [the MVP spec](../../mvp/spec.md), so that every later ticket starts from them. This ticket closes step 1 of the infrastructure.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, one install followed by `pnpm check` passes: the format check for the whole repository, lint for all eight projects, type-checking for all eight, tests for the API and `core`, and builds for the three apps.
- [ ] Nx lists exactly eight projects: `@pcp/api`, `@pcp/shopper`, `@pcp/dashboard`, `@pcp/core`, `@pcp/compatibility`, `@pcp/api-client`, `@pcp/ui` and `@pcp/i18n`.
- [ ] Nx's project graph shows exactly the dependencies in the spec's table: the API on `core` and `compatibility`; the Shopper app on `compatibility`, `api-client`, `ui` and `i18n`; the dashboard on `api-client`, `ui` and `i18n`. No library depends on another library.
- [ ] A second run of `pnpm check` with nothing changed completes from Nx's cache.
- [ ] A single target can be run for a single project.
- [ ] Checked by hand: all three apps run at the same time, the Shopper app on port 3000, the API on 3001 and the dashboard on 3002. The API answers a request to its placeholder endpoint and each frontend serves its placeholder page.
- [ ] No ESLint package or configuration exists in the repository. No environment file or secret is needed for the install, the check or starting any app.
- [ ] Only the API and `core` have a test target, and only the three apps have a build target.
- [ ] The Technology section of the MVP spec gains the commands that now exist (install, check, format, starting each app, running one target for one project) and the directory layout. Its sentence promising them is amended to say what is still to come from steps 2 to 4.
- [ ] A fault found here is fixed in this ticket, and the fix is recorded under Comments.
- [ ] The results of the by-hand checks are recorded under Comments.
- [ ] The work is committed.

## Comments
