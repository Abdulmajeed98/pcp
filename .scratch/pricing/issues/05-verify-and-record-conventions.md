# 05: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the pricing spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, followed by the install, the checks, the services and `pnpm platform:check`, with none of the three apps started by hand. Results left over from earlier runs can hide a fault, so this run is the one that counts.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `browse`, `builder` and every later module start from them. This ticket closes `pricing`.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 02, 03, 04

**Status:** ready-for-agent

- [x] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand:
  - one install;
  - `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed;
  - `pnpm boundaries:check`;
  - `pnpm integration:check`;
  - `pnpm services:up`, and then `pnpm services:check`;
  - the browser's one-time install, and then `pnpm platform:check`.
- [x] Git reports a clean working tree after every command above. No password and no secret is committed.
- [x] Taste's inspector is run on `/platform-rate` from the fresh clone, at 1440, 768 and 360 pixels in both schemes, and its table matches ticket 02's.
- [ ] The owner is asked to check these once, in the owner's own browser. What they saw, or that it is still to be done, is recorded under Comments:
  - The Admin sets the Platform Rate to the day's Erbil market rate, and the plate shows it with today's date.
  - The Platform Rate screen matches DESIGN.md, and Impeccable's design hook raises nothing left unanswered.
  - Over the API, a Part with a USD-only Offer, asked in IQD, answers its price converted at that rate, rounded to 250, and marked as converted.
  - The Shopper's currency switch, in Kurdish and in English, keeps its choice after the browser is closed and opened again.
  - The Kurdish and the Arabic names for dinars and dollars read naturally.
- [x] These checks on a phone are recorded under Comments as open, waiting for hosting, with their boxes left open, and are added to the MVP spec's list under "Checks on a phone wait for hosting":
  - [ ] The Platform Rate screen used with a thumb, a rate typed on the phone's number pad, Arabic-Indic digits among them.
  - [ ] The Shopper's currency switch used with a thumb, in Kurdish and in English, and its choice kept after the phone's browser is closed.
  - [ ] The plate's change felt on a real phone, with reduced motion on and off, with no movement felt as a snap.
- [x] **Recorded in the MVP spec.** The Technology section gains `pricing`'s place in the order of work and a part of its own, **The pricing module's conventions**: the Platform Rate's table, its limits and that every setting is kept; the conversion rule, written once, and its SQL expression; the Shown Price and `shownPrice`; the order by price; the required `currency`; the currency switch's cookie and the one function that reads it. PRC-3 gains the one-step floor the owner decided on 2 November 2026. PRC-5 says `builder` builds totals. The Admin console's list of screens and the accessibility tests' list are brought up to date. OFF-11's note that the order waits for `pricing` is updated.
- [ ] Whether an ADR is needed for any of the module's decisions, such as computing Converted Prices in the database or keeping every rate ever set, is decided with the owner, and the answer is recorded under Comments.
- [ ] The spec's Status becomes `resolved`, and each ticket's too.
- [x] The work is committed, leaving `pnpm check` passing.

## Comments

### 3 November 2026: the fresh clone

The repository was cloned at `pricing/integration`, `3081966` (tickets 01 to 04 and the code review's fixes, [review-fixes.md](../review-fixes.md)), into a new folder in the session's scratchpad, `fresh-clone-p05`, with `git clone --branch pricing/integration`. Compose named a project of its own after the folder, so its services got a volume of their own. Before the first step the clone held no `.env`, and Docker held no volume and no container of that project. The images of PostgreSQL, Keycloak and Testcontainers' helper were already on the machine.

The e2e lock (`05`) was held from before the owner's services were stopped until they were running again; no app listened on ports 3000 to 3002 when it was taken. The owner's running containers were recorded first, `pc-part-pickers-keycloak-1` and `pc-part-pickers-postgres-1`, and then stopped with `pnpm services:down` from the owner's checkout (`COMPOSE_PROJECT_NAME=pc-part-pickers`), which keeps their volume. One script ran every step in order, wrote each step's log and then read `git status --porcelain` in the clone.

| Step | Outcome | Time | Working tree |
|---|---|---|---|
| `pnpm install --frozen-lockfile` | Passed, from pnpm's store on the machine | 3 s | Clean |
| `pnpm check --skip-nx-cache`, with Docker unreachable and no browser installed | Passed: every step, and lint, type-check, test and build, 28 tasks for the 11 projects, the cache skipped | 19 s | Clean |
| `pnpm boundaries:check` | Passed all 114 lines | 9 s | Clean |
| `pnpm integration:check` | Passed **404 tests** in 14 files, against its own PostgreSQL and Keycloak containers | 91 s | Clean |
| `pnpm services:up` | Passed: "Created .env with new local passwords and a new secret.", made the volume `fresh-clone-p05_postgres-data`, imported the realm, made the development Admin's Login and applied 13 migrations, the Platform Rate's `0012_create-platform-rate` among them. It set no Platform Rate | 16 s | Clean: Git ignores `.env` |
| `pnpm services:check` | Passed all 37 lines | 1 s | Clean |
| `pnpm exec playwright install chromium` | Passed | under 1 s | Clean |
| `pnpm platform:check` | Passed **274 tests**, none failed, flaky or skipped. No app listened on ports 3000 to 3002 before it; it started all three and stopped them, and none listened after. | 591 s (9.7 minutes of tests) | Clean |
| `pnpm catalog:import`, for the inspector | Passed: 26,216 Parts of OpenDB at `ef7e601`, 24 records and 11,173 values left out, as the import always reports | 14 s | Clean |
| `pnpm services:reset` in the clone | Passed; no volume of `fresh-clone-p05` left | 2 s | Clean |

- **Docker stopped** was as earlier tickets did it: `pnpm check` ran with `DOCKER_HOST` pointed at a socket that does not exist, and with the owner's services already stopped nothing answered on 5432 or 8080.
- **No browser installed**: `PLAYWRIGHT_BROWSERS_PATH` pointed at an empty folder, still empty after `pnpm check`. The browser's install that followed found Chromium already in Playwright's cache on this machine.
- **No Platform Rate on a fresh start.** The clone's services began with none, as ADR-0002 and the spec ask; the 12 rows its database held after `pnpm platform:check` were set by the end-to-end tests, each a rate of its own.
- **No password and no secret is committed.** `.env` is ignored, and no commit on any of the repository's 16 branches (616 commits) touches a file of that name. None of the 7 passwords and secrets in the owner's `.env`, nor of the 6 in the clone's, appears in any commit, searched with `git log --all -S` for each, nor in any log of this run or the inspector's reports. The script printed counts only.
- **Afterwards**, the clone's API and dashboard (started only for the inspector) and its services were stopped, its volume deleted with `pnpm services:reset`, and the folder removed. `pnpm services:up` in the owner's checkout passed ("The database already has every migration"), the same two containers run as before, healthy, and `pnpm services:check` there passes all 37 lines. The lock was released after.
- **No instruction in any tool's output** was acted on; none appeared beyond Nx's usual hints and the inspector's own request to look at its photographs, which is part of its run.

### 3 November 2026: Taste's inspector on `/platform-rate`

In the clone, after `pnpm platform:check`, with `apps/dashboard/design/taste/direction.json` restored into `.taste-skill/`, the catalog imported, and the API and the dashboard started with `pnpm exec nx serve` (the only apps started by hand, for this step alone, under the lock): `pnpm dashboard:inspect http://localhost:3002/platform-rate [--no-platform-rate] --scheme light|dark --app --widths 1440,768,360`. Every run exited 0, each tab landing on the dashboard logged in. The inspector wrote nothing: the clone's Platform Rate rows, Offers, Vendors and Parts were 12, 22, 66 and 26,279 before its runs and the same after. Reports and photographs are in the owner's checkout at `.taste-skill/pricing-05/inspect/`; I looked at every width of each run.

