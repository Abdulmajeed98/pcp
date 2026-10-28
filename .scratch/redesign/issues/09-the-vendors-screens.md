# 09: The Vendors' screens

**Spec:** [the redesign spec](../spec.md)

**What to build:** Everything the Admin does with Vendors is rebuilt to the new DESIGN.md: the list of Vendors, a Vendor's page, creating a Vendor and the hand-over of its temporary password, editing it, resetting its password, and deactivating and reactivating it.

**Blocked by:** 07

**Status:** resolved

- [x] The Vendors' list, a Vendor's page, the new Vendor's form and the hand-over, the edit form, the reset of a password and the dialogs that deactivate and reactivate follow the new DESIGN.md and move as its Motion section says.
- [x] Each passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command, with the fixture's Vendor among the real ones.
- [x] Emil's `break-ui` is run on the list and a Vendor's page: a long shop name, a long address, a deactivated Vendor, no Vendors. What broke is fixed.
- [x] `expectAccessible` passes on each screen in the accessibility tests' list, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [x] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [x] The screens are shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building them taught something.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 22 October 2026: what was built

On branch `redesign/09-the-vendors-screens`, on ticket 07's base, in pieces, each gated on `pnpm check`'s exit status before it was made:

1. `feat(inspector)`: ticket 01's command puts the made-up shop's Vendor among the real ones. The list of Vendors is read from the API with the tab's own Authorization, and the shop's Vendor is put on its first page in name order and counted with the rest (`listsTheVendors`, `vendorsWithTheShops` in `made-up-shop.ts`); another Vendor's page and its Offers are read from the API; every call that would write is still refused, the real Vendors' included. The first page holds one row more than its size, so the API's later pages stay as they are.
2. `feat`: the Vendors list, as DESIGN.md lays out a list. From 64rem a table of three columns, Vendor, State and Login phone number, the name's column half the table, rows of 48 pixels divided by Rule lines, the whole row the link, Raised Stone under the pointer; the list across the sheet's whole width until a Vendor is opened, then seven twelfths beside it, past an Edge line, the open row on Active Stone. On a phone, two-line rows. The count in words on the end side of the list's bar ("12 Vendors"), off its plate. Loading rows sketched still in the rows' shape. The empty state with its plain icon and Create a Vendor. The pane that said "Open a Vendor from the list" is gone. No tabs and no search: the API's list of Vendors has neither a state to filter by nor a search.
3. `feat`: a Vendor's page, its forms and the hand-over. After a reset, the line that says so, the temporary password and the hand-over arrive below the actions and above the details (Motion 6). The temporary password on a Raised Stone panel with 8-pixel corners and no edge. The hand-over's heading in the Section type, its language boxes with a control's 6-pixel corners, the chosen one on Active Stone at weight 600. A Vendor's details divided by Rule lines. The Vendor form puts two details to a row once the form itself is 40rem wide (a container query), so it keeps one to a row in the pane beside the list, and its button says "Creating the Vendor…" or "Saving…" while it waits. The reset's and the activation's alert dialogs were already ticket 07's (Motion 3, Action Red on Deactivate and Reset, Reactivate as the primary, the refusal above the buttons).
4. `fix`: what break-ui and Taste's inspector found (below), and the Deactivated mark's word started where the column's "Active" does.
5. `docs`: DESIGN.md corrected; then the merge of `redesign/integration` (ticket 10), its DESIGN.md conflicts resolved by keeping both tickets' words.
6. `fix`: the owner's two words of 22 October 2026 that the coordinator passed on (below): one h1 to a page, and no snap.
7. `docs`: DESIGN.md for 6, and this record.

### 22 October 2026: "h2 on a desk" and the No Snap Rule

Two of the owner's decisions from other tickets bind these screens, passed on by the coordinator while I ran.

