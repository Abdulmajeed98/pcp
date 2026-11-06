# The chosen direction: The page is the object, and what the Shopper app holds against it

The owner chose this direction on 6 November 2026, in browse ticket 07, in their words: "Out of all deals the first deal's second (02) directions was the most elegant out of them, but it needs some motion in it. so we will go with that direction but tweak it to be more creative and add motion as well." It is the first deal's option 2, dealt by Taste's `draw.mjs` with its run for public pages. Its sheet is beside this file: `direction.json` (what Taste's scripts read) and `sheet.md` (the same sheet, printed by `draw.mjs --show`).

## The sheet as kept

- Direction `page-is-the-object`, sector `ecommerce`, seed 2092360077, dealt on 4 November 2026 with `--direction page-is-the-object --sections list,showcase,intro,contact,footer`. Hero: a card over a dim room. Type: Big Shoulders over Public Sans. Palette: bone, green and chocolate. Sections: the printed menu sheet, a square plate with spare text, a title with a note and a facts row, the clip-out coupon, an invitation over a cropped name. Motion: the pinned story.
- Its brief named a city. Dealt again on 6 November with the same seed and the brief that names no city, Taste kept the direction, hero, sections and motion but dealt other type (Anton over Work Sans) and another palette (moss and sand). So the first deal's sheet is kept as dealt, with only its brief (`input.brief`) replaced by the brief that names no city, and `sheet.md` is printed from it. Against the first deal's printed sheet two lines differ: the brief, and the searches its imagery note suggests, which Taste reads from the brief ("Kurdish" now, the old brief's city before).

## What the sheet breaks, and how the Shopper app keeps the rule

| The sheet                                                  | The hard rule                                          | As rendered                                                                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Big Shoulders set in capitals                              | The No Capitals Rule                                   | Sentence case in every language.                                                                                                                               |
| A small step of 13 pixels, a legal line of 12              | No text under 14 pixels, 15 in Kurdish and Arabic      | 14 pixels at the least, 15 in Arabic script, on English pages too.                                                                                             |
| A light palette only                                       | WCAG 2.2 AA in both schemes, with a switch             | A dark scheme from its own colours: a chocolate ground (`#17110d`), bone ink (`#efe7da`) and a lighter green (`#93c47d`), switched beside the language switch. |
| Big Shoulders and Public Sans draw no Arabic script        | Self-hosted fonts that draw all of Sorani (ADR-0006)   | Kurdish in Noto Kufi Arabic; both Latin faces to be self-hosted before they ship.                                                                              |
| A coupon that is a form                                    | The platform takes no orders                           | On a Vendor page the coupon holds the Vendor's contact links.                                                                                                  |
| "Mountain" photographs, and searches for Kurdish postcards | No place named, the pictures stand for PCs (the owner) | Photographs of PC hardware under reusable licences, credited; the Parts keep ticket 06's made-up photos and drawings of hardware.                              |

## Tweaks and motion, for the owner to keep or drop

The renderings in browse ticket 07 add seven tweaks and seven motions to the sheet, numbered there so that the owner can keep or drop each one; what is kept is recorded there, and the motion the owner accepts in ticket 08.

- T1, the price slip: a Part's figures printed as a till slip with a torn foot. T2, tear-off tabs: the Categories sheet and the Vendor's coupon end in tabs along a perforation, each a link. T3, the box label: a Part's specifications as the label on its box, with its part number as a Code 39 barcode. T4, the stamp: the Lowest Price stamped in the green ink. T5, dot leaders from each name to its price. T6, printer's marks: crop marks and a bar of the three inks around each sheet. T7, printed drawings of hardware in the text's ink.
- M1, a sheet prints out as it arrives. M2, prices settle into their column. M3, the stamp lands. M4, the slip feeds line by line. M5, a tear-off tab gives under the pointer. M6, the barcode is scanned once. M7, the pinned story, the sheet's own move: the slip holds its place beside a Part's Offers.

## For the inspector

- Taste's `inspect.mjs` reads a sheet from `.taste-skill/direction.json` in the folder it runs from, or from the folder above its `--out`. To inspect Shopper pages with this sheet, copy it there at the repository root before `pnpm shopper:inspect` (`mkdir -p .taste-skill && cp apps/shopper/design/taste/direction.json .taste-skill/`), the dashboard's sheet going back there before the dashboard is inspected; or pass an `--out` folder inside `apps/shopper/design/taste/`.
- Its `allow` list stays empty until the owner says whether Shopper pages are inspected with Taste's rules for public pages or with `--app` (browse ticket 07).
