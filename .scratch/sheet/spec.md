# Spec: The Offer sheet

Status: ready-for-agent

This is `sheet`, the eleventh and last module in the build order of [the MVP spec](../mvp/spec.md)'s capability map. It comes after `part-requests`. It covers SHT-1 to SHT-7 and the sheet's part of OFF-5: uploading an Offer's row counts as a Confirmation. It completes success criterion 9, and criterion 10 for a row of an Offer sheet turned into a Part Request.

This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md). It follows [ADR-0001](../../docs/adr/0001-seed-catalog-from-buildcores-opendb.md), [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md), [ADR-0004](../../docs/adr/0004-architecture-per-app.md), [ADR-0008](../../docs/adr/0008-language-in-the-address-and-two-message-formats.md), [ADR-0009](../../docs/adr/0009-vendors-in-the-database-logins-in-keycloak.md), [ADR-0010](../../docs/adr/0010-offer-history-kept-apart-from-the-offer.md) and [ADR-0011](../../docs/adr/0011-the-dashboards-look-is-framed-sheet.md). It builds on the conventions that every earlier module recorded in the MVP spec, above all these:

- `catalog`'s cleaning of a part number;
- `offers`' `OfferDetails`, the Offer's writing and the Offer history;
- `part-requests`' endpoint for sending a Part Request and its form;
- `languages`' text in `@pcp/i18n` and the reading of Arabic-Indic digits.

On 18 November 2026 the owner confirmed the test seams, "Those three (Recommended)". They are three that already exist:

- `pnpm check`;
- the API from the outside, over a real PostgreSQL and Keycloak;
- the running platform in a browser.

There is no new seam. The API builds the Offer sheet and reads it back, so every rule about the file is tested at the API over HTTP, and the dashboard still gets no unit-test tool. The Shopper app does not change, so its unit seam is not used.

The same day the owner chose five tickets, merged where they could be, "Merge to five". They are in [issues/](issues/):

1. The API gives a Vendor its Offer sheet. It opens with the library's research and the owner's choice of library.
2. The API applies an uploaded Offer sheet and answers its result.
3. Design the Offer sheet's pieces.
4. A Vendor downloads and uploads its Offer sheet, and asks for a skipped row's Part.
5. Verify from a fresh clone and record the conventions.

Some words need care. The first ticket adds a new term to CONTEXT.md before any code uses it:

- **Offer sheet**: a spreadsheet file of one Vendor's Offers, one row to an Offer, in the platform's own layout. The Vendor downloads it, changes it and uploads it to change many Offers at once.

  Words to avoid: spreadsheet, Excel file, export, import, price list and CSV. Never write "sheet" alone, in code or in interface text: the dashboard's look, Framed sheet, and its menu sheet already use the word.

Other words this spec uses:

- **A row** is one line of an Offer sheet below its headings, numbered as the spreadsheet numbers it, so that the headings are row 1.
- **The upload's result** is what the portal shows after an upload.
- An **applied** row matched one Part and changed or confirmed the Vendor's Offer for it.
- A **skipped** row had a problem and changed nothing. It is skipped for one of four reasons:
  - **no Part**: its part number matched no Part;
  - **several Parts**: its part number matched more than one Part;
  - **the same Part twice**: another row matched the same Part;
  - **not valid**: one of its cells does not fit.

Words to avoid for a row: imported, synced, failed, error and rejected. "Rejected" is a state of a Part Request.

## Problem Statement

A Vendor in Erbil sells hundreds of Parts. Its prices move with the dollar and its stock changes every day. Today it keeps its Offers current one at a time in the portal: search for the Part, open its Offer, type the prices, save, and repeat. A Vendor with 300 Offers cannot do that every week, so it either lets them expire or taps "confirm all" over prices it has not checked. A Shopper then sees prices that are no longer true.

A new Vendor is worse off. Every Offer it starts with is added by hand, one Part at a time, often with the Admin standing in its shop (ACC-6).

Many shop owners already keep their prices in a spreadsheet, and would rather change 300 prices in one file on a computer than tap through 300 screens on a phone. The platform cannot read a Vendor's own free-form file; that was left out of the MVP. But it gives the Vendor no file of its own to work in either.

When a Vendor's Part is missing from the catalog, the Vendor sends a Part Request for it, one form at a time. A Vendor that finds twenty such Parts while going through its stock has to remember them and type each one again.

## Solution

**A Vendor downloads its Offer sheet from a new screen in its portal.** The screen is the Offer sheet screen, reached from the Offers screen. It gives the Vendor an Excel file (.xlsx) with one row for each of its Offers, Expired Offers among them. Each row has six columns:

- the manufacturer part number;
- the Part's name;
- the price in USD;
- the price in IQD;
- whether it is in stock;
- the warranty in months.

The headings, the yes and no of "in stock", and the file's name are in the portal's language. In Kurdish and Arabic the sheet reads right to left. A Vendor with no Offer gets the headings alone, ready to fill.

**The Vendor changes the file however it likes.** It can change prices, stock and warranties. It can add a row for any Part the catalog holds by typing its part number. It can delete rows it does not want to touch. The Part's name is there for reading: the platform never matches a row by it and never changes a Part from it.

**The Vendor uploads the file from the same screen.** The platform matches each row to a Part by its part number:

- A matched row changes the Vendor's Offer for that Part to what the row says, or creates the Offer if there is none. Either way it counts as a Confirmation, even when nothing changed.
- An Offer that no row names is left exactly as it was, neither changed nor confirmed.
- A row with a problem is skipped, and every other row is still applied.

**The upload's result says what happened:**

- how many Offers were added, changed or only confirmed, naming the Parts of the added ones;
- each skipped row, by its row number, and why:
  - a row that matched no Part;
  - a row whose part number matched several Parts, naming them, with a way to the catalog search to add the Offer the Vendor meant;
  - a row that names the same Part as another row, naming the other rows;
  - a row that is not valid, naming its column and what is wrong, as the Offer form would say it.

**A row that matched no Part can become a Part Request.** "Ask for it to be added" opens the Part Request form, filled from the row: its name, part number, prices, stock and warranty. The Vendor chooses the Category, which the Offer sheet does not hold, and sends it. The result stays on the screen, and the row then says it was asked for. A row whose part number already has an open Part Request of the Vendor's says so, with a way to the Vendor's Part Requests, and offers no second request. Once the Admin fulfils the request, the next upload matches the row to the new Part.

**A whole file can be refused.** Nothing is applied when the file:

- is not an .xlsx file the platform can read;
- is too large;
- has too many rows;
- is not the platform's own layout (SHT-7).

The screen says why, in the portal's language.

The Admin acting as a Vendor downloads and uploads that Vendor's Offer sheet the same way, under the band (ACC-6).

The API gains two endpoints: one gives the Vendor's Offer sheet in a language asked for, and one takes an upload and answers its result.

## User Stories

### Downloading the Offer sheet

1. As a Vendor, I want to download all my Offers as one Excel file, so that I can go through my prices in one place (SHT-1).
2. As a Vendor, I want one row for each of my Offers, my Expired Offers among them, so that the file holds everything the portal lists.
3. As a Vendor, I want each row to give the part number, the Part's name, my USD price, my IQD price, whether it is in stock and my warranty, in that order, so that I recognise each Offer and can change it (SHT-1).
4. As a Vendor, I want my rows ordered by Category and then by the Part's name, so that my GPUs are together and I find a Part quickly.
5. As a Vendor reading Kurdish or Arabic, I want the headings, the yes and no, the file's name and the worksheet's name in my portal's language, and the worksheet laid out right to left (LANG-1, LANG-2).
6. As a Vendor, I want the Part's name in English, as the catalog holds it, so that it matches what I see on the box (LANG-3).
7. As a Vendor, I want my prices written as numbers, in Western digits, my USD price with two decimals and my IQD price whole (LANG-5), so that my spreadsheet program can sort and add them.
8. As a Vendor, I want the part number written as text, so that my spreadsheet program does not drop a leading zero or turn a long code into a number.
9. As a Vendor, I want "in stock" chosen from a list of my language's yes and no, so that I cannot type a value the platform will not read.
10. As a Vendor, I want an empty warranty cell where I gave no warranty, so that the file says exactly what my Offer says.
11. As a Vendor whose Part has several part numbers, I want the one written that names only that Part, so that my file matches my Offer again when I upload it.
12. As a Vendor with no Offer yet, I want a file with the headings alone, so that I can fill in my whole stock in one go.
13. As a Vendor, I want the headings to stay in view as I scroll, so that I know which column is which on row 300.
14. As a Vendor, I want the file named with the day I downloaded it, so that I can tell two downloads apart.
15. As the Admin acting as a Vendor, I want to download that Vendor's Offer sheet, so that I can help it in its shop (ACC-6).

### Changing the Offer sheet

16. As a Vendor, I want to change a price, the stock or the warranty in a row, so that my Offer changes when I upload it (SHT-3).
17. As a Vendor, I want to add a row with a known part number, so that an Offer for that Part is created when I upload it (SHT-3).
18. As a Vendor, I want to leave out a price I do not quote, so that my Offer is quoted in the other currency alone, as the Offer form allows (OFF-2).
19. As a Vendor, I want to clear a warranty cell to remove my warranty, so that the row says my Offer whole, as saving the Offer form does.
20. As a Vendor, I want to delete rows I do not want to touch, so that their Offers stay exactly as they are (SHT-4).
21. As a Vendor with a large stock, I want to split my rows across several files and upload them one after another, so that no file is too large, since rows a file leaves out are left alone.
22. As a Vendor typing on a Kurdish or an Arabic keyboard, I want digits I type into a cell read as Western digits, in prices and in part numbers, as the portal's forms read them.
23. As a Vendor, I want thousands separators in a typed price ignored, as the Offer form ignores them, so that "1,875,000" is read as I meant it.
24. As a Vendor, I want "in stock" read in any of the three languages, and as TRUE or FALSE, so that a file I changed in another language, or a sheet that turned my answer into TRUE, still uploads.
25. As a Vendor, I want any heading of the three languages recognised, so that I can switch my portal's language between download and upload.

### Uploading the Offer sheet

26. As a Vendor, I want to upload my changed file from the same screen I downloaded it from (SHT-2).
27. As a Vendor, I want to be told while the file is uploading, and not be able to upload it twice by tapping again.
28. As a Vendor, I want a file that is not my Offer sheet refused as a whole, saying why in my language, so that nothing is changed by mistake (SHT-7).
29. As a Vendor, I want a file that is too large, has too many rows, or cannot be read refused as a whole, saying which, so that I know what to do.
30. As a Vendor, I want empty rows passed over and not counted, so that gaps I left do not show as problems.
31. As a Vendor, I want either all of my valid rows applied or, if the platform fails partway, none of them, so that I never have half an upload.
32. As a Vendor, I want to upload the same file twice without harm, so that I do not need to remember whether the first went through.
33. As the Admin acting as a Vendor, I want to upload that Vendor's Offer sheet, so that I can set up its stock in one go (ACC-6).
34. As a Vendor, I want no other Vendor to download or upload my Offer sheet.

### Matching rows to Parts

35. As a Vendor, I want each row matched to a Part by its part number, so that I do not have to find the Part myself (SHT-2).
36. As a Vendor, I want a part number matched whatever its letters' case, so that "bx8071513600k" finds "BX8071513600K".
37. As a Vendor, I want a part number I pasted from a web page matched even when it carries an invisible mark, as the catalog cleans one.
38. As a Vendor, I want a row matched to a Part only by its exact part number, so that a near miss never changes the wrong Offer.
39. As a Vendor, I want a part number that names several Parts, of which I offer exactly one, matched to my Offer, so that my own downloaded file always uploads.
40. As a Vendor, I want any row matched that way listed in the result with the Part it changed, so that I can see the choice the platform made.
41. As a Vendor, I want a part number of a Part the Admin created, from a Part Request or otherwise, matched like any other.

### Rows with a problem

42. As a Vendor, I want a row with a problem skipped while every other row is applied, so that one mistake does not stop the rest (SHT-5).
43. As a Vendor, I want each skipped row named by its row number in the file, so that I can find it.
44. As a Vendor, I want a row whose part number matched no Part reported as such, with the part number I wrote (SHT-5).
45. As a Vendor, I want a row whose part number matched several Parts to name them, in English, with their manufacturer and Category, so that I know which Parts share that code (SHT-5).
46. As a Vendor with such a row, I want a way to the catalog search with that part number, so that I can add the Offer for the Part I meant.
47. As a Vendor, I want two rows naming the same Part both skipped and each to name the other, the first ten others and how many there are when more rows name it, so that the platform never guesses which of my two prices is right.
48. As a Vendor, I want a row that is not valid to name its column by the file's heading and say what is wrong, as the Offer form says it, for example that there is no price (SHT-5).
49. As a Vendor, I want only the first problem of a row named, in the columns' order, so that the result stays short.
50. As a Vendor, I want a row with no part number reported as such, so that I know to fill it in or change that Offer in the portal.
51. As a Vendor whose skipped row names an Offer I already have, I want that Offer left as it was, neither changed nor confirmed.

### The upload's result

52. As a Vendor, I want to see how many Offers were added, changed and only confirmed, so that I know my upload worked (SHT-5).
53. As a Vendor, I want each added Offer to name its Part, so that I can see that every new row found the Part I meant.
54. As a Vendor, I want the skipped rows grouped by their problem and ordered by row number, so that I can work through them.
55. As a Vendor with thousands of skipped rows, for example after uploading the wrong file, I want the result still readable on my phone.
56. As a Vendor, I want my Offers screen, its counts and the expiry banner to follow my upload at once (OFF-8).
57. As a Vendor, I want the result to stay on the screen while I turn its rows into Part Requests.
58. As a Vendor who reloaded the page, I want to be able to upload the file again to see its result again, which changes nothing that the first upload did not.

### Turning a row into a Part Request

59. As a Vendor, I want to turn any row that matched no Part into a Part Request, so that I ask for the Part without typing it again (SHT-6).
60. As a Vendor, I want the Part Request form filled with the row's name, part number, prices, stock and warranty, so that I only choose the Category.
61. As a Vendor, I want to be asked for the Category, which the file does not hold, so that the Admin knows what kind of Part I mean.
62. As a Vendor, I want the form to say the same refusals as when I send a request from my Part Requests, for example a name that is too long.
63. As a Vendor, I want to return to the result after sending, with that row saying it was asked for, so that I can go on to the next row.
64. As a Vendor, I want a row whose part number already has an open Part Request of mine to say so, with a way to my Part Requests, so that I do not ask twice.
65. As a Vendor whose earlier request for that part number was rejected, I want to be able to ask again, so that a corrected request is possible.
66. As a Vendor, I want my next upload to match the row to the Part the Admin created from my request, so that my Offer sheet and my Offers agree.
67. As the Admin, I want a Part Request sent from an Offer sheet's row to reach my queue like any other, so that I fulfil it in the same way (REQ-2, success criterion 10).

### The Offers an upload changes

68. As a Vendor, I want every applied row to count as a Confirmation at the moment of the upload, even when nothing changed, so that confirming my whole stock is one upload (OFF-5, SHT-3).
69. As a Vendor whose Expired Offer is in an applied row, I want Shoppers to see it again at once (OFF-6).
70. As the owner, I want every change of a price or of the stock that an upload makes recorded in the Offer history, by the Caller's Login, as every change is (OFF-10).
71. As the owner, I want a row that changes only the warranty, or nothing, to add no history row, as an edit does.
72. As a Vendor, I want an Offer an upload creates to appear on my Offers screen and to Shoppers like any Offer I added by hand.
73. As a Vendor that adds an Offer in the portal while an upload is running, I want the upload not to fail because of it.
74. As the Admin uploading for a Deactivated Vendor, I want its Offers changed and kept hidden from Shoppers until it is reactivated (ACC-7).

### Getting it right once

75. As the owner, I want no path through the Offer sheet that lets a Vendor create or change a Part, its name included (CAT-4, the Boundaries).
76. As the owner, I want a file far too large refused as it arrives, before it fills the API's memory, as a photo is.
77. As the owner, I want a crafted file that expands to an enormous size when unpacked refused without taking the API down.
78. As the owner, I want the file's layout written once, for the download and for the upload, so that a downloaded file is always the layout the upload accepts.

### Phones and languages

79. As a Vendor on a phone 360 pixels wide, I want the Offer sheet screen, the file field and the result usable with a thumb in each language (LANG-8, success criterion 13).
80. As a Vendor reading Kurdish or Arabic, I want the screen right to left, every number in Western digits, and Part names in English (LANG-2, LANG-3, LANG-5).
81. As a Vendor, I want a part number I wrote shown as I wrote it, and left to right, in the result.

### The owner

82. As the owner, I want the new pieces designed in the dashboard's chosen look, with the options rendered and chosen by eye, so that the dashboard stays one object.
83. As the owner, I want the Kurdish and Arabic texts of this module, the file's words among them, drafted and kept for my review before launch (LANG-7).
84. As the owner, I want the file library chosen by research, with the most widely used one named and compared, before it is installed.
85. As the owner, I want this module's phone checks recorded as waiting for hosting, so that they do not hold the module back.

## Implementation Decisions

### What this module is and is not

- It covers SHT-1 to SHT-7 and OFF-5's sheet clause. It completes success criterion 9. It completes criterion 10 for a row turned into a Part Request, through `part-requests`' `POST v1/vendors/{vendorId}/part-requests`.
- It adds no table and no migration. An Offer sheet and an upload's result are never stored. The file is made when it is downloaded, and read and forgotten when it is uploaded.
- It changes no Compatibility Rule, no price rule, no expiry rule and nothing a Shopper reads. An upload makes and changes Offers, and every Shopper page shows them by the existing rules.
- It sends no message, and it changes no Part (CAT-4).
- It adds nothing to the Admin console. The Admin uses a Vendor's Offer sheet by acting as that Vendor.

### The API builds and reads the file

- The API makes the Offer sheet and reads it back, so the layout is written once, in one place, for both directions (SHT-7). The dashboard never reads or writes an .xlsx file. It only saves what the API gives and sends what the Vendor picks.
- The API has said nothing in a language so far. Its refusals are codes that the frontends put into words. The Offer sheet is the first thing the API writes for a person to read. So its words come from `@pcp/i18n`, where ADR-0008 keeps all of the platform's text, and its reading of typed digits is `@pcp/i18n`'s `westernDigitsIn` and `westernNumberIn`, written once.
- **The API imports `@pcp/i18n`.** It is the first web library the API imports. The change to the rule between projects is made on purpose, by the first ticket, in a commit of its own. `pnpm boundaries:check` gains a case proving that the API still cannot import any other web library (`@pcp/ui`, `@pcp/api-client` or `@pcp/links`). The ticket checks that the API's Jest and its build load `@pcp/i18n`'s source, its JSON message files and its one package.
- **The file's words** live in the dashboard set, under a heading of their own, in the three languages:
  - the six headings;
  - yes and no;
  - the worksheet's name;
  - the file's name.

  None holds a placeholder or a plural, so the API reads each as it is, with no i18next. `words.md` gains the term Offer sheet and these words. The Kurdish and Arabic are drafts under LANG-7.
- **Alternative weighed.** The dashboard could build and read the file in the browser, where the words and the digits already are. That would split the layout's rules between the dashboard and the API, add a library of about a megabyte to the portal on phones, and test the reading of a file only end to end, or through a fourth seam. The owner chose the three seams with the API building the file.

### The library

