# 01: The proof command, proving that the API's domain layer cannot import infrastructure

**Spec:** [the boundary checks spec](../spec.md)

**What to build:** A file in the API's domain layer can no longer import the infrastructure layer: lint refuses it, and so does `pnpm check`. This is the workplace's domain-layer rule, re-expressed for Oxlint.

A new command, `pnpm boundaries:check`, proves it. For each case it plants a temporary file holding one import where the rule applies, lints the way `pnpm check` does, expects a forbidden import to be refused with that ban's own message and an allowed import to pass, removes what it planted, and prints one line for each case. It is run on demand and is not part of `pnpm check`.

This ticket builds the whole command against the simplest rule of the step. Tickets 02 to 04 add their rules to the lint configuration and their cases to the same command.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Before any rule is added, the time `pnpm check --skip-nx-cache` takes is noted under Comments, as the baseline for ticket 05.
- [x] Before anything is configured, Oxlint's current documentation is read for how its configuration files nest and extend each other, for how a rule is switched on for some files only, and for the options of `no-restricted-imports`. The workplace repository's lint rule for its domain layer is read as well. The findings are recorded under Comments.
- [x] A file in the API's domain layer that imports the infrastructure layer fails the API's `lint` target and `pnpm check`, whether the import is written with the `~/` alias or as a relative path.
- [x] A type-only import, a re-export and a lazy `import()` are refused in the same way.
- [x] The infrastructure layer imports the domain layer without complaint, and the API's test tree is not covered by the ban.
- [x] The ban carries its own message, which says what is forbidden and what to do instead.
- [x] The ban is the workplace's rule re-expressed for Oxlint. No file is copied from the workplace repository.
- [x] The file that states the ban is an input of the API's `lint` target: after the ban is changed, the target runs again and does not reuse a cached result.
- [x] `pnpm boundaries:check` is a plain Node script with no dependencies of its own, kept with the workspace's other tool scripts and linted with them.
- [x] For each case the command plants a temporary file holding one import, at a place in a real project where the rule applies. A forbidden case must be refused with the message of the ban it is meant for. An allowed case must not be reported.
- [x] The command lints through the projects' Nx `lint` targets, with the cache skipped.
- [x] The command prints one line for each case with a pass or a fail, and exits non-zero if any fails. It also fails if lint reports anything it did not plant.
- [x] The command removes everything it planted, including any folder it had to create, when it passes, when it fails and when it is interrupted. The planted files carry a recognisable name that Git ignores. The command refuses to start if it finds one left over.
- [x] The command's first cases are these. Forbidden: a domain file imports infrastructure through the alias, through a relative path, and as a type-only import. Allowed: an infrastructure file imports a domain file.
- [x] Shown once and then reverted: with the ban removed, each forbidden line fails. With the ban widened to cover the infrastructure layer as well, the allowed line fails.
- [x] Checked by hand: the command interrupted part-way leaves no planted file, and Git reports a clean working tree. A planted file left behind on purpose makes the command refuse to start.
- [x] `pnpm check` passes with no change to the API's source, and it does not run the new command.
- [x] The results of the fault checks and the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**The baseline.** Before any rule was added, `pnpm check --skip-nx-cache` took 4 seconds. Nx reported a run of 3.0 seconds for its 21 tasks.

**What the documentation says,** read before anything was configured:

- For each file, Oxlint uses the nearest configuration file above it. Configurations are not merged: a project's own file replaces the root's unless it names the root under `extends`. Rules, plugins and overrides are what `extends` carries over.
- A rule is switched on for some files with an `overrides` block. The documentation does not say what a block's file patterns are relative to, nor what happens when two blocks match one file.
- `no-restricted-imports` takes exact paths and patterns. A pattern is a group in gitignore style or a regular expression, and the regular expressions are Rust's, which have no lookahead. The rule covers imports, `export … from` and a lazy `import()` of a literal path. A type-only import is refused unless `allowTypeImports` is set.
- Oxlint leaves out a file that `.gitignore` matches when it walks a folder, and lints it when it is named on the command line.
- The workplace's rule applies to every file under a `domain` folder except spec files. It bans imports that match `~/infrastructure/*` or `**/infrastructure/*`, with a message that explains the layering.

**What differs from the first plan, or is not obvious.**

- **A planted file that Git ignores is invisible to the lint target.** The spec asks for both: planted files that Git ignores, and a lint run through the project's Nx target, which is `oxlint .`. Oxlint skips ignored files, and a scratch repository showed that it skips files ignored through Git's local exclude file as well. The command therefore names each planted file after the target. Nx passes the names on, the target becomes `oxlint . --format=json` followed by the planted files, and Oxlint lints a named file whatever Git says. The target, its working directory and its configuration are unchanged.
- **The report is read as JSON, asked for by name.** Only Oxlint's JSON output carries a ban's own message; its `unix` and `stylish` outputs leave it out. Oxlint also has more than one default output, so the command does not rely on the default.
- **A block's file patterns are relative to the configuration that is applied.** A scratch repository showed that a pattern in an extended file is resolved from the folder of the file that extends it. The API's ban is written in the API's own configuration, so its pattern starts at the API's folder.
- **The relative-path ban is a regular expression.** It refuses any relative import with a path segment named `infrastructure`. The alias ban is a group.
- **The expected messages are written out in the command.** It matches on the first sentence of a ban's message and does not read the lint configuration, so a ban that changes its meaning has to be changed in both places.
- **The command has lines the ticket does not list.** A re-export and a lazy import each have a line. Two more allowed lines were added: an infrastructure file that imports infrastructure, and a test file that imports infrastructure. For each project there is a line that says lint reported nothing that was not planted.
- **The lint run is not blocking.** A first version waited for each lint to finish before it could notice a signal. The command now stops the running lint and exits at once.

**Fault checks,** each reverted:

| Fault | What failed |
|---|---|
| The ban removed | All five refused lines, each with "lint did not report it". The three allowed lines passed. |
| The ban widened to every file under the API's source root | "An infrastructure file that imports infrastructure is allowed", and the line for nothing unplanted, which named the API's root module. |
| The relative-path pattern alone removed | "A domain file that imports infrastructure through a relative path is refused", and no other line. |

**A weakness in the cases, found by the second fault.** The ticket's one allowed case was an infrastructure file that imports a domain file. With the ban widened it still passed, because it imports nothing from infrastructure. The case that fails when the ban grows too broad is an infrastructure file that imports infrastructure, and it was added.

**By-hand results.**

- Interrupted with SIGINT while eight files were planted: the command exited with 1, and no planted file or folder remained. The same with SIGTERM. Git reported nothing new in the working tree.
- A planted file left behind on purpose: the command named the file, asked for it to be deleted, and exited with 1 without linting. Git did not list the file.
- The API's `lint` target twice: the second run came from the cache. After one word of the ban's message was changed, the target ran again and reported no cache hit.
- `pnpm check` passes, the API's source is unchanged, and the `check` script does not run the new command.
