# 04: A Vendor downloads and uploads its Offer sheet, and asks for a skipped row's Part

**Spec:** [the sheet spec](../spec.md)

**What to build:** In its portal, a Vendor downloads its Offer sheet, changes it, uploads it, and reads the upload's result:

- what was added, changed and only confirmed;
- the rows applied by the tie-break;
- each skipped row, by its row number and why.

From a row that matched no Part, the Vendor asks for the Part to be added. The Part Request form is filled from the row, and the Vendor chooses the Category (SHT-6). The Admin acting as the Vendor does all of it under the band.

This completes success criterion 9 and, once the Admin fulfils that request, criterion 10, each proved end to end in a window 360 pixels wide, in Kurdish, Arabic and English. Everything is built to ticket 03's record.

**Blocked by:** 01, 02, 03

**Status:** resolved

- [x] **The screen** at `offer-sheet`, relative to the portal's frame, reached as ticket 03 chose. Its address is relative to the route, so the frame for acting as a Vendor serves it too.
- [x] **Downloading** asks `downloadOfferSheet` in the portal's current language, and saves the file under the name the API gives.
  - While the file is on its way, the button says so and cannot be pressed again.
  - A refusal, or an API that cannot be reached, is said with `WhyNotAnsweredInThePortal`.
- [x] **Uploading** is a file field that takes .xlsx files, then a button.
  - While the file is on its way, the screen says so and nothing can be sent again.
  - Each refusal of the file is said beside the field in the portal's language, one sentence for each reason, and no limit's number is written.
- [x] **The result,** kept in the page for the visit, as ticket 03 laid it out:
  - the counts, written by `formatNumber`;
  - the added Offers' Parts `AlwaysEnglish`;
  - the rows applied by the tie-break;
  - the skipped rows grouped by problem, each with its row number and its part number `AsWritten`, left to right.

  Each problem says what the spec's **The Vendor portal** says:
  - several Parts names each Part and leads to the catalog search with the part number;
  - the same Part twice names the other rows;
  - not valid names the column by the file's heading and says the reason as the Offer form does;
  - a missing part number says that an Offer whose Part has none is changed on the Offers screen.
- [x] **The queries.** An upload asks the Vendor's Offers again through `askAgainAfterAChangeToTheOffers`, so that the Offers screen, its counts and the expiry banner follow. It also asks every query about Parts again.
- [x] **A row to a Part Request.** The `part-request-form` feature gains a start from a row: its name, part number, both prices, stock and warranty, with the Category left for the Vendor to choose.
  - It opens as ticket 03 chose, and the result survives it.
  - It sends through `sendPartRequest`, says the same refusals as the form always does, and asks every query under `['part-requests']` again.
  - After a send, the row says it was asked for.
  - A row whose `partRequestOpen` is true says it was already asked for, with a link to the Vendor's Part Requests, and offers no second request.
- [x] **Words.** Every new text is in the `i18n` library's dashboard set in all three languages:
  - every plural form is given, with Arabic's one and two in words;
  - no message formats a number;
  - the Kurdish and Arabic are drafts for LANG-7.
- [x] **End to end, in a window 360 pixels wide.** Each test makes its own made-up Vendor, Parts and part numbers through the API. It downloads through Playwright's download event, reads and changes the file with the library, and uploads it through the file field. It compares the screen with the API and never quotes a translation. The lines are:
  - **criteria 9 and 10, in Kurdish, Arabic and English**, with the seven steps the spec's **Seam 3** lists, from the download to the same file applying the row once the Admin has fulfilled its Part Request and the Shopper's Part page lists the Offer;
  - **a refusal**: a file that is not the layout is refused beside the field, and the Offers screen is unchanged;
  - **several Parts and the same Part twice**, with the several Parts' link opening the catalog search;
  - **acting as the Vendor**: the Admin downloads and uploads under the band, and the Vendor's own portal shows the change;
  - **language and layout**: right to left in Kurdish and Arabic, Western digits, a part number shown as written, and `expectNoSidewaysScroll`.

  The Offer sheet's helpers go in a file of their own beside `part-requests.ts`.
