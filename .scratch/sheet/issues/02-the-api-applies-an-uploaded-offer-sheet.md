# 02: The API applies an uploaded Offer sheet and answers its result

**Spec:** [the sheet spec](../spec.md)

**What to build:** Through the API, a Vendor's own Login uploads its Offer sheet; the Admin can upload any Vendor's. The API:

- reads each row;
- matches the row to a Part by its part number (SHT-2);
- in one transaction, changes or creates the Vendor's Offer for each matched row, each one a Confirmation at the upload's moment (SHT-3, OFF-5).

Offers that no row names are left exactly as they were (SHT-4). Rows with a problem are skipped and the rest are applied. The answer is the upload's result (SHT-5). A row that matched no Part carries in the result everything it needs to become a Part Request, except the Category (SHT-6).

A file is refused whole, with nothing applied, when it:

- cannot be read;
- is too large;
- has too many rows;
- is not the platform's layout (SHT-7).

No screen shows any of this yet; ticket 04 builds it. For now, integration tests prove it, written before the code, as the MVP's testing strategy asks for matching rows to Parts.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] **Receiving the file.** `POST v1/vendors/{vendorId}/offer-sheet` takes a multipart form with one file, `offerSheet`, through `UploadOfferSheetCommand`. It asks `VendorAccessRule` first.
  - The file is received into memory, and one far over the limit is refused as it arrives, as a Part's photo is.
  - Multer's refusals get the answer the Command gives, through an interceptor of their own, as the photo's does.
  - The description gives the body as a multipart form.
- [x] **The whole file's refusals.** Each is 400 `NOT_VALID` with `field: 'offerSheet'`, checked in this order, and none changes an Offer:
  - `missing`;
  - `tooLarge`, over 5 MB;
  - `notReadable`;
  - `notTheLayout`;
  - `tooManyRows`, over 5,000 rows that are not empty.
- [x] **The layout, recognised.** The first worksheet's row 1 must hold, in each of columns A to F, its column's heading in any of the three languages, trimmed and with its case folded. Each column is matched on its own. Columns after F are ignored.
- [x] **Rows and cells,** as the spec's **Reading an upload** says:
  - empty rows are passed over and not counted;
  - a row is numbered by its row in the file;
  - each column is read as listed there;
  - a row's first problem, in the columns' order, is its one problem.

  Prices, stock and warranty go through `OfferDetails.check`, unchanged. The sheet's own reasons are `notYesOrNo` and `notReadable`.
- [x] **Matching,** with ticket 01's fold. Only valid rows are matched:
  - one Part holds the number: that Part;
  - several Parts hold it, and the Vendor offers exactly one of them: that Offer, listed under `matchedByYourOffer`;
  - several Parts hold it otherwise: `severalParts`, naming them all;
  - no Part holds it: `noPart`;
  - two or more rows match the same Part: every one is `samePart`, naming the others.

  Each of these is read once for the whole file: the catalog's matches, the Vendor's Offers for the Parts found, and the Vendor's open Part Requests' part numbers.
- [x] **Applying,** as the spec's **Applying the rows** says:
  - **One moment, one transaction.** The clock is read once, and every applied row's Confirmation is that moment. One transaction applies all the valid rows or none.
  - **No second copy.** Rows are written through the Offer module's own writing.
  - **Whole rows.** A row states its Offer whole, so an empty price or warranty cell clears it.
  - **The history.** A `created` history row is written by the Caller's Login. A `changed` row is written only when a price or the stock changed.
  - **A Vendor's add during an upload.** When the Vendor adds an Offer for a row's Part while the upload runs, the row replaces it rather than failing the upload.
  - **The counts:** added, changed and confirmed.
  - **Left alone.** A skipped row leaves its Offer unchanged and unconfirmed.
  - **A Deactivated Vendor's** Offers are changed by the Admin's upload.
- [x] **The result,** as the spec's **The upload's result** says:
  - `rows`, `added`, `changed`, `confirmed`, `matchedByYourOffer` and `skipped`, each skipped row with its `problem`;
  - `noPart` carries the row's name and checked details, and `partRequestOpen`;
  - a field a problem does not hold is left out, not null.

  `@pcp/api-client` exports the response types. The client's function is `uploadOfferSheet`, and `pnpm api-client:write` is run.
