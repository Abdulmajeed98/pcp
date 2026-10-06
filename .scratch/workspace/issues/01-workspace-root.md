# 01: Workspace root with pinned toolchain, formatter and check command

**Spec:** [the workspace spec](../spec.md)

**What to build:** From a fresh clone, one install command prepares the workspace, the wrong toolchain is refused, and one check command says whether the repository is sound. No project exists yet, so the check covers formatting only at this point. It is built so that lint, type-check, test and build join it as later tickets add projects, with no change to the command itself.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The repository root is an Nx workspace managed with pnpm, with `apps/` and `libs/` as the homes for applications and libraries. Nx lists no projects yet.
- [ ] Before any version is pinned, Nx's current documentation is checked to confirm that it supports the pnpm major version on the owner's machine. The finding is recorded under Comments.
- [ ] Node 24 is recorded where the owner's Node version manager (fnm) reads it, and as an engine requirement in the root package manifest. An install under another Node major version fails.
- [ ] The pnpm version is recorded in the root package manifest. An install with npm or yarn fails.
- [ ] Nx and every Nx plugin are pinned to one exact, shared version. Nx Cloud is not connected, and the cache is local.
- [ ] The lockfile is committed.
- [ ] One shared base TypeScript configuration exists, with strict mode on, ES modules and bundler-style module resolution, ready for projects to extend.
- [ ] Oxfmt is installed at an exactly pinned version. `pnpm format` rewrites source and configuration files into the agreed format.
- [ ] The existing documents (the specs and tickets, the ADRs, the research, CONTEXT.md, PRODUCT.md and CLAUDE.md) are excluded from the formatter, and none of them is changed by this ticket.
- [ ] `pnpm check` runs the format check and then lint, type-check, test and build across every project that has the target. It passes on a clean clone and exits non-zero when any part fails.
- [ ] Shown once by hand and then reverted: a deliberately misformatted file makes `pnpm check` fail.
- [ ] Dependencies, build output, Nx's cache and editor files are ignored by Git. The existing ignore rule for machine-local settings is kept.
- [ ] The install and the check need no environment file and no secret.
- [ ] The results of the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments
