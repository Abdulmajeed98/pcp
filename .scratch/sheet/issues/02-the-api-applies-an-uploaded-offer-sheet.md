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

- [ ] **Receiving the file.** `POST v1/vendors/{vendorId}/offer-sheet` takes a multipart form with one file, `offerSheet`, through `UploadOfferSheetCommand`. It asks `VendorAccessRule` first.
  - The file is received into memory, and one far over the limit is refused as it arrives, as a Part's photo is.
  - Multer's refusals get the answer the Command gives, through an interceptor of their own, as the photo's does.
  - The description gives the body as a multipart form.
- [ ] **The whole file's refusals.** Each is 400 `NOT_VALID` with `field: 'offerSheet'`, checked in this order, and none changes an Offer:
  - `missing`;
  - `tooLarge`, over 5 MB;
  - `notReadable`;
  - `notTheLayout`;
  - `tooManyRows`, over 5,000 rows that are not empty.
- [ ] **The layout, recognised.** The first worksheet's row 1 must hold, in each of columns A to F, its column's heading in any of the three languages, trimmed and with its case folded. Each column is matched on its own. Columns after F are ignored.
- [ ] **Rows and cells,** as the spec's **Reading an upload** says:
  - empty rows are passed over and not counted;
  - a row is numbered by its row in the file;
  - each column is read as listed there;
  - a row's first problem, in the columns' order, is its one problem.

  Prices, stock and warranty go through `OfferDetails.check`, unchanged. The sheet's own reasons are `notYesOrNo` and `notReadable`.
- [ ] **Matching,** with ticket 01's fold. Only valid rows are matched:
  - one Part holds the number: that Part;
  - several Parts hold it, and the Vendor offers exactly one of them: that Offer, listed under `matchedByYourOffer`;
  - several Parts hold it otherwise: `severalParts`, naming them all;
  - no Part holds it: `noPart`;
  - two or more rows match the same Part: every one is `samePart`, naming the others.

  Each of these is read once for the whole file: the catalog's matches, the Vendor's Offers for the Parts found, and the Vendor's open Part Requests' part numbers.
- [ ] **Applying,** as the spec's **Applying the rows** says:
  - **One moment, one transaction.** The clock is read once, and every applied row's Confirmation is that moment. One transaction applies all the valid rows or none.
  - **No second copy.** Rows are written through the Offer module's own writing.
  - **Whole rows.** A row states its Offer whole, so an empty price or warranty cell clears it.
  - **The history.** A `created` history row is written by the Caller's Login. A `changed` row is written only when a price or the stock changed.
  - **A Vendor's add during an upload.** When the Vendor adds an Offer for a row's Part while the upload runs, the row replaces it rather than failing the upload.
  - **The counts:** added, changed and confirmed.
  - **Left alone.** A skipped row leaves its Offer unchanged and unconfirmed.
  - **A Deactivated Vendor's** Offers are changed by the Admin's upload.
- [ ] **The result,** as the spec's **The upload's result** says:
  - `rows`, `added`, `changed`, `confirmed`, `matchedByYourOffer` and `skipped`, each skipped row with its `problem`;
  - `noPart` carries the row's name and checked details, and `partRequestOpen`;
  - a field a problem does not hold is left out, not null.

  `@pcp/api-client` exports the response types. The client's function is `uploadOfferSheet`, and `pnpm api-client:write` is run.
- [ ] **The measure.** A file of 5,000 rows is uploaded against the development database, and its time goes under Comments. An index is added, with its migration from `pnpm db:generate`, only if the measure asks for one.
- [ ] **Tests, before the code, at seam 2,** as the spec's **Reading an upload**, **Matching** and **Applying** lines list them. Each test builds its file in memory with the library. Among them:
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
- [ ] **Two named exceptions,** in the test database's helpers, each named in the file beside the others:
  - the eighth, which makes the database refuse one row's write, proving an upload changes no Offer and writes no history row when one write fails;
  - the ninth, built on `changeWhileReading` as `sentWhileTheVendorAddsAnOffer` is, which adds the Vendor's Offer while the upload runs, proving the upload succeeds and the row replaces it.
- [ ] **Seam 1.** The committed description and the client include the new endpoint. A field added to the result without `pnpm api-client:write` is seen to fail once, then reverted.
- [ ] **Gates.** `pnpm check --skip-nx-cache` and `pnpm integration:check` pass.

## Comments
