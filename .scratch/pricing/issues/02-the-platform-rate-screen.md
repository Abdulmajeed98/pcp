# 02: The Platform Rate screen in the Admin console

**Spec:** [the pricing spec](../spec.md)

**What to build:** The Admin console gains Platform Rate, reached from its sections. The screen shows the current Platform Rate on its one leading plate, "1 $ = 1,575 IQD", with the day it was set beside it, and below it a form to set a new one (PRC-1). A save changes the plate at once, with no reload. With no Platform Rate yet, the screen says so, and says what Shoppers see until one is set. The screen is in English, as the whole Admin console is (LANG-1).

**Blocked by:** 01

**Status:** ready-for-agent

- [x] **The section.** Platform Rate, at `/platform-rate`, with an icon from lucide, after Expiring Offers in the Admin console's sections, in the sidebar and in the menu sheet. The Admin console's placeholder no longer names it as to come, if it does.
- [x] **The plate.** The screen's one leading plate, as the dashboard's DESIGN.md gives the Platform Rate: "1 $ = 1,575 IQD", written by `formatNumber` and `AlwaysEnglish`, named as one image with its words for a reader, and the day it was set beside it. It is built with the shared `Plate` and `ScreenTitle`.
- [x] **No Platform Rate.** The dashboard's empty state takes the plate's place: no Platform Rate yet, and until one is set, an Offer quoted in one currency is shown to Shoppers in that currency only. The form is below it.
- [x] **The form.** React Hook Form's, with one field for IQD per USD and Save, using `FieldError` and `BusyLabel`. The field takes digits as the Offer form does, through `westernDigitsIn`, and drops separators and spaces. It refuses a value that is not a number itself as `notANumber`, and sends anything else for the API to judge. The API's refusal is shown beside the field, as "The rate is outside the allowed range." without the numbers. No frontend holds the limits.
- [x] **The query.** Under its own key, `['platform-rate']`. A save writes the answer into it, so the plate shows the new rate and today's date at once.
- [ ] **The look.** It follows the root DESIGN.md's hard rules and the dashboard's DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules. If the screen needs something DESIGN.md does not say, Impeccable adds it to DESIGN.md before the screen is built. If that leaves a design choice open, the choices are rendered in the built-in browser with realistic, obviously fictional figures, the owner picks one by eye, and the choice is recorded under Comments.
- [x] **The motion.** The plate's change of figures after a save follows DESIGN.md's Motion section and the No Snap Rule, with reduced motion as well as without, through `shared/lib/motion.ts` and no animation library.
- [x] `pnpm platform:check` gains these lines and passes on every line, in a window 360 pixels wide:
  - The Admin reaches Platform Rate from the menu sheet.
  - The Admin sets a rate, and the plate shows "1 $ = n IQD" with today's date, with no reload. The development database is shared, so the test sets a rate of its own and reads only that.
  - A rate typed in Arabic-Indic digits with a separator is saved as its value.
  - A rate out of range is refused beside the field, and the plate keeps the current rate.
  - Given an answer with no Platform Rate through `page.route`, the empty state says so and the form is still there.
  - `expectAccessible` passes on the screen, in the light and in the dark scheme.
  - The plate's change is filmed with `film` and judged by `snapsOf`, with reduced motion and without.
- [ ] **Taste's inspector.** `pnpm dashboard:inspect /platform-rate --scheme light --app --widths 1440,768,360`, and the same in the dark scheme, as the empty state and with a rate. Every FAIL is fixed. Every WARN is fixed or defended under Comments, and a defence that is a design choice is put to the owner. The results go under Comments as a table, and the photographs are looked at.
- [x] Shown once and then reverted, each failing its own test: the save no longer writing the answer into the query (the plate keeps the old rate until a reload); the digits not passed through `westernDigitsIn`.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 2 November 2026: what was built

On branch `pricing/02-the-platform-rate-screen`, from `pricing/integration` at `ab25e1b`, in three commits, each gated on `pnpm check`'s exit status on exactly what it holds (a script set every other changed file aside), and each again in a fresh clone with `pnpm check --skip-nx-cache`, `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`: all three passed.

