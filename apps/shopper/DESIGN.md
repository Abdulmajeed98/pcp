---
name: The Shopper app, the printed price list
description: Every Part priced Vendor by Vendor, printed as the price list a computer shop hands over the counter.
colors:
  bone-ground: "#e5e1d8"
  sheet-paper: "#f4f3f0"
  board: "#dad5ca"
  deep-board: "#cfc9bc"
  chocolate-ink: "#2a1d17"
  soft-ink: "#62534a"
  print-green: "#456f3a"
  green-ink: "#ffffff"
  deep-green: "#345a2b"
  back-cover: "#2a1d17"
  back-cover-ink: "#ecebe7"
  barcode-ground: "#ffffff"
  barcode-ink: "#1b1410"
  night-ground: "#17110d"
  night-paper: "#261d17"
  night-board: "#33281f"
  night-deep-board: "#3d3127"
  bone-ink: "#efe7da"
  night-soft-ink: "#c2b2a3"
  night-green: "#93c47d"
  night-green-ink: "#13240c"
  night-pressed-green: "#7fb168"
  night-coupon: "#2d4a25"
  night-coupon-ink: "#f1eadf"
  night-deep-green: "#1f3619"
  night-back-cover: "#0c0806"
typography:
  display:
    fontFamily: "Big Shoulders Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "clamp(2.75rem, 1rem + 5vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.005em"
  sheet-title:
    fontFamily: "Big Shoulders Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "clamp(2.25rem, 1.5rem + 2vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.005em"
  facts:
    fontFamily: "Big Shoulders Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "clamp(1.5rem, 1rem + 1.4vw, 2.25rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.005em"
  label:
    fontFamily: "Big Shoulders Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.1
  title:
    fontFamily: "Public Sans Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    fontFeature: "tnum"
  body-large:
    fontFamily: "Public Sans Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.556
  body:
    fontFamily: "Public Sans Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "Public Sans Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.429
  price:
    fontFamily: "Public Sans Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    fontFeature: "tnum"
  cropped-name:
    fontFamily: "Big Shoulders Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "26vw"
    fontWeight: 800
    lineHeight: 0.8
rounded:
  square: "0px"
spacing:
  margin: "16px"
  margin-desk: "40px"
  ground-edge: "10px"
  item: "16px"
  group: "56px"
  sheet-pad: "64px"
  sheet-pad-phone: "18px"
  section: "120px"
  section-phone: "72px"
  control: "44px"
  control-mouse: "36px"
  input: "48px"
  button: "52px"
  contact-cell: "56px"
  plate-cell: "72px"
  plate-cell-phone: "60px"
  tab: "150px"
  tab-phone: "130px"
components:
  button-primary:
    backgroundColor: "{colors.print-green}"
    textColor: "{colors.green-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    height: "52px"
    padding: "0 24px"
  button-primary-pressed:
    backgroundColor: "{colors.deep-green}"
  button-cell:
    backgroundColor: "{colors.board}"
    textColor: "{colors.chocolate-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    height: "52px"
    padding: "0 16px"
  chip:
    backgroundColor: "{colors.board}"
    textColor: "{colors.chocolate-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    height: "44px"
    padding: "0 14px"
  chip-on:
    backgroundColor: "{colors.print-green}"
    textColor: "{colors.green-ink}"
  input:
    backgroundColor: "{colors.bone-ground}"
    textColor: "{colors.chocolate-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    height: "48px"
    padding: "0 12px"
  stub:
    backgroundColor: "{colors.sheet-paper}"
    textColor: "{colors.chocolate-ink}"
    padding: "8px 16px"
  sheet:
    backgroundColor: "{colors.sheet-paper}"
    textColor: "{colors.chocolate-ink}"
    rounded: "{rounded.square}"
    padding: "64px"
    width: "40rem"
  slip:
    backgroundColor: "{colors.sheet-paper}"
    textColor: "{colors.chocolate-ink}"
    padding: "26px 24px 96px"
    width: "23rem"
  plate:
    backgroundColor: "{colors.board}"
    textColor: "{colors.chocolate-ink}"
    padding: "40px"
  plate-cell-ink:
    backgroundColor: "{colors.chocolate-ink}"
    textColor: "{colors.bone-ground}"
    height: "72px"
  plate-cell-paper:
    backgroundColor: "{colors.sheet-paper}"
    textColor: "{colors.chocolate-ink}"
    height: "72px"
  coupon:
    backgroundColor: "{colors.print-green}"
    textColor: "{colors.green-ink}"
    padding: "48px"
  coupon-call:
    backgroundColor: "{colors.green-ink}"
    textColor: "{colors.print-green}"
    height: "56px"
    padding: "8px 16px"
  coupon-cell:
    backgroundColor: "{colors.deep-green}"
    textColor: "{colors.green-ink}"
    height: "56px"
    padding: "8px 16px"
  swing-tag:
    backgroundColor: "{colors.sheet-paper}"
    textColor: "{colors.chocolate-ink}"
    padding: "56px 32px 32px"
  back-cover:
    backgroundColor: "{colors.back-cover}"
    textColor: "{colors.back-cover-ink}"
  barcode:
    backgroundColor: "{colors.barcode-ground}"
    textColor: "{colors.barcode-ink}"
    height: "64px"
---

<!-- Rewritten with browse ticket 08 on 6 November 2026, from the direction the owner chose in browse ticket 07: Taste's The page is the object, its sheet kept in design/taste/ with what the Shopper app holds against it, and the seven tweaks and seven motions of ticket 07's renderings, all kept by the owner on 6 November 2026 and written here in this file's own terms (the motions are Motion 1 to 7). It replaces Fit Diagram, written with catalog ticket 10 on 15 October 2026, with its footer recorded on 16 October 2026 (ADR-0013). The owner read it with its movements playing on 6 November 2026 and kept every recommendation it put to them (browse ticket 08). It is written before the pages are built: browse tickets 09 to 13 build the frame and the four kinds of page to it, and correct it where building teaches something. Corrected with browse ticket 09 on 6 November 2026, from building the frame, the home page and the not-found page: the printer's marks are drawn in bone, the facts row's photograph is of a board's connectors, a Category with no Visible Part shows its count, the switches stand 2 pixels apart on a phone and the card's wrap on the narrowest, the not-found page is drawn by script and its note is set as its sentence, and the "≈" is drawn in the device's own sans, the owner keeping all three of ticket 09's answers on 6 November 2026. Corrected with browse ticket 10 on 6 November 2026, from building a Category page: each Category has a drawing of its own, on its sheet and its box label; a Category's sheet fills its columns beside the swing tag, which holds the search alone until ticket 11's filters join it; the sentence under the sheet's title is set in Body large in the Ink, as the not-found page's note is; the sheet pages 20 Parts at a time and closes with what "≈" means when it shows a converted price; it says so when a page is past the last or the list cannot be read; and a long name takes its whole line, and a list too narrow for its text stacks, the owner keeping all three of ticket 10's answers on 6 November 2026. Corrected with browse ticket 11 on 6 November 2026, from building the filters: the swing tag holds the search and the filters, titled "Filters"; a filter's name is in the page's language, from the Shopper set, and its values in English, yes or no worded; a number with no unit is named by its filter on its chip that is on, "Cores 8"; each end of the price range is named above its field, shows what was typed when it cannot be used and says why under it, and the range is left out when no Part has a Lowest Price; Show Parts and Clear all stack when their words do not both fit; the bar counts the choices on but the search; Show Parts folds the tag at once and takes the focus to the list's head, and leaves the tag open when a price cannot be used; from 64rem the bar is not drawn where the browser can show a folded disclosure's contents; a filter of more than 16 values folds the rest past its first 12; and a Category sheet's closing line is in Body Soft Ink, at most 34rem wide; the owner keeping all three of ticket 11's answers on 6 November 2026. Corrected with browse ticket 12 on 6 November 2026, from building a Part page: the box label carries the Category's key specifications, BRW-2's first and then those a buyer weighs next, at most six, and its barcode reads (Apple's barcode reader read it), a part number Code 39 cannot write or of more than twenty characters printed alone; from 64rem the Part page's square fills its half of the plate, so that the picture leads a desk's first screen; an Offer's name takes its whole line when it and its price are more than a line holds; the part numbers are one left-to-right list; a Part the API does not answer, and one the catalog holds no specification of, say so; and a sheet of Offers and the price slip stack on a list too narrow for its text, as a Category's list does. Two of these wait on the owner's answers (ticket 12). -->

# Design System: the Shopper app, the printed price list

## Overview

**Creative North Star: "The Counter Price List"**

Ask a computer shop what a Part costs and it hands a printed list over the counter: its name at the head, the Parts in tidy groups, each name at the start of its line and its price at the end, a stamp, a slip torn off the till. The Shopper app is that list, printed for every Vendor at once. Each page is a piece of the same stationery laid on a table: the home page a card and a sheet of the eight Categories, a Category page its printed sheet beside a swing tag of filters, a Part page a square plate, a till slip and the sheet of its Offers, a Vendor page a coupon to cut out. Prices are the point of every piece. They are printed in tabular figures at the end of their line, joined to their name by a dotted leader, and a Converted Price carries its "≈" at the price's own weight.

The paper is bone and the ink chocolate, and one green is spent the way a two-colour print job spends its second ink: on the one button that matters, a chosen filter, a stamp, the Vendor's coupon. Big Shoulders, a tall condensed gothic from city signage, sets names and figures large; Public Sans, a plain public-service sans, sets everything that is read; Noto Kufi Arabic sets Kurdish and Arabic. Every corner is square and every edge is cut (scalloped, torn, notched or perforated), never outlined, and nothing casts a shadow. Under the paper lie dim photographs of PC hardware, a table of boards, fans and memory, never a place; a Part keeps its own photo, or its Category's icon. The motion is the motion of paper and print: a sheet prints out as it arrives, its prices settle into their column, a stamp lands, a slip feeds, a tab gives under the hand, a barcode is scanned once.

The direction is Taste's The page is the object, dealt by `draw.mjs` with its run for public pages and chosen by the owner by eye on 6 November 2026, in browse ticket 07: "the most elegant out of them, but it needs some motion in it". Its sheet, as dealt, is in [design/taste/](design/taste/), with what the Shopper app holds against it in [held-rules.md](design/taste/held-rules.md); this file is what every Shopper page is built to. Nothing in the design is particular to one city: the platform will reach beyond Erbil, and its pictures stand for PCs (the owner, 5 November 2026). The shared floor is in [the root DESIGN.md](../../DESIGN.md), and the reasons in ADR-0006, ADR-0007 and ADR-0013.

**Key Characteristics:**

- Every list is a printed sheet: names at the start, prices at the end in tabular figures, a dotted leader between, the groups under headings in the display face.
- Bone, chocolate and one green, in a light and a dark scheme (bone ink on chocolate in the dark), with a switch beside the language switch.
- Big Shoulders over Public Sans, in sentence case in every language; Noto Kufi Arabic for Kurdish and Arabic.
- Square corners and cut edges; no border round a piece, no thin rule between its lines, no shadow.
- Dim photographs of hardware under the paper; on the paper, a Part's own photo or its Category's icon.
- The motion of paper and print, once a page view, on what arrives; nothing held back, and a finished page under reduced motion.
- Phone first at 360 pixels, right to left in Kurdish and Arabic, controls 44 pixels on a touchscreen.

## Colors

Paper and chocolate ink on a bone ground, with one green as the second ink, and photographs for every other colour. Each colour has a value for each scheme and a name in code, in `@pcp/ui/themes/shopper.css` (rewritten with the frame, browse ticket 09). Every text colour meets 4.5:1 on every ground it is used on, every control's edge and every mark that shows a state 3:1, in both schemes; a new colour is measured before it is used.

| Name | Light | Dark | In code |
|---|---|---|---|
| Bone Ground | `#e5e1d8` | `#17110d`, the Night Ground | `--background` |
| Sheet Paper | `#f4f3f0` | `#261d17`, the Night Paper | `--card`, `--popover` |
| Board | `#dad5ca` | `#33281f` | `--secondary`, `--muted`, `--accent` |
| Deep Board | `#cfc9bc` | `#3d3127` | `--secondary-pressed` |
| Ink | `#2a1d17`, Chocolate Ink | `#efe7da`, Bone Ink | `--foreground`, `--card-foreground` |
| Soft Ink | `#62534a` | `#c2b2a3` | `--muted-foreground` |
| Half Ink | the Ink at 50% over its paper | the same | `--half-ink` |
| Print Green | `#456f3a` | `#93c47d`, the Night Green | `--primary` |
| Green's Ink | `#ffffff` | `#13240c` | `--primary-foreground` |
| Pressed Green | `#345a2b` | `#7fb168` | `--primary-pressed` |
| Coupon Green | `#456f3a` | `#2d4a25` | `--coupon` |
| Coupon Ink | `#ffffff` | `#f1eadf` | `--coupon-foreground` |
| Deep Green | `#345a2b` | `#1f3619` | `--coupon-cell` |
| Back Cover | `#2a1d17` | `#0c0806` | `--back-cover` |
| Back Cover Ink | `#ecebe7` | `#efe7da` | `--back-cover-foreground` |
| Focus | the Ink, `#2a1d17` | the Night Green, `#93c47d` | `--ring` |
| Barcode | `#1b1410` on `#ffffff` | the same | `--barcode`, `--barcode-ground` |

Measured, light then dark: the Ink 12.5:1 and 15.3:1 on the Bone Ground, 14.7:1 and 13.5:1 on Sheet Paper, 11.2:1 and 11.7:1 on the Board; Soft Ink 5.6:1 and 9.1:1, 6.6:1 and 8.0:1, 5.0:1 and 7.0:1 on the same three; Green's Ink on Print Green 5.9:1 and 8.1:1; Print Green on Sheet Paper 5.3:1 and 8.2:1; Coupon Ink on Coupon Green 5.9:1 and 8.3:1 and on Deep Green 7.9:1 and 11.0:1; Back Cover Ink on the Back Cover 13.7:1 and 16.3:1; Half Ink on Sheet Paper 3.1:1 and 4.4:1; the Focus 14.7:1 and 8.2:1 on Sheet Paper; the barcode 18.2:1.

### Primary

- **Print Green**: the second ink. The one primary button of a screen, a chosen filter, the stamp, the line that scans a barcode, the third swatch of the printer's ink bar. Green's Ink is drawn on it. In the dark scheme it is the lighter Night Green, with a dark ink of its own.

### The coupon's greens

- **Coupon Green** and **Coupon Ink**: the Vendor's coupon, a field of the green with its words in Coupon Ink. In the light scheme it is Print Green itself; in the dark it is a deep green, so that the field does not glare.
- **Deep Green**: the coupon's link cells, a step darker than its field. The coupon's first cell, Call, is the field turned over: Coupon Ink with green words.

### Neutral

- **Bone Ground**: the table everything lies on, the ground of every page and of an input to fill in.
- **Sheet Paper**: every printed piece: a sheet, the slip, the stub, the card, the swing tag, the box label, a cell that is paper.
- **Board**: a field that is not paper, such as the square plate's, a chip, a quiet cell, the square that holds a Category's icon on a sheet; **Deep Board** is the Board under a hovering pointer and while pressed.
- **Ink** and **Soft Ink**: text and drawings in the Ink; an item's second line, a sheet's note and the frame's names in Soft Ink. **Half Ink** draws the dotted leaders and the perforations, and on the coupon its ink at 60% does, so that a perforation that shows where a tab is meets 3:1 (3.2:1 and 4.1:1).
- **Back Cover**: the footer, the back of the object, in the Ink's colour in the light scheme and near black in the dark, with its own ink.
- **Barcode**: black bars on white in both schemes, as a printed label carries them.

### Named Rules

**The One Green Rule.** Print Green is the page's second ink, spent where a printer spends it: the primary button, a chosen filter, the stamp, the coupon and the scan. It is text only on Sheet Paper (5.3:1): never on the Bone Ground (4.49:1) or the Board (4.0:1). There is no second green but the coupon's own.

**The Bone Is Not Cream Rule.** The palette is a low-chroma bone and a chocolate brown, not a yellow cream with terracotta. The dark scheme's ink is the palette's own bone, `#efe7da`, kept by the owner on 6 November 2026; Taste's inspector reads it as cream (`palette-cream`), and the sheet allows it.

**The Text Is on Paper Rule.** Every word is printed on paper, a field of the palette or the Back Cover; a photograph carries none, and a picture's caption sits on the paper below it.

## Typography

**Display Font:** Big Shoulders, from its Fontsource variable package (with Noto Kufi Arabic for Kurdish and Arabic)
**Body Font:** Public Sans, from its Fontsource variable package (with Noto Kufi Arabic for Kurdish and Arabic)
**Arabic-script Font:** Noto Kufi Arabic, as the Shopper app has it today

**Character:** a tall American gothic taken from city signage, blunt and civic, over a plain public-service sans, beside a geometric Kufi: the voice of a printed price list, large where it names and exact where it counts. Neither Latin face draws a letter of Arabic script, so every Kurdish and Arabic word is drawn whole in Noto Kufi Arabic, which draws all of Sorani (ADR-0006), and none changes font mid-word. None of the three faces' files draws the "≈": Noto Kufi Arabic's mathematical file, which its range of characters names for it, holds Arabic mathematical letters and not "≈", as Chrome showed when the faces were installed (ticket 09). So the "≈" is drawn in the device's own sans (San Francisco, Roboto or Segoe UI), at the figure's size and weight, as the owner decided on 6 November 2026, and the theme declares Noto Kufi Arabic's Arabic file alone, so that the mathematical file is not fetched.

### Hierarchy

The text face keeps the root DESIGN.md's shared sizes, in `rem`: a 16-pixel body, and 18 pixels for an item's name and price. The display face takes four sizes of its own, in `rem` between two ends, as Taste's sheet sets them, each at least 1.375rem (22 pixels), which the root DESIGN.md lets a look's display face take since the owner allowed it on 6 November 2026 (browse ticket 08). The cropped name is a picture of the name slot's words rather than text read in place (the name is read in the frame), and is sized to the window.

- **Display** (800, clamp(2.75rem, 1rem + 5vw, 5.5rem), 44 to 88 pixels, line 0.95): the home page card's three words, the facts row's heading, the back cover's invitation. One a section, and two lines at most at every width.
- **Sheet title** (800, clamp(2.25rem, 1.5rem + 2vw, 3.5rem), 36 to 56 pixels, line 1): the title of a sheet, of the square plate, of the swing tag and of the specifications, the Vendor's name on its coupon and the Part's name on its box label. A page's `h1` is the sheet title of its first piece, or the card's Display on the home page.
- **Facts** (800, clamp(1.5rem, 1rem + 1.4vw, 2.25rem), 24 to 36 pixels, line 1.05): the card's facts, the facts row's figures.
- **Label** (800, 1.375rem, line 1.1): a group's heading on a sheet, the slip's heading, the stamp (1.125rem on a sheet), the frame's name.
- **Title** (600, 1.25rem, line 1.4, tabular figures): the slip's first line, the Lowest Price; the Lowest Price on a Part's plate.
- **Body large** (400, 1.125rem, line 1.556): an item's name on a sheet, at 400, and its price, at 600; the card's sentence; the plate's tabs.
- **Body** (400, 1rem, line 1.5): sentences, an item's second line, the credits, a tear-off tab's words, the text in buttons (600) and in every input. A reading paragraph is at most 70 characters a line, and a note beside a title 34.
- **Small** (400, 0.875rem, line 1.429): the frame's switches and their names, a sheet's note under its title and its closing lines, a picture's caption, the slip's foot.
- **The cropped name** (800, 26vw, 34vw on a phone, line 0.8): the back cover's wordmark, a picture of the name, hidden from readers.

**In Kurdish and Arabic** the text sizes follow the root's Tall Script Rule (15, 17 and 19 pixels, every line looser, the body's at 1.7). The display roles are set in Noto Kufi Arabic at weight 700, which is wide where Big Shoulders is narrow, so they are set smaller and looser: the Display at its Latin size with lines at 1.35; the Sheet title at 2.25rem, line 1.4; the Facts at clamp(1.25rem, 1rem + 1vw, 1.75rem), line 1.5; the Label at 1.25rem, and the frame's name at 1.125rem; the cropped name at 17vw, and 22vw on a phone. Arabic script is never under 15 pixels, on an English page too: the language switch's names and a Vendor's words as written.

**Prices.** A Shown Price takes its line's size at weight 600, with tabular figures, its unit (IQD or $) after the figure at 0.72em, never under the Small size, and its "≈" before the figure at the figure's own weight and ink. The price is one left-to-right unit in every language, through `AlwaysEnglish`, and never breaks inside.

### Named Rules

**The Sentence Case Rule.** Taste's sheet sets Big Shoulders in capitals; the Shopper app sets it in sentence case in every language (the root's No Capitals Rule), with its tracking of -0.005em in Latin script and none in Arabic script.

**The Column of Prices Rule.** Every price, count and specification value is in Western digits with tabular figures at the end of its line, so that a sheet's prices stand in a column a Shopper runs an eye down.

**The Long Name Rule.** A Part's name keeps its role's size while it is short. On the square plate and the box label, where it is the Sheet title, a name of more than 40 characters takes the Facts size and one of more than 80 the Title size, so that the catalog's longest name (276 characters) reads as a paragraph, never as a poster: on the plate it takes 5 lines of the Title size at 1440 pixels and 9 at 360, and the 210-character one 4 and 8, as ticket 12 checked with the made-up shop's longest names. Everywhere else a long name wraps in full and is never cut. On a Category page a name past 24 characters takes its whole line on a phone, and one past 80 at every width, its leader running to its price on the line under it, as a printed menu sets a long dish; beside its price it would wrap into a column a word wide (ticket 10).

## Layout

**The table.** The Bone Ground is the table and each section a piece of stationery on it. The page has one pair of margins, 16 pixels on a phone and 40 from 64rem, the same at the start and the end. Sections take 120 pixels above and below on a desk and 72 on a phone, and a sheet takes 64 pixels of padding and 56 between its groups: the spaces of print around and inside a printed piece, beyond the root's rhythm of 4 to 48 pixels and in its 4-pixel steps, as the root DESIGN.md lets a look space its own pieces since the owner allowed it on 6 November 2026 (browse ticket 08). Everything else keeps the root's rhythm: 16 pixels between the items of a group, 24 between the fields of a form, 8 between cells side by side.

**The pieces, page by page.** Placed on a 12-column grid where they stand off the middle, as sheets laid on a table:

- **The home page:** the card over a dim room, the whole first screen; the sheet of the eight Categories, centred over a dim photograph of a built PC; the square plate, one Part and its slip; the facts row, with a photograph of a PC's expansion slots and their connectors under its end half; the back cover.
- **A Category page:** the stub; then, from 64rem, the swing tag of filters in columns 1 to 5 beside the Category's sheet in columns 6 to 12, the sheet filling its columns, over a dim photograph of a board; below 64rem, the search, the fold of the filters, then the sheet; the back cover.
- **A Part page:** the stub; the square plate, the Part's photo or its Category's icon on the start side and its name, part numbers (one left-to-right list, as a box prints them), Lowest Price and two cells on the end side, at least 88svh tall; the Offers: the slip (23rem) beside the sheet of Offers (40rem), centred and 56 pixels apart, over a dim photograph of a hand setting memory into a board, the slip pinned from 64rem; the specifications on one wide panel (at most 72rem) over a dim photograph of memory chips; the back cover.
- **A Vendor page:** the stub; the coupon (at most 72rem) with its tear-off tabs, over a dim photograph of a water-cooled PC; the sheet of its Offers, centred; the back cover.
- **The not-found page:** the stub; one sheet, centred over a dim photograph; the back cover.

**Widths.** At 48rem a piece changes from its phone form to its desk form: the sheet's padding, the plate's split, the coupon lying flat, the card's three-part foot, the printer's marks, the switches' names. At 64rem the swing tag stands beside the sheet, the slip beside the Offers and pinned, the margins widen to 40 pixels, and controls under a mouse may be 36 pixels. Every page is checked at 360, 390, 768, 1024, 1280 and 1440 pixels, and never scrolls sideways at 320. A figure that must fit a piece, such as the card's three words, a long name on the plate or the cropped name, is sized and checked against that piece, never only against the window.

**On a phone.** A sheet spans the screen with 10 pixels of ground at each side, 40 pixels of padding above and below and 18 at the sides, its scalloped edges kept; an item's name wraps and its leader shrinks to 0.75rem at the least, its price staying on the end side. The square plate puts its photograph first, but on a Part page its words come first and the photograph follows. The coupon stands upright. The card fills the screen but for 16 pixels at each side, at least 70svh tall. The switches take one row, the name slot one above it.

### The feel on a phone

Led by Emil Kowalski's `mobile-native`. Every check of it on a real phone waits until the platform is hosted, as every phone check does.

- **The viewport:** `width=device-width, initial-scale=1, viewport-fit=cover`, through Next's `viewport` export. Zoom is never turned off.
- **Safe areas:** photographs, grounds and the back cover run edge to edge, under a notch; what is read or tapped is padded from `env(safe-area-inset-*)`: the stub and the card's top row at the top and the sides, the back cover's credits at the bottom.
- **Heights:** the home page's dim room and the back cover are at least `100svh` and the card `70svh` on a phone, never `vh` or `dvh`, so that nothing shifts as the browser's bar hides.
- **Taps:** no grey flash over a tapped control (`-webkit-tap-highlight-color: transparent` on the document); every control has its own pressed state instead (Motion 8); links and buttons take `touch-action: manipulation`, so that a tap is not held for a second one.
- **Hover** only under a pointer that can hover, `(hover: hover) and (pointer: fine)` (Tailwind's `hover:` already); a touch gets the press alone.
- **Inputs that do not zoom:** every input's text is 16 pixels at the least, 17 in Kurdish and Arabic. The search is `type="search"` with `enterkeyhint="search"`, `autocapitalize="none"`, `autocorrect="off"` and `spellcheck="false"`; the two ends of a price range are `inputmode="numeric"`, and take Western or Arabic-Indic digits.
- **Words under a resting thumb:** a button's, a chip's, a switch's, a cell's or a tear-off tab's words are not selected by a long press (`user-select: none`), and a button or chip shows no long-press menu (`-webkit-touch-callout: none`). A link to a phone number, WhatsApp, Instagram or a map keeps the phone's own long-press menu, so that a Shopper can copy a Vendor's number, and every name, price, address and opening hours stays selectable.
- **Overscroll:** the pages are documents, so the browser's pull-to-refresh stays.
- **The browser's bar** takes the colour at the top of the page, through `theme-color` in each scheme: Sheet Paper (`#f4f3f0`, `#261d17`) under the stub, and the Back Cover's colour on the home page, whose first screen is a dim photograph. A scheme chosen with the switch is drawn by the server, the tag with it.
- **The filters with a thumb:** below 64rem the search stays in sight and the filters fold behind a bar as wide as the sheet and 52 pixels tall that says "Filters" at its start and, at its end in tabular figures, how many choices are on, the search's words aside, since the search stands above it. A tap on it unfolds the swing tag in place above the sheet, 10 pixels under the bar, a `<details>` that works before any script has loaded: its chips 44 pixels tall, wrapping in rows, then the price range, then Show Parts and Clear all, each half the tag's width and 52 pixels tall, at its foot, or each across the tag, Show Parts above, where their words do not both fit on one line, as in Kurdish at 360 and at 1024 pixels (ticket 11). With script a chip applies as soon as it is ticked or cleared, the list below is drawn again in place and the bar's count changes, the tag staying open for the next; Show Parts, or the keyboard's go key in a field of the price range, folds the tag at once and brings the list's head into view where it is not, the focus moving to the sheet's title, unless a typed price cannot be used: the tag then stays open, so that what the form says under that field is seen (ticket 11). Enter in the search sends the form and lets the keyboard go, as it did before the filters.
- **The slip** sits above the Offers on a phone and scrolls with them: pinned, it would cover a third of the screen.

## Elevation & Depth

Flat, as paper on a table. No `box-shadow` on anything, at rest or under the pointer, not even on the pinned slip. A piece is told from the table by its paper against the ground (Sheet Paper on the Bone Ground, 1.18:1 in the light scheme and 1.13:1 in the dark, or the paper against a dim photograph) and by its cut edge. What lies on what is shown by order alone: a stamp printed on its paper, the slip beside the sheet, the swing tag beside the list, the back cover closing the page.

### Named Rules

**The Flat Paper Rule.** Nothing is raised: a piece is paper on a table, never a card on a shadow. Depth is the step from the ground to the paper, the cut of an edge and the dimmed photograph under it.

## Shapes

Square corners everywhere (0 pixels): paper, buttons, cells, chips, inputs, the coupon and photographs. It is the page's one radius. The only round shapes are cuts in the paper, made with `mask` or `clip-path`, never with borders:

- **Scallops:** a sheet's top and bottom edges, half-circles of a 9-pixel radius, one every 23.4 pixels.
- **The torn foot:** the slip's lower edge, a zigzag 22 pixels wide.
- **Notches:** the coupon's two half-circles, 28 pixels across, cut into its top and bottom edges at 46% of its length from the start; on a phone, into its sides at 52% of its height. The square plate's photograph has one 56 pixels across at the middle of its end edge, a ticket's stub.
- **The punched hole:** the swing tag's, 20 pixels across, at the middle of its top, 28 pixels down.
- **Perforations:** rows of round dots, a 5-pixel dotted edge in the Bone Ground's colour, between the stub and the page, under the card's three words, and between the coupon's two halves. The tear-off tabs are joined by a dashed perforation in Half Ink, 3 pixels along their top and 2 between them.
- **Printer's marks:** corner marks 22 pixels long in 2-pixel lines of the bone, `#efe7da`, in both schemes, 30 pixels off each sheet's corners, and the ink bar under it, three swatches of 16 by 9 pixels in the Board, the Ink and Print Green, from 48rem. Every sheet lies over a dim photograph, on which the Soft Ink would be lost, so the marks take the bone its dimmed light reads against (ticket 09).
- **The specifications' panel** alone is framed, as the label on a box is: a 3-pixel frame in the Ink round the panel, a 3-pixel rule under the box label, and the label's six lines parted by 2-pixel rules at a quarter of the Ink.
- **Printed drawings:** hardware drawn in the Ink as outlines, 1.6-pixel strokes and no fill, with no text, as the engraving at the head of an old price list: a heat sink on the Categories sheet, and on a Category's sheet and its Parts' box labels the drawing of that Category: a CPU package from above, a CPU cooler's heat sink, a motherboard from above, a memory stick, an M.2 drive, a graphics card from its fans, a tower case from its front and a power supply from its fan (ticket 10). A drawing is geometry; it stands for a kind of Part, never for a Part on sale.

## Components

The Shopper app's own shadcn/ui components, on Base UI, created in the Lyra style when the first is needed (ticket 09), and drawn as this file says, not as Lyra's defaults. Each is a piece of the stationery below, or printed on one.

### The stationery

- **The card over a dim room.** The home page's first screen: a full-bleed photograph of a red-lit motherboard, dimmed to 62%, at least `100svh` tall, and centred on it one panel of Sheet Paper, at most 52rem wide and 62svh tall, with 32 pixels of padding (20 on a phone). Along its top, the frame's row; then the three words of the title spread to the start, the middle and the end, "Parts", "Prices", "Vendors", over a perforation; then the facts at the start and one sentence at the end, at most 30 characters wide; along its foot, the photograph's caption at the start, Choose a Category in the middle and one Part with its Lowest Price as a link at the end. On a phone the words wrap at the start and the button comes first in the foot. It does not move.
- **The printed sheet.** Every list: Sheet Paper, 40rem wide, its top and bottom edges scalloped, 64 pixels of padding, set centred like a printed card: its title in the Sheet title, a note under it in Small Soft Ink, a printed drawing where the page has one, then groups 56 pixels apart, each under a centred Label, its items 16 pixels apart, then its closing lines in Small Soft Ink. An item is a line: the name at the start, a dotted leader in Half Ink that runs to the price, the price at the end in tabular figures, and under them, across the line, its second line in Body Soft Ink. The printer's marks stand off its corners from 48rem.
- **The price slip.** A Part's figures as a till slip, Sheet Paper (the Bone Ground on the plate), 23rem wide, its foot torn: the name slot's words as its heading in a Label, the Part's name, a dashed rule, then six lines joined by dotted leaders (the Lowest Price in the Title size, the highest in stock, how many Vendors, how many in stock, how many converted "≈", the Platform Rate), a dashed rule, and a foot in Small Soft Ink with the day the lowest was confirmed and its Vendor's name as written. On the home page's plate and beside a Part's Offers.
- **The stamp.** The Lowest Price stamped on the slip, "Lowest price first" on a Category's sheet: words in Print Green in the Label, inside a 3-pixel double frame of the green, on the paper at 70%, turned 5 degrees back from true, in the end corner of its paper and kept inside it. It is decoration, hidden from readers, since the words it stamps are also printed beside it. On a phone a sheet's stamp stands under its title.
- **Tear-off tabs.** The foot of a sheet cut into tabs along a perforation, each a link: the Categories sheet in eight tabs, each a Category, its name read upright along the tab; the coupon in six tabs, each its phone number, each a call. A tab is at least 44 pixels wide and 150 pixels tall (130 on a phone); the Categories' tabs take two rows of four on a phone, the coupon's two rows of three. They are listed in the reading order, and so mirror in Kurdish and Arabic.
- **The square plate.** A field of the Board split in half, at least 88svh tall: on the start side one square, the Part's photo or its Category's icon, 40 pixels in from the field's edges, the notch cut into its end edge, and on a Part page, from 64rem, filling its half of the field, so that the picture holds a third of a desk's first screen, as Taste's inspector asks of a first screen (ticket 12); on the end side a column with, at its top, the currency as tabs ("Dinars", "Dollars", the chosen one in the Ink at 600 with a 3-pixel underline 8 pixels below, the other in Soft Ink), in its middle the title and its words, at its foot two cells side by side, 72 pixels tall (60 on a phone), the first of Ink with Bone Ground words and the second of Sheet Paper. On a phone it stacks, its cells one above the other.
- **The facts row.** The home page's: a heading at Display size in columns 1 to 6 and a sentence in columns 9 to 12, its last line on the heading's baseline; 120 pixels below, four facts spread across the row, each a figure in the Facts size with one line under it in Small Soft Ink; a photograph at 4:3 under its end half, with its caption, a board's expansion slots and their connectors cut to 4:3 from a photograph under CC BY (ticket 07's copper heat sink is under CC BY-SA, which a cropped copy would have to share alike). On a phone the facts take two columns. Each fact is true and comes from the data or the platform's rules: a count is shown only where the API answers it, and the Platform Rate's fact is left out until the Admin sets the first rate (ticket 09).
- **The swing tag.** The filters' form, Sheet Paper with its punched hole, 56 pixels of padding at its top and 32 elsewhere: its title, "Filters", centred, then its fields 24 pixels apart: the search, the manufacturer, the Category's key specifications and the price range, and Show Parts and Clear all at its foot (ticket 11).
- **The coupon.** The Vendor's contact details as a coupon to cut out: a field of Coupon Green, about 2.2 to 1, its notches cut into its top and bottom edges at 46%, the perforation between its halves; the start half (46%) with 48 pixels of padding, the end half (54%) with the contact cells.
- **The box label.** A Part's specifications open with the label on its box: the Part's name, its key lines, at most six, the drawing of its Category and its first part number as a barcode, inside the label's frame.
- **The back cover.** The close and the footer in one field of the Back Cover, at least `100svh` tall: at the top, an invitation at Display size, "Find your Part", over Choose a Category, and, in columns 10 to 12, four Categories as links; above the foot, the credits; at the foot, the cropped name. The cropped name is the name slot's words set at 26vw on one line, pushed 24% below the field's edge so that the edge cuts through its letters, and cut by the end edge when it is long: it is the platform's name once one is chosen, readable from its upper two thirds, and hidden from readers.
- **Buttons and cells.** Square, at least 52 pixels tall with 24 pixels of padding at the sides, Body at 600: the primary button in Print Green with Green's Ink, one to a screen; every other action a cell, on the Board, on Sheet Paper or in Ink, as its piece gives it. Under a hovering pointer and while pressed, a button or cell takes its ground one step deeper (Pressed Green, Deep Board, the Board for a cell of paper, Soft Ink for a cell of Ink), its words still at 4.5:1 or more, and a press settles it to 0.97 (Motion 8). The focus ring is a 3-pixel line in the Focus colour, 2 pixels outside the control, at once and at full strength; on the coupon and the back cover it is drawn in their ink.
- **Links** in running text and in an item's name are underlined, 1 pixel, 4 pixels below the letters, and 2 pixels under a hovering pointer.

### The photographs

Photographs of PC hardware (boards, fans, memory, coolers, a built PC, a power supply), never a place and never a Part on sale: from the open collections, under licences that allow reuse, found with Taste's `assets.mjs` and kept with their credits in browse ticket 07, and never a maker's name or logo large, nor a person who could be known. They lie under the paper as the table, dimmed to 50% (62% behind the home page's card), full bleed, or stand as a plate on the paper with their caption below. Each photograph is credited on the page that shows it, in the back cover's credits. They are atmosphere, so a reader is not told of them (`alt=""`) unless a caption says what they are. Each is served at the size it is drawn, in a modern format, below the first screen only when it is reached (`loading="lazy"`), with the ground's colour under it while it loads.

### The frame

- **Its header, the stub.** On every page but the home page: a strip of Sheet Paper across the top of the page, its lower edge a perforation, 8 pixels of padding above and below and the page's margins at its sides. The name slot is on the start side and the switches on the end side; below 48rem the name has its row and the switches one row under it. On the home page the card's top row is the header, with the same name slot and switches, since the card holds everything on its first screen. The card is narrower than the stub by its padding, so on a phone narrower than 400 pixels (385 in English) the scheme's button wraps to a row of its own under the other two switches, as in the renderings the owner chose; each choice keeps its 44 pixels (ticket 09).
- **The name slot, the way home.** A link to the home page in every language, in the Label: "PC Parts and Prices" (پارچە و نرخی کۆمپیوتەر), a plain description of what the platform is, until its name is chosen (PRODUCT.md's Brand Commitments); never the working title. On the home page it is marked as the page the Shopper is on. Each word of it is drafted for Kurdish and Arabic under LANG-7.
- **The switches.** Three, in one row, in this order: the currency, the language and the colours, each told apart by its own name in Small Soft Ink before it from 48rem, by the gap between them and by what it holds. On a phone they stand 2 pixels apart, as the renderings set them, so that the row fits a 360-pixel stub in Kurdish and Arabic (ticket 09). Each choice is at least 44 by 44 pixels on a touchscreen and 36 under a mouse from 64rem, in Small; the chosen one is in the Ink at weight 700 with a 2-pixel underline 6 pixels below and is marked as the current one; the others are plain. Every one works before any script has loaded, as a plain link or a plain form, and is remembered for a year.
- **The currency switch, the price's own control.** Named "Prices in" on the page from 48rem; its two choices are named as prices are: "Dinars" and "Dollars" from 48rem, and on a phone "IQD" and "$", the marks every price carries. A choice is a button of a plain form, which the server answers by writing it down and returning the Shopper to the page they were on, with its query but for a price range, in its language. Where a price leads a page (the square plate on the home page and a Part page) the same choice stands above it as the plate's tabs. It is never drawn as a second row of language links.
- **The language switch.** The three languages, each named in its own language and script, کوردی, العربية, English, with `lang` and `hreflang`, as plain links to the same page in each language, its query kept. The names in Arabic script are 15 pixels at the least on every page.
- **The scheme switch.** Named "Colours" from 48rem, with Light, Dark and Device, Device the first choice; on a phone, one button with a half-filled circle, 44 pixels square, that turns through Light, Dark and Device, its name saying the scheme now and the one a tap gives. A choice is a button of a plain form, remembered in a cookie as the currency is, so that the server draws the chosen scheme before the first paint and no page flashes the other; with script the scheme changes in place, every colour in one frame. Device follows the device.
- **The footer's credit.** On the back cover of every page, the not-found page among them, above the cropped name: the credit to BuildCores OpenDB (CAT-9), in the words of the licence's own notice, in the Shopper's language, OpenDB's name and the licence's kept in English and each a link; then the photographs on the page, each by its title, its author and its licence, each a link to its source. Body in Back Cover Ink, the links underlined, its lines spread from the start to the end and wrapping, each link a target 44 pixels high.

### The home page

- **A Category on the home page.** An item of the sheet "Eight Categories", in two groups, "The core" (CPU, CPU cooler, Motherboard, RAM, Storage) and "Around it" (GPU, Case, PSU), in the catalog's fixed order: the Category's icon at 20 pixels in the Ink, its name in the Shopper's language as a link to its Category page, the leader, and at the end how many Visible Parts it has, "9 Parts", and "0 Parts" when it has none, its figure kept in the column (words in its place broke a Kurdish name letter by letter at 360 pixels); on its second line the first Part of its list and that Part's Lowest Price, the lowest on the platform, "Intel Core i3 12100F · Lowest Price 115,000 IQD", or "Out of stock at every Vendor" when every Vendor has it out of stock. The sheet ends with the Categories as eight tear-off tabs.
- **One Part, on the plate.** The square plate with one Part, its photo or icon, and its slip. The Part is the data's choice, the Visible Part with the most Vendors on the first page of the eight lists, never chosen by hand or by a Vendor (ticket 09 sets how it is read).

### A Category page

- **A Part on a Category page.** An item of the Category's sheet: on its start side a small square, 48 pixels (40 on a phone), tipped onto the paper like a plate, holding the Part's photo or its Category's icon at 24 pixels in the Ink on the Board; then the Part's name, in English, as a link to its Part page, the leader, and at the end its Lowest Price, or "Out of stock" in Body Soft Ink in the price's place when every Vendor has it out of stock; on its second line its manufacturer and how many Vendors offer it, "AMD · 20 Vendors". In stock first, under "In stock", lowest first; then, under "Out of stock at every Vendor", the rest. The sheet's stamp says "Lowest price first". A list too narrow for its own text, as at 320 pixels or with a phone's text made larger, stacks each Part: its square and its name, then its leader and price, then its second line (ticket 10).
- **The sheet's sentence and its close.** Under the title, the sentence that says what the sheet shows, "9 Parts that Vendors offer now, lowest price first.", or why it lists nothing, in Body large in the Ink, as the not-found page's note is, since it is what the page says; it is the page's status, read to a screen reader when a search changes it in place. At the sheet's foot, its closing line, "Lowest price first. Parts every Vendor has out of stock come last.", and under it, when a price on the page is converted, what "≈" means, both in Body Soft Ink and at most 34rem wide (ticket 10; the closing line was in Small until ticket 11, when on a list whose filters left no converted price it was the page's only running text, which Taste's inspector read as too small).
- **The search.** The swing tag's first field from 64rem, and below 64rem a field of its own above the fold, always in sight: an input 48 pixels tall, its ground the Bone Ground on the tag's paper and Sheet Paper where it lies on the ground itself, with a 3-pixel line in the Ink along its foot, the line of a form filled in by hand, its placeholder "Name, manufacturer or part number" in Soft Ink, its name ("Search CPUs") read by screen readers. It takes the direction of what is typed in it, so that a long English search on a Kurdish page shows its start (ticket 11). It searches on Enter or the keyboard's search key, with the rest of the form.
- **The filters.** On the swing tag, each filter a field set with its legend at weight 600: the manufacturer, then the Category's key specifications, as the API's answer of the Category's filters gives them, so that the Shopper app holds no list of them. Their names are in the page's language, from the Shopper set, keyed by the parameter the API asks each by, "Socket", "Cores", "Air or liquid"; their values are in English and left to right, a number in Western digits with its unit, "240 mm", and yes or no in the page's language, a CPU cooler's "Air" and "Liquid" (ticket 11). A filter the answer leaves out, holding no value, is not drawn. Each value is a chip, a native checkbox drawn as a square of the Board 44 pixels tall with its words in the Ink and 14 pixels at its sides; a chosen one turns to Print Green with Green's Ink and a check mark before its words, so that its state is in a mark as well as a colour. A filter of more than 16 values shows its first 12 chips and folds the rest behind a disclosure of its own, which works before any script has loaded: its words underlined as Clear all's are, "137 more", and "Fewer" once open; it is open from the first when a value it folds is chosen, so that no chosen chip is hidden, and a filter of up to 16 values shows them all (ticket 11, from `break-ui`: the made-up shop's 149 GPU chipsets made the unfolded tag some 6,000 pixels tall on a phone). Then the price range, then Show Parts, the primary button, and Clear all, a cell, side by side at the tag's foot. From 64rem the tag stands beside the sheet; below it, it folds (The feel on a phone).
- **The choices that are on, and clearing them.** At the head of the sheet, under its note, once a choice is on: one chip of Print Green for each choice that is on (a manufacturer, a value, a price range, the search's words), each with a × after its words and each a link to the same list without it, from its first page, named for a screen reader as removing it, "Remove AM5"; then Clear all, an underlined link to the list with nothing on. A value's chip carries its words as the tag's chip does, but a number with no unit is named by its filter, "Cores 8", so that it is never read as a bare figure; the price range is one chip, "250,000 to 400,000 IQD", "From 250,000 IQD" or "Up to 400,000 IQD" (ticket 11). Below 64rem the fold's bar says how many are on.
- **The price range.** A field set named "Price" with the chosen currency's unit, "Price, IQD": two inputs side by side, "Lowest" and "Highest", each named above it in Small Soft Ink, their placeholders the lowest and the highest Lowest Price in the Category, in Western digits, as a price is written. Each takes a whole number from the phone's number pad, in Western, Arabic-Indic or Eastern Arabic-Indic digits, its thousands grouped or not. A value that cannot be used is not sent, and the form says why under its field, in Small in the Ink, which a screen reader hears as the field's description: "Not a whole number, so not used.", "Too large, so not used." past 15 digits, or "Above the highest, so not used." for the lowest end, the highest still used. Such a field keeps what was typed, so that it can be corrected; one that is used shows it again in Western digits, grouped. The range is left out when no Visible Part of the Category has a Lowest Price, as any range would then find nothing (ticket 11). A switch of currency drops the range, as it was typed in the other currency.
- **Paging.** At the sheet's foot, above its closing lines: "Page 2 of 17" in the middle, Small Soft Ink, and Previous page and Next page as two cells of the Board, 52 pixels tall, on the start and the end sides, each with an arrow that points along the reading direction and so mirrors in Kurdish and Arabic; a first page has no Previous and a last none Next, and a list of one page says "Page 1 of 1" alone. Each is a link, its page in the address. A page holds 20 Parts, as the dashboard's lists do, within the 12 to 24 a printed menu sheet holds; on a narrow sheet the page's place takes a line of its own above the two cells, each as wide as its words (ticket 10).
- **The empty states.** Both are the Category's sheet with its title, its drawing and nothing to list, and tell the two apart in words:
  - **A Category with no Visible Parts:** "No Vendor offers a CPU yet." in Body large, and one line in Soft Ink that Vendors add their Offers as they stock them; then Choose another Category, a cell leading to the home page's Categories.
  - **A search or filters that found nothing:** "No CPU matches your search and filters." in Body large, the choices that are on, and Clear all as the sheet's primary button.

  Two more states have no list to show, and say so in the same place: **a page past the last**, "This list has only 3 pages.", with Go to the first page as the sheet's primary button; and **a list the API did not answer**, "The list cannot be read just now. Try again in a moment.", with Try again, a cell, to the same address (ticket 10).

### A Part page

- **A Part's photo, and its Category's icon in its place.** On the square plate: the photo fills its square, its whole shown on white, as a product shot has it, square-cornered, with the plate's notch cut into it; a Part with no photo shows its Category's icon in its place, drawn in the Ink at 40% of the square, on Sheet Paper so that it stands off the plate's Board (CAT-6), the icon one picture as large as its square. On a Category page the same, in the item's small square. Neither the photo nor the icon is ever mirrored.
- **The Shown Price, with its "≈", and "out of stock".** One component draws every price: the amount in Western digits, grouped in thousands with commas, then its unit, IQD or $, and "≈" before the figure when it is a Converted Price, all one left-to-right unit. On an Offer a converted price also says what the Vendor quoted, "Quoted 362 $", on its second line. "Out of stock" is worded the same everywhere: in the price's place on a Category page, and at the head of an Offer's second line, where the Offer's price is in Soft Ink, so that a price that cannot be bought is not read as one to take. It is always words, never a colour alone.
- **The specifications.** One wide panel of Sheet Paper in the label's 3-pixel frame, under the title "Specifications": first the box label, the Part's name in the Sheet title, its key lines (the Category's key specifications, the ones BRW-2 names for its filters first and then those a buyer weighs next, such as a CPU's threads, boost clock, L3 cache and TDP or a PSU's form factor, modularity, length and PCIe connectors, at most six, each a label in Body at the start and its value at 600, a line the Part does not hold left out), the drawing of its Category, and its first part number as a Code 39 barcode, black on white, 64 pixels tall, drawn at a pixel a module and narrowed only by the room it has, with the number under it, the whole named for a screen reader by the part number; from 64rem the drawing and the barcode stand in a column of 24rem beside the lines, as wide as a barcode of twenty characters, and below 64rem they follow them. The barcode reads: Apple's barcode reader read it at one, two and three device pixels a pixel, and at two and three where a phone's label narrows it. A part number Code 39 cannot write as it is (a small letter, a bracket, an underscore) or of more than twenty characters, as some of the catalog's are, is printed alone, with no bars. Then, under the label's rule, every specification the Part holds in its Category's order, in two columns from 48rem, the label at the start and the value at the end at 600, both in English and left to right, yes and no as words, and a list of rows a line for each row. A specification the catalog does not know is left out, and a Part the catalog holds none of says so in a sentence (ticket 12).
- **An Offer.** An item of the sheet of Offers, "20 Vendors offer it", its note saying "In stock first, then lowest price. No Vendor pays for its place.": the Vendor's name as it wrote it, its own direction kept (`AsWritten`), as a link to its Vendor page; the leader; its Shown Price, the name taking its whole line, its leader and price on the line under it, when the two are more than a line holds side by side, 26 characters together on a phone and 52 at every width, and on a sheet too narrow for its text, as with a phone's text made larger (ticket 12); on its second line, in Soft Ink, what the Vendor quoted when converted, its warranty in months when it states one, and how many days ago it was confirmed. Under "In stock", lowest first, then under "Out of stock". The sheet closes with what "≈" means. The slip stands beside it from 64rem and above it on a phone. On a Vendor page an Offer is the Part's name in English, as a link to its Part page, its Shown Price, and a second line with its stock, its warranty and its Confirmation, the Offers grouped by Category under each Category's name.
- **A Part the API does not answer.** The stub, then one sheet over the dim photograph of the Offers: "This Part cannot be read just now" as its title and the page's `h1`, "Try again in a moment." as its note, and Try again, a cell, to the same address; the page answers 200, as a Category's list the API does not answer does, since the Part may well be there (ticket 12).

### A Vendor page

- **A Vendor's contact details and their links.** The coupon. On its start half: the Vendor's name as it wrote it, in the Sheet title, as the page's `h1`; at its foot, its city and address as written, and its opening hours under "Opening hours" at 600. On its end half, the links, each a cell 56 pixels tall of Deep Green with what it does at the start and the detail at the end: Call, the first, turned over in Coupon Ink with green words, a `tel:` link; WhatsApp, its chat; Instagram, its name with "@", the profile; Open in Google Maps, in a new tab, with its arrow. Phone numbers, the Instagram name and the coordinates run left to right. A detail the Vendor has not given is left out, cell and line, and a Vendor with only its phone number has one cell. Under the coupon, its tear-off tabs carry the phone number, when it has one. On a phone the coupon stands upright: its words above, the perforation across its middle, its cells below, one above the other.
- **Its Offers.** The sheet of its Visible Offers, grouped by Category; a Vendor with none says so on the sheet, "This Vendor has no Offer to show now.", and its coupon still shows how to reach it.

### The not-found page

The frame, then one sheet: its title, "Page not found", as the page's `h1`; its note, "This Part or Vendor may no longer be on the platform, or the address may be mistyped.", in Body large in the Ink, as the card's sentence is, since it is what the page says (in a sheet note's Small Soft Ink Taste's inspector read it as body text too small, ticket 09); then, under "Choose a Category", the eight Categories as items, each its icon and its name as a link to its Category page, in the catalog's order, with no count and no price, so that the page needs nothing from the API. The back cover with its credit follows. It answers with the status 404 in the page's language. Next sends it as a bare document, which the browser draws by script, frame and all, so on this page alone the switches need script; the head the server sends holds its title, its description and Open Graph's, and names no canonical address, since there is no page to name (ticket 09).

## Motion

Led by Emil Kowalski's skills, `emil-design-eng` and `animate`, from the seven movements the owner kept on 6 November 2026 and the sheet's own move, the pinned story. It is the motion of paper and print: a piece prints out as it arrives, its prices settle, a stamp lands, a slip feeds, a tab gives, a barcode is scanned. It plays once a page view, on what arrives, and answers the hand; it never moves what a Shopper is reading or deciding on. Every movement is CSS, a transition or an animation of `transform`, `opacity` or `clip-path`, so that it runs off the main thread on a weak phone; one small script of the page's own starts the prints below the first screen. No animation library.

### Tokens

In `@pcp/ui/themes/shopper.css`'s `@theme` (ticket 09):

| Token | Value | For |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | every print, settle, landing, lean and press |
| `linear` | | the barcode's scan, a constant speed |
| `steps(10, end)` | | the slip's feed, as a till printer feeds paper |
| `--print` | 900 ms | a sheet printing, with an 18-pixel slide |
| `--feed` | 1000 ms | the slip feeding |
| `--settle` | 500 ms, 45 ms apart, from 300 ms into the print | prices settling, 16 pixels |
| `--stamp` | 320 ms, its opacity in 120 ms, from 900 ms into its paper's print (1150 ms on the slip) | the stamp landing |
| `--scan` | 700 ms, from 400 ms after the barcode is seen | the scan |
| `--unfold` | 250 ms, and 150 ms to fold | the filters unfolding on a phone |
| `--lean` | 160 ms | a tab giving |
| `--press` | 140 ms | a press |
| `--hover` | 150 ms on `ease` | a colour under the pointer |

The curve is front-loaded: a sheet is three quarters uncovered 200 ms into its 900, and a price settled 200 ms into its 500. Only the first ten prices of a sheet are staggered; the eleventh and later settle with the tenth, so that every print, its prices and its stamp are done within 1.25 seconds. Nothing lasts longer than the slip's one second, and `ease-in` is never used.

### When a movement plays

The sheets print (Motion 1, with 2, 3 and 4) as the owner decided on 6 November 2026 (browse ticket 08):

- **Once a page view, when the Shopper comes to the page.**
- **A page drawn again, by a filter, a search or another page of results, or come back to by back or forward, is shown printed.**
- **Nothing moves without script.**

How the rule is kept:

- **Coming to a page.** A sheet on the first screen, a Category page's or the not-found page's, prints as the page opens, from its first paint, by CSS alone, waiting for no script and no load event; the not-found page's from the first paint of the screen the browser draws. A sheet or slip below the first screen prints when its top is about nine tenths of the way down the window, started by the page's script, which is also what holds it back until then: no piece is hidden by the stylesheet alone, so a page whose script is late or blocked shows every piece printed. The language and currency switches open the page anew, so its sheets print again, in the other language or currency.
- **Drawn again, or come back to.** A filter, a search, another page of results or a choice cleared, applied in place with script, changes the rows in place and at once, and the new rows' prices do not settle. Going back or forward shows the page as it was left, printed: from the browser's back-forward cache, or with the page marking a return before it draws (the not-found page, drawn by script, marks it before that screen is painted).
- **Without script** (`@media (scripting: none)`) every page is still and whole, so the filters, which are then each a page of their own, never print the list again.

### What moves

1. **A sheet prints** (`#m1`). Every printed sheet (the Categories, a Category's Parts, a Part's Offers, a Vendor's Offers, the not-found page's) is fed out top first: uncovered from its top edge down, `clip-path: inset(0 0 100% 0)` to `inset(0)`, while it slides 18 pixels down into place, 900 ms on `--ease-out`, once.
2. **Prices settle into their column** (`#m2`). From 300 ms into its sheet's print, each price at the end of a line (or a Category's count, on the home page) slides 16 pixels in from the end side and fades in, 500 ms on `--ease-out`, 45 ms after the one above it. The names do not move, only the column of prices, as if the printer set them last.
3. **The stamp lands** (`#m3`). From 1.6 times its size and 12 degrees further round, it comes down to its place in 320 ms on `--ease-out`, its opacity in 120 ms, once its paper has printed: 900 ms into a sheet's print, 1150 ms into the slip's. It is clipped inside its paper as it lands, so that it never widens the page.
4. **The slip feeds** (`#m4`). The price slip prints as a till does: uncovered in ten steps over one second (`steps(10, end)` on its clip), while its 18-pixel slide eases out.
5. **A tab gives** (`#m5`). A tear-off tab leans from its perforation, turning about the middle of its top edge: under a mouse, 2 degrees and 3 pixels down; pressed, 5 degrees and 6 pixels; 160 ms on `--ease-out`. A touch gets the press alone.
6. **The barcode is scanned** (`#m6`). Once, when the box label's barcode comes into view, a 3-pixel line of Print Green crosses it from its start edge to its end edge, 700 ms at a constant speed, 400 ms after it is seen, and is gone at the end.
7. **The pinned story** (`#m7`). The sheet's own move: from 64rem, on a Part page, the price slip holds its place, `position: sticky` 32 pixels from the top, beside the Offers while they scroll past, and lets go where they end. The page's own scrolling does it; nothing is hijacked. Below 64rem the slip sits above the Offers and scrolls with them.
8. **The press** (`#m8`). A button, a cell, a chip, a switch's choice and the fold's bar settle to `scale(0.97)` while pressed, 140 ms on `--ease-out`, and come back from wherever they are; each takes its pressed ground at once. Tear-off tabs lean instead (5); a link in a line does not scale.
9. **A colour under the pointer** (`#m9`). A button's, a cell's or a chip's ground, and a link's underline, change over 150 ms on `ease`, only under a pointer that can hover. The focus ring is never transitioned: it is there at once.
10. **The filters unfold** (`#m10`). On a phone the swing tag's space opens over 250 ms on `--ease-out` as its contents fade in, and folds in 150 ms, where the browser can animate a disclosure's height (`::details-content` with `interpolate-size`), and at once where it cannot, so that the list below moves down rather than jumps. Show Parts folds it at once, as the page then goes to the list (ticket 11). From 64rem the tag is always unfolded and its bar is not drawn, where the browser can show a folded disclosure's contents; where it cannot, the bar stays at every width (ticket 11).

### What stays still

Prices and figures (a price never counts up, flashes or slides but as its sheet prints, and the slip's figures arrive with the slip); a list drawn again, whose rows change in place; a list's order, never animated into place; the home page's card and its dim room, there from the first frame; every photograph, with no drift, zoom or parallax, since it is the table and not the show; the frame and its switches, the scheme changing every colour in one frame with transitions suppressed for it; the swing tag on a desk, the choices that are on, paging, the coupon and its cells, the specifications; the focus ring; and anything the keyboard does many times, such as moving the focus or typing in the search.

### When a movement is interrupted

- **A print** (1, 4) is one way and once. Scrolling past it or away does not stop or reverse it, and the piece is printed when the Shopper comes back. A link on a sheet still printing works as soon as it is seen.
- **Keyboard focus** that enters a piece still printing or not yet printed, a link to one of its anchors, or the browser's find landing in it, finishes its print at once, so that nothing focused or found is hidden.
- **The stamp** (3) and **the scan** (6) run to their end, once; nothing starts them again on that page view.
- **A tab's lean** (5), **a press** (8) and **a colour** (9) are transitions: a pointer that leaves mid-lean, a press released early or a press on a leaning tab each go on from where they are.
- **The filters** (10): a second tap while the tag unfolds folds it back from where it is.

### Right to left

- Prices settle from the end side: from the right in English, from the left in Kurdish and Arabic (2).
- The scan crosses from the start edge, left to right in English and right to left in Kurdish and Arabic; the barcode's bars are never mirrored (6).
- The slip is pinned on the Offers' start side, mirrored with the grid (7).
- The prints and the feed run from top to bottom, the stamp lands in place and keeps its tilt, and a tab leans the same way, in every language: none of them reads in a direction.

### Reduced motion

`prefers-reduced-motion: reduce` gives the finished page: every piece printed, every price settled, every stamp down and the slip fed from the first frame, with nothing held back for a movement that will not run.

| Movement | With reduced motion |
|---|---|
| A sheet prints, the slip feeds | printed from the first frame: no clip, no slide |
| Prices settle | in their column from the first frame |
| The stamp lands | down from the first frame |
| A tab gives | no lean; a pressed tab takes its pressed ground |
| The barcode is scanned | no line |
| The pinned story | kept: the slip holds its place, which moves nothing itself |
| The press | no scale; the pressed ground stays |
| A colour under the pointer | kept, as it is a colour |
| The filters unfold | they open and fold at once |

### Named Rules

**The Once a Page Rule.** A piece prints once, when the Shopper comes to its page. A page drawn again or come back to is shown printed.

**The Paper Holds Still Rule.** Once printed, nothing on the paper moves for show: no figure counts, no row moves into its place, no photograph drifts. Taste's inspector asks a page for eight moving things, which a page with one sheet does not have; the sheet allows `still-page` for this rule (the owner, 6 November 2026, browse ticket 09).

**The Nothing Held Back Rule.** No piece is hidden by the stylesheet alone, nothing in view waits longer than 1.25 seconds to be whole, and the reduced page is the finished page.

## Do's and Don'ts

### Do:

- **Do** print every list as a sheet: the name at the start, the price at the end in tabular figures, a dotted leader between, the groups under a Label.
- **Do** draw a Converted Price with its "≈" at the figure's own weight and ink, inside the price's left-to-right unit, and say beside it what the Vendor quoted.
- **Do** spend Print Green on the screen's one primary button, a chosen filter, the stamp, the coupon and the scan, and set it as text only on Sheet Paper.
- **Do** cut a piece's edges, scalloped, torn, notched or perforated, with a mask, and keep every corner square.
- **Do** lay the dim photographs of hardware under the paper and credit each on the page that shows it; give a Part its own photo or its Category's icon.
- **Do** set Kurdish and Arabic display text in Noto Kufi Arabic at 700, at its own smaller sizes and looser lines, and Arabic script at 15 pixels at the least on every page.
- **Do** say every state in words or a mark as well as its colour: "Out of stock", "≈", a chosen chip's check mark, the chosen switch's weight and underline.
- **Do** keep the motion's arrival rule, its tokens, and the finished page under reduced motion.
- **Do** let a phone take a tap as a native app does: no grey flash, no wait for a second tap, inputs that never zoom, no button's words selected under a resting thumb, the browser's bar in the page's colour.

### Don't:

- **Don't** set Big Shoulders in capitals, or space the letters of Arabic script.
- **Don't** outline a piece with a border, draw a thin rule between lines, round a corner or cast a shadow; the specifications' label is the one printed frame.
- **Don't** set text on a photograph, or show a photograph that could be taken for a Part on sale, a maker's logo or a person.
- **Don't** put a city, a bazaar or a place in a picture or a word of the design.
- **Don't** animate a price or a count, a list drawn again, a list's order, the switches, a change of page or anything the keyboard repeats; or use `ease-in`, `transition: all` or an animation library.
- **Don't** set text under 14 pixels (15 in Kurdish and Arabic), even where Taste's sheet says 13 or 12, or a control under 44 by 44 pixels on a touchscreen.
- **Don't** reach for the gaming look of neon, glows and angled panels, a template's cards and gradients, or cream and terracotta.
