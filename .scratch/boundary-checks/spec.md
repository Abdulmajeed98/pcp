# Spec: The boundary and layer checks

Status: resolved

This is step 3 of the four infrastructure steps listed under "Order of work" in [the MVP spec](../mvp/spec.md). Steps 1 and 2, [the workspace](../workspace/spec.md) and [the development services](../dev-services/spec.md), are finished. This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md) and [ADR-0004](../../docs/adr/0004-architecture-per-app.md). The owner confirmed its test seam on 9 October 2026.

## Problem Statement

The workspace has rules about what may import what, and nothing enforces them. ADR-0003 and ADR-0004 say that the frontends never touch the API's plumbing, that the API's domain layer never imports its infrastructure layer, that `compatibility` is plain TypeScript, and that both frontends obey Feature-Sliced Design's three import bans. Today all of that is prose. The eight projects carry no tags, the linter has only its recommended rules switched on, and an import that breaks any of these rules passes `pnpm check`.

The shells are almost empty, so nothing is broken yet, and that is the reason to do this now. The first module will add hundreds of imports, many of them written by coding agents that follow whatever the check accepts. A rule that is in place first costs nothing. A rule that arrives after the code has to be fitted onto it.

This kind of check has a second problem of its own. An import rule is a pattern, and a pattern that stops matching fails silently: the check stays green and the boundary is gone. The installed tools showed on 9 October 2026 that this is not a theory (see Further Notes). The owner therefore wants each rule shown to fail on a violation, in a way that can be repeated whenever the rules or the tools change.

## Solution

`pnpm check` refuses a forbidden import at three levels:

- **Between the eight projects.** Each project is tagged, and Nx's boundary rule allows an import only where the tags permit it. A frontend cannot import `@pcp/core`, the API cannot import a frontend library, a library cannot import another library or an app, and `@pcp/compatibility` cannot import any npm package.
- **Inside the API.** A file in the domain layer cannot import the infrastructure layer.
- **Inside each frontend.** A file cannot import from a layer above its own, cannot import another slice on its own layer, and cannot reach past an index file. A relative import cannot be used to step around those three bans.

Each refusal says what is forbidden, and a refusal inside an app also says what to do instead.

A second command, `pnpm boundaries:check`, proves the rules. It plants one forbidden import for each rule, expects lint to refuse it with that rule's own message, removes what it planted, and prints one line for each rule. It is run on demand and is not part of `pnpm check`.

The eight shells already obey every rule, so no source file in the three apps or the five libraries changes in this step. What changes is the lint configuration, each project's tags, one tool script and the documents.

## User Stories

### Between the projects

1. As the owner, I want every project to carry tags that say which side of the platform it belongs to and whether it is an app or a library, so that what may import what is written down in one place.
2. As the owner, I want the Shopper app and the dashboard refused when they import `@pcp/core`, so that the API's plumbing, such as its database helpers and access control, never ends up in a browser.
3. As the owner, I want the API refused when it imports `@pcp/ui`, `@pcp/i18n` or `@pcp/api-client`, so that the API never depends on frontend code or on a client generated from itself.
4. As the owner, I want `@pcp/compatibility` to stay importable by the API and by both frontends, so that the Compatibility Rules run the same on the server and in the browser.
5. As the owner, I want a library refused when it imports another library, so that a dependency between libraries is a decision I make and not something that appears.
6. As the owner, I want any import of an app refused, so that the three apps stay the ends of the graph.
7. As the owner, I want a relative path that reaches into another project refused, so that projects use each other only by their `@pcp/…` names.
8. As the owner, I want `@pcp/compatibility` refused when it imports any npm package, so that it stays plain TypeScript without Effect, as ADR-0004 decided.
9. As the owner, I want a project that has no tags to be allowed no imports of other projects, so that a project added later is closed until I tag it.
10. As the owner, I want an import past a library's single entry file to keep failing, so that a library's inside stays free to change.
11. As the owner, I want loosening a boundary to be an edit to one short list, so that it shows up in a commit as the decision it is.
12. As a coding agent, I want the rules between projects stated as a short table in the MVP spec, so that I know what a project may use before I write the import.

### Inside the API

