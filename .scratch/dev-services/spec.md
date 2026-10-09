# Spec: PostgreSQL and Keycloak for development

Status: ready-for-agent

This is step 2 of the four infrastructure steps listed under "Order of work" in [the MVP spec](../mvp/spec.md). Step 1, [the workspace](../workspace/spec.md), is finished. This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md). The owner confirmed its test seam on 7 October 2026.

One word needs care. In this project **Admin** means the platform's operator. Keycloak also has an administrator account of its own, used to open Keycloak's own console. This spec calls that "Keycloak's own administrator account" and never "Admin".

## Problem Statement

The workspace has three apps that start and five libraries that resolve, but nothing for them to talk to. The API has no database to connect to, and nobody can log in, because there is no identity service. Every module in the MVP's capability map needs one or both.

ADR-0003 settles what these services are: PostgreSQL, and Keycloak for logins. What is missing is a way to run them on the owner's machine that is the same every time, that a coding agent can start without being told how, and that carries Keycloak's setup in the repository instead of in clicks made in a console that nobody can review or repeat.

## Solution

One command at the repository root starts PostgreSQL and Keycloak in Docker and returns when both are ready. PostgreSQL holds two databases on one server: the platform's own, which is empty, and Keycloak's. Keycloak starts with its setup already loaded from a file in the repository: the Admin and Vendor roles, the dashboard's login client, and login screens in Kurdish (Sorani), Arabic and English.

A second command checks the running services from the outside and says, line by line, whether each of those things is true. A third stops the services and keeps their data. A fourth throws the data away, so that the next start is a first start.

No password is committed. The local passwords are generated on the owner's machine the first time the services are started.

Nothing in the three apps changes in this step. The API does not connect to the database yet and nobody logs in to the dashboard yet. Step 4 joins the parts.

## User Stories

### Starting and stopping

1. As the owner, I want one command that starts PostgreSQL and Keycloak, so that I never assemble a Docker command by hand.
2. As the owner, I want that command to return only when both services are ready, so that the next thing I run does not fail because a service was still starting.
3. As the owner, I want the services to run in the background, so that my terminal stays free.
4. As the owner, I want a command that stops the services and keeps their data, so that I can free my machine's memory without losing my work.
5. As the owner, I want a command that stops the services and deletes their data, so that I can return to a known first start whenever I need to.
6. As the owner, I want the deleting command to have a name that says it deletes, so that I never run it by mistake.
7. As the owner, I want starting the services twice to be harmless, so that I do not have to remember whether they are running.
8. As the owner, I want a clear message when Docker is not running, so that I know what to fix.
9. As a coding agent, I want the service commands to sit beside the check and format commands, so that I find them without reading documentation.

### PostgreSQL

10. As the owner, I want PostgreSQL on its usual port, 5432, so that every database tool I use connects without extra settings.
11. As the owner, I want the platform's database to exist and be empty from the first start, so that the first migration has somewhere to run.
12. As the owner, I want Keycloak's data in a second database on the same server, so that one PostgreSQL serves the whole platform, as the MVP spec decided.
13. As the owner, I want the platform and Keycloak to use different database users, each able to reach only its own database, so that a bug in the API can never touch Keycloak's tables.
14. As the owner, I want the database's data to survive a stop and a restart, so that a restart of my machine costs me nothing.
15. As the owner, I want the PostgreSQL version pinned exactly, so that my machine and a future server run the same one.

### Keycloak