- **It is chosen by research, in the first ticket, before it is installed.** The ticket researches against current sources and recommends a library. It names the most widely used and says how its adoption compares. The owner chooses.
- Two libraries are expected to be weighed: SheetJS's `xlsx` and ExcelJS. At the time of writing, the npm registry's `xlsx` is thought to stop at 0.18.5, with later releases only on SheetJS's own server, and that registry release is thought to carry published advisories about reading crafted files. The research confirms or corrects both.
- **What the library must do:**
  - write text, number and boolean cells;
  - write a cell's number format;
  - write a list a cell is chosen from (data validation);
  - write a frozen first row;
  - write a worksheet that reads right to left;
  - read each cell's kind and value, and the value a formula was saved with.
- **The library must also:**
  - read a file sent by a stranger safely, within bounds of memory and time;
  - load in the API's Jest and in the built API, CommonJS both. An ES-module-only package is named in the shared Jest preset, as `jose` was;
  - meet the workspace's minimum release age, with no exception;
  - add no install script that `pnpm-workspace.yaml` does not vet.
- The library is wrapped behind one port, so that the domain never names it and it can be replaced. The end-to-end tests use the same library, as a development dependency of `@pcp/e2e`, to read a downloaded file and change it.

### The layout, written once

- **One worksheet, the first in the file.** Its first row holds the six headings in columns A to F, in SHT-1's order:
  1. manufacturer part number;
  2. Part name;
  3. price in USD;
  4. price in IQD;
  5. in stock;
  6. warranty in months.
- **When a file is the platform's layout (SHT-7).** It is the layout when each of the first row's cells A to F holds its column's heading in any of the three languages, compared after trimming and folding case. Each column is matched on its own, so headings of different languages are accepted together. Columns after F are ignored, so a Vendor's notes there do no harm. A heading moved, missing or misspelt is not the layout.
- **What the download writes:**
  - Row 1 holds the headings, in the language asked for. It stays in view as the Vendor scrolls.
  - The worksheet reads right to left in Kurdish and Arabic.
  - The part number is a text cell, so that a code of digits keeps its leading zeros.
  - The Part's name is a text cell, in English as the catalog holds it.
  - The USD price is a number cell with two decimals, empty when not quoted.
  - The IQD price is a whole number cell, empty when not quoted.
  - "In stock" is the word for yes or no in the language asked for, chosen from a list of the two.
  - The warranty is a whole number cell, empty when there is none.
  - Columns are wide enough for their headings.
- **The rows** are every Offer of the Vendor, Expired Offers among them, ordered by Category in the catalog's order, then by the Part's name, then by the Offer's identifier. A Vendor with none gets row 1 alone.
- **The part number a row is given.** It is the first of the Part's part numbers that no other Part holds, compared as the upload compares them. When another Part holds every one, the row is given the Part's first part number. When the Part has none, the cell is empty. The upload's tie-break below matches such a row back to the Vendor's Offer, so a file downloaded and uploaded unchanged applies every row whose Part has a part number.
- **The file's name** is the file's word in the language asked for, then the day in Iraq's time as year, month and day in Western digits, with `.xlsx` after them. The day is counted by the rule `sharing` wrote once. The API sends the name in the answer's `Content-Disposition`, encoded so that Kurdish and Arabic survive, and the dashboard saves the file under it.

### Reading an upload

- **The file as a whole**, refused 400 `NOT_VALID` with `field: 'offerSheet'` and nothing applied, in this order:
  - `missing`: no file was sent;
  - `tooLarge`: it is over 5 MB. A file far over that is refused as it arrives, before it fills the API's memory, as a photo is (`catalog`'s upload and its interceptor of Multer's refusals);
  - `notReadable`: it is not an .xlsx file the library can read. A .csv, an old .xls, an .ods, a picture and a crafted file that unpacks past the library's bounds are all refused this way;
  - `notTheLayout`: its first worksheet's first row is not the six headings (SHT-7);
  - `tooManyRows`: it holds more than 5,000 rows that are not empty. That is more than the largest Category of the catalog. A Vendor with more splits its file, which SHT-4 makes safe.
- **Rows.** Every row below row 1 is read in turn. A row whose six cells are all empty is passed over and not counted. Every other row is numbered by its row in the file.
- **A row's cells**, read into the details an Offer takes:
  - **Part number.** A text cell is read as written. A number cell is read as its digits. Arabic-Indic digits become Western ones by `westernDigitsIn`, and then `cleanPartNumber` strips invisible marks and trims, as for a Part Request. It is `missing` when nothing is left, and `tooLong` over 100 code points, as for a Part Request.
  - **Part name.** It is never matched and never changes anything. A row that matches no Part carries it, as written, to start a Part Request.
  - **USD price.** A number cell is written as the shortest decimal text that reads back as the same number, so that 349.99 is "349.99". A text cell goes through `westernNumberIn`. An empty cell is no USD price.
  - **IQD price.** A number cell is its number. A text cell goes through `westernNumberIn` and is `notANumber` when it is not a number, as the Offer form refuses it. An empty cell is no IQD price.
  - **In stock.** It is yes or no in any of the three languages, trimmed and with its case folded, or a TRUE or FALSE cell. It is `notYesOrNo` otherwise, and `missing` when empty, as `OfferDetails` refuses it.
  - **Warranty.** It is read like the IQD price, and an empty cell is no warranty.
  - **Other cells.** A formula cell is read by the value it was saved with. A cell holding an error, or a formula saved with no value, is `notReadable` in its column.
- **A row that is not valid** is checked in the columns' order. The first cell that does not fit is the row's one problem: `field` (`partNumber`, `usdPrice`, `iqdPrice`, `inStock` or `warrantyMonths`) and a reason.
  - The prices, the stock and the warranty are checked by `OfferDetails.check`, unchanged, after the cells are read. So a row with no price at all is `usdPrice`, `missing`, as the Offer form says it, and every limit is the Offer's own.
  - The sheet's own reasons are `notYesOrNo` and `notReadable`. Every other reason is `OfferDetails`' or the part number's.

### Matching a row to a Part

- **The comparison.** A row's cleaned part number is compared with every part number of every Part in the catalog, imported or created by the Admin. Both sides are cleaned the same way and folded to lower case as the catalog's search text folds them. The fold is written once, for the download's choice and the upload's match. The match is exact: no hyphen or space inside a code is dropped, no prefix is enough and no name is read.
- **The outcome.** Only rows that are valid are matched:
  - One Part holds the number: the row is that Part's.
  - Several Parts hold it, and the Vendor has an Offer for exactly one of them: the row is that Offer's Part. This is the tie-break. The result lists every row applied this way with its Part.
  - Several Parts hold it otherwise: the row is skipped as **several Parts**, naming them all.
  - No Part holds it: the row is skipped as **no Part**.
- **The same Part twice.** The rows that matched one Part are compared last. When two or more rows matched the same Part, by one part number or by two of its numbers, every one of them is skipped as **the same Part twice**, each naming the row numbers of the first ten others, by row number, and counting every other. The platform never chooses between two of a Vendor's prices. A row names at most ten, so that the result grows with its rows and never with the square of them: a file of 5,000 rows naming one Part would otherwise answer 25 million row numbers, 120 MB.
- **One read for a whole file.** The catalog's matches, the Vendor's Offers for the Parts found, and the Vendor's open Part Requests' part numbers are each read once for the whole file, not once a row. At the catalog's size, about 37,000 part numbers, no new index is expected; the first ticket measures a file of 5,000 rows against the development database and adds one, with its migration, only if the measure asks for it.

### Applying the rows

- **One moment, one transaction.** The API's clock is read once for an upload. Every applied row's Confirmation is that moment. All applied rows are written in one transaction, so an upload applies all of its valid rows or none of them, and a failure answers a server error with nothing changed.
- **Each applied row, through the Offer module's own writing**, with no second copy of it:
  - **No Offer for the Part:** the Offer is made with the row's details, confirmed and made at the upload's moment, with one `created` history row by the Caller's Login.
  - **An Offer:** its prices, stock and warranty are replaced by the row's, as an edit replaces them, and its Confirmation becomes the upload's moment. A `changed` history row is written only when a price or the stock changed.
  - **The row states the Offer whole.** An empty USD cell beside an IQD price makes the Offer IQD-only, and an empty warranty cell removes the warranty, as saving the Offer form, which clears what it leaves out, does.
  - **An Offer the Vendor adds while the upload runs** does not fail the upload. The upload's insert finds the pair taken, holds the Offer that is now there, and replaces it with the row, the later statement.
- **What is left alone.** An Offer that no applied row names is neither changed nor confirmed (SHT-4), and nor is one named only by a skipped row. A Part is never changed (CAT-4).
- **Any Vendor state.** The Admin may upload for a Deactivated Vendor. Its Offers are changed and stay hidden from Shoppers until it is reactivated (ACC-7). A Deactivated Vendor's own Login is refused, as at every portal endpoint.
- **The counts.** An applied row is:
  - **added** when it made an Offer;
  - **changed** when a price, the stock or the warranty differs from the Offer's;
  - **confirmed** when nothing differed.

### The upload's result

The answer, 200, holds:

