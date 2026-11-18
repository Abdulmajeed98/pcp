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

**Status:** ready-for-agent

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
- [ ] **The term, before any code.** CONTEXT.md gains **Offer sheet**, as the spec defines it. Its words to avoid are spreadsheet, Excel file, export, import, price list and CSV, and "sheet" is never written alone. `words.md` gains the term and the file's words, with the Kurdish and Arabic as drafts under LANG-7.
- [ ] **The file's words.** The dashboard set gains, under a heading of its own, in the three languages:
  - the six headings;
  - yes and no;
  - the worksheet's name;
  - the file's name.

  None holds a placeholder or a plural. The language check passes.
- [ ] **The API reads `@pcp/i18n`, in a commit of its own.** The rule between projects lets the API import `@pcp/i18n`, the first web library it imports, and no other. The change is made on purpose, and the spec says why.
  - `pnpm boundaries:check` gains a case proving that the API's import of `@pcp/ui`, `@pcp/api-client` or `@pcp/links` still fails.
  - The API's Jest and its build load `@pcp/i18n`'s source, its JSON message files and its one package.
  - `pnpm boundaries:check`, run on its own, passes.
- [ ] **The library, installed** in the API, and as a development dependency of `@pcp/e2e`. It sits behind one port, `OfferSheetFile`, the only class that names it.
- [ ] **The layout, written once,** in the domain:
  - the six columns in SHT-1's order;
  - their headings, and yes and no, read from `@pcp/i18n` in each language;
  - the fold of a part number: cleaned by `cleanPartNumber`, then put in lower case as the catalog's search text folds it. Ticket 02's match uses the same fold.

  The download writes each cell as the spec's **The layout, written once** says.
- [ ] **The part number a row is given:**
  - the first of the Part's part numbers that no other Part holds, compared by the fold;
  - when another Part holds every one, the Part's first;
  - when the Part has none, an empty cell.
- [ ] **The rows.** Every Offer of the Vendor, Expired Offers among them, ordered by Category in the catalog's order, then by the Part's name, then by the Offer's identifier. A Vendor with no Offer gets row 1 alone.
- [ ] **Downloading.** `GET v1/vendors/{vendorId}/offer-sheet?language=ckb|ar|en`, through `DownloadOfferSheetQuery` and `OfferSheetStore` in an `OfferSheetModule`.
  - **Who may.** It asks `VendorAccessRule` first. A missing or unknown `language` is then 400 `NOT_VALID` naming `language`, with `missing` or `notInTheSet`.
  - **The answer.** It is 200 with the file. The file's name, which holds the day in Iraq by the platform's day rule, goes in `Content-Disposition`, encoded so that Kurdish and Arabic survive.
  - **The description** gives the answer as a binary file. Check how `@hey-api/openapi-ts` types and fetches a binary answer, and write it under Comments. The client's function is `downloadOfferSheet`, and `pnpm api-client:write` is run.
- [ ] **Tests, before the code, at seam 2**, as the spec's **Downloading** lines list them:
  - every Offer's row, in its order, each cell as the layout writes it;
  - the headings, the yes and no, and the worksheet's and the file's names in each language, compared with `@pcp/i18n`'s words and never quoted;
  - right to left in Kurdish and Arabic;
  - headings alone for a Vendor with no Offer;
  - the part number written, for each of its three cases;
  - who may download, and the language's refusals.
- [ ] **Seam 1.** The committed description and the client include the new endpoint. Each of these faults is seen to fail once, then reverted:
  - the Arabic of a heading removed, which fails the language check;
  - an import of `@pcp/links` planted in the API, which fails lint.
- [ ] **Gates.** `pnpm check --skip-nx-cache`, `pnpm integration:check` and `pnpm boundaries:check` pass.

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
