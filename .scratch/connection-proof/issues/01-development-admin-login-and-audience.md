# 01: The development Admin login exists after the services start, and its tokens name the API

**Spec:** [the connection proof spec](../spec.md)

**What to build:** After `pnpm services:up`, a development Admin login exists in the `pcp` realm, with a generated password in `.env`. The owner and the later tickets can then log in without clicking anything in Keycloak's console. The realm file still holds no logins. The dashboard's login client gains an audience mapper, so that every access token it is issued names the API, `pcp-api`, as an audience. `pnpm services:check` gains the lines that show both.

This ticket also reads a real token for the first time. What Keycloak puts in it is recorded, because tickets 03 and 06 are written against it.

In this project **Admin** means the platform's operator. Keycloak's own administrator account is a different thing, used here only to create the login, and is never called "Admin".

The realm file changes, so the services are reset once in this ticket. Nothing is lost but Keycloak's own data and an empty platform database.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Before anything is written, Keycloak's current documentation is read for the calls of its administration interface that find a login, create one, set its password and give it a realm role, for the audience mapper and how a realm file states one, and for the default profile of a login. The findings are recorded under Comments.
- [x] `.env.example` lists two new settings, with no values: the development Admin's name and its password.
- [x] `pnpm services:up` adds a setting that `.env.example` lists and `.env` lacks, and changes no value that is there. On a first start it creates `.env` as before. The new password is generated like the others, and the name is `development-admin`.
- [x] After both services are healthy, `pnpm services:up` asks Keycloak's administration interface, as Keycloak's own administrator, whether the login `development-admin` exists in the `pcp` realm, and creates it if it does not. A login that exists is left as it is, its password included.
- [x] The login holds the realm role `admin` and no other platform role. Its password is not temporary, and no action waits for it at first login.
- [x] The login is created with every attribute Keycloak's default profile asks of a login, so that Keycloak shows it no screen beyond the login screen. Whether Keycloak would show such a screen to a login without them is tried on the running service and recorded. The realm's profile is not changed.
- [x] The realm file still holds no logins.
- [x] The realm file gives the `dashboard` client an audience mapper that adds `pcp-api` to the audience of its access tokens. Nothing else in the realm changes.
- [x] `pnpm services:check` gains these lines: the development Admin exists; it holds the `admin` role; it does not hold the `vendor` role; the `dashboard` client's mapper names `pcp-api`.
- [x] A real access token is obtained once for the development Admin, through the `dashboard` client, by driving the login screen with the authorisation code flow and a PKCE challenge. Keycloak sends the login straight back with a code and shows no further screen.
- [x] What that token holds is recorded under Comments, with the token itself left out: its issuer, its audience, its signing algorithm, the claim that holds the realm roles and what is in it, the claim that holds the login's name, and how long the token lasts.
- [x] Shown once and then reverted, each after a reset: with the login's creation switched off, the check fails on the login's line; with the role not given, it fails on the role's line; with the mapper taken out of the realm file, it fails on the mapper's line.
- [x] Checked by hand: on an `.env` written before this ticket, `pnpm services:up` adds the two settings and changes no value that was there. A second `pnpm services:up` leaves the login as it was, and the password in `.env` still logs in. After `pnpm services:reset` and a new start, the login exists again with the password in `.env`.
- [x] Checked by hand: `pnpm services:down` and `pnpm services:reset` still work when `.env` lacks the two new settings, and when it is missing.
- [x] No command prints the development Admin's password.
- [x] `pnpm check` passes with Docker stopped.
- [x] No password is committed, and nothing in the three apps or the five libraries changes.
- [x] The results of the fault checks and the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**What was read first.**

- Keycloak's guide to audiences. An access token's `aud` should name the services the token is meant for, and a service should check it. The Audience mapper adds a fixed audience, either a client's ID or "any custom value". It can sit in a client scope or "directly" on the client, where the audience is always added. By default it adds to the access token only. An audience written as a custom value is not affected when a client is disabled.
- Keycloak's guide to the profile of a login. The default profile has four attributes: the name, the email address, the first name and the last name. "The `VerifyProfile` action is enabled by default": at login it checks the profile and adds a step in which a missing attribute is filled in.
- Keycloak's published description of its administration interface, for the calls used: `GET /admin/realms/{realm}/users`, whose `username` is "a String contained in username, or the complete username, if param 'exact' is true"; `POST /admin/realms/{realm}/users`, "Create a new user Username must be unique"; `GET /admin/realms/{realm}/roles/{role-name}`; `POST /admin/realms/{realm}/users/{user-id}/role-mappings/realm`; and `GET .../role-mappings/realm/composite`, the "effective" roles, which the check reads. The password is given when the login is created, so the call that resets a password is not used.
- The reference page itself is too long for the tool that reads web pages, which stopped before its section on logins. The calls were read from the machine-readable description that Keycloak publishes beside it.