- [x] **The measure.** A file of 5,000 rows is uploaded against the development database, and its time goes under Comments. An index is added, with its migration from `pnpm db:generate`, only if the measure asks for one.
- [x] **Tests, before the code, at seam 2,** as the spec's **Reading an upload**, **Matching** and **Applying** lines list them. Each test builds its file in memory with the library. Among them:
  - every whole-file refusal, and exactly 5,000 rows applied;
  - headings in each language and mixed;
  - every cell's reading, Arabic-Indic digits among it;
  - every reason a row is not valid;
  - every outcome of matching, the tie-break and `partRequestOpen` among them;
  - the round trip of a downloaded file uploaded unchanged, a Part whose every number another Part holds among it;
  - added, changed and confirmed, with the Offer history read by `offerHistoryRows()`;
  - whole rows;
  - an Expired Offer visible again through `GET v1/parts/{partId}/offers`;
  - Offers left alone;
  - a Deactivated Vendor's upload;
  - who may upload;
  - a `noPart` row's details accepted by `POST v1/vendors/{vendorId}/part-requests` with a Category, and the same file applying that row once the Admin has fulfilled the request.
- [x] **Two named exceptions,** in the test database's helpers, each named in the file beside the others:
  - the eighth, which makes the database refuse one row's write, proving an upload changes no Offer and writes no history row when one write fails;
  - the ninth, built on `changeWhileReading` as `sentWhileTheVendorAddsAnOffer` is, which adds the Vendor's Offer while the upload runs, proving the upload succeeds and the row replaces it.
- [x] **Seam 1.** The committed description and the client include the new endpoint. A field added to the result without `pnpm api-client:write` is seen to fail once, then reverted.
- [x] **Gates.** `pnpm check --skip-nx-cache` and `pnpm integration:check` pass.

## Comments

### 18 November 2026: built

On branch `sheet/02-the-api-applies-an-uploaded-offer-sheet`, from `sheet/integration` at `e184dbd`, ticket 01 merged.

**The endpoint.** `POST v1/vendors/{vendorId}/offer-sheet`, `uploadOfferSheet` in the client, `@PreAuthorize([Role.ADMIN, Role.VENDOR])`, answers 200 with `OfferSheetResultResponse`. Multer's `FileInterceptor('offerSheet')` receives the file into memory and stops one over 7 MB as it arrives, 2 MB over the limit, as the photo's upload does, so that a file somewhat over 5 MB is still refused by the Command naming the field. `OfferSheetUploadErrorsInterceptor`, an interceptor of its own placed outside Multer's, gives Multer's refusals the Command's answer: `PayloadTooLargeException` is `tooLarge` and `BadRequestException` (a file under another name, a malformed form) is `missing`. The description gives the body as a multipart form with the binary `offerSheet` required.

**The domain**, in `domain/offer-sheet/`:

- `UploadOfferSheetCommand`, with its Input and Output, asks `VendorAccessRule` first, then refuses the whole file in the ticket's order (`offerSheetRefused`, 400 `NOT_VALID` with `field: 'offerSheet'`): `missing`; `tooLarge`, over `largestOfferSheetBytes`, 5 × 1024 × 1024; `notReadable`, when the port answers none; `notTheLayout`, by `isTheLayout`; and `tooManyRows`, over `mostRowsOfAnOfferSheet` rows that are not empty. It reads each row, matches the valid ones, reads the clock once and applies the matched rows, and answers `OfferSheetResult`.
- `offer-sheet-layout.ts` gains `isTheLayout` (each of A to F its column's heading in any of the three languages, trimmed, its case folded, each column on its own) and `inStockSaidBy` (yes or no in any language). Both read `@pcp/i18n`'s words when they are called and never as the module loads: under `@swc-node/register`, which `pnpm api-client:write` runs the API with, the library's JSON message files load as undefined, and a reading at load stopped the description's writing (see Follow-ups).
- `offer-sheet-row.ts`, the reading of a row (`checkedRow`, `isEmptyRow`): each cell by the kind of value it holds, as the spec's **Reading an upload** says; the part number's own reasons, `missing` and `tooLong` (over `longestPartRequestPartNumber`), checked first; then the prices, the stock and the warranty through `OfferDetails.check`, unchanged, after the cells are read; the sheet's own reasons `notYesOrNo` and `notReadable`.
- `offer-sheet-matching.ts` (`matchedRows`): the fold of ticket 01, `foldedPartNumber`, on both sides; one Part; the tie-break, the one Part of several the Vendor offers, listed under `matchedByYourOffer`; several Parts otherwise; no Part, with `partRequestOpen` by the fold; and, compared last, every row of a Part that two or more rows matched skipped as `samePart`, naming the others.
- `OfferSheetResult.ts`: `AddedOffer`, `RowMatchedByYourOffer`, and the four kinds of skipped row, `RowWithNoPart`, `RowWithSeveralParts`, `RowOfTheSamePart` and `OfferSheetRowNotValid`.
- The ports: `OfferSheetFile.read(file)`, the first worksheet's rows as `OfferSheetRead`, or none when it is not an .xlsx file that can be read within bounds; `OfferSheetStore.readMatchesOf(vendorId, foldedPartNumbers)` and `apply(params)`.

**The infrastructure**, in `infrastructure/offer-sheet/`:

- `DatabaseOfferSheetStore.readMatchesOf` reads, in one read-only snapshot, the three things read once for the whole file: every Part holding one of the file's part numbers, with its photo, in the catalog's order (Category, name, identifier), narrowed by `lower` as ticket 01's read is, the fold deciding; the Vendor's Offers among those Parts; and the part numbers of the Vendor's open Part Requests, read through the Part Request module's table.
- `DatabaseOfferSheetStore.apply` writes every matched row in one transaction through the Offer module's own writing, `offer-writing.ts`, with no second copy: it holds the Vendor's Offers for the rows' Parts at once with `holdTheOffers`, new beside `holdTheOffer` (which now calls it), and `HeldOffer` gains `warrantyMonths`, so that the Command can tell changed from confirmed; then, for each row, `replaceTheDetailsOf` an Offer held, or `writeANewOfferUnlessOneIsThere` and, when the Vendor's own add committed meanwhile, `holdTheOffer` it as it now stands and replace it. An Offer that came and went again between the two is thrown, so that the transaction puts back every row it wrote, and answered as a server error. The rows are written in the file's order: two uploads at once for one Vendor wait for each other on the Offers held first, and should two make the same new Offers in opposite orders, the database finds the deadlock and refuses one, which changes nothing. (They were first written in the order of their Parts' identifiers, against that deadlock; that order is random to the file, so the refused row of the all-or-none test was sometimes written first, and the fault that took the transaction away passed the test. `41d0f93` put them in the file's order.)
- `ExcelJsOfferSheetFile.read` and `bounded-archive.ts`, below under the crafted files.
- `OfferSheetResultResponse`, `AddedOfferResponse`, `RowMatchedByYourOfferResponse` and `SkippedRowResponse`, one class for the four problems with every field a problem does not hold left out, as `PartRequestResponse` leaves out its state's fields; `@pcp/api-client` exports the four.

**What the spec does not settle, and what the code does.** None of these is a choice the ticket gives the owner, so none was taken under the standing instruction; each is in one place and can be changed there.

- **Multer comes before the rule for a file far too large.** Guards run before interceptors, so no token is still 401 and a Vendor's token still needs its role; but a file over 7 MB is refused `tooLarge` as it arrives, before `VendorAccessRule` is asked, so a Vendor sending one to another Vendor's address is answered 400, not 403. Every other refusal comes after the rule: a form with no file sent to another Vendor's address is 403 `VENDOR_ACCESS_DENIED`. A Part's photo is refused the same way, its endpoint the Admin's alone.
- **Cells the spec's list does not name.** TRUE or FALSE where text is read (a part number, a name, a price typed as text) is read as the word `TRUE` or `FALSE`, so that a price is `notANumber` and a part number matches no Part; a number in "in stock" is `notYesOrNo`; a date, which the platform never writes, is `notReadable` in its column; text of nothing but spaces is an empty cell, so a row of spaces is passed over; rich text is read joined, and a hyperlink by its text.
- **The first cell that does not fit.** A cell refused as it is read (`notReadable`, `notANumber`, `notYesOrNo`) stands in as fitting while `OfferDetails.check` checks the cells before it, and the earlier of the two in the columns' order is the row's problem. So a row with no USD price and an IQD cell holding `#DIV/0!` is `iqdPrice`, `notReadable`, not `usdPrice`, `missing`: the row has a price the platform cannot read, not no price.
- **The part number as written** is the cell's text, its error text for an error cell (`#REF!`), and empty for an empty cell.
- **A zip archive with no `xl/workbook.xml`**, such as an .ods or an .xlsb, is `notReadable`, as the spec lists the .ods; a workbook with no worksheet is `notTheLayout`, its first row holding no heading.
- **The ninth named exception** is a helper of its own, as the ticket asks, though `sentWhileTheVendorAddsAnOffer` would have served: `uploadedWhileTheVendorAddsAnOffer` adds the Vendor's Offer with every detail an Offer holds, its IQD price and warranty among them, so that the test sees the row replace each; both write the add through one function, `theVendorsOwnAdd`, with no second copy of its SQL. The eighth, `whileTheDatabaseRefusesTheOfferOf`, plants a rule on `offer` that the Vendor's Offer for one Part breaks, `NOT VALID` so that only writes are checked, as `whileTheDatabaseRefusesEveryVendor` plants one on `vendor`.

### 18 November 2026: a crafted file, refused or read without taking the API down

Ticket 01 left two findings to this ticket, and the reading here found three more of the second kind.

**Unpacking, bounded.** ExcelJS bounds nothing it unpacks. So `ExcelJsOfferSheetFile.read` hands it nothing it has not first unpacked itself, in `bounded-archive.ts`, with Node's own zlib and no dependency:

- the archive's central directory is read by hand, from its last end record, and an archive that uses the zip64 extension, lists a name twice, encrypts a part or packs one in any way but stored or deflated, or points past the file's end, is not read;
- of its parts, only those ExcelJS reads for a workbook's cells are unpacked: `xl/workbook.xml`, its relationships, `xl/sharedStrings.xml`, `xl/styles.xml` (which tell a date from a number) and `xl/worksheets/sheetN.xml`; pictures, comments, drawings, tables and themes are set aside unread;
- each deflated part is inflated with `zlib.inflateRaw` told to stop at `maxOutputLength`, what is left of a bound of 8 MiB for all of them together, and the sizes the archive declares are never read, so a forged size changes nothing;
- the parts are then handed to ExcelJS in a new archive of their own, written by hand, each stored as it was unpacked, so that ExcelJS's own unzipping (JSZip) reads nothing that was not bounded. A file with no workbook part is not an .xlsx file.

The bound, 8 MiB, is four times what the platform's own Offer sheet of 5,000 rows unpacks to: 1.38 MB of worksheet and 0.56 MB of shared strings, measured on ExcelJS's own file. Measured on ExcelJS 4.4 with every worksheet node but the cells set aside, a worksheet of 16 MiB of the densest content (a million empty rows, or numbers in six columns) took 0.6 to 0.7 s and at most 670 MB of the process at its peak; 4 MiB took 0.15 s and 345 MB. A legitimate file of more rows than the bound holds is `notReadable` rather than `tooManyRows`: past 8 MiB, a file is "a crafted file that unpacks past the library's bounds" whatever made it so.

**What ExcelJS spreads over every cell, set aside.** ExcelJS's reader spreads a range over each cell it covers in four places, each of which a file of a few kilobytes can aim at the whole worksheet, `A1:XFD1048576`: a list a cell is chosen from (ticket 01's finding), a merge (`_mergeCellsInternal`), a column's width (`Column.fromModel`, up to `max`) and a defined name (`CellMatrix.addCellEx`, the workbook's). An upload reads cells alone, so all are set aside rather than bounded: ExcelJS's own `ignoreNodes` option names every node of a worksheet that its `WorkSheetXform` reads but `sheetData`, and the workbook's `<definedNames>` are cut from its part by plain search, not a pattern, so that a crafted part cannot make the cutting slow. A list over a whole column, which a Vendor's own spreadsheet program writes when "in stock" is set on column E, is then read as fast as the platform's own `E2:E5001`.

Taken on the owner's standing instruction of 18 November 2026: the validations, merges, column widths and defined names of an uploaded file are set aside, and the file read, rather than bounded and the file refused as `notReadable` (setting them aside costs nothing a reading of cells needs, and keeps a Vendor's file whose list covers a whole column uploading; the other option was a bound on the cells a range may cover, past which the file is refused, which would refuse such a Vendor's file or let a bound of hundreds of thousands of cells cost seconds and hundreds of megabytes). So the test of a list over `A1:XFD1048576` expects the file read at once and its row applied, where the orchestrator's note expected `notReadable`; the unpacking's two tests expect `notReadable`.

**Proved at seam 2**, in `offer-sheet.controller.reading.integration-spec.ts`, "a crafted file". The API under test runs in the test's own process, so a test sees the process's memory too, sampled every 5 ms while the API answers:

- a file of about 1 MB whose worksheet unpacks to a gibibyte (the test deflates it in pieces as it makes it, never holding it all) is refused `notReadable` within 5 s, the process holding under a quarter of a gibibyte more at its peak, and the API then answers the Vendor's Offers and its download;
- the same with the sizes the archive declares forged to 5,000 bytes;
- a file of under 8 KB whose list covers `A1:XFD1048576` is read within 5 s and its row applied, and the API answers afterwards;
- a file whose worksheet merges `G1:XFD1048576`, sizes columns 1 to 2,000,000,000, links and formats `A1:XFD1048576`, and whose workbook names `Offers!$A$1:$XFD$1048576` twice, the print area among them, is read within 5 s and its row applied.