- `rows`: how many rows were read, not counting empty ones;
- `added`: each added Offer, with its row number, its Part (the catalog's `PartSummaryResponse`) and its `offerId`;
- `changed` and `confirmed`: their counts;
- `matchedByYourOffer`: each applied row whose part number named several Parts, with its row number and the Part it was applied to;
- `skipped`: every skipped row, ordered by row number. Each gives its `row`, its `partNumber` (as cleaned, or as written when its own cell was the problem, then cut to its first 100 code points, the longest a part number may be) and its `problem`:
  - `noPart`, with the row's details as they were checked: `name` as written, cut to its first 300 code points, the longest name a Part Request takes, or null, both prices as an Offer answers them, `inStock` and `warrantyMonths`. These are what `sendPartRequest` takes, but the Category. It also gives `partRequestOpen`: whether the Vendor has an open Part Request whose part number is the row's, folded as above;
  - `severalParts`, with `parts`, each a `PartSummaryResponse`;
  - `samePart`, with `part`, `rows`, the first ten other rows that named it, by row number, without the row itself, and `otherRows`, how many other rows named it;
  - `notValid`, with `field` and `reason`.

Every text the result carries from a cell is cut so, to the most the platform takes for it, never inside a character, so that the result's size grows with its rows alone, whatever its cells hold: one cell of the shared strings, up to 32,767 characters, can stand in every row of a file. A field a problem does not hold is left out, not null, as a Part Request's state fields are. `@pcp/api-client` exports the response types, so that no screen writes the problems by hand.

### The API

| Endpoint | The client's function | Who may call it | What it does |
|---|---|---|---|
| `GET v1/vendors/{vendorId}/offer-sheet?language=ckb\|ar\|en` | `downloadOfferSheet` | Admin, the Vendor's own Login | Answers 200 with the Vendor's Offer sheet, an .xlsx file, in the language asked for, with its name in `Content-Disposition` |
| `POST v1/vendors/{vendorId}/offer-sheet` | `uploadOfferSheet` | Admin, the Vendor's own Login | Takes a multipart form with one file, `offerSheet`, applies its valid rows and answers 200 with the upload's result |

- **Who may call.** Both endpoints ask `VendorAccessRule` first:
  - another Vendor's address is 403 `VENDOR_ACCESS_DENIED`;
  - a Deactivated Vendor's own Login is 403 `VENDOR_DEACTIVATED`;
  - no token is 401;
  - an unknown Vendor named by the Admin is 404 `VENDOR_NOT_FOUND`.
- **Refusals**, after the rule:
  - the download's missing or unknown `language` is 400 `NOT_VALID` naming `language`, with `missing` or `notInTheSet`;
  - the upload's refusals of the file are listed above.
- **Its own resource.** The address is `offer-sheet` and not `offers/sheet`, so that it never meets `offers/{offerId}`.
- **The code** follows the catalog's conventions:
  - one controller in an `OfferSheetModule`;
  - `DownloadOfferSheetQuery` and `UploadOfferSheetCommand` in the domain, each with its Input and Output;
  - two ports. `OfferSheetStore` reads the rows, matches part numbers and applies the rows in one transaction. `OfferSheetFile` writes rows to bytes and reads bytes to cells, and is the only class that names the library;
  - the layout, the reading of a row and the matching rules in the domain, written once.

  The Store writes through the Offer module's writing, as a Part Request's fulfilment does, and reads the Vendor's open Part Requests through the Part Request module's table.
- The description gives the download's answer as a binary file and the upload's body as a multipart form, as the photo's is. The ticket checks how `@hey-api/openapi-ts` types and fetches a binary answer.

### The Vendor portal

| Address, relative to the portal's frame | What it is |
|---|---|
| `offer-sheet` | The Offer sheet screen: download, upload and the upload's result |

- **Where it is reached.** It is reached from the Offers screen. Whether it is also a fourth section of the sidebar and the menu sheet is for the design ticket to propose and the owner to choose. Its address is relative to the route, so the Admin acting as the Vendor uses the same screen under the band.
- **Downloading** asks `downloadOfferSheet` in the portal's current language and saves the file under the name the API gives. While the file is on its way the button says so and cannot be pressed again. A refusal, or an API that cannot be reached, is said with `WhyNotAnsweredInThePortal`.
- **Uploading** is a file field that takes .xlsx files, then a button. While the file is on its way the screen says so and nothing can be sent again. A refusal of the file is said beside the field in the portal's language, one sentence for each reason. `notTheLayout` says that only an Offer sheet downloaded from this screen is accepted. No limit is written in the portal: a refusal says the file is too large without the number, as the Offer form does for a price.
- **The result** stays on the screen for that visit. It is kept in the page, not stored by the API: a reload loses it, and uploading the same file again shows it again and changes nothing. What it shows:
  - The counts, written by `formatNumber`.
  - The added Offers, their Parts `AlwaysEnglish`.
  - The rows applied by the tie-break, each with its Part.
  - The skipped rows, grouped by problem, each with its row number and the part number `AsWritten`, left to right:
    - **no Part** offers "Ask for it to be added", or says it was already asked for, with a link to the Vendor's Part Requests, when `partRequestOpen` says so;
    - **several Parts** names each Part `AlwaysEnglish` with its manufacturer and Category, and leads to the catalog search with the part number as its search;
    - **the same Part twice** names the Part and the other rows, the first ten and how many there are;
    - **not valid** names the column by the file's heading in the portal's language, and says the reason as the Offer form says it. A part number that is missing says that a row needs one, and that an Offer whose Part has none is changed on the Offers screen.

  How a result of thousands of skipped rows stays readable on a phone, folded, paged or otherwise, is the design ticket's to propose.
- **Turning a row into a Part Request.** "Ask for it to be added" uses the `part-request-form` feature, which gains a start from a row: the name, the part number, both prices, the stock and the warranty, the Category left for the Vendor to choose. It sends through `sendPartRequest`, so a Vendor still never creates a Part. After a send, the row says it was asked for, and every query under `['part-requests']` is asked again.

  Whether the form opens over the result or as its own screen is for the design ticket to propose and the owner to choose. Either way the result survives it.
- **The query keys.** An upload changes Offers through one path, `askAgainAfterAChangeToTheOffers`, so the Offers screen, its counts and the expiry banner follow. The upload also asks every query about Parts again, since an added Offer moves a Part onto Missing specifications and changes a search's `offerId`.
- **Words.** Every new text is in the `i18n` library's dashboard set in all three languages. That includes the screen, the six reasons a file is refused, the four problems, the two sheet reasons and the result's counts, every plural form given, with Arabic's one and two in words. No message formats a number: counts and row numbers reach it as text written by `formatNumber`. The Kurdish and Arabic are drafts for LANG-7.

### The design comes first

- **The new pieces** are all the Vendor portal's:
  - the Offer sheet screen, with its download, its file field and its upload;
  - the way to it from the Offers screen;
  - the upload's result, with its counts and its four kinds of skipped row;
  - the Part Request form started from a row.
- **No new direction is dealt**, since the dashboard stays Framed sheet (ADR-0011). Impeccable adds to the dashboard's DESIGN.md whatever it lacks before anything is built.
- **Each skill leads its own area**, as [the design skills guide](../../docs/agents/design-skills.md) records:
  - Taste leads the composition, the result above all.
  - Impeccable leads the copy, right to left and accessibility. The copy covers the refusals of a file, the four problems, the row already asked for and the reason a part number is missing.
  - Emil Kowalski's skills lead the motion and the feel on a phone: the upload on its way, and the result arriving.
  - `break-ui` runs on the result, with the worst cases below.
- **Choosing.** The options for each piece are rendered in the built-in browser with the made-up shop's data. The portal's options are shown in Kurdish and English, at a phone's width and a desk's, one option to an anchor and two columns at most. The owner chooses by eye.
- **The hard rules hold.** A piece that pulls against one is put to the owner. An ADR on the look is written only if a choice replaces part of ADR-0011.
- **The order.** The API's endpoints can be built while the design is chosen. No screen is built before its design is recorded.

### The inspector

- **The dashboard's made-up shop** answers an upload with a made-up result and writes nothing, as it writes nothing for every other call. Its made-up result holds:
  - added Offers of real Parts;
  - a row applied by the tie-break;
  - one skipped row of each problem.

  The download is not inspected: a file is not a page.
- **`pnpm dashboard:inspect --offer-sheet-result worstCase|clean`**, for `break-ui`, as `--part-requests` is. `clean` is a result with every row applied. `worstCase` keeps the made-up result and adds:
  - 4,800 skipped rows of every problem;
  - row numbers in the thousands;
  - part numbers of 100 code points, and ones with no space;
  - a part number held by 81 Parts, as "OC" is at the pinned commit;
  - names in Kurdish and Arabic script carried from rows that matched no Part;
  - the catalog's longest Part name among the added.
- **The result is inspected through the inspector's own steps**, a made-up file chosen first, as `part-requests`' dialogs were.
- No test of the platform relies on the made-up shop.

### Recording

- **The first ticket** adds **Offer sheet** to CONTEXT.md and its words to `words.md`, before any code uses them.
- **The last ticket:**
  - verifies the module from a fresh clone;
  - records **The sheet module's conventions** in the MVP spec;
  - amends **The offers module's conventions**: an upload's applied row is a Confirmation at the upload's moment;
  - amends the import rules: the API may import `@pcp/i18n`;
  - adds the module's phone checks to **Checks on a phone wait for hosting**;
  - adds `--offer-sheet-result` to the design skills guide and the Commands table;
  - judges again whether any decision needs an ADR, with what the tickets found.

## Testing Decisions

**What a good test is here.** A good test sees the platform from the outside, as a Vendor, the Admin or a Shopper would: through the API's HTTP surface or through a browser. It sends a real .xlsx file and reads a real one back. It never reads a query's SQL, a table's columns, the library's objects, or a helper behind a module's public face. The one exception that `offers` set stays: the Offer history is read from the database with `offerHistoryRows()`, since no endpoint answers it. A test that would still pass if an upload confirmed the Offers it skipped proves nothing about what a Shopper sees.

The owner confirmed the three seams on 18 November 2026. Tests are written before the code where a mistake would mislead a Vendor or a Shopper, as the MVP's testing strategy asks for matching rows to Parts (SHT-2 to SHT-5):

- the reading of a file and of each cell;
- matching, the tie-break and the same Part twice;
- which Offers an upload changes and confirms, and which it leaves alone;
- who may download and upload.

### Seam 1: the repository root, through `pnpm check`

- **The description.** The committed OpenAPI document and the generated client match the API, with the two new endpoints.
- **The language files.** Every new Vendor portal text and every word of the file is in all three languages, the file's words with no placeholder.
- **The made-up shop.** The inspector's made-up result type-checks against `api-client`, with the inspector's tests of it.
- **The import bans.** The new slice and any piece moved down a layer keep Feature-Sliced Design's rules. The API's import of `@pcp/i18n` passes lint, and `pnpm boundaries:check`, run on its own, proves that the API's import of any other web library still fails.

Each new line is seen to fail once, through a deliberate fault that is then reverted:

- a field added to the result without `pnpm api-client:write`;
- the Arabic of a heading removed;
- an import of `@pcp/links` planted in the API.

### Seam 2: the API from the outside, over a real PostgreSQL and a real Keycloak

`pnpm integration:check`. Vendors, Parts, Offers and Part Requests are made through the API. Each test builds its .xlsx file in memory with the chosen library, and reads a downloaded one with it. Headings are compared with `@pcp/i18n`'s words, never quoted. Nothing is mocked but the API's clock, which `moveTheClockTo` moves.

**Downloading**

- A Vendor's own Login downloads its Offer sheet, an .xlsx file whose name holds the day in Iraq.
- It holds one row for each Offer, Expired Offers among them, in Category, name and identifier order, with every cell as the layout writes it:
  - the part number a text cell;
  - the prices numbers;
  - "in stock" the language's word, chosen from a list;
  - an empty warranty cell where there is none.
- The headings, the yes and no, and the worksheet's and the file's names are in each of the three languages, and the worksheet reads right to left in Kurdish and Arabic.
- A Vendor with no Offer gets the headings alone.
- **The part number written.** A Part whose first part number another Part holds gets its first number that only it holds. A Part whose every number another Part holds gets its first. A Part with none gets an empty cell.
- **Who may.** Another Vendor's address is 403 `VENDOR_ACCESS_DENIED`, a Deactivated Vendor's own Login 403 `VENDOR_DEACTIVATED`, and no token 401. The Admin downloads any Vendor's, a Deactivated Vendor's among them, and an unknown Vendor is 404. A missing or unknown language is 400 naming `language`.

**Reading an upload**

- **Refusals of the whole file.** Each is refused naming `offerSheet` with its reason, in its order, and changes no Offer:
  - no file;
  - a file over 5 MB;
  - a .csv, an .xls and a picture;
  - a file whose headings were moved or misspelt;
  - a file of 5,001 rows. A file of exactly 5,000 rows is applied.
- **Headings.** Headings in each of the three languages are accepted, and so are headings mixed from two. A column after F, with a heading of its own and notes, is ignored.
- **Rows.** Empty rows are passed over and not counted, and a row is numbered by its row in the file.
- **Cells:**
  - Arabic-Indic and Eastern Arabic-Indic digits and the Arabic decimal separator in text cells, in prices and part numbers;
  - thousands separators in a typed price;
  - a USD number cell of 349.99 read as 349.99;
  - yes and no in each language and in any case, and TRUE and FALSE;
  - a formula's saved value;
  - an error cell refused `notReadable`.
- **A row that is not valid** is reported with its first problem in the columns' order, for each reason `OfferDetails` gives, `notYesOrNo`, `notReadable`, and a part number missing or too long. Its Offer is left unchanged and unconfirmed.

**Matching**

- One Part, whatever the case of the letters, and with an invisible mark pasted in.
- A Part the Admin created, and a Part created from a Part Request.
- **Several Parts:** the row is skipped, naming them all.
- **Several Parts where the Vendor offers exactly one:** the row is applied to that Offer and listed under `matchedByYourOffer`. Where the Vendor offers two of them, the row is skipped as several Parts.
- **No Part:** the row is skipped, carrying its name and its details. `partRequestOpen` is true when the Vendor has an open Part Request for that part number in another case, and false when the Vendor's request for it was rejected or the request is another Vendor's.
- **The same Part twice**, by one number twice and by two numbers of one Part: every such row is skipped, naming the others.
- **The round trip.** A downloaded Offer sheet uploaded unchanged applies every row whose Part has a part number as `confirmed`, a Part whose every number another Part holds among them. The row of a Part with none is skipped as `partNumber`, `missing`.

**Applying**

- **Added:** the Offer is made with the row's details, confirmed and made at the upload's moment, with one `created` history row by the Caller's Login, the Admin's when the Admin uploads.
- **Changed:** prices, stock and warranty are replaced, and the Confirmation is moved to the upload's moment. A `changed` row is written only when a price or the stock changed. A change of the warranty alone is counted changed, with no history row.
- **Confirmed:** nothing differs. The Confirmation is moved, and no history row is written.
- **Whole rows.** An empty USD cell beside an IQD price makes the Offer IQD-only, and an empty warranty cell removes the warranty.
- **Shoppers see it.** An Expired Offer in an applied row is a Visible Offer at once, through `GET v1/parts/{partId}/offers`, its days since Confirmation 0.
- **Left alone (SHT-4).** An Offer no row names keeps its details and its Confirmation, and so does one named only by a skipped row.
- **All or none.** An upload whose last applied row the database refuses changes no Offer and writes no history row. This is proved with a named exception in the test database's helpers, the eighth, which makes the database refuse one row's write.
- **A Vendor's own add during an upload.** The upload succeeds, and the row replaces the Offer. This is proved with a named exception built on `changeWhileReading`, as `sentWhileTheVendorAddsAnOffer` is, the ninth.
- **A Deactivated Vendor.** The Admin's upload changes its Offers, which stay hidden from Shoppers until it is reactivated.
- **Who may upload:** the same refusals as the download.
- **From a row to an Offer.** A row skipped as no Part, its details sent to `POST v1/vendors/{vendorId}/part-requests` with a Category, is accepted. Once the Admin fulfils that request, the same file uploaded again applies the row.

Prior art:

- `offers`' `offer.controller.integration-spec.ts` for an Offer's details, its refusals, its history with `offerHistoryRows()` and the clock moved with `moveTheClockTo`;
- `catalog`'s tests of a Part's photo for a multipart upload, its size limit and Multer's refusals;
- `part-requests`' `part-request.controller.resolving.integration-spec.ts` and the test database's `sentWhileTheVendorAddsAnOffer` for a Vendor's own add during a write;
- `accounts`' tests of `VendorAccessRule` for who may act.

### Seam 3: the running platform, from the outside

`pnpm platform:check`, in Chromium, in a window 360 pixels wide. Each test makes its own made-up Vendor, Parts and part numbers through the API, unique to the run. It compares what a screen shows with what the API answers, and never quotes a translation. A file is downloaded through Playwright's download event, read and changed with the chosen library, and uploaded through the file field.

**Success criteria 9 and 10.** This test runs in Kurdish, Arabic and English, as `vendor-part-requests-languages.spec.ts` does:

1. A Vendor with two Offers of made-up Parts downloads its Offer sheet. The file holds their rows.
2. The test changes one price, adds a row with a third made-up Part's part number, and adds a row with a made-up part number that nothing matches.
3. The Vendor uploads the file. The result shows one Offer added, naming its Part, one changed, one confirmed, and one row skipped as no Part.
4. The Offers screen shows the new price and the new Offer, as the API answers them.
5. The Vendor turns the skipped row into a Part Request. The form is filled from the row; the Vendor chooses a Category and sends it. The row then says it was asked for, and the Vendor's Part Requests lists the request.
6. The Admin fulfils the request, creating the Part. The Shopper's page of that Part lists the Vendor's Offer at the row's price (criterion 10).
7. The same file uploaded again applies that row.

**The other lines:**

- **A refusal.** A file that is not the layout is refused beside the field, and the Offers screen is unchanged.
- **Several Parts and the same Part twice.** Each is reported with its row number, and the several Parts' link opens the catalog search with the part number.
- **Acting as the Vendor.** The Admin downloads and uploads under the band, and the Vendor's own portal shows the change.
- **Language and layout.** Kurdish and Arabic are right to left, every number is in Western digits, a part number is shown as written, and `expectNoSidewaysScroll` passes.

**Accessibility, motion and the inspector**

- `expectAccessible` passes in the light and the dark scheme on:
  - the Offer sheet screen before an upload;
  - the screen with a refusal of a file shown;
  - the screen with a result of every kind;
  - the Part Request form started from a row, with a refusal shown.
- The motion the design adds is filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- Taste's inspector runs at 1440, 768 and 390 pixels, in both schemes, and at 1024 and 1280 for desk layouts that change between them. `pnpm dashboard:inspect` runs on the screen and its result, in Kurdish and English, with the made-up result and with `--offer-sheet-result`.
- Every FAIL is fixed, and every WARN is fixed or defended in the ticket's Comments.

Prior art:

- `vendor-part-requests-languages.spec.ts` and `part-requests.ts` for the portal in three languages and the Part Request form;
- `admin-part-requests.spec.ts` for fulfilling a request and reading a Shopper's Part page;
- `vendor-offers.spec.ts` and the `offers.ts` helpers for the Offers screen;
- the photo's lines in the catalog's tests for a file field;
- `dashboard-languages.spec.ts` with `readInEveryLanguageOfTheVendorPortal`;
- `aMadeUpVendorThatHasLoggedIn` and `createAMadeUpPart`.

## Out of Scope

- **Other files.** A .csv, an old .xls, an .ods, a link to an online spreadsheet, or a Vendor's own free-form layout (the MVP's Not in the MVP, SHT-7).
- **Removing Offers by the Offer sheet.** A row left out leaves its Offer alone (SHT-4). There is no "remove" column; a Vendor removes an Offer in the portal.
- **Changing Parts.** The Part's name column is never read to change anything, and the Offer sheet holds no Category, manufacturer, specification or photo (CAT-4).
- **Matching by anything but the exact part number.** No match by name, no dropping of hyphens or spaces inside a code, and no suggestion of a near Part.
- **Keeping uploads.** Storing a file or its result, a history of uploads, undoing an upload, and a result that survives a reload.
- **Doing it for the Vendor.** A scheduled upload, a file sent by email, and a link with a Vendor's own system (the MVP's Not in the MVP).
- **The Admin's own screens.** An Admin console screen for Offer sheets, and one file for several Vendors. The Admin acts as a Vendor instead.
- **A second worksheet of instructions** in the file. The Offer sheet screen explains.
- **Cleaning the catalog's part numbers.** Fragments such as "OC" that OpenDB lists as part numbers of many Parts stay as they are; the Admin can change a Part's part numbers as before.
- **Anything a Shopper sees beyond the Offers.** No Shopper page changes.