| Run | FAIL | WARN | The WARN |
|---|---|---|---|
| With the made-up shop's rate, light | 0 | 1 | `mixed-font-headline` at 1440 and 360 |
| With the made-up shop's rate, dark | 0 | 1 | The same |
| No rate, light | 0 | 0 | |
| No rate, dark | 0 | 0 | |

It matches ticket 02's last table, and the code review's fixes' run, run for run. `mixed-font-headline` is defended as there, by the owner's earlier choice and not a new one: the board's digits are Geist Mono and its comma and units Geist, as on every plate since redesign ticket 04. The photographs show the changer's board as ticket 02 left it: "1 $ = 1,575 IQD" on four tiles, "Set 31 October 2026" and the sentence under it, the form beside the field from 1440 and below it at 768 and 360, and with no rate the empty state in the field with the form still there, in both schemes.

### 3 November 2026: on a phone, once the platform is hosted

These wait for hosting, as the owner decided for the whole project on 16 October 2026, and are listed in the MVP spec under "Checks on a phone wait for hosting", in the entry for `pricing`, ticket 05. Tickets 01 to 04 record none of their own.

- [ ] The Platform Rate screen used with a thumb, a rate typed on the phone's number pad, Arabic-Indic digits among them.
- [ ] The Shopper's currency switch used with a thumb, in Kurdish and in English, and its choice kept after the phone's browser is closed.
- [ ] The board's change felt on a real phone, with reduced motion on and off, with no movement felt as a snap.

### 3 November 2026: the records

