# 06: The dashboard's new DESIGN.md, its Motion and an ADR

**Spec:** [the redesign spec](../spec.md)

**What to build:** The direction the owner chose becomes the dashboard's written design, the one every screen is rebuilt to. Impeccable rewrites the dashboard's DESIGN.md from it, with a section on Motion of its own, led by Emil's skills. An ADR records what replaces the look that ADR-0007 gave the dashboard.

**Blocked by:** 05

**Status:** ready-for-agent

- [x] Impeccable rewrites `apps/dashboard/DESIGN.md` from ticket 05's direction: its tokens, Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, and Do's and Don'ts. The fonts are unchanged (ADR-0006).
- [x] Every component the current DESIGN.md describes has its place in the new one, or is listed as dropped: buttons, inputs and fields, rows, plates, states, dialogs, removing an Offer, deactivating a Vendor, the hand-over, the expiry banner, navigation and the portal's sections.
- [x] Choices the owner made in earlier tickets (such as the Offers screen's four in `offers` ticket 03) are kept unless the direction replaces them, and each one replaced is listed under Comments.
- [x] The controls' size follows ticket 03: 44 pixels on a touchscreen and 36 under a mouse, replacing the dashboard's earlier 44 under a mouse too; and the scheme switch, light, dark or the device's, beside the language switch, has its place among the components.
- [x] **Motion**, led by `emil-design-eng` and `animate`: what moves and what stays still, the easing and durations, how a movement is interrupted, its direction in right-to-left, and what reduced motion does.
- [x] The hard rules of the root DESIGN.md, as ticket 03 left them, hold throughout.
- [x] A new ADR records the dashboard's new look and the options it was chosen over, and replaces the parts of [ADR-0007](../../../docs/adr/0007-a-look-and-components-for-each-app.md) it changes; ADR-0007 says which of its parts are replaced.
- [ ] The owner reads the new DESIGN.md, with the Motion section's movements shown in the built-in browser, and every remark is answered before the ticket closes. The remarks and answers are recorded under Comments.
- [x] `pnpm check` passes, and the work is committed.

## Comments

### 21 October 2026: the DESIGN.md, its Motion and the ADR

**Written.** `apps/dashboard/DESIGN.md` is rewritten from ticket 05's sheet (`apps/dashboard/design/taste/`), in Impeccable's DESIGN.md format: its tokens in both schemes (hex, the sheet's own format, in the front matter and in a table that names each colour's variable for ticket 07), Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, a section of its own on **Motion**, placed after Components, and Do's and Don'ts. [ADR-0011](../../../docs/adr/0011-the-dashboards-look-is-framed-sheet.md) records the new look and the options it was chosen over (the other three directions dealt in ticket 05, and keeping the old look with its plates fixed); ADR-0007 now opens by saying it is partly replaced, and which sentence. The root DESIGN.md's Overview names the dashboard's look Framed sheet. Impeccable's surface brief for the dashboard, `apps/dashboard/.impeccable/surfaces/src.md`, which `impeccable context` hands every later ticket, is rewritten to the new direction: it still said Rate Board "in the manner of Linear" and 44-pixel controls.

**How each skill was run.**

- **Impeccable** (`impeccable`, with `impeccable context --target apps/dashboard/src` once, then its `document` reference). Its `document` asks before overwriting an existing DESIGN.md, and asks the owner for the North Star and the colours' names; the ticket is the instruction to rewrite, and the owner was not answering, so I chose the words and list them for the owner below. Its sidecar, `.impeccable/design.json`, was not written: no app in the repository has one, and the motion tokens it would hold are in the Motion section, where the ticket asks for them. Its rule that a redesign replaces rather than polishes the old look is why the old file was rewritten whole, keeping the components' substance and the owner's choices.
- **Taste's sheet decides the direction**: the frame, the sheet, the list pattern, the shell on a phone, the tokens and the face (the stone frame) are the sheet's and `held-rules.md`'s. Where the DESIGN.md goes further (the leading plate, the Catalog's list taking the whole width until a Part is opened), it is listed for the owner below.
- **Emil**: `emil-design-eng`, loaded through the Skill tool with the concrete question of what moves on these screens, with which curves and durations, how it is interrupted, in right to left and with reduced motion; and `animate`, with its build sequence and its recipes (the press, the modal, the drawer, the toast, the stagger). The Motion section answers each finding of the owner's `review-animations` (ticket 02's Comments):

