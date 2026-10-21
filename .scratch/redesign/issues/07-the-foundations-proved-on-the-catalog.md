# 07: The new look's foundations, proved on the Catalog

**Spec:** [the redesign spec](../spec.md)

**What to build:** The dashboard takes the new look at its base, and the Admin console's Catalog is the first screen rebuilt to it from end to end. The tokens of both schemes, the shared components and the Admin console's frame follow the new DESIGN.md, so every screen gains the new base at once, while only the Catalog is laid out anew. The Catalog's search, its Category, the count, the rows and the way between pages are built as DESIGN.md says, with motion as its Motion section says.

**Blocked by:** 06

**Status:** ready-for-agent

- [x] The tokens of the light and the dark scheme follow the new DESIGN.md.
- [x] Every shared component of the dashboard follows it: buttons, inputs, fields, choices, rows, plates or what replaced them, tables, alerts, dialogs, the empty state and the list's pages.
- [x] The Admin console's frame and its navigation follow it, with the scheme switch of ticket 03: light, dark or the device's, beside the language, remembered in the browser. Controls are 36 pixels under a mouse and 44 on a touchscreen.
- [x] The Catalog is rebuilt to it, and moves as the Motion section says, with reduced motion respected.
- [x] Every other screen still works and passes its tests, with the new base until its own ticket lays it out.
- [x] The Catalog passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command, with the direction's allowances restored from ticket 05.
- [x] Emil's `break-ui` is run on the Catalog's list: long Part names, a huge count, nothing found. What broke is fixed.
- [x] `expectAccessible` passes on the Catalog in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [x] It is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [ ] The Catalog is shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building it taught something.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 21 October 2026: what was built

On branch `redesign/07-the-foundations-proved-on-the-catalog`, in six commits, each gated on `pnpm check`'s exit status before it was made:

1. `feat(ui)`: the dashboard's theme, `libs/ui/src/themes/dashboard.css`, takes DESIGN.md's colours in both schemes (Stone Frame, Sheet, Raised and Active Stone, Edge, Rule, Control Edge, Ink, Note Grey, Bazaar Teal, the states and the plates; the unused warning colour is dropped). A scheme chosen with the switch is `data-scheme` on the document and wins over the device's; the dark values are written twice, once for the device's dark and once for the chosen dark, since CSS cannot join a media query and a selector in one rule. Controls: `--spacing-control` is 44 pixels, and 36 under `(pointer: fine) and (min-width: 64rem)`. The motion's three curves are in `@theme` (Tailwind's `ease-out` and `ease-in-out` take them, and `ease-drawer` is added), and each movement is a utility with its reduced-motion variant: `pressable` (Motion 1 and 2), `hover-colour` (2), `dialog-motion` (3), `scrim-motion`, `menu-sheet-motion` (5, mirrored in right to left), `arrives` (6). A scheme change suppresses transitions for one frame (`data-scheme-changing`). The radii are named by what they round (`rounded-sheet`, `-card`, `-control`, `-plate`), and `screen-title` is the Screen title type.
2. `feat(dashboard)`: every shared component in `src/shared/ui` follows DESIGN.md (buttons, inputs, the native select, the textarea, fields and their legends, the switch with Motion 4, rows (`item`), tables, plates, alerts as the refusal panel with Motion 6, the alert dialog with Motion 3, the empty state with its icon plain at 32 pixels, the list's pages and the paged list), and every screen's title takes the Screen title type (a Part's name the Title type). A paged list's count is said in words and leaves its plate (Vendors to remind, Missing specifications); the screens that put a count on a plate themselves (the Vendors, the portal's Offers and its catalog search, a Part's missing count) keep it until their own tickets, 08, 09, 11 and 12.
3. `feat(dashboard)`: the Admin console's frame: from 64rem the Stone Frame's sidebar (the surface's name, the sections with their icons, the current on Active Stone) and top bar (the screen's search in its centre, then the caller's name, the scheme switch and a ghost Log out), and the work on a sheet inset 8 pixels with 16-pixel corners; below 64rem one 56-pixel bar with the menu button and "Admin console", and the menu sheet (Base UI's dialog) with the sections, the caller's name, the scheme switch and Log out. The scheme switch (`app/layouts/scheme-switch.tsx`, `shared/lib/scheme.ts`) is a fieldset of three named icon buttons, Light, Dark and Device, `aria-pressed`, remembered under `scheme` in the browser's storage, and set before the first paint by a script in `index.html`. It takes its words as a prop, for the Vendor portal's three languages in ticket 11. The screen's search reaches the top bar through `shared/ui/screen-search.tsx`, a place the frame gives and a portal into it.
4. `feat(dashboard)`: the Catalog (below).
5. `fix(dashboard)`: Log out's words start on the menu sheet's edge.
6. `fix(e2e)`: the login helper closes the menu sheet after reading the caller on a phone (found by `pnpm platform:check`, below).

**The Catalog**, rebuilt to DESIGN.md's list: its title row with an outlined New Part; the Categories as underline tabs on an Edge rule, All Categories first, each with its count in Note Grey and a 2-pixel Bazaar Teal line under the current one, each a link in the address; the search, in the top bar's centre from 64rem and as the first row below the tabs on a phone, searching on Enter with no button of its own; the count in words, "16 Parts", on the end side, with "Searching…" beside it while the next answer comes; then a table from 64rem (Part, Manufacturer, Part numbers; the name half the width; rows of 48 pixels divided by Rule lines; the whole row the link, Raised Stone under the pointer, the open one on Active Stone) and two-line rows on a phone; no picture on a row; the list across the sheet's whole width until a Part is opened, then seven twelfths beside it past an Edge line; loading rows sketched in Raised Stone, still; the empty state between two Rule lines with its plain icon and Create a Part; the list's pages outlined. A tab's count is of what the search finds in that Category: the API has no count by Category, so each is a search for a page of one Part, eight more small calls a search, cached by TanStack Query and kept while the next arrive (for the owner, below). The Motion section on the Catalog: the press on New Part, the list's pages and the menu button; the colour under the pointer on rows, tabs, sections and buttons; the menu sheet; the tabs' line, the pages and the results still.

### 21 October 2026: how each skill was run

- **`mattpocock-skills:tdd`**, loaded through the Skill tool. The owner was not answering while I ran, so I chose the seams, as ticket 01 did: the Admin console in a real browser, through Playwright (`admin-console-frame.spec.ts`, new, and `admin-catalog.spec.ts`); the dashboard has no unit tests, and its behaviour here is layout, the address and the browser's storage. Red first, each for the right reason: the frame's five tests failed on the missing scheme switch, the missing menu sheet and the 44-pixel controls at a desk's width; the Catalog's eight failed waiting for the Category tabs that did not exist yet. One red run taught the test something: in development the stylesheet arrives with the scripts, so "before the first paint" is checked by the document's `data-scheme` when its body starts, not by a colour.
- **Taste** (`design-taste-frontend`, its app-screens chapter) for the layout, inside the chosen sheet, restored into `.taste-skill/direction.json` as ticket 05 says; `inspect.mjs --app` through `pnpm dashboard:inspect` (below).
- **Emil**: `emil-design-eng` with the concrete question of how to carry out the Motion section in Tailwind v4 and Base UI (transitions on the named properties, never `all`; the dialog from its centre; the scheme's one-frame suppression; reduced motion keeping the fades), and `animate` with its modal and drawer recipes. `break-ui` on the Catalog's list (below).
- **Impeccable** (`impeccable`, `impeccable context --target apps/dashboard/src`, then its `document` for the record): DESIGN.md is corrected where building taught something (below). No skill refused to load.

### 21 October 2026: Emil's break-ui on the Catalog's list

The worst case entered at the API's boundary, as the skill asks: a throwaway capture spec answered a search for `worst-case` with the catalog's own longest Parts, read from the API (the Corsair Hydro Series H100i's 276-character name, the DeepCool LS720 SE's 210, the Asus DUAL RTX 2060's part numbers, the Asus Prime LC's run of nine part numbers in one, two ordinary ones), with 1,284 found over 65 pages; Empty was a GPU search for `bartholomew.fitzgerald@northwind-industries-holdings.example.com`; One the Ryzen 7 7800X3D's part number; Huge every Part, 27,427 over 1,372 pages. The API sets no limit on a name or a part number (both `text`). Seen at 1440, 768 and 360 in both schemes, and at 1440 with a Part opened beside the list. The toggle is on the review page (Demo data, Worst case, Empty, One, Huge); no toggle was added to the app.

| # | Severity | Field | Worst case | What happened | Fix |
|---|---|---|---|---|---|
| 1 | Broken | the table | any search, from 64rem | The rows' 8-pixel bleed was a negative margin on the table inside its scrolling box, so the box scrolled and cut the first letters of every name and of the header ("art", "STPLAYER"); Taste's inspector photographs showed it | The bleed moved to a wrapper around the table (`parts-found.tsx`) |
| 2 | Ugly | part numbers | `DUAL-RTX2060S-O8G-EVO-V2, 90YV0DZ0-M0NA00`, and every number beside an opened Part | A part number broke at its hyphen across two lines, "90YV0DZ0-" over "M0NA00", which cannot be read off a box | Each part number is an inline block that moves whole to the next line, and wraps inside only when longer than the line; its comma stays with it |
| 3 | Ugly | a long name | the 276-character H100i | The manufacturer and part numbers sat centred against a four-line name, adrift from it | The table's cells start at the row's top (`align-top`, 14 pixels each way, so a one-line row stays 48) |
| 4 | Ugly | the search in the empty state | the unbreakable address | Broken at any letter (`break-all`) | `overflow-wrap: anywhere`, which breaks only where it must |
| 5 | Ugly | the menu sheet's foot | (found looking at the captures) | Log out's words 14 pixels in from the caller's name and the switch | Its words start on the sheet's edge |

**Decisions, for the owner** (with the choices below): a long name and a run of part numbers wrap in full (recommended: keep, as the name tells two Parts apart), and the tab row cut at the screen's edge where it scrolls.

**What held up**: every count is grouped ("27,427 Parts", "Page 1 of 1,372", "All Categories 27,427"), with tabular figures; one Part says "1 Part"; nothing found keeps the tabs (all at 0 where the search finds nothing) and offers Create a Part; a 276-character name wraps without pushing anything off the row at 360 or 1440; nothing scrolls sideways at 360 (the tests check it); the search field keeps a long search inside itself.

### 21 October 2026: tests that changed, and why

No test lost an assertion.

- `catalog.ts`'s `searchTheCatalog` types the words and presses Enter, waits for the address to hold them, then chooses the Category's tab: DESIGN.md drops the Catalog's Search button and its Category select (ticket 06's table of components). `categoryTab` is new. `foundParts` reads a list's items on a phone or a table's rows from 64rem, as DESIGN.md lays the list out as a table there.
- `admin-catalog.spec.ts`: "a word of its name finds the made-up Part, which shows its Category's icon" became "…which its Category's tab counts, on a row with no picture": the assertion on the row's Category icon could not stand, as a row has no picture (the owner's "No picture on a row", ticket 06), and is replaced by the row having no picture and by the tabs' counts (CPU 1, GPU 0, All Categories 1, the current tab), four assertions for one. "Its part number finds it too" adds the count in words, "1 Part", no Search button and no plate. The Category test adds that the chosen tab is current. A new test at 1280 pixels: the search in the top bar, the table's three column headings, the table across the sheet, no sideways scroll, and `expectAccessible` in light and dark.
- `admin-edit.spec.ts`'s photo test read the second photo off the Catalog's row; the row has no picture now, so it checks that the row shows none, opens the Part from its row and finds the second photo there: the same promise, that the replaced photo is what the Admin reaches from the Catalog, with one assertion more.
- `development-logins.ts`: on a phone the Admin console keeps the caller's name and Log out in the menu sheet, so `openTheDashboardAs` and `logOutOfTheDashboard` open it there first (and close it after reading the name). The Vendor portal's frame, unchanged until ticket 11, needs no sheet.
- New: `admin-console-frame.spec.ts`, five tests: the sidebar and top bar at a desk's width with `expectAccessible`; 36-pixel controls under a mouse (Log out, a segment of the scheme switch, a section); the menu sheet on a phone (its 44-pixel button, its sections, scheme switch and 44-pixel Log out, Escape returning focus to the button); the menu sheet's transition (translate, 0.2 s, the drawer's curve) and only opacity with reduced motion; the scheme switch (Device first, Dark at once, kept across a reload and named before the body starts, Device following the device again).

### 21 October 2026: DESIGN.md corrected

With Impeccable's `document`, where building taught something: a Category tab's count is of what the search finds in it; the top bar's search moves toward the start side rather than under the caller and the switches when the window is too narrow to centre it; a Part in the Catalog is the table's Part, Manufacturer and Part numbers from 64rem and two lines on a phone, a long name wrapping rather than cut; and the menu sheet holds the caller's name above the scheme switch and Log out in the Admin console.

### 21 October 2026: the checks

- `pnpm check` passed before each commit, on exactly what was committed (the later pieces were set aside by copying, without stash or reset).
- `pnpm platform:check`, under the scratchpad's e2e lock: the first run, after commit 5, had 168 passed and 1 failed, `dashboard-languages.spec.ts`'s "after a made-up Vendor has chosen Arabic and logged out, the development Admin in the same browser still gets English…": my login helper, reading the Admin's name in the menu sheet on a phone, asked for the menu button to close the sheet, but an open sheet hides what is behind it from the accessibility tree, the button with it, so the sheet stayed open and the next logout waited for a hidden top bar. Fixed in commit 6; that spec and the frame's then passed (36).
- `pnpm platform:check` on the tip, `b69f96d`, under the lock: **169 passed**, none failed or flaky (5.4 minutes), every other screen with the new base among them.
- **Taste's inspector**, `pnpm dashboard:inspect <address> --scheme light|dark --app --widths 1440,768,360`, with the API and the dashboard started from the worktree under the lock and `apps/dashboard/design/taste/direction.json` restored into `.taste-skill/` (the direction's allowances from ticket 05: none, so no `--allow`). On the Catalog as it opens and on a search ("ryzen x3d" in CPU), in light and in dark: **0 FAIL** in all four runs; 0 WARN on the search, and 1 WARN on the Catalog as it opens in each scheme, `edge-text` at 360, "CPU cooler" 16 pixels from the phone's edge: the tab row scrolls sideways in its own row, as DESIGN.md asks, and the tab it cuts at the edge is the sign that it scrolls (for the owner, below). Its first run's photographs showed the table cut at its start (break-ui's first row), fixed before the final run. The photographs are in the owner's checkout at `.taste-skill/redesign-07/inspect/`.
- `expectAccessible` passes on the Catalog in light and in dark, on a phone (the existing test) and at 1280 pixels (the new one), and on the frame at 1280.
- 360 pixels first, logical classes only and Feature-Sliced Design's import rules: the dashboard's lint (`.oxlintrc.logical-classes.json`, `.oxlintrc.feature-sliced.json`) passes in `pnpm check`; the screen-search place is in `shared/ui`, the scheme in `shared/lib`, and the Catalog imports only `entities` and `shared`.
- Nothing was written to the development database by the redesign's tooling: the captures and the inspector only read, and the worst case was answered in the browser. The end-to-end tests made their own made-up Parts and Vendors, as they always do.

### 21 October 2026: for the owner

The review page is `.taste-skill/redesign-07/index.html` in the owner's checkout (served from `.taste-skill` on port 4110): the Catalog at 1440 in light and dark (`#r1`), with a Part opened beside it (`#r2`), at 768 (`#r3`) and 360 (`#r4`), the menu sheet (`#r5`), the scheme switch's three states (`#r6`), films of the motion at 360 with full and reduced motion (`#r7`), break-ui's Demo data / Worst case / Empty / One / Huge toggle at all three widths in both schemes (`#r8`), the inspector's results (`#r9`), and the choices below (`#q`). Every capture is the running app on the catalog's real Parts.

Choices to confirm or change:

1. **The Category tabs count what the search finds in each Category**, asked again with each search (eight small extra calls), rather than each Category's whole size.
2. **No Category on a row, even under All Categories**, as DESIGN.md has it; or a Category column (and line) under All Categories only.
3. **A long Part name and a run of part numbers wrap in full** (the longest real name takes four lines in the table and eight on a phone); or both clamped to two lines, whole on the Part's page.
4. **The caller's name on a phone** in the menu sheet, above the scheme switch and Log out.
5. **The tab row cut at the edge where it scrolls** (at 360, and beside an opened Part), which the inspector warns of once; or a fade at its end side.
6. **768 pixels takes the phone layout**, as DESIGN.md sets everything below 64rem, where Taste would keep a table on a tablet.
7. **The top bar's search** centred in the bar where the window allows, and moved toward the start side on a narrower desk (1280) rather than under the caller and the switches.

The box for showing the Catalog to the owner and recording the remarks stays open, and the Status stays, until the owner has looked and answered.