16. As the owner, I want Keycloak on port 8080, the port step 1 left free for it, so that all five parts of the platform run together.
17. As the owner, I want Keycloak's setup kept as a file in the repository, so that I can read it, review a change to it and get it back after a reset.
18. As the owner, I want that file loaded when Keycloak first starts, so that a fresh machine needs no clicking in Keycloak's console.
19. As the owner, I want one realm for the platform, so that Vendors and the Admin are kept apart from Keycloak's own administration.
20. As the owner, I want the Admin role and the Vendor role to exist in that realm, so that later work can give a login one of them and the API can tell them apart.
21. As the owner, I want the dashboard's login client to exist, so that step 4 can send the Admin to Keycloak to log in.
22. As the owner, I want that client to need no secret, so that nothing secret has to live in the browser.
23. As the owner, I want that client to accept a login only when it returns to the dashboard's own address, so that a login cannot be redirected to another site.
24. As the owner, I want that client to allow only the login flow the dashboard uses, so that the weaker flows are closed from the first day.
25. As the owner, I want self sign-up switched off, so that nobody can create a Vendor login without the Admin, as ACC-2 requires.
26. As the owner, I want Keycloak's "forgot password" screen switched off, so that Keycloak never promises an email the platform does not send.
27. As the owner, I want the realm to hold no logins and no secrets in the repository, so that the setup file is safe to commit.
28. As the owner, I want a change to the setup file to reach Keycloak in a way that is written down, so that I am not left wondering why my edit had no effect.
29. As the owner, I want Keycloak's memory limited, so that it behaves on my machine as it will on a 4 GB server.
30. As the owner, I want the Keycloak version pinned exactly, so that an upgrade is a decision and not an accident.

### Languages

31. As the owner, I want the login screen offered in Kurdish (Sorani), Arabic and English, so that a Vendor meets the platform's three languages from the first screen.
32. As the owner, I want Kurdish to be the language used when nothing else decides, so that the login screen follows the same rule as the rest of the platform (LANG-6).
33. As the owner, I want the Kurdish and Arabic login screens laid out right to left, so that they read correctly (LANG-2).
34. As the owner, I want the Sorani text kept in the repository as a Keycloak theme, so that it is maintained with the rest of the platform's text, as ADR-0003 says.
35. As the owner, I want the drafted Sorani text marked as awaiting my review, so that nothing I have not read reaches a Vendor (LANG-7).
36. As the owner, I want the login screen's heading to avoid the working title, so that "PC Part Picker" is never shown as a brand.

### Passwords

37. As the owner, I want no password in the repository, so that the MVP spec's rule against committing secrets holds without exception.
38. As the owner, I want the local passwords generated for me on first use, so that I do not have to invent any.
39. As the owner, I want my generated passwords left alone on later starts, so that the services keep working with the data they already hold.
40. As the owner, I want the file that holds them ignored by Git, so that I cannot commit it by accident.
41. As a coding agent, I want a committed list of the settings the services need, without their values, so that I know what exists without seeing anyone's passwords.
42. As the owner, I want both services reachable only from my own machine, so that a development database is never open to the network I happen to be on.

### Checking

43. As the owner, I want one command that checks the running services, so that I know the setup is right without opening a console.
44. As the owner, I want that command to print one line per thing it checked, so that a failure tells me what is wrong.
45. As the owner, I want it to exit with an error when any line fails, so that a script or an agent can rely on it.
46. As the owner, I want it to say plainly when the services are not running, so that I do not mistake that for a broken setup.
47. As the owner, I want each of its checks shown once to fail, so that I trust a pass.
48. As the owner, I want `pnpm check` to keep working without Docker, so that the everyday check stays fast and has no new requirement.
49. As a coding agent, I want the service commands, addresses and the reset rule written into the MVP spec, so that every later ticket starts from them.

## Implementation Decisions

### The services

- One Docker Compose file at the repository root runs both services. It is for development only.
- Both images are pinned to an exact version: the current stable release of PostgreSQL and of Keycloak when the work is done. Each tool's current documentation is checked first.
- Both ports are published on the loopback address only: PostgreSQL on 5432 and Keycloak on 8080.
- Each service has a health check, and Keycloak starts only after PostgreSQL is healthy.
- PostgreSQL keeps its data in a named Docker volume. Keycloak keeps everything in its database, so it needs no volume of its own.

### PostgreSQL

- One server holds two databases: `pcp` for the platform and `keycloak` for Keycloak.
- Two database users exist beside PostgreSQL's own superuser: one owns the platform's database and one owns Keycloak's. Neither can connect to the other's database.
- The databases and users are created by a set-up script that PostgreSQL runs on its first start, when its data volume is empty. The script takes its passwords from the environment.
- The platform's database is left empty. Schemas and migrations arrive with the first module that stores something.

### Keycloak

- Keycloak runs in its development mode and stores its data in the `keycloak` database.
- A memory limit is set on its container, as Keycloak's own container guide asks. It starts at 1.5 GB, in line with the 1.25 GB base that ADR-0003 quotes.
- Keycloak's own administrator account is created at first start from the local environment file. It exists so that the owner can open Keycloak's console during development. The platform's Admin never uses it.

### The realm

- The platform has one realm, named `pcp`. Its display name is a neutral placeholder until the platform's name is chosen.
- The realm is one JSON file in the repository, loaded by Keycloak's import at startup. It holds no logins and no secrets.
- It has two realm roles, `admin` and `vendor`, for the Admin and for Vendors.
- It has one client, `dashboard`, the dashboard's login client:
  - it is a public client, with no secret;
  - it allows the authorisation code flow only, and requires PKCE with the S256 method;
  - its redirect addresses, its web origin and its address after logout are limited to the dashboard's development address, `http://localhost:3002`.
- Self sign-up is off. The "forgot password" screen is off. Login with an email address is off, because a Vendor's login name is its phone number (ACC-3).
- Its languages are Kurdish (Sorani), Arabic and English, with Kurdish as the default. The language tags are `ckb`, `ar` and `en`.
- Everything else is left at Keycloak's defaults: session lengths, the password policy, protection against repeated wrong passwords, and the wording of the login name field. These belong to the `accounts` module.

### The theme

- Keycloak ships English and Arabic but not Sorani, so the repository holds a Keycloak theme that extends Keycloak's default and adds it. The theme is mounted into the Keycloak container and the realm uses it.
- Keycloak offers a language in a realm only when its login, account and email screens all support that language. The theme therefore declares the three languages for all three kinds of screen.
- The Sorani text written in this step covers the login screen only. It is a draft and is marked as awaiting the owner's review. Any Sorani text that is missing falls back to Keycloak's English.
- The Kurdish and Arabic login screens are laid out right to left. Keycloak's documentation does not say how it chooses a direction, so how it treats Sorani is tested on the running service, and the theme sets the direction itself if Keycloak does not.
- The theme changes no colours, layout or logo. The login screen's design is later work.

### Passwords and settings

- No password is committed. A committed example file lists the settings the services need, with no values.
- The start command creates the local environment file when it is missing, with random passwords, and never changes one that exists. Git ignores the file.
- The Compose file refuses to start, with a message naming the missing setting, when one is absent.
- The settings are the passwords of PostgreSQL's superuser, of the platform's database user and of Keycloak's database user, and the name and password of Keycloak's own administrator account.

### Commands

| Command | What it does |
|---|---|
| `pnpm services:up` | Creates the local environment file if it is missing, starts both services in the background and returns when both are healthy. |
| `pnpm services:down` | Stops both services and keeps their data. |
| `pnpm services:reset` | Stops both services and deletes their data. The next start is a first start. |
| `pnpm services:check` | Checks the running services from the outside and reports each result. |

- Keycloak imports the realm only when the realm does not exist yet. A change to the realm file, the theme's language list or the database set-up script therefore takes effect only after a reset. This is written into the MVP spec beside the commands.
- `pnpm check` does not start or need the services. It formats and lints the new files as it does every other file.

### The scripted check

- It is a plain Node script with no dependencies of its own, kept with the workspace's other tool scripts and linted with them.
- It reaches Keycloak over HTTP on its published port. It reaches PostgreSQL through the client inside the PostgreSQL container, so that no database driver is added before the API chooses one, and it also confirms that port 5432 answers on the owner's machine.
- It prefers what a client of the service would see over reading settings back. It uses Keycloak's administration interface, as Keycloak's own administrator, only for what has no outside behaviour: the roles and the default language.
- It prints one line for each check with a pass or a fail, and exits non-zero if any fails. When a service cannot be reached it says so and names the start command.

## Testing Decisions

A good check of this step observes the running services the way their clients will: it asks PostgreSQL who may connect to what, and it asks Keycloak for its public documents and screens. It does not compare the realm file with itself, and it does not read the Compose file.