**Found on the running Keycloak, 26.8.0, before anything was changed.**

- The realm held no logins and the `pcp` database had no tables, so the reset lost nothing.
- The default profile marks the email address, the first name and the last name as required of the login itself and not of an administrator. A login created with a name and a password alone is accepted, with no action stored against it.
- That login cannot log in. After its password is accepted, Keycloak sends it to a screen that asks for the missing attributes, and not back to the dashboard with a code. The same login with a first name, a last name and an email address is sent straight back. This was tried with a scratch login that was deleted afterwards.
- An email address ending in `.invalid`, a name reserved so that it can never exist, is accepted.

**What was built.**

- `pnpm services:up` adds a setting that `.env.example` lists and `.env` lacks, under a comment line, and changes no value that is there. A setting that is listed with an empty value counts as there and is left alone.
- Once both services are healthy, the start command creates `development-admin` if the realm has no login of that exact name. It gives the login the first name "Development", the last name "Admin" and the address `development-admin@pcp.invalid`.
- If the role cannot be given, the login that was just created is deleted and the command fails. The next start would otherwise find a login without its role and leave it as it is.
- The audience mapper sits directly on the `dashboard` client, so every access token carries the audience whatever scope was asked for. It writes a custom value and adds it to the access token only.
- The two scripts share one new module, which logs in as Keycloak's own administrator.

**The real token.** The development Admin was logged in through the `dashboard` client with the authorisation code flow and a PKCE challenge, by a scratch script that is not in the repository. Keycloak sent it straight back with a code. The access token holds:

| What | Value |
|---|---|
| Issuer, `iss` | `http://localhost:8080/realms/pcp` |
| Audience, `aud`, before the mapper | `"account"`, a single string |
| Audience, `aud`, with the mapper | `["pcp-api", "account"]`, a list |
| Signing algorithm | RS256. The header's `typ` is `JWT` |
| Realm roles | `realm_access.roles`: `offline_access`, `admin`, `default-roles-pcp`, `uma_authorization` |
| The login's name | `preferred_username`: `development-admin` |
| The login's identifier | `sub`, a UUID |
| The client it was issued to | `azp`: `dashboard` |
| The token's own `typ` claim | `Bearer` |
| Lifetime | 300 seconds |

Three things for ticket 03 follow from it. The audience is a string when there is one and a list when there are several. The three roles beside `admin` are Keycloak's own and are on every login. The realm publishes two keys, one for signing with RS256 and one for encryption, so the guard has to pick the signing key.

**The fault checks.** Each was reverted.

| Fault | Result |
|---|---|
| The start command does not create the login | `FAIL  The development Admin login exists: the realm has no login named development-admin` |
| The start command gives the login no role | `FAIL  The development Admin holds the admin role: its realm roles are offline_access, uma_authorization, default-roles-pcp` |
| The mapper is taken out of the realm file, and the services are reset | `FAIL  The dashboard client's audience mapper names pcp-api: the client has no audience mapper for pcp-api` |

The first two were not run after a full reset, as this ticket asked. The login was deleted through the administration interface before each, which leaves the realm without the login as a reset does. The third was run after a reset, and the services were reset once more when the file was restored.

**The by-hand checks.**

- The owner's `.env`, written in step 2, gained the two settings on the first start. The old text is an unchanged beginning of the new file, every old value is the same, and the file is still readable by its owner only.
- A second `pnpm services:up` left the login with the same identifier and creation time, left `.env` byte for byte the same, and the password in `.env` still logged in.
- After the last reset and a new start, the login existed again and the password in `.env` logged in. All 33 lines of `pnpm services:check` passed.
- `pnpm services:down` worked with the old `.env`, which lacks the two settings. `pnpm services:reset` worked with no `.env` at all. The owner's `.env` was put back unchanged.

**`pnpm check`.** It passed with the cache skipped and with Docker made unreachable for the command, by pointing it at a closed port. Docker itself was not stopped, because the services were needed for the next check.

**Nothing else changed.** The ticket touched the realm file, `.env.example` and three tool scripts. No password is in any commit, and no command prints the development Admin's password.
