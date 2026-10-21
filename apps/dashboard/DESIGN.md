---
name: The dashboard, Framed sheet
description: The work on a white sheet in a stone frame, and only prices and the rate on a money changer's plates.
colors:
  stone-frame: "#f1f0ed"
  sheet: "#ffffff"
  raised-stone: "#f5f4f2"
  active-stone: "#e9e8e5"
  edge: "#e6e5e2"
  rule: "#efeeec"
  control-edge: "#858480"
  ink: "#131416"
  note-grey: "#5d5f60"
  bazaar-teal: "#1b6c80"
  confirmed-green: "#1e7b4f"
  action-red: "#c4242a"
  plate-graphite: "#26292b"
  plate-amber: "#ecb64e"
  plate-unit: "#a7aaac"
  muted-plate: "#e9e8e5"
  muted-figure: "#55585a"
  night-frame: "#0d0d0d"
  night-sheet: "#161616"
  night-raised: "#1d1d1d"
  night-active: "#262626"
  night-edge: "#2a2a2a"
  night-rule: "#222222"
  night-control-edge: "#6f6f6f"
  night-ink: "#f2f2f2"
  night-note-grey: "#b4b4b4"
  night-teal: "#62b6ca"
  night-green: "#3fc07a"
  night-red: "#e5566f"
  night-plate: "#030303"
  night-plate-edge: "#3d3d3d"
  night-unit: "#9a9a9a"
  night-muted-plate: "#232323"
  night-on-primary: "#111111"
typography:
  screen-title:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 650
    lineHeight: 1.364
  title:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 650
    lineHeight: 1.4
  section:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.429
  row:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 550
    lineHeight: 1.429
  small:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.429
  figure:
    fontFamily: "Geist Mono Variable, monospace"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.444
    fontFeature: "tnum"
  figure-lead:
    fontFamily: "Geist Mono Variable, monospace"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: "tnum"
  unit:
    fontFamily: "Geist Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
rounded:
  sheet: "16px"
  card: "8px"
  control: "6px"
  plate: "4px"
  plate-lead: "6px"
spacing:
  sheet-inset: "8px"
  sidebar: "228px"
  top-bar: "48px"
  phone-bar: "56px"
  gap: "24px"
  pad: "24px"
  phone-pad: "16px"
  control-touch: "44px"
  control-mouse: "36px"
  row-two-line: "72px"
  row-one-line: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 14px"
  button-primary-fine-pointer:
    height: "36px"
  button-outline:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 14px"
  button-ghost:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 14px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 12px"
  sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
    padding: "24px"
  plate:
    backgroundColor: "{colors.plate-graphite}"
    textColor: "{colors.plate-amber}"
    typography: "{typography.figure}"
    rounded: "{rounded.plate}"
    padding: "3px 10px"
  plate-muted:
    backgroundColor: "{colors.muted-plate}"
    textColor: "{colors.muted-figure}"
    typography: "{typography.figure}"
    rounded: "{rounded.plate}"
    padding: "3px 10px"
  plate-lead:
    backgroundColor: "{colors.plate-graphite}"
    textColor: "{colors.plate-amber}"
    typography: "{typography.figure-lead}"
    rounded: "{rounded.plate-lead}"
    padding: "8px 16px"
  needed-mark:
    backgroundColor: "{colors.raised-stone}"
    textColor: "{colors.ink}"
    typography: "{typography.small}"
    rounded: "{rounded.plate}"
    padding: "0 6px"
---

<!-- Rewritten with redesign ticket 06 on 21 October 2026, from the direction the owner chose in redesign ticket 05, Taste's Framed sheet (its sheet and what the dashboard holds against it are in design/taste/), with the Rate Board kept as ticket 04 decided and the hard rules as ticket 03 left them. It replaces the Rate Board look written on 15 October 2026 and its components recorded from 16 to 20 October 2026 (ADR-0011). The components kept from then were built and chosen in the catalog, accounts and offers modules; each earlier choice of the owner's that this file replaces is listed under that ticket's Comments. -->

# Design System: the dashboard, Framed sheet

## Overview

**Creative North Star: "The Framed Board"**

The walls of Erbil's Qaysari Bazaar are a pale stone, and the money changers inside it hang a board of figures on dark plates, set by hand and dated. The dashboard takes both. A cool stone frame holds the navigation and the top bar, and the work lies on a white sheet set into it, with a hairline edge, soft corners and no shadow. On that sheet, only prices and the Platform Rate hang on graphite plates in amber, each with the date it was last set beside it. Everything else is ink and grey, so that the plates and what needs doing in red are the only colour on a screen.

The dashboard holds two surfaces. The Admin console, in English, is used on a phone in a Vendor's shop and at a desk. The Vendor portal, in Kurdish, Arabic and English, is used on a phone behind the counter, between serving people at it. Both are working screens, Operate in Impeccable's terms: tables with tabs and a filter bar on a wide screen, two-line rows on a phone, few words, and motion that confirms what the user did and keeps their place, never motion for show. Their controls are the ordinary ones of the web, on the dashboard's own shadcn/ui components on Base UI.

The direction is Taste's Framed sheet, dealt by `draw.mjs --app` and chosen by the owner by eye on 21 October 2026. Its sheet, as dealt, is in [design/taste/](design/taste/), with what the dashboard holds against it in [held-rules.md](design/taste/held-rules.md); this file is what every screen is built to. The shared floor is in [the root DESIGN.md](../../DESIGN.md), and the reasons in ADR-0006, ADR-0007 and ADR-0011.

**Key Characteristics:**

- One stone frame, L-shaped, holds the sidebar and the top bar with no rule between them; the work is on a white sheet inset 8 pixels, with 16-pixel corners, a 1-pixel edge and no shadow.
- Colour on under 3% of a screen: the plates, the chosen tab's 2-pixel teal line, the states, and red only where action is needed.
- Prices and the rate on graphite plates in amber, one plate to an Offer, dated, muted when out of stock; counts are words, never plates.
- Tables with underline tabs and a filter bar from 64rem; two-line rows on a phone, under one 56-pixel bar.
- Controls 36 pixels under a mouse and 44 on a touchscreen; no text under 14 pixels.
- Motion of 100 to 200 milliseconds on strong ease-out curves, on what the user does, never on what they read.

## Colors

The bazaar's stone, a white sheet, black ink, graphite plates with amber figures, one teal line for where you are, and red only where something needs doing. Each colour has a value for each scheme; its name in code follows it, from `@pcp/ui/themes/dashboard.css`. Every text colour meets 4.5:1 on every ground it is used on, and every control edge 3:1, in both schemes; a new colour is measured before it is used.

| Name | Light | Dark | In code |
|---|---|---|---|
| Stone Frame | `#f1f0ed` | `#0d0d0d` | `--frame` |
| Sheet | `#ffffff` | `#161616` | `--background`, `--card`, `--popover` |
| Raised Stone | `#f5f4f2` | `#1d1d1d` | `--secondary` |
| Active Stone | `#e9e8e5` | `#262626` | `--accent` |
| Edge | `#e6e5e2` | `#2a2a2a` | `--border` |
| Rule | `#efeeec` | `#222222` | `--rule` |
| Control Edge | `#858480` | `#6f6f6f` | `--input` |
| Ink | `#131416` | `#f2f2f2` | `--foreground`, `--primary`, `--ring` |
| On Primary | `#ffffff` | `#111111` | `--primary-foreground` |
| Note Grey | `#5d5f60` | `#b4b4b4` | `--muted-foreground` |
| Bazaar Teal | `#1b6c80` | `#62b6ca` | `--tab-line` |
| Confirmed Green | `#1e7b4f` | `#3fc07a` | `--success` |
| Action Red | `#c4242a` | `#e5566f` | `--destructive` |
| Plate Graphite | `#26292b` | `#030303`, with a `#3d3d3d` edge | `--plate`, `--plate-edge` |
| Plate Amber | `#ecb64e` | `#ecb64e` | `--plate-figure` |
| Plate Unit | `#a7aaac` | `#9a9a9a` | `--plate-unit` |
| Muted Plate | `#e9e8e5` with `#55585a` | `#232323` with `#9a9a9a` | `--plate-muted`, `--plate-muted-figure` |

### Primary

- **Ink**: text, the focus ring, and the one filled primary button of a pane, with On Primary text. It turns light in the dark scheme.
- **Plate Graphite** and **Plate Amber**: the plates and their figures, 7.9:1 in light and 11.2:1 in dark. In the dark scheme the plate is darker than the Night Sheet, with a lit 1-pixel edge, so that it reads as a plate and not as a grey chip; in light it is a dark plate on white.

### Secondary

- **Bazaar Teal**: the chosen tab's 2-pixel underline, and nothing else. It is the frame's one note of colour, taken from the sheet's own accent.

### The states

Each is also said in words and a mark, never in colour alone.

- **Action Red**: what needs the Vendor's or the Admin's action, such as an Offer about to expire, and the one destructive action of a dialog.
- **Confirmed Green**: confirmed today, in stock, an Offer added, Offers confirmed.

The dashboard has no warning colour: nothing on it is a warning that needs no action. The earlier Warning Brown was never used and is dropped.

### Neutral

- **Stone Frame**: the frame, the sidebar and the top bar, from 64rem; on a phone, the 56-pixel bar. A low-chroma stone from the bazaar's walls, cooled to stay clear of cream.
- **Sheet**: the ground of all work, and of an input, a menu and a dialog.
- **Raised Stone**: a row under the pointer, the "Needed" mark, a quiet panel such as the Part at the head of the Offer form.
- **Active Stone**: the section the user is in, the row of the Part open beside the list, the chosen segment of a switch.
- **Edge**: the sheet's 1-pixel edge, the tabs' rule, the line between the list and the pane opened beside it.
- **Rule**: the lines between rows, lighter than Edge.
- **Control Edge**: the border of an input, an outlined button or a segmented switch, wherever the border alone shows the control, at 3:1 on the Sheet and on the Stone Frame.
- **Note Grey**: secondary lines, column headings, idle navigation, a unit on a light ground.

### Named Rules

**The Amber Is Only on Plates Rule.** Plate Amber appears on Plate Graphite and nowhere else: not as an accent, not on the page, not as a glow.

**The Red Is for Action Rule.** Action Red marks what someone must do, and always beside words that say what.

**The Three Percent Rule.** Colour covers under 3% of a screen. The frame and the chrome are grey; the data carries the colour.

## Typography

**Body Font:** Geist (with Noto Sans Arabic for Kurdish and Arabic)
**Arabic-script Font:** Noto Sans Arabic
**Figure Font:** Geist Mono, for the figures on plates, part numbers and a temporary password

**Character:** a quiet, precise grotesque and its monospace, beside a clear Arabic-script sans: the voice of a well-kept ledger read at a glance. The fonts are unchanged (ADR-0006); hierarchy comes from size, weight and colour.

### Hierarchy

The sizes are the root DESIGN.md's shared scale, in `rem`, but for the two the root lets a look set for itself: the screen's title and the text in buttons, both taken from Taste's sheet, as the owner chose on 21 October 2026.

- **Screen title** (650, 1.375rem, 1.364): a screen's title, 22 pixels at every width, from Taste's sheet.
- **Title** (650, 1.25rem, 1.4): a Part's name at the head of its page.
- **Section** (600, 1rem, 1.5): a section's heading inside the sheet, the banner's and a note's title, a dialog's title.
- **Body** (400, 1rem, 1.5): sentences, and the text in every input. An input keeps 16 pixels (17 in Kurdish and Arabic) at every width, because a phone's browser zooms into a focused input whose text is smaller.
- **Button** (500, 0.875rem, 1.429): the text in every button and every link drawn as one, 14 pixels from Taste's sheet, and 15 in Kurdish and Arabic by the Tall Script Rule.
- **Row** (550, 0.875rem, 1.429): the name in a row of a table or list.
- **Small** (400, 0.875rem, 1.429): a row's secondary line, column headings, states, descriptions below a field.
- **Figure** (600, 1.125rem, tabular figures): a price on a row's plate.
- **Figure lead** (600, 1.875rem, tabular figures): the one leading plate of a screen, at the shared scale's largest size.
- **Unit** (500, 0.875rem, Geist): "$" and "IQD" after a figure, a quiet suffix in Plate Unit.

A figure's grouping comma is set in Geist, not Geist Mono, so that it does not take a whole cell: "266,000", never "266 , 000". Part numbers are in Geist Mono at the small size, in Note Grey. A temporary password, shown once after a Vendor is created or reset, is in Geist Mono at 1.5rem, weight 700, on a Raised Stone panel, never on a plate: it is not a figure, and its look keeps a and o, or 5 and s, apart for the Admin reading it out.

Kurdish and Arabic follow the root's Tall Script Rule (15, 17 and 19 pixels, looser lines), from the page's language. Figures are always Western digits, so Geist Mono serves all three languages.

### Named Rules

**The One Leading Plate Rule.** A screen has at most one large plate, and only where one figure is the screen's answer.

**The Fourteen Pixel Rule.** Taste's 12-pixel small size is not used: column headings, captions and every secondary line are 14 pixels (15 in Kurdish and Arabic).

## Layout

**From 64rem, the frame.** One Stone Frame holds a sidebar 228 pixels wide on the start side and a top bar 48 pixels high along the top, with no rule between them, an L. The sheet fills the rest, butting against the sidebar and the top bar, inset 8 pixels from the window's end and bottom edges, with 16-pixel corners, a 1-pixel Edge and no shadow; in Kurdish and Arabic the inset falls on the left, the end side. Inside the sheet, 24 pixels of padding, and one gap, 24 pixels, horizontally and vertically. The content is at most 80rem wide, on the start side.

**Below 64rem, the sheet is the screen.** The frame disappears. One bar, 56 pixels high on the Stone Frame, holds the menu button on the start side, the screen's scope in the middle (the Vendor's name as it writes it, or "Admin console"), and at most one action on the end side, such as Add an Offer. The sections, the language and scheme switches and Log out are in the menu sheet. The sheet below has 16 pixels of padding and a 16-pixel gap. A screen that feels heavy with controls on a phone takes fewer rows of them, not smaller ones.

**Controls.** Every control is 44 pixels high on a touchscreen. Under a mouse, a fine pointer, from 64rem, it is 36 (`@media (pointer: fine) and (min-width: 64rem)`), never lower. Inputs keep the body size, 16 pixels, at every width, so that a phone does not zoom into them; buttons take the Button type, 14.

**A screen.** Its title row first: the title on the start side, and on the end side at most one outlined secondary and the screen's one primary. Then what needs action (the expiry banner), then the list's tabs, the filter bar and the list. A screen's own search sits in the top bar's centre from 64rem, 548 pixels wide, on the Sheet ground, and moves toward the start side, rather than under the caller's name and the switches, when the window is too narrow to centre it; on a phone it is the first row of the sheet below the tabs, as wide as the sheet. It searches when Enter or the keyboard's search key is pressed; it has no Search button of its own.

**Lists from 64rem: a table with tabs and a filter bar.** Underline tabs for the list's states or Categories on a full-width rule; the filter bar below them, with the count in words on the end side; then the table, on the sheet with no card around it. Its header is a row of Small Note Grey labels in sentence case, with no fill and no rule. Rows are 48 pixels for one line and 72 for two, divided by Rule lines, the name's column given the most width, figures end-aligned in tabular figures. A column that would be empty in every row is left out.

**Lists on a phone: two-line rows.** Line one, what the row is; line two, its secondary line in Note Grey; then, on a line of its own, the plate if it has one; then one Small line with the states. The tabs scroll sideways in their own row, which fades at its end side while more lie beyond it.

**The Catalog and the Vendors** keep their list on the start side. Until a Part or a Vendor is opened, the list takes the sheet's whole width; once one is opened, from 64rem, the list keeps seven twelfths and the opened Part, its edit form or a new Part takes five, past an Edge line, and the open row is on Active Stone. On a phone the opened screen takes the whole screen. The Catalog's Categories are its tabs, each with its count in Note Grey, "CPU 791", All Categories first. A tab's count is of what the search finds in that Category, asked for again with each search, so that the Admin sees where the results are before choosing one (built in redesign ticket 07: Taste's counts follow the view).

**The Vendor portal** opens on its Offers screen: the title row with Add an Offer, the expiry banner while an Offer needs confirming, the line that says how many Confirm all confirmed, the tabs All, Need confirming and Out of stock, each with its count, the search, and the table. A Vendor with no Offer gets the empty state in place of the tabs, the search and the table. The details screen is the portal's second section.

The portal's catalog search has a back link, its title and one Note Grey sentence, then the note after an Offer is added, the search with its Category, the count in words and the rows. The Offer form has a back link to the search, its title and a Note Grey sentence, then the form in one column at every width, at most 40rem wide. An Offer's own screen has a back link to the Offers, its title, its leading plate with its Confirmation, a Note Grey sentence that saving it confirms it, the Offer form filled with the Offer's details, and below the form, on a row of its own, the outlined Remove the Offer, as wide as the form on a phone.

## Elevation & Depth

Flat, by one tone step. The frame is Stone, the sheet is white, and that step is all the depth a screen at rest has: no shadow on the sheet, a card, a row or a panel. Inside the sheet, a panel is told apart by a Raised Stone ground or by an edge, never both, and never a fourth level: frame, sheet and one panel are enough.

Only what floats over the screen casts a shadow: a dialog and the menu sheet, over a scrim that dims the screen to 40% black, `0 8px 24px rgb(0 0 0 / 0.12)`, so that it reads as lifted. In the dark scheme the shadow cannot be seen, and the floating surface's 1-pixel Edge carries it. The scrim is a plain dim, never a blur.

### Named Rules

**The One Step Rule.** Depth at rest is the frame's tone against the sheet's white. A row, a panel or a field gets a change of ground or a border, never a shadow.

## Shapes

Soft outside, firm inside. The sheet has 16-pixel corners; a card or a panel on it (the banner, a note, a refusal, the Part at the head of the Offer form, a dialog) 8; a control 6; a plate 4, and the leading plate 6. Plates are always rectangles, sized to their figures. The scheme switch and the language switch are segmented, one 6-pixel rectangle with its segments inside. Nothing is a pill, and nothing is an icon in a tinted square.

## Components

The dashboard's own shadcn/ui components, on Base UI, are in `apps/dashboard/src/shared/ui`. They were created in shadcn/ui's Mira style; their look follows this file, not Mira's defaults.

### Buttons

- **Shape:** 6-pixel corners, 44 pixels high on a touchscreen and 36 under a mouse, 14 pixels of padding on each side, the Button type, 14 pixels at weight 500 (15 in Kurdish and Arabic), a 16-pixel icon before the words where one helps.
- **Primary:** Ink ground with On Primary text, one in each pane, for the action the pane is for: Confirm all my Offers, Save the Offer, Create the Part. It turns light in the dark scheme.
- **Outline:** a Control Edge border on the Sheet, for every other action: Add an Offer, New Part, Edit, a page of results.
- **Ghost:** no edge, for a quiet action: Log out, the menu button, Deactivate again.
- **Hover / Focus / Press:** hover takes a Raised Stone ground, and a primary goes to 90% opacity; focus draws a 2-pixel Ink outline 2 pixels out, at full strength, at once; a press scales the button to 0.97 (Motion).
- **Busy:** while its action is on its way, the button keeps its width, its words say so ("Confirming…", "Removing…", "Saving the Part…"), and it waits, at full strength. Both words sit in one cell, the one not shown hidden, so the button is as wide as the longer; the busy words are kept no longer than the button's own, so that the button at rest is not wider than its words ("Sending…" on Add a photo, redesign ticket 08).
- **A link or a label that looks like a button** takes the same classes through `buttonVariants`, merged so that the variant's edge wins.

### Inputs and choices

- **Style:** Sheet ground, a Control Edge border, 6-pixel corners, 44 pixels high on a touchscreen and 36 under a mouse, body-size text, a placeholder in Note Grey. A search field has a magnifier in Note Grey on the start side.
- **Choice:** the browser's own select, so that a phone opens its own picker, with a chevron in Note Grey on the end side.
- **Boxes to tick:** the browser's own checkbox, 20 pixels, in two columns of rows 44 pixels high, each with its label.
- **Switch:** for a choice that is on or off, such as whether a Part is in stock: a track 24 by 44 pixels that takes a tap 44 pixels high, in Control Edge when off and in Ink when on, its thumb on the end side when on, in either direction. Its label is on the start side of a row 44 pixels high, the switch on the end side, and its sentence below in Note Grey.
- **The language switch** (the Vendor portal): segmented, the three languages each by its own name in its own script, کوردی, العربية, English, the chosen one on Active Stone at weight 600. The page's language comes from its address (ADR-0008), so choosing one opens the same screen in it.
- **The scheme switch** (both surfaces): segmented, three icon segments each named, Light (a sun), Dark (a moon) and Device (a screen), the chosen one on Active Stone, `aria-pressed`. It sits beside the language switch, after it, in the top bar from 64rem and in the menu sheet on a phone; the Admin console, in English only, has it alone where the language switch would be. Device follows the device's scheme, and is the first choice; the choice is remembered in the browser, as the Vendor portal's language is, and set before the first paint so that no screen flashes the other scheme.
- **Focus:** the same 2-pixel Ink outline as a button.
- **Error:** the field's edge in Action Red, and one sentence in Action Red below it that says what is wrong, which the control names as its description.

### Fields

- **Label:** small size, weight 500, above its control. A needed specification carries a "Needed" mark beside its label: small, weight 500, on Raised Stone with 4-pixel corners, which the control also names as part of its description. A label's row is as high with the mark as without it, so that two fields side by side start their controls on one line.
- **Groups:** a field set with its legend, in the Section type. Two fields to a row where the form itself is 40rem wide, a container query on the form, not the window: a form opened beside a list on a desk has five twelfths of the sheet and goes one field to a row there (redesign ticket 08). A list, a set of boxes or a list of rows takes the whole row; a row of a list of rows puts its own fields side by side where the form is 40rem wide.
- **The form's button:** last, below the form, as wide as the form where the form is under 40rem wide. A refusal that names no field is the refusal panel directly above it, where the Admin's eye is after pressing it, scrolled into sight with it, never at the head of a long form.
- **Lists:** each entry a line with a square remove button beside it, as high as a control, and an outlined Add button below. A list of rows puts each row in an Edge box with 6-pixel corners.
- **Optional:** a detail a form lets the person leave out carries an "Optional" mark beside its label, drawn as the "Needed" mark is, and named by its control as part of its description. The label itself stays the detail's name.
- **Several lines:** an address or opening hours is a textarea styled as an input, at least 96 pixels high and growing with its text, laid out in the direction of what is typed.
- **Description:** each length limit and each form a value may be written in is said below the control in Note Grey, before its error.
- **The Offer form:** the Part at its head, on a Raised Stone panel with 8-pixel corners: its picture, its name at weight 550, one Note Grey line with its manufacturer and its Category, and its part numbers on a Note Grey line of their own, each English text starting on the start side. Then the prices as a group, its legend "Your price" and a Note Grey sentence that one or both are given, each price on its own row with its currency in its label, "In dollars ($)" and "In dinars (IQD)", its control left to right, and below it the way it is written, with an example; then the in-stock switch; then the warranty, in months, marked optional; then the pane's one primary button, as wide as the form on a phone. A refusal from the API is the field's error, beside it. A refusal that names no field, such as a second Offer for the Part, is the refusal panel above the form's prices. The owner chose it on 20 October 2026, over the prices side by side with the currency inside the field and over the Part between rules with the button pinned to the bottom of the screen. The same form changes an Offer: it starts with the Offer's details as they are, each price written as the portal shows it, in Western digits grouped in thousands without its currency, "1,250.50" and "1,875,000", a detail not stated left empty, and its button says "Save the Offer".
- **The map location:** its coordinates, left to right, and below them an outlined button with a locating mark that fills them from the device's position. While it looks, a Note Grey line says so; a refused or missing position is said in Action Red in the same place, and the coordinates can still be typed.

### Tabs

- **Underline tabs** on a full-width 1-pixel Edge rule: each a link 44 pixels high (36 under a mouse), 20 pixels apart, its label in Note Grey and its count after it in Note Grey at weight 400; the current one in Ink at weight 600 with a 2-pixel Bazaar Teal line as wide as its label, `aria-current="page"`. Each tab is in the screen's address, as the search and the page are, so a reload or the back button keeps it. Where the tabs do not fit, on a phone or beside an opened Part, they scroll sideways in their own row, and the row fades over its last 32 pixels on its end side while more tabs lie beyond it (mirrored in Kurdish and Arabic), and not once it is scrolled to its end or while a tab has the keyboard's focus; the owner chose the fade over the tab cut at the edge in redesign ticket 07. It is the theme's `fade-end`. Taste's inspector still measures the cut tab's box and warns of it (`edge-text`), as it does not see a fade.
- **Where:** the Catalog's Categories; the Vendor portal's Offers, All, Need confirming and Out of stock. A list with no states has no tabs.

### Rows and tables

- **Character:** a list is a table from 64rem and two-line rows on a phone, never cards. Rule lines divide the rows. The whole row is the link, with a Raised Stone ground under the pointer, while the link's name is the row's own name alone.
- **A Part in the Catalog:** its name in the Row type, its manufacturer in Note Grey, and its part numbers in Geist Mono at the small size in Note Grey, left to right: from 64rem the table's columns Part, Manufacturer and Part numbers, the name's column half the table; on a phone its name on the first line and its manufacturer and part numbers on the second. A long name wraps rather than being cut, since it is what tells two Parts apart. No picture in the row: the Category is the tab the Admin is in, and a boxed Category icon on every row was the template's habit. The row of the Part open beside the list is on Active Stone.
- **An Offer's row**, on the Vendor portal's Offers screen: the Part's name in the Row type and one Note Grey line with its manufacturer and its Category; its plate, holding both its prices, the dollars before the dinars, "169 $ 266,000 IQD"; then its last Confirmation, its stock and its warranty. From 64rem these are the table's columns, Part, Price, Last confirmed, Stock and Warranty; on a phone the plate is on a line of its own under the name, so that the name keeps the whole width, and the three are one Small line below it. The Confirmation is a word and its own mark: confirmed today in Confirmed Green with a circled tick, an older one in Note Grey with a clock, about to expire with the days left and expired with its days, both in Action Red at weight 550, with a warning triangle and a circled cross. In stock is in Confirmed Green; out of stock in Note Grey, with the Part's name in Note Grey and the plate muted. A warranty that is not stated is left out on a phone, and is a Note Grey dash named "No warranty stated" in the table's column. The whole row is the link to the Offer's own screen.
- **A Part the portal's catalog search found:** its name in the Row type, one Note Grey line with its manufacturer and its Category, and its part numbers on a Note Grey line of their own, left to right, so that the number on the box is read whole. A Part the Vendor offers adds a line at weight 500 in Confirmed Green after a circled tick, "You offer this Part", and the row leads to its Offer; any other row leads to the Offer form. The owner chose it on 20 October 2026 over the Catalog's one secondary line and over an outlined Add or Open at the row's end.
- **A Part's page:** at its head, the picture, the Part's name in the Title type and one Note Grey line with its manufacturer and Category; then, in Action Red at weight 550 after a circled exclamation mark, what it lacks, "Lacks Socket, TDP, Memory types", as a Part missing specifications says it, or, when it lacks nothing, "Every needed specification is known" in Note Grey after a circled tick; then Edit and Add a photo, outlined. Below, its details (part numbers, source, last changed) and, after the Section heading "Specifications", every specification of its Category's list, all as rows of details. A list of rows inside a specification, such as the M.2 slots, is a compact table, rows of 36 pixels, its numbers flush with the column's end in tabular figures. Each word of a part number is kept whole on its line (redesign ticket 08).
- **A Category to choose:** the first step of a new Part, the eight as two-line rows: the Category's icon plain in Note Grey, its name in the Row type, and on the second line what its form will ask, "29 specifications, 3 needed", then a chevron. The whole row is the link.
- **A Part missing specifications:** its name, one secondary line with its manufacturer, its Category and its count of Offers in words, then one line in Action Red after a circled exclamation mark that says what it lacks, "Lacks TDP, Memory types", by the needed specifications' labels. The whole row opens the Part's edit form, beside the list from 64rem, and saving returns to the list. The owner chose it on 20 October 2026 over rows grouped by Category with a mark for each missing specification and a plate for each count of Offers.
- **A Vendor's row:** its name as it writes it, then one secondary line with its login phone number and, for a deactivated Vendor, the "Deactivated" mark, drawn as the "Needed" mark is.
- **A Vendor to remind:** on the Expiring Offers, its name as it writes it, then one line in Action Red after a circled exclamation mark that says why, "1 Expired Offer · 4 about to expire", leaving out a count of none, then its phone number and its WhatsApp number in Iraq's own form, left to right, each an underlined link as high as a control on one line: the phone number after a phone mark, as a `tel:` link, and the WhatsApp number after a speech-bubble mark and before the new-tab mark, as a `https://wa.me/<digits>` link in a new tab. A Vendor with no WhatsApp number says "No WhatsApp" in Note Grey in its place. The whole row leads to the Vendor's page, and the two numbers are links of their own above it. The owner chose it on 20 October 2026 over the two numbers as outlined button-sized links at the row's foot.
- **A Vendor's details:** a row each, divided by Rule lines, the detail's name in Note Grey on the start side and its value beside it, two fifths and three fifths of the row, at small size. What the Vendor wrote takes its own direction; a phone number, the coordinates and an Instagram name run left to right. A Vendor's page in the Admin console and the Vendor portal's details screen share them; the details screen puts them in three groups, the Vendor, its contact details and its Login, each after a heading in the Section type. Beside the contact details' heading, or below it when the row is too narrow, an outlined button-sized link, "Edit", opens the Vendor's form for them, a screen of its own with a back link above its title, in the portal's language, with the six contact details in one group and no legend.
- **A Vendor's actions:** on its page in the Admin console, below its name, in two groups, each a row that wraps on a phone. First the outlined button-sized links: Edit, with a pencil mark before it, and Open its portal. Then, on a row of their own, the actions that log the Vendor out or let it back in, each opening the alert dialog: the outlined Reset the password, with a key mark before it, and Deactivate, or for a deactivated Vendor Reactivate and Deactivate again. Edit opens the Admin's Vendor form, filled with the Vendor's details as they are, on a screen of its own titled "Edit" and the Vendor's name as it writes it, with a back link above the title that names the Vendor too, saved with "Save".
- **The picture of a Part:** on a Part's page and at the head of the Offer form, its photo in a square with 8-pixel corners and a 1-pixel Edge, so that a product shot on white keeps its edge on the Sheet, 80 pixels on a Part's page and 48 in the form, or, for a Part with no photo, its Category's icon drawn at 32 pixels in Note Grey, plain, with no tinted square (CAT-6).

### Plates

- **The plate** is the look's signature, the Rate Board, kept as the owner decided in redesign ticket 04: figures in Plate Amber, Geist Mono at 18 pixels, weight 600, tabular, on Plate Graphite with 4-pixel corners and 10 pixels of padding each side, sized to its figures. Each figure is followed by its unit, a smaller Plate Unit suffix in Geist, and an Offer with both prices puts both on its one plate, the dollars first, 14 pixels apart. The plate is drawn left to right in every language, and named as one image with its words, "169 dollars, 266,000 dinars".
- **Dated:** the plate's date is beside it, the Offer's last Confirmation on the same row, in the next column from 64rem and on the line below on a phone.
- **Muted:** an out-of-stock Offer's plate is Muted Plate, its figures and units in its grey, with no edge, so that no one reads a price that cannot be bought as a live one.
- **Where:** only on prices and the Platform Rate. Never on a count: the Catalog's Parts, a search's results, the Vendors, a Part's missing specifications and the Offers screen's count are words, "16 Parts".
- **The leading plate:** where one figure is the screen's answer, it is set on one larger plate under the title, Figure lead at 30 pixels with 14-pixel units, 6-pixel corners and 16 pixels of padding each side, with its date beside it in Small Note Grey. It leads two screens:
  - **The Platform Rate:** the rate, "1 $ = 1,575 IQD", and the day the Admin set it.
  - **An Offer's own screen:** the Offer's price as Shoppers see it now, both currencies on the one plate, with its Confirmation, "Confirmed 8 days ago"; muted when out of stock. It shows the saved price, and changes only when the form is saved.

  No other screen has a leading plate, because no figure leads it: the Offers screen's question is which Offers need confirming, a count, which the banner answers in words; the Catalog, a Part, the Vendors, a Vendor, the forms, Missing specifications, Expiring Offers and the details screen have no price. The Offer form for a new Offer has no plate, as its price is not set yet.

### States

- **Empty:** centred in the sheet between two Rule lines, with the screen's icon at 32 pixels in Note Grey, plain, a title in the Section type, a sentence in Note Grey, and the action that helps, such as Create a Part. A list whose aim is to be empty says the work is done: the Missing specifications' empty list is "Nothing is missing", with a circled tick, and the Expiring Offers' is "No Vendor needs reminding", with the same tick. A tab that finds nothing says so in one Note Grey line, "No Offer needs confirming".
- **The expiry banner:** at the head of the Vendor portal's Offers screen, under its title and above the tabs, only while an Offer is expired or about to expire. A Sheet panel with an Action Red border and 8-pixel corners: a warning triangle and a title in Action Red in the Section type, then one sentence for each count that is not 0, the count in weight 650 and not on a plate, then a Note Grey sentence on what confirming means, then the pane's one primary button, "Confirm all my Offers", on the end side from 64rem and as wide as the panel on a phone. While it is on its way the button says so and waits; a refusal is said below it in Action Red. The owner chose it on 20 October 2026, over the counts on plates and over a compact panel without a title, and its place under the title over a banner pinned to the bottom of the screen and over one below the search.
- **Confirm all's result:** once the API answers, one line in Confirmed Green at weight 500, with a double tick, says how many Offers were confirmed, and stays after the banner has left. The rows it changed show their new Confirmation, and the banner leaves (Motion).
- **The note after an Offer is added:** on the catalog search the form returns to, above the search kept as it was, until the next search. A Sheet panel with a Confirmed Green border and 8-pixel corners: a circled tick and the title "Offer added" in Confirmed Green in the Section type, then one sentence at small size that names the Part, then an underlined link as high as a control, "See your Offers". It is announced when it appears. The owner chose it on 20 October 2026, over one Confirmed Green line with a tick and no link.
- **An Offer that no longer exists**, opened by an old link: in the Offer form's place, the empty state, with a crossed package, the title "This Offer no longer exists", one Note Grey sentence that it was removed, and an outlined button-sized link, "Open your Offers".
- **Refusal:** a Sheet panel with an Action Red border and text, 8-pixel corners, its title saying what was not done and its sentence why, with the API's status and code kept in English. A refusal that gives no reason ends its sentence with the code, never with a hanging colon.
- **A screen that could not read what it shows**, such as a Part the API did not give: a screen of its own, its title saying what was not done, "The Part could not be read", the refusal panel with why, and an outlined Try again (redesign ticket 08).
- **Loading:** rows sketched in Raised Stone where the first answer will be, still. While the next answer arrives, the last stays at full strength, and a line beside the count says "Searching…".
- **Missing:** a specification the Part lacks reads "Not known" in Note Grey; a needed one reads "Needed, not known" in Action Red at weight 550, after a circled exclamation mark.

### Dialogs

- **The alert dialog** asks to confirm an action that logs a Vendor out, such as resetting its password or deactivating it, or that lets it back in, reactivating it, and, in the Vendor portal, in the portal's language, the removal of an Offer. A refusal is said in it, in Action Red at small size above its buttons: what was not done, then why the API did not answer. The dialog stays open to try again, and closes only when the action is done.
- **Its look:** it floats over the scrim, on the Sheet with an Edge border, 8-pixel corners and the shadow of what floats, 24 pixels of padding. On a phone it is as wide as the screen but for a 16-pixel gutter, and never wider than 28rem. Its title in the Section type and its sentence in Note Grey, both on the start side; its buttons as high as a control, stacked on a phone with the action on top, and in a row on the end side from 40rem, Cancel outlined before the action.
- **The action** that cannot be taken back without another, such as Deactivate or Remove, is drawn in Action Red, the one red of the dialog, because it is what needs care. Reactivate, which logs nobody out, is drawn as the primary button.
- **It moves** as Motion says: in from 0.96 and out faster than it came.

### Removing an Offer