1. `e6d1448` `docs(dashboard)`: **DESIGN.md first**, with Impeccable's `document` (merge mode), before any screen code: the Platform Rate's leading plate (its equals sign in Plate Unit, its words for a reader, the day beside it from 40rem and below it on a phone, the sentence under it, the still sketch while it is read), **The Platform Rate's form** under Fields, **No Platform Rate** under States, the section among the Admin console's sections, and **Motion 10**, the plate taking a new rate, with its row in the reduced-motion table and a note in Motion 9 that the plates are otherwise still.
2. `8f6e029` `feat` (dashboard, `libs/api-client`'s index and e2e, so no scope): the screen.
3. `561be3d` `feat(inspector)`: the made-up shop answers the Platform Rate (below).

**The screen** (`apps/dashboard/src/pages/platform-rate/`): the section at `/platform-rate`, after the Expiring Offers in the sidebar and the menu sheet, with lucide's `ArrowRightLeftIcon` (choice 3). The Admin console had no placeholder naming the Platform Rate as to come, so nothing was taken out. Under `ScreenTitle`, the head is one of four states, in a `ChangingInPlace` so that it never jumps: the plate, the empty state, a still Raised Stone sketch of the plate while it is read (with an `output` for a reader), or a refusal panel if it could not be read. The plate is the shared `Plate`'s `lead`: "1 $ = 1,575 IQD", every figure written by `formatNumber`, the comma in Geist as on every plate, drawn in an `AlwaysEnglish` hidden from a reader, beside a visually hidden "1 dollar is 1,575 dinars", which is what is read (the Offer plate's pattern; a `role="img"` with a label was refused by Oxlint's `prefer-tag-over-role`, and no rule was switched off). The day, "Set 30 October 2026", is `en-GB` long with Western digits in the Admin's own time zone, beside the plate from 40rem and below it on a phone, so that a wider figure never pushes it to the next line (which the film of a 3-digit to 4-digit rate would see as the form jumping). Then one Note Grey sentence: "Every Converted Price follows this rate. A price a Vendor quoted is never changed by it."

**The form** (`rate-form.tsx`, React Hook Form): one field, "New rate", `inputMode="numeric"`, left to right, nothing to fill or spell-check, described by "Whole dinars for one dollar, such as 1,575." and by its refusal; Save as the pane's one primary button with `BusyLabel` ("Saving…"), as wide as the form on a phone; the form at most 40rem wide (choice 2). `rateIn` (`model/rate-typed.ts`) takes the typed text through `westernDigitsIn` and drops a comma, `٬`, `،` and spaces of any width, as the Offer form does; nothing typed is refused by the form as `missing` ("Enter the rate, such as 1,575.") and anything that is not then a number as `notANumber` ("Enter a number, such as 1,575."), neither sent. Every number is sent, a fraction and a rate out of range too. The API's reasons are said beside the field through `setRefusalsBesideTheirFields`, which also gives the field the focus: `notWhole` "Enter a whole number of dinars, such as 1,575.", `outOfRange` "The rate is outside the allowed range.", without the numbers; no frontend holds the limits. A refusal naming no field, or an API that cannot be reached, is the refusal panel above Save in an `OpeningSpace`, with `WhyNotAnswered`. Once saved, the field is emptied (choice 1), and an `output` tells a reader "Platform Rate set: 1 dollar is 1,600 dinars."

**The query** (`api/platform-rate.ts`): `['platform-rate']`, a key no other query is under. `useSetPlatformRate`'s `onSuccess` writes the PUT's answer into it with `setQueryData`, so the plate shows the new rate and today's date with no second read and no reload.

**The motion** (Motion 10, `shared/ui/changing-in-place.tsx`, new and shared): when its key changes, the old content is kept, inert and hidden from a reader, laid over the new at its start, and fades out in 150 ms while the new fades in, 200 ms, both on the out curve and the same with reduced motion (`aFade`, new in `shared/lib/motion.ts`); its own width or height follows from the old to the new with the Web Animations API through `aMovement('ease-in-out')`, 200 ms on the in-out curve or 150 ms on the out curve with reduced motion, clipped to itself while it moves. A `ResizeObserver` keeps the size as it is drawn, frame by frame, so that a change while one is under way starts from where it is. The rate's figure and the day each take one on its width; the screen's head takes one on its height, so that the first rate takes the empty state's place with the form rising. No animation library. Emil's `emil-design-eng` was asked the concrete question first (the frequency is rare, the purpose is state indication and keeping the layout from jumping, a cross-fade laid over in place with the size following, no blur since DESIGN.md has none); its answer is what Motion 10 records.

**How it was built.** With `mattpocock-skills:tdd`, at the spec's seam 3, which the owner confirmed on 2 November 2026: `apps/e2e/src/admin-platform-rate.spec.ts`, ten lines in a window 360 pixels wide, all red first for the right reason (the run found no section link in the menu sheet, no heading, no plate, no empty state, each waiting for an element the screen did not have yet), then green. The first green run failed only the two films of the first rate: the second showed the form moving 46 pixels in one frame. A trace found two causes: the film began while the screen's first answer was still opening its space, and the first change measured where an interrupted movement was from a forced layout, which gave the size it was going to rather than the size drawn. The films now wait until nothing moves before they start (`untilStill`), and `ChangingInPlace` takes its starting size from the `ResizeObserver`'s last drawn frame. All ten then passed, and passed again in each later run. Then the inspector's shop, at seam 1 (`made-up-shop.spec.ts`, three new tests, two red on the missing answer and the ignored option, then green). Design skills: Impeccable (`impeccable context` once, then `document`), Emil (`emil-design-eng`), and Taste through its inspector; none refused to load. Impeccable's own check asked to probe the owner once with a question tool; this run has none and the owner is not answering, so the choices are on the review page instead.

**The made-up shop and `--no-platform-rate`.** The development database's rate is whatever the end-to-end tests last set, and once one is set the empty state cannot be seen again, since no rate is deleted. The inspector's shop now holds 1,575 dinars to the dollar, set three days before, and answers `GET /v1/platform-rate`; `pnpm dashboard:inspect … --no-platform-rate` makes it answer `{ current: null }`. A `PUT` is refused, as every write is. `docs/agents/design-skills.md` says so.

### 2 November 2026: `pnpm platform:check`'s new lines

In `admin-platform-rate.spec.ts`, at 360 pixels wide, each test setting a rate of its own, random within the limits, and reading only that:

| Line | What it checks |
|---|---|
| The menu sheet | The sections are Catalog, Vendors, Missing specifications, Expiring Offers, Platform Rate, in that order; the last opens `/platform-rate` with its `h1` |
| Sets a rate | The plate shows "1 $ = n IQD", its words "1 dollar is n dinars", the drawn figures hidden from a reader, "Set" and today's date, the field emptied, the page not loaded again (a mark set on `window` before the save is still there), nothing scrolls sideways |
| Arabic-Indic digits | A random rate typed in Arabic-Indic digits with `٬` between the thousands and spaces around, such as " ٢٬٤٠١ ", is sent as its value, `{ iqdPerUsd: 2401 }`, and shown on the plate |
| Out of range | The rate with a 0 added is answered 400 and refused beside the field, "The rate is outside the allowed range.", the field invalid, described by it and focused, the plate keeping the rate; then "about 1500" is refused as not a number and nothing is sent |
| No rate | Through `page.route`, the empty state (icon above the title, plain, centred) says "No Platform Rate yet" and what Shoppers see, no plate, the form still there, nothing sideways |
| Accessible | `expectAccessible` in light and dark, with a rate and a refusal showing, and again with no rate |
| The plate's change, ×2 | Filmed with `film`, slowed four times, with and without reduced motion: a 3-digit rate replaced by a 4-digit one; the figure's width grows by more than 15 pixels with no snap by `snapsOf`, the old figure and the new are each seen part-faded, and the form does not move |
| The first rate, ×2 | The same, from the empty state: the form rises by more than 40 pixels with no snap |

### 2 November 2026: the faults

Each planted by a script on the committed tree (`8f6e029`), the Platform Rate's spec run under the e2e lock, and reverted by the inverse edit; `git status` was clean after each.

| Fault | Lines that failed | Why |
|---|---|---|
| The save no longer writes the answer into the query (`setQueryData` replaced by a no-op) | Sets a rate; Arabic-Indic digits; both films of the plate's change; both films of the first rate (6 of 10) | The plate kept the old rate: "1 $ = 1,268 IQD" where 2,401 was saved, and the empty state stayed |
| The digits not passed through `westernDigitsIn` | Arabic-Indic digits (1 of 10) | The form found no number in the Arabic-Indic digits and refused them, so no `PUT` was sent and the wait for it timed out |

### 2 November 2026: Taste's inspector

`pnpm dashboard:inspect http://localhost:3002/platform-rate --scheme light|dark --app --widths 1440,768,360`, with the made-up shop's rate and with `--no-platform-rate`, the direction restored from `apps/dashboard/design/taste/direction.json`, the API and the dashboard started from the worktree under the e2e lock and stopped after. Photographs in the owner's checkout at `.taste-skill/pricing-02/inspect/`; I looked at each width of each run.

| Run | FAIL | WARN | The WARNs |
|---|---|---|---|
| With a rate, light | 0 | 3 | `mixed-font-headline` at every width; `hero-void` (53% of the first screen) and `panel-void` (484 pixels) at 1440 |
| With a rate, dark | 0 | 3 | The same |
| No rate, light | 0 | 2 | `hero-void` (47%) and `panel-void` (410 pixels) at 1440 |
| No rate, dark | 0 | 2 | The same |

- **`mixed-font-headline`**, defended: the plate's digits are Geist Mono and its comma, units and equals sign Geist, as the owner chose for every plate in redesign ticket 04 and DESIGN.md's Typography records; redesign ticket 12's leading plate drew the same WARN.
- **`hero-void` and `panel-void`**, a defence that is a design choice, so it is put to the owner (choice 2): the form keeps a 40rem column as the Offer form does, and a short screen leaves the sheet below and beside it empty at a desk.
- **From the photographs**, one change was tried and undone: the three spaces of the plate are Geist Mono cells, which reads airy around the equals sign; spaces in Geist set the sign against "1,575" and left "1 $" wide, which read worse, so the plate keeps the Offer plate's spacing.

### 2 November 2026: checks

- `pnpm check` before each commit, on exactly what it held; each commit again in a fresh clone with Docker out of reach and no browser (`e6d1448`, `8f6e029`, `561be3d`: all passed).
- The Platform Rate's spec, under the lock: 10 passed on `8f6e029`, and again with the capture spec for the review page (16 passed).
- **Merged with `pricing/integration`** at `5c82ed5` (tickets 03 and 04), no conflict, in `a7c1e3f`: `pnpm check` passed; `pnpm integration:check` passed, 404 tests in 14 files; `pnpm platform:check` under the lock: **270 passed**, none failed or flaky (12.5 minutes).

### 2 November 2026: for the owner

**AWAITING OWNER REVIEW.** The review page is `.taste-skill/pricing-02/index.html` in the owner's checkout (served from `.taste-skill` on port 4110 as `/pricing-02/`): the screen at 360 (`#r1`) and 1440 (`#r2`) in both schemes, with a rate, refused and with none; the plate taking a new rate, slowed tenfold (`#r3`); the inspector (`#r4`); and the choices (`#q1` to `#q4`). Every picture is the running app, the rate answered by the capture so nothing was written.

1. **The field starts empty and is emptied once a rate is saved** (built). Or it starts with the current rate, so that checking it again is one press of Save.
2. **From 64rem the form keeps its 40rem column under the plate**, the sheet's end side empty (built; the inspector's `hero-void` and `panel-void`). Or the form beside the plate on the end side from 64rem.
3. **The section's icon is two arrows, one each way** (built). Or a banknote.
4. **The day beside the plate is the day itself, "Set 30 October 2026"** (built, as the ticket words it). Or how long ago, "Set 3 days ago", as an Offer's Confirmation says it.

The boxes for the look (the owner picks the open choices by eye) and for Taste's inspector (a defence that is a design choice) stay open, and the Status with them, until the owner has answered.