- [x] **Accessibility.** `expectAccessible` passes in the light and the dark scheme on:
  - the screen before an upload;
  - the screen with a refusal of a file;
  - the screen with a result of every kind;
  - the Part Request form started from a row, with a refusal shown.
- [x] **Motion.** The motion ticket 03 chose is filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- [x] **The inspector.** Taste's inspector runs on the screen and its result, in both schemes, at 1440, 768 and 390 pixels, and at 1024 and 1280 for desk layouts that change between them. It runs in Kurdish and English, with the made-up result and with `--offer-sheet-result worstCase|clean`. Every FAIL is fixed, and every WARN is fixed or defended under Comments.
- [x] **Gates.**
  - `pnpm check --skip-nx-cache` passes.
  - `pnpm boundaries:check`, run on its own since the dashboard gains a slice, passes.
  - `pnpm platform:check` passes, run with the apps stopped first.

## Comments

### 18 November 2026: built

On branch `sheet/04-a-vendor-uses-its-offer-sheet`, from `sheet/integration` at `fe4d83e`, tickets 01, 02, 03 and the 02b bound merged, built to ticket 03's record in `apps/dashboard/DESIGN.md` (d1 to d7).

**The screen.** A page slice of its own, `pages/offer-sheet`, mounted in `vendor-portal-screens.tsx` at `offer-sheet`, relative to the portal's frame, so the frame for acting as a Vendor serves it too, with the Part Request form from a row below it at `offer-sheet/rows/<row>/part-request` (d5). The Offer sheet is the portal's second section, after Offers, with lucide's `FileSpreadsheet`, lit while its screen and the form from a row are open (d1); the Offers screen leads to it from the start side of its count line, "Change many at once in your Offer sheet", and from its empty state, "Or fill in your whole stock in an Offer sheet". The screen is laid out as d2: its title and sentence, then the download, a Rule line and the upload in one column at most 40rem, "What the file holds" on Raised Stone beside them from 64rem, and the result under both; on a phone the three stand in a column, the result straight after the upload and the panel last.

