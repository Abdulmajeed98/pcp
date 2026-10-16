# 15: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the catalog spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, then the install, the checks, the services, the import and `pnpm platform:check`, with none of the three apps started by hand. The infrastructure steps showed that results left over from earlier runs can hide a fault, so this run is the one that counts.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `offers` and every later module start from them. This ticket closes `catalog`.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 09, 13, 14

**Status:** resolved

- [x] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand:
  - one install;
  - `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed;
  - `pnpm boundaries:check`;
  - `pnpm integration:check`;
  - `pnpm services:up`, which applies the migrations, and then `pnpm services:check`;
  - `pnpm catalog:import`, whose report is recorded, and a second run, which imports none;
  - the browser's one-time install, and then `pnpm platform:check`.
- [x] Git reports a clean working tree after every command above. No password is committed.
- [x] The owner is asked to check these, once. What they saw, or that it is still to be done, is recorded under Comments:
  - The import's report makes sense, and a few well-known Parts, such as an AMD Ryzen 5 7600, are found with the right specifications.
  - How long the import took on the owner's connection.
  - The Catalog screens match `apps/dashboard/DESIGN.md` and the footer matches `apps/shopper/DESIGN.md`, both also the root DESIGN.md, in light and in dark, and Impeccable's design hook raises nothing left unanswered.
  - The Sorani letters ڕ, ڵ, ێ, ۆ and ە are drawn correctly in both apps' fonts on the owner's phone, and on an Android phone from Honor, Infinix, Tecno or Xiaomi if one is at hand (ADR-0006).
- [x] The Technology section of the MVP spec gains the conventions this module set:
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
- [x] The conventions that ticket 01 changed are corrected where they are written:
  - Done on 16 October 2026, after ticket 10's review: ADR-0004 and the MVP spec now list every file Oxfmt leaves alone, `apps/api/src/drizzle`, the import's made-up OpenDB folder, every DESIGN.md and every `.impeccable` folder among them.
  - Done on 16 October 2026, after ticket 10's review: the MVP spec names `ui`'s two stylesheet entries, `@pcp/ui/themes/shopper.css` and `@pcp/ui/themes/dashboard.css`.
  - "An endpoint carries `@ApiOperation` and `@ApiOkResponse`" is widened to the success response that fits, such as `@ApiCreatedResponse` for a create.
  - Every request is checked against its Request class, a field the class does not declare is refused, and each refused field is named in `additionalInformation`.
  - An error a use case returns has a code of its own, from which its title and detail keys are made.
  - The MVP spec's settings section no longer says that no app reads `.env`: when Nx runs the API's `serve`, `migrate` or `catalog-import` target, a file of the target's own (`apps/api/.serve.env`, `apps/api/.migrate.env`, `apps/api/.catalog-import.env`) gives `DATASOURCE_PASSWORD` the value `.env` holds for the `pcp` user, and a value set in the shell wins. The same goes for each later target that reaches the database.
  - A database that cannot be reached is answered 503 with `DATABASE_UNAVAILABLE`, and the API listens to its pool's error event so that a database that stops does not end it.
- [x] Its commands table gains `pnpm catalog:import`, `pnpm db:migrate`, `pnpm integration:check` and the command that generates a migration. Its settings table gains the database settings.
- [x] It says when to run `pnpm integration:check`: after a change to a schema, a migration, a Store, a Command or a Query, and after an upgrade of Drizzle, `pg`, Effect or Testcontainers.
- [x] CAT-2 names the pinned commit, and CAT-8 says that its list arrives with `offers`.
- [x] PRODUCT.md's account of the catalog data names the pinned commit, and its stack names the dashboard's libraries.
- [x] The owner is asked whether CONTEXT.md gains **Specification**, and the answer is applied. On 15 October 2026 the owner chose Specification, Specification list and Needed specification, and CONTEXT.md has them.
- [x] The spec's status is set to resolved, and every ticket of this module is resolved.
- [x] The results are recorded under Comments.

## Comments

### 16 October 2026: completed

**From a fresh clone.** The owner's services and every app this session had started were stopped first, because both would claim the same ports. `main` at `85db130` was cloned into a new folder, `pcp-fresh-1016`, outside the repository, with no `.env`, and Docker held no volume of that name. A script ran each command in order, stopping at the first failure, and read Git's status after each.

| Step | Result | Time |
|---|---|---|
| `pnpm install --frozen-lockfile` | passed | 4 s |
| `pnpm check --skip-nx-cache`, with `DOCKER_HOST` pointed at a socket that does not exist and `PLAYWRIGHT_BROWSERS_PATH` at an empty folder | passed, every task run again | 16 s |
| `pnpm boundaries:check` | passed, 114 cases | 8 s |
| `pnpm integration:check` | passed, 102 tests in 6 files | 9 s |
| `pnpm services:up` | passed: created `.env` and a new volume, and applied the migrations | 16 s |
| `pnpm services:check` | passed, the line for the migrations among them | 2 s |
| `pnpm catalog:import` | passed: 26,216 imported, 24 records and 11,173 values left out | 14 s |
| `pnpm catalog:import` again | passed: none imported, 26,216 already there | 12 s |
| `pnpm exec playwright install chromium` | passed. Chromium was already in the machine's own cache, which every checkout shares, so nothing was downloaded. | 1 s |
| `pnpm platform:check` | passed, 79 tests | 85 s |

- Git reported a clean working tree after every step. No password is committed.
- The fresh clone's services were then reset, which deleted its volume, and the owner's were started again. `pnpm services:check` passes, and their 26,440 Parts, the import's and the tests' own, are as they were.

**The import's report,** from GitHub at commit `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf`:

| Category | Imported | Records left out | Values left out |
|---|---|---|---|
| CPU | 788 | 1 | 3,622 |
| CPU cooler | 2,412 | 1 | 162 |
| Motherboard | 3,697 | 4 | 1,065 |
| RAM | 4,876 | 0 | 53 |
| Storage | 3,493 | 2 | 0 |
| GPU | 3,865 | 0 | 4,499 |
| Case | 3,790 | 14 | 111 |
| PSU | 3,295 | 2 | 1,661 |
| **Total** | **26,216** | **24** | **11,173** |

Of the 26,240 records, 24 are left out: 20 name no manufacturer and copy a complete record's part number, 2 are on the import's list of known copies, and 2 name no manufacturer their name shows, as the owner decided on 15 October 2026.

**Asked of the owner on 16 October 2026, and still to be done:**

- The import's report makes sense, and a few well-known Parts, such as an AMD Ryzen 5 7600, are found with the right specifications. (In this session's browser the Ryzen 5 7600's page showed socket AM5, 6 cores and 12 threads, 3.8 to 5.1 GHz, 65 W and DDR5.)
- How long the import takes on the owner's own connection. From this machine it took 14 seconds, the download included.
- The Catalog's screens match `apps/dashboard/DESIGN.md` and the footer `apps/shopper/DESIGN.md`, both also the root DESIGN.md, in light and in dark, and Impeccable's design hook raises nothing left unanswered.
- The Sorani letters ڕ, ڵ, ێ, ۆ and ە are drawn correctly in both apps' fonts on the owner's phone, and on an Android phone from Honor, Infinix, Tecno or Xiaomi if one is at hand (ADR-0006).
- With them, the checks tickets 13 and 14 left open: the Catalog, a Part's page and both forms used with a thumb, a photo from the phone's camera, an iPhone's HEIC among them, and the credit read in Kurdish and Arabic.

**Recorded in the MVP spec.** CAT-2 names the pinned commit, and CAT-8 says that its list arrives with `offers`. The Technology section gains `catalog`'s place in the order of work and a part of its own, **The catalog's conventions**, which holds the database and its migrations, the use cases, Stores and errors, paging, the specifications, photos, the import, the tests against a real database, the dashboard's libraries, each app's components, design and accessibility, the footer credit and commit messages. Beside it:

- six shared libraries and ten projects, with `opendb` in the projects table and in what each app may import;
- the commands table gains `pnpm db:generate`, `pnpm db:migrate`, `pnpm catalog:import` and `pnpm integration:check`, and says when to run the two that `pnpm check` does not;
- the settings table gains the database settings and `OPENDB_REPOSITORY_URL`, and the paragraph above it no longer says that no app reads `.env`;
- the API's conventions now say that every request is checked against its Request class, that an error's keys come from its own code, that an unreachable database is answered 503 with `DATABASE_UNAVAILABLE`, and that an endpoint carries the success response that fits;
- the dashboard calls the API through TanStack Query and `dataOf`, and the end-to-end tests' made-up Parts and accessibility helper are described.

PRODUCT.md names the pinned commit and the dashboard's libraries. CONTEXT.md already has Specification, Specification list and Needed specification.
