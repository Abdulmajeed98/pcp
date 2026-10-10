# 05: The development Vendor login exists after the services start

**Spec:** [the languages spec](../spec.md)

**What to build:** After `pnpm services:up`, a development Vendor login exists in the `pcp` realm beside the development Admin, with a generated password in `.env`. The owner and the later tickets can then open the dashboard as a Vendor, which nobody can do today. `pnpm services:check` gains the lines that show it, and the end-to-end tests gain a helper that logs in with it.

It is made the way ticket 01 of [the connection proof](../../connection-proof/spec.md) made the development Admin, and that ticket's Comments hold what Keycloak's documentation says about the calls involved.

The **development Vendor login** is a Login with the Vendor role and no Vendor behind it. `accounts` decides what becomes of it. It exists in development only.

The realm file does not change, so the services are not reset.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `.env.example` lists two new settings, with no values: the development Vendor's name and its password.
- [ ] `pnpm services:up` adds the two settings to an `.env` that lacks them and changes no value that is there. The password is generated like the others, and the name is `development-vendor`.
- [ ] After both services are healthy, `pnpm services:up` creates the login in the `pcp` realm when the realm has none of that name. A login that exists is left as it is, its password included.
- [ ] The login holds the realm role `vendor` and no other platform role. Its password is not temporary, and no action waits for it at first login.
- [ ] The login has a first name, a last name and an email address, so that Keycloak shows it no screen beyond the login screen.
- [ ] The realm file is unchanged and still holds no logins.
- [ ] `pnpm services:check` gains these lines: the development Vendor exists and is switched on; it holds the `vendor` role; it does not hold the `admin` role.
- [ ] `pnpm platform:check` says so, names `pnpm services:up` and exits non-zero when `.env` lacks the development Vendor's settings.
- [ ] The end-to-end tests gain a helper that logs in to the dashboard as the development Vendor, as the existing one does for the development Admin. The password is set in the page and never typed.
- [ ] `pnpm platform:check` gains one line: the development Vendor logs in, and the dashboard shows the name and the role `vendor` that the API says the caller has. It passes on every line.
- [ ] No command prints the development Vendor's password.
- [ ] Shown once and then reverted: with the login's creation switched off, the check fails on the login's line; with the role not given, it fails on the role's line; with the `admin` role given as well, it fails on that line.
- [ ] Checked by hand: on the `.env` that exists, `pnpm services:up` adds the two settings and changes no value that was there. A second `pnpm services:up` leaves the login as it was, and the password in `.env` still logs in. After `pnpm services:reset` and a new start, both development logins exist again.
- [ ] Checked by hand: `pnpm services:down` and `pnpm services:reset` still work when `.env` lacks the two new settings.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] No password is committed, and nothing in the three apps or the five libraries changes.
- [ ] The results of the fault checks and the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
