# 15: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the catalog spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, then the install, the checks, the services, the import and `pnpm platform:check`, with none of the three apps started by hand. The infrastructure steps showed that results left over from earlier runs can hide a fault, so this run is the one that counts.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `offers` and every later module start from them. This ticket closes `catalog`.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 09, 13, 14

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand:
  - one install;
  - `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed;
  - `pnpm boundaries:check`;
  - `pnpm integration:check`;
  - `pnpm services:up`, which applies the migrations, and then `pnpm services:check`;
  - `pnpm catalog:import`, whose report is recorded, and a second run, which imports none;
  - the browser's one-time install, and then `pnpm platform:check`.
- [ ] Git reports a clean working tree after every command above. No password is committed.
- [ ] The owner is asked to check these, once. What they saw, or that it is still to be done, is recorded under Comments:
  - The import's report makes sense, and a few well-known Parts, such as an AMD Ryzen 5 7600, are found with the right specifications.
  - How long the import took on the owner's connection.
  - The Catalog screens match `apps/dashboard/DESIGN.md` and the footer matches `apps/shopper/DESIGN.md`, both also the root DESIGN.md, in light and in dark, and Impeccable's design hook raises nothing left unanswered.
  - The Sorani letters ڕ, ڵ, ێ, ۆ and ە are drawn correctly in both apps' fonts on the owner's phone, and on an Android phone from Honor, Infinix, Tecno or Xiaomi if one is at hand (ADR-0006).
- [ ] The Technology section of the MVP spec gains the conventions this module set:
  - the database settings and the first secret setting, and `OPENDB_REPOSITORY_URL`, which only the import reads, and which takes plain HTTP only from this machine;
  - migrations: how they are generated, applied and checked;
  - the Command, Query and Store pattern as built, with Effect 3's `Either` and the structured errors;
  - paging;
  - the shared test database and `pnpm integration:check`;
  - photos and the `PhotoStore` port;
  - the dashboard's libraries, and where each app's own shadcn/ui components live (ADR-0007);
  - commit messages: Conventional Commits 1.0.0, with commitlint's conventional types and the project's folder as the scope, a subject and body lines of at most 72 characters, checked by commitlint in the commit-msg hook that husky installs, as the owner decided on 15 October 2026. Earlier commits keep their own style;
  - the import and its pinned commit, written once in a sixth shared library, `@pcp/opendb` (`scope:shared`, `type:lib`), which the API imports and the Shopper app's credit will. The projects table, the count of shared libraries and of projects, and what `@pcp/api` imports change with it. The API's domain is the first to import a library other than `core` and `effect`;
  - the three DESIGN.md files, one at the root and one in each app's folder; the two looks and their fonts (ADR-0006 and ADR-0007); the accessibility standard, WCAG 2.2 level AA, with axe-core in `pnpm platform:check` and Oxlint's `jsx-a11y` plugin in `pnpm check`; and the research behind them.
- [ ] The conventions that ticket 01 changed are corrected where they are written:
  - ADR-0004 and the MVP spec list `apps/api/src/drizzle`, which drizzle-kit writes, among the files Oxfmt does not format. Ticket 08 added the import's made-up folder shaped like OpenDB, which holds a file that is not JSON on purpose. Ticket 10 added every DESIGN.md and every `.impeccable` folder, because Impeccable reads their exact format, as Oxfmt already leaves PRODUCT.md alone.
  - The MVP spec's tables of each library's entries name `ui`'s stylesheet entries as they now are: `@pcp/ui/themes/shopper.css` and `@pcp/ui/themes/dashboard.css`, in place of `@pcp/ui/theme.css` (ADR-0007).
  - "An endpoint carries `@ApiOperation` and `@ApiOkResponse`" is widened to the success response that fits, such as `@ApiCreatedResponse` for a create.
  - Every request is checked against its Request class, a field the class does not declare is refused, and each refused field is named in `additionalInformation`.
  - An error a use case returns has a code of its own, from which its title and detail keys are made.
  - The MVP spec's settings section no longer says that no app reads `.env`: when Nx runs the API's `serve`, `migrate` or `catalog-import` target, a file of the target's own (`apps/api/.serve.env`, `apps/api/.migrate.env`, `apps/api/.catalog-import.env`) gives `DATASOURCE_PASSWORD` the value `.env` holds for the `pcp` user, and a value set in the shell wins. The same goes for each later target that reaches the database.
  - A database that cannot be reached is answered 503 with `DATABASE_UNAVAILABLE`, and the API listens to its pool's error event so that a database that stops does not end it.
- [ ] Its commands table gains `pnpm catalog:import`, `pnpm db:migrate`, `pnpm integration:check` and the command that generates a migration. Its settings table gains the database settings.
- [ ] It says when to run `pnpm integration:check`: after a change to a schema, a migration, a Store, a Command or a Query, and after an upgrade of Drizzle, `pg`, Effect or Testcontainers.
- [ ] CAT-2 names the pinned commit, and CAT-8 says that its list arrives with `offers`.
- [ ] PRODUCT.md's account of the catalog data names the pinned commit, and its stack names the dashboard's libraries.
- [x] The owner is asked whether CONTEXT.md gains **Specification**, and the answer is applied. On 15 October 2026 the owner chose Specification, Specification list and Needed specification, and CONTEXT.md has them.
- [ ] The spec's status is set to resolved, and every ticket of this module is resolved.
- [ ] The results are recorded under Comments.
