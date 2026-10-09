# 01: PostgreSQL starts with one command, with generated passwords and the first checks

**Spec:** [the development services spec](../spec.md)

**What to build:** From the repository root, one command starts PostgreSQL in Docker and returns when it is ready. The owner invents no password: the first start generates the local passwords, and later starts leave them alone. PostgreSQL holds the platform's database, which is empty, and Keycloak's database, each with its own user that cannot reach the other's. A second command checks the running service from the outside and says, line by line, what is true. A third stops the services and keeps their data, and a fourth deletes the data.

This ticket builds all four commands and the scripted check. Tickets 02 to 04 add Keycloak to the same Compose file and add lines to the same check.

The workplace backend's Compose files are a reference for the shape of a PostgreSQL service and its health check. Nothing is copied from them.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Before the version is pinned, PostgreSQL's current documentation and its official image's documentation are checked for the current stable release and for where the image keeps its data, which changed in version 18. The findings are recorded under Comments.
- [ ] One Docker Compose file at the repository root runs PostgreSQL, pinned to an exact version. The file says that it is for development only.
- [ ] PostgreSQL's port 5432 is published on the loopback address only.
- [ ] PostgreSQL keeps its data in a named Docker volume and has a health check.
- [ ] A set-up script that PostgreSQL runs on its first start creates the `pcp` and `keycloak` databases and one user for each, beside PostgreSQL's own superuser. Each user owns its own database and cannot connect to the other's. The script takes its passwords from the environment. The `pcp` database is left empty.
- [ ] A committed example file lists all five settings the spec names, with no values: the passwords of PostgreSQL's superuser, of the platform's database user and of Keycloak's database user, and the name and password of Keycloak's own administrator account. The last two are generated here and first used in ticket 02, because the start command never changes an environment file that exists.
- [ ] `pnpm services:up` creates the local environment file when it is missing, with random passwords, and never changes one that exists. Git ignores the file.
- [ ] The Compose file refuses to start, with a message naming the missing setting, when one is absent.
- [ ] `pnpm services:up` starts the services in the background and returns only when PostgreSQL is healthy. Running it while the services are running is harmless.
- [ ] `pnpm services:up` with Docker not running gives a clear message that says so.
- [ ] `pnpm services:down` stops the services and keeps their data. `pnpm services:reset` stops them and deletes their data, so that the next start is a first start.
- [ ] `pnpm services:check` is a plain Node script with no dependencies of its own, kept with the workspace's other tool scripts. It prints one line for each check with a pass or a fail, and exits non-zero if any fails. When a service cannot be reached it says so and names the start command.
- [ ] The scripted check asserts that PostgreSQL answers on port 5432 on the owner's machine, that the `pcp` and `keycloak` databases exist, and that each database user can connect to its own database and is refused by the other's. It reaches PostgreSQL through the client inside the PostgreSQL container, so no database driver is added.
- [ ] Shown once and then reverted, each after a reset: a fault in the set-up script that leaves a database out, and one that lets a user connect to the other's database, each make the scripted check fail on that line. With the services stopped, the check says they are not running and exits non-zero.
- [ ] Checked by hand: data written to the `pcp` database survives `pnpm services:down` followed by `pnpm services:up`, and is gone after `pnpm services:reset`. A second `pnpm services:up` leaves the local environment file unchanged.
- [ ] `pnpm check` passes with Docker stopped. It formats and lints the new files as it does every other file.
- [ ] No password is committed, and nothing in the three apps or the five libraries changes.
- [ ] The results of the fault checks and the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