**Seen red first**, against a reading that handed the file to ExcelJS as it came, before the bound and the setting aside were written, each test run on its own under a watchdog that stopped it after a time limit (`ticket-02/red-crafted.sh` in the session's scratchpad):

- the gibibyte: refused `notReadable`, since Jest's process has a larger heap than ticket 01's check gave and JSZip's text of a gibibyte passes V8's longest string, which throws, but the process held 1,275,166,720 bytes more at its peak, against the quarter of a gibibyte the test allows;
- the forged sizes: passed, the memory not seen to grow in Jest's process, so its proof is the fault below that unbounds the unpacking;
- the list over the whole worksheet: still reading when the watchdog stopped it at 120 s;
- the merges, widths and names: the whole Jest process ended in 18 s with "FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory", the API and the test with it.

All four passed once `bounded-archive.ts`, `ignoreNodes` and the cutting of the defined names were in.

### 18 November 2026: the measure

A file of 5,000 rows uploaded against the development database, through the API over HTTP as the Admin, from a throwaway test in the API's ignored `tmp` (removed; a copy is in the session's scratchpad, `ticket-02/upload.measure.ts`), which ran the API on the development database with a Keycloak stand-in for the Admin's token. The catalog then held 38,051 Parts with 51,708 part numbers, 25,974 of the Parts imported.

