# 03: Shopper app shell with `api-client`, `ui` and `i18n`

**Spec:** [the workspace spec](../spec.md)

**What to build:** The Shopper app exists as a server-rendered Next.js application that serves one placeholder page on port 3000. The page reaches the browser through the Feature-Sliced Design Pages layer, so the pattern every later page copies is set by the first one. The app imports a placeholder from each of its four libraries: `@pcp/compatibility`, which already exists, and `@pcp/api-client`, `@pcp/ui` and `@pcp/i18n`, which this ticket creates. Its lint, type-check and build join `pnpm check`.

The frontend conventions are in [ADR-0004](../../../docs/adr/0004-architecture-per-app.md).

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] `@pcp/shopper` exists as an application, and `@pcp/api-client`, `@pcp/ui` and `@pcp/i18n` exist as libraries. Each one's Nx project name is the same as its package name.
- [ ] The Shopper app uses a Next.js version that Nx's Next.js plugin supports, and renders on the server.
- [ ] Next's own routing folder contains only routing. The Feature-Sliced Design App and Pages layers are named `_app` and `_pages`, and the route file re-exports the placeholder page from the Pages layer.
- [ ] Only the App, Pages and Shared layers exist. Widgets, Features and Entities are not created.
- [ ] Inside the app, the `@/` alias resolves to its source root.
- [ ] The placeholder page is one unstyled line of English that names the app, is marked in the code as a placeholder, and does not present the working title "PC Part Picker" as a brand. Checked by hand: the app starts through its serve target and serves the page on port 3000.
- [ ] Each new library exports one trivial named value through a single entry file, with a comment saying it is a placeholder. Each is consumed as TypeScript source and has no build target and no test target.
- [ ] The Shopper app imports the placeholder from `compatibility`, `api-client`, `ui` and `i18n` by their `@pcp/…` names. Nx's project graph gains exactly those four dependencies, and no library depends on another library.
- [ ] Tailwind CSS, shadcn/ui, next-intl, translated text and any test tool are not added.
- [ ] Oxlint lints the app and the three new libraries from the shared root configuration, with the rule sets a React and Next.js project needs.
- [ ] The app and the three new libraries are type-checked in strict mode, and the Shopper app builds.
- [ ] `pnpm check` passes on a clean clone.
- [ ] Shown once by hand and then reverted, each making `pnpm check` fail: a lint violation in the Shopper app, a type error in it, and an import of a `@pcp/…` name that does not exist.
- [ ] The results of the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments
