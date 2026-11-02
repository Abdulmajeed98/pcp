# 02: The Platform Rate screen in the Admin console

**Spec:** [the pricing spec](../spec.md)

**What to build:** The Admin console gains Platform Rate, reached from its sections. The screen shows the current Platform Rate on its one leading plate, "1 $ = 1,575 IQD", with the day it was set beside it, and below it a form to set a new one (PRC-1). A save changes the plate at once, with no reload. With no Platform Rate yet, the screen says so, and says what Shoppers see until one is set. The screen is in English, as the whole Admin console is (LANG-1).

**Blocked by:** 01

**Status:** resolved

- [x] **The section.** Platform Rate, at `/platform-rate`, with an icon from lucide, after Expiring Offers in the Admin console's sections, in the sidebar and in the menu sheet. The Admin console's placeholder no longer names it as to come, if it does.
- [x] **The plate.** The screen's one leading plate, as the dashboard's DESIGN.md gives the Platform Rate: "1 $ = 1,575 IQD", written by `formatNumber` and `AlwaysEnglish`, named as one image with its words for a reader, and the day it was set beside it. It is built with the shared `Plate` and `ScreenTitle`.
- [x] **No Platform Rate.** The dashboard's empty state takes the plate's place: no Platform Rate yet, and until one is set, an Offer quoted in one currency is shown to Shoppers in that currency only. The form is below it.
- [x] **The form.** React Hook Form's, with one field for IQD per USD and Save, using `FieldError` and `BusyLabel`. The field takes digits as the Offer form does, through `westernDigitsIn`, and drops separators and spaces. It refuses a value that is not a number itself as `notANumber`, and sends anything else for the API to judge. The API's refusal is shown beside the field, as "The rate is outside the allowed range." without the numbers. No frontend holds the limits.
- [x] **The query.** Under its own key, `['platform-rate']`. A save writes the answer into it, so the plate shows the new rate and today's date at once.
- [x] **The look.** It follows the root DESIGN.md's hard rules and the dashboard's DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules. If the screen needs something DESIGN.md does not say, Impeccable adds it to DESIGN.md before the screen is built. If that leaves a design choice open, the choices are rendered in the built-in browser with realistic, obviously fictional figures, the owner picks one by eye, and the choice is recorded under Comments.
- [x] **The motion.** The plate's change of figures after a save follows DESIGN.md's Motion section and the No Snap Rule, with reduced motion as well as without, through `shared/lib/motion.ts` and no animation library.
- [x] `pnpm platform:check` gains these lines and passes on every line, in a window 360 pixels wide:
  - The Admin reaches Platform Rate from the menu sheet.
  - The Admin sets a rate, and the plate shows "1 $ = n IQD" with today's date, with no reload. The development database is shared, so the test sets a rate of its own and reads only that.
  - A rate typed in Arabic-Indic digits with a separator is saved as its value.
  - A rate out of range is refused beside the field, and the plate keeps the current rate.
  - Given an answer with no Platform Rate through `page.route`, the empty state says so and the form is still there.
  - `expectAccessible` passes on the screen, in the light and in the dark scheme.
  - The plate's change is filmed with `film` and judged by `snapsOf`, with reduced motion and without.
- [x] **Taste's inspector.** `pnpm dashboard:inspect /platform-rate --scheme light --app --widths 1440,768,360`, and the same in the dark scheme, as the empty state and with a rate. Every FAIL is fixed. Every WARN is fixed or defended under Comments, and a defence that is a design choice is put to the owner. The results go under Comments as a table, and the photographs are looked at.
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

### 2 November 2026: the owner's answers, and three directions for the layout

The owner answered the four choices through the coordinator. **1.** The field stays empty after each save. **3.** The icon stays two arrows. **4.** The day stays "Set 30 October 2026". All three are kept as built. **2** was reopened as a fuller design task, in the owner's words: "the current design is so ugly especially on desktop a single field, I want something creative, like be creative some animations, take inspiration from popular design website and designs for example dribbble.com and others."

**Research.** I looked at split-flap boards (Vestaboard and the Solari boards behind it, Priceboard, Framer's Flapboard, the open-source `codemanshan/splitflap`), digit wheels (Number Flow, Framer's Odometer Counter FX), Wise's rate display, Dribbble's exchange dashboards and Stripe's balance. I also found that Erbil's changers quote dinars per 100 dollars. Dribbble's shot pages came back empty to a fetch and Mobbin needs a login, so those two are cited through their gallery and collection pages and the write-ups. The review page has a table of each source, with links, and what was taken from it.

