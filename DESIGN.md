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

<!-- Written with ticket 10 of the catalog module, on 15 October 2026, before any component existed. Each app's components are recorded in its own DESIGN.md: the dashboard's from 16 October 2026, and the Shopper app's from 6 November 2026, when browse ticket 08 wrote its new look. -->

# Design System: the platform's shared foundations

## Overview

**Creative North Star: "Two looks, one floor"**

The platform has two looks, each in its own app's folder: [the printed price list](apps/shopper/DESIGN.md), Taste's The page is the object, for the Shopper app, and [Framed sheet](apps/dashboard/DESIGN.md) for the dashboard, which holds the Admin console and the Vendor portal (ADR-0007, ADR-0011, ADR-0013). This file is the floor under both. Everything here comes from the accessibility standard, WCAG 2.2 level AA, from the three languages, and from the phones the platform is read on, not from either look. A page is built to its own app's DESIGN.md and to this one, and where the two seem to disagree, this one holds.

The research behind every rule is in [docs/research/design-system.md](docs/research/design-system.md).

**Key Characteristics:**

- WCAG 2.2 level AA on every screen of all three surfaces.
- Designed at 360 pixels wide first, and never scrolling sideways at 320.
- Kurdish and Arabic right to left, laid out with logical properties only.
- A light and a dark scheme, following the device unless the user chooses one.
- Controls at least 44 by 44 pixels on a touchscreen, and at least 36 pixels under a mouse.

## Typography

Each look chooses its own faces. The sizes are shared, in `rem`, so that the browser's text size setting scales every one of them (WCAG 1.4.4). A look may set two sizes of its own, in `rem` too: a screen's title, and the text in its buttons. It does so within the hard rules: no text under 14 pixels, and one pixel more in Kurdish and Arabic by the Tall Script Rule, so a button's text at 14 is 15 there. The owner allowed this on 21 October 2026, when the dashboard took a 22-pixel title and 14-pixel button text from its Taste sheet. A look may also set a board figure, in `rem` and within the same hard rules: a single leading figure that is a screen's whole answer, one on the screen at most, beside its title and button sizes. The owner allowed this on 3 November 2026 for the dashboard's changer's board, the Platform Rate's figure on its split-flap tiles, 7rem (112 pixels) and 2.625rem (42 pixels) on a phone (pricing ticket 02).

- **Heading large** (1.875rem, 30 pixels): one per page at most.
- **Heading** (1.5rem): a page's title on a wider screen.
- **Title** (1.25rem): a page's title on a phone, and a section's.
- **Body large** (1.125rem): a Part's name where it leads.
- **Body** (1rem, 16 pixels): reading text, the text in every input, and the text in every button unless the look sets its own. An input's text is never under 16 pixels, because a phone's browser zooms into a focused input whose text is smaller.
- **Small** (0.875rem, 14 pixels): secondary lines, such as how many days ago an Offer was confirmed.

**The Fourteen Pixel Rule.** No text is smaller than 14 pixels. The theme takes Tailwind's 12-pixel `text-xs` away.

**The Tall Script Rule.** Kurdish and Arabic are written in Arabic script, which needs more room than Latin script. On a Kurdish or an Arabic page, the small, body and body-large sizes are one pixel larger (15, 17 and 19 pixels), and every line is looser. The theme does this from the page's language; nothing on a page sets it by hand.

**The No Capitals Rule.** Arabic script has neither capitals nor letter spacing, so neither is used for emphasis or for labels, in any language. Emphasis is weight or size.

## Layout

- **Width.** Every screen is designed at 360 pixels wide first and adapts upward. At 320 pixels it still never scrolls sideways (WCAG 1.4.10). A word too long for the screen is broken.
- **Spacing.** Tailwind's 4-pixel steps, keeping to 4, 8, 12, 16, 24, 32 and 48 pixels for the rhythm of a page. More space above a heading than below it.
- **Controls.** Anything tapped on a touchscreen is at least 44 by 44 pixels (`size-control`, `h-control`, `min-h-control`), which meets WCAG 2.2's level AAA target size and Apple's default. Under a mouse, a fine pointer, an app may make its controls smaller, never under 36 pixels, still well above level AA's 24. On a phone, a screen that feels heavy with controls takes fewer rows of them, not smaller ones. The owner chose this on 21 October 2026, in the redesign's review of the hard rules.
- **Scheme.** Each app follows the device's light or dark scheme until the user chooses one with a switch beside the language switch, light, dark or the device's, remembered in the browser as the Vendor portal's language is. The owner added the switch on 21 October 2026.
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
- **Don't** set text under 14 pixels, or a control under 44 by 44 pixels on a touchscreen or under 36 pixels under a mouse.
- **Don't** use a font that cannot draw every letter of Sorani: ڕ, ڵ, ێ, ۆ, ە and ھ among them. ADR-0006 and the research list which can.
- **Don't** use physical properties (`ml-`, `pr-`, `left-`, `text-left`) in a frontend or in `ui`; the lint refuses them.