- **One seam: the services' published ports,** reached after starting the services from the repository root. The owner chose a scripted check at this seam on 7 October 2026.
- **What the scripted check asserts:**
  - PostgreSQL answers on port 5432.
  - The `pcp` and `keycloak` databases exist. Each database user can connect to its own database and is refused by the other's.
  - The realm's discovery document answers on port 8080 and names the realm as the issuer.
  - The `admin` and `vendor` roles exist.
  - A login request from the dashboard's client, returning to the dashboard's address and carrying a PKCE challenge, reaches the login screen.
  - The same request is refused when it returns to any other address, when it carries no PKCE challenge, and when it asks for a flow other than the authorisation code flow.
  - The login screen is served in Kurdish, Arabic and English, each with that language's text, and Kurdish is used when the request names no language.
  - The Kurdish and Arabic login screens declare a right-to-left direction, and the English one left-to-right.
  - The login screen offers no sign-up and no "forgot password" link, and the sign-up address itself refuses.
- **Each check is seen to fail.** For every group above, a deliberate fault is made in the realm file, the theme or the database set-up script, the services are reset, and the scripted check is shown to fail on that line. The fault is then reverted. A check that has never been seen to fail is not trusted.
- **From scratch.** On a fresh clone with no local environment file and no Docker volumes, the start command followed by the scripted check passes. Step 1 showed that results left over from earlier runs can hide a fault, so this run is the one that counts.
- **By hand, once.** Data survives `pnpm services:down` followed by `pnpm services:up`. After `pnpm services:reset` the data is gone and the realm is loaded again from the file. Starting the services while they are running is harmless. Starting them with Docker stopped gives a clear message.
- **`pnpm check` is unchanged in behaviour:** it passes with Docker stopped.
- **No test code inside the apps or libraries.** Nothing in them changes in this step.
- **Prior art.** The repository has no service checks yet. The by-hand records in step 1's tickets are the model for how results are written down. The workplace backend runs its database from a Compose file kept beside each app; that file is a reference for the shape of a PostgreSQL service and its health check, and nothing is copied from it.
- **Recording.** The results of the fault checks and the by-hand checks are written under the Comments heading of the ticket that carries them out.

## Out of Scope

- Connecting the API to the database, Drizzle, schemas and migrations.
- Verifying login tokens in the API, the API's guard, the dashboard's login flow and generating `api-client` (step 4).
- Any login in the realm, including a development Admin login. Step 4 decides how that login is created.
- The API's access to Keycloak's administration interface for creating Vendors and resetting passwords, and the secret it needs (`accounts`).
- Logging in with a phone number as worded on the screen, temporary passwords and the forced change at first login, the password policy, protection against repeated wrong passwords, and session lengths (`accounts`).
- Sorani text beyond the login screen, and any change to the login screen's appearance.
- Sending email from Keycloak. The platform sends no messages.
- The Nx boundary rule and the layer checks (step 3).
- Test containers for the API's integration tests, which arrive with the first feature that stores data.
- Anything for production: Dockerfiles for the apps, a production Compose file, HTTPS, backups and the choice of host.
- Automated checks on GitHub.

## Further Notes

- **Choices made here that no ADR records.** Each is the smallest choice that lets the services exist, and the owner may overrule any of them before work starts:
  - The realm is named `pcp`, the roles `admin` and `vendor`, and the client `dashboard`.
  - The two databases have separate users. One shared user would be less to set up and would let the API read Keycloak's tables.
  - Local passwords are generated, not committed as an example. The workplace backend commits development passwords in its Compose files; the MVP spec's rule against committing passwords is followed here instead.
  - Both ports are published to the owner's machine only.
  - Sorani text is written for the login screen only.
  - The scripted check is JavaScript, like the install guard, because nothing type-checks files outside the eight projects. If the tool scripts grow, they become a project of their own.
- **Checked in Keycloak's documentation on 7 October 2026:**
  - a realm file is imported at startup, the import is skipped when the realm already exists, and values in the file may be read from the environment;
  - a language needs support in the login, account and email screens;
  - a container should always be given a memory limit;
  - the documentation does not say how the direction of a language is chosen.
- **PostgreSQL's official image changed where it keeps its data in version 18.** The image's own documentation is checked for where to mount the volume.
- **The lesson from step 1.** Nx's generators set up faults that showed only on a run from scratch. Every claim in this step is checked after a reset, not on services that have been running.
- **The owner's machine** had Docker 29.8.2 on 7 October 2026.
- **Next steps.** Step 3 is the boundary and layer checks. Step 4 is the proof that the parts connect, and it is the first step that uses what this one builds.
