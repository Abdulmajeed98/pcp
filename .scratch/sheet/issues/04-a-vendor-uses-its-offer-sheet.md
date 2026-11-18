# 04: A Vendor downloads and uploads its Offer sheet, and asks for a skipped row's Part

**Spec:** [the sheet spec](../spec.md)

**What to build:** In its portal, a Vendor downloads its Offer sheet, changes it, uploads it, and reads the upload's result:

- what was added, changed and only confirmed;
- the rows applied by the tie-break;
- each skipped row, by its row number and why.

From a row that matched no Part, the Vendor asks for the Part to be added. The Part Request form is filled from the row, and the Vendor chooses the Category (SHT-6). The Admin acting as the Vendor does all of it under the band.

This completes success criterion 9 and, once the Admin fulfils that request, criterion 10, each proved end to end in a window 360 pixels wide, in Kurdish, Arabic and English. Everything is built to ticket 03's record.

**Blocked by:** 01, 02, 03

**Status:** ready-for-agent

- [ ] **The screen** at `offer-sheet`, relative to the portal's frame, reached as ticket 03 chose. Its address is relative to the route, so the frame for acting as a Vendor serves it too.
- [ ] **Downloading** asks `downloadOfferSheet` in the portal's current language, and saves the file under the name the API gives.
  - While the file is on its way, the button says so and cannot be pressed again.
  - A refusal, or an API that cannot be reached, is said with `WhyNotAnsweredInThePortal`.
- [ ] **Uploading** is a file field that takes .xlsx files, then a button.
  - While the file is on its way, the screen says so and nothing can be sent again.
  - Each refusal of the file is said beside the field in the portal's language, one sentence for each reason, and no limit's number is written.
- [ ] **The result,** kept in the page for the visit, as ticket 03 laid it out:
  - the counts, written by `formatNumber`;
  - the added Offers' Parts `AlwaysEnglish`;
  - the rows applied by the tie-break;
  - the skipped rows grouped by problem, each with its row number and its part number `AsWritten`, left to right.

  Each problem says what the spec's **The Vendor portal** says:
  - several Parts names each Part and leads to the catalog search with the part number;
  - the same Part twice names the other rows;
  - not valid names the column by the file's heading and says the reason as the Offer form does;
  - a missing part number says that an Offer whose Part has none is changed on the Offers screen.
- [ ] **The queries.** An upload asks the Vendor's Offers again through `askAgainAfterAChangeToTheOffers`, so that the Offers screen, its counts and the expiry banner follow. It also asks every query about Parts again.
- [ ] **A row to a Part Request.** The `part-request-form` feature gains a start from a row: its name, part number, both prices, stock and warranty, with the Category left for the Vendor to choose.
  - It opens as ticket 03 chose, and the result survives it.
  - It sends through `sendPartRequest`, says the same refusals as the form always does, and asks every query under `['part-requests']` again.
  - After a send, the row says it was asked for.
  - A row whose `partRequestOpen` is true says it was already asked for, with a link to the Vendor's Part Requests, and offers no second request.
- [ ] **Words.** Every new text is in the `i18n` library's dashboard set in all three languages:
  - every plural form is given, with Arabic's one and two in words;
  - no message formats a number;
  - the Kurdish and Arabic are drafts for LANG-7.
- [ ] **End to end, in a window 360 pixels wide.** Each test makes its own made-up Vendor, Parts and part numbers through the API. It downloads through Playwright's download event, reads and changes the file with the library, and uploads it through the file field. It compares the screen with the API and never quotes a translation. The lines are:
  - **criteria 9 and 10, in Kurdish, Arabic and English**, with the seven steps the spec's **Seam 3** lists, from the download to the same file applying the row once the Admin has fulfilled its Part Request and the Shopper's Part page lists the Offer;
  - **a refusal**: a file that is not the layout is refused beside the field, and the Offers screen is unchanged;
  - **several Parts and the same Part twice**, with the several Parts' link opening the catalog search;
  - **acting as the Vendor**: the Admin downloads and uploads under the band, and the Vendor's own portal shows the change;
  - **language and layout**: right to left in Kurdish and Arabic, Western digits, a part number shown as written, and `expectNoSidewaysScroll`.

  The Offer sheet's helpers go in a file of their own beside `part-requests.ts`.
- [ ] **Accessibility.** `expectAccessible` passes in the light and the dark scheme on:
  - the screen before an upload;
  - the screen with a refusal of a file;
  - the screen with a result of every kind;
  - the Part Request form started from a row, with a refusal shown.
- [ ] **Motion.** The motion ticket 03 chose is filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- [ ] **The inspector.** Taste's inspector runs on the screen and its result, in both schemes, at 1440, 768 and 390 pixels, and at 1024 and 1280 for desk layouts that change between them. It runs in Kurdish and English, with the made-up result and with `--offer-sheet-result worstCase|clean`. Every FAIL is fixed, and every WARN is fixed or defended under Comments.
- [ ] **Gates.**
  - `pnpm check --skip-nx-cache` passes.
  - `pnpm boundaries:check`, run on its own since the dashboard gains a slice, passes.
  - `pnpm platform:check` passes, run with the apps stopped first.

## Comments