- **"h2 on a desk"** (ticket 08): one h1 to a page. A Vendor's page, its edit form, a new Vendor and the screen after it is created title themselves `h2` from 64rem, beside the list's `h1`, and `h1` on a phone, where they stand alone. Ticket 08's shared way had not landed on `redesign/integration` when I merged it, so each of the three screens decides it from `useWideScreen()` itself, which is exactly when it is beside the list; when 08 lands, the merge should swap that for 08's shared way. The desk tests now ask for the opened screen's `h2` and for one `h1`; they failed first on the missing `h2`. Taste's inspector's `many-h1` WARN, the one WARN of the first runs, is gone (below).
- **The No Snap Rule** (ticket 10, DESIGN.md's Motion): I watched these screens' movements slowed four times (DevTools' animation playback rate at 0.25), frame by frame, in full and in reduced motion, at 360 and 1440, with a throwaway film spec (`zz-redesign-09-motion.spec.ts`, kept beside the review page) that photographs every 60 ms and measures the top of what lies below at every frame (`.taste-skill/redesign-09/motion/`). Three jumps were found and fixed: a reset's result pushed the details down 440 pixels in one frame (it rose 6 pixels and faded, Motion 6, but its space came at once): it now arrives as a row arrives in a list (Motion 8, ticket 10's `leaves` with `data-arriving`), its space opening over 200 ms before it fades in, 34 frames and at most 44 pixels a slowed frame at 360 (27 frames and 50 pixels with reduced motion); a refusal said in an alert dialog pushed its buttons down 28 pixels at once: its place is now always there, closed, and opens over 11 frames, at most 3 pixels each (`AlertDialogRefusal`, new in `shared/ui`); a busy button's words changed its width ("Reset the password" to "Resetting…"): both words are now laid in one cell, the one not said hidden, so the button keeps its width (`BusyLabel`, new in `shared/ui`). The reset's test now watches the details slide four times slower (it failed on a 149-pixel step against the old `arrives` before this), and the form's desk test checks the busy button keeps its width. The dialogs' own movement (Motion 3) moves nothing beneath them. Ticket 08's shared `FieldError` and refusal panel were left to 08.

**Shared files touched, for the other tickets of the wave:** `entities/vendor/ui/vendor-details.tsx` (`DetailList` takes Rule lines, a detail's value wraps where it must, and `WrittenOnLines` gives each line its own direction), which the Vendor portal's details screen (ticket 13's) shares and gains with no change of its own; `features/vendor-form` (the Admin's only); `features/hand-over`. No shared component in `shared/ui` was changed; two were added beside them, `BusyLabel` and `AlertDialogRefusal`, which other screens' busy buttons and dialog refusals (the Offer's removal, ticket 12's) could take. `DeactivatedMark` takes a `className`.

### 22 October 2026: how each skill was run

- **`mattpocock-skills:tdd`**, loaded through the Skill tool. The owner was not answering, so I chose the seams, as ticket 07 did: the Admin console in a real browser, through Playwright, and the inspector's own Jest tests for the fixture. Red first, each for the right reason: the two desk-width tests of the list waited for a table that did not exist; the form's desk test found its details two to a row in the narrow pane (WhatsApp beside Phone, 1002 against 734 pixels); the reset's test found no result block; the inspector's four new tests failed on `listsTheVendors` not being there and on the shop's 404 for another Vendor. One new test was never red: at 768 the form already put two details to a row (it guards that the container query keeps them), and its first form compared the two fields' tops to the pixel and failed on 0.75 of one, so it now allows 2. The break-ui test failed first on the page 419 pixels wide; its line-direction check passed against a planted fault (the English line was long enough to wrap across the value's whole width), so the line was shortened, and the planted fault (no `unicode-bidi: plaintext`) then failed it, and was reverted.
- **Taste** (`design-taste-frontend`, its app-screens chapter) for the layout and density inside the chosen sheet, restored into `.taste-skill/direction.json` as ticket 05 says; `inspect.mjs --app` through `pnpm dashboard:inspect` (below).
- **Emil**: `emil-design-eng` with the concrete question of which of these screens' changes should move (answered on the review page, `#s7`): the reset's result arrives (Motion 6), the screen after a create stays still as a screen of its own, the open row's ground changes over Motion 2's 100 ms, the busy words do not animate. `break-ui` on the list and a Vendor's page (below).
- **Impeccable** (`impeccable`, `impeccable context --target apps/dashboard/src`, its craft floor before the UI edits, then its `document` for the record): DESIGN.md corrected (below). No skill refused to load.

### 22 October 2026: Emil's break-ui on the list and a Vendor's page

The worst case entered at the API's boundary, as the skill asks: a throwaway capture spec (`zz-redesign-09-capture.spec.ts`, kept beside the review page and deleted from the tree) answered the dashboard's calls about Vendors in the browser, at the API's own limits (`entities/vendor/model/longest.ts`): a name of 100 characters, the most the API takes, in Sorani (95) and in English (99); "Jo"; two deactivated Vendors; an address of 300 characters on three lines, Kurdish then English; opening hours in Kurdish and English; an Instagram name of 30 characters, the longest Instagram allows; no WhatsApp number and no map location. Empty was no Vendor, One a single Vendor, Huge 1,284 over 65 pages. Seen at 1440, 768 and 360 in both schemes, with the page's width measured on every capture. The toggle is on the review page (Demo data, Worst case, Empty, One, Huge); no toggle was added to the app.

| # | Severity | Field | Worst case | What happened | Fix |
|---|---|---|---|---|---|
| 1 | Broken | Instagram name | `made_up_computer_hardware_erbl` | No space to break at: a Vendor's page scrolled 59 pixels sideways at 360, and the link overhung the pane at 1440 | A detail's value wraps where it must (`overflow-wrap: anywhere`), `entities/vendor/ui/vendor-details.tsx` |
| 2 | Ugly | address, opening hours | a Kurdish address with an English line; opening hours with a line in English | The whole text took its first letter's direction, so the English lines were drawn right to left and aligned right | Each line takes its own direction (`unicode-bidi: plaintext` inside the one isolated piece), the same file |
| 3 | Ugly | login phone number | any page of the table | Proportional digits, left-aligned, not lining up (Taste's inspector, `numeric-align` and `tabular`) | The last column, end-aligned in tabular figures with its heading; tabular figures on the phone's rows, `pages/vendors/ui/vendors-found.tsx` |
| 4 | Ugly | state | a deactivated Vendor in the table | "Deactivated" started 6 pixels in from the column's "Active" | The mark's padding pulled out past the column's edge, `entities/vendor/ui/deactivated-mark.tsx` |

**Decisions, for the owner** (with the choices below): a long name wraps in full, as the Catalog's Parts do; each line of an address takes its own direction.

**What held up**: a 100-character name wraps in full at every width, in the table, the rows and the title, the Kurdish one starting on the column's start side; "Jo" keeps a row of 48 pixels; "1 Vendor"; "1,284 Vendors" and "Page 1 of 65"; no Vendor gives the empty state with Create a Vendor; a deactivated Vendor has its mark in the list and on its page, with Reactivate and Deactivate again; a missing WhatsApp number or map location says "None"; nothing scrolls sideways at 360 after fix 1.

### 22 October 2026: tests that changed, and why

No test lost an assertion.

- `admin-vendors.ts`'s `listedVendors` reads the table's rows of Vendors as well as the phone's list items, as DESIGN.md lays the list out as a table from 64rem; the tests that use it are unchanged.
- `made-up-shop.spec.ts` (the inspector): "is the one Vendor listed, and is read by its identifier" became "is listed among the API's Vendors, in name order on the first page, and counted with them" (its two assertions kept, the list's now on the joined page, three more), with two new tests for an empty API list and a later page and for a refusal left as it is; "is the only Vendor there is: any other is not found, nor are its Offers" became "leaves any other Vendor, and its Offers, to the API, which only reads them; nothing is written to one": the two 404s became "left to the API" (`undefined`), because the ticket asks for the shop's Vendor among the real ones, and three assertions were added (a write to a real Vendor is still refused, and which calls are the list).
- `admin-reset-password.spec.ts`'s new test of the reset's result, first written for Motion 6 ("its transition includes opacity and translate"), now asks for Motion 8's arrival (`grid-template-rows` and opacity) and adds the frame-by-frame watch, under the No Snap Rule; its name says "with no snap".
- New: in `admin-vendors.spec.ts`, the list at 1280 (the table's headings and cells, the phone numbers end-aligned in tabular figures, the count in words with no plate, the table across the sheet, no sideways scroll, `expectAccessible` in light and dark), a Vendor's page beside the list (seven twelfths, the row current and on Active Stone, `expectAccessible`), and a Vendor's longest details at 360 (break-ui's); in `admin-new-vendor.spec.ts`, the form beside the list at 1280 (one detail to a row, the busy button, `expectAccessible`) and on a tablet (two to a row); in `admin-reset-password.spec.ts`, the reset's result (its words, its arrival, its place, the Raised Stone panel, `expectAccessible`).

### 22 October 2026: DESIGN.md corrected

With Impeccable's `document`, where building taught something: the Vendors' list has no tabs and no search, only the count on its bar; a Vendor's row is the table's Vendor, State and Login phone number from 64rem, the phone number end-aligned in tabular figures; a form's two details to a row are measured on the form, not the window; what a Vendor wrote takes its own direction line by line, and a value with no space to break at wraps; a reset's result and a dialog's refusal arrive as a row does (Motion 8), while the screen after a create stays still; a busy button keeps its width with both its words laid in one cell; the form's busy words; a screen opened beside the Vendors' list titles itself `h2` from 64rem.

### 22 October 2026: the checks

- `pnpm check` passed before each commit (exit status gated), and on the merge of `redesign/integration` right after it was made.
- `pnpm platform:check`, under the scratchpad's e2e lock: **176 passed** on `ce78c16`, before the merge; **184 passed** on `6499760`, the merge of `redesign/integration` (`392ed4c`, ticket 10) and the h2 and No Snap fixes, none failed or flaky (7.1 minutes). The Vendor specs (`admin-vendors`, `admin-new-vendor`, `admin-reset-password`, `admin-edit-vendor`, `admin-deactivate-vendor`, `admin-acting-as-vendor`, `vendor-contact-details`, `dashboard-languages`) were run on their own after each change.
- **Taste's inspector**, `pnpm dashboard:inspect <address> --scheme light|dark --app --widths 1440,768,360`, with the API and the dashboard started from the worktree under the lock, the direction restored into `.taste-skill/` (no allowances), and the made-up shop's Vendor among the 2,324 real ones: on the Vendors, the shop's page beside them, New Vendor and Edit, in light and dark, on `6499760`: **0 FAIL, 0 WARN** in all eight runs. The first runs warned `numeric-align` and `tabular` (fixed) and `many-h1` (fixed by "h2 on a desk"). Its photographs are in the owner's checkout at `.taste-skill/redesign-09/inspect/`.
- `expectAccessible` passes on each screen in light and dark: the list, a Vendor's page, the new Vendor's form (with a refusal and a position problem), the hand-over, the edit form (with a refusal), the reset's confirmation and its result, and the deactivate and reactivate dialogs, on a phone as before, and the list, a Vendor's page and the form beside the list at 1280 (new).
- 360 pixels first, logical classes only, Feature-Sliced Design's import rules: the dashboard's lint passes in `pnpm check`; the screens import only `features`, `entities` and `shared`, and nothing was put in another ticket's slice.
- Nothing was written to the development database by the redesign's tooling: the inspector only reads (every write it is asked for is refused), and the captures and films answered every Vendor call in the browser. The end-to-end tests made their own made-up Vendors, as they always do.

### 22 October 2026: for the owner

The review page is `.taste-skill/redesign-09/index.html` in the owner's checkout (to be served from `.taste-skill` on port 4110): the list at 1440 in light and dark (`#s1`), a Vendor's page beside it and a deactivated Vendor (`#s2`), both at 768 and 360 (`#s3`), the new Vendor's form with and without its errors, the screen after a create with the temporary password and the hand-over, and the edit form (`#s4`), the reset's confirmation and result and the Deactivate and Reactivate dialogs (`#s5`), break-ui's Demo data / Worst case / Empty / One / Huge toggle at all three widths in both schemes (`#s6`), what moves, with the films of the No Snap check (`#s7`), the inspector's results (`#s8`), and the choices below (`#q`). Every capture is the running app; its Vendors are answered in the browser from made-up shops, and nothing was written to the development database. The Admin console is in English only, so there is no Kurdish capture.

Choices to confirm or change:

1. **The table's columns**: Vendor, State, Login phone number, the number last, end-aligned in tabular figures (built); or Vendor, Login phone number, State, the number left-aligned, which Taste's inspector warns of.
2. **"Active" in Note Grey** on every active Vendor's row (built); or the State cell empty for an active Vendor, only "Deactivated" marked.
3. **The count on its own bar**, "2,324 Vendors" on the end side under the title row, as the Catalog's (built); or beside the title, saving the row, since the Vendors have no tabs or search to share it with.
4. **Each line of an address or opening hours in its own direction** (built; break-ui 2); or the whole text in its first letter's direction, as before.
5. **The Vendor form one detail to a row in the pane beside the list**, two once the form itself is 40rem wide (built); or two from a 40rem window, about 200 pixels a field in the pane.
6. **The screen after a create stays still**, a screen of its own replacing the form, while a reset's result opens its space and fades in under the No Snap Rule (built); or the create's hand-over arriving the same way.
7. **Create a Vendor in the empty state**, beside the title row's New Vendor, as the Catalog's Create a Part (built); or no action of its own.

The box for showing the screens to the owner and recording the remarks stays open, and the Status stays, until the owner has looked and answered.

### 28 October 2026: the owner's answers

The orchestrator opened `.taste-skill/redesign-09/index.html` for the owner in the built-in browser on 22 October 2026, and the owner answered the seven choices:

| Choice | The owner's word | Result |
|---|---|---|
| 1. The table's columns Vendor, State, Login phone number, the number end-aligned | "As built" | Kept as built |
| 2. "Active" in Note Grey on every active row | "Only Deactivated" | **Built**, below |
| 3. The count on its own bar | "Own bar" | Kept as built |
| 4. Each line of an address or opening hours in its own direction | "Per line" | Kept as built |
| 5. The Vendor form one detail to a row in the pane, two once the form is 40rem wide | "Follow width" | Kept as built |
| 6. The screen after a create stays still | "Arrives smoothly" | **Built**, below |
| 7. Create a Vendor in the empty state | "\"Create a Vendor\"" | Kept as built |

**"Only Deactivated"**, test-first: an active Vendor's State cell is empty to the eye, and only "Deactivated" is marked, in words with its mark. The column's heading stays. So that a screen reader does not read the cell as nothing, it holds "Active" visually hidden (`sr-only`), which I chose over an empty cell or an `aria-label` on the cell: the word is read in its place in the row by every screen reader, and the table's text stays the same for search and copying. The desk test's cell texts are unchanged (the hidden word is still the cell's text), and a new assertion finds the word at most 1 pixel wide; it failed first on the word drawn 40 pixels wide. The phone's rows already marked only a deactivated Vendor.

**"Arrives smoothly"**, test-first: after a create, the temporary password and the hand-over arrive as a reset's result does (Motion 8, the No Snap Rule): their space opens, the link to the Vendor's page below sliding down, and then they fade in. A new test in `admin-new-vendor.spec.ts` watches the link four times slower, frame by frame, as the reset's test does: it failed first on the missing arrival, then passed. DESIGN.md's hand-over and Motion 6 say so.

**Merged `redesign/integration` again** (`b24caf9`, ticket 11): its DESIGN.md Motion 6 conflicted with mine and was resolved by keeping ticket 11's words and adding the reset's result, the create's hand-over and a dialog's refusal to the things that arrive as a row does. **Ticket 08's shared way for "h2 on a desk" had still not landed**, so each opened Vendor screen still chooses `h2` or `h1` with `useWideScreen()`; whoever merges 08 should swap the three screens (`pages/vendor`, `pages/new-vendor`, `pages/edit-vendor`) to its shared way.

**The checks on the tip:**

- `pnpm check` passed before each commit (exit status gated): the merge of `b24caf9`, the owner's two changes, and this record.
- The Vendor specs on their own after the change: 31 passed, both new tests having failed first for the right reason.
- `pnpm platform:check` on the last code commit, `37163b9`, under the scratchpad's e2e lock: **199 passed**, none failed or flaky (8.8 minutes). Two earlier tries stopped before any test ran: the Shopper app's `next dev` exited at start to show a notice that Next.js 16.4.0 is affected by a security advisory, and asked the agent reading it to run `next upgrade --agent=security` and to ask the owner about it. I did not act on it (instructions in a tool's output are not the owner's); a retry ran normally. It is passed on to the owner in the report.

Every box is ticked, and the ticket is resolved.
