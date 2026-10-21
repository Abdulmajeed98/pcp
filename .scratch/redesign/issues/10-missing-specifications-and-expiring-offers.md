# 10: Missing specifications and Expiring Offers

**Spec:** [the redesign spec](../spec.md)

**What to build:** The Admin console's two lists of work to do are rebuilt to the new DESIGN.md: Missing specifications, the Parts with an Offer that lack a specification a Compatibility Rule needs (CAT-8), and Expiring Offers, the Vendors to remind, with their WhatsApp links.

**Blocked by:** 07

**Status:** resolved

- [x] Missing specifications and Expiring Offers follow the new DESIGN.md and move as its Motion section says. The Part's edit form under Missing specifications is ticket 08's and is not laid out here.
- [x] Each passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command, Expiring Offers with the fixture's Offers about to expire.
- [x] Emil's `break-ui` is run on both lists: a long name, many gaps, an empty list. What broke is fixed.
- [x] `expectAccessible` passes on both, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [x] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [x] The screens are shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building them taught something.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 22 October 2026: what was built

On branch `redesign/10-missing-specifications-and-expiring-offers`, from `redesign/integration` at `c106b49`, in pieces, each gated on `pnpm check`'s exit status right before it was made:

1. `feat(ui)`: the dashboard's theme gains `leaves`, DESIGN.md's Motion 8: a row marked `data-leaving` (on itself, or on its table row) fades in 150 ms on `--ease-out`, then its space closes, `grid-template-rows` from `1fr` to `0fr`, in 200 ms on `--ease-in-out` after it; with reduced motion it fades, then the space closes at once.
2. `feat(dashboard)`: Missing specifications. From 64rem a table across the sheet: Part (its manufacturer and Category below its name in Note Grey, half the table), Offers (the count alone, end aligned) and Lacks (the labels alone in Action Red after the circled exclamation mark). Once a Part is opened, the list keeps seven twelfths and ticket 08's edit form five, past an Edge line, the open row on Active Stone, as the Catalog does. On a phone, two-line rows with the red "Lacks …" line. No row carries a picture any more (DESIGN.md's "No picture on a row"). The list stays drawn while a Part is opened, so the Part whose gaps were just filled is seen leaving it. `useLeavingRows` (`shared/lib`) keeps a row the same page dropped in its place, marked as leaving and inert, for 400 ms; a new page and the count change at once, and a row that comes back while leaving returns from where it is. The shared `PagedList` (used only by these two screens) says its count in words on the end side, as the Catalog does, takes an optional `rows` to draw a table, and closes leaving rows; `SketchedRows` sketches still rows, one line from 64rem and two on a phone, and takes `wide` in place of its own row shape.
3. `feat(dashboard)`: Expiring Offers. From 64rem a table across the sheet (it no longer stops at 42rem): Vendor, Offers (why, in Action Red), Phone and WhatsApp, each number an underlined link of its own, as high as a control, above the row's link to the Vendor's page; on a phone, the name, why, and the two numbers on one line. A Vendor the list drops while the Admin is on it leaves as Motion 8 says.
4. `fix(dashboard)`: break-ui's and the inspector's findings (below).
5. `docs`: DESIGN.md, and this record.

The shared pieces touched, for the other screen tickets: `libs/ui/src/themes/dashboard.css` (a new `@utility leaves`, after `arrives`; ticket 11 or 12 may want it for Confirm all's rows leaving Need confirming, and should reuse it rather than add another), `shared/lib/index.ts` (one export added), and `shared/ui/paged-list.tsx` (changed, used by no other screen). No shared component was restyled.

### 22 October 2026: how each skill was run

- **`mattpocock-skills:tdd`**, loaded through the Skill tool. The owner was not answering, so I chose the seams as tickets 01 and 07 did: the Admin console in a real browser through Playwright, in the two screens' own spec files; the dashboard has no unit tests. Red first, each for the right reason: Missing specifications' phone test failed on the row's picture (1 where 0 was asked), both desk tests waited for a table that did not exist, and Expiring Offers' leaving test found no row marked as leaving. All ten passed at the first green run. The break-ui fixes were tested first too: their assertions failed on the heading 8 pixels before its column's text, then passed. Each red run waits for the e2e lock that five implementers share, so each screen was one vertical slice of a few tests rather than one test a run.
- **Taste** (`design-taste-frontend`, its app-screens chapter) for the layout, inside the chosen sheet restored into `.taste-skill/` (its allowances: none): each screen's question ("Which Parts with an Offer lack what a rule reads?", "Whom do I remind, and how do I reach them?"), the identity column the widest, two measures stacked in the Part's cell, numbers end aligned, one red mark a row, the count stated above the table, the list across the sheet. `inspect.mjs --app` through `pnpm dashboard:inspect` (below).
- **Emil**: `emil-design-eng` with the concrete question of how Motion 8 is built for a table row (which cannot be a grid) and a list item, how it is interrupted, and what stays still. Its answer: transitions, not keyframes, so that a row that comes back retargets; the grid on each cell's content with the padding inside it; paging and the count still. `break-ui` on both lists (below).
- **Impeccable** (`impeccable`, `impeccable context --target apps/dashboard/src`, then its `document` for the record): DESIGN.md is corrected where building taught something (below). No skill refused to load.

### 22 October 2026: Emil's break-ui on both lists

The worst case entered at the API's boundary: a throwaway capture spec (deleted before the commits) answered the two lists' calls in the browser. Missing specifications: the catalog's longest real name (the Corsair H100i, 276 characters), the MSI MAG B650 TOMAHAWK lacking every one of a motherboard's 11 needed specifications (read from `/v1/categories`) with 37 Offers, the Ryzen 7 7800X3D lacking one, the DeepCool LS720 SE's 210 characters, 1,284 Parts over 65 pages. Expiring Offers, made-up Vendors only: a name at the API's limit of 100 characters with 128 Expired Offers and 312 about to expire, "Jo", a made-up Kurdish name that wraps, no WhatsApp twice, 47 Vendors over 3 pages. Also Empty, and One (every count at 1). Seen at 1440, 768 and 360 in both schemes, and at 1440 with a Part opened beside the list. The toggle (Demo data, Worst case, Empty, One, with the width and the scheme) is on the review page; none was added to the app.

| # | Severity | Field | Worst case | What happened | Fix |
|---|---|---|---|---|---|
| 1 | Ugly | the first column's heading | any row, both tables | "Part" and "Vendor" stood 8 pixels before their column's text: `TableHead`'s own `first:ps-0` outweighed `ps-2` | `first:ps-2` on both screens' first heading (`part-row.tsx`, `vendor-row.tsx`), measured by a test |
| 2 | Ugly | Expiring Offers' name and why | every row from 64rem | 6 pixels above the middle of the numbers' links: the cell's `min-h-control` counted its padding | A cell of words sets its first line at half a control less half a line (`pt-[calc(var(--spacing-control)/2_-_0.25rem)]`), under a mouse or a finger; measured by a test |
| 3 | Fragile | Missing specifications' Offers | (Taste's inspector, `numeric-align`) | the count was end aligned in its content but not its cell | the cell is end aligned too; checked by a test |

**What held up**: nothing scrolls sideways at any width in any dataset (measured on every capture); "1 Part missing specifications", "1 Vendor to remind", "1 Offer", "1 Expired Offer"; every count grouped ("1,284", "Page 1 of 65"); a 276-character name and 11 labels wrap in full without pushing a column off; a Kurdish name keeps its own direction inside the column's start edge; "No WhatsApp"; both empty lists say the work is done with a circled tick.

**Decisions, for the owner**: a long name and a long run of labels wrap in full (choice 3 below).

**Seen in passing, not changed**: the Catalog's table (ticket 07, closed) has the same heading rule as finding 1, so its first column's heading and text stand 8 pixels before its title; the fix is one class in `pages/catalog/ui/parts-found.tsx`.

### 22 October 2026: tests that changed, and why

No test lost an assertion.

