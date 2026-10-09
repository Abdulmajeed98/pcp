# 02: Keycloak starts with the `pcp` realm and its two roles loaded from the repository

**Spec:** [the development services spec](../spec.md)

**What to build:** The same start command now starts Keycloak as well and returns when both services are ready. Keycloak keeps its data in the `keycloak` database that ticket 01 created. It starts with its setup already loaded from a file in the repository: one realm for the platform, holding the role for the Admin and the role for Vendors, with no logins and no secrets. Nobody clicks anything in Keycloak's console. The scripted check gains the lines that show the realm and its roles are there.

In this project **Admin** means the platform's operator. Keycloak's own administrator account is a different thing, used only to open Keycloak's console during development, and is never called "Admin".

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Before the version is pinned, Keycloak's current documentation is checked for the current stable release, for how a realm file is imported at startup, for its guidance on a container's memory limit, and for how its health is reported. The findings are recorded under Comments.
- [ ] Keycloak joins the Compose file, pinned to an exact version and running in its development mode. It stores its data in the `keycloak` database as Keycloak's database user, and has no volume of its own.
- [ ] Keycloak's port 8080 is published on the loopback address only.
- [ ] Keycloak's container has a memory limit of 1.5 GB.
- [ ] Keycloak has a health check and starts only after PostgreSQL is healthy. `pnpm services:up` returns only when both services are healthy.
- [ ] Keycloak's own administrator account is created at first start from the local environment file.
- [ ] The realm is one JSON file in the repository, loaded by Keycloak's import at startup. It is named `pcp`, and its display name is a neutral placeholder that does not show the working title "PC Part Picker" as a brand. It holds no logins and no secrets.
- [ ] The realm has two realm roles, `admin` and `vendor`.
- [ ] Everything the spec does not name is left at Keycloak's defaults: session lengths, the password policy and protection against repeated wrong passwords.
- [ ] The scripted check gains two assertions: the realm's discovery document answers on port 8080 and names the realm as the issuer, and the `admin` and `vendor` roles exist. It reads the roles through Keycloak's administration interface, as Keycloak's own administrator, because they have no outside behaviour. When Keycloak cannot be reached it says so and names the start command.
- [ ] Shown once and then reverted, each after a reset: a role removed from the realm file, and the realm given another name, each make the scripted check fail on that line.
- [ ] Checked by hand: after `pnpm services:reset` and a new start, the realm is loaded again from the file. A change to the realm file made without a reset does not reach Keycloak.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks and the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
