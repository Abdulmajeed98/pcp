# 05: Verify from a fresh clone and record the rules in the MVP spec

**Spec:** [the boundary checks spec](../spec.md)

**What to build:** The checks are proven sound as a whole, the way the next person to pick them up will meet them: a fresh clone in a new directory, one install, then `pnpm check` and `pnpm boundaries:check`. Steps 1 and 2 showed that results left over from earlier runs can hide a fault, so this run is the one that counts. The proof itself is shown to fail at each of the three levels. The rules, the new command and when to run it are written into [the MVP spec](../../mvp/spec.md), so that every later ticket starts from them, and ADR-0004 is brought up to date. This ticket closes step 3 of the infrastructure.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, one install followed by `pnpm check --skip-nx-cache` passes and prints no skipped-rule warning.
- [ ] In the same clone, `pnpm boundaries:check` passes on every line, and Git then reports a clean working tree.
- [ ] The proof's output holds a line for every case in the spec's Testing Decisions: the cases between projects, the API's cases, each frontend's cases, the Shopper app's routing folder, and the allowed cases.
- [ ] In the fresh clone, for each of the three levels, one ban is weakened by hand and the proof is shown to fail on that line. One ban is also widened so that an allowed case fails. Each change is reverted.
- [ ] Checked by hand: a second `pnpm check` with nothing changed completes from the cache. The time `pnpm check --skip-nx-cache` takes is noted beside the baseline from ticket 01.
- [ ] Nx's project graph still lists exactly the eight projects, each with its two tags, and the dependencies between them are the ones step 1 recorded.
- [ ] Nothing in the source of the three apps or the five libraries has changed in this step. Only their lint configuration and the tags in their package manifests have.
- [ ] No ESLint configuration exists, no package manifest lists ESLint and nothing runs it.
- [ ] The Technology section of the MVP spec gains the rules between projects as a table, the API's layer rule, and the frontends' bans with the routing folder's rule.
- [ ] The MVP spec's table of commands gains `pnpm boundaries:check`, with what it does, that it is run on its own and not while `pnpm check` or a development server is running, and when it has to be run: after a change to the lint configuration, to a project's tags or to the name of a layer folder, after an upgrade of Oxlint or Nx, and when a project is added.
- [ ] The MVP spec says that bare `oxlint` is not a boundary check, because Nx's rule is skipped when no project graph is cached, and that Oxlint is pinned exactly and why.
- [ ] The MVP spec says that step 3 is finished, with its date and a link to this spec, and its sentence about what is still to come names step 4 only.
- [ ] ADR-0004 is brought up to date: the relative-import convention it relies on is now checked, to the depth the spec states, and the Shared layer is imported through each segment's index file.
- [ ] A fault found here is fixed in this ticket, and the fix is recorded under Comments.
- [ ] The results of the from-scratch run, the fault checks and the by-hand checks are recorded under Comments.
- [ ] The work is committed.
