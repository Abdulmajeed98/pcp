# 02: API shell with `core` and `compatibility`

**Spec:** [the workspace spec](../spec.md)

**What to build:** The API exists as a NestJS 11 application that starts on port 3001 and answers a request to one placeholder endpoint. It imports a placeholder from `@pcp/core` and from `@pcp/compatibility`, the two libraries it will use, which this ticket creates. Oxlint, type-checking, Jest with SWC and the webpack build all join `pnpm check`, and each is shown once to fail.

The API follows the workplace's conventions, which [ADR-0004](../../../docs/adr/0004-architecture-per-app.md) lists. The workplace repository's own architecture documents are the fuller reference and are read before the shell is written. The patterns are reimplemented from scratch and no file is copied. Linting is the one exception: this repository uses Oxlint alone.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `@pcp/api` exists as an application, and `@pcp/core` and `@pcp/compatibility` exist as libraries. Each one's Nx project name is the same as its package name.
- [ ] The API uses NestJS 11, in a version that Nx's NestJS plugin supports.
- [ ] The API has a domain layer and an infrastructure layer under its source root, a test tree beside it that mirrors it, and an entry point separate from its bootstrap code.
- [ ] Inside the API, the `~/` alias resolves to its source root.
- [ ] One placeholder endpoint, in the infrastructure layer, returns a fixed answer. Checked by hand: the API starts through its serve target and a request to that endpoint on port 3001 returns the answer.
- [ ] The API has no database connection, no configuration loading, no guard and no OpenAPI document.
- [ ] Each library exports one trivial named value through a single entry file, with a comment saying it is a placeholder. Each is consumed as TypeScript source and has no build target.
- [ ] `@pcp/compatibility` has no dependencies of any kind.
- [ ] The API imports the placeholder from both libraries by their `@pcp/…` names. Nx's project graph shows the API depending on `core` and on `compatibility`, and no other dependency.
- [ ] Oxlint lints all three projects from one shared root configuration, with its recommended rules and the rule sets these projects need. No ESLint package or configuration exists in the repository.
- [ ] All three projects are type-checked in strict mode. The API's configuration adds the decorator options NestJS needs.
- [ ] The API and `core` run tests with Jest and SWC. The API's test requests the placeholder endpoint and expects the fixed answer. The `core` test checks the placeholder export. `@pcp/compatibility` has no test target.
- [ ] The API builds with webpack.
- [ ] `pnpm check` passes on a clean clone.
- [ ] Shown once by hand and then reverted, each making `pnpm check` fail: a lint violation, a type error, a failing assertion, and an import of a `@pcp/…` name that does not exist.
- [ ] The results of the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments
