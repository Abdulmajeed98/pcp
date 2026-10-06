# 04: Dashboard shell

**Spec:** [the workspace spec](../spec.md)

**What to build:** The dashboard exists as a client-rendered React single-page application, built with Vite, that serves one placeholder page on port 3002. It is the future home of both the Vendor portal and the Admin console, and it is laid out in Feature-Sliced Design's layers from its first file. It imports a placeholder from each of its three libraries: `@pcp/api-client`, `@pcp/ui` and `@pcp/i18n`. Its lint, type-check and build join `pnpm check`.

The frontend conventions are in [ADR-0004](../../../docs/adr/0004-architecture-per-app.md).

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] `@pcp/dashboard` exists as an application, and its Nx project name is the same as its package name.
- [ ] The dashboard is a client-rendered React single-page application built with Vite, in a version that Nx's Vite plugin supports.
- [ ] Only the Feature-Sliced Design App, Pages and Shared layers exist. Widgets, Features and Entities are not created.
- [ ] Inside the app, the `@/` alias resolves to its source root.
- [ ] The placeholder page lives in the Pages layer. It is one unstyled line of English that names the app, is marked in the code as a placeholder, and does not present the working title "PC Part Picker" as a brand. Checked by hand: the app starts through its serve target and serves the page on port 3002.
- [ ] The dashboard imports the placeholder from `api-client`, `ui` and `i18n` by their `@pcp/…` names. Nx's project graph gains exactly those three dependencies.
- [ ] No router, data-fetching, form or state library is added. Tailwind CSS, shadcn/ui, translated text and any test tool are not added.
- [ ] Oxlint lints the dashboard from the shared root configuration, with the rule sets a React project needs.
- [ ] The dashboard is type-checked in strict mode, and it builds.
- [ ] `pnpm check` passes on a clean clone.
- [ ] Shown once by hand and then reverted, each making `pnpm check` fail: a lint violation in the dashboard, a type error in it, and an import of a `@pcp/…` name that does not exist.
- [ ] The results of the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments
