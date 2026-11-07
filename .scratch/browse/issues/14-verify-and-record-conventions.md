# 14: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the browse spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it. That means a fresh clone in a new directory, with no `.env` and no Docker volumes, followed by the install, the checks, the services and `pnpm platform:check`, with none of the three apps started by hand. Results left over from earlier runs can hide a fault, so this run is the one that counts.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `compatibility`, `builder` and every later module start from them. This ticket closes `browse`.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 15

**Status:** resolved

- [x] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand:
  - one install;
  - `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed, the Shopper's unit tests among it;
  - `pnpm boundaries:check`;
  - `pnpm integration:check`;
  - `pnpm services:up`, and then `pnpm services:check`;
  - the browser's one-time install, and then `pnpm platform:check`.
- [x] Git reports a clean working tree after every command above. No password and no secret is committed.
- [x] `pnpm shopper:inspect` is run from the fresh clone on the home page, a Category page, a Part page and a Vendor page, at 1440, 768 and 390 pixels in both schemes, the 360-pixel rule measured by the end-to-end tests' `expectNoSidewaysScroll`, as the owner decided on 7 November 2026. Its tables match tickets 09 to 13's.
- [x] The owner is asked to check these once, in the owner's own browser. What they saw, or that it is still to be done, is recorded under Comments:
  - From the home page to a Category, a filter, a Part and its Vendor, in Kurdish and in English, the pages match DESIGN.md, and Impeccable's design hook raises nothing left unanswered.
  - A Vendor made in the Admin console adds an Offer quoted only in USD. The Shopper sees the Part with that USD price, and in IQD sees a price marked "≈", converted at the Platform Rate and rounded to 250 (success criterion 3).
  - Deactivating that Vendor removes its page and the Part at once, and reactivating it brings both back.
  - The Kurdish and the Arabic texts this module added read naturally (LANG-7's review stays open until launch).
- [x] These checks are recorded under Comments as open, waiting for hosting, with their boxes left open. Each is added to the MVP spec's list under "Checks on a phone wait for hosting":
  - [ ] The four pages used with a thumb in Kurdish and in English: the filters, the price fields with the phone's number pad, Arabic-Indic digits among them, and the search with the phone's search key.
  - [ ] The phone, WhatsApp, Instagram and Google Maps links opening the dialler, the WhatsApp app, Instagram and Google Maps.
  - [ ] A Part page's link pasted into the WhatsApp app showing its preview with the Part's photo, in each language (success criterion 12). It needs a public address that WhatsApp can reach.
  - [ ] The motion felt on a real phone, in both schemes, with reduced motion on and off, with no movement felt as a snap.
- [x] **Recorded in the MVP spec.** The Technology section gains `browse`'s place in the order of work and a part of its own, **The browse module's conventions**. It covers:
  - Visible Offer, Visible Part and Lowest Price;
  - the public endpoints, with their orders, filters, refusals and the rule for a Visible Part, written once;
  - the filters' statement in the domain;
  - the Shopper's addresses and their query;
  - the photo's pass-through;
  - the Shopper app's public address;
  - the Shown Price component;
  - previews;
  - the stand-in API and `pnpm shopper:inspect`;
  - the Shopper's unit seam, its runner and what it tests.

  Elsewhere in the MVP spec:
  - The commands table gains `pnpm shopper:inspect`.
  - The settings table gains the public address.
  - The testing strategy's last paragraph names the Shopper app's unit-test runner.
  - The accessibility tests' list gains the Shopper's pages.
  - The note that the Shopper's design waits for `browse` is updated.
- [x] Whether an ADR is needed for any of the module's decisions beyond ticket 08's is decided with the owner, and the answer is recorded under Comments. One candidate is a stand-in API for inspection in place of seeded data.
- [x] The spec's Status becomes `resolved`, and each ticket's too.
- [x] The work is committed, leaving `pnpm check` passing.

## Comments

### 7 November 2026: the fresh clone

The repository was cloned at `browse/integration`, `a822ab0` (tickets 01 to 13 and 15, and the code review's fixes), into a new folder in the session's scratchpad, `fresh-clone-14`, with `git clone --branch browse/integration`. Compose named a project of its own after the folder, `fresh-clone-14`, so its services got a volume of their own; no `COMPOSE_PROJECT_NAME` was set in the clone. Before the first step the clone held no `.env`, only `.env.example`, and Docker held no volume and no container of that project. The images of PostgreSQL, Keycloak and Testcontainers' helper were already on the machine, and so was Chromium in Playwright's cache.

The e2e lock (`14`) was held from before the owner's services were stopped until they were running again; no app listened on ports 3000 to 3002 when it was taken. The owner's containers and data were recorded first: `pc-part-pickers-keycloak-1` and `pc-part-pickers-postgres-1`, both up and healthy for 4 days, the volume `pc-part-pickers_postgres-data`, and in the database 33,511 Parts (26,216 imported from OpenDB), 362 photos, 6,630 Vendors (6,619 active), 3,457 Offers, 4,059 rows of Offer history, 971 Platform Rates set (the current one 1,500), 13 migrations, and 6,632 Logins in the realm. They were then stopped with `pnpm services:down` from the owner's checkout (`COMPOSE_PROJECT_NAME=pc-part-pickers`), which keeps the volume; nothing listened on 5432 or 8080 after. One script ran every step in order, wrote each step's log and read `git status --porcelain` in the clone after each.

| Step | Outcome | Time | Working tree |
|---|---|---|---|
| `pnpm install --frozen-lockfile` | Passed, from pnpm's store on the machine | 3 s | Clean |
| `pnpm check --skip-nx-cache`, with Docker unreachable and no browser installed | Passed: every step, then lint, type-check, test and build, 31 tasks for the 12 projects, none from Nx's cache, the Shopper's unit tests among them | 20 s | Clean |
| `pnpm boundaries:check` | Passed all 128 lines | 9 s | Clean |
| `pnpm integration:check` | Passed 529 tests in 20 files, on its first run, against its own PostgreSQL and Keycloak containers | 105 s | Clean |
| `pnpm services:up` | Passed: "Created .env with new local passwords and a new secret.", made the volume `fresh-clone-14_postgres-data`, imported the realm, made the development Admin's Login and applied 13 migrations | 16 s | Clean: Git ignores `.env` |
| `pnpm services:check` | Passed all 37 lines | 2 s | Clean |
| `pnpm exec playwright install chromium` | Passed, Chromium being in Playwright's cache already | 1 s | Clean |
| `pnpm platform:check` | Passed **387 tests**, none failed, flaky or skipped. No app listened on ports 3000 to 3002 before it; it started all three and stopped them, and none listened after | 993 s (16.4 minutes of tests) | Clean |
| `pnpm catalog:import`, for the inspector | Passed: 26,216 Parts of OpenDB at `ef7e601`, 24 records and 11,173 values left out, as the import always reports | 14 s | Clean |
| `pnpm services:reset` in the clone, after the inspector below | Passed: the clone's two containers, its network and its volume removed; no container and no volume of `fresh-clone-14` left, and the owner's volume kept | 2 s | Clean |

- **Docker stopped** was as earlier tickets did it: `pnpm check` ran with `DOCKER_HOST` pointed at a socket that does not exist, so `docker info` failed there (exit 1), and with the owner's services stopped nothing answered on 5432 or 8080. Docker Desktop itself was left running, since nothing in `pnpm check` could reach it.
- **No browser installed**: `PLAYWRIGHT_BROWSERS_PATH` pointed at an empty folder, still empty after `pnpm check`.
- **The Shopper's unit tests** ran in `pnpm check` as `@pcp/shopper:test`; the same tree holds 383 tests in 23 files, and the inspector's own 100 in 9.
- **`pnpm integration:check`** passed on its first run: ticket 09 had seen it pass only on its third, once stopping with no summary and once timing out as its Keycloak started.
- **The catalog** was imported into the clone's own database because the made-up shop's Parts are real Parts of the catalog; it is the project's own command, the database went with the clone, and it is the only write made outside the platform's own checks.
- **What the apps logged during `pnpm platform:check`**, none of it failing a line: the Shopper app once "The destination stream errored while writing data", a line leaving a page before its answer ended, as ticket 12 and the code review saw; Next twice that a Part page's photograph, `hand-setting-memory.webp`, was the page's Largest Contentful Paint, asking for `loading="eager"`, which was not acted on (a follow-up); the API once `pg`'s warning that a query sent while its client is still busy will fail in `pg` 9 (a follow-up); and the API's refusal of a test's picture that is not one, as that test means.
- **No password and no secret is committed.** `.env` is ignored, and no commit reachable from the clone's 18 branches (777 commits) touches a file of that name. None of the 7 passwords and secrets in the owner's `.env`, nor of the 6 in the clone's, appears in any commit, each searched with `git log --all -S`, nor in any of the 532 files of this run's logs, the inspector's reports and photographs, the inspection's own Shopper app's files and the end-to-end tests' report. The script printed counts only.
- **Afterwards**, the clone's API (started only for the inspector), its Nx daemon and the daemon's last plugin worker were stopped, its services and volume deleted with `pnpm services:reset` (`COMPOSE_PROJECT_NAME=fresh-clone-14` given as well, so that the reset could reach no other project), and the folder removed. In the owner's checkout `pnpm services:up` (`COMPOSE_PROJECT_NAME=pc-part-pickers`, `NX_DAEMON=false`) passed: "The database already has every migration", and it added the one setting the owner's `.env` lacked, `SHOPPER_PUBLIC_URL`, as it adds any new setting, changing no value. The same two containers run, healthy, on the same volume; `pnpm services:check` there passes all 37 lines; and every count is as it was before: 33,511 Parts, 362 photos, 6,630 Vendors (6,619 active), 3,457 Offers, 4,059 rows of Offer history, 971 Platform Rates (the current 1,500), 13 migrations and 6,632 Logins. The lock was released after, at 08:36, 35 minutes after it was taken; nothing listened on ports 3000 to 3002, 3100 or 3101.
- **No instruction in any tool's output** was acted on: Next's request for `loading="eager"` above, Taste's inspector's "score the screenshots with references/critique.md" (the photographs were looked at, as the conventions ask), and Nx's usual hints.

### 7 November 2026: Taste's inspector, from the fresh clone

In the clone, after `pnpm platform:check` and the catalog's import, with the Shopper's sheet restored into the clone's `.taste-skill/` (`apps/shopper/design/taste/direction.json`, its five allowances) and the clone's API started with `pnpm exec nx serve @pcp/api`, the only app started by hand, for this step alone, under the lock: `pnpm shopper:inspect <path> --language en|ckb --scheme light|dark --widths 1440,1280,1024,768,390`. It ran on the home page, a Category page with nothing on, a Part page with a photo and 20 Offers (the AMD Ryzen 7 7800X3D) and a Vendor page with every detail and its name in Arabic script ("کۆگای پارچەی خەیاڵی", `…002`), each in both schemes, in English and in Kurdish: 16 runs, the pages and the rows tickets 09 to 13 ran. Phones were inspected at 390 pixels, the 360-pixel rule being measured by `expectNoSidewaysScroll` in `pnpm platform:check` above, as the owner decided on 7 November 2026; 1024 and 1280 are the desk layouts. **Every run exited 0 with 0 FAIL**, the stand-in answering from "21 Vendors and 852 Offers of 434 real Parts", each in 30 to 49 seconds, with nothing listening on 3100 or 3101 after it and the working tree clean. The clone's Parts, Vendors, Offers, Offer history and Platform Rates were the same before the inspector's runs and after: it wrote nothing. The reports and photographs are beside the page for the owner, in `browse-14/inspect/`.

| Page | Address | FAIL | WARN | Against tickets 09 to 13 |
|---|---|---|---|---|
| The home page | `/` | 0 in all four | `dashed`, `no-footage`; `grey-body` in light; `size-count` at 1280, 1024 and 768 in Kurdish | Ticket 09's, the same |
| A Category page, nothing on | `/categories/cpu` | 0 in all four | `dashed`, `no-footage`; `grey-body` in light; `blank-gap` at 768; `first-action` at 390 in Kurdish; and **`first-action` at 1024, and at 1280 in Kurdish** | Ticket 11's (nothing on), the same but the last, at widths it did not run |
| A Part page, a photo and 20 Offers | `/parts/<the 7800X3D>` | 0 in all four | `dashed`, `no-footage`; `grey-body` in light | Ticket 12's (with a photo), the same |
| A Vendor page, every detail | `/vendors/00000000-0000-4000-8000-000000000002` | 0 in all four | `dashed`, `no-footage`; `blank-gap` at 768 | Ticket 13's (every detail), the same |

- **Defended, as tickets 09 to 13 defended them and the owner kept them**: `dashed`, the dot leaders (T5), the perforations (T2), the slip's dashed rules (T1) and the tear-off tabs' perforations; `no-footage`, the photographs being stills by design; `grey-body` in light, the second lines in Soft Ink (6.6:1), the sentences being in the Ink; `blank-gap` at 768, inside the back cover, its one full-screen rest; `size-count` on the Kurdish home page, DESIGN.md's hierarchy at the Tall Script Rule's sizes and the cropped name; and `first-action` at 390 on the Kurdish Category page with nothing on, ticket 11's question 3, which the owner kept on 6 November 2026.
- **New, and not fixed here**: `first-action` on the Category page with nothing on at 1024 pixels in both languages, and at 1280 in Kurdish, "No visible button in the first screen". Ticket 11 inspected that page at 1440, 768 and 390 alone, and ticket 10 ran 1024 before the filters filled the swing tag. Captured alone at each width (`category-ckb-light-1024`, `-1280` and the English two): from 64rem the swing tag stands beside the sheet with its search and its chips of manufacturers, sockets and cores in the first screen, and its price fields and Show Parts below it, in a first screen 768 pixels tall at 1024, and 800 at 1280, where the Kurdish tag is the taller. With script each chip applies as soon as it is ticked, and Show Parts sends what was typed. It is the case the owner kept for a phone's first screen in ticket 11, at desk widths; whether it is kept there too, or Show Parts brought into the first screen, is left for a later ticket or the owner, since this ticket changes no page (a follow-up).
- **Looked at by eye**: the photographs of each page, the desk, tablet and phone pictures, and the four captures at 1024 and 1280. Nothing is cut; the Kurdish pages run right to left with the part numbers, phone numbers and prices left to right; the coupon, the plate and the sheets are as the renderings the owner chose. In the dark runs the scheme switch shows Device chosen, since the inspector asks the browser for its dark preference rather than the switch.

### 7 November 2026: on a phone, once the platform is hosted

These wait for hosting, as the owner decided for the whole project on 16 October 2026, and are listed in the MVP spec under "Checks on a phone wait for hosting", in the entry for `browse`, ticket 14, beside tickets 09 to 13's own:

- [ ] The four pages used with a thumb in Kurdish and in English: the filters, the price fields with the phone's number pad, Arabic-Indic digits among them, and the search with the phone's search key.
- [ ] The phone, WhatsApp, Instagram and Google Maps links opening the dialler, the WhatsApp app, Instagram and Google Maps.
- [ ] A Part page's link pasted into the WhatsApp app showing its preview with the Part's photo, in each language (success criterion 12). It needs a public address that WhatsApp can reach.
- [ ] The motion felt on a real phone, in both schemes, with reduced motion on and off, with no movement felt as a snap.

### 7 November 2026: the records

- **The MVP spec's Order of work** places `browse` after `pricing`, with links to this spec, its code review's fixes, ADR-0013 and ADR-0008's amendment of 7 November 2026, says what it covers and what the owner decided, and that the owner's checks in the browser and the ADR question below are still to be done. The redesign's paragraph now says that the Shopper app's design was planned in this module's tickets 07 and 08, and that its pages pass the inspector at 390 pixels for phones.
- **The Technology section** gains **The browse module's conventions**: the three terms; the rule for a Visible Part, written once, with what its Offers say of it, one statement and one moment, the orders and the Stores (ticket 02's `visiblePart(now)`, `inTheOrderOfAPartsOffers` and the one-statement page and total); the seven public endpoints, each with its answer and its client's function, `readPlatformFigures` and `PlatformFiguresResponse` among them (ticket 15), a Vendor's Offers carrying `part` with its `partNumbers`, a labelled specification's `path` and `kind`, and the 404 codes `PART_NOT_FOUND` and `VENDOR_NOT_FOUND` (ticket 04); the refusals, the list's search, paging and price range, the order of the routes and the measured speed; the filters' statement in the domain, the manufacturer as the list's own parameter and not an entry of the statement (ticket 03), the kinds, the values and how a filter is added; the Shopper's addresses and their query; what a page reads and answers, not found and not answered; the photo's pass-through; the public address; the Shown Price component, with the slip and an Offer's words; previews; the frame and the look, the scheme, the fonts, the photographs, motion and the phone; the stand-in API and `pnpm shopper:inspect`, with the made-up shop, the sheet, the rule that every Shopper page passes it at 1440, 768 and 390 pixels and at 1024 and 1280 for its desk layouts, and this ticket's run as the reference; the Shopper's unit seam, Vitest 4.1.12 and what it tests; and testing at seams 2 and 3, with `changeTheRateAndDeactivateAVendorWhileReading` as seam 2's third named exception, as the owner kept it on 7 November 2026.
- **Elsewhere in the MVP spec.** The commands table gains `pnpm shopper:inspect`, and `pnpm dashboard:inspect` takes `--widths 1440,768,390` and shows every tab with full motion. The projects are twelve and the shared libraries seven, `@pcp/links` in the list, the layout and the table of imports, and the Shopper app's `test` target is named beside the API's, `core`'s and the inspector's (the code review's "not breaches yet"). The settings table already held `SHOPPER_PUBLIC_URL` (ticket 09), and gains `SHOPPER_INSPECTION_DIST_DIR`, which only the inspection sets. The layout names the Shopper app's `test` folder and `instrumentation.ts`, and the import rules the bans on its tests. The testing strategy's last paragraph names Vitest 4.1.12. The accessibility tests' list gains the Shopper's pages and what `expectAccessible` leaves out since ticket 11. The notes that the Shopper's design waits for `browse` (the redesign's paragraph, the design part and the currency switch's) are brought up to date, Fit Diagram and Archivo giving way to the printed price list and its fonts. The redesign's conventions inspect phones at 390, as the owner decided, with the reason and `expectNoSidewaysScroll`, and the pricing part says so of its board's widths. `CurrencySwitch`'s move into the `frame-header` widget is recorded where `pricing` described it (the code review's "not breaches yet"), with the price range it drops and the scheme switch that shares its answer. The dashboard's `western-digits.ts`, `whatsapp.ts` and `callTo` now point at `@pcp/i18n` and `@pcp/links` (ticket 01's follow-ups). The end-to-end tests gain the films' clock, the set-up hook's script, no edit of a served file during a run, and `createAMadeUpPart` taking a test's own names. The toolchain notes gain Nx's shared cache and `tsc --build`'s old times. The phone checks gain this ticket's entry.
- **Checked and left as they were**: the code review's fixes had already recorded the photo route's exception (the layout and the languages' part on the Shopper app) and where `visibleOffer` and `visiblePart` live (the offers module's rule for a visible Offer, and the pricing part's `shown-price-in-the-database.ts`). The new part points to them and does not repeat them.
- **`docs/agents/design-skills.md`** says that this ticket's run is the reference for each Shopper page's WARNs, and gains **Reading what the inspector reports**, from the run's follow-ups: full motion in every tab (ticket 09), one picture of each kind so that 1024 and 1280 need their own (ticket 10), `body-size` naming no element (ticket 11), a folded `<details>` measured as if drawn (ticket 11), `name-only-title` reading one run of text at a time (ticket 13), and Node's fetch on a reset connection (the code review's fixes). What else the follow-ups asked of it, the sheet read from the root's `.taste-skill/` and phones at 390, it already said.
- **This spec's** inspector line records the owner's decision of 7 November 2026, and this ticket's inspector box is worded to match it.
- The Status lines of the spec and of every ticket are left for the owner's answers below.

### 7 November 2026: for the owner, in the owner's own browser

**AWAITING OWNER REVIEW.** Not done in this run, which has no access to the owner's browser. The owner's checkout is on `browse/integration`, its services are running again with its data (above), and its database has every migration. The apps are started from it, by the orchestrator: `pnpm exec nx serve @pcp/api` (3001), `pnpm exec nx serve @pcp/shopper` (3000) and `pnpm exec nx serve @pcp/dashboard` (3002); the Admin console is opened with `DEVELOPMENT_ADMIN_NAME` and `DEVELOPMENT_ADMIN_PASSWORD` from `.env`. The steps are also on the page for the owner, `browse-14/index.html`, under `#checks`. The database holds many made-up test Vendors and Parts from the end-to-end runs, plainly test data.

