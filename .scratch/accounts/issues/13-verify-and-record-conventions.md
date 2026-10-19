# 13: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the accounts spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it. That is a fresh clone in a new directory, with no `.env` and no Docker volumes, followed by the install, the checks, the services and `pnpm platform:check`, with none of the three apps started by hand. Results left over from earlier runs can hide a fault, so this run is the one that counts.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `offers` and every later module start from them. This ticket closes `accounts`.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 09, 10, 11, 12

**Status:** resolved

- [x] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand:
  - one install;
  - `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed;
  - `pnpm boundaries:check`;
  - `pnpm integration:check`;
  - `pnpm services:up`, which writes the API's client secret, and then `pnpm services:check`;
  - the browser's one-time install, and then `pnpm platform:check`.
- [x] Git reports a clean working tree after every command above. No password and no secret is committed.
- [ ] The owner is asked to check these once, in the owner's own browser. What they saw, or that it is still to be done, is recorded under Comments:
  - The hand-over's link opens WhatsApp's website with the message written, in each language, and the message reads well.
  - The Vendors screens, the details screen, its form and the band match DESIGN.md, and Impeccable's design hook raises nothing left unanswered.
  - Keycloak's screens a Vendor meets read correctly in Kurdish and in Arabic.
  - A Login with the `vendor` role and no Vendor, made in Keycloak's own console, sees the plain message in the Vendor portal. The Login is then deleted.
  - `pnpm check` still passes with Docker stopped and with no browser installed.
- [x] These checks on a phone are recorded under Comments as open, waiting for hosting, with their boxes left open, and are added to the MVP spec's list under "Checks on a phone wait for hosting":
  - [ ] The hand-over's link opens the WhatsApp app on the Admin's phone, with the message written.
  - [ ] The location button fills the coordinates from the phone's position, in a shop in Erbil.
  - [ ] A phone number typed on a Kurdish and on an Arabic keyboard logs in.
  - [ ] The Vendors screens, Keycloak's screens and the details screen used with a thumb, in Kurdish and in English.
- [x] The Technology section of the MVP spec gains the conventions this module set:
  - Vendors in the platform's database and Logins in Keycloak, changed only through the API in a safe order, and the known limit;
  - the rule for which Vendor a request acts for, and acting as a Vendor;
  - phone numbers: how they are read, stored, answered and shown;
  - temporary passwords and the hand-over;
  - the realm's changes: the API's client, the user profile, the password policy, brute-force detection, and the login screen's label, script and Kurdish text;
  - the Vendor portal's router, and how its pages are mounted under both routers;
  - the shared Keycloak of `pnpm integration:check`.
- [x] Its commands table and its account of the development services say what `pnpm services:up`, `pnpm services:check`, `pnpm integration:check` and `pnpm platform:check` now do. The development Vendor is gone from them, and the sentence that `accounts` decides its fate is replaced by what was decided. Its settings table gains the API's settings for Keycloak's administration interface.
- [x] It says to run `pnpm integration:check` after an upgrade of `@keycloak/keycloak-admin-client`, `libphonenumber-js` or Keycloak too, and `pnpm platform:check` after a change to the theme's script.
- [x] The Order of work records that `accounts` is finished, with a link to this spec.
- [x] Where PRODUCT.md describes Vendors' Logins or the Vendor portal, it is brought up to date.
- [x] The spec's status is set to resolved, and every ticket of this module is resolved.
- [x] The results are recorded under Comments.

## Comments

### 19 October 2026: the fresh clone

The owner's repository was cloned at `accounts/integration`, `20fc92b`, the tip with tickets 01 to 12 and the code review's fixes, into a new folder in the session's scratchpad, `t13-fresh-clone`. Compose therefore named a project of its own, `t13-fresh-clone`, and a volume of its own. Before the clone's services started, the owner's were stopped with `pnpm services:down` from the owner's checkout, which keeps their data; afterwards the clone's were stopped with `pnpm services:down` and the owner's started again with `pnpm services:up`. Every step ran from a script, in order, and wrote its own log; after each, `git status --porcelain` in the clone was read.

Before the first step: the clone held no `.env`, and Docker held no volume named for its project. The images of PostgreSQL, Keycloak and Testcontainers' helper were already on the machine, as they are on any machine that has run the services once; no volume and no container was.

| Step | Outcome | Time | Working tree |
|---|---|---|---|
| `pnpm install --frozen-lockfile` | Passed | 4 s, from pnpm's store on the machine | Clean |
| `pnpm check --skip-nx-cache`, with Docker stopped and no browser installed | Passed: every step, and lint, type-check, test and build, 25 tasks, for the 10 projects, none from Nx's cache | 16 s | Clean |
| `pnpm boundaries:check` | Passed all 114 lines | 9 s | Clean |
| `pnpm integration:check` | Passed 257 tests in 8 files, against its own PostgreSQL and Keycloak containers | 65 s | Clean |
| `pnpm services:up` | Passed: "Created .env with new local passwords and a new secret.", made the volume `t13-fresh-clone_postgres-data`, imported the realm, made the development Admin's Login and applied 9 migrations. `.env` then held `PCP_API_CLIENT_SECRET` with a value. | 16 s | Clean: Git ignores `.env` |
| `pnpm services:check` | Passed all 37 lines, the API's client's three among them | 2 s | Clean |
| `pnpm exec playwright install chromium` | Passed | 1 s | Clean |
| `pnpm platform:check` | Passed 132 tests. No app was listening on ports 3000 to 3002 before it, so it started all three and stopped them; none was listening after. | 203 s | Clean |
| `pnpm services:down` in the clone | Passed; no container left running | 1 s | Clean |

- **Docker stopped was simulated**, as earlier tickets did: `pnpm check` ran with `DOCKER_HOST` pointed at a socket that does not exist, while Docker itself ran for the steps that need it.
- **No browser installed was simulated too**: `PLAYWRIGHT_BROWSERS_PATH` pointed at an empty folder, which was still empty afterwards. The browser's install that followed found Chromium already in Playwright's cache on this machine, so it downloaded nothing; a machine without it downloads it then.
- **This run met the realm file and the theme as committed.** The clone's Keycloak imported a new realm from the realm file and mounted the clone's theme, where tickets 10 to 12 met the owner's running realm, changed by hand in ticket 10, and the theme mounted from the owner's checkout. Ticket 12's line of Keycloak's refusal of a deactivated Vendor ran against the merged theme here, but in English; the Kurdish text of that refusal is still to be read by hand (below).
- **No password and no secret is committed.** `.env` is ignored and no commit of any branch touches a file of that name. None of the 7 passwords and secrets in the owner's `.env`, nor of the 6 in the clone's, appears in any of the 353 commits of the repository's branches, searched with `git log -S` for each, nor in any log of this run. The script printed counts only.
- **The owner's services again.** They are running, and `pnpm services:check` in the owner's checkout passes all 37 lines, every migration applied among them. But `pnpm services:up` there exited 1 at its last step: once the containers were healthy, its `pnpm db:migrate` stopped because Nx refused the project graph, every project being "defined in multiple locations", in the owner's checkout and in this ticket's worktree under `.claude/worktrees/`, which the owner's `.gitignore` does not leave out. Nothing needed migrating. With no worktree nested in the checkout, `pnpm services:up` runs its migrations as before. The clone's stopped volume, `t13-fresh-clone_postgres-data`, is left in Docker; `pnpm services:reset` in the clone, or deleting the volume, removes it.

### 19 October 2026: the records

- **The MVP spec's Technology section** gains **The accounts module's conventions**: Vendors in the database and Logins in Keycloak, the port `LoginStore`, the order of each Command's two changes (the reset's, as the code review changed it, among them), finishing a half-done change by doing it again, and the known limit in both its forms; the rule for which Vendor a request acts for, with its three refusals and the Caller's Vendor as the one endpoint that does not name its Vendor; acting as a Vendor, at `/vendors/:vendorId/portal`, with its band and its language; the nine endpoints by their paths, with the verb names of the actions, `reset-password`, `deactivate` and `reactivate`, the edits' rules and every refusal's reason; phone numbers; a Vendor's other details; temporary passwords, the hand-over and the confirmations, "Deactivate again" among them; the realm's client, secret, user profile, password policy, brute-force detection and login theme; the Vendor portal's router and frames; the shared Keycloak of `pnpm integration:check`; and the two packages' versions.
- **Its commands, services and settings.** The commands table says what `pnpm services:up`, `pnpm services:check`, `pnpm integration:check` and `pnpm platform:check` now do. The development services' Keycloak holds one development Login and two platform clients, and the development Vendor's retirement replaces the sentence that `accounts` decides its fate. The settings table gains `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID` and `KEYCLOAK_CLIENT_SECRET`, and the API's secrets are two. `pnpm integration:check` is to be run after a change to the realm file and after an upgrade of `@keycloak/keycloak-admin-client`, `libphonenumber-js` or Keycloak, and `pnpm platform:check` after a change to the login theme's script or its messages. The end-to-end tests make made-up Vendors, and the toolchain notes name the admin client's ES modules.
- **The Order of work** records `accounts` finished on 19 October 2026, with links to this spec and to ADR-0009.
- **Checks on a phone** gain this ticket's four, under `accounts`, ticket 13.
- **ADR-0009** said that every Vendor portal endpoint names its Vendor in its address; ticket 07 left it to this ticket to record the exception. It now names the Caller's own Vendor as the one that does not.
- **PRODUCT.md** says how a Vendor logs in and is handed its temporary password, what the Vendor portal shows a Vendor and the Admin acting as it, and what the Admin console's Vendors section does.
- **The spec's status** is resolved, as is every ticket of the module.

### 19 October 2026: still to be done by the owner, in the owner's own browser

Not done in this run, which had no access to the owner's browser. Each is put to the owner after this report:

- [ ] The hand-over's link opens WhatsApp's website with the message written, in each language, and the message reads well, after a create (ticket 06) and after a reset (ticket 11).
- [ ] The Vendors screens match DESIGN.md: the list and a Vendor's page (ticket 05), the form for a new Vendor and the hand-over (ticket 06), the edit form at 360 pixels and wider, beside the list (ticket 10), the reset's confirmation and its hand-over (ticket 11), the buttons on a Vendor's page, the deactivation's confirmation with a refusal in it, and "Deactivate again" beside Reactivate (ticket 12). The details screen and its top bar (ticket 07), its form (ticket 08), the band (ticket 09) and the message for a deactivated Vendor (ticket 12) match it too. Impeccable's design hook raises nothing left unanswered.
- [ ] Keycloak's screens a Vendor meets read correctly in Kurdish and in Arabic: the login screen, the screen that asks for a new password and its refusals, a locked Login's message, and a deactivated Vendor's refusal at the login screen, whose Kurdish text ticket 12 added and no run has yet shown.
- [ ] A Login with the `vendor` role and no Vendor, made in Keycloak's own console, sees the plain message in the Vendor portal, and is then deleted.
- [ ] `pnpm check` still passes with Docker stopped and with no browser installed, in the owner's own checkout. Here it passed with both simulated, above.

### 19 October 2026: on a phone, once the platform is hosted

These wait for hosting, as the owner decided for the whole project on 16 October 2026, and are listed in the MVP spec under "Checks on a phone wait for hosting", as `accounts`, ticket 13. They overlap the lines tickets 04, 06, 07, 08, 09 and 12 put there.

- [ ] The hand-over's link opens the WhatsApp app on the Admin's phone, with the message written.
- [ ] The location button fills the coordinates from the phone's position, in a Vendor's place in Erbil, over HTTPS.
- [ ] A phone number typed on a Kurdish and on an Arabic keyboard logs in.
- [ ] The Vendors screens, Keycloak's screens and the details screen used with a thumb, in Kurdish and in English.

### 19 October 2026: decisions left open, for the owner, from tickets 10 to 12

Collected from those tickets' Comments, each to be read there under the heading named. Each was taken the way the ticket, the spec or DESIGN.md pointed, none blocks the module, and the ticket's recommendation is to keep each as built.

From [ticket 10](10-admin-edit-a-vendor.md), under "decisions left open, for the owner":

1. The Edit link's words and place: "Edit", with a pencil mark, in one row with "Open its portal" below the Vendor's name, which the reset and the deactivation joined.
2. The edit form on a screen of its own, at the Vendor's address with `/edit`, beside the list on a wide screen.
3. The screen's words: "Edit the Vendor", the back link "The Vendor", "Save the Vendor", and "The Vendor was not saved." above a refusal that names no field.
4. The login phone number's description on the edit, and no confirmation of a new number: the Vendor logs in with the password it had.
5. A Login's sessions are kept when it is renamed.
6. An edit that keeps the login phone number goes through while Keycloak cannot be reached.

From [ticket 11](11-reset-a-password.md), under "decisions left open, for the owner":

7. The reset answers 200 with `{ temporaryPassword }` alone. Its path, recorded there as `password-reset`, was renamed by the code review (item 12).
8. The order of the reset's two steps, recorded there as the password first. The code review reversed it (item 11).
9. A deactivated Vendor's password can be reset; its Login stays disabled until it is reactivated.
10. The wording: "Reset the password", "Reset the password of …?", "The password is reset, and the Vendor is logged out.", in Action Red.
11. The temporary password's sentence says "at its next login" after a create too.

From ticket 11, under "decisions left open, for the owner, from the code review":

12. The order of a reset's two steps, now the sessions first and then the password, so that "nothing is changed" holds, at the price of a window of a few milliseconds in which the old password can open a session.
13. The reset's path, `reset-password`, a verb, as the workplace backend's actions are.
14. The confirmation's refusal uses the shared words of `WhyNotAnswered`, "The API refused, with 503, IDENTITY_SERVICE_UNAVAILABLE.", in place of plain words that named the login service.

From [ticket 12](12-deactivate-and-reactivate.md), under "decisions left open, for the owner":

15. The deactivated message has the language switch, as the owner chose for a Login with no Vendor behind it.
16. The message's and the band's words, with Kurdish ناچالاک کراوە and Arabic معطَّل and تم تعطيل, for LANG-7's review.
17. Reactivating asks for no confirmation.
18. The dialog's confirm button is red, while Deactivate on the page is outlined.
19. The deactivation dialog's words, which say that Shoppers no longer see the Vendor or its Offers, true once `offers` and `browse` are built.
20. The order of a Vendor page's actions, to settle now that tickets 10 to 12 are merged: Edit, Open its portal and Reset the password in one row, then Deactivate, or Reactivate and Deactivate again, below it.
21. The deactivation and the reactivation answer 200 with the Vendor, where the workplace backend's actions answer 204.

From ticket 12, under "decisions left open, for the owner, from the code review":

22. "Deactivate again" on every deactivated Vendor's page, as a ghost button after Reactivate, since the page cannot tell a half-done deactivation from a finished one.
23. Its words: "Deactivate again", "Deactivate this Vendor again?" and the sentence that explains it.
24. Its dialog asks to confirm, as every deactivation does.
25. DESIGN.md's rule for a refusal in the alert dialog: "what was not done, then why".