- **Downloading** asks `downloadOfferSheet` in the portal's current language (i18next's), and saves the Blob under the name read from the answer's `Content-Disposition`, its `filename*` decoded as UTF-8, else its plain `filename` (`model/file-name.ts`). The sentence above the button says how many Offers the file holds, from the Offers screen's own count, which follows an upload. While the file is on its way the button says "Downloading…", keeps its width (`BusyLabel`), its mark turns, and it is disabled; a refusal, or an API that cannot be reached, is the refusal panel above it with `WhyNotAnsweredInThePortal`.
- **Uploading** is the browser's own file field (`accept` of `.xlsx` and its type), wearing the outlined "Choose the file", the chosen file's name beside it (`FileName`, a new shared piece that draws a file's name in its own direction with its last Latin word isolated left to right, `.xlsx` given no suffix), then "Upload the Offer sheet". While the file is on its way the field and the button are disabled, the button says "Uploading…" and its mark turns, and the status line names the file. Each of the five refusals of the file (`missing`, `tooLarge`, `notReadable`, `notTheLayout`, `tooManyRows`) is one sentence beside the field, the field's edge red and the field `aria-invalid`, naming no limit; the button pressed with no file chosen says `missing` there without asking the API. Any other refusal is the refusal panel above the button.
- **The result** (`UploadResult`, `SkippedGroup`) as d3 composes it: the Confirmed Green note with the rows read, applied and skipped and the four counts as words, each written by `formatNumber`; the rows skipped, the block's one red mark on its heading, grouped by problem in the order no Part, several Parts, the same Part twice, a cell that does not fit, each group's first ten rows and then "10 of 3,290 shown" and "Show 50 more" (d4); then the Offers added, each the link to its Offer, its Part `AlwaysEnglish`, and the rows applied by the tie-break. A skipped row gives its row number and its part number `AsWritten`, an isolated left-to-right run broken anywhere, and says its problem as DESIGN.md's States say it: a row that matched no Part its name as written, "Ask for it to be added", "Asked for" once sent, or that it was already asked for with "See your Part Requests" when `partRequestOpen` says so; several Parts how many hold the number, from `partCount`, the Parts named and "Search the catalog for <the part number>"; the same Part twice the Part and the other rows, ten and how many more; a cell that does not fit its column by the file's heading in the portal's language (`OfferSheetFile.headings`) and the reason as the Offer form says it (`OfferForm.refused`), or the sheet's own: a part number missing or too long, a word that is not yes or no, a cell that cannot be read.
- **The queries.** An upload asks the Vendor's Offers again through `askAgainAfterAChangeToTheOffers` and every query under `['parts']` again, as the result is shown.
- **A row to a Part Request.** `part-request-form` gains `partRequestFormValuesFromARow` (the name as written, the part number, both prices written as the portal shows them, the stock and the warranty, the Category left empty) and a `fromARow` start, whose line names the row and the file. "What happens next" moved down into the feature first, in a commit of its own (`8ba8f4b`), so that both screens of the form show it. The screen sends through `sendPartRequest`, says the form's own refusals, asks every query under `['part-requests']` again, marks the row asked for and returns to the result, scrolled to the row, with "Part Request sent for row 18." said by a region always in the page (`Announced`).
- **Words.** `OfferSheetScreen` (76 keys in English and Kurdish, 136 in Arabic), `VendorPortalFrame.offerSheet`, `OffersScreen.toOfferSheet` and `fillInAnOfferSheet`, and `PartRequestForm.fromARow`, in the dashboard set in the three languages, from ticket 03's drafted words (its `#words`), the Arabic completed: every sentence that counts has every plural form, Arabic's zero, one and two in words, and every count, row number and figure reaches a message as text written by `formatNumber`. The Kurdish and Arabic are drafts for LANG-7. `pnpm check`'s language step passes.

### 18 November 2026: what the record left open, settled

Ticket 03's record holds every piece; building them left these open. Each is written into DESIGN.md where it is a design choice.

1. Taken on the owner's standing instruction of 18 November 2026: a row of several Parts says how many Parts hold its number, counted from `partCount`, "81 Parts have this part number.", names those the result names, three of them and "Show the first 10" when it names more than four and more hold the number than it names, or "Show all 7 Parts" when it names them all, and once unfolded, "And 71 more, which the catalog search shows." (the screen says the true count and never offers to show Parts it cannot, as 02b's bound asks; the other options were "Show all 81 Parts" unfolding ten, which says what it does not do, and no count, which hides how many share a code such as "OC").
2. Taken on the owner's standing instruction of 18 November 2026: a row applied by the tie-break names its Part and is no link (the result gives no identifier of the Offer it applied to, `RowMatchedByYourOfferResponse` holding the row and the Part alone; the other options were a link to the Offers screen searched by the Part's name, which may list other Offers too, and asking the API for the identifier, a change to ticket 02's answer outside this ticket).
3. Taken on the owner's standing instruction of 18 November 2026: the result is kept in the page for the visit through the portal's other screens, until a reload loses it, one for each Vendor the Admin acts as (`model/kept-result.ts`, a store in the page with `useSyncExternalStore`), so that the Vendor can look at its Offers screen and come back to turn rows into Part Requests, as the seven steps of Seam 3 do (story 57; the other option was a result kept only while the Offer sheet's route is open, which the Offers screen's own section would lose; the API still stores nothing, and a reload loses it as the spec says).
4. Taken on the owner's standing instruction of 18 November 2026: the upload's status line says its words at once and opens its space as a form's refusal does, rather than taking room in one frame, and the result gives back the screen's gap above it while its space opens, so that on a phone "What the file holds" below them never moves in one frame (the No Snap Rule, which the film of the arrival proved; the other option was the status line's space kept always, an empty line under the button whenever no file is on its way).
5. Not an owner's choice, so not taken under the instruction: the button pressed with no file chosen says `missing` beside the field without asking the API, as the Offer form refuses a price that is not a number itself; a Part Request form opened at a row the page no longer keeps (after a reload) or already asked for leads back to the Offer sheet screen; the result's title takes the focus and draws no focus outline, being no control; and step 6 of the success criteria has the Admin create the Part and fulfil the request through the API, since `admin-part-requests.spec.ts` already drives the console's Create the Part, and this line proves the Offer the row's request makes.

DESIGN.md gained the first four in its States and Motion 13, and a line in its head comment; nothing of ADR-0011 is replaced.

### 18 November 2026: the end-to-end lines, written first

`apps/e2e/src/vendor-offer-sheet-languages.spec.ts`, in the 360-pixel window with the browser set to Arabic as written in Iraq, with the Offer sheet's helpers in a file of their own beside `part-requests.ts`, `offer-sheet.ts`: the download through Playwright's download event, with the API's answer to it; the file read and changed with ExcelJS, a cell found by its column and the language's yes copied from a cell the API wrote, never quoted; the upload through the file field, with the API's answer; and the result's locators. Every Vendor, Part and part number is made through the API, unique to the run; every line compares the screen with what the API answered. 12 lines:

- **Success criteria 9 and 10, in Kurdish, Arabic and English**, three lines with the seven steps of the spec's Seam 3: a made-up Vendor with two Offers of made-up Parts reaches the screen by its section, marked current, downloads its Offer sheet in the portal's language under the name the API gave in `Content-Disposition`, and the file holds their two rows; one price is changed, a row of a third made-up Part's part number and a row of a made-up part number nothing matches are added; the upload's result shows one Offer added naming its Part, one changed, one confirmed and one row skipped as no Part, as the API answered, and the screen's own count of the Offers the file holds follows, 2 to 3; the Offers screen shows the new price and the new Offer, as the API lists them; back on the screen, the result kept, the skipped row opens the Part Request form filled from the row (its name, part number, `95,000` dinars and 12 months, the Category empty), the section still current; the Category chosen and sent, the screen returns to the result with the row "Asked for", the API lists the request with the row's details, and the Vendor's Part Requests lists it; the Admin creates the Part with the row's part number and fulfils the request through the API, `created`, and the Shopper's page of the Part, in the line's language, lists the Vendor's Offer at 95,000 dinars, as `GET v1/parts/{partId}/offers` answers it (criterion 10); and the same file uploaded again applies all four rows, confirmed, with no skipped row.
- **A refusal**, in English: the screen before an upload meets WCAG 2.2 level AA in light and dark; the upload pressed with no file chosen says `missing` beside the field; a downloaded file whose first heading is changed is refused 400 `NOT_VALID` naming `offerSheet` with `notTheLayout`, said beside the field, which is `aria-invalid`, with no result; the screen with the refusal meets WCAG 2.2 level AA; and the Offer's price is unchanged, as the API lists it and as the Offers screen shows it. And, in Kurdish, a download held and then left unanswered: the button waits, disabled, and the refusal panel says it above the button, which takes a press again once it is said.
- **Several Parts and the same Part twice**, in English, a file of every kind (a row the tie-break applied, a number two CPUs hold, a Part named twice, a number nothing matches and "in stock" written as neither yes nor no): each skipped row is reported by its row number with its problem as the API answered, the tie-break's row names its Part, the several Parts' row counts 2 and names both, each same-Part row names the Part and the other row, the cell's column and reason are those the API gave; the result meets WCAG 2.2 level AA in light and dark (the screen with a result of every kind); and the several Parts' link opens the catalog search with the part number, which lists both Parts.
- **Language and layout**: the same result read in Kurdish, Arabic and English, by the switch, by `readInEveryLanguageOfTheVendorPortal`, which checks each language's direction, that the screen does not scroll sideways, the switch's place and that every digit is Western: the same rows in every language, their numbers in Western digits, the part number shown as written, left to right and kept apart, and a Kurdish name as written, right to left and kept apart.
- **The Part Request form started from a row, with a refusal**, in Arabic: the form filled from the row, sent with no Category, says the refusal beside the Category, which takes the focus, and meets WCAG 2.2 level AA in light and dark; its way back leads to the result kept.
- **Acting as the Vendor**: the development Admin opens the Vendor's portal at `offer-sheet` under the band, the section current, downloads and uploads a changed price, the result counted changed under the band, and the Vendor's own portal then shows the new price.
- **The way to the screen**: a Vendor with no Offer goes from the Offers screen's empty state to the screen, which says the file holds none, and with one Offer from the count line, which says one.
- **The motion**, with reduced motion and without (below).

**Red first.** Five of the lines were run before any code of the screen (`ticket-04/red-1.log`): each failed for the screen's absence, waiting for the section's link, the screen, the download button or the Offers screen's link, and the form's line in its set-up, which downloads the file. All 12 then passed once the screen was built, but for the language line, whose test read the rows in the API's order where the screen groups them by problem (the test was wrong, and was corrected to the screen's order, the groups', by row number within each), and the two films, which found two real snaps, below.

### 18 November 2026: the motion, filmed

Motion 13 as ticket 03 chose it (d6), built with the theme's own pieces and no library: the busy mark, lucide's `LoaderCircle`, turning one turn in 800 ms on a linear curve (`animate-spin` at 800 ms), still with reduced motion (`motion-reduce:animate-none`); the visit's first result arriving as a row does, the theme's `leaves` marked `data-arriving`, its space opening over 200 ms after 150 and then its fade, and with reduced motion its space over 150 ms and its fade; then the page moving to the result's head, smoothly or at once with reduced motion (`aScroll`), the head taking the focus; a later upload's result replacing it in place, at once; and "Show 50 more" adding one block of rows that arrives the same way. "Asked for" is drawn already asked for on the way back from the form, so nothing moves there.

Two lines film it with `film` and judge it with `snapsOf`, with reduced motion and without: a file of every kind with eleven more rows that matched no Part is uploaded, its answer held 1.2 s by `page.route`, then "Show 50 more" is pressed. They hold that the busy mark turns over several frames, and with reduced motion stays still; that the result's space opens over several frames and it fades in over several; that "What the file holds", below the result on a phone, never moves in one frame; that the result's head takes the focus; and that the block of two more rows opens and fades over several frames while the group below it never moves in one frame.

**The films found two snaps**, both fixed in the screen rather than the test:

- "What the file holds" moved 24 pixels in one frame as the result arrived: the screen's grid added its row gap above the result at once. On a phone the screen is now a column, whose gap above the result the result gives back while its space opens (`--gap-before`, as `OpeningSpace` gives back a form's gap); from 64rem it stays a grid, where nothing lies below the result.
- The group below moved 20 pixels in one frame once the last rows were shown: "Show 50 more" went, and its line shrank. The line keeps a control's height.

