# Spec: The workspace, with every app and library as an empty shell

Status: resolved

This is step 1 of the four infrastructure steps listed under "Order of work" in [the MVP spec](../mvp/spec.md). It uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md) and [ADR-0004](../../docs/adr/0004-architecture-per-app.md). The owner confirmed its scope and its test seam on 7 October 2026.

## Problem Statement

The repository holds documents and no code. The stack, the three applications, the five shared libraries and each app's architecture are all decided, but none of them exists, so there is nowhere to put the first line of any module in the MVP's capability map.

Starting a module now would mean deciding the workspace layout, the toolchain versions, the import names and the check commands in the middle of product work, where they would be settled in a hurry and differently each time. The owner wants the infrastructure in place first, with no product features in it.

## Solution

The repository becomes one Nx workspace managed with pnpm. It contains the API, the Shopper app and the dashboard as applications, and `core`, `compatibility`, `api-client`, `ui` and `i18n` as shared libraries. Each is an empty shell: it has its final name, its final place, its agreed layout and its tooling, and nothing else.

After a fresh clone, one install command prepares everything and one check command says whether the whole workspace is sound. Each app starts with one command: the API answers a request, and the Shopper app and the dashboard each serve a placeholder page.

No screen, no endpoint with a purpose, no database and no login exists at the end of this step. What exists is a place for each of them.

## User Stories

### Toolchain

1. As the owner, I want all three apps and all five libraries in one repository, so that a change that crosses the API and a frontend is one commit.
2. As the owner, I want the Node version recorded in the repository, so that my machine, a coding agent and a future server all run the same Node 24.
3. As the owner, I want my Node version manager to pick that version up on entering the repository, so that I never have to remember to switch.
4. As the owner, I want the pnpm version recorded in the repository, so that dependencies resolve the same way on every machine.
5. As the owner, I want an install under the wrong Node major version to be refused, so that a mismatched toolchain fails at once and not later in a confusing way.
6. As the owner, I want an install with npm or yarn to be refused, so that a second lockfile never appears.
7. As the owner, I want one install command at the root to prepare every project, so that a fresh clone is ready in one step.
8. As the owner, I want the lockfile committed, so that every install gets the same dependency versions.
9. As the owner, I want Nx and its plugins pinned to one exact version together, so that they never drift apart.
10. As the owner, I want NestJS kept at version 11, so that Nx's NestJS support works.
11. As the owner, I want no paid or external service connected by this step, so that nothing leaves my machine without my agreement.

### The eight projects

12. As the owner, I want the API to exist as a NestJS app that starts and answers one request, so that later work adds endpoints instead of scaffolding.
13. As the owner, I want the API shell laid out in the workplace's two layers, with its test tree mirroring its source tree, so that the first real feature has an obvious place to go.
14. As the owner, I want the API to use the same within-app import alias as the workplace backend, so that code reads the same in both places.
15. As the owner, I want the Shopper app to exist as a server-rendered Next.js app that serves one placeholder page, so that later work adds pages instead of scaffolding.
16. As the owner, I want the Shopper app's routing folder to do nothing but route, with the page itself in the Feature-Sliced Design Pages layer, so that the pattern is set by the first page and copied by every later one.
17. As the owner, I want the dashboard to exist as a client-rendered React single-page application that serves one placeholder page, so that the Vendor portal and the Admin console have a home.
18. As the owner, I want the dashboard laid out in Feature-Sliced Design's layers from its first file, so that it and the Shopper app are organised alike.
19. As the owner, I want each of the five libraries to exist under its `@pcp/…` name, so that its name and place are never renamed later.
20. As the owner, I want every library consumed as TypeScript source with no build step of its own, so that an edit in a library shows up in an app without a rebuild.
21. As the owner, I want each app to import a placeholder from every library it is meant to use, so that the check proves the `@pcp/…` names resolve in every tool before real code depends on them.
22. As the owner, I want the `compatibility` shell to depend on nothing, so that it stays plain TypeScript that runs in both the API and the browser.
23. As a coding agent, I want Nx's project graph to show exactly the intended dependencies between the eight projects, so that I can see what may use what without reading configuration.
24. As a coding agent, I want each project's targets to come from its own tool configuration, so that a new target appears for a project when its tool is added and not through hand-written wiring.

