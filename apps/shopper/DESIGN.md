---
name: The Shopper app, Fit Diagram
description: How Parts fit, drawn the way a motherboard manual does.
colors:
  manual-paper: "oklch(1 0 0)"
  print-black: "oklch(0.23 0.004 106.7)"
  manual-blue: "oklch(0.474 0.169 257.2)"
  manual-blue-wash: "oklch(0.946 0.017 256.3)"
  problem-red: "oklch(0.53 0.207 22.3)"
  warning-amber: "oklch(0.574 0.139 57)"
  fits-green: "oklch(0.519 0.122 152.9)"
  plate-grey: "oklch(0.954 0.005 258.3)"
  caption-grey: "oklch(0.47 0.016 262.3)"
  rule-grey: "oklch(0.884 0.008 260.7)"
  control-edge: "oklch(0.608 0.015 258.4)"
  night-paper: "oklch(0.186 0.004 264.5)"
  night-ink: "oklch(0.943 0.003 106.5)"
  night-blue: "oklch(0.729 0.12 257.4)"
  night-red: "oklch(0.712 0.181 22.8)"
typography:
  heading-large:
    fontFamily: "Archivo Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  heading:
    fontFamily: "Archivo Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.333
  title:
    fontFamily: "Archivo Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Archivo Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  price:
    fontFamily: "Archivo Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    fontFeature: "tnum"
  callout:
    fontFamily: "Archivo Variable, Noto Kufi Arabic Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    fontVariation: "wdth 80"
rounded:
  square: "0px"
  callout: "9999px"
spacing:
  control: "44px"
  row: "12px"
  group: "24px"
---

<!-- Written with ticket 10 of the catalog module, on 15 October 2026, before any Shopper page exists. Re-run Impeccable's document once the first pages are built, to record their components. -->

# Design System: the Shopper app, Fit Diagram

## Overview

**Creative North Star: "The Fit Diagram"**

Every builder has unfolded a motherboard manual: a fine line drawing of the board, each part numbered, each number explained in the margin. The Shopper app draws a Build the same way. The Parts are line drawings joined by dashed fit lines, and every Compatibility Rule is a numbered callout on the drawing that opens into plain words. What fits is drawn in manual blue, what does not in red, and what could not be checked is drawn as an empty callout that says so. The platform's promise, to say only what it knows, becomes the drawing's own grammar.

Around the drawing the app is a calm, exact working product: manual paper, print black, square corners and ruled lines, set in Archivo and Noto Kufi Arabic. The navigation, the filters, the lists and the buttons are the ordinary ones of the web. The world lends only its palette, its type, its density and the one move above.

The shared floor is in [the root DESIGN.md](../../DESIGN.md), and the reasons in ADR-0006 and ADR-0007.

**Key Characteristics:**

- Manual paper and print black, with manual blue for fit lines, callouts and the one primary action.
- Square corners; the callout's circle is the only round shape.
- Lines and rules carry depth, never shadows.
- Prices and specifications in tabular Latin figures, in every language.
- The numbered callout is the signature, and it always ends in words.

## Colors

A manual's palette: paper and black print, one blue for what the drawing explains, and red kept for what does not fit.

### Primary

- **Manual Blue** (oklch(0.474 0.169 257.2)): the fit lines and callouts of the diagram, links, the focus ring, and the one primary action on a screen. In the dark scheme it is **Night Blue** (oklch(0.729 0.12 257.4)).
- **Manual Blue Wash** (oklch(0.946 0.017 256.3)): the ground of a selected row and of the text selection, under dark blue text.

### States

- **Problem Red** (oklch(0.53 0.207 22.3)): a Compatibility Problem's callout and words, and nothing else. **Night Red** in the dark scheme.
- **Warning Amber** (oklch(0.574 0.139 57)): a Compatibility Warning.
- **Fits Green** (oklch(0.519 0.122 152.9)): in stock, and a rule that passed.

### Neutral

