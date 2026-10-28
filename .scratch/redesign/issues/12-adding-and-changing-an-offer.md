# 12: Adding and changing an Offer

**Spec:** [the redesign spec](../spec.md)

**What to build:** The Vendor's way from a Part to an Offer is rebuilt to the new DESIGN.md: the portal's catalog search with the note after an Offer is added, the Offer form, an Offer's own screen with the same form filled in, and removing an Offer through its dialog. It is laid out for a phone first, in the three languages and both directions.

**Blocked by:** 11

**Status:** ready-for-agent

- [x] The catalog search, the Offer form, an Offer's screen, the removal's dialog and an Offer that no longer exists follow the new DESIGN.md and move as its Motion section says, mirrored in right-to-left.
- [x] Each passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command, in Kurdish and in English.
- [ ] Emil's `break-ui` and `mobile-native` are run on the search and the form: a long Part name, nothing found, every field refused; typing a price with a thumb at 360 pixels. What broke is fixed.
- [x] Each passes `checkInEveryLanguageOfTheVendorPortal`. `expectAccessible` passes on each screen in the accessibility tests' list, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [x] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [ ] The screens are shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building them taught something.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 22 October 2026: stopped at the usage limit, before any code

The first run read the brief, the spec, DESIGN.md, tickets 03 to 07 and 11 and the screens' code, and stopped at the usage limit before writing any code. It was resumed on 28 October 2026, once tickets 08 and 09 had brought `OpeningSpace`, `BusyLabel` and `AlertDialogRefusal` to `redesign/integration` (`4d03eb4`).

### 28 October 2026: what was built

On branch `redesign/12-adding-and-changing-an-offer`, from `4d03eb4`, in six commits, each gated on `pnpm check`'s exit status (the first four again one by one in a fresh clone, `pnpm check --skip-nx-cache` with Docker and Playwright's browsers out of reach, all four passing), the API's also on `pnpm integration:check` (13 files, 374 tests):

1. `feat`: **the API reads one Offer with its expiry**, as its list answers it: `GET /v1/vendors/{vendorId}/offers/{offerId}` now answers `ListedOfferResponse`, with `daysSinceConfirmation`, `daysLeft`, `expired` and `aboutToExpire` at the moment it is read, by the API's clock (`ReadOfferQuery` gives that moment). An Offer's screen leads with its Confirmation, "Confirmed 8 days ago", and no frontend counts days itself (the offers module's conventions). Nothing is stored differently. The inspector's made-up shop reads one Offer the same way. For the owner below (choice 1).
2. `fix`: **the shared switch's thumb travels under reduced motion**, in 100 ms on the out curve within its track, the track's colour with it, where it jumped (DESIGN.md's reduced motion, the No Snap Rule); 150 ms without.
3. `feat`: **the catalog search and the Offer form** (below).
4. `feat`: **an Offer's own screen** (below).
5. `feat(inspector)`: the made-up shop answers a catalog search for its Vendor (the API's own search without the Vendor, which the API does not know, its Offers marked) and an Offer it does not hold as 404 `OFFER_NOT_FOUND`, so that Taste's inspector can see the catalog search and an Offer gone.
6. `fix`: break-ui's two fixes (below).

**The catalog search**, as DESIGN.md's Vendor portal and Rows say: a back link, the title and its sentence; the note after an Offer is added, an 8-pixel Sheet card with a Confirmed Green edge, its title after a circled tick, the sentence naming the Part and the link to the Offers, which arrives with the screen (Motion 6) and on the next search leaves as Motion 8 says, through `Leaving`, its fade first and then its space and the gap above it, every block below the title holding the gap above it, so that the search rises rather than jumps; the search with its Category in the sheet, beside it from 40rem, with no Search button (Enter or the keyboard's search key searches, a new Category at once); the count in words on the end side, "27,427 Parts found", "Searching…" beside it, never on a plate; a table from 64rem of Part (the name, its manufacturer and Category below it, and "You offer this Part" in Confirmed Green) and Part numbers, and rows of 72 pixels at least on a phone; no picture on a row; part numbers in Geist Mono, each kept whole (a new shared `PartNumbers` in `entities/part`); a long English name wraps in a box of its own, its lines starting on its left, on the screen's start side; rows sketched still while the first answer comes; nothing found between Rule lines.

**The Offer form**: one column at every width, at most 40rem wide; the Part on a Raised Stone panel with 8-pixel corners and no edge, its name at weight 550, its part numbers in Geist Mono, its photo at 48 pixels with an Edge or, with no photo, its Category's icon plain at 32 pixels in Note Grey (`PartPicture`'s `row` size is now `form`, the only screen that showed it); the prices one to a row; the in-stock switch's label at the small size; the refusal panel above the prices in an `OpeningSpace`; the button keeping its width while it waits (`BusyLabel`); a field's refusal opening smoothly through ticket 08's `FieldError`.

**An Offer's own screen**: under the title the screen's one leading plate (the shared `Plate`'s new `lead`: Figure lead at 30 pixels, 6-pixel corners, 16 pixels each side; `OfferPlate`'s `lead`), both prices on it, muted when out of stock, the dinars on a second line where a phone is too narrow; its Confirmation beside it, drawn as a row draws it (the Confirmation's look moved from `pages/offers/ui/offer-rows.tsx` into `entities/offer/ui/confirmation-look.tsx`, which both use; ticket 11's screen otherwise unchanged); the sentence that saving confirms it; the form; Remove the Offer below it, as wide as the form on a phone. The removal's dialog says a refusal through ticket 09's `AlertDialogRefusal`, and Remove keeps its width while it waits (`BusyLabel`). An Offer gone sits between Rule lines.

**Shared components, all additive:** `Plate` gained `lead`; `Switch` its reduced-motion duration; `PartPicture`'s small size is the form's; `PartNumbers` and `ConfirmationLook` are new in the entities. The Admin console's Catalog keeps its own part numbers (ticket 07's), which `PartNumbers` could replace in a later ticket.

### 28 October 2026: how each skill was run

- **`mattpocock-skills:tdd`**, through the Skill tool. The owner was not answering, so I chose the seams, as tickets 07 and 11 did: the API's HTTP surface against a real PostgreSQL, the inspector's made-up shop, and the portal in a real browser through Playwright. Red first, each for the right reason: the API's on the four missing fields (a first red run failed on 401, a Vendor's token taken before the clock was moved, and was rerun with a token taken after); the shop's on the missing functions and on `NOT_FOUND`; the portal's eight new lines on the switch's 0.15 s under reduced motion, the Search button, the missing table, the note's 6-pixel corners, the form's 994-pixel width and the missing leading plate, while the full-motion thumb line passed on the old switch.
- **Taste** (`design-taste-frontend`'s app-screens rules through DESIGN.md) and its `inspect.mjs --app` through `pnpm dashboard:inspect` (below).
- **Emil**: `break-ui` and `mobile-native` (below); the switch and the note built to DESIGN.md's Motion, with Emil's `emil-design-eng` rules already in it.
- **Impeccable**: `impeccable context --target apps/dashboard/src` once, then its `document` for DESIGN.md's corrections (below). No skill refused to load.

### 28 October 2026: Emil's break-ui on the search and the form

The worst case entered at the API's boundary, inside the browser, by a throwaway capture test (deleted after): the catalog's own longest names (the Corsair H100i's 230 characters, the DeepCool LS720 SE's), its longest runs of part numbers (an Asus DUAL RTX 2060, an Asus Prime LC's nine), 27,427 found over 1,372 pages, a search in GPU for `bartholomew.fitzgerald@northwind-industries-holdings.example.com`, one Part; the form with every field refused at once (dollars with three decimals, dinars over the limit, a warranty of 12.5 months), a second Offer for the Part, an Offer at the API's largest prices, 100,000 $ and 150,000,000 IQD, out of stock and expired 45 days, and a removal refused 503. Captured at 1440, 768, 360 and 320, in English and Kurdish, light (and dark at 1440 and 360), before and after the fixes: 168 captures each, none scrolling sideways. The toggle is on the review page; none was added to the app.

| # | Severity | Field | Worst case | What happened | Fix |
|---|---|---|---|---|---|
| 1 | Ugly | the table from 64rem | any search | The Part's heading and text started 8 pixels before the search's edge: the shared table's `first:ps-0` won over the row's padding | `first:ps-2` and `last:pe-2` (`found-part-row.tsx`) |
| 2 | Ugly | the leading plate's figure | 349.99 $ at 30 pixels | The decimal point took a whole Geist Mono cell, "349 . 99" | The point is set in Geist, as the comma is, on every plate (`offer-plate.tsx`) |
| 3 | Ugly | the Part's name in the removal dialog's Kurdish and Arabic sentence | the H100i's name | The English name wraps through a right-to-left sentence, its lines ragged | For the owner (choice 7) |
| 4 | Fragile | Remove's busy words | "Removing…" | Longer than "Remove", so the button at rest keeps their width, against DESIGN.md's Busy | For the owner (choice 8) |

**What held up:** every count grouped in Western digits, "1 Part found"; the unbreakable address wrapping only where it must; the long name starting on its left in Kurdish; nine part numbers each whole; every field refused at once, each beside its field; the largest prices on the leading plate at 320, the dinars on a second line; an expired Confirmation in Action Red.

**A fault for each fix and for the note, shown and reverted by the inverse edit** (a script on the committed code, the tree clean after): with the note taken out at once, both note lines failed, the search moving 170 pixels in one frame; with the table's old padding, the 64rem line failed, the text 8 pixels off; with the point back in Geist Mono, the leading plate's line failed, finding no point set apart. The other new lines passed.

### 28 October 2026: Emil's mobile-native at 360 pixels

From the code and the emulated phone; the skill's own rule is that none of it is proved until a real phone, which waits for hosting.

- **Typing a price with a thumb:** each price and the warranty is a full-width field 44 pixels high at 16 pixels (17 in Kurdish and Arabic), so a phone does not zoom; dollars open the decimal pad and dinars and the warranty the number pad; left to right in every language, nothing to fill or spell-check; Arabic-Indic digits, the Arabic separators and spaces taken as typed; the way each is written said below it.
- **The switch** takes a tap 44 pixels high, and its whole row, the label with it, toggles it.
- **Already right from ticket 11:** no tap highlight or tap delay, no selected button words, the browser's bar in the Stone Frame's colours, the search key labelled search.
- **Left for a phone:** whether the keyboard covers the form's button while a price is typed, and real number pads; in the MVP spec's list.

### 28 October 2026: tests that changed, and why

No test lost an assertion.

- `offer.controller.integration-spec.ts`: one Offer read is now the list's shape, so the seven reads compared with an Offer as created or changed compare with it as read, `asReadJustAfterItsConfirmation` (confirmed 0 days ago, neither expired nor about to expire; the days left any number, 14 on a clock held still and 13 a millisecond later), and the one read a day later with its exact values. New: one Offer read 8, 12 and 20 days after its Confirmation, as its list marks it.
- `made-up-shop.spec.ts`: one Offer is now read with its expiry, as the shop's list shows it; an Offer the shop does not hold is 404 with `OFFER_NOT_FOUND`, where the status alone was checked. New: the shop's catalog search.
- New in `vendor-change-offer.spec.ts`: the switch's thumb, slowed fourfold, with and without reduced motion, mirrored in Kurdish; an Offer's screen led by its plate (sizes, both prices, the point and comma in Geist, the Confirmation, Remove below the form as wide as it), and an Offer out of stock muted, with `expectAccessible` at 1280. New in `vendor-add-offer.spec.ts`: the search on a phone (no button, count in words, no picture, part numbers in Geist Mono, 72-pixel rows), the table from 64rem with `expectAccessible` and the text's edge, the note's look and its leaving filmed with and without reduced motion, the form from 64rem.
- The language and accessibility lines of the catalog search, the form with a refusal and the form with the removal's dialog are unchanged and pass.

### 28 October 2026: DESIGN.md corrected

With Impeccable's `document`: the catalog search's search in the sheet at every width, with no button; a Part it found in Geist Mono part numbers, its table from 64rem and 72-pixel rows; the picture's `form` size; the leading plate's Confirmation in its state's look, the API's read of one Offer, the dinars' second line; the decimal point in Geist with the comma; the switch's reduced motion built; the note leaving on the next search. The MVP spec's list of checks on a phone that wait for hosting has this ticket's.

### 28 October 2026: the checks

- `pnpm check` before each commit; the first four commits again in a fresh clone; `pnpm integration:check` (374 passed) before the API's.
- The Offer screens' end-to-end lines and the languages' (`checkInEveryLanguageOfTheVendorPortal` on the catalog search, the form with a refusal and the form with the removal's dialog), under the scratchpad's e2e lock: 70 passed on the final code.
- **Taste's inspector**, `pnpm dashboard:inspect <screen> --language en|ckb --scheme light|dark --app --widths 1440,768,360`, as the made-up shop's Vendor, ticket 05's direction restored with no allowances, the API and dashboard started from the worktree under the lock and stopped after: **0 FAIL in all sixteen runs**. The catalog search: 0 WARN. The form: 1 WARN, `hero-void` at 1440 (the 40rem column leaves the sheet's end side empty, choice 3). An Offer's screen: 2 WARN, the same `hero-void`, and `mixed-font-headline` (the leading plate's digits in Geist Mono with the comma, point and units in Geist, as ticket 04 chose). An Offer gone: 2 WARN, `hero-void` and `panel-void` (a short screen on a tall sheet, choice 9). Photographs in the owner's checkout at `.taste-skill/redesign-12/inspect/`.
- `pnpm platform:check`: on the code's tip, `ab41542`, under the scratchpad's e2e lock: **229 passed**, none failed or flaky (10.7 minutes). The run before it, on the same tip, had 228 passed and 1 failed, `admin-edit.spec.ts`'s photo line (ticket 08's: the Category's icon still there 5 seconds after a photo was added, its fade under the run's load); this ticket does not touch a Part's page, the line passed three times of three on its own (`--repeat-each 3`, 12 passed), and the whole run then passed.
- **Merged with `redesign/integration`** at `89a9970` (ticket 13): one conflict, in DESIGN.md's Motion 6, kept ticket 13's text with this ticket's sentence on the note added. `pnpm check` passed on the merge, `1ac863e`, and `pnpm platform:check` under the lock: **242 passed**, none failed or flaky (11.0 minutes).
- Nothing was written to the development database by the redesign's tooling: the capture answered every Offer in the browser and only read Parts; the inspector's shop refuses every change; one read-only `SELECT` found a real Part's identifier. The end-to-end tests made their own made-up Vendors, Parts and Offers, as they always do.