### Commands

25. As the owner, I want one check command at the root, so that a single result tells me whether the workspace is sound.
26. As the owner, I want the check to fail when any one part fails, so that a green result means everything passed.
27. As the owner, I want the check to cover formatting for the whole repository, so that style is never a review topic.
28. As the owner, I want a second command that rewrites files into the agreed format, so that fixing a format failure is one step.
29. As the owner, I want the existing documents left as they are by the formatter, so that this step does not rewrite the spec, the ADRs or the glossary.
30. As the owner, I want Oxlint as the only linter, covering every project, so that there is one set of rules and one tool to configure and keep up to date.
31. As the owner, I want every project type-checked in strict mode, so that the strictest setting is the starting point and never a migration.
32. As the owner, I want the API and `core` to run tests with Jest and SWC from the first day, so that the first real test needs no setup.
33. As the owner, I want each of the three apps to build, so that a broken production build is caught long before deployment.
34. As the owner, I want one command per app to start it in development, so that I can run the one I am working on.
35. As the owner, I want the three apps on fixed, different ports that avoid PostgreSQL's and Keycloak's defaults, so that all five can run together in the next step.
36. As the owner, I want to run any single target for any single project, so that I am not forced to check everything while working on one thing.
37. As the owner, I want a second run of the check with nothing changed to finish from Nx's cache, so that checking often costs almost nothing.
38. As a coding agent, I want a project with no test tool chosen to have no test target at all, so that a passing check never implies tests that do not exist.

### Housekeeping

39. As the owner, I want dependencies, build output and caches ignored by Git, so that commits contain only source.
40. As the owner, I want the check to pass with no environment file and no secret, so that nothing sensitive can be committed by this step.
41. As the owner, I want the existing documents and agent configuration to stay where they are, so that the skills that read them keep working.
42. As the owner, I want a commit after each piece of this work, so that the history shows how the workspace was assembled.
43. As a coding agent, I want the commands and the directory layout written into the MVP spec, so that every later ticket can be picked up without rediscovering them.
44. As a coding agent, I want each placeholder clearly marked as one, so that I delete it when the first real code arrives instead of building on it.

## Implementation Decisions

### The workspace

- The repository root becomes an Nx workspace managed with pnpm. Applications live in `apps/` and libraries in `libs/`, and the existing documents stay where they are.
- Every project is a workspace package named `@pcp/<name>`, and its Nx project name is the same as its package name, as at the workplace.
- Nx's generators create the projects, and Nx's plugins infer each project's targets from its tool configuration. Targets are written by hand only where no plugin provides them.
- Source code is written as ES modules throughout. The API's bundle and a few tool configuration files are CommonJS, as at the workplace. One shared base TypeScript configuration has strict mode on and uses bundler-style module resolution, as at the workplace; every project extends it. The API's configuration adds the decorator options NestJS needs.
- Nx's cache is local. Nx Cloud is not connected.

### The eight projects

| Project | Kind | Shell contents | Test target | Build target | Imports a placeholder from |
|---|---|---|---|---|---|
| `@pcp/api` | Application | NestJS 11 app with one placeholder endpoint | Yes | Yes | `core`, `compatibility` |
| `@pcp/shopper` | Application | Next.js app with one placeholder page | No | Yes | `compatibility`, `api-client`, `ui`, `i18n` |
| `@pcp/dashboard` | Application | React single-page application with one placeholder page | No | Yes | `api-client`, `ui`, `i18n` |
| `@pcp/core` | Library | One placeholder export | Yes | No | none |
| `@pcp/compatibility` | Library | One placeholder export | No | No | none |
| `@pcp/api-client` | Library | One placeholder export | No | No | none |
| `@pcp/ui` | Library | One placeholder export | No | No | none |
| `@pcp/i18n` | Library | One placeholder export | No | No | none |