- `admin-missing-specifications.spec.ts`: `listedParts` reads a table's rows from 64rem as well as the phone's list items, as DESIGN.md lays the list out as a table there. The phone test adds that the row has no picture. New at 1280 pixels: the table's three headings, "Lacks" reading "TDP" and the Offers "1", the Category, no picture, the first heading on its column's edge, the Offers cell end aligned, the count in figures and no plate, the table across the sheet, no sideways scroll and `expectAccessible` in light and dark; and a Part opened from its row showing its edit form beside the list (the row `aria-current`, the list under seven twelfths), then, once saved, its row seen leaving with Motion 8's two transitions and inert, then gone.
- `admin-expiring-offers.spec.ts`: `listedVendors` reads a table's rows from 64rem too. New: a Vendor the list drops while the Admin is on it (the list asked again as when the window regains focus) leaves with Motion 8's transitions and inert, and with reduced motion the fade and a space closing at once (`0s` after `0.15s`); at 1280, the table's four headings, why, the call and chat links, "No WhatsApp", the count, no plate, the first heading on its column's edge, the name and why level with the call link's middle, the table across the sheet, no sideways scroll, `expectAccessible` in light and dark, and the row leading to the Vendor's page.
- New helper `apps/e2e/src/leaving-rows.ts`: the page records each row marked `data-leaving` as it is marked, with its transitions, since a row leaves in a few hundred milliseconds.

### 22 October 2026: DESIGN.md corrected

With Impeccable's `document`, where building taught something: in Layout, a column's heading starts where its column's text does while the rows bleed 8 pixels, a figure's cell is end aligned with it, and a list with no tabs and no filters keeps the filter bar's line for its count alone; Missing specifications joins the Catalog and the Vendors in keeping its list at the whole width until a Part is opened; A Part missing specifications and A Vendor to remind say their table's columns from 64rem (and the first, no picture); Motion 8 names these two lists, the theme's `leaves`, where the padding lies, and that a row leaves only when the same page is answered again without it.

### 22 October 2026: the checks

- `pnpm check` passed before each commit, on exactly what was committed (the pieces were laid out by copying, without stash or reset).
- The two screens' spec files, under the scratchpad's e2e lock: 10 passed at the first green run, and 10 again after the break-ui fixes.
- **Taste's inspector**, `pnpm dashboard:inspect <address> --scheme light|dark --app --widths 1440,768,360`, the API and the dashboard started from the worktree under the lock, Expiring Offers answered from ticket 01's made-up shop (its Vendor with 2 Expired Offers and 3 about to expire). First run: 0 FAIL; Missing specifications 1 WARN (`numeric-align`, fixed), Expiring Offers 2 WARN. Second run, on the fixes: Missing specifications **0 FAIL, 0 WARN** in both schemes; Expiring Offers **0 FAIL, 2 WARN** in both, `hero-void` and `panel-void` at 1440: one Vendor to remind leaves the sheet's lower part white. Defended: the sheet is the frame (DESIGN.md's Layout, ticket 07), and a work queue whose aim is to be empty is drawn at its true size; put to the owner as choice 6. The photographs are in the owner's checkout at `.taste-skill/redesign-10/inspect/`.
- `expectAccessible` passes on both, in light and dark: on a phone (the existing tests) and at 1280 pixels (the new ones).
- Nothing was written to the development database by the redesign's tooling: the captures and the inspector only read, and every worst case was answered in the browser. The end-to-end tests made their own made-up Parts, Vendors and Offers, as they always do.
- `pnpm platform:check` on the code's tip, `6d82483`, under the lock: **174 passed**, none failed or flaky (5.7 minutes), every other screen among them.
- `redesign/integration` had not moved since this branch was cut (`c106b49`), so there was nothing to merge.

### 22 October 2026: for the owner