- **Manual Paper** (oklch(1 0 0)) and **Print Black** (oklch(0.23 0.004 106.7)): the page and its text and drawings. **Night Paper** and **Night Ink** in the dark scheme.
- **Plate Grey** (oklch(0.954 0.005 258.3)): a quiet surface, such as a secondary button.
- **Caption Grey** (oklch(0.47 0.016 262.3)): secondary lines, at 4.5:1 or more on every surface.
- **Rule Grey** (oklch(0.884 0.008 260.7)): the rules between rows, which identify nothing.
- **Control Edge** (oklch(0.608 0.015 258.4)): the border of an input, at 3:1 against the page.

### Named Rules

**The Red Means a Problem Rule.** Problem Red marks a Compatibility Problem and nothing else: not a sale, not an error banner's decoration, not a logo.

**The One Blue Action Rule.** A screen has at most one filled Manual Blue button. Every other action is outlined or a link.

## Typography

**Body Font:** Archivo, with its width axis (with Noto Kufi Arabic for Kurdish and Arabic)
**Arabic-script Font:** Noto Kufi Arabic
**Label Font:** Archivo narrowed to 80% width, for callouts

**Character:** an engineered Latin grotesque beside a geometric Kufi, both drawn for technical clarity, the voice of a well-made manual.

### Hierarchy

- **Heading large** (700, 1.875rem, 1.2): one per page at most, such as a Build's total.
- **Heading** (700, 1.5rem, 1.333): a page's title on a wider screen.
- **Title** (700, 1.25rem, 1.4): a page's title on a phone, and a Part's name where it leads.
- **Body** (400, 1rem, 1.5): reading text, inputs and buttons, at most 70 characters a line.
- **Price** (700, 1rem, tabular figures): every price, aligned on its last digit.
- **Callout** (700, 0.875rem, narrowed to 80% width): the text of a callout and of a specification's label.

Kurdish and Arabic follow the root's Tall Script Rule. Part names, prices and specifications stay in Archivo in every language.

### Named Rules

**The Narrow Callout Rule.** Archivo's width axis narrows only callouts and specification labels, never reading text.

## Layout

One main column, a Part or a Build at a time, with the diagram at the head of a Build and the price list below it. A Category's Parts are rows, not cards: the Part's drawing or Category icon, its name, its lowest price, and how many Vendors have it. On a wider screen the column grows to a readable width, and a Part's Offers sit beside its specifications.

Groups are separated by 24 pixels and rules; rows inside a group by 12 pixels. The fit diagram is drawn on the same 4-pixel grid as the page.

## Elevation & Depth

Flat. A manual has no shadows, and neither does this app: depth is a rule, a border or a change of ground. A menu or a dialog sits above the page with a Print Black border at full strength, not a shadow.

### Named Rules

**The Ruled Not Raised Rule.** Surfaces are told apart by rules and borders. No `box-shadow` on anything.

## Shapes

Square corners everywhere (0 pixels): buttons, inputs, menus and photos. The numbered callout is the one circle. Line drawings use 1.5-pixel strokes in Print Black, and fit lines are dashed 4 on 3 in Manual Blue. A drawing is geometry, built from the Part's Category and specifications, never a picture.

## Do's and Don'ts

### Do:

- **Do** end every callout in words that name the Parts involved: "The CPU fits the motherboard: both use socket AM5."
- **Do** draw an unchecked rule as an empty, dashed callout that says "not checked" and why, never as a pass.
- **Do** show a Converted Price with its "≈" in Caption Grey, and a Quoted Price in Print Black.
- **Do** keep every control 44 pixels high, square-cornered, with a Control Edge border.

### Don't:

- **Don't** use Problem Red for anything but a Compatibility Problem.
- **Don't** add shadows, gradients, glass or rounded cards.
- **Don't** set Kurdish or Arabic in Archivo's narrow widths, or in capitals and letter spacing.
- **Don't** let the diagram replace the list: every rule it draws is also listed in words below it.
- **Don't** reach for the gaming look of neon, dark glows and angled panels, or a generic template's cards and gradients.