13. As the owner, I want a domain file refused when it imports the infrastructure layer through the `~/` alias, so that use cases never depend on a database, a controller or a NestJS module.
14. As the owner, I want the same import refused when it is written as a relative path, so that the rule cannot be stepped around.
15. As the owner, I want a type-only import to count, so that an infrastructure type cannot leak into the domain layer either.
16. As the owner, I want the infrastructure layer left free to import the domain layer, so that the allowed direction costs nothing.
17. As the owner, I want the API's test tree left out of this ban, so that the rule matches the one at my workplace.
18. As the owner, I want the ban re-expressed for Oxlint from the workplace's rule and not copied, so that what I practise here carries over while the repository keeps one linter.

### Inside the frontends

19. As the owner, I want a file refused when it imports from a layer above its own, so that Feature-Sliced Design's one-way flow holds from the first slice.
20. As the owner, I want a slice refused when it imports another slice on its own layer, so that two features are joined on a layer above and never tangled together.
21. As the owner, I want every import of a slice to go through that slice's index file, so that a slice's inside stays free to change.
22. As the owner, I want the Shared layer imported through each segment's index file, so that Shared has the same kind of public face as a slice.
23. As the owner, I want a relative import that climbs out of its own slice refused, so that the convention ADR-0004 relies on is checked and not only written down.
24. As the owner, I want a relative import that crosses from one layer into another refused, so that every crossing uses the `@/` alias, where the bans apply.
25. As the owner, I want Next's routing folder in the Shopper app to import only the App and Pages layers, so that it keeps doing nothing but route.
26. As the owner, I want the bans in place for the Widgets, Features and Entities layers before those folders exist, so that the first slice is covered from its first file.
27. As the owner, I want the same rules in both frontends, stated once and applied with each app's own layer names, so that the Shopper app and the dashboard cannot drift apart.
28. As the owner, I want a lazy `import()` and a re-export to count as imports, so that neither is a way around a ban.
29. As the owner, I want every layer left free to import the app's libraries by their `@pcp/…` names, so that the frontend bans do not get in the way of the project rules, which already cover that.

### When a rule fires

30. As a coding agent, I want each refusal to say what is forbidden and what to do instead, so that I fix the import without reading the lint configuration.
31. As the owner, I want a forbidden import to fail `pnpm check`, so that a green check means the boundaries held.
32. As the owner, I want to see a violation by linting one project, so that I do not wait for the whole check while working on one thing.
33. As the owner, I want a change to a rule or to a tag to run lint again and not reuse a cached pass, so that the cache never hides a boundary I have just moved.
34. As the owner, I want `pnpm check` on a fresh clone to print no warning about a skipped rule, so that a warning, when one appears, means something.
35. As the owner, I want every rule to run under Oxlint, so that the repository keeps one linter.
36. As the owner, I want the eight shells to pass the new rules without any change to their source, so that this step proves the rules fit the layout step 1 built.

### The proof

37. As the owner, I want one command that proves every rule fails on a violation, so that I do not plant faults by hand each time something changes.
38. As the owner, I want that command to print one line for each rule, so that a failure tells me which boundary has stopped holding.
39. As the owner, I want it to exit with an error when any line fails, so that a script or an agent can rely on it.
40. As the owner, I want it to check that allowed imports still pass, so that a rule that has grown too broad is caught as well as one that has gone slack.
41. As the owner, I want a violation that is caught by the wrong rule to count as a failure, so that each rule is proven on its own.
42. As the owner, I want it to fail when lint reports that the boundary rule was skipped, so that a skipped rule is never counted as a pass.
43. As the owner, I want it to lint the way `pnpm check` does, so that it proves the real check and not a copy of it.
44. As the owner, I want it to leave the working tree exactly as it found it, even when it is interrupted, so that a planted fault is never committed.
45. As the owner, I want it kept out of `pnpm check`, so that the everyday check stays as fast as it is.
46. As the owner, I want written down when it has to be run, so that leaving it out of `pnpm check` does not mean it is forgotten.
47. As the owner, I want the proof itself shown once to fail, so that I trust its passes.

### Housekeeping

48. As the owner, I want Oxlint pinned to an exact version, so that an upgrade that could break the boundary rule is a decision and is followed by the proof.
49. As a coding agent, I want the rules, the new command and when to run it written into the MVP spec, so that every later ticket starts from them.
50. As the owner, I want ADR-0004 to say that the relative-import convention is now checked, so that the ADR and the checks agree.
51. As the owner, I want a commit after each piece of this work, each leaving `pnpm check` passing, so that the history shows how the checks were assembled.

## Implementation Decisions

### How the checks run

