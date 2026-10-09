# 01: The proof command, proving that the API's domain layer cannot import infrastructure

**Spec:** [the boundary checks spec](../spec.md)

**What to build:** A file in the API's domain layer can no longer import the infrastructure layer: lint refuses it, and so does `pnpm check`. This is the workplace's domain-layer rule, re-expressed for Oxlint.

A new command, `pnpm boundaries:check`, proves it. For each case it plants a temporary file holding one import where the rule applies, lints the way `pnpm check` does, expects a forbidden import to be refused with that ban's own message and an allowed import to pass, removes what it planted, and prints one line for each case. It is run on demand and is not part of `pnpm check`.

This ticket builds the whole command against the simplest rule of the step. Tickets 02 to 04 add their rules to the lint configuration and their cases to the same command.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Before any rule is added, the time `pnpm check --skip-nx-cache` takes is noted under Comments, as the baseline for ticket 05.
- [ ] Before anything is configured, Oxlint's current documentation is read for how its configuration files nest and extend each other, for how a rule is switched on for some files only, and for the options of `no-restricted-imports`. The workplace repository's lint rule for its domain layer is read as well. The findings are recorded under Comments.
- [ ] A file in the API's domain layer that imports the infrastructure layer fails the API's `lint` target and `pnpm check`, whether the import is written with the `~/` alias or as a relative path.
- [ ] A type-only import, a re-export and a lazy `import()` are refused in the same way.
- [ ] The infrastructure layer imports the domain layer without complaint, and the API's test tree is not covered by the ban.
- [ ] The ban carries its own message, which says what is forbidden and what to do instead.
- [ ] The ban is the workplace's rule re-expressed for Oxlint. No file is copied from the workplace repository.
- [ ] The file that states the ban is an input of the API's `lint` target: after the ban is changed, the target runs again and does not reuse a cached result.
- [ ] `pnpm boundaries:check` is a plain Node script with no dependencies of its own, kept with the workspace's other tool scripts and linted with them.
- [ ] For each case the command plants a temporary file holding one import, at a place in a real project where the rule applies. A forbidden case must be refused with the message of the ban it is meant for. An allowed case must not be reported.
- [ ] The command lints through the projects' Nx `lint` targets, with the cache skipped.
- [ ] The command prints one line for each case with a pass or a fail, and exits non-zero if any fails. It also fails if lint reports anything it did not plant.
- [ ] The command removes everything it planted, including any folder it had to create, when it passes, when it fails and when it is interrupted. The planted files carry a recognisable name that Git ignores. The command refuses to start if it finds one left over.
- [ ] The command's first cases are these. Forbidden: a domain file imports infrastructure through the alias, through a relative path, and as a type-only import. Allowed: an infrastructure file imports a domain file.
- [ ] Shown once and then reverted: with the ban removed, each forbidden line fails. With the ban widened to cover the infrastructure layer as well, the allowed line fails.
- [ ] Checked by hand: the command interrupted part-way leaves no planted file, and Git reports a clean working tree. A planted file left behind on purpose makes the command refuse to start.
- [ ] `pnpm check` passes with no change to the API's source, and it does not run the new command.
- [ ] The results of the fault checks and the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