## Further Notes

- **Decisions this spec takes that the owner may want to revisit.** Each follows the MVP spec's words where they leave room:
  - **The API builds and reads the file**, and imports `@pcp/i18n` for its words and its digits, rather than the dashboard doing it in the browser.
  - **The tie-break.** A part number that names several Parts, one of which the Vendor offers, is that Offer's row, listed in the result.
  - **The download writes the Part's first part number that only it holds**, else its first.
  - **No hidden column.** The file has no hidden column holding the Offer's identifier. SHT-1 names six columns, and a Vendor who copies a row to add a new Part would carry the copied identifier, silently changing the wrong Offer.
  - **Matching folds case** and strips invisible marks, and is otherwise exact.
  - **A fourth problem.** SHT-5 names three problems; the spec adds **the same Part twice**, since two rows for one Part cannot both be applied.
  - **A row states its Offer whole.** An empty price or warranty cell clears it, as saving the Offer form does.
  - **The Part's name carries into a Part Request.** It is never matched, but a row that matched no Part carries it to start a Part Request.
  - **The limits:** 5 MB a file and 5,000 rows that are not empty.
  - **Columns after F are ignored**, rather than making a file not the layout.
  - **The headings and words are in the portal's language**, and any of the three languages is read back.
  - **The result is not stored.** A reload loses it, and uploading again shows it again.
  - **Rows are ordered by Category, then Part name.**