| `review-animations` found | The Motion section |
|---|---|
| The dialog and its scrim appear in one frame | 3: from `scale(0.96)` and opacity, 200 ms in, 150 ms out, from the centre |
| The press, `translate-y-px`, not transitioned | 1: `scale(0.97)`, 150 ms on `--ease-out` |
| The switch's thumb on Tailwind's curve | 4: 150 ms on `--ease-out`, mirrored |
| No motion tokens | Tokens: `--ease-out`, `--ease-in-out`, `--ease-drawer`, and 100, 150 and 200 ms |
| Hover timing mixed (100 ms rows, snapping links) | 2: one timing, 100 ms on `ease`, everywhere |
| No reduced-motion handling | A table of its own, one line per movement |
| Missing: the dialog, Confirm all's result, an Offer removed, the note after adding | 3, 7, 8 and 6. An Offer removed on its own screen is not seen leaving, as the Offers come back without it; 8's exit serves rows that leave a list in view (the Need confirming tab after Confirm all) and the banner |
| Leave alone: route changes, paging, search, the language switch | 9, with the scheme switch, the tabs' line, the plates and the loading sketches |

**The leading plate.** The orchestrator saw that ticket 05's renderings put a plate on every price and none leads its screen, though ticket 04's line asks for one larger leading plate per screen where a figure leads. Settled in DESIGN.md's Plates, and drawn on the review page (`#lead`): a figure leads a screen only when it is the screen's answer, and then it is one plate at 30 pixels under the title, with its date beside it. It leads **two screens**: the **Platform Rate** (the rate and the day the Admin set it; not built yet) and **an Offer's own screen** (the Offer's price as Shoppers see it now, both currencies on one plate, with its Confirmation, muted when out of stock, showing the saved price until the form is saved). **No other screen has one**, and the DESIGN.md says so plainly: the Offers screen's question is which Offers need confirming, a count, which the banner answers in words, and counts stay off plates (ticket 04); the Catalog, a Part, the Vendors, a Vendor, the forms, Missing specifications, Expiring Offers and the details screen hold no price. The Offer form for a new Offer has none, as its price is not set yet. The leading plate on an Offer's own screen is new (the old DESIGN.md gave that screen no plate). A live preview plate on the form, which Taste suggested in ticket 02, was not taken, since Impeccable doubted it earns its height on a phone.

**Every component of the old DESIGN.md, and where it is now.**

| Component | In the new DESIGN.md |
|---|---|
| Buttons (primary, outline, ghost, hover, focus, press, `buttonVariants`) | Kept, at 36 under a mouse and 44 on a touchscreen; the press is now a scale (Motion 1); a busy state is written down |
| Inputs and choices (input, native select, boxes, switch, focus, error) | Kept; the switch's thumb moves as Motion 4; the language switch and **the scheme switch** are described here |
| Fields (label and Needed, groups, lists, Optional, several lines, description, the Offer form, the map location) | Kept; the Part at the Offer form's head moves from a bordered panel to a Raised Stone panel (no fourth level) |
| Rows (a Part, a Vendor, its details, its actions, an Offer, a Part found, a Part missing specifications, a Vendor to remind, the picture) | Kept as rows on a phone and as a table from 64rem (the sheet's list pattern). **Dropped:** the 40-pixel picture with a Category icon in a tinted square on every row (Taste's "icon tiles"); a Part's picture stays on its page and at the Offer form's head, its Category's icon drawn plain when it has no photo (CAT-6) |
| Plates | Kept, changed as ticket 04 decided: prices and the rate only, one to an Offer, units a quiet suffix, a Geist comma, dated, muted when out of stock, the lit edge in dark; the leading plate as above. **Dropped:** plates on counts |
| States (empty, the expiry banner, the note after adding, an Offer that no longer exists, refusal, loading, missing) | Kept, with 8-pixel corners; the empty state's icon is plain, not on a square; Confirm all's result is its own state, with Motion 7 |
| Dialogs | Kept, with their motion (Motion 3) |
| Removing an Offer | Kept |
| Deactivating a Vendor | Kept |
| The hand-over | Kept |
| The expiry banner | Kept, under the title, now above the tabs |
| Navigation (the top bar, the Admin's sections, the portal's top bar and sections, the band, back) | Moved into the frame: the sidebar from 64rem and the menu sheet on a phone; the band spans the window above the frame on Active Stone. **Dropped:** the top bar closed by a rule, the sections in the top bar, the portal's two section links under its bar |
| (new) Tabs, the leading plate, the menu sheet, the scheme switch, a photograph of Erbil in the sidebar | Added |
| (dropped) Warning Brown | Never used on any screen |
| (dropped) The Catalog's Search button and its Category select | The search sits in the top bar and searches on Enter; the Categories are the Catalog's tabs, as ticket 05 drew them |

**Earlier choices of the owner's that this replaces.**

