# 02: The eight projects are tagged, and a forbidden import between them is refused

**Spec:** [the boundary checks spec](../spec.md)

**What to build:** Each of the eight projects carries a scope tag and a type tag, and Nx's boundary rule allows an import between projects only where the tags permit it. A frontend cannot import `@pcp/core`, the API cannot import a frontend library, a library cannot import another library or an app, no project reaches into another by a relative path, and `@pcp/compatibility` cannot import any npm package. The imports the shells make today all stay allowed.

The rule runs under Oxlint through the bridge that Nx ships and marks as experimental. With no cached project graph the rule checks nothing and passes, so this ticket also makes sure that it is run only through Nx, that a fresh clone prints no skipped-rule warning, and that the proof counts a skipped rule as a failure.

**Blocked by:** 01

**Status:** resolved

- [x] Before anything is configured, Nx's current documentation is read for its boundary rule, for tags in more than one dimension and for the Oxlint bridge, and Oxlint's for JavaScript plugins. Oxlint's current release is checked. The findings are recorded under Comments.
- [x] Oxlint is pinned to an exact version.
- [x] Each of the eight projects carries the two tags in the spec's table, recorded in its package manifest. Nx's project graph shows them.
- [x] Nx's boundary rule runs under Oxlint through Nx's bridge, with the five constraints in the spec. ESLint stays as ADR-0004 describes it: no manifest lists it, nothing configures it and nothing runs it.
- [x] The bridge is declared in a JSON Oxlint configuration, and the rule reaches all eight projects, including the libraries that have no Oxlint configuration of their own.
- [x] The rule is switched on for files inside the eight projects only. With no cached project graph, `pnpm check` prints no skipped-rule warning.
- [x] The spec's table of allowed imports holds: `pnpm check` passes with no change to the source of any app or library.
- [x] After a tag or a constraint is changed, the affected `lint` targets run again and do not reuse a cached result.
- [x] The proof gains these forbidden cases, each matched on the message Nx gives for that constraint: the dashboard imports `@pcp/core`; the Shopper app imports `@pcp/core`; the API imports a frontend library; a library imports another library; a relative path reaches into a library and into an app; `@pcp/compatibility` imports an npm package. (Reworded on 9 October 2026. It first listed "a project imports an app" as a case of its own. An app cannot be imported by its name, so the only way in is a relative path: see Comments.)
- [x] The proof fails when lint reports that the boundary rule was skipped. How this was shown is recorded under Comments.
- [x] Shown once and then reverted, each making the proof fail on its own lines: `scope:web` allowed to depend on `scope:api`; `scope:api` allowed to depend on `scope:web`; a library allowed to depend on a library; the ban on npm packages removed from `scope:shared`.
- [x] Checked by hand: a constraint is changed so that an import one of the shells already makes becomes forbidden. `pnpm check`, without skipping the cache, fails. The change is reverted.
- [x] Checked by hand: a project's tags are removed, and its imports of libraries are refused. The tags are restored.
- [x] Checked by hand: an import that reaches past a library's entry file fails `pnpm check` at type-checking. If it passes instead, a lint ban is added for it and the proof gains a case.
- [x] Checked by hand: with no cached project graph, bare `oxlint` on a project prints the skipped-rule warning and passes. This is recorded as the behaviour the MVP spec will warn about.
- [x] The proof's lines from ticket 01 still pass.
- [x] The results of the fault checks and the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**Versions.** Oxlint is pinned to 1.87.0, which is its current release and the one that was already installed. Nx stays at 23.2.1, where step 1 pinned it with its plugins; 23.3.0 has been released since and was not adopted in this step.

**What the documentation says,** read before anything was configured:

- Nx: a project's tags go in its package manifest, under `nx`. A project with no tags cannot depend on any other project. Under Oxlint the rule is `@nx/enforce-module-boundaries`, and it is loaded by naming `@nx/oxlint/boundaries-plugin` under `jsPlugins`. Nx marks this as experimental, because Oxlint keeps its interface for JavaScript plugins outside its version policy.
- Nx: a project tagged in two dimensions is checked against the constraints for each of its tags. Packages are banned for a tag with `bannedExternalImports`, where `*` is a wildcard.
- Oxlint: JavaScript plugins are in alpha. A plugin is named by any import specifier, resolved from the configuration file that names it. The documentation does not say whether a plugin is carried over by `extends` or may be declared inside an `overrides` block. A scratch repository showed that both work.

**How it is configured, and why.**