**The speed guard, scaled.** On a phone a result of every kind is thousands of pixels tall (3,344 in the film), and its space opens over the theme's 200 ms whatever its height, so the panel below it travels at up to 20 pixels a millisecond in the slowed film, over the guard of 6 made for a space of 300 pixels. No step of it is a snap by `snapsOf`'s first rule (its largest step about a tenth of its travel), and `snapsOf` judges each movement against its own size, so this film scales the guard to the space that opens, `fastestSmooth × max(1, height / 300)`. Defended here as a test of this ticket's own, not a weakened one; the stock guard still judges the block of "Show 50 more" and every other film.

### 18 November 2026: Taste's inspector

Under the e2e lock, this worktree's API (3001) and dashboard (3002) were started for the runs alone and stopped after, the dashboard's sheet restored into the worktree's `.taste-skill/`. `pnpm dashboard:inspect` opens addresses only, so the runs went through a scratch driver, `ticket-04/inspect-steps.ts` in the session's scratchpad: `apps/inspector/src/main.ts`'s own flow and modules, unchanged, which once each tab has landed on the screen takes steps before Taste's `inspect.mjs` looks, as ticket 03's capture and part-requests' code review did: `upload`, a made-up file chosen in the screen's own file field through the DevTools protocol (`DOM.setFileInputFiles`, "Offer sheet 2026-11-18.xlsx", or "خشتەی ئۆفەرەکان 2026-11-18.xlsx" in Kurdish) and uploaded with the screen's button, the made-up shop answering its result; `missing`, the button pressed with no file, so that the refusal is said beside the field; and `form`, the upload and then "Ask for it to be added" on row 18, which opens the Part Request form from the row. The portal is the Admin acting as the made-up shop's Vendor, `/vendors/00000000-0000-4000-8000-000000000001/portal/offer-sheet`. Each ran with `--app --widths 1440,1280,1024,768,390`, and the desk layouts were photographed again at 1280 and at 1024 alone, since the inspector keeps one picture of each kind. The reports and pictures are in the scratchpad's `sheet-04/inspect/`, `inspect-1280/` and `inspect-1024/`, for the owner's `.taste-skill/sheet-04/`.

