# 05: Verify from a fresh clone and record the commands in the MVP spec

**Spec:** [the development services spec](../spec.md)

**What to build:** The services are proven sound as a whole, the way the next person to pick them up will meet them: a fresh clone in a new directory, with no local environment file and no Docker volumes, then one start and one check. Step 1 showed that results left over from earlier runs can hide a fault, so this run is the one that counts. The commands' behaviour across both services is checked by hand once, and the service commands, the addresses and the reset rule are written into [the MVP spec](../../mvp/spec.md), so that every later ticket starts from them. This ticket closes step 2 of the infrastructure.

**Blocked by:** 04

**Status:** resolved

- [x] In a fresh clone in a new directory, with no local environment file and no Docker volumes left from earlier runs, one install followed by `pnpm services:up` and `pnpm services:check` passes on every line.
- [x] The scripted check's output holds a line for every assertion in the spec's Testing Decisions: PostgreSQL's port, the two databases and their two users, the discovery document, the two roles, the login request that reaches the login screen and the three that are refused, the three languages and the Kurdish default, the direction of each screen, and the missing sign-up and "forgot password".
- [x] Checked by hand, once, with both services: data survives `pnpm services:down` followed by `pnpm services:up`. After `pnpm services:reset` the data is gone and the realm is loaded again from the file.
- [x] Checked by hand: starting the services while they are running is harmless, and starting them with Docker stopped gives a clear message.
- [x] Checked by hand: with the services stopped, `pnpm services:check` says plainly that they are not running, names the start command and exits non-zero.
- [x] Checked by hand: neither port 5432 nor port 8080 answers on the machine's network address, only on the loopback address.
- [x] `pnpm check --skip-nx-cache` passes with Docker stopped.
- [x] No password is in the repository: the example file lists the settings without values, Git ignores the local environment file, and the realm file holds no logins and no secrets.
- [x] Nothing in the three apps or the five libraries has changed in this step.
- [x] The Technology section of the MVP spec gains the four service commands, the addresses of PostgreSQL and Keycloak, and the reset rule: a change to the realm file or the database set-up script takes effect only after `pnpm services:reset`. (Reworded on 9 October 2026. It first named the theme's language list too, which needs no reset: see Comments.) Its sentence about what is still to come is amended to name steps 3 and 4 only.
- [x] A fault found here is fixed in this ticket, and the fix is recorded under Comments.
- [x] The results of the from-scratch run and the by-hand checks are recorded under Comments.
- [x] The work is committed.

## Comments

### 9 October 2026: completed

The code review was held before this run, so that the run covers the code as it stands. What the review changed is in the next section.

**From scratch.** A fresh clone in a scratch folder with another name, so that Docker treated it as a separate set of services. The main checkout's services were reset first, which left no container and no volume on the machine.

| Check | Result |
|---|---|
| The fresh clone before anything is run | No `.env`, and a clean working tree. |
| `pnpm install --frozen-lockfile`, then `pnpm services:up` | "Created .env with new local passwords." Both containers healthy after 15 seconds, with both images already downloaded. |
| `pnpm services:check` | All 29 lines pass and it exits 0. |
| The lines against the spec's Testing Decisions | Every assertion listed there has at least one line. Four lines go beyond the list: "Keycloak answers on port 8080", "The password flow is refused", and one for each database user that it may connect to no database but its own. |
| Working tree after the start | Still clean. Git ignores `.env`. |

**By hand, once,** in the fresh clone, with both services:

| Check | Result |
|---|---|
| `pnpm services:up` while the services are running | Exits 0. Both containers are reported as running and healthy, and `.env` is unchanged. |
| A table written to the `pcp` database and a role added to the realm, then `pnpm services:down`, then `pnpm services:up` | After the stop no container is left and the volume remains. After the start the row is still there and the realm still has the added role. |
| `pnpm services:reset`, then `pnpm services:up` | No container and no volume is left. After the start the table is gone, and the realm has `admin` and `vendor` only: it was loaded again from the file. `.env` is unchanged, and all 29 lines pass. |
| Ports 5432 and 8080 on the loopback address, and on the machine's network address | Open on the loopback address. Refused on the network address. |
| The login theme's language list changed, with no restart and no reset | The change shows at once: "The Kurdish login screen is laid out right to left" fails. With the list restored, again with no restart, all 29 lines pass. |
| The passwords in `.env`, searched for in every commit | None is found. `.env.example` holds no value, it is the only environment file Git tracks, and the realm file holds no logins and no secrets. |
| The three apps and the five libraries, compared with the commit before this step | Unchanged. |

**With Docker really stopped.** Docker itself was stopped, with only this clone's two containers running, and started again afterwards.

| Check | Result |
|---|---|
| `pnpm services:up` | "Docker is not running. Start Docker, then run "pnpm services:up" again." Exits 1. |
| `pnpm services:check` | Two failed lines, one for each service, each followed by "cannot be reached. Start the services with "pnpm services:up"." Exits 1. The output is the same with Docker running and the services stopped. |
| `pnpm services:down` | Docker's own message that the daemon cannot be reached. Exits 1. |
| `pnpm check --skip-nx-cache` | Passes: the format check, the root lint and all 21 tasks, none from the cache. |
| Docker started again, then `pnpm services:up` | The containers had stopped with Docker and are not started again by it. One `pnpm services:up` brings both back healthy with their data, and all 29 lines pass. |

Afterwards the fresh clone's services were reset and the clone was deleted. The main checkout was started once more with its own `.env`, passed all 29 lines, and was stopped with its data kept.

**The MVP spec** now holds the four commands, the two services' addresses, the reset rule, and the `services` folder in its directory layout. It says that step 2 is finished and that steps 3 and 4 are still to come.

### 9 October 2026: the code review

Two reviewers read the whole change, one against the repository's standards and one against this spec. Each finding was checked before anything was changed.

**Changed as a result.**

| Finding | What was done |
|---|---|
| The line "The login screen is in Kurdish when the request names no language" could not fail. When the language lines were reworked in ticket 04, after their fault checks, it was left asking for Kurdish by name. | It sends no language again. The fault was planted once more, with the realm's default language changed to English, and the line failed: "the page says its language is en". |
| The two settings for Keycloak's own administrator account were named with "ADMIN", and the account itself `keycloak-admin`. This project keeps Admin for the platform's operator. | The settings are `KEYCLOAK_ADMINISTRATOR_NAME` and `KEYCLOAK_ADMINISTRATOR_PASSWORD`, and the account is `keycloak-administrator`. The names that are Keycloak's own, such as its `admin-cli` client and its `/admin` address, cannot be changed here. |
| Story 13 says each database user reaches only its own database. Both users could still connect to `postgres` and `template1`, the two databases PostgreSQL creates for itself. | The set-up script closes those two as well. The check gained a line for each user that asks PostgreSQL which databases the user may connect to. With the script's two new lines taken out, both lines failed: "it may connect to pcp, postgres, template1". |
| The MVP spec said a change to the theme's language list shows at once, and the spec for this step said it needs a reset. No ticket recorded a test. | It was tested, in the main checkout and again in the fresh clone: the change shows at once, because in development mode Keycloak reads the theme afresh for every page. The spec's sentence was corrected and this ticket's criterion was reworded. |
| The MVP spec said the realm has one client. | It now says that the platform's one client is `dashboard` and that Keycloak adds six of its own. |
| Ticket 04 counted nine lines of Sorani text. There are eight. | Corrected. |
| In the check: constants named in two styles, a function and a parameter both called `reason`, one status test and one token request each written several times, and a request made only to learn an address. In the start script: a function named `stop` that ends the script. | Tidied. No line of the check's output changed, apart from the two new ones. |

**A fault found while making those changes.** Once the two settings were renamed, the `.env` on disk no longer held every setting, and `pnpm services:reset` refused to run: Docker Compose will not read the Compose file while a setting is missing. Ticket 01 had met the same refusal with no `.env` and left it. Both `pnpm services:down` and `pnpm services:reset` now run through a script that gives every setting a stand-in, because stopping needs none of their values. Reset then worked with the old `.env` and with no `.env`, and stop worked with no `.env`.

**Left as it is, with the reason.**

- **Keycloak's own `admin-cli` client accepts the password flow in the `pcp` realm.** The spec reviewer found this and it was confirmed: of the seven clients in the realm it is the only one that looks at a password sent straight to the token address. Keycloak creates that client in every realm. The spec limits the `dashboard` client, which is limited, and leaves everything else at Keycloak's defaults. The realm holds no logins yet, so nothing can be done with it today. Whether to close it is the owner's decision, to be made before the first Vendor login exists; the `accounts` module is the natural place.
- **The MVP spec said step 2 was finished while this ticket was still open.** True when the reviewers read it. This ticket was closed the same day.
- **A few small things nobody asked for are kept:** the two extra check lines recorded in tickets 02 and 03, a separate message when Docker is not installed at all, `.env` being readable by its owner only, and two notes in the MVP spec, on the data and the passwords belonging together and on renaming the realm.
- **The check prints to standard output even when it stops for want of `.env`.** Its whole output is its report.
- **The three languages are listed in five places:** the three settings files of the theme, the realm file and the check. Keycloak needs the first four, and the check must not read them from the files it is checking.
- **One script holds every check.** The spec asks for one plain script.
