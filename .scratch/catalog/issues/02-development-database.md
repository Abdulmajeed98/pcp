# 02: The development database: migrations by their own command, and the API without its database

**Spec:** [the catalog spec](../spec.md)

**What to build:** The owner's development database gets the platform's tables, and the API started with `nx serve` stores Parts there. Migrations are applied by a command of their own, never when the API starts, as at the workplace. `pnpm services:up` applies them, so a fresh machine is still ready in one step, and `pnpm services:check` says whether every one is applied. `pnpm check` fails when the schema has changed and no migration was generated.

The database password is the first setting of any app that is a secret. Its development value is the one `.env` already holds for the `pcp` user, and it reaches the API from there. While the database cannot be reached, the API still starts, and a call that needs the database is answered 503, as a call is while Keycloak's keys cannot be had.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Before anything is written, it is found out and recorded under Comments how `DATASOURCE_PASSWORD` reaches `nx serve @pcp/api`, the migration command and the apps that `pnpm platform:check` starts. Nx loads a `.env` file at the workspace root into a task's environment by default, and the API's own configuration ignores env files. No copy of the password is written anywhere else.
- [ ] A migration command applies the committed migrations. It holds a PostgreSQL advisory lock while it runs, and refuses with a plain message when another run holds the lock. It exits non-zero on failure. The API never applies migrations when it starts.
- [ ] `pnpm db:migrate` applies them to the development database. A command generates a migration from the schema, and its name is chosen here.
- [ ] `pnpm services:up` applies the migrations once PostgreSQL is healthy and before it says the services are ready. On the owner's existing services this needs no reset and changes no value in `.env`.
- [ ] `pnpm services:check` gains a line: the platform's database has every committed migration applied.
- [ ] `pnpm check` gains a step that fails when the schema holds a change that no committed migration makes. It needs no database, and how it finds the change is settled first and recorded.
- [ ] While the database cannot be reached, a call that needs it is answered 503 with an error code of its own, and the status endpoint still answers. `pnpm integration:check` proves this with the container stopped.
- [ ] `pnpm platform:check` makes sure that the platform's database has every migration applied. When it has not, it says so plainly, names `pnpm services:up` and exits non-zero.
- [ ] `pnpm platform:check` gains a line: the development Admin creates a made-up Part over HTTP on the running API, and reads it back. The Part's name is unique to the run and plainly test data.
- [ ] Shown once and then reverted, each failing on its own line: a column added to the schema with no migration generated (`pnpm check`); a migration left unapplied (`pnpm services:check`); the mapping of an unreachable database to 503 removed (`pnpm integration:check`).
- [ ] Checked by hand: on the owner's existing services, `pnpm services:up` applies the migrations and changes no value in `.env`, and a second run applies none.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks and the by-hand check are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