- **On an Offer's own screen**, below the form: an outlined "Remove the Offer" with a bin mark before it, as wide as the form on a phone, which opens the alert dialog. Its title asks "Remove this Offer?", and its sentence names the Part in English and says that Shoppers no longer see the Offer and that it can be added again from the catalog search. Remove is in Action Red, after Cancel. While the removal is on its way, its button says so and waits, and neither button closes the dialog.
- **A removal that is refused** is said in the alert dialog, as every refusal there is: that the Offer was not removed, and why. The dialog stays open to try again. Once the Offer is removed, the screen returns to the Offers, whose list no longer holds it when it appears.

### Deactivating a Vendor

- **On a Vendor's page**, after Reset the password: an outlined "Deactivate", which opens the alert dialog naming the Vendor as it writes it and saying what deactivating does; for a deactivated Vendor an outlined "Reactivate" in its place, whose alert dialog says that the Vendor logs in again with the password it had, and after it a ghost "Deactivate again", which opens the alert dialog too. While either action is on its way, its button says so and waits.
- **A deactivation that is refused**, or that failed halfway, is said in the alert dialog: that the Vendor was not deactivated in full, and why. The dialog stays open, so that the Admin deactivates again at once.
- **Deactivate again** finishes a deactivation that failed halfway after the Vendor was marked, and changes nothing otherwise. The page cannot tell such a Vendor from one deactivated in full, so every deactivated Vendor's page has it, quiet beside Reactivate.
- **A reactivation that is refused** is said in its alert dialog: that the Vendor was not reactivated and is still deactivated, and why. The dialog stays open to try again.

### The hand-over

- **After a create:** the Vendor's name as the screen's title, one line that it is made, then the temporary password under its label, with a Note Grey sentence that it is shown this once.
- **After a reset:** on the Vendor's page, below its actions and above its details, one line that the password is reset and the Vendor logged out, then the temporary password and the hand-over drawn as after a create. A second reset replaces both.
- **The message's language:** three choices in a row, each the browser's own radio, 20 pixels, inside a box as high as a control with a Control Edge border and 6-pixel corners, labelled with the language's own name in its own script; the chosen one on Active Stone at weight 600, as the language switch marks its language.
- **The link:** the pane's one primary button, "Open the chat in WhatsApp", with a speech-bubble mark before it and the new-tab mark after it.

### Navigation and the frame

- **The sidebar** (from 64rem), on the Stone Frame: the surface's name at its head, with no logo, since none is decided (PRODUCT.md's Brand Commitments): the Vendor's name as it writes it and "Vendor portal" below it in Note Grey, or "Admin console"; then the sections, 20 pixels below, each a link as high as a control with 6-pixel corners, its icon and its name in Note Grey, and the one the user is in on Active Stone, in Ink at weight 600, `aria-current="page"`.
- **The Admin console's sections:** the Catalog, the Vendors, the Missing specifications and the Expiring Offers, and the Part Requests, the Platform Rate and the Referrals as they are built.
- **The Vendor portal's sections:** Offers, its first screen, and Details, and the portal's later screens as they are built. The plain messages for a Login with no Vendor and for a deactivated Vendor have no sections: they get the frame's top bar with its switches and Log out, and one plain sentence of their own on the sheet.
- **The top bar** (from 64rem), on the Stone Frame with no rule: the screen's search in its centre, if it has one; on the end side, the caller's name in Note Grey (the Admin console), the language switch (the Vendor portal), the scheme switch, and a ghost Log out, last.
- **On a phone,** the 56-pixel bar holds the menu button, the scope and one action. The menu button opens the **menu sheet** from the start side: a panel on the Stone Frame as tall as the screen and at most 20rem wide, over the scrim, with the surface's name at its head, the sections as in the sidebar, then the language switch, the scheme switch and Log out at its foot; in the Admin console the caller's name in Note Grey stands above them, since the phone's bar has no room for it. Choosing a section, tapping the scrim, the menu button again or Escape closes it, and focus returns to the menu button.
- **The band, while the Admin acts as a Vendor:** across the whole window, above the frame, on Active Stone with an Edge line below, so that it is never taken for part of the Vendor's own portal. On the start side, one sentence at small size and weight 500 that names the Vendor as it writes it, followed, for a deactivated Vendor, by one that says it is deactivated; on the end side, an underlined link as high as a control back to the Vendor's page in the Admin console. The link takes the row below when the sentence fills the row. It is in the portal's language, because the Vendor may be reading over the Admin's shoulder.
- **Back:** a small Note Grey link above a screen's title, with a chevron that points back in the reading direction, underlined under the pointer, as high as a control.

## Motion

Led by Emil Kowalski's skills (`emil-design-eng` and `animate`), from the owner's `review-animations` of 21 October 2026. The dashboard is a working screen seen tens of times a day, so most of it stays still; what moves, moves to confirm what the user did, to show where something came from or went, or to keep their place when something leaves. Every movement is a CSS transition (or `@starting-style` for an arrival) on `transform` and `opacity`, so it runs off the main thread on a weak phone and is retargeted, not restarted, when it is interrupted. No animation library.

### Tokens

In `@pcp/ui/themes/dashboard.css`'s `@theme`, so that Tailwind's `ease-out`, `ease-in-out` and `ease-drawer` utilities take them:

| Token | Value | For |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | everything that arrives, leaves or is pressed |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | a space closing after something leaves |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | the menu sheet |
| `duration-100` | 100 ms | a colour under the pointer, on CSS's `ease` |
| `duration-150` | 150 ms | a press, the switch's thumb, every exit |
| `duration-200` | 200 ms | every arrival, and a space closing |

Nothing lasts longer than 200 milliseconds, but Confirm all's settle, whose rows follow one another 30 milliseconds apart. An exit is faster than its arrival. `ease-in` is never used, nor Tailwind's built-in curves.

### What moves

1. **The press** (`#m1`). A button, a link drawn as one, a segment of a switch, the menu button: `scale(0.97)` while pressed, 150 ms on `--ease-out`, back from wherever it is on release. Rows, tabs and navigation links do not scale: they are wide and hold what the user reads, so they take their ground's colour instead.
2. **A colour under the pointer** (`#m2`). Rows, navigation links, tabs, buttons and the back link change their ground or underline over 100 ms on `ease`, one timing everywhere. Tailwind already shows hover only to a pointer that can hover. The focus outline is never transitioned: it is there at once.
3. **The alert dialog** (`#m3`). With Base UI's `data-starting-style` and `data-ending-style`: the dialog arrives from `opacity: 0` and `scale(0.96)`, 200 ms on `--ease-out`, from its centre, since it is anchored to no control; the scrim's opacity with it. It leaves the same way in 150 ms. Its buttons work from the first frame.
4. **The switch's thumb** (`#m4`). It slides to the end side in 150 ms on `--ease-out`, and the track's colour changes with it.
5. **The menu sheet on a phone** (`#m5`). It slides in from the start side, `translateX(-100%)` to `0`, 200 ms on `--ease-drawer`, with the scrim's opacity; it leaves back the same way in 150 ms on `--ease-out`. The screen beneath does not move.
6. **Something arrives** (`#m6`): the note after an Offer is added, a refusal panel, Confirm all's result line, an entry the Admin adds to a list in a form (a part number, a row of M.2 slots), which also takes the focus. From `@starting-style`, `opacity: 0` and `translateY(6px)`, 200 ms on `--ease-out`. Its live region announces it at once, whatever the motion. The entries a form opens with do not arrive: the screen itself never fades in. A photo added while its Part's page is open fades in where the icon or the old photo was, in place, with no rise.
7. **Confirm all's result** (`#m7`). The rarest and most consequential press on the portal, so the one place with a stagger. When the API answers, each changed row's Confirmation fades to its new state, "Confirmed today", 200 ms on `--ease-out`, each row 30 ms after the one above it, the first ten rows of the screen only; then the banner leaves as 8 says, and the result line arrives as 6 says. The plates do not move.
8. **Something leaves a list** (`#m8`): rows leaving the Need confirming tab after Confirm all, the expiry banner, any row a list drops while the user is on it. First its `opacity` to 0 in 150 ms on `--ease-out`; then its space closes, `grid-template-rows` from `1fr` to `0fr`, 200 ms on `--ease-in-out`, so the rows below rise into place rather than jump. A leaving row is inert. An entry the Admin removes from a list in a form leaves the same way, and hands the focus at once to the entry that takes its place, or the one before it, or the list's Add button; it is taken out of the form's values once it has left. A removed Offer is not seen leaving: it is removed on its own screen, and the Offers come back without it.

### What stays still

9. **Still, on purpose** (`#m9`). The plates and their figures (a price never counts up, flashes or slides); the tabs, whose line moves to the chosen tab at once; changing screens, the Catalog's pages, search results, sorting; the language switch, which opens the same screen in another language; the scheme switch, which changes every colour in one frame, with transitions suppressed for that frame so that nothing smears; the focus outline; the loading sketches, which do not shimmer; the desktop sidebar. Anything the keyboard does many times an hour is still.

### When a movement is interrupted

Each is a transition, so a second action takes it from where it is: a dialog closed while it arrives shrinks back from its current size; a menu sheet tapped shut halfway slides back from where it is; a switch tapped twice returns mid-travel; a press released early springs back from its current scale. Nothing waits for a movement to end before it can be used, but a leaving row, which no longer takes a tap.

### Right to left

Only the menu sheet and the switch's thumb travel sideways, and both follow the reading direction: in Kurdish and Arabic the sheet comes from the right, `translateX(100%)`, and the thumb travels to the left, through Tailwind's `rtl:` variants. Every other movement is a scale, a fade or a vertical rise, the same in both directions. The plates, drawn left to right, never move.

### Reduced motion

`prefers-reduced-motion: reduce` keeps the fades and the colour changes that tell what happened, and drops every movement in space, through Tailwind's `motion-reduce:` variants on each movement:

| Movement | With reduced motion |
|---|---|
| The press | no scale; the pressed control takes its hover ground |
| The dialog | a fade only, 200 ms in and 150 out |
| The switch's thumb | jumps; the track's colour still changes over 150 ms |
| The menu sheet | a fade in place, no slide |
| Something arrives | a fade only, no rise |
| Confirm all's result | one fade on every changed row at once, no stagger |
| Something leaves | the fade, then the space closes at once |

### Named Rules

**The Data Holds Still Rule.** Nothing the user reads or decides on moves for style: no plate, figure, row or table animates its content.

**The Exit Is Faster Rule.** Whatever arrives in 200 ms leaves in 150.

## Do's and Don'ts

### Do:

- **Do** put every price and the Platform Rate on a plate, one plate to an Offer, with the date it was last set or confirmed beside it, and mute it when the Offer is out of stock.
- **Do** give a screen one leading plate only where one figure is its answer: the Platform Rate and an Offer's own screen.
- **Do** give every Offer state a word and its own mark: confirmed today, confirmed days ago, about to expire, expired, in stock, out of stock.
- **Do** end every row that needs action with one line of plain words saying why.
- **Do** keep the Vendor portal as dense in Kurdish and Arabic as in English, laid out right to left, the frame's inset and the menu sheet mirrored with it.
- **Do** make controls 36 pixels under a mouse and 44 on a touchscreen, and take rows of controls away on a phone rather than shrinking them.
- **Do** keep the motion tokens: three curves, three durations, every movement with its reduced-motion variant.

### Don't:

- **Don't** put Plate Amber anywhere but on Plate Graphite, or make it glow.
- **Don't** put a count on a plate, or add a second large plate to a screen.
- **Don't** put a shadow under the sheet, a card or a row, or a border between the sidebar and the top bar, or nest a fourth level inside frame, sheet and panel.
- **Don't** use cards for lists, icons in tinted squares, pills, gradients, glass or blur.
- **Don't** put a photograph in the frame, the sidebar or behind text: the owner left the pictures of Erbil out of the dashboard's chrome.
- **Don't** set text under 14 pixels (15 in Kurdish and Arabic), even where Taste's sheet says 12.
- **Don't** animate a figure, a plate, a route change, a tab's line, the language or the scheme, or anything the keyboard repeats.
- **Don't** use `ease-in`, Tailwind's built-in curves, `transition: all`, or a duration over 200 milliseconds.
- **Don't** reach for a cold, grey corporate console, the gaming look of neon and dark glows, or a generic template's cards and gradients.
