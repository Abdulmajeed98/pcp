---
version: 1
slug: "src"
primary_target: "src"
related_targets: []
---

# The dashboard

**Scope and mode.** Every screen of the Admin console (Vendors, Catalog, Missing specifications, Part Requests, Platform Rate, Expiring Offers, Referrals) and of the Vendor portal (Offers, Part Requests, the sheet upload and its report, Referrals, contact details). Mode: Operate.

**Audience and job.** The Admin, on a phone in a Vendor's shop and at a desk, in English. A Vendor's staff, on a phone behind the counter, between serving people at it, in Kurdish, Arabic or English, keeping Offers current and confirmed. Both come back often and want the work done in as few taps as possible.

**Proof.** Real figures only: the Platform Rate as the Admin set it, each Offer's price and the day it was confirmed, counts that come from the data.

**Constraints.** PRODUCT.md, the root DESIGN.md and this app's DESIGN.md. WCAG 2.2 AA in both schemes, with a light, dark or device switch; 360 pixels wide first; controls 44 pixels on a touchscreen and 36 under a mouse; no text under 14 pixels. The Vendor portal right to left in Kurdish and Arabic.

**Chosen direction.** Framed sheet, dealt by Taste's `draw.mjs --app` and chosen by the owner on 21 October 2026 in redesign ticket 05, with the Rate Board kept as its signature on prices and the rate only (redesign ticket 04). It replaces the Rate Board look of 15 October 2026 (ADR-0011). The sheet as dealt is in `apps/dashboard/design/taste/`.

**Unresolved.** How a Vendor's sheet upload report shows its changes.

## Direction contract

THESIS: The work lies on a white sheet set into a cool stone frame, as the bazaar's walls hold its shops, and only prices and the Platform Rate hang on a money changer's graphite plates in amber, each dated. It refuses the grey, cold admin console, a template's cards and gradients, and the dashboard of decorative charts.

OWN-WORLD: A Stone Frame (#f1f0ed) L-shaped around a white sheet with a 1-pixel edge and 16-pixel corners, no shadow; Ink and Note Grey; Bazaar Teal only as the chosen tab's 2-pixel line; Plate Graphite with Plate Amber figures in Geist Mono and quiet Geist units; Action Red only where something needs doing; Geist and Noto Sans Arabic; no photograph in the chrome.

STORY: The Admin sees what needs action first and acts in a tap; a Vendor sees each Offer's price on its plate with how fresh it is, confirms them all at once, and watches the rows settle into "Confirmed today".

FIRST VIEWPORT: The Vendor portal's Offers at 360 pixels, in Kurdish: one 56-pixel stone bar with the menu, the shop's name and Add; the title; the expiry banner with Confirm all my Offers; the tabs All, Need confirming and Out of stock; the search; then two-line rows, each Part's name, one plate with its prices, and its Confirmation in words.

FORM: Framed sheet, style `framed-sheet` of Taste's kind `commerce`, seed 616443693, chosen from four dealt options (two from `commerce`, two from `creator`).

FINISH: unreviewed and undocumented is unfinished; each screen ends with Taste's inspector at 1440, 768 and 360, the owner's look in the built-in browser, and DESIGN.md corrected where building it taught something.