- [ ] From the home page to a Category, a filter, a Part and its Vendor, in Kurdish and in English, the pages match [DESIGN.md](../../../apps/shopper/DESIGN.md), and Impeccable's design hook raises nothing left unanswered. Steps: http://localhost:3000/ckb; a Category; its filters, two sockets, then Clear all, and a price range; a Part from the list; a Vendor from one of its Offers; then the same in English through the language switch, and in the dark scheme. Impeccable's detector, which runs the rules of its hook over files, found no anti-pattern in the Shopper app's 148 source files (`apps/shopper/src` and `app`); in `libs/ui` it found none either, and gave 7 advisory notes, that the display face's four sizes in `themes/shopper.css` are off the type ramp it read, each being the size the Shopper's DESIGN.md gives its Display, Sheet title, Facts and Label.
- [ ] A Vendor made in the Admin console adds an Offer quoted only in USD. The Shopper sees the Part with that USD price, and in IQD sees a price marked "≈", converted at the Platform Rate and rounded to 250 (success criterion 3). Steps: http://localhost:3002/vendors/new, a made-up Vendor; on its page Open its portal, then Add an Offer for the AMD Ryzen 7 9700X, which no Vendor offers in the database today, quoted only in dollars, for example 359.99 $, in stock; at http://localhost:3000/en/categories/cpu?search=9700X, in Dollars "359.99 $" with no "≈", and in Dinars "≈" before the dollars times the rate to the nearest 250: at the 1,500 the database holds now, "≈ 540,000 IQD"; its Part page shows the same with "Quoted 359.99 $".
- [ ] Deactivating that Vendor removes its page and the Part at once, and reactivating it brings both back. Steps: Deactivate on the Vendor's page in the Admin console, and confirm; the Vendor's Shopper page, `http://localhost:3000/en/vendors/<its id>`, and the Part's page say they are not found, and the Category page searched for 9700X lists nothing; Reactivate brings all three back.
- [ ] The Kurdish and the Arabic texts this module added read naturally (LANG-7's review stays open until launch). Steps: the four pages and the not-found page under `/ckb` and `/ar`; the drafts are in `libs/i18n/src/messages/shopper/ckb.json` and `ar.json`, with `words.md`. One thing to look at: `words.md` still marks دراو, "to choose", as the currency switch's name, while the frame names the switch "Prices in", نرخ بە. The made-up shop's Kurdish and Arabic names, addresses and hours, which only the inspector shows, are drafts for the same review.

### 7 November 2026: the ADR question, for the owner

**AWAITING OWNER REVIEW.** Whether an ADR is needed for any of the module's decisions beyond ticket 08's, ADR-0013. The recommendation, by the rule the owner applied to `offers` and `pricing` (an ADR for the decision whose undoing would lose what cannot be reconstructed, as ADR-0010 and ADR-0012 record, and none for storing dollars in cents or computing Converted Prices in the database): **no new ADR**. `browse` adds no table and no migration, so undoing any of its decisions is a change of code that loses nothing, and each is recorded in this spec, in the MVP spec's new conventions and, for the inspector, in the design skills guide. ADR-0008's amendment of 7 November 2026 already records the one Shopper address with no language. The candidates, each laid out for the owner under `#d1` on `browse-14/index.html`:

- **A stand-in API for looking at Shopper pages, in place of made-up data in the development database** (ticket 06, the owner's choice of 3 November 2026), the ticket's own candidate: no ADR. The made-up shop is code in `apps/inspector`, and seeding it into a database instead would lose nothing; why it was chosen (the Shopper app reads the API on its server, and made-up rows would mix with the owner's data and the tests') and the two rules of the API it must still state are recorded. The other choice put to the owner is one short ADR for it, to keep that reason beside the other decisions.
- **`@pcp/links`, a seventh shared library** (ticket 01, the owner's choice of 4 November 2026): no ADR. Moving its four rules back is moving four files.
- **A fourth test seam, the Shopper app's unit tests, with Vitest** (ticket 05, the owner's choices of 3 November 2026): no ADR, as no library chosen so far has one.
- **Every Shopper page rendered for each request, asking the API with no cache** (the spec): no ADR. Caching in front of the pages is the hosting work's decision, which may want an ADR of its own then.
- **Every visibility rule, Lowest Price, filter and order computed in the API, in one statement with the rate** (the spec): no ADR, as the owner decided for computing Converted Prices in the database on 3 November 2026.

### 7 November 2026: the owner's answers

The owner answered in chat, through the coordinator.

- **The ADR question: "Keep: no new ADR"**, option A. No decision of `browse` has an ADR beyond ADR-0013 and ADR-0008's amendment of 7 November 2026, the stand-in API among them: undoing any of them is a change of code that loses nothing. The MVP spec's Order of work and its conventions now say so.
- **The four checks in the owner's own browser: "Record as to-do."** The owner has not made them. Each stays open above, under "for the owner, in the owner's own browser", still to be done, with its steps as recorded there; nothing is recorded as seen. The MVP spec's Order of work says they are still to be done.
- **Resolved.** With both answered, this ticket's Status and the spec's are `resolved`; tickets 01 to 13 and 15 already were. The checks on a phone keep their boxes open, waiting for hosting, as the MVP spec's list under "Checks on a phone wait for hosting" records, and so do the four checks still to be done in the owner's browser.
