# 05: The development Vendor login exists after the services start

**Spec:** [the languages spec](../spec.md)

**What to build:** After `pnpm services:up`, a development Vendor login exists in the `pcp` realm beside the development Admin, with a generated password in `.env`. The owner and the later tickets can then open the dashboard as a Vendor, which nobody can do today. `pnpm services:check` gains the lines that show it, and the end-to-end tests gain a helper that logs in with it.

It is made the way ticket 01 of [the connection proof](../../connection-proof/spec.md) made the development Admin, and that ticket's Comments hold what Keycloak's documentation says about the calls involved.

The **development Vendor login** is a Login with the Vendor role and no Vendor behind it. `accounts` decides what becomes of it. It exists in development only.

The realm file does not change, so the services are not reset.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `.env.example` lists two new settings, with no values: the development Vendor's name and its password.
- [x] `pnpm services:up` adds the two settings to an `.env` that lacks them and changes no value that is there. The password is generated like the others, and the name is `development-vendor`.
- [x] After both services are healthy, `pnpm services:up` creates the login in the `pcp` realm when the realm has none of that name. A login that exists is left as it is, its password included.
- [x] The login holds the realm role `vendor` and no other platform role. Its password is not temporary, and no action waits for it at first login.
- [x] The login has a first name, a last name and an email address, so that Keycloak shows it no screen beyond the login screen.
- [x] The realm file is unchanged and still holds no logins.
- [x] `pnpm services:check` gains these lines: the development Vendor exists and is switched on; it holds the `vendor` role; it does not hold the `admin` role.
- [x] `pnpm platform:check` says so, names `pnpm services:up` and exits non-zero when `.env` lacks the development Vendor's settings.
- [x] The end-to-end tests gain a helper that logs in to the dashboard as the development Vendor, as the existing one does for the development Admin. The password is set in the page and never typed.
- [x] `pnpm platform:check` gains one line: the development Vendor logs in, and the dashboard shows the name and the role `vendor` that the API says the caller has. It passes on every line.
- [x] No command prints the development Vendor's password.
- [x] Shown once and then reverted: with the login's creation switched off, the check fails on the login's line; with the role not given, it fails on the role's line; with the `admin` role given as well, it fails on that line.
- [x] Checked by hand: on the `.env` that exists, `pnpm services:up` adds the two settings and changes no value that was there. A second `pnpm services:up` leaves the login as it was, and the password in `.env` still logs in. After `pnpm services:reset` and a new start, both development logins exist again.
- [x] Checked by hand: `pnpm services:down` and `pnpm services:reset` still work when `.env` lacks the two new settings.
- [x] `pnpm check` passes with Docker stopped.
- [x] No password is committed, and nothing in the three apps or the five libraries changes.
- [x] The results of the fault checks and the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 16 October 2026: completed

**What was built.**

- `.env.example` lists `DEVELOPMENT_VENDOR_NAME` and `DEVELOPMENT_VENDOR_PASSWORD`, without values. `pnpm services:up` adds them to an `.env` that lacks them, as it added the development Admin's: the name is `development-vendor`, and the password is generated like the others.
- Once both services are healthy, the start command creates the login when the realm has no login of that exact name, the same way it creates the development Admin. It holds the realm role `vendor` and no other platform role, its password is not temporary, and it has the first name "Development", the last name "Vendor" and the address `development-vendor@pcp.invalid`. Read back from Keycloak after a start: `requiredActions` is empty, and the one credential is a password that is not temporary.
- The two development logins are one list, in `tools/development-logins.mjs`, which the start command, `pnpm services:check` and `pnpm platform:check` all read. The code review found them written out three times.
- `pnpm services:check` has three lines for each development login: it exists and is switched on; it holds its role; it does not hold the other one. The Admin's first line was "The development Admin login exists", and now ends "and is switched on", as it always checked. It prints 37 lines.
- `pnpm platform:check` stops before any test, names `pnpm services:up` and exits 1 when `.env` lacks either login's settings: ".env does not hold the development Vendor's name and password."
- The end-to-end helper that logs in at Keycloak's login screen takes either login, and is the development Admin's when a test names none: `logInToTheDashboard(page, developmentVendor)`. Its file is now `development-logins.ts`. The ticket asks for a helper that logs in as the development Vendor "as the existing one does for the development Admin". This is that helper, given the Vendor, rather than a second function that would only pass the Vendor on.
- `pnpm platform:check` gains one line: the development Vendor logs in, and the dashboard shows the name `development-vendor` and the role `vendor` that the API says the caller has. With ticket 06's lines it has 39, and all pass.
- The MVP spec's three statements that the start command creates "one login, the development Admin" now name both logins. Recording the rest of `languages` is ticket 10's.