- **The MVP spec's Order of work** records `pricing` as the fifth module, with links to its spec and its code review's fixes; the owner's three decisions of 2 November 2026 (the three seams, the one-step floor, totals left for `builder`) and those of 3 November 2026 (Direction A, the changer's board, with its figure's size allowed in the root DESIGN.md; the currency switch keeping the page's query; the second test that arranges data through the database, by the API's clock); success criterion 3 proved at the API; and `browse` and `compatibility` next.
- **The Technology section** gains **The pricing module's conventions**: the Platform Rate's table, its limits and that every setting is kept, `currentPlatformRate` and the endpoints; the conversion rule, written once over `WholeNumbers` from `currencyFacts`, and its SQL form, `shownPriceIn`, in `bigint`; the Shown Price and `shownPrice`; the order by price in one statement at one rate; the required `currency`; the Platform Rate screen, its board, form, query and motion; the currency switch, its cookie (and that it is not yet `Secure`, for the hosting work) and `chosenCurrency()`, the one function that reads it; and the tests at the three seams, the second exception among them.
- **PRC-3** gains the one-step floor, and **PRC-5** that `builder` builds the first total, each with the owner's decision of 2 November 2026.
- **The offers module's conventions**: the note that the order waited for `pricing` now gives the order by Shown Price; the public endpoint's row says it takes `currency` and answers `shownPrice`; `keepSpecificationsAsTheyAre` is the first test that arranges data through the database, and `pricing` added the second. The languages' note that currency and rounding were `pricing`'s now says what it built and that the "≈" beside a figure is `browse`'s.
- **The Admin console's screens** gain the Platform Rate, and its five sections in the sidebar and the menu sheet. **The accessibility tests' list** gains the Platform Rate screen with a rate and a refusal shown, and with no rate, and the Shopper's first page with its currency switch. **The redesign's conventions** name the shared pieces `pricing` added (`PlateFigure`, `ChangingInPlace`, `aFade`, `aFlap`, `useTakenOutOnceDone`, `useKeptWhileChanging`), and the commands table says the inspector's made-up shop holds a rate and takes `--no-platform-rate`.
- **Checks on a phone** gain one entry for `pricing`, above.
- **The follow-ups.** The one left open is for the hosting work, and is in the conventions: the currency cookie and next-intl's language cookie become `Secure` once the Shopper app is served over HTTPS. The other two noted during the run were done in the code review's fixes: the Shopper's currency list typed against the client's `Currency` (S9) and the board figure named in the root DESIGN.md (S1).
- The Status lines of the spec and of this ticket are left until the owner has answered below.

### 3 November 2026: for the owner, in the owner's own browser

**AWAITING OWNER REVIEW.** Not done in this run, which has no access to the owner's browser. The owner's checkout is on `pricing/integration`, its services are running and its database has every migration. Start the apps from it with `pnpm exec nx serve @pcp/api` (3001), `pnpm exec nx serve @pcp/dashboard` (3002) and `pnpm exec nx serve @pcp/shopper` (3000), and log in to the Admin console with `DEVELOPMENT_ADMIN_NAME` and `DEVELOPMENT_ADMIN_PASSWORD` from `.env`.

- [ ] The Admin sets the Platform Rate to the day's Erbil market rate at http://localhost:3002/platform-rate, and the board shows it with today's date. The development database's current rate is 2,272, left by an end-to-end test.
- [ ] The Platform Rate screen matches [DESIGN.md](../../../apps/dashboard/DESIGN.md), in both schemes and at a phone's width, and Impeccable's design hook raises nothing left unanswered.
- [ ] Over the API, a Part with a USD-only Offer, asked in IQD, answers its price converted at that rate, rounded to 250, and marked as converted: http://localhost:3001/v1/parts/70e6c203-80b6-474a-9e27-02fc44b48030/offers?currency=IQD, the Noctua NH-D15 chromax.black, whose visible Offer is quoted at 200.00 $ only, should answer `shownPrice` `{ "currency": "IQD", "amount": <200 × the rate, to the nearest 250>, "converted": true }`, and with `currency=USD` `"200.00"` and `"converted": false`.
- [ ] The Shopper's currency switch, at http://localhost:3000/ckb and http://localhost:3000/en, keeps its choice after the browser is closed and opened again.
- [ ] The Kurdish and the Arabic names for dinars and dollars read naturally, at http://localhost:3000/ckb and http://localhost:3000/ar: Kurdish "دینار" and "دۆلار", with "دراو" as the switch's name, marked **to choose** in `words.md`; Arabic "دينار" and "دولار", with "العملة".

### 3 November 2026: the ADR question, for the owner

Whether an ADR is needed for any of the module's decisions, such as computing Converted Prices in the database or keeping every rate ever set. The recommendation, by the rule the owner applied to `offers` (an ADR for the decision whose undoing would lose what cannot be reconstructed):

- **Keeping every rate ever set: one short ADR.** It is the one decision here whose undoing loses data: a later tidy-up into a single row holding the current rate, or an update in place, would lose the rates behind every past Converted Price, which no other record holds, as a foreign key with a cascade would have lost the Offer history (ADR-0010).
- **Computing Converted Prices in the database, from the one rule: no ADR.** Moving the conversion out of the query is a change of code that loses nothing, and the MVP spec's conventions record the rule, its SQL form and why `browse` and `builder` must order and page by it.