- **Every control 44 pixels under a mouse too** (catalog module): replaced by ticket 03, 36 under a mouse and 44 on a touchscreen.
- **"Put every price, the Platform Rate and every count that needs action on a plate"** (the old Do's, 20 October 2026): replaced by ticket 04, prices and the rate only.
- **An Offer's row, each price on its own plate** (offers ticket 03, `#d2`, 20 October 2026): replaced by one plate holding both prices, the dollars first (ticket 04's "fewer plates per Offer", as ticket 05 drew it). Kept from that choice: the plate on a line of its own under the Part's name on a phone.
- **The Vendor portal's sections as two links under its top bar** (offers ticket 03, `#d4`): replaced by the sidebar and, on a phone, the menu sheet, as the chosen direction's shell draws them.
- **The Admin console's sections in the top bar from 64rem** (accounts ticket 05), after its top bar without a menu while the Catalog was the only section (16 October 2026): replaced by the sidebar.

Kept unchanged: the Offer form (20 October), the expiry banner and its place under the title (`#d1`, `#d3`), the note after an Offer is added, a Part the catalog search found, a Part missing specifications, a Vendor to remind, the fonts, and the accounts module's words (the short "Edit", the edit screen naming the Vendor, Reactivate's confirmation).

**The hard rules, as ticket 03 left them, and where each holds.**

| Rule | Held by |
|---|---|
| WCAG 2.2 AA in both schemes | Every pair measured: text 4.5:1 or more on its grounds (Note Grey on Active Stone, 5.2:1, the lowest), control edges 3:1 or more. **Control Edge darkened** from held-rules' `#8c8b87` to `#858480`: the old value is 2.99:1 on the Stone Frame, where the top bar's search sits; the new one is 3.28:1 there and 3.74:1 on white |
| A switch between the schemes | The scheme switch, beside the language switch, Device first, remembered, set before the first paint |
| 44 on a touchscreen, 36 under a mouse | Layout's Controls; the sheet's 32 is not used |
| No text under 14 (15 in Kurdish and Arabic) | The Fourteen Pixel Rule; the sheet's 12 is not used |
| 360 first, never sideways at 320 | The phone shell, two-line rows, tabs that scroll in their own row |
| Right to left, logical properties | The frame's inset on the end side, the menu sheet and the switch's thumb mirrored, the plates left to right |
| Tall Script, No Capitals, Western digits, the fonts | Typography |

Two of the sheet's values were held to the root DESIGN.md's shared scale rather than taken as dealt, since the root holds where the two disagree: a screen's title is 24 pixels from 64rem and 20 on a phone (the sheet says 22), and inputs and buttons keep the body size, 16 (the renderings set buttons at 14).

**For later tickets.** The Offers screen's tabs (All, Need confirming, Out of stock) filter the list by state; whether the API's list of a Vendor's Offers can filter so is for ticket 11 to check before building them. The photographs in the sidebar are shipped by the app with their credits (CC BY-SA), from ticket 05's `credits.json`.

### 21 October 2026: the review page

`.taste-skill/redesign-06/index.html` in the owner's checkout (Git ignores it), served by the orchestrator from `.taste-skill` on port 4110. Each movement live, one per anchor, each in a light panel beside a dark one: `#m1` the press, `#m2` a colour under the pointer, `#m3` the alert dialog, `#m4` the switch's thumb, `#m5` the menu sheet on a phone, `#m6` something arrives, `#m7` Confirm all's result, `#m8` something leaves a list, `#m9` what stays still; and `#lead`, the leading plate. Switches at the top: **Reduced motion** (on at the start when the device asks for it, and the page says so), **Slow ×4**, and **English or Kurdish**, which draws every panel right to left. `design.html` beside it is the new DESIGN.md rendered, its Motion items linked to their movements. The page is static HTML and CSS with the motion tokens as written, built by `build/build.mjs` from the DESIGN.md; nothing in the app changed. Checked in the built-in browser before handing over: the dialog's transitions run at the tokens' values (read with `getAnimations()`), the sheet slides from the right in Kurdish, Confirm all settles the rows and the banner leaves, and the console has no error.

### 21 October 2026: for the owner

Read `design.html` and the movements on `index.html`, then confirm or change:

1. **The North Star and the names**: "The Framed Board", and the colours' names (Stone Frame, Sheet, Raised and Active Stone, Bazaar Teal, Plate Graphite, Plate Amber).
2. **The leading plate** on an Offer's own screen and the Platform Rate only, as above (`#lead`).
3. **The Motion section** as drawn: three curves; 100, 150 and 200 ms; the stagger on Confirm all only; the scheme switch, the tabs and the plates still.
4. **The Vendor portal's sections in the menu sheet on a phone**, replacing your choice of two links under the bar (one more tap to reach Details).
5. **The Catalog's list taking the whole width until a Part is opened**, in place of an empty pane.
6. **No picture on a row**; a Part's picture only on its page and at the Offer form's head, its Category's icon drawn plain (CAT-6).
7. **A photograph of Erbil at the foot of the sidebar** from 64rem, never on a phone.
8. **The two values held to the root's scale**: a 24-pixel title (not 22) and 16-pixel buttons (not 14).

The box for the owner's reading stays open, and the Status stays, until the remarks are answered here.
