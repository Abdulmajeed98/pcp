# 01: The development Admin login exists after the services start, and its tokens name the API

**Spec:** [the connection proof spec](../spec.md)

**What to build:** After `pnpm services:up`, a development Admin login exists in the `pcp` realm, with a generated password in `.env`. The owner and the later tickets can then log in without clicking anything in Keycloak's console. The realm file still holds no logins. The dashboard's login client gains an audience mapper, so that every access token it is issued names the API, `pcp-api`, as an audience. `pnpm services:check` gains the lines that show both.

This ticket also reads a real token for the first time. What Keycloak puts in it is recorded, because tickets 03 and 06 are written against it.

In this project **Admin** means the platform's operator. Keycloak's own administrator account is a different thing, used here only to create the login, and is never called "Admin".

The realm file changes, so the services are reset once in this ticket. Nothing is lost but Keycloak's own data and an empty platform database.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Before anything is written, Keycloak's current documentation is read for the calls of its administration interface that find a login, create one, set its password and give it a realm role, for the audience mapper and how a realm file states one, and for the default profile of a login. The findings are recorded under Comments.
- [ ] `.env.example` lists two new settings, with no values: the development Admin's name and its password.
- [ ] `pnpm services:up` adds a setting that `.env.example` lists and `.env` lacks, and changes no value that is there. On a first start it creates `.env` as before. The new password is generated like the others, and the name is `development-admin`.
- [ ] After both services are healthy, `pnpm services:up` asks Keycloak's administration interface, as Keycloak's own administrator, whether the login `development-admin` exists in the `pcp` realm, and creates it if it does not. A login that exists is left as it is, its password included.
- [ ] The login holds the realm role `admin` and no other platform role. Its password is not temporary, and no action waits for it at first login.
- [ ] The login is created with every attribute Keycloak's default profile asks of a login, so that Keycloak shows it no screen beyond the login screen. Whether Keycloak would show such a screen to a login without them is tried on the running service and recorded. The realm's profile is not changed.
- [ ] The realm file still holds no logins.
- [ ] The realm file gives the `dashboard` client an audience mapper that adds `pcp-api` to the audience of its access tokens. Nothing else in the realm changes.
- [ ] `pnpm services:check` gains these lines: the development Admin exists; it holds the `admin` role; it does not hold the `vendor` role; the `dashboard` client's mapper names `pcp-api`.
- [ ] A real access token is obtained once for the development Admin, through the `dashboard` client, by driving the login screen with the authorisation code flow and a PKCE challenge. Keycloak sends the login straight back with a code and shows no further screen.
- [ ] What that token holds is recorded under Comments, with the token itself left out: its issuer, its audience, its signing algorithm, the claim that holds the realm roles and what is in it, the claim that holds the login's name, and how long the token lasts.
- [ ] Shown once and then reverted, each after a reset: with the login's creation switched off, the check fails on the login's line; with the role not given, it fails on the role's line; with the mapper taken out of the realm file, it fails on the mapper's line.
- [ ] Checked by hand: on an `.env` written before this ticket, `pnpm services:up` adds the two settings and changes no value that was there. A second `pnpm services:up` leaves the login as it was, and the password in `.env` still logs in. After `pnpm services:reset` and a new start, the login exists again with the password in `.env`.
- [ ] Checked by hand: `pnpm services:down` and `pnpm services:reset` still work when `.env` lacks the two new settings, and when it is missing.
- [ ] No command prints the development Admin's password.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] No password is committed, and nothing in the three apps or the five libraries changes.
- [ ] The results of the fault checks and the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