| Run | Kurdish, light | Kurdish, dark | English, light | English, dark |
|---|---|---|---|---|
| The screen before an upload (`screen-*`) | 0 FAIL, 1 WARN | 0, 1 | 0, 2 | 0, 2 |
| A file refused beside the field (`missing-*`) | 0, 1 | 0, 1 | 0, 1 | 0, 1 |
| The made-up result (`result-*`) | 0, 0 | 0, 0 | 0, 0 | 0, 0 |
| `--offer-sheet-result worstCase` (`worst-*`) | 0, 0 | 0, 0 | 0, 0 | 0, 0 |
| `--offer-sheet-result clean` (`clean-*`) | 0, 0 | 0, 0 | 0, 0 | 0, 0 |
| The Part Request form from row 18 (`form-*`) | 0, 0 | 0, 0 | 0, 0 | 0, 0 |

The desk layouts photographed again at one width each (`inspect-1280/`, `inspect-1024/`):

| Run | At 1280 | At 1024 |
|---|---|---|
| The screen before an upload, English, light | 0 FAIL, 1 WARN | 0, 0 |
| The made-up result, English, light | 0, 0 | 0, 0 |
| The made-up result, Kurdish, dark | 0, 0 | 0, 0 |
| `worstCase`, Kurdish, light | 0, 0 | 0, 0 |