**Taste** (`draw.mjs --app --kind finance … --keep palette,type --options 3`) dealt two whole styles, pastel-consumer and achromatic-ledger, not layouts within the chosen Framed sheet. Its Framed sheet sheet has no pattern for a screen like this. So the directions come from the research, built inside Framed sheet and the Rate Board, under Taste's app-screen rules: the largest thing answers the screen's question, the evidence sits beside the answer, and nothing is invented. **Emil's** rules set the motion: transitions and the Web Animations API, the three curves, 150 ms exits, a stagger only on this rare and consequential press, and a fade, never a jump, with reduced motion. **Impeccable** has recorded nothing yet: DESIGN.md changes only once the owner picks a direction.

**Three directions**, each a live demo in the owner's checkout at `.taste-skill/pricing-02/directions/`, built in the dashboard's tokens and its own Geist files. Each one sets a new rate every few seconds, can be opened and used, and has a reduced-motion version. The review page shows each at 1440 and 360, light and dark.

1. **A, the changer's board.** Four fixed split-flap tiles fill a Raised Stone field, with the form in a column beside them. As the Admin types, a muted plate shows the rate that will go up on the board. On Save, each changed tile flips: the top half falls in 150 ms, then the bottom half in 150 ms, the tiles 40 ms apart. With reduced motion, each changed tile fades. In DESIGN.md this needs a plate drawn as tiles, a Motion 9 exception and the new preview plate.
2. **B, the rate's ledger.** The plate's digits roll like wheels: 200 ms on the in-out curve, the lowest place first, 30 ms apart. Beside the plate, a ledger lists every setting with its day and who set it, and a new setting arrives as a row does. **This needs a new endpoint for the owner to approve**, such as `GET v1/platform-rate/settings`. The API keeps every setting but lists none, so the demo's rows are made up. In DESIGN.md this needs a Motion 9 exception and a new list.
3. **C, the changer's window.** One very large plate is centred on a Raised Stone field that fills the sheet. The rate is typed on the plate itself, after "Change the rate". On Save, the new figure fades in while the width follows (Motion 10 as built). DESIGN.md's motion is unchanged.

**AWAITING OWNER REVIEW** on the direction: `.taste-skill/pricing-02/index.html`, `#d1` to `#d3`, the list under `#ask`. Once the owner picks one, it is built in the app, recorded in DESIGN.md by Impeccable, and the films, the end-to-end lines and Taste's inspector are run again.

### 2 November 2026: the owner chose the changer's board, built

**The owner's choice**, through the coordinator, in their words: "I like direction A". That is **A, the changer's board**, over **B, the rate's ledger** (the digits rolling like wheels, with a ledger of every setting that would have needed a new endpoint) and **C, the changer's window** (one very large plate, the rate typed on it in place). Choices 1, 3 and 4 stand as answered. While I was away, the coordinator fixed the review page's demo of C: its autoplay had taken focus inside its frame and scrolled the page. Nothing in the app takes focus on its own.

**Commits** on `pricing/02-the-platform-rate-screen`, each gated on `pnpm check` on exactly what it holds, and both again in a fresh clone with Docker unreachable and no browser (both passed):

1. `6165a47` `docs(dashboard)`: **DESIGN.md first**, through Impeccable's `document` (merge mode).
   - The Platform Rate's leading plate becomes the changer's board, with the owner's choice and the two alternatives named.
   - **Plate Tile** (`#2f3335`, dark `#121212`, Plate Amber on it at 6.9:1 and 10.1:1) and its split join the colours and the front matter.
   - A **Board figure** size is added.
   - The form is beside the board's field from 64rem, with its heading and the rate as typed on a muted plate.
   - The empty state sits in the board's field without Rule lines.
   - **Motion 10** is rewritten as the flip, with its reduced-motion row, and Motion 9 names the board as its one exception.