- The last column is the set of dependencies the project graph must show, and no others. It follows from what the MVP spec says each library is for. No library depends on another library in this step.
- Libraries follow the workplace's no-build approach: a library's package entry points at its TypeScript source, and the apps' own tools compile it. This is why only the three apps have a build target.
- Projects import each other only by `@pcp/…` name, never by a relative path into another project, and only through the library's single entry file.
- Each placeholder export is a trivial named value with a comment saying it is a placeholder. The imports exist so that type-checking, the API's tests and all three builds prove that source-consumed libraries resolve in TypeScript, Jest, webpack, Next.js and Vite. How each tool is pointed at library source is settled during implementation; the workplace does it with a custom export condition.
- `@pcp/compatibility` has no dependencies of any kind.

### The API shell

- It follows the workplace's layout from ADR-0004: a domain layer and an infrastructure layer under the app's source root, a test tree beside it that mirrors it, and an entry point separate from the bootstrap code.
- The `~/` alias resolves to the app's source root, as at the workplace.
- It has one placeholder endpoint that returns a fixed answer. The endpoint lives in the infrastructure layer.
- It is built with webpack, as at the workplace.
- It has no database connection, no configuration loading, no guard and no OpenAPI document. Each arrives with the step or module that needs it.

### The frontend shells

- Both follow Feature-Sliced Design as set out in ADR-0004. Only the layers a placeholder page needs are created: App, Pages and Shared. Widgets, Features and Entities are created when the first slice needs them.
- In the Shopper app, Next's own routing folder contains only routing. The App and Pages layers are named `_app` and `_pages`, and the route file re-exports the placeholder page from the Pages layer.
- The dashboard is built with Vite. This is the one choice a single-page shell forces, and it is Nx's default for a React application. No router, data-fetching, form or state library is added.
- The `@/` alias resolves to each frontend's own source root.
- Each placeholder page is one unstyled line of English that names the app. It is scaffolding and not a screen: the rule that every Shopper and Vendor screen is built in three languages and both directions applies from the first real screen, which replaces it. It must not present the working title "PC Part Picker" as a brand.

### Toolchain

- Node 24 is recorded in a version file that the owner's Node version manager (fnm) reads, and as an engine requirement in the root package manifest. An install under another major version fails.
- The pnpm version is recorded in the root package manifest. An install with another package manager fails.
- Nx and every Nx plugin are pinned to one exact, shared version. Oxfmt is pinned exactly because it is still before version 1.0. NestJS is kept at 11.
- Development ports are fixed: the Shopper app on 3000, the API on 3001 and the dashboard on 3002. PostgreSQL's 5432 and Keycloak's 8080 are left free for the next step.

### Formatting and linting

- Oxfmt formats source and configuration files across the whole repository. The existing documents (the specs, the ADRs, the research, CONTEXT.md, PRODUCT.md and CLAUDE.md) are excluded, so this step does not rewrite them.
- Oxlint is the only linter. It lints all eight projects from one shared root configuration, and a project adds only what its kind of code needs. ESLint is not configured, no package manifest lists it and nothing runs it. It is present in the installed dependencies, as an automatically installed peer of Nx's own packages, and the owner decided on 7 October 2026 to keep it there: Nx's boundary rule for Oxlint, which step 3 uses, does not load without it.
- Only Oxlint's recommended rules are switched on, together with its rule sets for the frameworks a project uses. The Nx boundary rule, project tags, the API's layer check and the Feature-Sliced Design import bans belong to step 3.

### Commands

- A root `check` script runs the format check, lints the files that belong to no project (everything outside `apps/` and `libs/`), and then runs lint, type-check, test and build across every project that has the target. It exits non-zero if any part fails.
- A root `format` script rewrites files into the agreed format.
- Each app is started through its own Nx serve target.
- Once the commands exist, they and the directory layout are added to the Technology section of the MVP spec, which says they are to be recorded there.

### Git

- Dependencies, build output, Nx's cache and editor files are ignored.
- The work is committed in pieces, one per unit that leaves the check passing.

## Testing Decisions

