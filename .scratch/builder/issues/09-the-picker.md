# 09: The picker

**Spec:** [the builder spec](../spec.md)

**What to build:** From the Build page, a Shopper opens a Category's picker and chooses a Part for their Build. The picker lists the Category's Parts that some Vendor has in stock, lowest price first, with the Category page's search, filters and pages (BLD-2). It hides the Parts that are not Compatible with the Build so far, and a switch shows them all, marking those that are not (BLD-3). The Part already in the Build is marked. Picking a Part puts it in the Build and goes to the Build page. With this ticket a Shopper can assemble a Complete Build on a phone in each language, which makes success criterion 5 true.

**Blocked by:** 04, 08

**Status:** ready-for-agent

- [ ] **The page** at `/{language}/build/{category}`, built to DESIGN.md. It is rendered on the server for each request and asks `GET v1/visible-parts` and its filters with in stock only, the Build from the cookie, and the switch when it is on, through `api-client` with no cache. An unknown Category answers the not-found page with a 404 in the page's language.
- [ ] **Its query** is the Category page's, read and written by the same functions of the `search-parts` feature, with one more parameter for the switch. The address holds only what is on. The search and the filters are the Category page's form, sent with GET, so they work before any script has loaded. The currency switch drops the price range, as on a Category page, and the language and scheme switches keep the whole query.
- [ ] **A Part in the picker** shows its photo or its Category's icon, its name and manufacturer in English, and its Lowest Price through `ShownPrice`. It has a link to its Part page and the pick form from ticket 07.
  - The Part the Build already holds is marked.
  - A Part the switch shows that is not Compatible is marked so, never by colour alone.
  - A RAM kit or a drive the Build holds is marked with how many.
- [ ] **What the sheet says** is decided by a plain function, which tells apart:
  - a Category no Vendor has in stock;
  - a search or filters that found nothing, with Clear all;
  - a list where every Part in stock is not Compatible, offering the switch;
  - a page past the last.
- [ ] **The preview.** A title in the page's language naming the Category, with no price, and the page marked for search engines not to index.
- [ ] **The motion** DESIGN.md gives the picker and the pick, filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- [ ] **The words.** Every new text is in `i18n`'s Shopper set in all three languages, as drafts under LANG-7.
- [ ] **`pnpm shopper:inspect`** on the picker of a Category of one Part, of the GPUs' 400, and with the worst-case Build, the switch on and off. Each is inspected in both schemes, in Kurdish and in English, at 1440, 1280, 1024, 768 and 390 pixels, and in dollars at 1440 and 390 pixels. Every FAIL is fixed, and every WARN fixed or defended under Comments.
- [ ] **The Shopper's unit seam** gains tests of the picker's address and query with the switch, a Category page's query left as it was, and what the sheet says in each of its four cases.
- [ ] **`pnpm platform:check`** gains these lines in a window 360 pixels wide. Each test makes its own made-up Vendor and made-up Parts with the specifications it needs, and finds its Parts in the picker by searching for their names.
  - In Kurdish, in Arabic and in English, a Shopper picks a Complete Build through the pickers, starting from the Build page's links, and the Build page says it is complete (success criterion 5).
  - The CPU picker hides a made-up CPU of another socket than the Build's motherboard. With the switch on, it shows it marked as not Compatible. Picking it makes the Build page list the Compatibility Problem, naming both Parts (success criterion 5).
  - A Part only out of stock is not in the picker. A search and a filter narrow it, and the address keeps them over a reload.
  - Picking with script switched off works.
  - Picking a second CPU replaces the first. Picking the same RAM kit twice makes its quantity two.
  - Kurdish and Arabic are right to left, every number is in Western digits, and `expectNoSidewaysScroll` passes. `expectAccessible` passes in the light and the dark scheme.
- [ ] Each of these faults is planted once and then reverted, and each fails its own test: the picker asking without the Build, so an incompatible Part is shown; the switch's parameter dropped by the currency switch; the in-stock condition left off.
- [ ] The page's checks on a phone are recorded under Comments as waiting for hosting: the picker used with a thumb in Kurdish and in English, the search with the phone's keyboard, the switch and the pick control each taking a tap at once, and the motion felt with reduced motion on and off.
- [ ] `pnpm check` and `pnpm platform:check` pass.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
