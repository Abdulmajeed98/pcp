# 04: Dashboard shell

**Spec:** [the workspace spec](../spec.md)

**What to build:** The dashboard exists as a client-rendered React single-page application, built with Vite, that serves one placeholder page on port 3002. It is the future home of both the Vendor portal and the Admin console, and it is laid out in Feature-Sliced Design's layers from its first file. It imports a placeholder from each of its three libraries: `@pcp/api-client`, `@pcp/ui` and `@pcp/i18n`. Its lint, type-check and build join `pnpm check`.

The frontend conventions are in [ADR-0004](../../../docs/adr/0004-architecture-per-app.md).

**Blocked by:** 03

**Status:** resolved

- [x] `@pcp/dashboard` exists as an application, and its Nx project name is the same as its package name.
- [x] The dashboard is a client-rendered React single-page application built with Vite, in a version that Nx's Vite plugin supports.
- [x] Only the Feature-Sliced Design App, Pages and Shared layers exist. Widgets, Features and Entities are not created.
- [x] Inside the app, the `@/` alias resolves to its source root.
- [x] The placeholder page lives in the Pages layer. It is one unstyled line of English that names the app, is marked in the code as a placeholder, and does not present the working title "PC Part Picker" as a brand. Checked by hand: the app starts through its serve target and serves the page on port 3002.
- [x] The dashboard imports the placeholder from `api-client`, `ui` and `i18n` by their `@pcp/…` names. Nx's project graph gains exactly those three dependencies.
- [x] No router, data-fetching, form or state library is added. Tailwind CSS, shadcn/ui, translated text and any test tool are not added.
- [x] Oxlint lints the dashboard from the shared root configuration, with the rule sets a React project needs.
- [x] The dashboard is type-checked in strict mode, and it builds.
- [x] `pnpm check` passes on a clean clone.
- [x] Shown once by hand and then reverted, each making `pnpm check` fail: a lint violation in the dashboard, a type error in it, and an import of a `@pcp/…` name that does not exist.
- [x] The results of the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 7 October 2026: completed

**Versions.** Vite 8.3.2, its React plugin 6.1.2 and React 19.3.0, as installed by Nx 23.2.1's generator.

**Layout.** The App layer holds the entry point and the root component, the Pages layer holds the placeholder page, and the Shared layer holds the list of library placeholders. The dashboard is not a Next.js app, so its App and Pages layers keep their plain names, `app` and `pages`.

**What differs from what the generator produced.**

- The type-check has its own output folder. The generator had pointed it at the folder the Vite build empties, which is the clash that broke the API's type-check in ticket 02. It was moved before it could fail.
- The `@/` alias is declared once, in the dashboard's TypeScript settings, and Vite reads it from there.
- Vite stops when port 3002 is taken. Left to its default it moves to the next free port.
- The dashboard's own manifest lists React. The generator had listed it only at the root.
- The generator's sample component, styles, favicon and image typings were removed, along with a Vitest test snippet it added although no test tool was asked for.
- pnpm asked whether `esbuild` may run its install script. Nx's generator declined it, and that was kept.

**By-hand results.**

| Check | Result |
|---|---|
| Fresh clone, `pnpm install --frozen-lockfile`, `pnpm check --skip-nx-cache` | Passes: the format check and 21 tasks across 8 projects. |
| Every task from scratch, all output folders deleted first, cache skipped | Passes 5 times out of 5. |
| The dashboard through its serve target | Starts on port 3002 and serves its page. |
| The page in headless Chrome | Shows "Dashboard placeholder. Libraries: @pcp/api-client, @pcp/ui, @pcp/i18n." |
| A second start while the first holds the port | Refused: "Port 3002 is already in use". |
| Project graph | The dashboard depends on `api-client`, `ui` and `i18n`. |
| Fault: a `debugger` statement in the page | `pnpm check` exits 1. Failed task: the dashboard's lint. |
| Fault: a string assigned to a number | `pnpm check` exits 1. Failed task: the dashboard's type-check. The Vite build does not check types, so it still passed. |
| Fault: an import from `@pcp/does-not-exist` | `pnpm check` exits 1. Failed tasks: the dashboard's type-check and build. |
| After reverting each fault | `pnpm check` exits 0 and the working tree is clean. |
