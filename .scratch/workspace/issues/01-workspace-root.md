# 01: Workspace root with pinned toolchain, formatter and check command

**Spec:** [the workspace spec](../spec.md)

**What to build:** From a fresh clone, one install command prepares the workspace, the wrong toolchain is refused, and one check command says whether the repository is sound. No project exists yet, so the check covers formatting only at this point. It is built so that lint, type-check, test and build join it as later tickets add projects, with no change to the command itself.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] The repository root is an Nx workspace managed with pnpm, with `apps/` and `libs/` as the homes for applications and libraries. Nx lists no projects yet.
- [x] Before any version is pinned, Nx's current documentation is checked to confirm that it supports the pnpm major version on the owner's machine. The finding is recorded under Comments.
- [x] Node 24 is recorded where the owner's Node version manager (fnm) reads it, and as an engine requirement in the root package manifest. An install under another Node major version fails.
- [x] The pnpm version is recorded in the root package manifest. An install with npm or yarn fails.
- [x] Nx and every Nx plugin are pinned to one exact, shared version. Nx Cloud is not connected, and the cache is local.
- [x] The lockfile is committed.
- [x] One shared base TypeScript configuration exists, with strict mode on, ES modules and bundler-style module resolution, ready for projects to extend.
- [x] Oxfmt is installed at an exactly pinned version. `pnpm format` rewrites source and configuration files into the agreed format.
- [x] The existing documents (the specs and tickets, the ADRs, the research, CONTEXT.md, PRODUCT.md and CLAUDE.md) are excluded from the formatter, and none of them is changed by this ticket.
- [x] `pnpm check` runs the format check and then lint, type-check, test and build across every project that has the target. It passes on a clean clone and exits non-zero when any part fails.
- [x] Shown once by hand and then reverted: a deliberately misformatted file makes `pnpm check` fail.
- [x] Dependencies, build output, Nx's cache and editor files are ignored by Git. The existing ignore rule for machine-local settings is kept.
- [x] The install and the check need no environment file and no secret.
- [x] The results of the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 7 October 2026: completed

**Does Nx support pnpm 12?** Nx's documentation states which Node.js and TypeScript versions it supports and says nothing about pnpm versions. Its 23.2 release notes name fixes for pnpm 11 and do not mention pnpm 12. So the answer comes from a test, not from the documentation: pnpm 12.6.0 writes a lockfile in format 9.0, the format Nx has read since pnpm 9, and Nx 23.2.1 read 350 packages out of that lockfile without error.

**Versions.** Nx and `@nx/js` are pinned to 23.2.1 and Oxfmt to 0.72.0. TypeScript is `~6.0.3`, the version Nx 23.2.1's own generators install. TypeScript 7.0.2 is the newest release and was not adopted, because nothing in Nx says it is supported.

**What differs from the first plan.**

- The Node requirement is in `devEngines.runtime`, not `engines.node`. pnpm 12.6.0 does not enforce `engines.node` on the root project: an install under Node 22 succeeded. With `devEngines.runtime` it stops before installing anything.
- The pnpm version is in `devEngines.packageManager`. npm reads that field and refuses on its own. A pnpm of another version downloads 12.6.0 and runs that.
- Yarn 1 ignores `devEngines`, so a small preinstall script refuses any package manager other than pnpm. Yarn run through Corepack is refused by `devEngines` as well.
- pnpm 12 fails an install when a dependency has an install script that is not explicitly allowed. `nx` and `@swc/core` have one, and both are allowed in the pnpm workspace file.
- The formatter uses single quotes and a line width of 92, the same as the workplace backend's formatter settings.

**By-hand results**, each on a fresh clone in a scratch directory:

| Check | Result |
|---|---|
| `pnpm install`, then `pnpm check` | Both pass. The check covers 8 files and Nx runs no tasks, because there are no projects. |
| `pnpm install` with Node 22.23.3 first on the path | Refused: "This project requires Node.js >=24 <25". No `node_modules` created. |
| `npm install` (npm 11.19.0) | Refused with `EBADDEVENGINES`. No `package-lock.json` and no `node_modules` created. |
| `yarn install` (yarn 1.22.22) | Refused by the preinstall script. No `yarn.lock` and no `node_modules` created. |
| `yarn install` through Corepack | Refused: "This project is configured to use pnpm". |
| A deliberately misformatted line added to a file | `pnpm check` exits 1 and names the file. After reverting, it exits 0. |
| `fnm use` in the repository | "Using Node v24.21.0". |
| Documents and agent configuration | Unchanged. The formatter skips them. |
| Environment files | None exist and none is needed. |
