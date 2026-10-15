---
name: The dashboard, Rate Board
description: The numbers a Vendor and the Admin keep, set like a money changer's board.
colors:
  warm-page: "oklch(0.967 0.007 88.6)"
  sheet: "oklch(0.985 0.004 91.4)"
  ink: "oklch(0.203 0.005 248.1)"
  plate-graphite: "oklch(0.303 0.009 248.1)"
  plate-amber: "oklch(0.791 0.134 79.5)"
  action-red: "oklch(0.501 0.178 28.7)"
  warning-brown: "oklch(0.531 0.119 65.1)"
  confirmed-green: "oklch(0.475 0.099 148.2)"
  shelf: "oklch(0.925 0.01 87.5)"
  note-grey: "oklch(0.484 0.013 256.7)"
  rule-sand: "oklch(0.874 0.013 86.8)"
  control-edge: "oklch(0.599 0.018 82.8)"
  night-page: "oklch(0.194 0.005 248.1)"
  night-ink: "oklch(0.934 0.008 91.5)"
  night-red: "oklch(0.708 0.155 26.9)"
typography:
  heading:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.333
  title:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  row:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.429
  figure:
    fontFamily: "Geist Mono Variable, monospace"
    fontSize: "1.25rem"
    fontWeight: 700
    fontFeature: "tnum"
  figure-large:
    fontFamily: "Geist Mono Variable, monospace"
    fontSize: "1.875rem"
    fontWeight: 700
    fontFeature: "tnum"
rounded:
  plate: "3.6px"
  control: "6px"
spacing:
  control: "44px"
  row: "8px"
  group: "16px"
---

<!-- Written with ticket 10 of the catalog module, on 15 October 2026, before any dashboard screen exists. Re-run Impeccable's document once the Catalog is built, to record its components. -->

# Design System: the dashboard, Rate Board

## Overview

**Creative North Star: "The Rate Board"**

In the window of every money changer in Erbil hangs a board of plain figures on dark plates, set by hand and dated, and the Platform Rate follows it by hand too. The dashboard sets the numbers its people keep the same way. A Vendor's prices, the Platform Rate, the count of Offers about to expire and of Part Requests waiting: each is a figure on a small graphite plate, in amber, with the date it was last set beside it. Everything else is a warm, quiet page and ink, so that the plates are where the eye goes and what needs action is the only red.

The dashboard holds two surfaces. The Admin console, in English, is used on a phone in a Vendor's shop and at a desk. The Vendor portal, in Kurdish, Arabic and English, is used on a phone behind the counter, between serving people at it. Both are dense, quick working screens in the manner of Linear: rows rather than cards, few words, nothing that moves without reason. Their navigation, tables, forms and buttons are the ordinary ones of the web, on shadcn/ui's compact Mira style.

The shared floor is in [the root DESIGN.md](../../DESIGN.md), and the reasons in ADR-0006 and ADR-0007.

**Key Characteristics:**

- A warm page and ink; colour is for plates, action and state, never decoration.
- Numbers that matter on dark plates, in amber Geist Mono, each with its date.
- Dense rows; every control still 44 pixels high.
- Small, firm corners; borders, not shadows.
- The same look in Kurdish and Arabic, right to left, as in English.

## Colors

A money changer's window: a warm page, black ink, graphite plates with amber figures, and red only where something needs doing. Each colour's name in code follows it, from `@pcp/ui/themes/dashboard.css`; the values are in the tokens above.

### Primary

- **Ink** (`--foreground`, `--primary`, `--ring`): text, the focus ring, and the one filled primary button. **Night Ink** in the dark scheme, where the primary button turns light.
- **Plate Graphite** (`--plate`) and **Plate Amber** (`--plate-figure`): the plates and their figures, the same in both schemes, at 6.9:1.

### Secondary

The states, each also said in words or a mark, never in colour alone.

