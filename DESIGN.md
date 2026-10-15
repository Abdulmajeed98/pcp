---
name: The platform's shared foundations
description: What every screen keeps, whichever app's look it wears.
typography:
  heading-large:
    fontSize: "1.875rem"
    lineHeight: 1.2
  heading:
    fontSize: "1.5rem"
    lineHeight: 1.333
  title:
    fontSize: "1.25rem"
    lineHeight: 1.4
  body-large:
    fontSize: "1.125rem"
    lineHeight: 1.556
  body:
    fontSize: "1rem"
    lineHeight: 1.5
  small:
    fontSize: "0.875rem"
    lineHeight: 1.429
spacing:
  hair: "4px"
  tight: "8px"
  snug: "12px"
  base: "16px"
  loose: "24px"
  section: "32px"
  page: "48px"
  control: "44px"
---

<!-- Written with ticket 10 of the catalog module, on 15 October 2026, before any component exists. Re-run Impeccable's document once the first screens are built, to record their components. -->

# Design System: the platform's shared foundations

## Overview

**Creative North Star: "Two looks, one floor"**

The platform has two looks, each in its own app's folder: [Fit Diagram](apps/shopper/DESIGN.md) for the Shopper app, and [Rate Board](apps/dashboard/DESIGN.md) for the dashboard, which holds the Admin console and the Vendor portal (ADR-0007). This file is the floor under both. Everything here comes from the accessibility standard, WCAG 2.2 level AA, from the three languages, and from the phones the platform is read on, not from either look. A page is built to its own app's DESIGN.md and to this one, and where the two seem to disagree, this one holds.

The research behind every rule is in [docs/research/design-system.md](docs/research/design-system.md).

**Key Characteristics:**

- WCAG 2.2 level AA on every screen of all three surfaces.
- Designed at 360 pixels wide first, and never scrolling sideways at 320.
- Kurdish and Arabic right to left, laid out with logical properties only.
- A light and a dark scheme, following the device.
- Controls at least 44 by 44 pixels on a touchscreen.

## Typography

Each look chooses its own faces. The sizes are shared, in `rem`, so that the browser's text size setting scales every one of them (WCAG 1.4.4).

- **Heading large** (1.875rem, 30 pixels): one per page at most.
- **Heading** (1.5rem): a page's title on a wider screen.
- **Title** (1.25rem): a page's title on a phone, and a section's.
- **Body large** (1.125rem): a Part's name where it leads.
- **Body** (1rem, 16 pixels): reading text, and the text in every input and button.
- **Small** (0.875rem, 14 pixels): secondary lines, such as how many days ago an Offer was confirmed.

**The Fourteen Pixel Rule.** No text is smaller than 14 pixels. The theme takes Tailwind's 12-pixel `text-xs` away.

**The Tall Script Rule.** Kurdish and Arabic are written in Arabic script, which needs more room than Latin script. On a Kurdish or an Arabic page, the small, body and body-large sizes are one pixel larger (15, 17 and 19 pixels), and every line is looser. The theme does this from the page's language; nothing on a page sets it by hand.

**The No Capitals Rule.** Arabic script has neither capitals nor letter spacing, so neither is used for emphasis or for labels, in any language. Emphasis is weight or size.

## Layout

- **Width.** Every screen is designed at 360 pixels wide first and adapts upward. At 320 pixels it still never scrolls sideways (WCAG 1.4.10). A word too long for the screen is broken.
- **Spacing.** Tailwind's 4-pixel steps, keeping to 4, 8, 12, 16, 24, 32 and 48 pixels for the rhythm of a page. More space above a heading than below it.
- **Controls.** Anything tapped is at least 44 by 44 pixels (`size-control`, `h-control`, `min-h-control`), which meets WCAG 2.2's level AAA target size and Apple's default. Inputs and buttons are 44 pixels high.
- **Direction.** Layout is written with logical properties only (`ms-`, `pe-`, `start-`, `text-start`), so that a Kurdish or an Arabic page mirrors by itself. The language and the direction are set on the document by the server.

## Do's and Don'ts

### Do:

- **Do** meet 4.5:1 for text and 3:1 for large text, for a control's border where the border alone shows the control, for a focus ring, and for a mark that shows a state. Each app's tokens already do, in both schemes; a new colour is measured before it is used. A control whose border is the only sign of where it is draws that border in `input`; `border` is a light rule for lines that only divide.
- **Do** say every state in words or a mark as well as its colour: in stock, a Compatibility Problem, a Compatibility Warning, an unchecked rule, a Converted Price with its "≈", an Offer near expiry (WCAG 1.4.1).
- **Do** show the keyboard focus on every control, at full strength, never hidden behind a sticky bar (WCAG 2.4.7 and 2.4.11).
- **Do** mirror in a right-to-left page: the layout; back, next and previous; the chevrons of breadcrumbs and of rows that open; progress and sliders; the order of a table's columns; any sequence whose order means something.
- **Do** keep a number with its unit or currency, a Part's name, a part number and a specification as one left-to-right unit with `AlwaysEnglish`, and text a Vendor wrote with `AsWritten`. A Converted Price's "≈" is inside that unit.
- **Do** align a paragraph of three or more lines that a Vendor wrote with its own language, and every item of a list the same way, so that English Part names in a Kurdish list are aligned right.
- **Do** check every screen in light and in dark, in all three languages for the Shopper pages and the Vendor portal, at 360 pixels.

### Don't:

- **Don't** mirror numbers, prices or part numbers, the Category icons, a Part's photo, the checkmark or any other universal mark, or a control that means an actual side of the screen.
- **Don't** use Arabic-Indic digits: prices and specifications are in Western digits in every language.
- **Don't** set text under 14 pixels, or a control under 44 by 44 pixels on a touchscreen.
- **Don't** use a font that cannot draw every letter of Sorani: ڕ, ڵ, ێ, ۆ, ە and ھ among them. ADR-0006 and the research list which can.
- **Don't** use physical properties (`ml-`, `pr-`, `left-`, `text-left`) in a frontend or in `ui`; the lint refuses them.