- Every rule in this step is a lint rule that runs under Oxlint, inside each project's existing `lint` target. `pnpm check` gains no new part and the repository gains no new linter. ESLint stays as ADR-0004 describes it: installed as a library that Nx's rule needs, configured nowhere and run by nothing.
- The rules between projects use Nx's boundary rule, through the bridge that Nx ships for Oxlint and marks as experimental. The rules inside an app use Oxlint's own `no-restricted-imports` rule, as ADR-0004 decided.
- Nx's boundary rule reads Nx's cached project graph. When lint runs through Nx the graph is there. When bare `oxlint` runs with no cached graph, the rule prints a warning, checks nothing and passes. The boundary rule therefore counts only when lint runs through Nx, which is how `pnpm check` and each project's `lint` target run it. The MVP spec says so. (Corrected on 9 October 2026. Through Nx the graph is there by default, but not when Nx has been told not to cache it. See the Comments of ticket 02.)
- The boundary rule is switched on for files inside the eight projects only. `pnpm check` lints the files that belong to no project before Nx starts, and that lint does not load the rule, so a fresh clone prints no skipped-rule warning.
- The bridge is declared in a JSON Oxlint configuration. Nx's plugin reads only JSON configurations when it works out what a lint result depends on, and it is the bridge's presence there that makes a project's cached lint result depend on the files and package manifests of the projects it imports.
- Whatever file states a rule is an input of every lint target it governs, so that a change to a rule never leaves a cached pass behind.
- The rules reach all eight projects, including the libraries that have no Oxlint configuration of their own.
- Nx's documentation for the Oxlint bridge and Oxlint's documentation for its configuration files are read before anything is configured.

### Between the eight projects

Each project carries two tags, one for each of two dimensions, which is the scheme Nx's own documentation describes. The tags are recorded in each project's package manifest, beside its other Nx settings.

| Project | Scope | Type |
|---|---|---|
| `@pcp/api` | `scope:api` | `type:app` |
| `@pcp/core` | `scope:api` | `type:lib` |
| `@pcp/shopper` | `scope:web` | `type:app` |
| `@pcp/dashboard` | `scope:web` | `type:app` |
| `@pcp/api-client` | `scope:web` | `type:lib` |
| `@pcp/ui` | `scope:web` | `type:lib` |
| `@pcp/i18n` | `scope:web` | `type:lib` |
| `@pcp/compatibility` | `scope:shared` | `type:lib` |

The constraints:

- A `scope:api` project may depend on `scope:api` and `scope:shared` projects.
- A `scope:web` project may depend on `scope:web` and `scope:shared` projects.
- A `scope:shared` project may depend on `scope:shared` projects only, and may import no npm package at all.
- A `type:app` project may depend on `type:lib` projects.
- A `type:lib` project may depend on no other library.

Together they allow exactly this:

| Project | May import |
|---|---|
| `@pcp/api` | `@pcp/core`, `@pcp/compatibility` |
| `@pcp/shopper` | `@pcp/api-client`, `@pcp/ui`, `@pcp/i18n`, `@pcp/compatibility` |
| `@pcp/dashboard` | `@pcp/api-client`, `@pcp/ui`, `@pcp/i18n`, `@pcp/compatibility` |
| Each of the five libraries | No other project |

- The rule's built-in bans are kept as they are: no import of an app, no relative or absolute path into another project, no circular dependency between projects, and no imports of other projects at all for a project whose tags match no constraint. (Noted on 9 October 2026. An app cannot be imported by its name at all, because the apps export nothing. The way into an app is a relative path, which the rule refuses. See the Comments of ticket 02.)
- A library's single entry file needs no new rule if it is already enforced, and it should be: each library's package manifest exports its entry file and nothing else, so an import that reaches past it should fail type-checking. This step shows that failure once and records it. A lint ban is added only if the import turns out to pass.
- The first dependency between two libraries, when one is needed, is made by changing the `type:lib` constraint on purpose.

### Inside the API

- A file in the API's domain layer may not import the infrastructure layer, whether the import is written with the `~/` alias or as a relative path. Type-only imports, re-exports and lazy imports count.
- The infrastructure layer may import the domain layer freely.
- The ban covers the domain layer's source. The test tree is left out, as it is at the workplace.
- This is the workplace's domain-layer rule, re-expressed for Oxlint as ADR-0004 says. No file is copied.

### Inside the frontends

The layers, from top to bottom, with what each may import through the `@/` alias:

