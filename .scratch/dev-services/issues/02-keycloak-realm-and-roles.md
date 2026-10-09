# 02: Keycloak starts with the `pcp` realm and its two roles loaded from the repository

**Spec:** [the development services spec](../spec.md)

**What to build:** The same start command now starts Keycloak as well and returns when both services are ready. Keycloak keeps its data in the `keycloak` database that ticket 01 created. It starts with its setup already loaded from a file in the repository: one realm for the platform, holding the role for the Admin and the role for Vendors, with no logins and no secrets. Nobody clicks anything in Keycloak's console. The scripted check gains the lines that show the realm and its roles are there.

In this project **Admin** means the platform's operator. Keycloak's own administrator account is a different thing, used only to open Keycloak's console during development, and is never called "Admin".

**Blocked by:** 01

**Status:** resolved

- [x] Before the version is pinned, Keycloak's current documentation is checked for the current stable release, for how a realm file is imported at startup, for its guidance on a container's memory limit, and for how its health is reported. The findings are recorded under Comments.
- [x] Keycloak joins the Compose file, pinned to an exact version and running in its development mode. It stores its data in the `keycloak` database as Keycloak's database user, and has no volume of its own.
- [x] Keycloak's port 8080 is published on the loopback address only.
- [x] Keycloak's container has a memory limit of 1.5 GB.
- [x] Keycloak has a health check and starts only after PostgreSQL is healthy. `pnpm services:up` returns only when both services are healthy.
- [x] Keycloak's own administrator account is created at first start from the local environment file.
- [x] The realm is one JSON file in the repository, loaded by Keycloak's import at startup. It is named `pcp`, and its display name is a neutral placeholder that does not show the working title "PC Part Picker" as a brand. It holds no logins and no secrets.
- [x] The realm has two realm roles, `admin` and `vendor`.
- [x] Everything the spec does not name is left at Keycloak's defaults: session lengths, the password policy and protection against repeated wrong passwords.
- [x] The scripted check gains two assertions: the realm's discovery document answers on port 8080 and names the realm as the issuer, and the `admin` and `vendor` roles exist. It reads the roles through Keycloak's administration interface, as Keycloak's own administrator, because they have no outside behaviour. When Keycloak cannot be reached it says so and names the start command.
- [x] Shown once and then reverted, each after a reset: a role removed from the realm file, and the realm given another name, each make the scripted check fail on that line.
- [x] Checked by hand: after `pnpm services:reset` and a new start, the realm is loaded again from the file. A change to the realm file made without a reset does not reach Keycloak.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks and the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**Version.** Keycloak 26.8.0, released on 1 October 2026 and the newest release that is not a nightly build. Its image has no later patch tag.

**What Keycloak's documentation says,** checked before anything was written:

- A realm file placed in the image's import folder is loaded when the server is started with `--import-realm`. Only files ending in `.json` are read, and a realm that already exists is skipped.
- A container should always be given a memory limit, because the Java heap is sized from it: 70% of the limit at most.
- The health pages are off by default. Once switched on they are served on a separate management port, 9000, which is not published here.
- The image has no `curl`, and the health guide gives a request written to a socket by hand in its place. The health check uses it.
- The administrator account that the environment creates is named a temporary one by Keycloak. It is enough for opening the console during development.

**What differs from the first plan, or is not obvious.**

- **Keycloak ties the realm file's name to the realm's name.** A file named for `pcp` that holds a realm of another name stops Keycloak from starting: "File name / realm name mismatch". The documentation does not mention this. Renaming the realm means renaming its file as well.
- The check has one line the spec does not list, "Keycloak answers on port 8080", asked of Keycloak's own `master` realm. It tells a Keycloak that is not running apart from a realm that is missing, as the PostgreSQL port line does for the database.
- The realm's display name is "Platform".
- The memory limit is written as 1536 MiB, which Docker reports as 1,610,612,736 bytes.
- The realm file is formatted by `pnpm format` like every other JSON file.

**Fault checks,** each after `pnpm services:reset` and a new start, and each reverted:

| Fault | Result |
|---|---|
| The `vendor` role removed from the realm file | `pnpm services:check` exits 1. Only "The vendor role exists" fails. |
| The realm given another name, in a file still named for `pcp` | Keycloak does not start, for the reason above, and `pnpm services:up` exits 1. The check then says that Keycloak cannot be reached. |
| The realm and its file both given another name | Keycloak starts. "The pcp realm's discovery document names the realm as its issuer" fails with "Keycloak answered 404", and both role lines fail. |
| After reverting | All eleven lines pass and it exits 0. |

Each line was also seen to fail before the code that satisfies it existed: with no Keycloak, and with a realm that had no roles.

**By-hand results.**

| Check | Result |
|---|---|
| `pnpm services:reset`, then `pnpm services:up` | Returns after about 16 seconds with both containers healthy. The check passes when run straight afterwards, so a healthy Keycloak has finished its import. Keycloak's log says "Realm 'pcp' imported". |
| The realm file changed, then `pnpm services:down` and `pnpm services:up` with no reset | The change does not reach Keycloak. Its log says "Realm 'pcp' already exists. Import skipped". |
| The same change after `pnpm services:reset` | It is loaded. |
| Keycloak's container | Memory limit 1,610,612,736 bytes. Port 8080 is bound to 127.0.0.1 only. Its one mount is the import folder; it has no volume. |
| The two databases | `keycloak` holds Keycloak's 101 tables, all owned by the `keycloak` user. `pcp` holds none. |
| The `pcp` realm, read through the administration interface | No logins. Its only clients are the six that Keycloak creates in every realm. |
| `pnpm check` with no daemon reachable | Passes. |

**For ticket 03.** Keycloak's defaults already have self sign-up and "forgot password" off, and login with an email address on. The realm file will state all three.
