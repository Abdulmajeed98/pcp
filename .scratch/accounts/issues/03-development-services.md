# 03: The API manages Logins in the development services

**Spec:** [the accounts spec](../spec.md)

**What to build:** The owner's development services gain what tickets 01 and 02 need, and the API, run with `nx serve`, makes Vendors' Logins in the owner's own Keycloak. The realm also gains its password policy and its brute-force detection here, so that every change to the realm file reaches the owner's services in one reset.

`pnpm services:up` writes the API's client secret into `.env`, and the Compose file gives it to Keycloak. `pnpm services:check` says whether the API's client can manage Logins, and `pnpm platform:check` asks for the secret. The end-to-end tests gain a made-up Vendor, created over HTTP as the development Admin. That Vendor logs in at Keycloak's login screen and is shown the screen that asks for a new password, which proves the whole path on the running platform.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Before anything is written, these are read for the installed releases, and the findings are recorded under Comments:
  - Keycloak 26.8's realm settings for a password policy and for brute-force detection, and what a locked Login sees;
  - how the Compose file gives Keycloak's container a setting from `.env`.
- [ ] The realm file gains a password policy, at least 8 characters and not the Login's name, and turns on brute-force detection. After a few wrong passwords in a row a Login is locked for a time that grows with each further failure, up to 15 minutes. The numbers chosen are recorded under Comments.
- [ ] `.env.example` lists the API's client secret without its value. `pnpm services:up` writes a random value for it at the first start, and adds it to an existing `.env` that lacks it, as it does for each password. The Compose file gives it to Keycloak.
- [ ] The API's `serve` target gets it from `.env` through its committed env file, as it gets the database password, and so does each other target ticket 01 found to need it. No copy of it is written anywhere else.
- [ ] `pnpm services:check` gains a line saying that the API's client logs in to Keycloak and finds the realm's Logins. Where it checks the realm's clients, it counts the API's client.
- [ ] `pnpm platform:check` says so plainly, and names `pnpm services:up`, when `.env` lacks the secret.
- [ ] Before the reset, the owner is told that it deletes the platform's database, which holds the imported catalog and test data, and Keycloak's data, and the owner agrees. Then `pnpm services:reset`, `pnpm services:up` and `pnpm catalog:import` are run, and `pnpm services:check` passes. Each step's outcome is recorded under Comments.
- [ ] The end-to-end tests gain `createAMadeUpVendor`, which creates a Vendor over HTTP as the development Admin. It is named "Made-up test Vendor" with a number unique to the run, has a login phone number unique to the run and every required detail, and gives the test its login phone number and temporary password, which are never printed. Nothing is ever sent to that number.
- [ ] `pnpm platform:check` gains this line, and passes on every line: a made-up Vendor logs in at Keycloak's login screen with its login phone number in the stored form and its temporary password, and Keycloak shows the screen that asks for a new password, told apart by its address and its form.
- [ ] Shown once and then reverted, each failing on its own line: the client's secret changed in `.env`, which `pnpm services:check` reports; the required password update left off a new Login, which the new line of `pnpm platform:check` reports. Neither needs a second reset.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.

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
