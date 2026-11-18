# 03: Design the Offer sheet's pieces in the Vendor portal

**Spec:** [the sheet spec](../spec.md)

**What to build:** The Offer sheet brings pieces to the Vendor portal that the dashboard's DESIGN.md does not describe yet. They are designed inside Framed sheet (ADR-0011), with no new direction dealt:

- the Offer sheet screen, with its download, its file field and its upload;
- the way to it from the Offers screen;
- the upload's result, with its counts, its added Offers, its rows applied by the tie-break and its four kinds of skipped row;
- the Part Request form started from a skipped row.

First, the inspector's made-up shop learns to answer an upload, so that every option is shown with realistic, obviously fictional data. The owner then sees the options rendered and chooses by eye, and Impeccable records the choices. No screen is built here; ticket 04 builds it to this ticket's record. Read [the design skills guide](../../../docs/agents/design-skills.md) before starting, as CLAUDE.md asks.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] **The made-up result.** The dashboard's made-up shop answers an upload with a made-up result and writes nothing, as for every other call. It is typed against `api-client`, with the inspector's tests of it. Its result holds:
  - added Offers of real Parts;
  - a row applied by the tie-break;
  - one skipped row of each problem.
- [x] **The worst cases.** `pnpm dashboard:inspect --offer-sheet-result worstCase|clean`, for `break-ui`, as `--part-requests` is. `clean` answers every row applied. `worstCase` adds what the spec's **The inspector** lists:
  - 4,800 skipped rows;
  - row numbers in the thousands;
  - part numbers of 100 code points and with no space;
  - a part number held by 81 Parts;
  - names in Kurdish and Arabic script;
  - the catalog's longest Part name among the added.
- [x] **Reaching the result.** The result is reached through the inspector's own steps, a made-up file chosen first, as `part-requests`' dialogs were.
- [x] **The screens as they are.** The Offers screen and the Part Request form are captured and critiqued before anything is proposed, by Taste's audit with Impeccable's `critique`.
- [x] **What DESIGN.md lacks.** Impeccable adds to the dashboard's DESIGN.md whatever these pieces need and it does not yet say, before options are drawn.
- [x] **The options, rendered.** Each piece is shown in two or three options in the built-in browser, from a page served from the scratchpad, never `file://`.
  - One option goes to an anchor, at most two columns.
  - Each is shown with the made-up shop's data, in Kurdish and English, at a phone's width and a desk's.
  - For a large options page, the owner looks and answers in chat before any choice dialog.
- [x] **The open choices, put to the owner:**
  - whether the screen is also a fourth section of the sidebar and the menu sheet, or reached only from the Offers screen;
  - how the download and the file field stand, and how the upload says it is on its way;
  - the result's composition: the counts, the added Offers, the tie-break's rows and the skipped rows grouped by problem;
  - how a result of thousands of skipped rows stays readable on a phone: folded, paged or otherwise;
  - whether the Part Request form opens over the result or as its own screen, with the result kept either way;
  - the motion of the upload on its way and of the result arriving, led by Emil Kowalski's skills;
  - the copy, led by Impeccable: the refusals of a file, the four problems, a row already asked for, and why a part number is missing.
- [x] **The record.** The owner's choices go under Comments, and Impeccable writes them, with their motion, into the dashboard's DESIGN.md. An ADR is written only if a choice replaces part of ADR-0011.
- [x] **Gates.** `pnpm check --skip-nx-cache` passes. The made-up shop is typed against the client, and its tests pass.

## Comments

### 18 November 2026: the made-up result

On branch `sheet/03-design-the-offer-sheets-pieces`, from `sheet/integration` at `b2b60c0`, tickets 01 and 02 merged.

