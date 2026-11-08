# 01: The values the rules compare move into the library

**Spec:** [the compatibility spec](../spec.md)

**What to build:** This ticket prefactors before any rule is written. The fixed sets of values that the Compatibility Rules compare or read by value move unchanged from the API's domain into `@pcp/compatibility`, which exports them: sockets, RAM types, motherboard form factors, PSU form factors, a drive's interfaces and form factors, and an M.2 slot's keys. The API's specification lists import them from there, the API's first real import of the library. Once the rules exist they name these values through the library's own sets, so a misspelt value fails the type check instead of never matching. Nothing changes for the Admin: the forms offer the same values, and the Categories endpoint answers the same sets.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] **Moved unchanged.** Every value keeps its place in its set, and the comments that say why a value is in a set or left out, such as "LGA 1151v2", "LGA 115" and "LGA 1121", and why the sets are shared, move with them.
- [x] **Written once.** No copy of a set is left in the API. Every specification list that uses a set imports it from the library, the M.2 slot's keys among them, which the motherboard's list wrote inline.
- [x] **The library stays plain.** It imports no npm package and no other project, uses no Effect, and is imported through its single entry file.
- [x] **The placeholder.** The library's placeholder export goes. The Shopper app's list of the libraries it does not use yet keeps proving that the library resolves, through one of the sets, until `builder` imports the library for real. Its comment says so.
- [x] The Categories endpoint's tests pass unchanged, the one of the values a Compatibility Rule compares among them, and so do the API's other tests.
- [x] `pnpm boundaries:check`, run on its own, passes: the library still refuses an npm package and another project.
- [x] `pnpm integration:check` and `pnpm check` pass, `pnpm check` with Docker stopped.
- [x] The work is committed, leaving both checks passing.

## Comments

### 7 November 2026: the move

**Commits.** `7b07874` moves the sets. It changes `compatibility`, `api` and `shopper`, so it takes no scope. This record follows it.

**Where the sets are.** In `libs/compatibility/src/fixed-sets.ts`, exported through the library's one entry file, `src/index.ts`: `sockets`, `ramTypes`, `motherboardFormFactors`, `powerSupplyFormFactors`, `storageFormFactors`, `storageInterfaces` and `m2SlotKeys`. Each keeps the name it had in the API, the drive's two sets the names the storage list gave them for itself; the M.2 slot's keys, which the motherboard's list wrote inline, are named `m2SlotKeys`. They stay `as const`. The file imports nothing.

**Written once.** The API's `shared-sets.ts` is deleted, and so are the storage list's two sets of its own and the motherboard list's inline keys. The seven lists that use a set, the CPU's, the CPU cooler's, the motherboard's, the RAM's, the storage's, the case's and the PSU's, import it from `@pcp/compatibility` by its package name, the API's first real import of the library; the GPU's list uses none. No other copy of a set was in the API: the values written elsewhere in it are examples, in its description and in one comment, and test data.

**Moved unchanged, proved whole.** A script kept outside the repository printed every Category's specification list from the API's domain, each specification's path, label, kind, unit, fixed set, fields, needed mark and reading of 0, before the move and after it. The two prints are the same byte for byte, 1,733 lines: 46 sockets, 5 RAM types, 12 motherboard and 7 PSU form factors, 9 drive form factors, 21 drive interfaces and 3 keys, each value in its place.

**The comments.** The reasons "LGA 1151v2", "LGA 115" and "LGA 1121" are left out, and the storage list's note on what the rules count drives by, moved word for word. The note on why the sets are shared moved with its reasons unchanged, and now names the four sets it is about, since the file holds the drive's sets and the keys too. A note at the top says what the file is: the values the rules compare or read by value, which the API's lists take from it, where a new value is added once for the Admin's forms and the rules alike. The motherboard's note on the keys said "A drive goes only in a slot keyed M". The spec's reading of rule 14, which ticket 04 builds, lets a slot keyed B take an M.2 SATA drive, so the note moved in the spec's words: a slot keyed M takes any M.2 drive, one keyed B only an M.2 SATA drive, and slots keyed E are for wireless cards.

**The placeholder.** `compatibilityPlaceholder` is gone. The Shopper app's `libraries`, in its Shared layer's `config` segment, holds `sockets`, and its comment says that `@pcp/compatibility` is proved through one of its sets until `builder` imports the library for real.

**The library still refuses another project, shown once.** `pnpm boundaries:check` plants its import of an npm package in `@pcp/compatibility` itself, but its import of another library in `@pcp/ui`, under the `type:lib` constraint the two share. So once, on `7b07874`, `export { openDbName } from '@pcp/opendb';` was put at the top of the library's entry file, and `nx run @pcp/compatibility:lint --skip-nx-cache` failed on it with "A project tagged with "type:lib" cannot depend on any libs with tags". The inverse edit took it out, `git status` was clean, and the lint passed again.

**Checks.** `pnpm check --skip-nx-cache` passes on the final tree, with every `*.tsbuildinfo` outside `node_modules` deleted first, `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`, as earlier tickets stood in for Docker stopped; Docker itself was left running for ticket 07's worktree. `pnpm integration:check` passes with 535 tests in 20 files. `pnpm boundaries:check`, run on its own, passes on all 128 lines, `@pcp/compatibility`'s three among them. The Categories endpoint's eight tests pass unchanged, the one of the values a Compatibility Rule compares among them, and so do the API's 79 tests in 10 files that `pnpm check` runs. `7b07874` was gated on both checks before it was made. No test was added: the spec proves the sets at seam 1, through the Categories endpoint's test that was already there.

**For the next tickets.** The library has no `test` target yet; ticket 02 adds it. A rule can name a value through its set's type, such as `(typeof sockets)[number]`, so that a misspelt value fails the type check. Nothing here touches the GPU's list or the import, which ticket 07 changes.