| Layer | Folder in the dashboard | Folder in the Shopper app | Has slices | May import |
|---|---|---|---|---|
| App | `app` | `_app` | No | Every layer below |
| Pages | `pages` | `_pages` | Yes | Widgets, Features, Entities, Shared |
| Widgets | `widgets` | `widgets` | Yes | Features, Entities, Shared |
| Features | `features` | `features` | Yes | Entities, Shared |
| Entities | `entities` | `entities` | Yes | Shared |
| Shared | `shared` | `shared` | No | Other segments of Shared |

- **The layer ban.** A file may not import from a layer above its own.
- **The slice ban.** On the four layers that have slices, a file may not import its own layer through the alias. Imports inside a slice are relative, so an alias import of the same layer is another slice. The App and Shared layers have no slices, and their segments may import each other.
- **The index ban.** A slice is imported through its index file and nothing deeper. The Shared layer is imported through each segment's index file, as the shells already do. The App layer is imported through its own index file, which only Next's routing folder uses.
- **Relative imports stay at home.** On a layer that has slices, a relative import may not climb out of its own slice. This is checked for a file in the slice's own folder, in a segment, and in one folder inside a segment. A file nested deeper than that may not use a climbing relative import at all, so the rule is closed where it cannot see, and the depth is raised if a slice ever needs it. In the App and Shared layers and in Next's routing folder, a relative import may not climb into another layer. Every crossing therefore uses the alias, where the three bans above apply.
- **Next's routing folder.** In the Shopper app, a file in Next's own `app` folder imports project code only from the App layer and from a page in the Pages layer, each through its index file. Relative imports inside the routing folder itself are allowed.
- The bans are written for all six layers now. The Widgets, Features and Entities folders are still created only when the first slice needs them, as step 1 decided.
- The bans are stated once for both frontends and applied to each with its own layer names. How that is done is settled during implementation, within two facts found on the installed tools: when two blocks of an Oxlint configuration match the same file, the later block replaces the earlier block's options for a rule instead of adding to them, so all the bans for one file are stated together; and Nx's plugin follows the chain of JSON configurations but treats a TypeScript configuration as one opaque file.
- All four bans cover type-only imports, re-exports and lazy `import()`.
- Any layer may import the app's libraries by their `@pcp/…` names. The rules between projects govern that.

### Messages

- Each ban inside an app carries its own message. It names what is forbidden and says what to do instead, in one or two sentences: for example, that a slice is imported through its index file, or that two slices on one layer are joined on a layer above.
- The rules between projects use the messages built into Nx's rule, which cannot be changed. They name the tag of the importing project and the tags it may depend on, or the package it may not import.
- The messages are distinct enough to tell the bans apart, because the proof matches on them.

### The proof command

- `pnpm boundaries:check` is a plain Node script with no dependencies of its own, kept and linted with the workspace's other tool scripts, like the services check.
- For each case it plants a temporary file holding one import, at a place in a real project where the rule applies. A forbidden case must be refused with the message of the ban it is meant for. An allowed case must not be reported. One import to a file, so that one rule cannot answer for another.
- It lints the way `pnpm check` does: through the projects' Nx `lint` targets, with the cache skipped. The project graph and the configuration are then the ones the real check uses.
- It fails if lint reports anything it did not plant, and it fails if lint reports that the boundary rule was skipped.
- It prints one line for each case with a pass or a fail, and exits non-zero if any fails.
- It removes everything it planted, including any folder it had to create for a layer that does not exist yet, and it does so when it fails and when it is interrupted. The planted files carry a recognisable name that Git ignores, so one that survives a crash cannot be committed. It refuses to start if it finds one left over.
- It is run on its own, and not while `pnpm check` or a development server is running, because both would see the planted files.
- It is not part of `pnpm check`. The owner decided this on 9 October 2026, to keep the everyday check as fast as it is.
- It is run after any change to the lint configuration, to a project's tags or to the name of a layer folder, after any upgrade of Oxlint or Nx, and when a project is added. The MVP spec says so beside the command.

### Versions

- Oxlint is pinned to an exact version, as Oxfmt is. The boundary rule runs on Oxlint's interface for JavaScript plugins, which Oxlint says is outside its version policy and may change in any release. Oxlint's current release is checked before the version is pinned.
- Nx and its plugins stay pinned together, as step 1 decided. The bridge is part of Nx's Oxlint plugin and moves with it.

### Recording