2. `267ca03` `feat` (dashboard, `libs/ui`'s theme and e2e, so no scope): the board.

**The board** (`pages/platform-rate/ui/rate-board.tsx`) sits on the shared `Plate`'s `lead`: "1 $ =", four split-flap tiles, "IQD".
- The tiles are a fixed four, with the comma between the first and the second. Under 1,000 the first tile is blank and the comma fades out, so the board's width never changes.
- Each tile is two halves of its digit on Plate Tile with a 2-pixel split, `perspective` on the tile and `backface-visibility: hidden` on its leaves. The sizes are 94 by 140 pixels with 112-pixel figures from 64rem, and 36 by 56 with 42-pixel figures below it, all in `rem`.
- The board is drawn left to right in an `AlwaysEnglish` hidden from a reader, beside "1 dollar is 1,575 dinars" in words.
- A changed digit flips through the new `aFlap` in `shared/lib/motion.ts` (150 ms a half on the out curve, 40 ms a tile), with the Web Animations API on `rotateX`. The old top half falls to its edge over the new top half. Then the new bottom half lands over the old one, and only then are the leaves taken away, over halves that already show the new digit. Each tile goes straight from its old digit to its new one.
- With reduced motion there is no flip: the old digit fades out over the new, which fades in (`aFade`).

**The screen** (`platform-rate-page.tsx`):
- Under the title, a Raised Stone field holds the board, the day ("Set 30 October 2026", in a `ChangingInPlace` on its width) and the sentence; or the empty state, the sketch or the refusal, in a `ChangingInPlace` on its height.
- From 64rem the field fills the sheet's height and the form stands beside it in an 18-24rem column, centred in that height. On a phone the form goes below the field.
- The form (`rate-form.tsx`) gains "Set a new rate" as its heading and "On the board after Save" with the rate as typed on a small muted plate (`useWatch`, read through `rateIn`, the comma in Geist). The line only repeats the typed rate and converts nothing. Everything else about the form is as before.
- The old `rate-plate.tsx` is removed.

**The lines that changed in `admin-platform-rate.spec.ts`**, all still at 360 pixels:
- The plate is read as the board: its words, and the `data-digit` of its four tiles once no leaf is turning and no digit is fading (`expectTheBoardToShow`).
- The setting line also checks "On the board after Save" with the rate as typed.
- The two films of the plate now film the board: a 3-digit rate replaced by a 4-digit one whose last digit differs.
  - Without reduced motion, the last tile's falling and landing halves are each seen part-way through their height, with no snap by `snapsOf`.
  - With reduced motion no leaf ever appears, and the old digit is seen part-faded.
  - In both, the board's width and the form hold still.
- The films of the first rate check that the form moves with the field, more than 10 pixels with no snap. On a phone the board, the day and the sentence take another height than the empty state did. No assertion was weakened; the old width checks went with the figure's width, which no longer changes.
- All 10 lines passed on the first run of the board, and again with the preview check added.

**The faults**, each planted by the script on the committed tree (`267ca03`), the spec run under the lock, and reverted by the inverse edit; `git status` was clean after each:

| Fault | Lines that failed | Why |
|---|---|---|
| The save no longer writes the answer into the query | Sets a rate; Arabic-Indic digits; both board films; both first-rate films (6 of 10) | The board kept the old rate: its words "1 dollar is 1,477 dinars" where 4,386 was saved, and the empty state stayed |
| The digits not passed through `westernDigitsIn` | Arabic-Indic digits (1 of 10) | The form found no number and sent nothing; the wait for the `PUT` timed out |
| The flip made instant (`aFlap`'s halves 1 ms, no stagger), added to show the film can fail | The board's film without reduced motion (1 of 10) | "the top half falls through every height": no frame caught a half part-way |

**Taste's inspector** on `267ca03`, run the same way as before (the made-up shop's rate, and `--no-platform-rate`), at 1440, 768 and 360. The photographs are in the owner's checkout at `.taste-skill/pricing-02/inspect/platform-rate-*-board/`; I looked at every width of each run.

| Run | FAIL | WARN | The WARN |
|---|---|---|---|
| With a rate, light | 0 | 1 | `mixed-font-headline` at 1440 and 360 |
| With a rate, dark | 0 | 1 | The same |
| No rate, light | 0 | 0 | |
| No rate, dark | 0 | 0 | |

`hero-void` and `panel-void` are gone: the board's field fills the sheet beside the form. `mixed-font-headline` is defended as before, by an existing choice of the owner's and not a new one: the board's digits are Geist Mono and its comma and units Geist, as on every plate since redesign ticket 04. From the photographs: at 768 the board keeps its phone size inside a full-width field, as DESIGN.md gives every size below 64rem.

**For the owner, not in the app's way:** the Board figure (7rem from 64rem, 2.625rem below it) is outside the root DESIGN.md's shared type scale, which lets a look set only a title's and a button's size of its own. The owner chose the board by eye at this size, and no hard rule is broken (no text under 14 pixels, contrast held, sizes in `rem`), so the screen is built at it. Whether the root's rule should name the board as a look's third size of its own is a change beyond this screen, so it is in the follow-ups for the owner and not made here.

**Checks on the board's tip:** `pnpm check` passes; each new commit passes in a fresh clone with Docker unreachable. `pnpm platform:check` under the lock: **270 passed**, none failed or flaky (12.5 minutes). `pnpm integration:check` last passed (404 tests) on `a7c1e3f`; no API code has changed since. The branch holds the current `pricing/integration` tip, `5c82ed5`, already merged in `a7c1e3f`. Every box is ticked: the look is the owner's choice, built and recorded, and the inspector's one WARN is defended by the owner's earlier choice.
