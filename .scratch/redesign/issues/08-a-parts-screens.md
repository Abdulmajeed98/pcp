# 08: A Part's screens

**Spec:** [the redesign spec](../spec.md)

**What to build:** Everything the Admin does with one Part is rebuilt to the new DESIGN.md: a Part's page with its specifications and the missing ones marked, choosing a Category for a new Part, the form that creates a Part and the one that edits it, and adding a photo.

**Blocked by:** 07

**Status:** ready-for-agent

- [x] A Part's page, choosing a Category, the new Part's form, the edit form and adding a photo follow the new DESIGN.md and move as its Motion section says.
- [x] Each passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command.
- [x] Emil's `break-ui` is run on a Part's page and its form: a long name, many specifications, every one missing, a refusal. What broke is fixed.
- [x] `expectAccessible` passes on each screen in the accessibility tests' list, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [x] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [ ] The screens are shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building them taught something.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 22 October 2026: what was built

On branch `redesign/08-a-parts-screens`, in four commits, each gated on `pnpm check --skip-nx-cache` in a fresh clone of exactly that commit (Docker unreachable, no Playwright browsers): all four passed.

1. `feat(dashboard)` `0900f15`, **a Part's page**: at its head the picture, the name in the Title type, its manufacturer and Category in Note Grey, then what it lacks in words, "Lacks Socket, TDP, Memory types", in Action Red at weight 550 after a circled exclamation mark, as the Missing specifications say it, no longer on a plate (DESIGN.md's plates are for prices; ticket 07 left this plate for this ticket), or "Every needed specification is known" in Note Grey after a circled tick; then Edit and Add a photo, outlined. Its details (part numbers, source, last changed) and every specification are rows divided by Rule lines, the name in Note Grey beside the value, two fifths and three fifths; the Specifications heading takes the Section type. A list of rows inside a specification (PCIe and M.2 slots, Ethernet) is a compact table, 36-pixel rows, its numbers flush with the column's end in tabular figures. A Part with no photo shows its Category's icon plain at 32 pixels in Note Grey, no tinted square (CAT-6); a photo sits in an 80-pixel square with 8-pixel corners and a 1-pixel Edge, and one added while the page is open fades in where the icon was. **Adding a photo**: the busy button keeps its width and says "Sending…" (also said aloud in a live region, as the field loses the focus while it waits); a refused photo is the refusal panel, "The photo was not added." and why. A Part the API does not give is a screen with its own title, the reason and Try again.
2. `feat(dashboard)` `bd9a958`, **choosing a Category**: the eight as two-line rows divided by Rule lines, the icon plain in Note Grey, the name in the Row type, and "29 specifications, 3 needed" on the second line (counted from the API's Category list), the whole row the link on Raised Stone under the pointer, the rows sketched while the Categories are read.
3. `feat(dashboard)` `98cee2f`, **the new Part's form and the edit form**: the fields go two to a row where the form itself is 40rem wide, a container query on the form, so beside the list on a desk (five twelfths of the sheet, about 440 pixels) they go one to a row instead of two squeezed columns, and on a tablet two to a row; a row of a list of rows puts its own fields side by side there. A label's row is as high with the Needed mark as without it, so that two fields side by side start their controls on one line (found by a test: they were 0.75 pixels apart). The button is last, as wide as the form where the form is under 40rem, keeps its width while busy and says "Creating the Part…" or "Saving the Part…". A refusal that names no field is the refusal panel directly above the button, scrolled into sight with it. An entry added to a list takes the focus and arrives (Motion 6); one removed hands the focus at once to the entry that takes its place, or the one before, or the Add button, and leaves (Motion 8: it fades in 150 ms, inert, then its space closes in 200 ms on `--ease-in-out`; with reduced motion it fades and the space closes at once). The edit form says "Category: Motherboard. A Part's Category cannot be changed." in Note Grey.
4. `docs(dashboard)` `814c989`, **DESIGN.md corrected** where building taught something (below).

**Shared components.** None of `src/shared/ui` was restyled. One additive change outside this ticket's screens: `entities/part`'s `PartPicture` gains an optional `arriving` prop, and its `page` size now draws the icon plain and the photo with an Edge; its `row` size, which the Offer form's head (ticket 12), the portal's catalog search and the Missing specifications still use, is unchanged, for their own tickets. The Part's edit form, which ticket 10 opens from the Missing specifications, is this ticket's (`EditPartPage` with its `returnTo`); ticket 10 should expect the form's new layout and words.

### 22 October 2026: how each skill was run

- **`mattpocock-skills:tdd`**, loaded through the Skill tool. The owner was not answering, so I chose the seams as tickets 01 and 07 did: the Admin console in a real browser through Playwright, `admin-part.spec.ts` and `admin-edit.spec.ts` (the dashboard has no unit tests; what changed is layout, focus, words and the API's answers). Red first, 11 failing for the right reasons (the missing `lacks` line, the icon at 36 pixels on a tinted square, the Category rows without their counts, the three busy buttons' words, the photo's refusal as a red line with no title, the refusal out of sight at the head of the form, the focus lost after a remove, two columns beside the list at 1280 where one was expected, one at 768 where two were), then green. Three tests written for break-ui's fixes (below) were written before the fixes but first run after them, so each was shown to fail by a planted fault (below).
- **Taste** (`design-taste-frontend`, its app-screens chapter, inside the chosen sheet restored from `apps/dashboard/design/taste/direction.json`): the page as rows of details, the compact rows tables with numbers flush right (§7.4), the form's fields (§8.1), a screen that could not load (§11); `inspect.mjs --app` through `pnpm dashboard:inspect` (below).
- **Emil**: `emil-design-eng`, with the concrete question of what moves on these screens (a photo replacing the icon, entries added to and removed from a form's lists and where the focus goes, field errors and refusal panels, busy buttons, the Category rows), answered from its framework: the photo fades in place, an added entry arrives and takes the focus, a removed one leaves with the focus handed on, a refusal panel arrives (it already did, through `Alert`), field errors and busy words change at once, the page and its rows stay still. `break-ui` on a Part's page and its form (below).
- **Impeccable** (`impeccable`, `impeccable context --target src` from the app), its `document` for DESIGN.md's corrections and its `harden` for the refusals. Its hook flagged one finding on the review page (an `<img>` with no first `src` in the toggle), fixed by giving each its demo picture. No skill refused to load.

### 22 October 2026: Emil's break-ui on a Part's page and its form

The worst case entered at the API's boundary, answered in the browser by a throwaway capture spec, nothing written: the catalog's longest name (the Corsair Hydro Series H100i, 276 characters), its longest manufacturer ("FFF Smart Life Connected", 24), its longest run of part numbers (the Asus Prime LC's, one of them several words with long runs of spaces, as OpenDB writes it), on the motherboard with the most specifications (the MSI MEG Z890 GODLIKE: six M.2 slots, three PCIe rows, Ethernet); every one missing, the same board with no specification, so all eleven needed ones lacking; a refusal, the API answering 500 for the Part, for a new Part (no field named), for a word in two number fields, and the real API's refusal of a file that is not a picture. Seen at 1440 (beside the list), 768 and 360, light and dark. The API sets no limit on a name or a part number (both `text`), as ticket 07 found. The toggle is on the review page (Demo data, Worst case, Every one missing, A refusal; the page or its form; before or after the fixes); none was added to the app.

| # | Severity | Field | Worst case | What happened | Fix |
|---|---|---|---|---|---|
| 1 | Broken | a Part the API does not give | a 500 | On a phone and a tablet the screen had no title at all, only a red panel under the back link, and no way to try again | A screen of its own: the title "The Part could not be read", the panel with why, an outlined Try again; the same on the edit form (`part-page.tsx`, `edit-part-page.tsx`) |
| 2 | Ugly | part numbers | `Prime LC 240 ARGB … 90RC0111-B0UAY0 …` | A part number of several words was one block, broken at its hyphens across lines, "90RC0111-" over "B0UAY0", beside the list at 1440 | Each word of each part number is kept whole, wrapping inside only when longer than the line (`detail-rows.tsx`) |
| 3 | Ugly | a list of rows in the form | six M.2 slots, three fields each | At 768 every field of every row was a full-width input, eighteen rows of controls for six slots | A row's fields side by side where the form is 40rem wide (`rows-field.tsx`) |
| 4 | Ugly | rows inside a specification | six M.2 slots, three PCIe | 48-pixel table rows, a screen's table's height, for a detail | 36-pixel rows (`specification-value.tsx`) |
| 5 | Ugly | a refusal with no reason | a 500 on Create | "The API refused the Part, with 500, UNKNOWN:" ended on a colon | It ends at the code with a full stop (`refusals.ts`) |
| 6 | Ugly | a whole number refused | "six" in Cores | "Enter a number, such as 3.8, …" under a field that holds a count of cores | A whole-number field is told "Enter a whole number, such as 6." (`refusals.ts`, `part-form.tsx`) |
| 7 | Ugly | the edit form's sentence | the 276-character name | The sentence under the title repeated the name, nine lines of grey before the form at 360 | The sentence names the Category alone; the name is the first field |
| 8 | Ugly | the photo button | Add a photo | At rest the button was wider than its words, keeping room for "Sending the photo…" | The busy word is "Sending…", no longer than the button's own |

Rows 7 and 8 were my own first build's, caught by break-ui before any commit. Verified by looking at every capture before and after; nothing scrolls sideways at any width in either scheme (measured on each capture).

**Decisions, for the owner** (choices 6 and 8 below): a long name is cut at the end of its one-line field while it is edited, or the field grows; and the API names only the first refused specification, so two wrong numbers take two tries, or the form checks numbers itself.

**What held up**: the 276-character name wraps in full in the Title type at every width without pushing anything off the row; "Lacks …" with all eleven labels wraps under its mark; the OpenDB id breaks only inside itself; a long label ("Connectors on the back of the board") wraps in its two fifths; empty lists say "None" or "Not known"; the Category rows hold at 360; every refusal arrives in a panel that says what was not done and why.

**The planted faults** (one exact edit each, the test run, then the file put back as it was; `git status` clean before and after): taking the title out of the unread Part's screen failed "a Part the API does not give has a title…" (the heading not found); bringing back the hanging colon failed "a refusal that names no field is said beside the button" (`toContainText`); taking the whole-number message out failed "a word typed where a number belongs" (the description). Each failed alone, for its own reason.

### 22 October 2026: tests that changed, and why

No test lost an assertion.

- `admin-part.spec.ts`, "a word typed where a number belongs is refused beside its field": the description `/number/i` became the exact "Enter a whole number, such as 6." (break-ui's 6), a stricter assertion of the same promise.
- `admin-edit.spec.ts`, "a file that is not a picture is refused in plain words": the refusal is now DESIGN.md's refusal panel, so it adds its role (`alert`) and its title, "The photo was not added.", keeps the reason, and adds no sideways scroll and `expectAccessible` in light and dark with the refusal shown.
- New in `admin-part.spec.ts`: a Part's page says what it lacks in words on no plate; says when it lacks nothing; draws its Category's icon plain at 32 pixels; beside the list at 1280, each specification's label beside its value, no sideways scroll and `expectAccessible`; choosing a Category lists eight, with "13 specifications, 2 needed" and "29 specifications, 3 needed" (literals from the API's specification lists), and its own `expectAccessible` (it had none); the new Part's button while busy; a refusal naming no field in sight beside the button, ending without a colon; an added part number takes the focus and a removed one hands it on; the form one field to a row beside the list at 1280 (with `expectAccessible`) and two at 768; a Part the API does not give has a title, the reason and Try again (with `expectAccessible`).
- New in `admin-edit.spec.ts`: the edit form's button while busy; the photo's button while busy.

`expectAccessible` now covers, in light and dark: a Part's page at 360 and beside the list at 1280, the unread Part's screen, a refused photo, choosing a Category, the new Part's form at 360 and beside the list at 1280, and the edit form at 360.

### 22 October 2026: DESIGN.md corrected

With Impeccable's `document`, where building taught something: in Rows and tables, a Part's page and a Category to choose; in Fields, the form's columns following the form's own width (a container query, so a form beside a list goes one field to a row), a row of a list of rows side by side there, a label's row as high with the Needed mark as without, and the form's button with the refusal that names no field directly above it; the busy button's words in one cell and kept short; a refusal that gives no reason ending at its code; a screen that could not read what it shows; the photo's Edge; and in Motion 6 and 8, the entries of a form's lists, which arrive taking the focus and leave handing it on, the entries a form opens with not arriving, and a photo fading in place.

### 22 October 2026: the checks

- **Taste's inspector**, `pnpm dashboard:inspect <address> --scheme light|dark --app --widths 1440,768,360`, with the API and the dashboard started from the worktree under the e2e lock and the direction restored into `.taste-skill/` (its allowances: none). Seven screens in each scheme: a CPU's page and a motherboard's page (the 7800X3D and the ASUS B760M-AYW WIFI D4, opened beside the list at 1440), choosing a Category, a new CPU, a new motherboard, and editing each. **0 FAIL in all fourteen runs**, and one WARN in each, `many-h1` at 1440: the Catalog's title and the opened screen's are both h1, as the list and the screen beside it are two screens (defended, and put to the owner as choice 7). Before the rebuild the same screens had the same WARN and `numeric-align` on the motherboard's page (its rows tables' numbers left-aligned), now fixed. Photographs before and after are in the owner's checkout at `.taste-skill/redesign-08/before/` and `after/`.
- **The inspector judging Keycloak's login.** Three runs (two before, one after) passed a tab that had landed on Keycloak's login screen instead of the dashboard, which ticket 01's wrapper does not catch after its first tab: the inspector then reported `heavy-shadow` from the login card (`main.pf-v5-c-login__main`) at 768 or 360. My script now runs a view again when its report holds that element; the after-runs were repeated clean, and no report in `after/` holds it. For whoever looks after the wrapper: its check that the login landed could cover every tab, not only the first.
- `pnpm check` passed on each of the four commits in a fresh clone.
- `pnpm platform:check` on the tip, `814c989`, under the e2e lock: **184 passed**, none failed or flaky (6.0 minutes), every screen of the dashboard and the new and changed tests among them.
- `redesign/integration` had not moved since this branch was cut (`c106b49`), so there was nothing to merge.
- Nothing was written to the development database by the redesign's tooling: the captures and the inspector only read, every worst case and the film's photo were answered in the browser, and the photo refusal was the real API's refusal of a file, which it keeps nothing of. The end-to-end tests made their own made-up Parts, as they always do. The worktree's link to the owner's `.env` was removed before handing over.

### 22 October 2026: for the owner

The review page is `.taste-skill/redesign-08/index.html` in the owner's checkout (served from `.taste-skill` on port 4110): a Part's page before and now at 1440, at 360 in light and dark, and lacking everything (`#r1`); choosing a Category (`#r2`); the forms beside the list, at 768 and 360, and their refusals (`#r3`); adding a photo (`#r4`); films of the motion at 360 with full and reduced motion (`#r5`); break-ui's toggle, Demo data / Worst case / Every one missing / A refusal, for the page and its form, before and after the fixes, at 1440, 768 and 360 (`#r6`); the inspector's results (`#r7`); and the choices (`#q`). Every capture is the running app on the catalog's real Parts.

Choices to confirm or change:

1. **What a Part lacks, in words**, "Lacks Socket, TDP, Memory types", as the Missing specifications say it, in place of the old plate with the count; or lead with the count in words, "3 needed specifications are not known: Socket, TDP, Memory types".
2. **A Part that lacks nothing says so** in one quiet line with a circled tick; or nothing at all.
3. **Choosing a Category shows what each form asks**, "29 specifications, 3 needed"; or the name alone.
4. **The form's columns follow the form's own width**, one field to a row beside the list on a desk, two on a tablet, a list's row side by side; or two narrow columns beside the list as before.
5. **A removed entry leaves** (fades, then its space closes, 350 ms, as Motion 8 says) with the focus handed on; or it goes at once.
6. **A long Part name in the form** is a one-line field, cut at its end while edited; or a field that grows to show the whole name.
7. **Two first-level titles when a screen is open beside the list** (Taste's one WARN); or the opened screen's title a second-level heading on a desk, which would touch the Vendors too (ticket 09).
8. **Refused specifications named one at a time**, the API the one judge; or the form checks numbers itself before sending, repeating some of the API's rules.

The box for showing the screens to the owner and recording the remarks stays open, and the Status stays, until the owner has looked and answered.