No run failed: 32 runs, each exiting 0.

**Defended, the WARNs** of the screen before an upload and with a file refused, all at 1440 and 1280 alone: `panel-void`, "1 card holds a blank band inside", 173 to 273 pixels, and in English `hero-void` at 1440, a third of the first screen empty below the upload's button. Both are Framed sheet's sheet running the window's height below a short screen, as part-requests' tickets 03 and 04 defended on the Vendor's Part Requests and the queue with one request or none: before an upload the screen holds its two jobs and its panel, and the result an upload brings fills the sheet (every result run is 0 WARN). Filling the sheet with something else would invent content the screen does not have.

**The pictures, looked at**: the made-up result's phone and desk pages in English (light) and Kurdish (light), the worst result's phone pages in Kurdish, the form from row 18 on a phone in English, the screen before an upload at 1440 in Kurdish, the result at 1024 in Kurdish, dark, and at 768 in English, dark. Kurdish runs right to left, the Part names, manufacturers and part numbers isolated left to right on the line's start side, and the chosen file's name with its day and `.xlsx` unreordered; the worst result draws ten rows a group with "10 of 3,290 shown" and "Show 50 more", "OC" with "81 Parts have this part number.", "Show the first 10" and its catalog search, part numbers of 100 code points broken inside their lines, and the longest added name wrapping whole. One fault was found in the pictures and fixed (`863909b`): the result's title, focused by the steps' scripted click, drew a focus outline as if it were a control; it no longer does.