- The MVP spec's Technology section gains the rules between projects as a table, the API's layer rule, the frontends' bans, the new command with when to run it, and the warning that bare `oxlint` is not a boundary check. It says that step 3 is finished and that step 4 is still to come.
- ADR-0004 is brought up to date: the relative-import convention it relies on is now checked, to the depth stated above.
- The work is committed in pieces, each leaving `pnpm check` passing.

## Testing Decisions

A good test of this step puts an import where a rule applies and observes what lint says, from the repository root, on the real projects. A forbidden import is refused with the message of the ban it breaks, and an allowed import passes. It does not assert the contents of the lint configuration, which may change freely as long as the same imports are refused and allowed.

- **One seam: the repository root,** the seam step 1 already uses. `pnpm check` shows that a sound workspace passes, and `pnpm boundaries:check` shows that each rule refuses a violation. The owner chose a scripted proof, run on demand, on 9 October 2026.
- **Forbidden cases the proof plants.** Each must be refused by its own ban:
  - Between projects: the dashboard imports `@pcp/core`; the Shopper app imports `@pcp/core`; the API imports a frontend library; a library imports another library; a project imports an app; a relative path reaches into another project; `@pcp/compatibility` imports an npm package.
  - In the API: a domain file imports infrastructure through the alias, through a relative path, and as a type-only import.
  - In each frontend: a Shared file imports a page; a page imports another page; an import reaches past a slice's index file; an import reaches past a Shared segment's index file; a relative import climbs out of its slice; a relative import in Shared climbs into another layer; a Features file imports the Widgets layer, which proves a layer whose folder does not exist yet; one ban is broken with a lazy `import()`.
  - In the Shopper app only: Next's routing folder imports the Shared layer directly, and reaches past the App layer's index file.
- **Allowed cases the proof plants.** Each must pass: an infrastructure file imports the domain layer; a page imports Shared through a segment's index file; one segment of a slice imports another segment of the same slice by a relative path; one Shared segment imports another; a route file imports a page through its index file.
- **The shells pass.** `pnpm check` passes on the workspace as it stands, with no change to the source of any app or library. This is also what shows that each app may still import the libraries it uses today.
- **From scratch.** In a fresh clone in a new directory, one install followed by `pnpm check --skip-nx-cache` passes and prints no skipped-rule warning, and `pnpm boundaries:check` then passes on every line. Steps 1 and 2 showed that results left over from earlier runs can hide a fault, so this run is the one that counts.
- **The proof is seen to fail.** For each of the three levels, one ban is weakened by hand and `pnpm boundaries:check` is shown to fail on that line. One ban is also widened so that an allowed case fails. Each change is then reverted. A check that has never been seen to fail is not trusted, and that includes this one.
- **By hand, once:**
  - A constraint is changed so that an import one of the shells already makes becomes forbidden. `pnpm check`, without skipping the cache, fails. The change is reverted.
  - A project's tags are removed. Its imports of libraries are refused. The tags are restored.
  - An import that reaches past a library's entry file fails `pnpm check` at type-checking.
  - The proof is interrupted part-way. No planted file remains and Git reports a clean working tree.
  - A second `pnpm check` with nothing changed still completes from the cache, and the time the first one takes is noted beside the time it took before this step.
- **No test code inside the apps or libraries.** Nothing in their source changes in this step.
- **Prior art.** The scripted services check from step 2 is the model for the proof command: a plain Node script, one line for each check, an exit code. The by-hand fault checks in step 1's tickets are the model for how results are written down. The workplace backend's lint rule for its domain layer is the model for the API's ban: its meaning is followed and no file is copied.
- **Recording.** The results of the fault checks and the by-hand checks are written under the Comments heading of the ticket that carries them out.

## Out of Scope

- Login, the API's guard and token verification, generating `api-client`, and a Shopper page fetched from the API (step 4).
- The workplace's Jest rules for test files, which ADR-0004 also says are to be re-expressed for Oxlint. They are not boundary checks, and one of them names test helpers that `core` does not have yet. They arrive with the first real API tests, in step 4.
- The other things the workplace's documents ask of the domain layer: that it uses no NestJS decorator except `@Injectable()`, that it never throws, and that it imports only `core` and Effect. The workplace does not lint these either.
- Layers inside `core`, which has none yet. The API's ban is extended to `core` when it gains a domain and an infrastructure layer.
- Rules between features inside the API's infrastructure layer. No ADR decides them.
- Banning database packages in the frontends. That is added when Drizzle is installed.
- Feature-Sliced Design's rules about the names of slices and segments, and its notation for one entity referring to another.
- Steiger, which ADR-0004 rules out, and any ESLint configuration.
- Circular imports between files inside one project.
- Creating the Widgets, Features and Entities folders, and any change to the source of the three apps or the five libraries.
- Running the proof as part of `pnpm check`, which the owner decided against.
- Automated checks on GitHub, Git hooks, and showing these rules in an editor.
- Every module in the MVP's capability map.

