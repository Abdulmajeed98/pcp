# 01: The API gives a Vendor its Offer sheet

**Spec:** [the sheet spec](../spec.md)

**What to build:** Through the API, a Vendor's own Login downloads its Offer sheet in the language it asks for. The file is an .xlsx file with one row for each of the Vendor's Offers, Expired Offers among them (SHT-1). The Admin can download any Vendor's, as when acting as it. Each row gives:

- the part number that names that Part;
- the Part's name in English;
- the Quoted Prices;
- in stock, as yes or no in the file's language;
- the warranty.

The file's layout is written once, for this download and for ticket 02's upload.

Before anything is installed, the file library is researched, and the owner chooses it. The ticket stops at that point until the owner has chosen.

No screen shows the download yet; ticket 04 builds it. For now, integration tests prove it, written before the code: each one downloads a file and reads it.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] **The library, chosen by the owner, before anything is installed.**
  - **Research.** Research against current sources, as the spec's **The library** says, and recommend one library. Name the most widely used, and say how its adoption compares with the others. SheetJS's `xlsx` and ExcelJS are expected to be weighed. Confirm or correct the spec's note on the npm registry's `xlsx`.
  - **A throwaway check in the session's scratchpad**, for each candidate, showing whether it:
    - loads in the API's Jest and in the built API, CommonJS both;
    - writes text, number and boolean cells, a number format, a list a cell is chosen from, a frozen first row and a right-to-left worksheet;
    - reads each cell's kind and a formula's saved value;
    - refuses a crafted file that unpacks past its bounds, within memory and time;
    - meets the workspace's minimum release age with no exception;
    - has an install script, and if so, what it does.
  - **The owner chooses.** The recommendation and the check's findings go under Comments, and work stops until the owner chooses. The choice and its date go under Comments.
- [x] **The term, before any code.** CONTEXT.md gains **Offer sheet**, as the spec defines it. Its words to avoid are spreadsheet, Excel file, export, import, price list and CSV, and "sheet" is never written alone. `words.md` gains the term and the file's words, with the Kurdish and Arabic as drafts under LANG-7.
- [x] **The file's words.** The dashboard set gains, under a heading of its own, in the three languages:
  - the six headings;
  - yes and no;
  - the worksheet's name;
  - the file's name.

  None holds a placeholder or a plural. The language check passes.
- [x] **The API reads `@pcp/i18n`, in a commit of its own.** The rule between projects lets the API import `@pcp/i18n`, the first web library it imports, and no other. The change is made on purpose, and the spec says why.
  - `pnpm boundaries:check` gains a case proving that the API's import of `@pcp/ui`, `@pcp/api-client` or `@pcp/links` still fails.
  - The API's Jest and its build load `@pcp/i18n`'s source, its JSON message files and its one package.
  - `pnpm boundaries:check`, run on its own, passes.
- [x] **The library, installed** in the API, and as a development dependency of `@pcp/e2e`. It sits behind one port, `OfferSheetFile`, the only class that names it.
- [x] **The layout, written once,** in the domain:
  - the six columns in SHT-1's order;
  - their headings, and yes and no, read from `@pcp/i18n` in each language;
  - the fold of a part number: cleaned by `cleanPartNumber`, then put in lower case as the catalog's search text folds it. Ticket 02's match uses the same fold.

  The download writes each cell as the spec's **The layout, written once** says.
- [x] **The part number a row is given:**
  - the first of the Part's part numbers that no other Part holds, compared by the fold;
  - when another Part holds every one, the Part's first;
  - when the Part has none, an empty cell.
- [x] **The rows.** Every Offer of the Vendor, Expired Offers among them, ordered by Category in the catalog's order, then by the Part's name, then by the Offer's identifier. A Vendor with no Offer gets row 1 alone.
- [x] **Downloading.** `GET v1/vendors/{vendorId}/offer-sheet?language=ckb|ar|en`, through `DownloadOfferSheetQuery` and `OfferSheetStore` in an `OfferSheetModule`.
  - **Who may.** It asks `VendorAccessRule` first. A missing or unknown `language` is then 400 `NOT_VALID` naming `language`, with `missing` or `notInTheSet`.
  - **The answer.** It is 200 with the file. The file's name, which holds the day in Iraq by the platform's day rule, goes in `Content-Disposition`, encoded so that Kurdish and Arabic survive.
  - **The description** gives the answer as a binary file. Check how `@hey-api/openapi-ts` types and fetches a binary answer, and write it under Comments. The client's function is `downloadOfferSheet`, and `pnpm api-client:write` is run.
- [x] **Tests, before the code, at seam 2**, as the spec's **Downloading** lines list them:
  - every Offer's row, in its order, each cell as the layout writes it;
  - the headings, the yes and no, and the worksheet's and the file's names in each language, compared with `@pcp/i18n`'s words and never quoted;
  - right to left in Kurdish and Arabic;
  - headings alone for a Vendor with no Offer;
  - the part number written, for each of its three cases;
  - who may download, and the language's refusals.
- [x] **Seam 1.** The committed description and the client include the new endpoint. Each of these faults is seen to fail once, then reverted:
  - the Arabic of a heading removed, which fails the language check;
  - an import of `@pcp/links` planted in the API, which fails lint.
- [x] **Gates.** `pnpm check --skip-nx-cache`, `pnpm integration:check` and `pnpm boundaries:check` pass.

## Comments

### 18 November 2026: the library's research

Researched on 18 November 2026 against the npm registry, its download counts and its advisory database, SheetJS's own documentation and advisories, and the two projects' pages. Nothing was installed in the workspace before the choice.

**The spec's note on the npm registry's `xlsx`, confirmed.** The registry's `xlsx` stops at 0.18.5, of 24 March 2022, its `latest`. SheetJS's documentation calls the registry "out of date" and publishes later releases only as tarballs on its own server, `cdn.sheetjs.com`, 0.20.3 being the current one; its source moved from GitHub to `git.sheetjs.com`. 0.18.5 carries two published advisories, both high: prototype pollution when reading specially crafted files (CVE-2023-30533, GHSA-4r6h-8v6p-xvw6, fixed in 0.19.3), and a regular expression denial of service (CVE-2024-22363, GHSA-5pgg-2g8v-p4x9, fixed in 0.20.2).

**Adoption.** On the npm registry, from 19 October to 17 November 2026, ExcelJS (`exceljs`) was downloaded 108.3 million times and SheetJS's `xlsx` 62.0 million: ExcelJS about 1.75 times as often, and 29.0 million against 15.3 million in the last week. Over the last twelve months the two are level, 506 million against 497 million; in November 2024 `xlsx` still led, 10.1 million against 7.3 million, so ExcelJS overtook it during 2026. Downloads of SheetJS's tarballs from its own server are not counted in these. On GitHub SheetJS has more stars, 36.3 thousand against ExcelJS's 15.5 thousand. Others seen and set aside: `read-excel-file` (20.2 million a month) and `write-excel-file` (10.4 million), which are two libraries, one for each direction, where the spec wants one port over one; `@e965/xlsx` (7.2 million), a third party's republication of SheetJS; `xlsx-js-style` (4.7 million) and `node-xlsx` (2.1 million), built on SheetJS; and `xlsx-populate` (1.1 million). **The most widely used is ExcelJS.**

**The throwaway check**, in the session's scratchpad (`ticket-01/`), each candidate installed in an empty folder of its own and driven by a script from another folder, ExcelJS 4.4.0 from the registry, SheetJS 0.20.3 from its server and SheetJS 0.18.5 from the registry:

| What it was asked | ExcelJS 4.4.0 | SheetJS 0.20.3 (its server) | SheetJS 0.18.5 (the registry) |
|---|---|---|---|
| Loads in the API's Jest, through the shared preset and SWC | Yes, CommonJS | Yes, CommonJS | Yes, CommonJS |
| Loads in the built API, where webpack leaves npm packages to Node's `require` | Yes | Yes | Yes |
| Writes text, number and boolean cells, and a number format (`@`, `0.00`, `0`) | Yes | Yes | Yes |
| Writes a list a cell is chosen from (data validation) | Yes | **No**: the Community Edition writes none | **No** |
| Writes a frozen first row | Yes | **No** | **No** |
| Writes a worksheet that reads right to left | Yes | Yes, through the workbook's view | Yes |
| Reads each cell's kind and value, a formula's saved value and an error cell, in its own file and the other's | Yes: String, Number, Boolean, Formula with its result, Error | Yes | Yes |
| A file of 210 KB that unpacks to 200 MiB, under a 1 GB heap | Read, 1.0 s, 644 MB at its peak | Read, 0.7 s, 480 MB | Read, 0.5 s, 479 MB |
| A file of 1 MB that unpacks to 1 GiB | **The whole process crashed**, "JavaScript heap out of memory", 1.5 s: nothing can catch it | Answered a workbook whose worksheet was silently missing, 2.1 GB at its peak | The same |
| The same with the sizes the archive declares forged to 5,000 bytes | Crashed the same way | Read 5,000 bytes and answered an empty worksheet without saying so | The same |
| The workspace's minimum release age, with no exception | Met: 19 October 2023 | Cannot be judged: a tarball from outside the registry has no publication time for pnpm to read | Met: 24 March 2022 |
| An install script | None in its 177 packages | None, one package with no dependency | None in its 9 packages |
| Published advisories (the registry's bulk advisory endpoint, every package of each install) | None for ExcelJS. One moderate for `uuid` 8.3.2 (GHSA-w5hq-g745-h8pq, no bounds check in v3, v5 and v6 when a buffer is passed); ExcelJS calls only `v4()`, with no buffer | None | The two above |

**What the check means for reading a stranger's file.** Neither library refuses a crafted file that unpacks past its bounds: ExcelJS takes the API down with it, and SheetJS answers a wrong workbook without saying so. So whichever is chosen, the reading of an upload (ticket 02) has to bound what it unpacks before the library sees the file: read the archive's directory and inflate each entry with Node's own `zlib` under `maxOutputLength`, trusting no declared size, and answer `notReadable` past the bound. Node's `zlib` adds no dependency.

**Against ExcelJS.** It is heavy, 177 packages; its last release, 4.4.0, is of October 2023, its one later prerelease of December 2024, with 670 issues and 158 pull requests open and the 2026 activity in forks; and six of its packages are deprecated (`fstream`, `glob` 7, `inflight`, `lodash.isequal`, `rimraf` 2, `uuid` 8). None of it reaches the layout's needs, and the crash on a crafted file is answered by the bound above.

**The recommendation: ExcelJS 4.4.0**, written `~4.4.0` as `sharp`, which also reads strangers' files, is: the most widely used, and the only candidate that writes all six things the layout needs. SheetJS's Community Edition cannot write the list "in stock" is chosen from nor the frozen first row; its registry release carries the two advisories; and its fixed release lives outside the registry, where the minimum release age cannot judge it.

Taken on the owner's standing instruction of 18 November 2026: ExcelJS 4.4.0 as the Offer sheet's library, in the API and as a development dependency of `@pcp/e2e` (the most widely used, about 1.75 times SheetJS's `xlsx` on the registry over the last month and level with it over the year, and the only one that writes the list, the frozen row and the right-to-left worksheet together; the other options were SheetJS 0.20.3 from SheetJS's own server, which writes neither the list nor the frozen row and sits outside the release-age rule, and SheetJS 0.18.5 from the registry, which writes neither and carries two advisories, one about reading crafted files).

Sources: [SheetJS's Node.js installation](https://docs.sheetjs.com/docs/getting-started/installation/nodejs), [SheetJS's advisories](https://cdn.sheetjs.com/advisories/), [CVE-2023-30533](https://cdn.sheetjs.com/advisories/CVE-2023-30533), [CVE-2024-22363](https://cdn.sheetjs.com/advisories/CVE-2024-22363), [ExcelJS on GitHub](https://github.com/exceljs/exceljs), [SheetJS on GitHub](https://github.com/SheetJS/sheetjs), the registry's download counts (`api.npmjs.org/downloads`), and a comparison of 6 November 2026 ([pistack.xyz](https://www.pistack.xyz/posts/2026-11-06-nodejs-excel-libraries-exceljs-sheetjs-xlsx-populate/)).

### 18 November 2026: a later finding for the upload

While the layout was being built, the check found a second way a small file can hold ExcelJS up, which the bound on unpacking does not see. ExcelJS's reader (`lib/xlsx/xform/sheet/data-validations-xform.js`, `Range.forEachAddress`) spreads every data validation's range into one entry per cell. A file of 7 KB, the throwaway check's own file with its one list widened to the whole worksheet, `A1:XFD1048576`, was still being read after 180 seconds and was stopped; the same list over a whole column, `D2:D1048576`, read in 0.6 s with 257 MB at its peak. So ticket 02's reading has to bound, or set aside, the worksheet's data validations before ExcelJS parses a stranger's file, as it bounds the unpacking. The Offer sheet the download writes keeps its list to the rows an upload takes, `E2:E5001`, which ExcelJS reads back as 5,000 entries.

### 18 November 2026: built

On branch `sheet/01-the-api-gives-a-vendor-its-offer-sheet`, from `sheet/integration` at `3b18c82`, in seven commits, each gated on `pnpm check` and, where it touches the API, `pnpm integration:check`:

- `f194ecb` the library's research and the choice, above.
- `c4c36be` **Offer sheet** in CONTEXT.md, under Vendors and offers, as the spec defines it, its words to avoid spreadsheet, Excel file, export, import, price list and CSV, and "sheet" never written alone.
- `5def299` `words.md`: the term, خشتەی ئۆفەرەکان and جدول العروض, and a section, **The Offer sheet's words**, with the six headings, yes and no, the worksheet's name and the file's name in the three languages, drafts under LANG-7. The term's nearer "sheet of the Offers", شیتی ئۆفەرەکان and ورقة العروض, is marked to choose.
- `1db77fd` the dashboard set's `OfferSheetFile`: `headings` (`partNumber`, `name`, `usdPrice`, `iqdPrice`, `inStock`, `warrantyMonths`), `yes`, `no`, `worksheet` and `file`, in the three languages, none with a placeholder or a plural. The language check passes.
- `aecac97` **the API reads `@pcp/i18n`**, in a commit of its own. `@pcp/i18n` gains the tag `shared-with:api`, and the root lint configuration's constraint for `scope:api` takes it beside `scope:api` and `scope:shared`, so the API imports that one web library and no other. The API lists it in its dependencies and its TypeScript references. `pnpm boundaries:check` gains three lines: the API's import of `@pcp/api-client` and of `@pcp/links` refused, beside the existing `@pcp/ui`, and its import of `@pcp/i18n` allowed; 131 lines passed. The library's one package, `@formatjs/intl-localematcher`, and the package it imports, `@formatjs/fast-memoize`, are ES modules only: a throwaway test importing `dashboardMessages`, `languageForBrowser` and `westernNumberIn` failed in the API's Jest with "Cannot use import statement outside a module" on the first, then passed once the shared preset named both, as it names `jose`. A throwaway import in `main.ts`, built with `nx build @pcp/api --skip-nx-cache` and run, printed the Arabic yes, `ar` for `ar-IQ` and `1875` for `١٬٨٧٥`: webpack bundles the source and its JSON message files, and leaves `@formatjs/intl-localematcher` to Node's `require`, which loads it as Keycloak's admin client is loaded. Both throwaways were removed before the commit.
- `bc84d17` **ExcelJS `~4.4.0`**, in the API's dependencies and the root manifest's, and among `@pcp/e2e`'s development dependencies. No `minimumReleaseAgeExclude` and no `allowBuilds` entry was needed, and the API and `core` still link one copy of NestJS.
- `1b7ec31` the download, the description, the client and the tests.

**The domain**, in `domain/offer-sheet/`:

- `offer-sheet-layout.ts`, the layout written once: the six columns in SHT-1's order and the kind each cell is written as (text, a number with two decimals, a whole number, or yes or no); `OfferSheetLayout.in(language)`, which reads the headings, yes and no, the worksheet's name and the file's name from `@pcp/i18n`'s dashboard set and says whether the language reads right to left from `@pcp/i18n`'s `directions`; `offerSheetLanguage`, the language asked for or `missing` or `notInTheSet`, compared exactly, so `EN` is not English; `mostRowsOfAnOfferSheet`, 5,000, the rows an upload takes, which ticket 02 refuses past; and `foldedPartNumber`, `cleanPartNumber` and then `toLowerCase()`, as `columnsOf` folds the catalog's search text, for the download's choice and ticket 02's match.
- `OfferOnTheSheet.ts`: the Offer and its Part as a row needs them, `PartNumberHolders`, which groups the catalog's part numbers by the fold, and `partNumberOfTheRow`: the Part's first part number that no other Part holds, else its first, else none.
- `OfferSheetStore`, the port that reads the Vendor's Offers in the sheet's order with the Parts holding their part numbers; `OfferSheetFile`, the port that turns an `OfferSheetWritten` into bytes; and `DownloadOfferSheetQuery`, with its Input and Output, which asks `VendorAccessRule` first, then checks the language, reads the clock once for the file's day, by `theDayOf`, the rule `sharing` wrote, reads the Store and writes the file.

**The infrastructure**, in `infrastructure/offer-sheet/`, in `OfferSheetModule`:

- `DatabaseOfferSheetStore` reads, in one read-only snapshot, the Vendor's Offers joined to their Parts, ordered by `placeOfCategory`, the Part's name and the Offer's identifier, and then every Part that holds one of their part numbers. PostgreSQL's `lower` only narrows that read; the domain's fold decides which Part holds which number, so the database's case folding never decides a row's number.
- `ExcelJsOfferSheetFile` is the only code of the API that imports `exceljs`; the integration tests read the files they download with it, as the spec asks. Row 1 holds the headings, in bold, frozen; the worksheet reads right to left in Kurdish and Arabic; each column carries its number format, `@` for the part number, the name and in stock, `0.00` for the USD price and `0` for the IQD price and the warranty, so that a cell the Vendor types into later takes it too; a column is as wide as its heading or its longest cell, plus two, from 10 to 60 characters; and "in stock" is a list of the language's yes and no over `E2:E5001`, or further when a Vendor has more Offers, with Excel's refusal of anything else on.
- `OfferSheetController`, `GET v1/vendors/{vendorId}/offer-sheet`, `@PreAuthorize([Role.ADMIN, Role.VENDOR])`, answers 200 with the file as `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `X-Content-Type-Options: nosniff`, and `Content-Disposition: attachment; filename="Offer sheet 2026-11-18.xlsx"; filename*=UTF-8''…`, the name in the language asked for percent-encoded as UTF-8 (RFC 8187), which keeps Kurdish and Arabic, `attachment-named.ts`. `DownloadOfferSheetRequest` checks `language` only as a text, so that the use case refuses it after the rule.

**What the spec does not settle, and what the code does.** None of these is an owner's choice the ticket names, so none was taken under the standing instruction; each can be changed in one place.

- The plain `filename` beside `filename*` is the file's name in English, in every language, for a program that reads no `filename*`; an HTTP header carries no Kurdish or Arabic letter as it is.
- The answer sends `Access-Control-Expose-Headers: Content-Disposition`. Without it a browser hides the header from the dashboard, at another origin, which ticket 04 needs to save the file under the name the API gives.
- The worksheet is named "Offers", ئۆفەرەکان, العروض, and the file "Offer sheet" and the day, `Offer sheet 2026-11-18.xlsx`.
- The list "in stock" is chosen from covers the rows an upload takes, so that a row the Vendor adds offers it, and stops there, so that reading the file back stays cheap (see the later finding above).

**How `@hey-api/openapi-ts` 0.99.0 types and fetches a binary answer.** The description gives the 200 answer as `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` with `{ type: 'string', format: 'binary' }`, as the photo's is, and names the `Content-Disposition` header. The generator types it `DownloadOfferSheetResponses = { 200: Blob | File }`, and `downloadOfferSheet` takes `path: { vendorId }` and `query: { language: 'ckb' | 'ar' | 'en' }`, required. At run time its fetch client, with `parseAs: 'auto'`, picks how to read the body from the answer's `Content-Type` (`getParseAs` in `client/utils.gen.ts`): JSON for `application/json`, and `response.blob()` for any other `application/…` type, so the call answers `{ data: Blob, request, response }`, and a refusal still answers `error` from the JSON body. The file's name is not in `data`: ticket 04 reads it from `response.headers.get('Content-Disposition')`, which the browser shows only because the API exposes it.

### 18 November 2026: the integration tests, written first

`offer-sheet.controller.downloading.integration-spec.ts`, in `apps/api/src/test/infrastructure/offer-sheet/endpoints/`, 21 tests. They were run red before any code: all 21 failed on Nest's own 404 for an address with no route, where a 200 or a refusal of the module's own was expected. Each test downloads the file over HTTP and reads it with ExcelJS; every word is compared with `dashboardMessages` from `@pcp/i18n`, never quoted. Nothing is mocked but the API's clock.

- **The file**: 200 to the Vendor's own Login with the .xlsx type and its name, in the language's word with the day in Iraq, `2027-03-15` at 22:30 UTC on 14 March, in `filename*` and in English in `filename`; the dashboard's origin allowed to read `Content-Disposition`; in each of the three languages, the headings, the worksheet's name, the file's name and the yes and no of two Offers, in stock and not, with the list; right to left in Kurdish and Arabic and left to right in English, row 1 frozen in each; each column at least as wide as its heading in each language; and row 1 alone for a Vendor with no Offer, while another Vendor has one.
- **The rows**: each cell as the layout writes it (a part number of digits, `0012345`, as text, the name as text, 349.99 with `0.00`, 1,875,000 with `0`, the word for yes, 24 with `0`); a price not quoted and a warranty not stated empty, and `350` written 350 with `0.00`; the list on every row and on row 5,001, and not on the headings or on another column; the order, by Category in the catalog's order (CPUs, then CPU coolers, then a GPU, then a PSU), then by the Part's name, then by the Offer's identifier for two Parts of one name, an Expired Offer, confirmed 20 days before, among them, and no other Vendor's; and the Admin's file the same as the Vendor's own.
- **The part number written**: the first a Part holds alone, past one another Part holds in another case; the Part's first when other Parts hold each of its numbers, in other cases; an empty cell for a Part with none; and the one each of two Parts the Vendor offers holds alone, where they share one.
- **Who may, and the language**: another Vendor's address 403 `VENDOR_ACCESS_DENIED`, whether it exists or not and with no language; a Deactivated Vendor's own Login 403 `VENDOR_DEACTIVATED` while the Admin still downloads its file; no token 401; an unknown Vendor 404 `VENDOR_NOT_FOUND` for the Admin, with or without a language; and a missing or empty language 400 `NOT_VALID` naming `language` with `missing`, and `fr`, `EN`, `ckb-IQ` and `ku` with `notInTheSet`.

All 21 passed once the code was written; with nothing turning a test green before its code, the faults below show which tests hold which rule.

### 18 November 2026: the fault checks

Each fault was planted on the committed tree (`1b7ec31`) by one exact edit, run, and taken out by the inverse edit, `git status` clean after each, by a script in the ticket's scratch folder.

- **The Arabic of a heading removed**: `OfferSheetFile.headings.usdPrice` taken out of `dashboard/ar.json`. `tools/check-language-files.mjs`, the step of `pnpm check`, failed: `"OfferSheetFile.headings.usdPrice": is missing. The English file has it.`
- **An import of `@pcp/links` planted in the API**: `import '@pcp/links';` in `domain/offer-sheet/offer-sheet-layout.ts`. `nx lint @pcp/api` failed: `@nx(enforce-module-boundaries): A project tagged with "scope:api" can only depend on libs tagged with "scope:api", "scope:shared", "shared-with:api"`.
- Three more, of this ticket's own, since every test turned green at once: a row always given its Part's first part number failed the two tests of a number another Part holds; a fold that keeps the case failed the same two; and a layout that never reads right to left failed the test of the direction. The other tests of the file passed each time.

### 18 November 2026: the gates

- Each commit was gated on `pnpm check` before it was made, and each that touches the API (`aecac97`, `bc84d17`, `1b7ec31`) on `pnpm integration:check` too: 731 tests in 28 files after the first two, unchanged from `part-requests`', and 752 in 29 with this ticket's 21.
- On the tip of the code, `1b7ec31`, with every `*.tsbuildinfo` outside `node_modules` deleted first: `pnpm check --skip-nx-cache` passed; `pnpm integration:check` passed, 752 tests in 29 files; and `pnpm boundaries:check`, run on its own, passed its 131 lines, none failing.
- This record's commit changes only this file, and is gated on `pnpm check --skip-nx-cache` again, with every `*.tsbuildinfo` deleted first.

The ticket runs no end-to-end test, so `pnpm platform:check` is not its gate. It adds no migration. The built API, started on port 3109 from `nx build @pcp/api --skip-nx-cache` with settings that reach nothing, loaded ExcelJS and `@pcp/i18n`, listened, and answered the download 401 without a token.
