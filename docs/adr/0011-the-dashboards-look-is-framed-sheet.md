# The dashboard's look is Framed sheet, with the Rate Board on prices and the rate

The dashboard's look, for the Admin console and the Vendor portal, is Taste's Framed sheet: one cool stone frame, L-shaped, holds the sidebar and the top bar, and the work lies on a white sheet inset into it, with a hairline edge, 16-pixel corners and no shadow, in tables with underline tabs and a filter bar on a wide screen and two-line rows on a phone. The Rate Board stays as its signature, but only on prices and the Platform Rate: one graphite plate to an Offer, its figures in amber with the units a quiet suffix, dated, muted when out of stock, and one larger leading plate on a screen whose answer is one figure. It has a light and a dark scheme with a switch, and a section on motion of its own, led by Emil Kowalski's skills. [apps/dashboard/DESIGN.md](../../apps/dashboard/DESIGN.md) records it; the sheet as dealt is in [apps/dashboard/design/taste/](../../apps/dashboard/design/taste/).

The owner chose it by eye on 21 October 2026, in the redesign (`.scratch/redesign`, tickets 02 to 06), because the Rate Board look of 15 October read as cold, linear, rigid and made by an AI: a warm page in the manner of Linear, flat surfaces told apart by rules, stock Geist with no face of its own, no motion, and twenty plates on thirteen Offers, counts among them. Ticket 02's critique by Taste, Emil's skills and Impeccable found the board's idea sound and its execution at fault; the owner kept the idea and changed its execution (ticket 04), adjusted two hard rules (ticket 03), and chose this direction from four that Taste's `draw.mjs --app` dealt (ticket 05).

The fonts are unchanged (ADR-0006). The components are still the dashboard's own shadcn/ui set on Base UI, created in the Mira style; their look follows the new DESIGN.md.

## Considered Options

- **Keep the Rate Board look, with its execution fixed.** The plates only on prices, quieter units, the warm page cooled; everything else as before. It would have kept the look the owner found cold and linear, with only the plates changed.
- **Framed sheet** (`framed-sheet`, of Taste's kind `commerce`, seed 616443693). Chosen.
- **Achromatic ledger** (`achromatic-ledger`, `commerce`): an open plane with no frame, black, white and greys, one blue on the plates' figures.
- **Accent ladder** (`accent-ladder`, `creator`): a ruled T-frame, one raspberry at full strength on small marks and its pale tints on areas.
- **True-black flat** (`true-black-flat`, `creator`): dark only by its sheet, elevation by lightness alone, every control a pill, a lime on the plates.

Each was rendered as the portal's Offers in Kurdish and English and the Admin console's Catalog, at 360 and 1440 pixels, in both schemes, filled with a made-up shop's Offers, and shown to the owner side by side in the built-in browser.

## Consequences

- Every screen of the dashboard is rebuilt to the new DESIGN.md, from the foundations on the Catalog (redesign ticket 07) to the last screens (ticket 13), each checked by Taste's inspector at 1440, 768 and 360 pixels and shown to the owner.
- The dashboard's theme in `@pcp/ui/themes/dashboard.css` is rewritten with the new tokens of both schemes, a frame colour, a rule colour, the plate's unit and muted colours, and the motion's three curves; the warning colour, never used, is dropped.
- Counts leave the plates. A list's count, the Catalog's, the Vendors' and the Offers screen's, is said in words.
- An Offer's two prices share one plate, replacing the owner's choice of 20 October 2026 of a plate for each price. The Vendor portal's sections move from two links under its top bar into the sidebar, and on a phone into the menu sheet, replacing the owner's choice of the same day.
- Controls are 36 pixels under a mouse and 44 on a touchscreen, replacing the dashboard's own rule of 44 under a mouse too.
- Every movement is a CSS transition on transform and opacity with a reduced-motion variant; no animation library is added.
- A screen's title is 22 pixels and a button's text 14 (15 in Kurdish and Arabic), from Taste's sheet, and the root DESIGN.md now lets a look set these two sizes for itself within the hard rules; inputs stay at 16 pixels, so that a phone does not zoom into them.
- The pictures of Erbil that ticket 05's renderings put in the sidebar are left out: no photograph is part of the dashboard's chrome.
- Taste's sheet breaks four hard rules as dealt (32-pixel controls, a 12-pixel size, control edges under 3:1, and a light scheme only); the dashboard holds each rule, as `design/taste/held-rules.md` records, and Taste's own inspector checks the rest.