- **Measured on 18 November 2026** in the development database, imported Parts only:
  - 25,974 Parts, of which 235 hold no part number;
  - 1,902 part numbers, folded to lower case, held by more than one Part, on 3,768 Parts;
  - 1,571 Parts whose every part number another Part holds too;
  - 82 part numbers that differ from another only in case;
  - the most widely shared number, "OC", held by 81 GPUs. OpenDB lists fragments of some codes, such as "OC", "16" and "ac", as part numbers.

  Without the tie-break, about 7 in 100 imported Parts could not be matched back from their own row. With it, only a Part with no part number, under 1 in 100, cannot be.
- **Costly to undo.** Little. The module adds no table and stores nothing; the boundary change and every rule here are code, and undoing one loses no data. So no ADR is expected. The last ticket judges again with what the tickets found.
- **Success criteria.** This module completes criterion 9, and criterion 10 for a row turned into a Part Request. It adds the Offer sheet screen and its result to criterion 13.
- **Open checks.** This module's checks on a phone wait for hosting, as every module's do:
  - the Offer sheet downloaded on an iPhone and on an Android phone, and opened in the phone's spreadsheet app;
  - prices and part numbers typed into the file on a Kurdish and on an Arabic keyboard, then uploaded from the phone's files;
  - the result read with a thumb, a long one among it, and a row turned into a Part Request;
  - the motion felt on a real phone, with reduced motion on and off.
- **LANG-7.** The Kurdish and Arabic texts this module adds, the file's headings and the yes and no among them, join the review that stays open until launch.
- **Next steps.** With `sheet`, every module of the capability map is built. The hosting work follows. It adds the platform's limits in front of the API, the upload's among them, and makes every check that waits for a phone.
