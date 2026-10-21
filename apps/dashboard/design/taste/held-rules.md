# The chosen direction: Framed sheet, and what the dashboard holds against it

The owner chose this direction on 21 October 2026 ("1, Framed sheet"), from four that Taste's `draw.mjs --app` dealt in redesign ticket 05. Its sheet, as dealt, is beside this file: `direction.json` (what Taste's scripts read) and `sheet.md` (the same sheet, printed). This file records what the renderings the owner chose from did with it, for ticket 06 (the new DESIGN.md) and ticket 07 (the foundations).

## The sheet as dealt

- Style `framed-sheet`, kind `commerce`, seed 616443693, light, dealt with `--keep type` (the fonts stay, ADR-0006).
- Its move: one tinted L-frame holds the sidebar (228 pixels) and the 48-pixel top bar with no rule between them; the work sits on a white sheet inset 8 pixels from the window's end and bottom edges, with a 1-pixel edge, 16-pixel corners and no shadow. The active tab is a 2-pixel underline; everything else in the chrome is grey. Colour budget under 3%.
- Its list pattern: a table with tabs and a filter bar.

## What the dealt sheet breaks, and how the dashboard keeps the rule

| The sheet                             | The hard rule (ticket 03)                                                                   | As rendered                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `--control-height: 32px`              | At least 36 pixels under a mouse, 44 on a touchscreen                                       | 36 under a fine pointer from 64rem, 44 otherwise                                          |
| `--fs-small: 12px`                    | No text under 14 pixels (15 in Kurdish and Arabic)                                          | 14, and 15 in Kurdish; hierarchy from the 22-pixel title, weight and colour               |
| `--control: #cdced1` (1.6:1 on white) | WCAG 2.2 AA: a control's border at 3:1 where it alone shows the control                     | `#8c8b87`                                                                                 |
| A light scheme only                   | Both schemes, following the device, with a light, dark or device switch beside the language | Dark from Taste's shared dark defaults (`references/app-screens.md` §9.5), the stone kept |

Everything else the hard rules ask was kept as drawn: right to left with logical properties only (the sheet's inset falls on the end side in Kurdish), the Tall Script sizes, no capitals, Western digits, Geist, Noto Sans Arabic and Geist Mono self-hosted, and 360 pixels first, where the frame disappears and one 56-pixel bar holds the menu, the screen's scope and one action.

## Choices made inside the sheet while rendering

- **Its face**, from the sheet's list: the frame tinted to a cool, low-chroma stone, `#f1f0ed`, from the brick of Erbil's Qaysari Bazaar, under the inspector's cream check; the sheet stays white.
- **The signature element** is the Rate Board, kept as ticket 04 decided: one graphite plate per Offer with figures in an amber taken from the sheet's own `--chart-3`, plates only on prices, the unit a smaller grey Geist suffix, the comma in Geist so it takes no mono cell, the Confirmation beside the plate, an out-of-stock plate pale with grey figures, and in the dark a plate darker than the page with a lit edge. No leading plate on the Offers or the Catalog; the large plate is for the Platform Rate.
- **The teal** (`--accent`, `#1b6c80`) is only the chosen tab's 2-pixel underline.

## The tokens as rendered

Light: frame `#f1f0ed`, sheet `#ffffff`, raised `#f5f4f2`, active `#e9e8e5`, border `#e6e5e2`, rule `#efeeec`, control `#8c8b87`, text `#131416`, muted `#5d5f60`, accent `#1b6c80`, positive `#1e7b4f`, negative `#c4242a`, primary `#131416` on `#ffffff`; plate `#26292b`, figure `#ecb64e`, unit `#a7aaac`, muted plate `#e9e8e5` with `#55585a`.

Dark: frame `#0d0d0d`, sheet `#161616`, raised `#1d1d1d`, active `#262626`, border `#2a2a2a`, rule `#222222`, control `#6f6f6f`, text `#f2f2f2`, muted `#b4b4b4`, accent `#62b6ca`, positive `#3fc07a`, negative `#e5566f`, primary `#f2f2f2` on `#111111`; plate `#030303` with a `#3d3d3d` edge, figure `#ecb64e`, unit `#9a9a9a`, muted plate `#232323` with `#9a9a9a`.

Radii: cards 8, controls 6, the sheet 16, plates 4. Title 22 pixels, gap and padding 24.

## The inspector's allowances

None. The renderings passed `inspect.mjs --app` at 1440 and 360 with 0 FAIL and 0 WARN on the portal's Offers in Kurdish and English and on the Catalog, in both schemes, with no `--allow`.