A good test of this step checks what a developer sees from the repository root: a command succeeds on a sound workspace and fails on a broken one. It does not assert the contents of configuration files, which may change freely as long as the commands behave the same.

- **One seam: the repository root.** Everything is verified through the root commands on a clean clone. This was confirmed with the owner on 7 October 2026.
- **The check passes on a clean clone.** After a fresh clone and one install, the check command reports: the format check passing for the whole repository, lint passing for all eight projects, type-checking passing for all eight, tests passing for the API and `core`, and builds passing for the three apps.
- **The check can fail.** Each part is shown once, by hand, to fail on a deliberate fault that is then reverted: a misformatted file, a lint violation, a type error, a failing assertion, and an import of a `@pcp/…` name that does not exist. A gate that has never been seen to fail is not trusted.
- **The project graph is as specified.** Nx lists exactly the eight projects, and the dependencies between them match the table above.
- **The cache works.** A second run of the check with nothing changed completes from the cache.
- **Each app starts.** Checked once by hand: the API starts and answers a request to its placeholder endpoint; the Shopper app and the dashboard each serve their placeholder page; all three run at the same time on their fixed ports. Step 4 replaces this with a real proof that the parts connect.
- **Test code.** Two placeholder tests are written, because Jest with SWC is already decided for the API and for nothing else. The API's test requests the placeholder endpoint and expects the fixed answer, which also proves that decorators compile under SWC. The `core` test checks the placeholder export. Both are unit tests and both are replaced by the first real test.
- **No other test targets.** The frontends' test tools and the runner for `compatibility` are chosen when work on them begins, so those six projects have no test target. The API's integration test configuration is added when there is a database to test against.
- **Prior art.** This repository has none. The workplace backend's Jest configuration is the model for the API and `core`: its shape is followed and no file is copied.
- **Recording.** The results of the by-hand checks are written under the Comments heading of the ticket that carries them out.

## Out of Scope

- Docker Compose, PostgreSQL and Keycloak (step 2).
- The Nx boundary rule, project tags, the API's layer check and the Feature-Sliced Design import bans (step 3).
- Login, the API's guard and token verification, generating `api-client`, and a Shopper page fetched from the API (step 4).
- Drizzle, database schemas and migrations.
- The API's OpenAPI document and its environment configuration.
- Tailwind CSS, shadcn/ui, next-intl, any translated text and right-to-left layout.
- The frontends' test tools, end-to-end tests, and a test runner for `compatibility`.
- Dockerfiles and anything else to do with packaging or hosting.
- Automated checks on GitHub, which wait for the GitHub repository, and Git hooks.
- Any library for an app beyond what its shell needs. Libraries are chosen when work on that app begins.
- Every module in the MVP's capability map.

## Further Notes

- **Choices made here that no ADR records.** Each is the smallest choice that lets a shell exist, and the owner may overrule any of them before work starts:
  - Vite as the dashboard's build tool.
  - webpack as the API's build tool, following the workplace.
  - Placeholder imports from each app into its libraries. Without them the check would pass while the hardest part of the setup, resolving source-consumed libraries in five tools, went unproven until the first feature.
- **The owner's machine on 7 October 2026** has Node 24.21.0, pnpm 12.6.0, fnm and Docker 29.8.2. Before pinning, confirm in Nx's current documentation that it supports this pnpm major version.
- **Version constraints** known on 6 October 2026 are in [the architecture research](../../docs/research/app-architecture.md): Nx's NestJS plugin does not accept NestJS 12, and its Next.js and Vite plugins state the versions they support. Each tool's current documentation is checked again when it is installed.
- **Differences from the workplace.** The workplace repository uses npm workspaces and this one uses pnpm, so its lockfile-related targets do not carry over. The workplace lints with ESLint and this repository with Oxlint alone, as the owner decided on 7 October 2026 (ADR-0004), so its lint configuration does not carry over either. Its conventions are documented in that repository's own architecture documents, which are read before the API shell is written. The patterns are reimplemented from scratch.
- **Next steps.** Steps 2, 3 and 4 each get their own spec in their own directory under `.scratch/`.