## Further Notes

- **Choices made here that no ADR records.** The owner may overrule any of them before work starts:
  - The tag names, and the split into a scope and a type.
  - The dashboard may import `@pcp/compatibility`. Step 1's shell does not import it, but the library is shared so that it can run anywhere, and nothing is gained by closing it to one frontend.
  - A library may import no other library. Step 1 had none that did, and this turns that into a rule until a decision changes it.
  - `@pcp/compatibility` may import no npm package at all. ADR-0004 names only Effect; step 1 said the library has no dependencies of any kind, and this checks that.
  - The Shared layer is imported through each segment's index file. Feature-Sliced Design also permits an index for each component inside a segment, and that can be allowed when Shared holds enough to need it.
  - Relative imports are checked, and to the depth stated. ADR-0004 made the relative-import convention part of the architecture without checking it.
  - Next's routing folder is limited to the App and Pages layers. ADR-0004 says that the folder only routes; this is that sentence made checkable.
  - Oxlint is pinned exactly.
  - The command is named `pnpm boundaries:check`, after `pnpm services:check`.
- **Found on the installed tools on 9 October 2026,** with Oxlint 1.87.0 and Nx 23.2.1. Each was tried in a scratch configuration, and nothing in the repository was changed:
  - Nx's boundary rule runs under Oxlint through the bridge. It refused an import between projects that the tags did not allow, a relative path into another project, a lazy import, an npm package banned for a tag, and an import of a workspace library that the importing project does not list as a dependency.
  - With no cached project graph, the same rule printed "No cached ProjectGraph is available. The rule will be skipped." and lint passed.
  - Oxlint's `no-restricted-imports` matches both alias and relative imports, by pattern and by regular expression, and it sees type-only imports, re-exports and lazy `import()`.
  - In an Oxlint configuration, a `*` in a file pattern does not cross a folder boundary, which is what makes the depth of a file checkable.
  - When two blocks match the same file, the later one replaced the earlier one's options for `no-restricted-imports`. A layer ban stated in one block was lost to a relative-import ban stated in a later one.
  - Nx's Oxlint plugin reads JSON configurations and the JSON files they extend. For a TypeScript configuration it tracks the file alone and does not see the plugins it declares.
- **Two ways a boundary can go quiet, both seen above.** A skipped rule passes, and a later block silently replaces an earlier one. A renamed layer folder would be a third. This is what `pnpm boundaries:check` exists to catch.
- **A behaviour of Nx's rule worth knowing.** It refuses a static import of a library that the same project also imports lazily. A frontend that lazy-loads something from a library has to do so consistently.
- **The bridge is experimental.** Nx says so in the package's own description, and the bridge's source says that Oxlint's plugin interface may change in any release. If an upgrade breaks it, the proof says so, and the pinned versions stay until it is fixed.
- **Checked in the workplace repository on 9 October 2026.** Its lint configuration bans imports of the infrastructure layer from files in the domain layer, by alias and by relative path, and leaves spec files out. Its projects carry no tags and its boundary rule allows every project to depend on every other, so the tags here are this project's own.
- **The lesson from steps 1 and 2.** Results left over from earlier runs hid faults in both. Every claim in this step is checked on a fresh clone with the cache skipped.
- **Next steps.** Step 4 is the proof that the parts connect. It is the first step to write real code in the API and in both frontends, and so the first to meet these rules.
- **Changed by the code review on 9 October 2026.** The Comments of ticket 05 list everything. Where this spec and the result differ:
  - `pnpm check` gained one part: it compares the frontends' written bans with their statement.
  - The boundary rule applies to every file of a project, not only to its source folders, and the files outside the projects are linted with a second configuration that switches it off.
  - In the App and Shared layers a relative import may not leave the layer, counted by depth as for a slice. This spec had it refused when it climbed into a folder named like a layer.
  - Four bans were added to close ways round the first three: a relative import is in its shortest form, the `@/` alias reaches only the layers, a layer is not imported with nothing named after it, and a file outside any slice makes no relative import.
