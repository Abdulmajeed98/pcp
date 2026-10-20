# 09: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the offers spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, followed by the install, the checks, the services and `pnpm platform:check`, with none of the three apps started by hand. Results left over from earlier runs can hide a fault, so this run is the one that counts.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `pricing` and every later module start from them. This ticket closes `offers`.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 03, 04, 05, 06, 07, 08

**Status:** resolved

- [x] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand:
  - one install;
  - `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed;
  - `pnpm boundaries:check`;
  - `pnpm integration:check`;
  - `pnpm services:up`, and then `pnpm services:check`;
  - the browser's one-time install, and then `pnpm platform:check`.
- [x] Git reports a clean working tree after every command above. No password and no secret is committed.
- [x] The owner is asked to check these once, in the owner's own browser. What they saw, or that it is still to be done, is recorded under Comments:
  - A Vendor, made in the Admin console and logged in, adds a few real Parts' Offers from the catalog search, changes one, removes one and confirms all, in Kurdish and in English.
  - The Admin, acting as a Vendor, adds an Offer under the band.
  - The Offers screen, the search, the form, Expiring Offers and Missing specifications match DESIGN.md, and Impeccable's design hook raises nothing left unanswered.
  - The Kurdish and the Arabic counting sentences read naturally for 0, 1, 2, 3, 11 and 100 days.
  - A WhatsApp link in Expiring Offers opens WhatsApp's website with the Vendor's number.
- [x] These checks on a phone are recorded under Comments as open, waiting for hosting, with their boxes left open, and are added to the MVP spec's list under "Checks on a phone wait for hosting":
  - [ ] The Offers screen, the catalog search and the Offer form used with a thumb, in Kurdish and in English.
  - [ ] A price typed on a Kurdish and on an Arabic keyboard is saved as its value.
  - [ ] The confirm-all button reached in the banner with a thumb.
  - [ ] Expiring Offers' WhatsApp link opens the WhatsApp app on the Admin's phone.
- [x] **Recorded in the MVP spec.** The Technology section gains `offers`' place in the order of work and a part of its own, **The offers module's conventions**: the API as the source of time and how a test moves it; the rule for a visible Offer, written once; how prices are stored and answered; the 14-day and 3-day constants and the days since Confirmation; the Offer history and what it records; the endpoints; the portal's screens and their addresses; and the two Admin lists. The Admin console's list of screens and the accessibility tests' list are brought up to date. CAT-8 says its list exists.
- [x] Whether an ADR is needed for storing USD in cents, or for keeping the history apart from the Offer, is decided with the owner, and the answer is recorded under Comments.
- [x] The spec's Status becomes `resolved`, and each ticket's too.
- [x] The work is committed, leaving `pnpm check` passing.

## Comments

### 20 October 2026: the fresh clone

The repository was cloned at `offers/integration`, `29f59ec`, the tip with tickets 01 to 08 and the code review's fixes, into a new folder in the session's scratchpad, `o09-fresh-clone`. Compose therefore named a project of its own, `o09-fresh-clone`, and a volume of its own. The e2e lock was held for the whole run. Before the clone's services started, the owner's were stopped with `pnpm services:down` from the owner's checkout, with `COMPOSE_PROJECT_NAME=pc-part-pickers`, which keeps their data; afterwards the clone's were stopped with `pnpm services:down` and the owner's started again with `pnpm services:up`. Every step ran from a script, in order, and wrote its own log; after each, `git status --porcelain` in the clone was read.

Before the first step: the clone held no `.env`, and Docker held no volume and no container named for its project. The images of PostgreSQL, Keycloak and Testcontainers' helper were already on the machine, as they are on any machine that has run the services once.

| Step | Outcome | Time | Working tree |
|---|---|---|---|
| `pnpm install --frozen-lockfile` | Passed | 5 s, from pnpm's store on the machine | Clean |
| `pnpm check --skip-nx-cache`, with Docker stopped and no browser installed | Passed: every step, and lint, type-check, test and build, 25 tasks, for the 10 projects, none from Nx's cache | 18 s | Clean |
| `pnpm boundaries:check` | Passed all 114 lines | 9 s | Clean |
| `pnpm integration:check` | Passed 368 tests in 13 files, against its own PostgreSQL and Keycloak containers | 82 s | Clean |
| `pnpm services:up` | Passed: "Created .env with new local passwords and a new secret.", made the volume `o09-fresh-clone_postgres-data`, imported the realm, made the development Admin's Login and applied 12 migrations | 16 s | Clean: Git ignores `.env` |
| `pnpm services:check` | Passed all 37 lines | 2 s | Clean |
| `pnpm exec playwright install chromium` | Passed | under 1 s | Clean |
| `pnpm platform:check` | Passed 163 tests. No app was listening on ports 3000 to 3002 before it, so it started all three and stopped them; none was listening after. | 277 s | Clean |
| `pnpm services:down` in the clone | Passed; no container left running | 1 s | Clean |

- **Docker stopped was simulated**, as earlier tickets did: `pnpm check` ran with `DOCKER_HOST` pointed at a socket that does not exist, while Docker itself ran for the steps that need it.
- **No browser installed was simulated too**: `PLAYWRIGHT_BROWSERS_PATH` pointed at an empty folder, which was still empty afterwards. The browser's install that followed found Chromium already in Playwright's cache on this machine, so it downloaded nothing.
- **No password and no secret is committed.** `.env` is ignored and no commit touches a file of that name. None of the 7 passwords and secrets in the owner's `.env`, nor of the 6 in the clone's, appears in any of the 430 commits of the repository's 12 branches, searched with `git log -S` for each, nor in any log of this run. The script printed counts only.
- **The owner's services again.** `pnpm services:up` in the owner's checkout passed in 13 s, its migration step finding nothing to apply, and `pnpm services:check` there passes all 37 lines. Their data is as it was: 191 Offers of active Vendors and 12 migrations, the offers module's three among them. The clone's stopped volume, `o09-fresh-clone_postgres-data`, is left in Docker; `pnpm services:reset` in the clone, or deleting the volume, removes it.

### 20 October 2026: the records

- **The MVP spec's Technology section** gains **The offers module's conventions**: the API as the source of time, one now for a whole list, and how a test moves the clock; Offers and their prices, the unique pair refused by the constraint alone, USD in whole cents answered as a decimal string, IQD in whole dinars, the limits, the reasons, the digits the portal takes, and no copy of the API's limits in a frontend; Confirmation and expiry, the 14-day and 3-day constants and their two moments, the days since Confirmation and the days left, both rounded down and answered by the API; the rule for a visible Offer, written once in `visibility.ts` with its one query in the Store, and the order until `pricing`; the Offer history and what it records; who may do what, a deactivated Vendor's own Login refused at `GET v1/parts` among it; the nine endpoints and the catalog search's `offerId`; the two Admin lists, Expiring Offers' order and Missing specifications' rule that a stored 0 where 0 means "not known" is missing; the Vendor portal's screens and their addresses, and the query keys, the catalog search under both the Parts' key and the Offers' change; and the helpers of the tests.
- **The Order of work** records `offers` finished on 20 October 2026, with links to its spec and its code review's fixes. The accounts conventions' router line says the Offers screen is now the index route.
- **CAT-8** says its list exists, the Admin console's Missing specifications.
- **The Admin console's screens** gain Missing specifications, with a Part's edit form below it, and Expiring Offers, and its menu its four sections. **The accessibility tests' list** gains the Offers screen with its banner, the catalog search with results and the note, the Offer form with a refusal, the form that changes an Offer with and without the removal's dialog, Expiring Offers and Missing specifications.
- **Checks on a phone** hold one entry for `offers`, each check once, with where it is asked for; it replaces the two lines tickets 04 and 07 had put there.

### 20 October 2026: on a phone, once the platform is hosted

These wait for hosting, as the owner decided for the whole project on 16 October 2026, and are listed in the MVP spec under "Checks on a phone wait for hosting", in the entry for `offers`.

- [ ] The Offers screen, the catalog search and the Offer form used with a thumb, in Kurdish and in English.
- [ ] A price typed on a Kurdish and on an Arabic keyboard is saved as its value.
- [ ] The confirm-all button reached in the banner with a thumb.
- [ ] Expiring Offers' WhatsApp link opens the WhatsApp app on the Admin's phone.

### 20 October 2026: still to be done by the owner, in the owner's own browser

Not done in this run, which has no access to the owner's browser. Each is put to the owner after this report:

- [ ] A Vendor, made in the Admin console and logged in, adds a few real Parts' Offers from the catalog search, changes one, removes one and confirms all, in Kurdish and in English.
- [ ] The Admin, acting as a Vendor, adds an Offer under the band.
- [ ] The Offers screen, the search, the form, Expiring Offers and Missing specifications match DESIGN.md, and Impeccable's design hook raises nothing left unanswered.
- [ ] The Kurdish and the Arabic counting sentences read naturally for 0, 1, 2, 3, 11 and 100 days. On the screen "Expires in" appears with 1 or 2 only, "Expired" with 14 or more, and the owner's Offers are all under a day old, so the sentences for every count are drawn on a page of their own, outside the repository, by i18next from the committed language files.
- [ ] A WhatsApp link in Expiring Offers opens WhatsApp's website with the Vendor's number. The owner's development data holds no Offer confirmed more than 11 days ago, and none can be made old through the API, so the list is empty until one Offer's Confirmation is moved back by hand in the development database.

### 20 October 2026: the ADR question, for the owner

Whether an ADR is needed for storing USD in cents, or for keeping the history apart from the Offer. Neither was challenged during the work, which the spec named as the reason to write one; both are now recorded among the conventions in the MVP spec. The recommendation put to the owner: none for the cents, since a later change to a decimal column is a migration that loses nothing; one short ADR for the history, since it is the one decision whose undoing would lose what cannot be reconstructed (OFF-10), and a later tidy-up that gave `offer_history` a foreign key to `offer`, with a cascade, would delete an Offer's history with each removal.

### 20 October 2026: the owner's answers

- **The history apart from the Offer: an ADR.** [ADR-0010](../../../docs/adr/0010-offer-history-kept-apart-from-the-offer.md) records it, with the options it was chosen over and what a foreign key to `offer` would cost, and the MVP spec's offers conventions and its Order of work link to it.
- **USD in cents: no ADR.** A later change to a decimal column is a migration that loses nothing (cents divided by 100), nothing during the work challenged it, which the spec named as the reason to write one, and the MVP spec's conventions record the rule and why: no frontend meets a binary fraction, and the check of at most two decimals is a check of whole cents.
- **The five checks in the owner's browser** stay to be done, as the ticket allows, their boxes open above, with the steps below.
- **The Arabic counting sentences** say one and two in words, with no number, as the owner chose. Below.

### 20 October 2026: the Arabic forms for one and two

Every Arabic counting sentence of this module now writes its `one` and `two` forms without the count: "تم التأكيد قبل يوم" and "قبل يومين", "ينتهي خلال يوم" and "خلال يومين", "منتهي الصلاحية، تم التأكيد قبل يوم", "ضمان شهر" and "شهرين", "عرض واحد" and "عرضان" for the count of Offers and the banner's counts, "تم العثور على عرض واحد" and "قطعة واحدة", "تم تأكيد عرض واحد." and "عرضين.". A count of a thing alone takes واحد, so that "عرض" is not read as the word on a label; a length of time does not. "Expires in" now says خلال in every form, as the owner's example did, where it said بعد. The `zero` forms and the forms for 3 and more are as they were. They are still drafts under LANG-7.

- **The check.** The language check lets a form for none, one or two say its count in a word, and asks every value only of the forms for many counts, so `pnpm check` passes with no change to it.
- **A test changed with it.** The language line of the banner and confirm-all waited for the count's own element, `confirmed-count`, after confirming all. The line's Vendor has one Offer and its browser opens the portal in Arabic, where the result now writes no count, so it waits for the result itself, `confirmed`.
- **The language lines** of `dashboard-languages.spec.ts` pass, all 31, under the e2e lock (`pnpm exec nx e2e @pcp/e2e --skip-nx-cache -- src/dashboard-languages.spec.ts`).

### 20 October 2026: the steps for the checks in the owner's browser

- **Starting the apps.** Until `offers/integration` is merged into `main`, from the integration worktree, `.claude/worktrees/offers-integration`, whose `.env` is the owner's: `NX_DAEMON=false pnpm exec nx serve @pcp/api` (port 3001) and `NX_DAEMON=false pnpm exec nx serve @pcp/dashboard` (port 3002), then http://localhost:3002. The owner's services are running and their database has every migration.
- **Logins.** The Admin console with the development Admin, `DEVELOPMENT_ADMIN_NAME` and `DEVELOPMENT_ADMIN_PASSWORD` in `.env`. A Vendor is made in the Admin console, under Vendors, and its temporary password is shown with the hand-over; it logs in, in a private window since a browser holds one login, with its login phone number, and chooses its own password. Real Parts are found by name, such as "Ryzen 5 7600". The Admin acts as it with "Open its portal" on its page.
- **The counting sentences** for 0, 1, 2, 3, 11 and 100 are drawn, in the three languages with each one's plural form, on a page outside the repository, `counting-sentences/index.html` in the session's notes for this ticket, by i18next from the committed files.
- **Expiring Offers' WhatsApp link** needs a Vendor listed, which needs an Offer confirmed more than 11 days ago. One of the check's Vendor's Offers is moved back by hand in the development database: `docker exec pc-part-pickers-postgres-1 psql -U pcp -d pcp -c "update offer set confirmed_at = confirmed_at - interval '12 days' where id = (select o.id from offer o join vendor v on v.id = o.vendor_id where v.name = '<the Vendor's name>' order by o.confirmed_at limit 1)"`. The Vendor's banner and "Expires in 2 days" show too, and confirm-all brings the Offer back.

### 20 October 2026: closed

The spec's status is resolved, as is every ticket of the module. The checks in the owner's browser and on a phone stay open, as recorded above.