### 18 November 2026: the fault checks

Each fault was planted on the committed tree (`863909b`) by one exact edit, its line run through `nx e2e @pcp/e2e` under the lock, and taken out by the inverse edit, `git status` clean before and after each, by a script in the session's scratchpad (`ticket-04/faults.py`):

| Fault | The line that failed, and why |
|---|---|
| An upload that does not ask the Vendor's Offers again (`askAgainAfterAChangeToTheOffers` left out) | Success criteria 9 and 10 in English: the screen's own count of the Offers the file holds stayed `2` where the upload's added Offer makes `3` |
| The file saved under the API's plain English name, its `filename*` not read | Success criteria 9 and 10 in Kurdish: saved as `Offer sheet 2026-11-18.xlsx` where the API named it `خشتەی ئۆفەرەکان 2026-11-18.xlsx` |
| The form from a row started without the row's IQD price | The form started from a row, in Arabic: its IQD price empty where the row gave `125,000` |
| The result put in at once, its space not opening (`leaves` taken off) | The motion, with full motion: "the result's space opens over several frames", 0 frames where more than 2 were due |

### 18 November 2026: the gates

On branch `sheet/04-a-vendor-uses-its-offer-sheet`, from `sheet/integration` at `fe4d83e`, which had not moved when this record was written, so merging it brought nothing. Every commit was gated on `pnpm check` before it was made, with the pieces not in it set aside (`8ba8f4b` the move of "What happens next"; `75b1ee8` the screen, its words and DESIGN.md, the end-to-end files set aside; `178594b` the end-to-end lines; `863909b` the result's title; `8f884f2` the Offers screen's count line, below). The ticket changes no API code, so `pnpm integration:check` was not its gate.

- **`pnpm boundaries:check`**, run on its own, nothing else running, since the dashboard gains a page slice, `pages/offer-sheet`, and the feature imports the Shared layer's new `FileName`: 131 lines passed, none failed.
- **`pnpm platform:check`**, under the e2e lock, the apps stopped first:
  - The first run, on `863909b`, passed 506 lines and failed 5, two older lines that the Offers screen's new link broke: `vendor-add-offer.spec.ts` took the empty state's one link, which now has two (Add your first Offer and the way to the Offer sheet); and `vendor-offers.spec.ts`'s four films of Confirm all on the Need confirming tab, where the count, wrapped below the link on a phone only while it said something, collapsed as the tab's last rows left, so the rows moved 20 to 24 pixels in one frame. `8f884f2` fixed the screen: on a phone the count takes the line below the link whatever it says, and keeps a line's height when it says nothing (DESIGN.md records it); and `vendor-add-offer.spec.ts` now finds Add your first Offer by its test id. Both files and this ticket's file then passed, but for one run of `vendor-add-offer.spec.ts` in which the Offer form's two fields were found empty after they were typed into, the form drawn again under them; the file passed whole when run again, a flake of that line's own, left as it is and reported as a follow-up.
  - The second run, on `8f884f2`: 511 lines passed, none failed, in 27.0 minutes, this ticket's 12 among them (499 on part-requests' fresh clone, and none was added since but these).
- **`pnpm check --skip-nx-cache`**, with every `*.tsbuildinfo` outside `node_modules` deleted first, on the tip with this record: passed, as the gate of this record's commit, which is made only when it passes.

**Checks on a phone, open, waiting for hosting** (the owner's rule of 16 October 2026; the spec's Open checks list them, and ticket 05 adds them to the MVP spec): the Offer sheet downloaded on an iPhone and on an Android phone and opened in the phone's spreadsheet app; prices and part numbers typed into it on a Kurdish and on an Arabic keyboard, then uploaded from the phone's files; the result read with a thumb, a long one among it, "Show 50 more" and a row turned into a Part Request; and the busy mark and the result arriving felt on a real phone, with reduced motion on and off.
