# 03: The API manages Logins in the development services

**Spec:** [the accounts spec](../spec.md)

**What to build:** The owner's development services gain what tickets 01 and 02 need, and the API, run with `nx serve`, makes Vendors' Logins in the owner's own Keycloak. The realm also gains its password policy and its brute-force detection here, so that every change to the realm file reaches the owner's services in one reset.

`pnpm services:up` writes the API's client secret into `.env`, and the Compose file gives it to Keycloak. `pnpm services:check` says whether the API's client can manage Logins, and `pnpm platform:check` asks for the secret. The end-to-end tests gain a made-up Vendor, created over HTTP as the development Admin. That Vendor logs in at Keycloak's login screen and is shown the screen that asks for a new password, which proves the whole path on the running platform.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] Before anything is written, these are read for the installed releases, and the findings are recorded under Comments:
  - Keycloak 26.8's realm settings for a password policy and for brute-force detection, and what a locked Login sees;
  - how the Compose file gives Keycloak's container a setting from `.env`.
- [x] The realm file gains a password policy, at least 8 characters and not the Login's name, and turns on brute-force detection. After a few wrong passwords in a row a Login is locked for a time that grows with each further failure, up to 15 minutes. The numbers chosen are recorded under Comments.
- [x] `.env.example` lists the API's client secret without its value. `pnpm services:up` writes a random value for it at the first start, and adds it to an existing `.env` that lacks it, as it does for each password. The Compose file gives it to Keycloak.
- [x] The API's `serve` target gets it from `.env` through its committed env file, as it gets the database password, and so does each other target ticket 01 found to need it. No copy of it is written anywhere else.
- [x] `pnpm services:check` gains a line saying that the API's client logs in to Keycloak and finds the realm's Logins. Where it checks the realm's clients, it counts the API's client.
- [x] `pnpm platform:check` says so plainly, and names `pnpm services:up`, when `.env` lacks the secret.
- [x] Before the reset, the owner is told that it deletes the platform's database, which holds the imported catalog and test data, and Keycloak's data, and the owner agrees. Then `pnpm services:reset`, `pnpm services:up` and `pnpm catalog:import` are run, and `pnpm services:check` passes. Each step's outcome is recorded under Comments.
- [x] The end-to-end tests gain `createAMadeUpVendor`, which creates a Vendor over HTTP as the development Admin. It is named "Made-up test Vendor" with a number unique to the run, has a login phone number unique to the run and every required detail, and gives the test its login phone number and temporary password, which are never printed. Nothing is ever sent to that number.
- [x] `pnpm platform:check` gains this line, and passes on every line: a made-up Vendor logs in at Keycloak's login screen with its login phone number in the stored form and its temporary password, and Keycloak shows the screen that asks for a new password, told apart by its address and its form.
- [x] Shown once and then reverted, each failing on its own line: the client's secret changed in `.env`, which `pnpm services:check` reports; the required password update left off a new Login, which the new line of `pnpm platform:check` reports. Neither needs a second reset.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 16 October 2026: the owner agreed to the reset

When asked in this session on 16 October 2026, the owner agreed to the reset: `pnpm services:reset` deletes the platform's database, which holds the imported catalog and test data, and Keycloak's data. It is run once, when the realm and Compose changes are ready, and followed by `pnpm services:up`, `pnpm catalog:import` and `pnpm services:check`.

### 16 October 2026: what was read before anything was written

Read for the installed releases: Keycloak 26.8.0's Server Administration Guide (the 26.8.0 page, whose brute-force section matches 26.8.1's word for word), Keycloak 26.8.0 tried in a throwaway container that imported the changed realm file, and Docker's Compose documentation for Docker Compose 5.5.1.

- **A password policy.** The realm's `passwordPolicy` is one text of policies joined by `and`. `length(8) and notUsername` is read back exactly so.
  - It applies to every password, a temporary one set through the administration interface among them. A create with a password of 7 characters is refused with 400 `invalidPasswordMinLengthMessage`, one equal to the Login's name with 400 `invalidPasswordNotUsernameMessage`, and neither leaves a Login. The API's temporary passwords have 12 characters and are never a phone number, so they pass.
  - The guide says a new policy is not applied to existing Logins. The reset makes every Login afresh.
  - On the screen that asks for a new password, a password of 3 characters is refused with "Invalid password: minimum length ٨." and the Login's name with "Invalid password: must not be equal to the username.", in the alert above the form. **Keycloak writes the 8 in Arabic-Indic digits on the Kurdish screen**, through the locale it formats the message in. That is for ticket 04, whose Kurdish text this is.
- **The screen that asks for a new password.** A Login with a temporary password that logs in at the login screen is sent to `…/realms/pcp/login-actions/required-action?execution=UPDATE_PASSWORD&client_id=dashboard&…`. The page's form is `#kc-passwd-update-form`, with the fields `#password-new` and `#password-confirm`. Its heading is Keycloak's English "Update password" on the Kurdish screen too, until ticket 04.
- **Brute-force detection.** The guide's modes are "Lockout permanently", "Lockout temporarily" and "Lockout permanently after temporary lockout". In the realm file they are `bruteForceProtected`, `permanentLockout` and `maxTemporaryLockouts`, with `failureFactor` (Max Login Failures), `bruteForceStrategy` (`MULTIPLE` or `LINEAR`), `waitIncrementSeconds`, `maxFailureWaitSeconds` (Max Wait), `maxDeltaTimeSeconds` (Failure Reset Time), `quickLoginCheckMilliSeconds` and `minimumQuickLoginWaitSeconds`.
  - `MULTIPLE`, the default, grows the wait only at each multiple of Max Login Failures. `LINEAR` grows it with each failure from Max Login Failures on: the wait is Wait Increment × (1 + failures − Max Login Failures), and never more than Max Wait.
  - A failure made while a Login is locked is not counted. A right password resets the count. The count also resets when Failure Reset Time has passed since the last failure, which the guide says must be longer than Max Wait.
  - Two failures less than Quick Login Check Milliseconds apart lock the Login for Minimum Quick Login Wait, before Max Login Failures is reached.
  - Brute-force detection counts failures at the token address too. A locked Login is answered "Invalid user credentials" there.
- **What a locked Login sees.** The guide says Keycloak shows the same message as for a wrong password, so that nobody learns the Login is locked. Tried: the login screen answers a locked Login, with its right password, with the message `accountTemporarilyDisabledMessage`, whose English and Arabic text are the same as `invalidUserMessage`'s. The theme's Kurdish messages translate `invalidUserMessage` only, so the Kurdish login screen shows a wrong password in Kurdish and a locked Login in English. Ticket 04 gives it its Kurdish text.
- **How the Compose file gives Keycloak's container a setting from `.env`.** Compose fills `${NAME}` in the Compose file from the shell's environment first, then from the `.env` file in the project's folder. `${NAME:?message}` stops Compose with the message when the setting is missing or empty, and `${NAME?message}` only when it is missing. A value written under a service's `environment` is that container's environment setting. `.env` itself never reaches a container: only what the Compose file names does. Keycloak reads `PCP_API_CLIENT_SECRET` from its environment when it imports the realm, as ticket 01 found.

**The numbers chosen.** Lockout temporarily, `LINEAR`, after 5 failures in a row, with a wait that grows by 1 minute with each further failure up to 15 minutes:

| Setting | Value | What it does |
|---|---|---|
| `failureFactor` | 5 | The 5th wrong password in a row locks the Login |
| `bruteForceStrategy` | `LINEAR` | Each further failure makes the wait longer |
| `waitIncrementSeconds` | 60 | 1 minute after the 5th failure, 2 after the 6th, 3 after the 7th |
| `maxFailureWaitSeconds` | 900 | 15 minutes at most, from the 19th failure on |
| `maxDeltaTimeSeconds` | 43200 | The count starts again 12 hours after the last failure, Keycloak's default |
| `quickLoginCheckMilliSeconds`, `minimumQuickLoginWaitSeconds` | 1000, 60 | Keycloak's defaults: two failures within a second lock the Login for 1 minute |
| `permanentLockout`, `maxTemporaryLockouts` | false, 0 | Never locked for good: the Admin has no screen to unlock a Login |

Tried in the throwaway container with this realm file: 5 wrong passwords at 1.5-second intervals locked the Login for 60 seconds; a 6th, made after that lock had ended, locked it for 120 seconds, and its right password was refused 70 seconds later. Two wrong passwords made at once locked another Login for 60 seconds. Four wrong passwords and then the right one logged in and set the count back to 0.