The review page is `.taste-skill/redesign-10/index.html` in the owner's checkout (served from `.taste-skill` on port 4110): Missing specifications at 1440 in light and dark (`#r1`), a Part opened beside it with the demo and the worst case (`#r2`), at 768 and 360 (`#r3`); Expiring Offers at 1440 (`#r4`), at 768 and 360 (`#r5`); films of a row leaving at 1440 and 360 with full and reduced motion (`#r6`); break-ui's Demo data / Worst case / Empty / One toggle at all three widths in both schemes, with its findings (`#r7`); the inspector's results (`#r8`); and the choices (`#q`). Missing specifications shows the development database's own Parts; Expiring Offers, which the API cannot show without Offers made old, shows made-up Vendors.

Choices to confirm or change:

1. **Missing specifications takes the sheet's whole width until a Part is opened**, then seven twelfths beside the edit form, as the Catalog does; or the old fixed 26rem column with a pane saying "Open a Part from the list".
2. **Its table is Part (manufacturer and Category below the name), Offers and Lacks**; or Manufacturer and Category as columns of their own, five in all.
3. **A long name and a long run of missing labels wrap in full** (all 11 of a motherboard take four lines at 1440); or the labels clamped to two lines with "and 6 more", whole in the edit form.
4. **Expiring Offers is a table across the sheet**, Vendor, Offers, Phone and WhatsApp, the marks kept before each number; or the old 42rem column of rows at every width.
5. **The count alone on the end side above the table**, in words in Note Grey, as the Catalog's; or the count in the title row's sentence, larger, as the screen's answer.
6. **A short queue leaves the sheet's lower part white** (the inspector's two warnings); kept as the frame draws every screen, or the frame changed (ticket 07's) so that the sheet ends with its content.
7. **A row seen leaving moves as Motion 8** (a fade, then its space closes; with reduced motion the fade, then the space closes at once), only when the same page is answered again without it.

The box for showing the screens to the owner and recording the remarks stays open, and the Status stays, until the owner has looked and answered.

### 22 October 2026: the owner's answers

The orchestrator opened `.taste-skill/redesign-10/index.html` for the owner in the built-in browser, and the owner answered the seven choices:

| Choice | The owner's word | Result |
|---|---|---|
| 1. Missing specifications at the whole width until a Part is opened | "As built" | Kept as built |
| 2. The table's three columns | "Three columns" | Kept as built |
| 3. A long name and long labels wrap in full | "Wrap in full" | Kept as built |
| 4. Expiring Offers as a table across the sheet | "Table" | Kept as built |
| 5. The count alone on the end side above the table | "As built" | Kept as built |
| 6. A short queue leaves the sheet's lower part white | "Keep full sheet" | Kept; the inspector's two WARNs on Expiring Offers stay defended |
| 7. A row seen leaving moves as Motion 8 | "as recommended, but just make sure that motions are smooth, not a rigid snaps that hurt eyes." | **Built**, below |

**Watching the leaving motion frame by frame.** I slowed the motion four times with DevTools' own playback rate (`Animation.setPlaybackRate`) and recorded the list at every frame the page drew (`filmTheList` in `apps/e2e/src/leaving-rows.ts`). In each frame it took every row's place, height and drawn opacity, where the pages' navigation was, and where the column headings started. I watched it at 360 and 1280, with full and reduced motion. The scene: four made-up Vendors; the second leaves while the next page's first arrives at the end. Three snaps were found:

1. The leaving row was taken out by a 400 ms timer. At full speed its space had closed by then; at a quarter speed it was taken out while still 105 pixels high (49 at 1280), and the rows below and the pages jumped up by that much in one frame.
2. The next page's first row, filling the place, appeared whole and opaque at the end in one frame, and pushed the pages' navigation down 105 pixels.
3. With reduced motion the space closed "at once", in one frame.

These are the tests' red runs. Two more risks were removed before they could be seen. In a table laid out by its content, a column could move once a row with a wide cell left. And a row's rule belonged to the row below or to none (the last row had none), so a rule could appear or vanish by one pixel when a row became or stopped being the last.

**What changed** (`2745258`, `fix:` as it spans the `ui` theme, the dashboard and the end-to-end tests):

- A leaving row is taken out only once its space has closed: at the end of its `grid-template-rows` transition, whatever its speed, with a fallback after 3 seconds (`useLeavingRows`, `whenTheSpaceHasClosed`).
- A row new to the same page arrives in step with the one leaving. Its space opens over the same 200 ms on `--ease-in-out`, after the same 150 ms, from no room and no rule; then it fades in over 200 ms on `--ease-out`. The pages' navigation and the rows below stay put when one row leaves and one arrives. A leaving row that comes back does the same from where it is.
- Every row keeps its own rule below it, the last too, and the rule closes or opens with its row: the theme's `leaves` on a list's row, and the new `leaves-rule` on a table's row, which also keeps Motion 2's colour under the pointer.
- Both tables are `table-fixed`, their widths set by their headings (Part half, Offers 6rem, Lacks the rest; Vendor two fifths, Phone 10rem, WhatsApp 11rem, Offers the rest), so no column moves while rows come and go.
- With reduced motion the fades stay, and the space closes or opens over 150 ms on `--ease-out` (Emil's "gentler, not zero"), never in one frame.

**Tested first.** Four new tests film the scene four times slower at 360 and 1280, with full and reduced motion. They fail if, in any frame:
- a row, the pages' navigation or a row's height moves by more than 16 pixels;
- anything moves by more than a pixel in the frame a row is taken out or put in;
- a row's opacity changes by more than 0.35;
- a row is taken out or put in while it can be seen or takes more than a pixel (a table's collapsed rule lends a closed row half a pixel, which no one sees);
- a column heading moves.

They also check that the leave lasted over 900 ms, so it really was slowed, and that the last row keeps its rule. They failed first on the three snaps above (`appeared 104px high at 1`, `was taken out 105px high`, `the pages moved 105px`), and then passed. The reduced-motion line of the earlier leaving test now expects `grid-template-rows` over 0.15 s after 0.15 s, where it expected 0 s: the owner's answer changed the behaviour. It keeps every assertion.

**Watched by eye too**, on the review page: films at full speed in light and four times slower in dark, plus four times slower read right to left, at 1440 and 360 with full and reduced motion (`#r6`). Also two strips of stills at 1440, taken one after another while the motion ran four times slower: 65 with full motion and 66 with reduced motion (`#r6s`). The rows rise into place and the pages stay where they are in every still. Right to left changes nothing, as nothing travels sideways. The schemes change nothing either, as no colour moves.

**DESIGN.md** (`05c22f1`) now has the **No Snap Rule** among the Motion section's named rules: "No movement jumps: reduced motion shortens and drops movement, it never jumps a layout in one frame". It also covers the rest:
- what is taken out or put in, and when;
- a table's columns and rules while its rows change;
- Motion 8's arriving row, and its taking out once its space has closed;
- the reduced-motion table's rows for leaving and arriving.

The reduced-motion paragraph now says that reduced motion fades, or travels shorter and faster, but never jumps.

**For other tickets.** The rule made one more line of DESIGN.md wrong: under reduced motion the switch's thumb "jumps" (`shared/ui/switch.tsx`, `motion-reduce:transition-none`). DESIGN.md now says that it travels in 100 ms on `--ease-out` within its own track. The switch is used only in the Offer form, ticket 12's screen, so ticket 12 builds and tests it there; this ticket did not touch the switch. Two places stay still on purpose under Motion 9 and were not changed: the scheme switch changing every colour in one frame, and a screen changing at once, such as Missing specifications widening when the edit form closes after a save, before the saved Part's row leaves.

**The checks on the tip:**

- `pnpm check` passed before each commit.
- `pnpm platform:check` on the code's tip, `2745258`, under the scratchpad's e2e lock: **178 passed**, none failed or flaky (6.2 minutes).
- Taste's inspector after the change, at 1440, 768 and 360 in light and dark: Missing specifications 0 FAIL, 0 WARN; Expiring Offers 0 FAIL and the two defended WARNs. Nothing scrolls sideways in any capture.
- `redesign/integration` had not moved (`c106b49`), so there was nothing to merge.

Every box is ticked, and the ticket is resolved.
