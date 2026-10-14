# 02: The development database: migrations by their own command, and the API without its database

**Spec:** [the catalog spec](../spec.md)

**What to build:** The owner's development database gets the platform's tables, and the API started with `nx serve` stores Parts there. Migrations are applied by a command of their own, never when the API starts, as at the workplace. `pnpm services:up` applies them, so a fresh machine is still ready in one step, and `pnpm services:check` says whether every one is applied. `pnpm check` fails when the schema has changed and no migration was generated.

The database password is the first setting of any app that is a secret. Its development value is the one `.env` already holds for the `pcp` user, and it reaches the API from there. While the database cannot be reached, the API still starts, and a call that needs the database is answered 503, as a call is while Keycloak's keys cannot be had.

**Blocked by:** 01

**Status:** resolved

- [x] Before anything is written, it is found out and recorded under Comments how `DATASOURCE_PASSWORD` reaches `nx serve @pcp/api`, the migration command and the apps that `pnpm platform:check` starts. Nx loads a `.env` file at the workspace root into a task's environment by default, and the API's own configuration ignores env files. No copy of the password is written anywhere else.
- [x] A migration command applies the committed migrations. It holds a PostgreSQL advisory lock while it runs, and refuses with a plain message when another run holds the lock. It exits non-zero on failure. The API never applies migrations when it starts.
- [x] `pnpm db:migrate` applies them to the development database. A command generates a migration from the schema, and its name is chosen here.
- [x] `pnpm services:up` applies the migrations once PostgreSQL is healthy and before it says the services are ready. On the owner's existing services this needs no reset and changes no value in `.env`.
- [x] `pnpm services:check` gains a line: the platform's database has every committed migration applied.
- [x] `pnpm check` gains a step that fails when the schema holds a change that no committed migration makes. It needs no database, and how it finds the change is settled first and recorded.
- [x] While the database cannot be reached, a call that needs it is answered 503 with an error code of its own, and the status endpoint still answers. `pnpm integration:check` proves this with the container stopped.
- [x] `pnpm platform:check` makes sure that the platform's database has every migration applied. When it has not, it says so plainly, names `pnpm services:up` and exits non-zero.
- [x] `pnpm platform:check` gains a line: the development Admin creates a made-up Part over HTTP on the running API, and reads it back. The Part's name is unique to the run and plainly test data.
- [x] Shown once and then reverted, each failing on its own line: a column added to the schema with no migration generated (`pnpm check`); a migration left unapplied (`pnpm services:check`); the mapping of an unreachable database to 503 removed (`pnpm integration:check`).
- [x] Checked by hand: on the owner's existing services, `pnpm services:up` applies the migrations and changes no value in `.env`, and a second run applies none.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks and the by-hand check are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 14 October 2026: completed

**For the owner to decide.**

- **How the password reaches the API in development.** When Nx runs a target, it reads `.env` files for it. Since this ticket, the API's `serve` and `migrate` targets each have a committed file of their own, `apps/api/.serve.env` and `apps/api/.migrate.env`. That file holds one line, `DATASOURCE_PASSWORD=${PCP_DB_PASSWORD}`, which Nx expands from the `.env` at the repository root.
  - No password is committed, and no copy of it is written anywhere.
  - A value set in the shell wins, which is how a server will give its own.
  - The MVP spec says that no app reads `.env`, and through Nx the API now does. Ticket 15 corrects that.
  - Each later target that reaches the database needs a file of its own, and ticket 08 now says so for the import.
  - **My recommendation:** keep it. The other way is for each workspace script to read `.env` and pass the password on, which would leave `pnpm exec nx serve @pcp/api` by hand without one.
- **Where the 503 is proved.** The ticket says `pnpm integration:check` proves it "with the container stopped", and it now does so in two places:
  - `pnpm check` points the API at a local port where nothing listens. That proves the API starts and answers 503 without any database, needs no Docker, and adds less than a second.
  - `pnpm integration:check` has a test file that starts a database of its own, has the API store a Part in it, stops it, and then expects 503 and a working status endpoint. Stopping the shared container would break the other test files.
- **The code review found a real defect, now fixed.** A database that stopped while a connection waited in the pool ended the API's process: `pg` reports that as an error event, and nothing listened to it. The test that stops a database was written first and failed with "Unhandled error … terminating connection due to administrator command".
- **`pnpm db:generate` requires a name for the migration,** for example `pnpm db:generate add-part-photo`. Without one, drizzle-kit makes a name up, and the spec says every file name says what the migration does.
- **The Parts that `pnpm platform:check` creates stay in the development database,** one for each run, named "Made-up test Part" and a time. `pnpm services:reset` clears them, as the spec says.

**Found out first.**

- **Nx 23.2.1 and `.env` files.** From its code, in `task-env.js` and `task-env-paths.js`:
  - For each task, Nx reads the project's files and then the workspace root's. For each folder, the order is: `.env.<target>.<configuration>`, `.env.<target>`, `.<target>.env`, the configuration's own, then `.env.local`, `.local.env` and `.env`.
  - The first value read for a name wins, and a variable already in the shell wins over every file.
  - `${…}` references are expanded once every file is read, so a project's file can name a value from the root's `.env`.
  - `NX_LOAD_DOT_ENV_FILES=false` turns this off.
  - Git ignores `.env.*`, so the files use the `.<target>.env` spelling, which it does not ignore.
  - The API started under `nx serve` with the password that way, and the end-to-end test stored a Part through it.
- **drizzle-kit 0.31.11 has two traps.**
  - It writes only to an output folder named relative to where it runs: given an absolute path, it writes under `./` and fails.
  - It can exit with 0 after a failure.

  The check therefore generates into a copy under the API's own `tmp`, with a configuration that imports the API's own and changes only where it writes. It passes only on drizzle-kit's own "No schema changes", with no file written.
- **Drizzle's migrator.**
  - It keeps its record in `drizzle.__drizzle_migrations`.
  - It applies every committed migration made after the last time recorded there, all in one transaction.
  - The command counts the pending ones the same way, and so do the workspace's checks, which read the journal and that record through `psql` in the container.
- **The lock.** `pg_try_advisory_lock(hashtext('pcp-api-migrations'))`, on the one connection that also applies the migrations. Ending that connection lets the lock go, also after a failure.

**Faults.** Each was planted by a script that refused a dirty tree, made one exact edit, ran the check named and undid the edit. `git status` was clean after every one.

| Fault | Failed |
|---|---|
| A column added to the schema with no migration generated | `pnpm check`, which showed the migration it needed: `ALTER TABLE "part" ADD COLUMN "planted_fault" text;` |
| A migration left unapplied: a journal entry with a later time | `pnpm services:check`: "it lacks 0001_planted-fault" |
| The mapping of an unreachable database to 503 removed | Both 503 tests in `pnpm check` |
| The advisory lock not looked at | "applies none, and says so, while another run holds the lock", and nothing else |
| The pool's error event no longer listened to | The test that stops its database |

**By hand,** on the owner's existing services, with `.env`'s SHA-256 compared before and after and its values never printed:

- The first `pnpm services:up` applied 1 migration.
- A second one said the database already has every migration.
- A third, after the review, applied migrations through `pnpm db:migrate` itself.
- `.env` was unchanged throughout.
- `pnpm services:check` passed on all 34 lines.

**Results.**

- `pnpm check` passes.
- `pnpm integration:check` passes 20 tests.
- `pnpm platform:check` passes 29 tests, the new one among them, and left none of the three apps running.