For ticket 04: a test that types wrong passwords faster than once a second meets the quick-login lock before the 5th failure.

### 16 October 2026: completed

**For the owner to decide.**

- **The development Vendor's Login is back after the reset.** Ticket 04 asks to confirm "that ticket 03's reset removed its Login". The reset did remove it, but `pnpm services:up`, run straight after as this ticket asks, made it again, since only ticket 04 retires it. So the owner's Keycloak holds the development Vendor's Login when ticket 04 starts. **My recommendation:** ticket 04 deletes that one Login in Keycloak's own console, or by a line in `pnpm services:up` that removes it, rather than a second reset. A Login with the `vendor` role and no Vendor behind it does no harm in the meantime, and the tests still use it until ticket 04.
- **Renaming a Login, which ticket 10 needs, will need the running realm changed again.** Ticket 01 found that Keycloak refuses to rename a Login while the realm's `editUsernameAllowed` is off, and it is off in the realm this reset imported. It was not added here: the realm's user profile gives the Login itself, not only the administrator, the right to edit its name, so turning it on may also let a Vendor rename its own Login in Keycloak's account pages, away from its login phone number. That was not tried. Ticket 10 has to decide both together, and then reach the owner's services by a second reset or by `pnpm services:up` changing the running realm.
- **The API's own log names a Login it could not make.** Ticket 01 chose to log the name, a login phone number, when Keycloak does not answer a create. In the red run below, that log line, printed by `pnpm platform:check` with the API's output, held the made-up Vendor's number. The test itself prints neither the number nor the password. It happens only when a create fails, and the number is made up.

**Decisions this ticket left open.**

- **The setting.** `.env` holds `PCP_API_CLIENT_SECRET`, the name the realm file already uses. The Compose file gives it to Keycloak under the same name, with `${PCP_API_CLIENT_SECRET:?…}`, so Compose refuses to start without it. The API reads it as `KEYCLOAK_CLIENT_SECRET`, through `apps/api/.serve.env`, `.migrate.env` and `.catalog-import.env`, the three targets ticket 01 found need it. Nothing else holds a copy.
- **Its value.** `pnpm services:up` gives a setting whose name ends in `_SECRET` a random value, 24 random bytes in base64url, as it gives each password.
- **`pnpm services:check`** gains three lines. "The API's client, pcp-api, logs in to Keycloak with the secret in .env and finds the realm's Logins" logs in with the client-credentials flow, as the API does, and finds the development Admin's Login by its exact name through the administration interface. No existing line lists the realm's clients, so "where it checks the realm's clients" was read as the two checks of what a client may do, which until now covered the dashboard's client only. The API's client gets both: "The password flow is refused to the API's client" and "A login request through the API's client is refused". They run only once the first line passes, because Keycloak answers a wrong secret with the same `unauthorized_client` as a refused flow. The login request is refused with 400 "Invalid parameter: redirect_uri": the client has no address to return to, so no login through a browser can start.
- **`pnpm platform:check`** stops before any test when `.env` lacks the secret: ".env does not hold PCP_API_CLIENT_SECRET, the secret of the API's client. Start the services with "pnpm services:up"."
- **`createAMadeUpVendor`**, in `apps/e2e/src/vendors.ts`, creates a Vendor as the development Admin with `POST /v1/vendors`. Its name is "Made-up test Vendor" and the time in milliseconds with three random digits, as a made-up Part's. Its login phone number, also its phone number, is 075 and eight digits from Node's `randomInt`, typed in local form. Its city is Erbil and its address "Made-up Street, Erbil". It answers the Vendor's identifier, its name, its login phone number in the stored form, as the API answers it, and its temporary password.
- **The new line** is the test in `apps/e2e/src/vendor-first-login.spec.ts`, which ticket 04 can grow. The Vendor logs in in a browser context of its own. `submitTheLoginScreen` sets the name and the password in the page, never with `fill`. `expectNewPasswordScreen` tells the screen apart by its form, `#kc-passwd-update-form`, and its address, `…/login-actions/required-action` with `execution=UPDATE_PASSWORD`. Both sit beside `expectLoginScreen`.

**How it was built.** Each piece was seen to fail before it was written, for its own reason:

- `pnpm db:migrate` stopped at the API's start, naming `KEYCLOAK_CLIENT_SECRET`, before the env files gave it.
- `docker compose config --quiet` passed before the Compose line. With the line, and `.env` still without the secret, it stopped with "required variable PCP_API_CLIENT_SECRET is missing a value: set it in .env, as .env.example describes".
- `pnpm services:up` stopped with ".env.example lists PCP_API_CLIENT_SECRET, and this script has no value for it." before the start script gave secrets a value. Docker Compose was not reached.
- `pnpm platform:check`, with `.env` still without the secret, said "Keycloak cannot be reached" before its new line, and named the secret and `pnpm services:up` after it.
- A first start, with no `.env`, was tried in a scratch folder holding `.env.example` and the start script cut off after it writes `.env`. It wrote all ten settings, the secret among them as 32 random characters unlike every password, with the mode 600.
- `pnpm services:check` and `pnpm platform:check` were run against the owner's services before the reset, once `pnpm services:up` had added the secret. Their realm was imported before ticket 01, so it had no `pcp-api` client. The new line of `pnpm services:check` failed with "Keycloak answered 401, invalid_client: Invalid client or Invalid client credentials", and its other 37 lines passed. In `pnpm platform:check` the new test failed when the create was answered 500, and the API's log said why: `NetworkError: invalid_client`. Its other 79 tests passed.

**The reset**, run once, with `COMPOSE_PROJECT_NAME=pc-part-pickers` and the worktree's `.env` a link to the owner's:

| Step | Outcome |
|---|---|
| `pnpm services:up`, before the reset | Exit 0. "Added to .env: PCP_API_CLIENT_SECRET." The worktree's `.env` was still the link, and the owner's file kept its first 732 bytes unchanged, gained the setting's two lines and kept its mode, 600. It applied migrations 0007 and 0008 to the old database. |
| `pnpm services:reset` | Exit 0. Both containers, the network and the volume `pc-part-pickers_postgres-data` were removed. |
| `pnpm services:up` | Exit 0. One volume, `pc-part-pickers_postgres-data`, was made again. Keycloak imported the `pcp` realm. The development Admin's and the development Vendor's Logins were made, and 9 migrations applied. |
| `pnpm catalog:import` | Exit 0. OpenDB at commit `ef7e601`: 26,216 Parts imported, 0 already there, 24 records and 11,173 values left out. |
| `pnpm services:check` | Exit 0, all 40 lines passing. |

Read back from the running realm afterwards: the password policy and the brute-force settings are the realm file's, and the API's client's secret is the value in `.env`, not the text of the placeholder.

**Fault checks.**

| Fault | Failed |
|---|---|
| The client's secret changed in `.env`, by a script that changed its value, ran `pnpm services:check` and wrote the file back byte for byte | "The API's client, pcp-api, logs in to Keycloak with the secret in .env and finds the realm's Logins: Keycloak answered 401, unauthorized_client: Invalid client or Invalid client credentials", and nothing else. Its two following lines did not run, and the other 37 passed. Afterwards `.env` was the same, byte for byte, and `pnpm services:check` passed its 40 lines. |
| The required password update left off a new Login: the API's Keycloak Store gave the password with `temporary: false`, planted by a script that refused a dirty tree, made the one edit, ran `pnpm platform:check` with no app running, so that Playwright built the API from the planted source, and undid the edit by its inverse | "a made-up Vendor logs in at Keycloak's login screen … and Keycloak shows the screen that asks for a new password", and nothing else: `#kc-passwd-update-form` was not found, because the Vendor had logged straight in to the Vendor portal's placeholder. The other 79 tests passed. `git status` was clean afterwards. |

Neither fault needed a second reset.

**Results.**

- `pnpm check --skip-nx-cache` passes with `DOCKER_HOST` pointed at a socket that does not exist.
- `pnpm integration:check` passes 168 tests, as before: the realm file it imports now has the password policy and brute-force detection.
- `pnpm services:check` passes 40 lines, 3 of them new.
- `pnpm platform:check` passes 80 tests, 1 of them new.
- Each of the six commits before this record was gated on `pnpm check`'s exit status in the working tree, holding only that commit's files, and the two that change what the API's tests read, the realm and the env files, on `pnpm integration:check` too.
- After this record the services are stopped with `pnpm services:down`, so that no container keeps a folder of the worktree mounted. Their data stays in the volume.
