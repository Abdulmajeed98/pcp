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

- [ ] **The library, chosen by the owner, before anything is installed.**
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
