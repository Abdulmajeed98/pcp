---
version: 1
slug: "src"
primary_target: "src"
related_targets: []
---

# The Shopper app

**Scope and mode.** Every Shopper page: the home page, a Category's Parts with its search and filters, a Part and its Offers, a Vendor, the not-found page, the frame with its three switches and the footer's credit every page carries; later, the builder and its picker, the Build page and shared Builds. Mode: Operate, comparing prices, with the home page's first screen as its one moment to persuade.

**Audience and job.** A person building a PC, or buying a Part for one, on a low to mid-range Android phone over weak mobile data, in Kurdish, Arabic or English, in dinars or dollars. One who builds for the first time needs to understand what a Part is and which Vendor has it at what price; one who has built before wants the quickest route to who has a Part and for how much. Where they pull apart, the page explains.

**Proof.** Only real Offers from real Vendors, each with the day it was confirmed; every Converted Price marked "≈"; Offers ordered by stock and price alone, with no Vendor paying for its place. No invented prices, Vendors, counts or reviews.

**Constraints.** PRODUCT.md, the root DESIGN.md and this app's DESIGN.md. WCAG 2.2 AA in both schemes, with a light, dark or device switch; 360 pixels wide first; controls 44 pixels on a touchscreen and 36 under a mouse; no text under 14 pixels, 15 in Kurdish and Arabic; right to left in Kurdish and Arabic; self-hosted fonts that draw all of Sorani. Nothing in the design is particular to one city, and its pictures stand for PCs (the owner, 5 November 2026).

**Chosen direction.** The printed price list, Taste's The page is the object (sector `ecommerce`, seed 2092360077), dealt by `draw.mjs` with its run for public pages and chosen by the owner by eye on 6 November 2026 in browse ticket 07, from three deals of eight directions, with its seven tweaks and seven motions kept. It replaces Fit Diagram of 15 October 2026 (ADR-0013). The sheet as dealt is in `apps/shopper/design/taste/`.

**Unresolved.** How the home page reads its one Part and its facts, which no public endpoint answers yet (browse ticket 09); the bands of the Long Name Rule, checked with the catalog's longest names (ticket 12); the printed drawings of the Categories that have none yet.

## Direction contract

THESIS: The Shopper app is the price list a computer shop hands over the counter, printed for every Vendor at once: each page a piece of stationery on a table, every name at the start of its line and every price at the end, so that a Shopper compares prices the way they read a printed list. It refuses the category's dark gaming look of neon and glows, a marketplace of cards and badges, and the template's gradients.

OWN-WORLD: Bone Ground, Sheet Paper and Chocolate Ink, with Print Green as the one second ink, and a dark scheme of Bone Ink on chocolate; Big Shoulders in sentence case over Public Sans, with Noto Kufi Arabic for Kurdish and Arabic; square corners and cut edges (scallops, a torn foot, notches, perforations) and no shadow; dotted leaders from name to price; the stamp, the slip, tear-off tabs, the box label and its barcode; dim photographs of PC hardware under the paper.

STORY: The Shopper chooses a Category from the printed sheet of eight, narrows its list with the swing tag's filters, finds the Part whose Lowest Price they want, compares its Vendors on the sheet of Offers beside the price slip, and leaves from a Vendor's coupon for its phone, its WhatsApp chat, its Instagram or its map.

FIRST VIEWPORT: The home page at 360 pixels: a dim photograph of a red-lit motherboard filling the screen; on it one card of Sheet Paper holding the name slot and the three switches in one row, the title "Parts Prices Vendors" in Big Shoulders over a perforation, the facts and one sentence, and Choose a Category in Print Green.

FORM: The page is the object (`page-is-the-object`), first deal's option 2, kept over the first deal's two others, the second deal's two and the third deal's three; the motion is paper and print, led by Emil's skills, with the pinned story as the sheet's own move.

FINISH: unreviewed and undocumented is unfinished; each page ends with Taste's inspector by its rules for public pages at 1440, 1280, 1024, 768 and 390 pixels with the sheet's four allowances, sideways scroll measured at 360, the owner's look in the built-in browser, and DESIGN.md corrected where building it taught something.
