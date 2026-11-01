# 16: Verify from a fresh clone and record the redesign

**Spec:** [the redesign spec](../spec.md)

**What to build:** The redesign is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, followed by the install, the checks, the services, `pnpm platform:check` and the inspector on every screen. What it settled is written into the MVP spec, so that `pricing` and every later module build to the new look. This ticket closes `redesign`.

The services of the owner's own checkout are stopped before the fresh clone's are started, because both would claim the same ports, and started again afterwards.

**Blocked by:** 08, 09, 10, 11, 12, 13 (tickets 14 and 15, the Shopper app, were moved out of this spec by the owner on 1 November 2026)

**Status:** resolved

- [x] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand: one install; `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed; `pnpm boundaries:check`; `pnpm integration:check`; `pnpm services:up` and `pnpm services:check`; the browser's one-time install and `pnpm platform:check`.
- [x] In that clone, with the dashboard's chosen direction restored as ticket 05 recorded, ticket 01's command passes `inspect.mjs --app` on every dashboard screen at 1440, 768 and 360 pixels, the portal's in Kurdish and in English. The results are recorded under Comments as a table.
- [x] The Shopper app's current shell, not redesigned, passes `pnpm check` and `pnpm platform:check` as it is.
- [x] Git reports a clean working tree after every command above. No password and no secret is committed.
- [x] The owner is asked to check, once, in the owner's own browser, that the Admin console and the Vendor portal match the new DESIGN.md and move as its Motion section says, in Kurdish and in English. What they saw, or that it is still to be done, is recorded under Comments.
- [x] Checks on a phone are recorded under Comments as open, waiting for hosting, and added to the MVP spec's list under "Checks on a phone wait for hosting": the Offers screen, the catalog search and the Offer form used with a thumb, and the motion felt on a real phone.
- [x] **Recorded in the MVP spec:** the redesign's place in the Order of work, with links to this spec and its ADRs; the inspector's command and when a ticket runs it; and that each screen ticket from now on passes the inspector at three widths. `docs/agents/design-skills.md` gains the inspector's command and where the chosen directions are kept.
- [x] The MVP spec's Order of work records that the Shopper app's design is planned fresh, unique to it, as the first work of the `browse` module, following the principles this redesign used, and that this redesign was the dashboard's alone.
- [x] The spec's Status becomes `resolved`, and each ticket's too, but for 14 and 15, which stay `wontfix`.
- [x] The work is committed, leaving `pnpm check` passing.

## Comments

### 1 November 2026: the fresh clone

The repository was cloned at `redesign/integration`, `ca9f4ca` (tickets 01 to 13 and the code review's fixes; 14 and 15 `wontfix`), into a new folder in the session's scratchpad, `fresh-clone-16`, with `git clone --branch redesign/integration`. Compose named a project of its own after the folder, `fresh-clone-16`, so its services got a volume of their own; no `COMPOSE_PROJECT_NAME` was needed. Before the first step the clone held no `.env`, and Docker held no volume and no container of that project. The images of PostgreSQL, Keycloak and Testcontainers' helper were already on the machine.

The e2e lock (`16`) was held from before the owner's services were stopped until they were running again; no app listened on ports 3000 to 3002 when it was taken. The owner's running containers were recorded first, `pc-part-pickers-keycloak-1` and `pc-part-pickers-postgres-1`, and then stopped with `pnpm services:down` from the owner's checkout (`COMPOSE_PROJECT_NAME=pc-part-pickers`), which keeps their volume, `pc-part-pickers_postgres-data`. Every step ran from a script that wrote its own log and then read `git status --porcelain` in the clone.

| Step | Outcome | Time | Working tree |
|---|---|---|---|
| `pnpm install --frozen-lockfile` | Passed, from pnpm's store on the machine | 3 s | Clean |
| `pnpm check --skip-nx-cache`, with Docker unreachable and no browser installed | Passed: every step, and lint, type-check, test and build, 28 tasks for the 11 projects, none from Nx's cache | 18 s | Clean |
| `pnpm boundaries:check` | Passed all 114 lines | 9 s | Clean |
| `pnpm integration:check` | Passed 374 tests in 13 files, against its own PostgreSQL and Keycloak containers | 81 s | Clean |
| `pnpm services:up` | Passed: "Created .env with new local passwords and a new secret.", made the volume `fresh-clone-16_postgres-data`, imported the realm, made the development Admin's Login and applied 12 migrations | 16 s | Clean: Git ignores `.env` |
| `pnpm services:check` | Passed all 37 lines | 2 s | Clean |
| `pnpm exec playwright install chromium` | Passed | 1 s | Clean |
| `pnpm platform:check` | Passed **247 tests**, none failed, flaky or skipped. No app listened on ports 3000 to 3002 before it; it started all three and stopped them, and none listened after. | 550 s (9.1 minutes of tests) | Clean |
| `pnpm catalog:import`, for the inspector | Passed: 26,216 Parts of OpenDB at `ef7e601`, 24 records and 11,173 values left out, as the import always reports | 14 s | Clean |
| `pnpm services:reset` in the clone | Passed; no container and no volume of `fresh-clone-16` left | 2 s | Clean |

- **Docker stopped** was as earlier tickets did it: `pnpm check` ran with `DOCKER_HOST` pointed at a socket that does not exist, so `docker info` failed there, and with the owner's services already stopped, nothing answered on 5432 or 8080. Docker Desktop itself was not quit, since nothing in `pnpm check` could reach it.
- **No browser installed**: `PLAYWRIGHT_BROWSERS_PATH` pointed at an empty folder, still empty after `pnpm check`. The browser's install that followed found Chromium already in Playwright's cache on this machine.
- **The Shopper app's shell**, not redesigned, was built, linted, type-checked in `pnpm check`, and started by `pnpm platform:check`, whose Shopper lines all passed (its page from the API, the credit in each language, the language of each address, and its accessibility).
- **The catalog** was imported into the clone's own database because the made-up shop's Offers name real Parts, which a fresh database does not hold; it is the project's own command, the database was deleted with the clone, and it is the only write made outside the platform's own checks. The inspector wrote nothing: the clone's Parts, Vendors, Offers and Offer history were 26,279, 66, 22 and 30 before its 60 runs and the same after.
- **No password and no secret is committed.** `.env` is ignored, and no commit on any of the repository's 7 branches (571 commits) touches a file of that name. None of the 7 passwords and secrets in the owner's `.env`, nor of the 6 in the clone's, appears in any commit, searched with `git log --all -S` for each, nor in any log of this run or the inspector's reports. The script printed counts only.
- **Afterwards**, the clone's API and dashboard (started only for the inspector), its Nx daemon and its services were stopped, its volume deleted with `pnpm services:reset`, and the folder removed. `pnpm services:up` in the owner's checkout passed in 11 s ("The database already has every migration"), the same two containers run as before, `pnpm services:check` there passes all 37 lines, and the owner's data is there (29,413 Parts, 3,834 Vendors, 881 Offers). The lock was released after.
- **No instruction in any tool's output** was acted on; none appeared beyond Nx's usual hints (`--verbose`, dropping `--skip-nx-cache`).

### 1 November 2026: Taste's inspector on every screen

In the clone, after `pnpm platform:check`, with `apps/dashboard/design/taste/direction.json` restored into `.taste-skill/` as ticket 05 recorded (its allowances: none), the catalog imported, and the API and the dashboard started with `pnpm exec nx serve` (the only apps started by hand, for this step alone, under the lock): `pnpm dashboard:inspect <address> [--language en|ckb] --scheme light|dark --app --widths 1440,768,360`. Every screen in both schemes, the portal's in English and in Kurdish, 60 runs. **Every run exited 0 with 0 FAIL**, each tab landing on the dashboard logged in. Reports and photographs are in the owner's checkout at `.taste-skill/redesign-16/inspect/`.

The Admin console's screens are in English whatever the language (LANG-1). The Part's screens are the AMD Ryzen 7 7800X3D's and the MSI MAG B650 TOMAHAWK WIFI's; the Vendor's are the made-up shop's; the portal's are the made-up shop's, acting as its Vendor, its Offer `…0101`.

| Screen | Address | Light | Dark |
|---|---|---|---|
| The Catalog | `/catalog` | 0 FAIL, 0 WARN | 0 FAIL, 0 WARN |
| The Catalog, searched | `/catalog?category=cpu&search=ryzen x3d` | 0 FAIL, 0 WARN | 0 FAIL, 0 WARN |
| Choosing a Category | `/catalog/new` | 0 FAIL, 0 WARN | 0 FAIL, 0 WARN |
| A new CPU | `/catalog/new/cpu` | 0 FAIL, 0 WARN | 0 FAIL, 0 WARN |
| A new motherboard | `/catalog/new/motherboard` | 0 FAIL, 0 WARN | 0 FAIL, 0 WARN |
| A CPU's page | `/catalog/parts/<7800X3D>` | 0 FAIL, 0 WARN | 0 FAIL, 0 WARN |
| A motherboard's page | `/catalog/parts/<B650 Tomahawk>` | 0 FAIL, 1 WARN (`tabular` at 768 and 360) | 0 FAIL, 1 WARN (the same) |
| A Part's edit form | `/catalog/parts/<7800X3D>/edit` | 0 FAIL, 0 WARN | 0 FAIL, 0 WARN |
| The Vendors | `/vendors` | 0 FAIL, 1 WARN (`hero-void` at 1440) | 0 FAIL, 1 WARN (the same) |
| A new Vendor | `/vendors/new` | 0 FAIL, 0 WARN | 0 FAIL, 0 WARN |
| A Vendor's page | `/vendors/<shop>` | 0 FAIL, 0 WARN | 0 FAIL, 0 WARN |
| A Vendor's edit form | `/vendors/<shop>/edit` | 0 FAIL, 0 WARN | 0 FAIL, 0 WARN |
| Missing specifications | `/missing-specifications` | 0 FAIL, 0 WARN | 0 FAIL, 0 WARN |
| A Part's edit form beside it | `/missing-specifications/parts/<7800X3D>/edit` | 0 FAIL, 0 WARN | 0 FAIL, 0 WARN |
| Expiring Offers | `/expiring-offers` | 0 FAIL, 2 WARN (`hero-void`, `panel-void` at 1440) | 0 FAIL, 2 WARN (the same) |
| The Admin console's "not found" | `/no-such-screen` | 0 FAIL, 2 WARN (`hero-void`, `panel-void` at 1440) | 0 FAIL, 2 WARN (the same) |

| The Vendor portal's screen | Address under `/vendors/<shop>/portal` | English, light / dark | Kurdish, light / dark |
|---|---|---|---|
| The Offers | (index) | 0 FAIL, 0 WARN / 0 FAIL, 0 WARN | 0 FAIL, 0 WARN / 0 FAIL, 0 WARN |
| The catalog search | `add` | 0 FAIL, 0 WARN / 0 FAIL, 0 WARN | 0 FAIL, 0 WARN / 0 FAIL, 0 WARN |
| The Offer form | `add/<7800X3D>` | 0 FAIL, 0 WARN / 0 FAIL, 0 WARN | 0 FAIL, 0 WARN / 0 FAIL, 0 WARN |
| An Offer's screen | `offers/<offer>` | 0 FAIL, 1 WARN / 0 FAIL, 1 WARN (`mixed-font-headline`) | 0 FAIL, 1 WARN / 0 FAIL, 1 WARN (the same) |
| The details screen | `details` | 0 FAIL, 0 WARN / 0 FAIL, 0 WARN | 0 FAIL, 0 WARN / 0 FAIL, 0 WARN |
| The contact details form | `details/contact-details` | 0 FAIL, 1 WARN / 0 FAIL, 1 WARN (`panel-void` at 1440) | 0 FAIL, 1 WARN / 0 FAIL, 1 WARN (the same) |
| The portal's "not found" | `no-such-screen` | 0 FAIL, 2 WARN / 0 FAIL, 2 WARN (`hero-void`, `panel-void` at 1440) | 0 FAIL, 2 WARN / 0 FAIL, 2 WARN (the same) |

The WARNs, from the photographs:

- **Already defended**: `hero-void` and `panel-void` on both "not found" screens, the empty state centred in the window as the owner chose in ticket 13; `mixed-font-headline` on an Offer's screen, the leading plate's digits in Geist Mono with the units in Geist, as ticket 04 chose (ticket 12).
- **A short screen on the tall sheet**, as ticket 12 defended for an Offer gone: the contact details form at 1440 ends 120 pixels above the sheet's foot, which ticket 11's frame stretches to the window; and Expiring Offers lists the made-up shop alone, one row on the sheet (`hero-void` 67%, `panel-void` 587 pixels), since the inspector answers that list from the shop and nothing else. Neither appeared in the tickets that built them, which ran before ticket 11's frame or with more rows; both are the frame's sheet, not the screen's.
- **The fresh clone's data**: the Vendors at 1440 warn `hero-void` (37%, 720 by 660 pixels in the table's middle) because the State column is empty, every one of the clone's 66 Vendors being active, and an active Vendor shows no state. Ticket 09 ran it on 2,324 Vendors, some deactivated, with 0 WARN.
- **New, and not fixed here**: a motherboard's page at 768 and 360 warns `tabular`, "only 17% of the figures use tabular numerals": its PCIe and M.2 slot tables' counts, its memory figures and its date are in proportional figures, while at 1440, beside the Catalog, the page passes. Ticket 08 ran a motherboard's page (the ASUS B760M-AYW WIFI D4) with 0 WARN. DESIGN.md asks tabular figures of the plates; the Part's rows tables have end-aligned numbers but no rule on their figures. It is left as a follow-up, for a later ticket or the owner, since this ticket changes no screen.

### 1 November 2026: on a phone, once the platform is hosted

These wait for hosting, as the owner decided for the whole project on 16 October 2026, and are listed in the MVP spec under "Checks on a phone wait for hosting", in the entry for `redesign`, ticket 16:

- [ ] The Offers screen, the catalog search and the Offer form used with a thumb, in Kurdish and in English.
- [ ] The motion felt on a real phone, in both schemes and with the phone's reduced motion on and off: the press, the menu sheet, the switch's thumb, a row leaving and arriving, Confirm all's result, with nothing felt as a snap.

### 1 November 2026: the records

- **The MVP spec's Order of work** places `redesign` between `offers` and `pricing`, with links to this spec, its code review's fixes, ADR-0011 and the ADR-0007 it replaces in part, and says that `pricing` and every later module build their dashboard screens to the new DESIGN.md. A second paragraph says that the redesign was the dashboard's alone, that 14 and 15 are `wontfix`, and that the Shopper app's design is planned fresh, unique to it, as the first work of `browse`, following the principles this redesign used, each named.
- **The Technology section** gains **The redesign's conventions**: the look and the hard rules as reviewed, the scheme kept in the browser's storage, the shared components, the motion and how it is tested, and Taste's inspector: how to prepare a run, and that every ticket that builds or changes a dashboard screen passes it at 1440, 768 and 360 pixels, in both schemes, the portal's in Kurdish and in English, every FAIL fixed and every WARN fixed or defended. The commands table gains `pnpm dashboard:inspect`; the design part names Framed sheet where it said Rate Board, and controls of 36 pixels under a mouse; `pnpm install` counts eleven projects.
- **`docs/agents/design-skills.md`** gains the inspector's command for the dashboard and where the chosen directions are kept: the dashboard's sheet committed in `apps/dashboard/design/taste/`, restored into `.taste-skill/` for the inspector, its renderings in the owner's `.taste-skill/redesign-05/`; the Shopper app's none yet.
- The Status lines of the spec and of every ticket are left for the close-out.

### 1 November 2026: for the owner, in the owner's own browser

Put to the owner after the fresh clone's run, with the API and the dashboard started from the owner's checkout on `redesign/integration`. The owner checked the Admin console and the Vendor portal and answered: "they match DESIGN.md and move as its Motion section says, reduced motion included", in Kurdish and in English.

- [x] The Admin console and the Vendor portal match the new [DESIGN.md](../../../apps/dashboard/DESIGN.md) and move as its Motion section says, in Kurdish and in English.