**The fault checks.** Each was planted alone on a clean tree, run through `pnpm services:up` and `pnpm services:check`, and reverted. They were run before the code review and again after it, with the same result.

| Fault | Result |
|---|---|
| The start command does not create the Vendor's login | `FAIL  The development Vendor login exists and is switched on: the realm has no login named development-vendor` |
| The login is given no role | `FAIL  The development Vendor holds the vendor role: its realm roles are default-roles-pcp, uma_authorization, offline_access` |
| The login is given the `admin` role as well | `FAIL  The development Vendor does not hold the admin role: it holds the role` |

Before each, the login was deleted through Keycloak's administration interface, which leaves the realm as a reset would, without resetting the owner's data. In each run the other two lines passed.

**The by-hand checks.**

- **The owner's `.env`.** The first start added the two settings under the comment line `pnpm services:up` writes. The 563 bytes that were there are an unchanged beginning of the new file, and the file is still readable by its owner only.
- **A second start** left the login's identifier and creation time as they were, and `.env` byte for byte the same. The password in `.env` logs in: the end-to-end line above logs in with it.
- **After a reset.** This was done in a fresh clone in the scratchpad, not on the owner's services, so that the reset deleted only the clone's own Docker volume. The owner's services were stopped first, and their 26,216 Parts were still there afterwards. In the clone, the first start created `.env` and both logins, and all 37 lines of `pnpm services:check` passed. After `pnpm services:reset` and a new start, both logins existed again and all 37 passed.
- **Without the two settings.** `pnpm services:down` stopped the owner's services with the `.env` from before this ticket, which lacks them. In the clone, `pnpm services:down` and `pnpm services:reset` worked with an `.env` from which they had been removed, and the next start added them back.
- **No command prints the password.** The start command says "Its password is in .env." The Vendor's password is in none of the outputs of the start command or of `pnpm services:check`, searched for it.

**Seen once, not explained.** On the very first start that added the two settings, Docker recreated the PostgreSQL container while Keycloak kept running, and that start did not create the login. The next start did. Its output was cut short by my own command, and Docker kept no record of the event. Run again from the original `.env`, with the login deleted, the first start created the login with no recreation. Nothing in this ticket changes what Docker Compose is given for PostgreSQL. If an owner's first start after this ticket fails to create the login, a second start creates it.

**`pnpm check`.** Every commit of this ticket and of ticket 06 passed `pnpm check --skip-nx-cache`, each checked out on its own in a fresh clone, after `pnpm install --frozen-lockfile --offline`, with Docker made unreachable for the command by pointing `DOCKER_HOST` at a socket that does not exist. Docker itself was not stopped, because the services were needed for the other checks.

**A commit that broke it, and was rebuilt.** The code review found that the first commit, as made, left `pnpm check` failing. `git mv` had staged the helper's rename, `git commit` took the whole index, and the imports that follow the rename stayed for the next commit. The check had passed on the working tree, which held both. The commits were not yet pushed, so the six were made again with the rename in the end-to-end commit, where it belongs. The last commit's tree is the same as before, and each of the six then passed on its own, as above.

**Nothing else changed.** The realm file is unchanged and holds no logins. No password is in any commit. The three apps and the libraries, six of them since `catalog` added `@pcp/opendb`, are unchanged by this ticket. The end-to-end project gains the helper and the line.

