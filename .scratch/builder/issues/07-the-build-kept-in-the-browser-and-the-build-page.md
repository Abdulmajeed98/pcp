# 07: The Build kept in the browser, and the Build page

**Spec:** [the builder spec](../spec.md)

**What to build:** A Shopper reaches their Build from every page and sees it on the Build page: the eight Categories, each with the Part or Parts chosen for it or a way to choose one. They can change how many of a RAM kit or a drive they want, remove any Part, and empty the whole Build after confirming once. The page says whether the Build is a Complete Build or which Categories it still needs.

The Build is kept in the Shopper's browser for a year and is still there when they come back (BLD-6). Every change is a plain form, so the page works before any script has loaded. The forms that put a Part in the Build are here too: ticket 09's picker sends them, and until then the tests send them. The outcomes and the prices come in ticket 08.

**Blocked by:** 01, 06

**Status:** ready-for-agent

- [ ] **The cookie.** `build`, kept for a year through the same function that keeps the currency and the scheme. It holds each Part's identifier under its Category and, for a RAM kit or a drive, its quantity. It holds no name, price or specification.
- [ ] **Reading it never refuses.** Each entry that cannot be read is dropped, and the Build is what could be read:
  - an identifier that is not one;
  - a quantity outside 1 to 16;
  - a Category that is not one of the eight;
  - a second Part for a Category that holds one;
  - a Part repeated.
- [ ] **The limits.** At most 8 different RAM kits and 8 different drives, each with a quantity from 1 to 16. A change past a limit is not applied, and the Build page says why.
- [ ] **The forms**, each sent with `POST` to an address under `/{language}/build/` and answered 303 with the Build page, as the switches' forms are:
  - **pick**: a Category and a Part. For a single Category it replaces the Build's Part. For a kit or a drive it adds it with a quantity of one, or adds one to its quantity when the Build holds it.
  - **quantity**: changes a kit's or a drive's quantity.
  - **remove**: takes a Part out.
  - **empty**: clears the Build after one confirmation, since nothing brings it back.

  With script, the design may apply a change in place.
- [ ] **The Build as the API's query**, written from the cookie by a plain function. The browser never calls the API.
- [ ] **The page** at `/{language}/build`, built to DESIGN.md. It is rendered on the server for each request, with the language from the address and the chosen currency from its cookie, and asks `GET v1/build` through `api-client` with no cache.
  - Each Category shows its Part or Parts, or a link to its picker at `/{language}/build/{category}`, which ticket 09 builds.
  - A Part shows its name and manufacturer in English, its photo or its Category's icon, and, for a kit or a drive, its quantity with the form to change it. Every Part has the form to remove it.
  - A Visible Part links to its Part page.
  - A Part the API left out, because the catalog no longer holds it, shows its Category as not chosen.
- [ ] **The status.** A Complete Build, or the Categories still needed, each linking to its picker, with the line saying the CPU's graphics or cooler is not known when the API says so.
- [ ] **An API that does not answer** shows the frame and the sheet saying the page cannot be read just now, with Try again, as the other Shopper pages do. The cookie is left as it is.
- [ ] **The frame** gains a way to the Build page on every page, with how many Parts the Build holds, read from the cookie and counting a kit or a drive by its quantity. It is a small, additive change to the frame.
- [ ] **The preview.** A title in the page's language, with no Part and no price, and the page marked for search engines not to index.
- [ ] **The motion** DESIGN.md gives the Build page, filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- [ ] **The words.** Every new text is in `i18n`'s Shopper set in all three languages, as drafts under LANG-7.
- [ ] **`pnpm shopper:inspect`** gains an option that puts one of ticket 05's made-up Builds in the inspected page's cookie. The option is added to the commands table and the design skills guide.
  - The Build page is inspected with each made-up Build, in both schemes, in Kurdish and in English, at 1440, 1280, 1024, 768 and 390 pixels.
  - Every FAIL is fixed, and every WARN fixed or defended under Comments, against `browse` ticket 14's reference.
  - `break-ui`'s worst cases are looked at with the worst-case Build.
- [ ] **The Shopper's unit seam** gains these tests:
  - reading the cookie, with each kind of entry that cannot be read;
  - writing it after a pick, a change of quantity, a removal and emptying, with a single Category's Part replaced, a kit or a drive added or counted once more, and a change past the limits refused with its reason;
  - the Build as the API's query;
  - the frame's count;
  - the Categories still needed and the line about the CPU, in each language;
  - the preview, marked not to be indexed.
- [ ] **`pnpm platform:check`** gains these lines. Each test arranges its Build by sending the pick form from its own browser, with made-up Parts made through the API.
  - In a window 360 pixels wide, in Kurdish and in English: the Build page shows each Part with its quantity and the Categories still needed. A Complete Build says so.
  - Changing a kit's quantity, removing a Part, and emptying the Build after confirming each work, with script and with script switched off.
  - The Build is kept after a reload and on another page in the same browser, and the frame counts its Parts. A fresh browser starts with an empty Build.
  - A pick past the limits is refused and the page says why.
  - Kurdish is right to left, every number is in Western digits, Part names are in English, and `expectNoSidewaysScroll` passes.
  - `expectAccessible` passes on the page in the light and the dark scheme.
- [ ] Each of these faults is planted once and then reverted, and each fails its own test: a malformed cookie refused instead of read as what could be read; a second CPU kept beside the first; the quantity form ignored without script.
- [ ] The page's checks on a phone are recorded under Comments as waiting for hosting: the Build page used with a thumb in Kurdish and in English, a quantity changed with the phone's number pad, and the motion felt with reduced motion on and off.
- [ ] `pnpm check` and `pnpm platform:check` pass.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
