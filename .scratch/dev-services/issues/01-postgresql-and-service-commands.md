# 01: PostgreSQL starts with one command, with generated passwords and the first checks

**Spec:** [the development services spec](../spec.md)

**What to build:** From the repository root, one command starts PostgreSQL in Docker and returns when it is ready. The owner invents no password: the first start generates the local passwords, and later starts leave them alone. PostgreSQL holds the platform's database, which is empty, and Keycloak's database, each with its own user that cannot reach the other's. A second command checks the running service from the outside and says, line by line, what is true. A third stops the services and keeps their data, and a fourth deletes the data.

This ticket builds all four commands and the scripted check. Tickets 02 to 04 add Keycloak to the same Compose file and add lines to the same check.

The workplace backend's Compose files are a reference for the shape of a PostgreSQL service and its health check. Nothing is copied from them.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Before the version is pinned, PostgreSQL's current documentation and its official image's documentation are checked for the current stable release and for where the image keeps its data, which changed in version 18. The findings are recorded under Comments.
- [x] One Docker Compose file at the repository root runs PostgreSQL, pinned to an exact version. The file says that it is for development only.
- [x] PostgreSQL's port 5432 is published on the loopback address only.
- [x] PostgreSQL keeps its data in a named Docker volume and has a health check.
- [x] A set-up script that PostgreSQL runs on its first start creates the `pcp` and `keycloak` databases and one user for each, beside PostgreSQL's own superuser. Each user owns its own database and cannot connect to the other's. The script takes its passwords from the environment. The `pcp` database is left empty.
- [x] A committed example file lists all five settings the spec names, with no values: the passwords of PostgreSQL's superuser, of the platform's database user and of Keycloak's database user, and the name and password of Keycloak's own administrator account. The last two are generated here and first used in ticket 02, because the start command never changes an environment file that exists.
- [x] `pnpm services:up` creates the local environment file when it is missing, with random passwords, and never changes one that exists. Git ignores the file.
- [x] The Compose file refuses to start, with a message naming the missing setting, when one is absent.
- [x] `pnpm services:up` starts the services in the background and returns only when PostgreSQL is healthy. Running it while the services are running is harmless.
- [x] `pnpm services:up` with Docker not running gives a clear message that says so.
- [x] `pnpm services:down` stops the services and keeps their data. `pnpm services:reset` stops them and deletes their data, so that the next start is a first start.
- [x] `pnpm services:check` is a plain Node script with no dependencies of its own, kept with the workspace's other tool scripts. It prints one line for each check with a pass or a fail, and exits non-zero if any fails. When a service cannot be reached it says so and names the start command.
- [x] The scripted check asserts that PostgreSQL answers on port 5432 on the owner's machine, that the `pcp` and `keycloak` databases exist, and that each database user can connect to its own database and is refused by the other's. It reaches PostgreSQL through the client inside the PostgreSQL container, so no database driver is added.
- [x] Shown once and then reverted, each after a reset: a fault in the set-up script that leaves a database out, and one that lets a user connect to the other's database, each make the scripted check fail on that line. With the services stopped, the check says they are not running and exits non-zero.
- [x] Checked by hand: data written to the `pcp` database survives `pnpm services:down` followed by `pnpm services:up`, and is gone after `pnpm services:reset`. A second `pnpm services:up` leaves the local environment file unchanged.
- [x] `pnpm check` passes with Docker stopped. It formats and lints the new files as it does every other file.
- [x] No password is committed, and nothing in the three apps or the five libraries changes.
- [x] The results of the fault checks and the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**Version.** PostgreSQL 18.6. PostgreSQL's versioning page lists 18 as the newest supported major version and 18.6 as its current minor release, and the official image has an `18.6` tag and no tag for a version 19.

**Where the image keeps its data.** The image's documentation says that from version 18 the data lives in a folder named after the major version, and that the volume is mounted one level higher than before, at `/var/lib/postgresql`. The running container confirmed it: its data folder is `/var/lib/postgresql/18/docker`.

**What differs from the first plan, or is not obvious.**

- The health check asks over TCP, not over the socket. The image's documentation says that while a new database is being set up, a temporary server runs that listens on the socket only. A check on the socket would call that server ready, and the start command would return too early.
- The set-up script is a SQL file. It reads the two passwords from the environment with psql's `\getenv`, so no shell script is needed.
- The scripted check connects to the container's network address, not its loopback address. The image trusts loopback connections without a password, so a check made there would pass with any password. Over the network address PostgreSQL asks for the password, which is what a client outside the container meets.
- A refusal counts only when PostgreSQL's reason is that the user may not connect to that database. A wrong password or a missing database also stops a connection, and neither shows that the user is kept out.
- The port check asks for a PostgreSQL answer, not just an open port. Docker accepts connections on a published port even when nothing behind it listens.
- The Compose project has no fixed name, so Docker names it after the folder. Two clones in folders with different names keep separate data, each with its own passwords. Two clones cannot run at once, because both want ports 5432 and 8080.
- `pnpm services:down` and `pnpm services:reset` are plain Docker Compose commands. With no `.env` they refuse and name the missing setting, as the start would without the script.
- The data and the passwords belong together. If `.env` is deleted while the data volume is kept, the next start writes new passwords that the existing data does not know. `pnpm services:reset` followed by a new start puts that right.

**Fault checks,** each after `pnpm services:reset` and a new start, and each reverted:

| Fault | Result |
|---|---|
| The set-up script no longer creates the `pcp` database | `pnpm services:check` exits 1. "The pcp database exists" fails, and so do the two lines that need that database. |
| The set-up script no longer closes the `keycloak` database to other users | `pnpm services:check` exits 1. Only "The pcp user is refused by the keycloak database" fails: "the connection was accepted". |
| The services are stopped | `pnpm services:check` exits 1 with one failed line and "PostgreSQL cannot be reached. Start the services with "pnpm services:up"." |
| After reverting | All seven lines pass and it exits 0. |

Each line was also seen to fail before the code that satisfies it existed: with no services, with PostgreSQL running without a set-up script, and with the databases created without their users.

**By-hand results.**

| Check | Result |
|---|---|
| First `pnpm services:up` with no `.env` | "Created .env with new local passwords." The file holds the five settings, only its owner can read it, and Git ignores it. The command returned when the container was healthy. |
| `pnpm services:up` while the services are running | Exits 0. The container is reported as running and healthy, and `.env` is unchanged. |
| A table written to `pcp`, then `pnpm services:down`, then `pnpm services:up` | No container is left after the stop and the volume remains. The row is still there after the start. |
| `pnpm services:reset`, then `pnpm services:up` | The volume is removed. The table is gone, the `pcp` database holds no tables, and `.env` is unchanged. |
| A setting removed from `.env`, then `pnpm services:up` | Refused: "required variable PCP_DB_PASSWORD is missing a value: set it in .env, as .env.example describes". |
| `pnpm services:up` with the `docker` command pointed at a socket where no daemon listens | "Docker is not running. Start Docker, then run "pnpm services:up" again." Exits 1. Docker itself was left running; ticket 05 repeats this with Docker really stopped. |
| `pnpm services:up` with no `docker` command on the path | "Docker is not installed, or the "docker" command is not on the PATH." Exits 1. |
| `pnpm check` with the services stopped and no daemon reachable | Passes: the format check, the root lint and all 21 tasks. |