- The rows named 5,000 made-up Parts that earlier end-to-end runs left ("Made-up test Part …"), each holding one part number no other Part holds, for a deactivated made-up Vendor of theirs, "Made-up test Vendor 1792166992644842" (`34ceb758-a1ac-4ebc-9043-4f65d44173d9`), which had no Offer, so that no Shopper's page shows what the upload wrote. Its 4,664 Offers and their `created` history rows, by the made-up Login `00000000-0000-4000-8000-00000000f1e5`, stay in the development database as plainly test data, which `pnpm services:reset` clears.
- Reading the file: 93 ms. The one read of the matches (the Parts, the Vendor's Offers among them and its open Part Requests, in one snapshot): 257 ms.
- The first upload: 5,032 ms, 4,664 Offers added and 336 rows skipped (the measure's own prices, `100 + index / 100`, are binary fractions such as 100.28999999999999, which a number cell gives as written and `OfferDetails` refuses as `tooManyDecimals`). The same file again: 2,765 ms, the 4,664 confirmed.

So no index is added and no migration made: the matching read takes a quarter of a second at the catalog's size, and the upload's time is its writing, one Offer at a time through the Offer module's own writing, two statements for each Offer added and one or two for each replaced, in one transaction. Five seconds for a file of the upload's whole limit is within what the portal's "on its way" covers; a form of the Offer module's writing that writes many Offers in one statement is where to start should the hosting work find it slow.

### 18 November 2026: the integration tests

Three files in `apps/api/src/test/infrastructure/offer-sheet/endpoints/`, 50 tests, with what they share in `offer-sheet-uploads.ts`: each file built in memory, with ExcelJS as a Vendor's program could save it (`anOfferSheet`) or, for a file no library would write, part by part (`anArchiveOf`, `aWorkbookAround`, `aWorksheet`, `aWorksheetOfAGibibyte`); and the calls to the platform (`thePlatformUnderTest`). Every word of the file is `@pcp/i18n`'s, never quoted. Nothing is mocked but the API's clock.

- `offer-sheet.controller.applying.integration-spec.ts`, 12 tests: added, with its `created` row by the Caller's Login, the Vendor's own and the Admin's; changed, with a `changed` row; the warranty alone changed with no history row; confirmed with none; whole rows, an empty USD cell and an empty warranty cell clearing them; an Expired Offer a Visible Offer at once through `GET v1/parts/{partId}/offers`, 0 days since its Confirmation; an Offer no row names, and one named only by a skipped row, left with its details and its Confirmation; another Vendor's Offer for the Part left alone; all or none under the eighth named exception, 500 `INTERNAL_SERVER_ERROR` with every Offer and the history as they were; the Vendor's own add under the ninth, the upload 200 and the row replacing the Vendor's Offer, counted changed, its history `created` by the Vendor then `changed` by the Admin; and a Deactivated Vendor's Offers changed and added by the Admin's upload, hidden from Shoppers until its reactivation.
- `offer-sheet.controller.reading.integration-spec.ts`, 26 tests: every whole-file refusal in its order, each changing no Offer (no file and a file under another name; over 5 MB; far over 5 MB, as it arrives; a .csv, an .xls, an .ods and a picture; headings moved, misspelt, left out or on row 2; 5,001 rows, and the same with a heading misspelt answered `notTheLayout` first); exactly 5,000 rows applied, empty rows between them not counted; the four crafted files above; headings in each of the three languages, with that language's yes and no, and mixed from the three with space and case changed beside a column G of notes; empty rows, a row of spaces and a row of notes after F passed over and not counted, each row numbered by the file; Arabic-Indic and Eastern Arabic-Indic digits and the Arabic decimal separator in prices, the warranty and part numbers; thousands separators typed, and a USD number cell of 349.99; yes and no in each language and any case, and TRUE and FALSE; a formula's saved value, an error cell and a formula saved with no value; every reason a row is not valid in its column, its Offer left unchanged and unconfirmed; the first problem in the columns' order; the part number as cleaned or as written; and who may upload.
- `offer-sheet.controller.matching.integration-spec.ts`, 12 tests: one Part whatever the case and with invisible marks pasted in; a prefix or a hyphen added matching no Part; a Part created from a Part Request; several Parts named in the catalog's order; the tie-break, under `matchedByYourOffer`; several Parts where the Vendor offers two; no Part with its name and details as checked; `partRequestOpen` true for an open request in another case, false for a rejected one and another Vendor's; the same Part twice, by one number three times and by two numbers of one Part; two rows the tie-break matched to one Offer; the round trip, a file downloaded in Kurdish and uploaded unchanged confirming every row, a Part whose every number another Part holds under `matchedByYourOffer`, and the row of a Part with none skipped as `partNumber`, `missing`; and a row that matched no Part sent as a Part Request with a Category, said open on the next upload, and applied once the Admin has fulfilled the request.

**Red first.** The applying file was written before any code of the upload and run red: all 12 failed on Nest's own 404 for an address with no route, the ninth exception's test also seeing no upload wait for the Vendor's add. The reading and matching files were written after the domain's reading and matching, which the applying tests needed, so most of their tests passed when first run; the two that did not were red for the ticket's reasons, the .ods answered `notTheLayout` where `notReadable` was due, and the crafted files above. Each of their rules was then shown held by a fault planted on the committed tree (below).

### 18 November 2026: the fault checks

Each fault was planted on the committed tree (`b4dc106`, and the later commits where said) by one exact edit, its tests run, and taken out by the inverse edit, `git status` clean after each, by scripts in the session's scratchpad (`ticket-02/faults.py` and, for the two whose tests hang or end the process, `ticket-02/faults-that-hang.py` under the watchdog of `red-crafted.sh`).

- **Seam 1, a field added to the result without `pnpm api-client:write`**: `readonly planted: number = 1` with its `@ApiProperty` in `OfferSheetResultResponse`. `openapi.spec.ts`, the API's test that `pnpm check` runs, failed "is what is committed, so that the client is never generated from a stale one", and the other five of the file passed. A first try planted `readonly planted = 1` with no type, which made `@nestjs/swagger` refuse to describe the class at all and failed all six; it was taken out and planted again with its type, so that the test fails for the reason the ticket names.
- **The unpacking unbounded**: zlib's `maxOutputLength` taken out of `partsUnpacked`. Both tests of the gibibyte failed on the memory the process held at its peak, 2,139,340,800 bytes more with the honest sizes and 476,037,120 with the forged ones, against a quarter of a gibibyte; the other two crafted files passed.
- **A worksheet's nodes read**: `ignoreNodes: []`. The test of the list over the whole worksheet was still reading when the watchdog stopped it at 90 s.
- **The defined names kept**: the workbook's part handed to ExcelJS as it came. The test of the merges, widths and names ended the whole Jest process in 20 s, "JavaScript heap out of memory", though every worksheet node but the cells was still set aside: the cutting of the defined names is needed on its own.
- **The headings and the yes and no in English alone**: the tests of the Kurdish headings, the Arabic ones, the mixed ones, and of yes and no in each language failed; the English headings passed.
- **Empty rows counted**: the test of empty rows, a row of spaces and a row of notes failed, and the 5,000 rows with empty rows between them were refused as too many.
- **No stand-in for a cell that could not be read**: the test of the first problem in the columns' order failed, an IQD price of `#DIV/0!` beside no USD price answered `usdPrice`, `missing`; so did the test of every reason, an IQD price of `abc` beside no USD price answered the same.
- **A part number's digits left as typed**: the test of Arabic-Indic digits failed, `MU-٠٠٤٢` matching no Part.
- **No tie-break**: the tie-break's test, the test of two rows it matched to one Offer, and the round trip failed; the other nine tests of the file passed.
- **The same Part twice not compared**: the test of the same Part twice, by one number three times and by two numbers, and the test of two rows the tie-break matched to one Offer failed, the rows applied instead of skipped.
- **An open Part Request's number not folded**: the test of `partRequestOpen` in another case and the test from a row to an Offer failed, each answering false. Planted first on `b4dc106`, the fault passed the first of them, whose request was sent in lower case and its row written in upper case, so that only the row's side was folded; `825319c` sends the request in upper case and writes the row in lower case, and the fault planted again on it failed both.
- **The rows written outside the upload's transaction**: planted first by handing each row's writing the pool rather than the transaction, the test ran out of time instead, the upload waiting on the very Offers its own transaction held, which is not the ticket's reason, so it was taken out. Planted then by taking the transaction from the whole of `apply` (`const transaction = this.databaseProvider.getClient()` inside its callback), it passed on `825319c`: the rows were written in the order of their Parts' identifiers, and the refused row came first in that run, before any other write. `41d0f93` writes them in the file's order, and the fault planted again on it failed the test, the first two Offers changed and confirmed at the upload's moment.
- **The Vendor's own add failing the upload**: the test of the Vendor's own add failed, the upload answering 500 where 200 was due.

### 18 November 2026: the gates

- On branch `sheet/02-the-api-applies-an-uploaded-offer-sheet`, from `sheet/integration` at `e184dbd`, in four commits, each gated on `pnpm check` and `pnpm integration:check` before it was made: `b4dc106` the upload, its tests, the description and the client (`feat`, no scope, since it changes `apps/api` and `libs/api-client`); `825319c` the fold of an open Part Request's number held from both sides in its test; `41d0f93` the rows written in the file's order; and this record.
- `pnpm integration:check` passed 802 tests in 32 files on each, 752 in 29 before this ticket and its 50 in three files.
- On the tip, with every `*.tsbuildinfo` outside `node_modules` deleted first: `pnpm check --skip-nx-cache` passed, and `pnpm integration:check` passed, 802 tests in 32 files.
- `sheet/integration` had not moved since `e184dbd`, so merging it into the branch brought nothing.

The ticket runs no end-to-end test and changes no screen, so `pnpm platform:check` is not its gate. It adds no migration, no dependency and no import between projects, so `pnpm boundaries:check` was not asked for.

### 18 November 2026: follow-ups found, outside this ticket

- **A result that grows as the square of its rows.** Each row skipped as the same Part twice names every other row of that Part, as the spec asks. A file of 5,000 rows naming one Part, 30 KB, was answered in 585 ms with a result of 120,640,086 characters, and the API's process held 842 MiB more at its peak (a throwaway test against the test database, removed). Bounding it, say by naming at most a few other rows and letting the portal group the rows by their Part, which every row of the result already names, is a change to the module's spec, so it is the owner's; ticket 03 meets it in its worst case.
- **`@pcp/i18n`'s message files under `@swc-node/register`.** The runner `pnpm api-client:write` runs the API with loads the library's JSON message files as undefined (a throwaway script printed the three languages with `dashboardMessages.en` undefined), so a reading of the words as a module loads stopped the description's writing. The layout reads them only when it is called; the runner, or the library's JSON imports, may want looking at before the words are read elsewhere at load.