### 28 October 2026: for the owner

**AWAITING OWNER REVIEW.** The review page is `.taste-skill/redesign-12/index.html` in the owner's checkout (served from `.taste-skill` on port 4110): the catalog search at 1440 (`#r1`) and at 360 with its note (`#r2`), the Offer form with every field refused and with a second Offer (`#r3`), an Offer's screen, its removal refused and an Offer gone (`#r4`), break-ui's toggle before and after (`#r5`), mobile-native (`#r6`), the inspector (`#r7`), the motion (`#r8`) and the choices (`#q1` to `#q11`). Every picture is the running app.

1. **The API reads one Offer with its expiry**, as its list answers it (built). Or no Confirmation beside the leading plate.
2. **The catalog search keeps its search in the sheet at every width**, the Category beside it (built). Or the search in the top bar from 64rem, as the Offers screen's.
3. **From 64rem the form keeps its 40rem column**, the sheet's end side empty (built, as DESIGN.md has it). Or the Part's panel beside the form on the end side.
4. **No Search button**, Enter or the search key searching (built, as every screen's search). Or a Search button beside the Category.
5. **The Parts found are a table of Part and Part numbers from 64rem** (built). Or the phone's rows at every width.
6. **The leading plate's Confirmation in its state's look**, as a row draws it (built). Or the plain Small Note Grey date.
7. **A long Part name inside the removal dialog's Kurdish sentence** wraps ragged (as built). Or the name on a line of its own, left to right, below the sentence.
8. **Remove keeps the width of "Removing…" at rest** (as built). Or a busy word no longer than "Remove".
9. **An Offer gone at the head of the sheet** between Rule lines (built). Or centred in the window, as ticket 13 centres the not-found screens.
10. **The form's refusal panel above the prices**, as chosen on 20 October 2026 (kept). Or above the button, as ticket 08 put the Part form's.
11. **Left for hosting:** the keyboard over the form's button and the number pads on a real phone, in the MVP spec's list.

The boxes for break-ui and mobile-native (their by-hand check on a phone waits for hosting), for showing the screens to the owner, and the Status, stay as they are until the owner has looked and answered.