- **The bridge is named at the top of the root configuration, and the rule is switched on in a block for source files.** Nx's plugin looks for the bridge only at the top of a JSON configuration, and that is what makes a lint result depend on the files and manifests of the projects it imports. The rule itself applies to files under a `src` folder or an `app` folder, at any depth. Written that way the patterns match both from the repository root, which is how the four libraries without a configuration of their own meet them, and from a project's own folder, which is how the four projects that extend the root meet them.
- **The files outside the projects never start the rule.** None of them is under a `src` or an `app` folder. `pnpm check` on a workspace with no cached project graph printed no skipped-rule warning.
- **A project's own tool configuration is not covered.** The files at a project's root, such as its webpack, Vite, Next and Jest configuration, are outside `src` and `app`. They import build tools and no other project. (Changed by the code review on 9 October 2026. The rule now applies to every file of a project: see the Comments of ticket 05.)
- **A new project is covered without doing anything,** as long as its code is under `src` and its configuration, if it has one, extends the root's. Until it is tagged it may import no other project.

**What differs from the first plan, or is not obvious.**

- **An app cannot be imported by its name, so that case became a relative path.** The three apps export nothing: their manifests name no entry file. An import of `@pcp/dashboard` does not resolve, Nx's rule does not see it, and type-checking refuses it. Checked by hand: lint passed and `@pcp/api:typecheck` failed. The way into an app that does resolve is a relative path, which the rule refuses, and the proof has a line for it. The rule's own "Imports of apps are forbidden" would only be reached if an app were given an entry file.
- **The ban on npm packages sees only a package that is installed.** The proof's case imports `rxjs`. Checked by hand: an import of `effect`, which is not installed yet, was not reported by lint. It fails type-checking instead. Once Effect is installed for the API, an import of it from `@pcp/compatibility` is seen by the rule.
- **Run through Nx, the rule can still be skipped.** The spec says that the project graph is always there when lint runs through Nx. That holds by default. With Nx told not to write the graph to disk (`NX_CACHE_PROJECT_GRAPH=false`, with the daemon off and an empty workspace data folder), the Nx `lint` targets printed the skipped-rule warning and passed. This is how the proof's new lines were shown to fail.
- **The proof has a line for each project that says lint skipped no rule.** With the graph out of reach as above, all five of those lines failed, and so did every refused line between projects. The API's lines for its own layer ban still passed, because that ban does not need the graph.
- **The API's case is planted in the domain layer.** That file is under both the boundary rule and the API's own ban, in two different blocks, and each reports its own import. Two blocks replace each other only when they set the same rule.
- **One allowed line was added:** the dashboard may import `@pcp/compatibility`. No shell makes that import, so nothing else would notice if it were closed.
- **The entry-file rule needs no lint ban.** Checked by hand: an import of `@pcp/core/src/index` from the API fails type-checking with "Cannot find module", and passes lint.

**Fault checks,** each reverted:

| Fault | What failed |
|---|---|
| `scope:web` allowed to depend on `scope:api` | "The dashboard cannot import @pcp/core" and "The Shopper app cannot import @pcp/core" |
| `scope:api` allowed to depend on `scope:web` | "The API cannot import a frontend library" |
| A library allowed to depend on a library | "A library cannot import another library" |
| The ban on npm packages removed from `scope:shared` | "@pcp/compatibility cannot import an npm package" |
| `scope:web` no longer allowed `scope:shared` | "The dashboard may import @pcp/compatibility"; both lines for `@pcp/core`, each caught with the wrong wording; and the Shopper app's line for nothing unplanted, which named its import of `@pcp/compatibility` |

**By-hand results.**

- After a full `pnpm check` from the cache (21 of 21 tasks), `scope:api` was no longer allowed `scope:shared`. `pnpm check`, with the cache in use, failed: `@pcp/api:lint` ran again and refused the API's import of `@pcp/compatibility`. Reverted.
- The dashboard's tags were removed. Its `lint` target ran again and refused all three of its library imports with "A project without tags matching at least one constraint cannot depend on any libraries". Restored, and the target passed from the cache.
- With no cached project graph, bare `oxlint` in the dashboard's folder printed "No cached ProjectGraph is available. The rule will be skipped." for each file and exited with 0.
- Nx's project graph shows the two tags on each of the eight projects, and the same dependencies between them as step 1 recorded.
- No package manifest lists ESLint and no ESLint configuration exists.
- The proof's lines from ticket 01 still pass, and `pnpm check --skip-nx-cache` passes with no change to the source of any app or library.

