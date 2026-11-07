# 01: The values the rules compare move into the library

**Spec:** [the compatibility spec](../spec.md)

**What to build:** This ticket prefactors before any rule is written. The fixed sets of values that the Compatibility Rules compare or read by value move unchanged from the API's domain into `@pcp/compatibility`, which exports them: sockets, RAM types, motherboard form factors, PSU form factors, a drive's interfaces and form factors, and an M.2 slot's keys. The API's specification lists import them from there, the API's first real import of the library. Once the rules exist they name these values through the library's own sets, so a misspelt value fails the type check instead of never matching. Nothing changes for the Admin: the forms offer the same values, and the Categories endpoint answers the same sets.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] **Moved unchanged.** Every value keeps its place in its set, and the comments that say why a value is in a set or left out, such as "LGA 1151v2", "LGA 115" and "LGA 1121", and why the sets are shared, move with them.
- [ ] **Written once.** No copy of a set is left in the API. Every specification list that uses a set imports it from the library, the M.2 slot's keys among them, which the motherboard's list wrote inline.
- [ ] **The library stays plain.** It imports no npm package and no other project, uses no Effect, and is imported through its single entry file.
- [ ] **The placeholder.** The library's placeholder export goes. The Shopper app's list of the libraries it does not use yet keeps proving that the library resolves, through one of the sets, until `builder` imports the library for real. Its comment says so.
- [ ] The Categories endpoint's tests pass unchanged, the one of the values a Compatibility Rule compares among them, and so do the API's other tests.
- [ ] `pnpm boundaries:check`, run on its own, passes: the library still refuses an npm package and another project.
- [ ] `pnpm integration:check` and `pnpm check` pass, `pnpm check` with Docker stopped.
- [ ] The work is committed, leaving both checks passing.
