# 02: The eight projects are tagged, and a forbidden import between them is refused

**Spec:** [the boundary checks spec](../spec.md)

**What to build:** Each of the eight projects carries a scope tag and a type tag, and Nx's boundary rule allows an import between projects only where the tags permit it. A frontend cannot import `@pcp/core`, the API cannot import a frontend library, a library cannot import another library or an app, no project reaches into another by a relative path, and `@pcp/compatibility` cannot import any npm package. The imports the shells make today all stay allowed.

The rule runs under Oxlint through the bridge that Nx ships and marks as experimental. With no cached project graph the rule checks nothing and passes, so this ticket also makes sure that it is run only through Nx, that a fresh clone prints no skipped-rule warning, and that the proof counts a skipped rule as a failure.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Before anything is configured, Nx's current documentation is read for its boundary rule, for tags in more than one dimension and for the Oxlint bridge, and Oxlint's for JavaScript plugins. Oxlint's current release is checked. The findings are recorded under Comments.
- [ ] Oxlint is pinned to an exact version.
- [ ] Each of the eight projects carries the two tags in the spec's table, recorded in its package manifest. Nx's project graph shows them.
- [ ] Nx's boundary rule runs under Oxlint through Nx's bridge, with the five constraints in the spec. ESLint stays as ADR-0004 describes it: no manifest lists it, nothing configures it and nothing runs it.
- [ ] The bridge is declared in a JSON Oxlint configuration, and the rule reaches all eight projects, including the libraries that have no Oxlint configuration of their own.
- [ ] The rule is switched on for files inside the eight projects only. With no cached project graph, `pnpm check` prints no skipped-rule warning.
- [ ] The spec's table of allowed imports holds: `pnpm check` passes with no change to the source of any app or library.
- [ ] After a tag or a constraint is changed, the affected `lint` targets run again and do not reuse a cached result.
- [ ] The proof gains these forbidden cases, each matched on the message Nx gives for that constraint: the dashboard imports `@pcp/core`; the Shopper app imports `@pcp/core`; the API imports a frontend library; a library imports another library; a project imports an app; a relative path reaches into another project; `@pcp/compatibility` imports an npm package.
- [ ] The proof fails when lint reports that the boundary rule was skipped. How this was shown is recorded under Comments.
- [ ] Shown once and then reverted, each making the proof fail on its own lines: `scope:web` allowed to depend on `scope:api`; `scope:api` allowed to depend on `scope:web`; a library allowed to depend on a library; the ban on npm packages removed from `scope:shared`.
- [ ] Checked by hand: a constraint is changed so that an import one of the shells already makes becomes forbidden. `pnpm check`, without skipping the cache, fails. The change is reverted.
- [ ] Checked by hand: a project's tags are removed, and its imports of libraries are refused. The tags are restored.
- [ ] Checked by hand: an import that reaches past a library's entry file fails `pnpm check` at type-checking. If it passes instead, a lint ban is added for it and the proof gains a case.
- [ ] Checked by hand: with no cached project graph, bare `oxlint` on a project prints the skipped-rule warning and passes. This is recorded as the behaviour the MVP spec will warn about.
- [ ] The proof's lines from ticket 01 still pass.
- [ ] The results of the fault checks and the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