**The made-up shop answers an upload** (`e02af8a`). `apps/inspector/src/made-up-offer-sheet-result.ts` holds the results, and `answerFromTheMadeUpShop` answers `POST v1/vendors/{shop}/offer-sheet`, the shop's own Vendor's alone, 200 with the result shown, whatever the file, before its refusal of every other write; another Vendor's upload is refused `MADE_UP_SHOP_IS_READ_ONLY` as every write is, and nothing of the shop changes, as an upload's result is never stored. Everything is typed by `@pcp/api-client` (`OfferSheetResultResponse`, `AddedOfferResponse`, `SkippedRowResponse`). The download is not answered: a file is not a page.

**The made-up result** tells one upload's story. The shop's Vendor downloaded its 13 Offers, rows 2 to 14 in the download's order, changed seven prices, wrote the code on its GPU's box, which the white edition holds too, and typed nine rows below them: 22 rows read.

- **Added**, rows 15 to 17, real Parts the shop does not offer: AMD Ryzen 7 9800X3D, Kingston FURY Beast 16GB (2x8GB) DDR4 3200 CL16 Black, SeaSonic FOCUS GX-750, each with an `offerId` the shop does not hold.
- **The tie-break**, row 10: `TUF-RX7800XT-O16G-GAMING`, which the development database shows the two Asus TUF GAMING OC Radeon RX 7800 XT 16GB GDDR6 editions hold, applied to the Black one the shop offers; counted changed.
- **Changed** 7 (the tie-break's row among them) and **confirmed** 4.
- **Skipped**, one of each problem and more: row 8, the Samsung drive's own row, `inStock` `notYesOrNo`; rows 14 and 21, the Corsair RM850e by its EU and UK codes, the same Part twice, each naming the other; row 18, a pretend fan that matched no Part; row 19, `PFL-240-ARGB-BK`, the cooler of the shop's own open Part Request, sent three days ago, so `partRequestOpen` is true; row 20, `BX8071512400`, which the Intel Core i5 12400 and 12400F both hold; row 22, an IQD price in words, `iqdPrice` `notANumber`; row 23, no part number, `partNumber` `missing`.

Two of the API's rules are stated in the shop, each beside the API's, which is the rule that counts: a row of the same Part twice names the first ten other rows of its Part and counts every one (`mostOtherRowsNamed`, as ticket 02 bounded it); and a row that matched no Part says whether the shop's Vendor has an open Part Request of its part number, its case folded, so that `--part-requests none` answers it false.

**`pnpm dashboard:inspect --offer-sheet-result worstCase|clean`**, as `--part-requests` is:

- **`clean`**: the same download uploaded with its changes and its three new Parts alone, 16 rows, every one applied (3 added, 9 changed, 4 confirmed, the tie-break's row among them).
- **`worstCase`** keeps the made-up result and adds the catalog's longest Part name among the added (row 24, 276 characters) and 4,800 skipped rows, rows 25 to 4,824, so 4,823 rows read and 4,808 skipped: 3,288 that matched no Part, with names in English, Kurdish and Arabic script, one starting with a digit, the longest the API carries in English and in Kurdish (300 code points, cut as the API cuts) and none, part numbers of 100 code points with no space and with spaces, prices at the API's limits, and a few already asked for (`PPC-750G-FM`, an open request of the shop's); 600 whose code two CPUs share; 12 of `OC`, which names the 81 GPUs that hold it at the pinned commit; 300 that name the Intel Core i5 14600K, each naming the first ten others by row number and counting 299; and 600 not valid, in each of the 22 ways a cell can be refused in turn.

The 81 Parts that hold `OC` are named in `apps/inspector/src/parts-holding-oc.ts`, 80 names, since two of the GPUs share one ("PowerColor Red Devil Radeon RX 5700 XT 8GB GDDR6 Black / Red"); `partsHoldingAPartNumber` reads every Part of each name that holds the code, whatever its case, a few at a time, in the catalog's order, and stops the command when a name holds none. Only the worst case reads them. The result's other Parts join the shop's reads (`partsTheShopReads`, now once each).

**The tests**, at the inspector's unit seam, `pnpm check`: `made-up-offer-sheet-result.spec.ts` (25) and two lines in `catalog-parts.spec.ts`. The first test was run red first, for the right reason: the shop answered the upload 405, `MADE_UP_SHOP_IS_READ_ONLY`, where 200 was expected. Its answer was then written with the data whole, so the later tests passed when first run; the reader's two lines were run red against a stub answering no Part (0 of 81 read, and no refusal of a name holding none). Each was then seen red against a fault planted on the committed tree and taken out by the inverse edit, `git status` clean after each, by a script in the ticket's scratch folder (`8407cb6` first made the worst result before its tests rather than while they were collected, so that a fault fails the tests rather than the file):

| Fault | Tests that failed |
|---|---|
| The upload refused as every write is | all 23 of the made-up and worst results' answers |
| Another Vendor's upload answered too | "is the shop's Vendor's alone: another Vendor's upload is refused as every write is" |
| A row of the same Part twice naming every other row | "names at most ten other rows of the same Part, by row number, and counts every one" |
| An open Part Request's number compared without folding | "carries a row that matched no Part … already asked for it", "says some of its rows that matched no Part were already asked for" |
| The worst case without the made-up rows | "keeps the made-up result", "reads no more rows than a file may hold …", and the ten-other-rows test |
| One Part read for each name holding "OC" | "are every Part of each name that holds it, whatever its case, in the catalog's order" |

The inspector's 212 tests pass. No test of the platform relies on the made-up shop.

**Reaching the result.** No address opens a result, so it is reached through the inspector's own steps, as `part-requests`' dialogs were: a scratch driver (`ticket-03/capture.ts` in the session's scratchpad) built on `apps/inspector/src/main.ts`'s modules logged in as the development Admin, answered the portal from the made-up shop, put a file field into the shop's portal, chose a made-up file in it through the DevTools protocol (`DOM.setFileInputFiles`, "Offer sheet 2026-11-18.xlsx"), sent it as the portal's upload sends it, a multipart form with `offerSheet`, and read back 200: 22 rows, 3 added, 1 by the tie-break, and the skipped rows 8, 14, 18, 19, 20, 21, 22 and 23. Ticket 04 inspects its screen the same way, the file chosen in the screen's own field first.

### 18 November 2026: the screens as they are

Before anything was proposed, the API (3001) and the dashboard (3002) were started from this worktree under the e2e lock, and `pnpm dashboard:inspect` ran on the made-up shop, `--app`, at 1440, 768 and 390 pixels. The command read the result's Parts and, with `--offer-sheet-result worstCase`, the 81 that hold `OC` from the development database's catalog, so every name the made-up result gives is a Part the catalog holds:

| Run | FAIL | WARN |
|---|---|---|
| The portal's Offers screen, Kurdish, light | 0 | 0 |
| The same, English, dark, `--offer-sheet-result worstCase` | 0 | 0 |
| The Part Request form, Kurdish, light, `--offer-sheet-result clean` | 0 | 0 |
| The same, English, dark | 0 | 0 |

**Taste's audit** (its app-screen run, on those pictures): the Offers screen answers its question, which Offers need confirming, first and in words, with one primary, and holds no way to change many Offers but Confirm all; its count line spends a phone's row on a count the tab already says. The form is the portal's own; it knows one start, the search.

**Impeccable's critique**, its two assessments run apart as its `critique` asks (A, the design review: agent `a77dd8068125fc12e`; B, the detector: agent `a5d60a121706f8807`):

- **B, the detector:** no finding on the Offers screen, the new Part Request screen, the Part Request form and the Offer form's fields, each alone and together, with the project's config and without it (`--no-config`, which turns off the waived `overused-font` for Geist). A control planted in the scratch folder (a gradient text heading and a side stripe) gave three findings, so it reads TSX. The in-page overlay could not run: the dashboard is behind Keycloak's login and was not running then.
- **A, the design review:** 30/40, specific to the product (the plates, the stone frame, real right to left). The priority issues, each with what it means for the Offer sheet's pieces:
  - **P1:** the phone's head is full: the first Offer starts at about 720 of 844 pixels, and the bar's one action is Add an Offer, so no new block can stand above the list; the count line's empty start side and the menu sheet cost no height.
  - **P1:** the desk's title row is full under DESIGN.md's rule of at most one outlined secondary.
  - **P1:** the Offers table is starved at 1024 (a Part column of about 180 pixels), so the result's rows must be two-line rows, never a wide table.
  - **P2:** part numbers break at their hyphens and their full stops jump in Kurdish sentences, and English names hang their last line on the wrong side; a result printing hundreds of codes must isolate each and keep it whole.
  - **P2:** the form knows no start from a row and returns to Your Part Requests, which would drop a result kept in the page.
  - And what a long result must not do: paint thousands of rows red, bury its counts, move every row, put counts on plates, or lose itself when the form opens.

Questions skipped: the owner's standing instruction of 18 November 2026 takes the recommendation for each.

### 18 November 2026: what DESIGN.md lacked

Before any option was drawn, Impeccable added what the pieces need, whatever option is taken, and the file did not yet say:

- **Typography:** a part number inside a right-to-left line, a left-to-right run isolated in it and broken anywhere; what a Vendor wrote in Kurdish or Arabic script sized by its own direction in either portal; and a file's name in its own direction with its last Latin word, the day and `.xlsx`, isolated left to right.
- **Fields:** the file field, the browser's own, wearing an outlined button, its refusal one sentence beside it naming no limit.
- **Rows and tables:** a row of an upload's result, with no plate.
- **Plates:** the counts of an upload's result are words.
- **States:** the four problems of a skipped row in words, and the skipped block's one red mark.

### 18 November 2026: the options, rendered

**The page** is in the scratchpad's `sheet-03/`, for the owner's `.taste-skill/sheet-03/`. It was served on port 4123 by a small static server that sends nothing cached (never `file://`) and shown in the built-in browser.

`index.html` lays out the screens as they are (`#before`), then seven choices, `#d1` to `#d7`, one option to an anchor (`#d1a`, `#d1b`, …), 20 options in 60 windows. The option taken is marked on each, with why, and the others say why not. Then come the words (`#words`, 86 lines in English with Kurdish and Arabic drafts), the motion (`#motion-section`), the feel on a phone (`#phone`), the worst cases (`#worst`) and the record (`#record`). A bar switches both schemes, reduced motion and four times slower; Play buttons run the upload on its way and the result arriving, and "Show 50 more" works in its windows.

**How each window is made.** Every window is the dashboard's own frame, captured with its markup from the running dashboard on the made-up shop (`captured/`, by the scratch driver above), drawn with the dashboard's built stylesheet and fonts (`base/`). Each piece is put into it by `pieces.js` with the theme's own class strings, copied from the captured markup and checked against the built stylesheet, from `data/`, the made-up shop's three results as the inspector makes them. The few rules the pieces add are in `pieces.css`, each a proposal: the screen's grid, the result's row (a container query on the list), a part number's run, a name's size by its own direction, the arriving result and the turning mark. The portal's pieces are in Kurdish and English at 390 and 1440, at 1024 for the screen and the result, and at 1280 for the worst case.

**How each skill led its area:**
- **Taste** (`design-taste-frontend`, `references/app-screens.md`): the composition, with no deal, inside Framed sheet: the screen's one question in each state (how to change many Offers; did the upload work and what needs me), what needs the Vendor first, the most frequent job one tap away, the evidence beside the answer, lists capped with "show more", and two-line rows on a phone.
- **Impeccable:** the critique, what DESIGN.md lacked, the copy (`clarify`), right to left and accessibility, and the record.
- **Emil Kowalski's `emil-design-eng`:** the motion, asked with the frequency; it added the turning mark to the busy button and kept the stagger out.
- **Emil's `mobile-native`:** the feel on a phone, through DESIGN.md's own phone rules (redesign ticket 11) and the file picker a phone opens.
- **Emil's `break-ui`:** the result at its worst, `--offer-sheet-result worstCase`, in both languages at every width.

The design skills' own files were not changed.

**Measured** in headless Chrome by a scratch script driving Taste's own `cdp.mjs`: every window at its width in light and in dark, and every phone window again at 320 pixels. No script error, nothing scrolling sideways, no text of the pieces under 14 pixels (15 in Kurdish), and every control of the pieces 44 pixels on a phone. What the probe still reports is the captured frame's own (the language switch's Kurdish and Arabic names at 14 pixels in the English portal, by the Tall Script Rule's page language; the Offers rows' name links, whose whole row is the tap target) and the result's own row links, whose whole row is theirs too. The reports are in the page's `measured/`.

**Found and fixed on the page**, each written into DESIGN.md:
- the result's rows set 14 pixels themselves and missed the theme's 15 in Kurdish; they take `--text-sm`;
- the chosen file's name reordered its day and `.xlsx` in Kurdish, and `.xlsx` given a Kurdish suffix reordered too; a file's name keeps its own direction with its last Latin word isolated left to right, and `.xlsx` in a sentence is isolated with no suffix;
- a part number drawn as a left-to-right block hung on the left of a Kurdish row; it is an isolated run inside a line of the row's direction;
- a Vendor's Kurdish or Arabic name in the English portal was drawn at 14 pixels; what a Vendor wrote is sized by its own direction (`:dir(rtl)`).

**The worst cases**, by `break-ui` on the options taken: 4,808 skipped rows draw ten a group and stay a few screens long, every group's count in its heading; row numbers in the thousands keep to their column; codes of 100 code points break inside their line, with spaces and without; "OC" names three of its 81 GPUs and "Show all 81 Parts"; the Part 300 rows name says ten rows "and 289 more"; Kurdish and Arabic names stand on their own side; the longest added Part name, 276 characters, wraps whole. **Defended:** a name of 300 code points in Kurdish runs six lines on a phone, kept whole, since it is what the Part Request form will carry and the Vendor corrects there.

### 18 November 2026: the choices

The owner was asleep. Each choice was rendered as the ticket asks and then taken, with no stop. The page was left ready for the owner to look at and answer in chat; no choice dialog was put.

1. **d1, the way to the screen.** Taken on the owner's standing instruction of 18 November 2026: a fourth section of the sidebar and the menu sheet, "Offer sheet", second, after Offers, with lucide's `FileSpreadsheet`; and from the Offers screen, an underlined link with the file mark on the start side of its count line, "Change many at once in your Offer sheet", and the same in its empty state (PRODUCT.md keeps a phone-first portal and a file of bulk changes as equal routes, the Admin acting in a shop finds it at once, and the link costs the full phone head no height; the other options were the Offers screen alone, its second route hidden behind the first, and an outlined button on the Offers title row, which breaks DESIGN.md's rule of one outlined secondary).
2. **d2, the download and the file field.** Taken on the owner's standing instruction of 18 November 2026: one column at most 40rem, "Download your Offers" with its outlined button, a Rule line, "Upload it changed" with the browser's own file field wearing an outlined button and the pane's one primary, "Upload the Offer sheet"; "What the file holds" beside it on Raised Stone from 64rem; on its way the busy label, a turning mark and a status line naming the file (the Part Request form's composition the owner chose; the other options were two equal halves on cards, which weigh the preparation as the work and leave no place for the explanation, and a place to drop the file, which a phone cannot use).
3. **d3, the result's composition.** Taken on the owner's standing instruction of 18 November 2026: a Confirmed Green note with the counts in words, then the rows skipped grouped by problem with the block's one red mark, then the Offers added and the rows applied by the tie-break, each leading to its Offer (what needs the Vendor first, as DESIGN.md orders a screen; the other options were the evidence first, which buries the skipped rows below the fold, and tabs, which a result kept only in the page cannot hold in the address).
4. **d4, thousands of skipped rows on a phone.** Taken on the owner's standing instruction of 18 November 2026: each group's first ten rows, then "Show 50 more" in place, with "10 of 3,290 shown" (every group's count on the screen and the place kept; the other options were pages of twenty a group, which lose the place with no address to keep it, and groups folded, which draw every row when opened).
5. **d5, the Part Request form from a row.** Taken on the owner's standing instruction of 18 November 2026: its own screen, under the Offer sheet screen's route, which keeps the result, with "Back to the result" and a line naming the row and the file; after a send, back at the result scrolled to the row, which says "Asked for" (the portal's own form at every width, its refusals and "What happens next" kept; the other options were the form floating over the result, a full screen on a phone anyway and a third floating thing DESIGN.md does not have, and the Category and Send in the row, which sends details the Vendor has not seen as a form).
6. **d6, the motion.** Taken on the owner's standing instruction of 18 November 2026: the result's space opens and it fades in (Motion 8's arrival), the page scrolls smoothly to its head, which takes the focus; the busy mark turns at constant speed; "Show 50 more" opens one block; "Asked for" changes in place (Emil's frequency rule, an occasional thing that shows where the answer is; the other options were the result taking the upload's place, which hides the way to upload again, and the result's parts staggered, which spends the portal's one stagger on content read for its facts).
7. **d7, the copy.** Taken on the owner's standing instruction of 18 November 2026: plain sentences that say what to do, the cell's reasons as the Offer form says them and its column by the file's heading, no limit named (Impeccable's `clarify`: what happened, why, and what to do; the other option was the problems' names and the reasons' codes, which hand the Vendor the platform's words).

**Nothing pulls against a hard rule**, so nothing was put to the owner as a conflict: every colour is one the file has measured, every control of the pieces is 44 pixels on a touchscreen, no text of the pieces is under 14 pixels or Arabic script under 15, nothing scrolls sideways at 320, and every side is logical.

**What the spec left open, settled here:** the Part Request form from a row is a screen of its own whose parent route keeps the result; and the ticket's "a fourth section" is the fourth of four, placed second, since it belongs beside the Offers it changes.

### 18 November 2026: the record

Impeccable wrote the choices, with their motion, into `apps/dashboard/DESIGN.md`, in the file's own terms and with the owner's anchors:

| Piece | In DESIGN.md |
|---|---|
| The Offer sheet screen | Layout |
| The busy mark | Components › Buttons |
| The Part Request form from a row | Components › Fields |
| The upload's result, a skipped row by its problem, thousands of rows, a file refused | Components › States |
| The section and the way from the Offers screen | Components › Navigation and the frame |
| Motion 13, what stays still, and its reduced form | Motion |
| The rest | Do's and Don'ts |

No choice replaces part of ADR-0011, so no ADR is written.

**Phone checks, open, waiting for hosting** (the owner's rule of 16 October 2026; the spec's Open checks list them): the result read with a thumb, a long one among it; a row turned into a Part Request; the file chosen from a phone's files; the motion on a real phone, with reduced motion on and off.

### 18 November 2026: the gates

- Each commit was gated on `pnpm check` before it was made: `e02af8a` (the made-up result, the inspector's 212 tests among it), `8407cb6` (the worst result made before its tests), `905c32b` (what DESIGN.md lacked, and the record so far), and this one (the choices and this record).
- `sheet/integration` was still at `b2b60c0` when merged in, so the merge brought nothing.
- This record's commit is gated on `pnpm check --skip-nx-cache`, with every `*.tsbuildinfo` outside `node_modules` deleted first.
- `pnpm integration:check` was not run, since the ticket changes no API code, and `pnpm platform:check` was not run, since the ticket runs no end-to-end test and builds no screen. `pnpm boundaries:check` was not asked for: the inspector gains no import of another project.
- The e2e lock was held once, for the inspection of the screens as they are and the capture, and released.
