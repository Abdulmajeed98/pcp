# 02: API shell with `core` and `compatibility`

**Spec:** [the workspace spec](../spec.md)

**What to build:** The API exists as a NestJS 11 application that starts on port 3001 and answers a request to one placeholder endpoint. It imports a placeholder from `@pcp/core` and from `@pcp/compatibility`, the two libraries it will use, which this ticket creates. Oxlint, type-checking, Jest with SWC and the webpack build all join `pnpm check`, and each is shown once to fail.

The API follows the workplace's conventions, which [ADR-0004](../../../docs/adr/0004-architecture-per-app.md) lists. The workplace repository's own architecture documents are the fuller reference and are read before the shell is written. The patterns are reimplemented from scratch and no file is copied. Linting is the one exception: this repository uses Oxlint alone.

**Blocked by:** 01

**Status:** resolved

- [x] `@pcp/api` exists as an application, and `@pcp/core` and `@pcp/compatibility` exist as libraries. Each one's Nx project name is the same as its package name.
- [x] The API uses NestJS 11, in a version that Nx's NestJS plugin supports.
- [x] The API has a domain layer and an infrastructure layer under its source root, a test tree beside it that mirrors it, and an entry point separate from its bootstrap code.
- [x] Inside the API, the `~/` alias resolves to its source root.
- [x] One placeholder endpoint, in the infrastructure layer, returns a fixed answer. Checked by hand: the API starts through its serve target and a request to that endpoint on port 3001 returns the answer.
- [x] The API has no database connection, no configuration loading, no guard and no OpenAPI document.
- [x] Each library exports one trivial named value through a single entry file, with a comment saying it is a placeholder. Each is consumed as TypeScript source and has no build target.
- [x] `@pcp/compatibility` has no dependencies of any kind.
- [x] The API imports the placeholder from both libraries by their `@pcp/…` names. Nx's project graph shows the API depending on `core` and on `compatibility`, and no other dependency.
- [x] Oxlint lints all three projects from one shared root configuration, with its recommended rules and the rule sets these projects need. No ESLint configuration exists and no package manifest lists ESLint. (Reworded on 7 October 2026: see Comments.)
- [x] All three projects are type-checked in strict mode. The API's configuration adds the decorator options NestJS needs.
- [x] The API and `core` run tests with Jest and SWC. The API's test requests the placeholder endpoint and expects the fixed answer. The `core` test checks the placeholder export. `@pcp/compatibility` has no test target.
- [x] The API builds with webpack.
- [x] `pnpm check` passes on a clean clone.
- [x] Shown once by hand and then reverted, each making `pnpm check` fail: a lint violation, a type error, a failing assertion, and an import of a `@pcp/…` name that does not exist.
- [x] The results of the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 7 October 2026: completed

**Versions.** NestJS 11.2.7, Jest 30.3, Oxlint 1.87.0, webpack 5. The Nx plugins added here (`@nx/nest`, `@nx/node`, `@nx/webpack`, `@nx/jest`, `@nx/oxlint`, `@nx/web`) are all pinned to 23.2.1.

**ESLint is installed, although nothing uses it.** The criterion first read "No ESLint package or configuration exists in the repository", and that cannot be met while using Nx. Nx's NestJS, Node, Next.js and React plugins depend on Nx's ESLint plugin, and Nx's Oxlint plugin depends on Nx's ESLint rules package, so ESLint 10 arrives in the installed dependencies and the lockfile. What holds is this: no package manifest lists ESLint, no ESLint configuration exists, and no target runs it. The criterion, the same line in ticket 05 and the spec were reworded to say that.

**A fault the generator introduced, found and fixed.** Nx's generator pointed both the webpack build and the type-check at the API's `dist` folder, and the build empties that folder when it starts. Run together from scratch, the type-check failed 5 times out of 5. The failure was hidden while old output and cached results were present, and it showed only on a fresh clone with the cache skipped. The type-check now has its own output folder, and the same test passes 5 times out of 5.

**Nx's cache is outside the repository.** Nx 23 keeps its task cache under the home directory, not in the workspace, and a fresh clone on the same machine reuses it. A clean-clone check therefore proves nothing unless the cache is skipped: `pnpm check --skip-nx-cache`.

**What differs from what the generators produced.**

- The API and the libraries follow the shared base settings (ES modules, bundler-style resolution). The generators had overridden them with Node's own resolution.
- The generators' sample service, controller and tests were replaced by the layout in ADR-0004 and the placeholder endpoint.
- `@pcp/compatibility` is compiled without Node's type definitions, so a use of a Node-only API in it fails the type-check.
- pnpm asked whether three more dependencies may run install scripts. All three were declined: `@nestjs/core` only prints a funding message, and `@parcel/watcher` and `unrs-resolver` (both used by Jest) ship ready-made binaries and use their scripts only as a fallback. Jest runs without them.
- Nx's generators add the API's dependencies to the root manifest as well as to the API's own. That was left as generated.

**By-hand results.**

| Check | Result |
|---|---|
| Fresh clone, `pnpm install --frozen-lockfile`, `pnpm check --skip-nx-cache` | Passes: the format check, lint and type-check for 3 projects, tests for the API and `core`, and the API's build. |
| The API through its serve target | Starts on port 3001. A request to `/` returns `{"name":"@pcp/api","libraries":["@pcp/core","@pcp/compatibility"]}` with status 200. |
| The two libraries in the API's bundle | Compiled into the bundle from their TypeScript source, not left as imports to resolve at run time. |
| Project graph | `@pcp/api` depends on `@pcp/core` and `@pcp/compatibility`. No other dependency between projects. |
| Fault: a `debugger` statement in the controller | `pnpm check` exits 1. Failed task: the API's lint. |
| Fault: a string assigned to a number | `pnpm check` exits 1. Failed task: the API's type-check. The webpack build does not check types, so it still passed. |
| Fault: a wrong expected value in the `core` test | `pnpm check` exits 1. Failed task: `core`'s test. |
| Fault: an import from `@pcp/does-not-exist` | `pnpm check` exits 1. Failed tasks: the API's type-check, build and test. |
| After reverting each fault | `pnpm check` exits 0 and the working tree is clean. |

Both tests were written before the code they cover and were seen to fail first: the `core` test because the export did not exist, and the API test with a 404.