- **Action Red** (`--destructive`): what needs the Vendor's or the Admin's action, such as an Offer about to expire, and destructive actions. **Night Red** in the dark scheme.
- **Warning Brown** (`--warning`): a warning that needs no action yet.
- **Confirmed Green** (`--success`): confirmed today, and in stock.

### Neutral

- **Warm Page** (`--background`) and **Sheet** (`--card`, `--popover`): the page, and a raised surface such as a menu. **Night Page** in the dark scheme.
- **Shelf** (`--secondary`): a quiet surface, such as a secondary button or a selected row.
- **Note Grey** (`--muted-foreground`): secondary lines, at 4.5:1 or more on every surface.
- **Rule Sand** (`--border`): the rules between rows.
- **Control Edge** (`--input`): the border of an input or any control whose border is the only sign of where it is, at 3:1 against the page.

### Named Rules

**The Amber Is Only on Plates Rule.** Plate Amber appears on Plate Graphite and nowhere else: not as an accent, not on the page, not as a glow.

**The Red Is for Action Rule.** Action Red marks what someone must do, and always beside words that say what.

## Typography

**Body Font:** Geist (with Noto Sans Arabic for Kurdish and Arabic)
**Arabic-script Font:** Noto Sans Arabic
**Figure Font:** Geist Mono, on plates only

**Character:** a quiet, precise grotesque and its monospace, beside a clear Arabic-script sans: the voice of a well-kept ledger read at a glance.

### Hierarchy

- **Heading** (600, 1.5rem, 1.333): a screen's title on a wider screen.
- **Title** (600, 1.25rem, 1.4): a screen's title on a phone.
- **Body** (400, 1rem, 1.5): forms, inputs and buttons.
- **Row** (500, 0.875rem, 1.429): the text of a dense row, with its secondary line in Note Grey.
- **Figure** (700, 1.25rem, tabular figures): a price or a count on a row's plate.
- **Figure large** (700, 1.875rem, tabular figures): the one leading figure of a screen, such as the Platform Rate, at the shared scale's largest size.

Kurdish and Arabic follow the root's Tall Script Rule. Figures are always Western digits, so Geist Mono serves all three languages.

### Named Rules

**The One Leading Plate Rule.** A screen has at most one large plate.

## Layout

On a phone, one column: a quiet top bar with the sections behind a menu button, then the screen's search or filters, then rows. On a wider screen the sections move to a side bar, and a list gains a detail pane beside it. Lists are rows, not cards: what the row is, one secondary line, and its plate at the end side.

Rows are 8 pixels apart inside, groups 16. Every control is 44 pixels, under a mouse as on a touchscreen, as the owner chose; density comes from rows and spacing, never from smaller controls.

## Elevation & Depth

Flat, with one exception. Surfaces are told apart by Rule Sand rules and Sheet grounds. A menu or a dialog over the page has a Control Edge border and a soft shadow that falls downward, `0 8px 24px` at low opacity, so that it reads as lifted off the page.

### Named Rules

**The Border First Rule.** A row, a panel or a field gets a border or a change of ground, never a shadow. Only what floats over the page casts one.

## Shapes

Small, firm corners: 6 pixels on controls and panels, about 4 on plates. Plates are always rectangles, sized to their figure.

## Do's and Don'ts

### Do:

- **Do** put every price, the Platform Rate and every count that needs action on a plate, with the date it was last set or confirmed beside it.
- **Do** give every Offer state a word and its own mark: Visible, Expiring, Expired and Hidden.
- **Do** end every row that needs action with one line of plain words saying why.
- **Do** keep the Vendor portal as dense in Kurdish and Arabic as in English, laid out right to left.

### Don't:

- **Don't** put Plate Amber anywhere but on Plate Graphite, or make it glow.
- **Don't** use cards for lists, or shadows on anything that does not float.
- **Don't** add a second large plate to a screen.
- **Don't** shrink a control below 44 pixels.
- **Don't** reach for a cold, grey corporate console, the gaming look of neon and dark glows, or a generic template's cards and gradients.
