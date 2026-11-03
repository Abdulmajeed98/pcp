# 10: A Category page: its list, search and pages

**Spec:** [the browse spec](../spec.md)

**What to build:** A Shopper opens a Category from the home page and sees its Visible Parts. Each shows its photo or the Category's icon, its name and manufacturer in English, how many shops offer it, and its Lowest Price in the chosen currency, marked "≈" when converted. The list is in BRW-1's order, with Parts that every shop has out of stock last, marked so.

The page can be searched by name, manufacturer and part number, and is paged. The search and the page are in the address, so the page can be reloaded, linked and shared, and it works before any script has loaded. A Shown Price is drawn by one component, which every later page uses. A Part's photo is served by the Shopper app itself, so the browser never needs the API's address. This is the first Shopper page a Shopper can use.

**Blocked by:** 02, 09

**Status:** ready-for-agent

- [ ] **The page** at `/{language}/categories/{category}`, built to DESIGN.md. It is rendered on the server for each request, with the language from the address and the chosen currency from its cookie. It asks `GET v1/visible-parts` through `api-client`, at `API_URL`, with no cache. An unknown Category answers the not-found page with a 404 status, in the page's language.
- [ ] **The query.** `search` and `page` are read from the address, and anything else is ignored. A page number that is not a whole number reads as the first. Reading and writing a Category page's query are plain functions, tested at the Shopper's unit seam, Arabic-Indic digits among them.
- [ ] **The Shown Price** is one component. It draws the amount in Western digits with the chosen currency's mark, as `languages` and `pricing` set them out, and "≈" before it when the price is converted. It is tested at the unit seam in each language and currency, with and without "≈". No Shopper code converts or rounds a price.
- [ ] **A Part on the list** shows:
  - its photo or `CategoryIcon`;
  - its name and manufacturer through `AlwaysEnglish`;
  - the number of shops, worded with the ICU plural;
  - its Lowest Price through the Shown Price component, or, when it has none, "out of stock", which is never only a colour.

  It leads to `/{language}/parts/{partId}`. The order is as the API answers it.
- [ ] **A Part's photo** is served at an address of the Shopper app's own, which passes the API's photo through with the API's cache headers. An unknown photo answers 404.
- [ ] **The search** is a plain form sent with GET, so it works before any script has loaded. A search that finds nothing says so and offers to clear it. A Category with no Visible Parts at all says that no shop offers one yet. The two messages differ.
- [ ] **The pages.** Previous and next, with the page in the address. A page beyond the last says so and leads to the first.
- [ ] **Both switches.** Switching the currency keeps the search and the page, and switching the language keeps them too.
- [ ] **The preview.** The title and description name the Category in the page's language, and the description holds no price.
- [ ] **The words.** Every new text is in `i18n`'s Shopper set in all three languages, as drafts under LANG-7.
- [ ] `pnpm platform:check` passes on every line. The test makes its own made-up Vendor, made-up Parts with names unique to the run, and Offers through the API, and sets the Platform Rate. It finds its own rows by searching for its Parts' names. These are checked in a window 360 pixels wide, in Kurdish and in English:
  - The home page leads to the Category page.
  - The test's Parts are listed by Lowest Price, an all-out-of-stock Part last and marked, and a converted Lowest Price with "≈".
  - A search narrows the list, the address holds it, a reload keeps it, and clearing it restores the list. With JavaScript disabled the same search works.
  - A search that finds nothing says so and offers to clear it.
  - Switching the currency keeps the search, and so does switching the language.
  - Kurdish is right to left, and every price is in Western digits.
  - A Part's photo is drawn from the Shopper app's own address.
  - An unknown Category answers the not-found page with a 404.
  - `expectAccessible` passes in the light and the dark scheme.
  - Any motion DESIGN.md gives the page is filmed with `film` and judged by `snapsOf`, with reduced motion as well as without.
- [ ] **Taste's inspector.** `pnpm shopper:inspect` runs on a Category page, and on one with a search that finds nothing, in both schemes, in Kurdish and in English, at 1440, 768 and 360 pixels. Every FAIL is fixed, and every WARN is fixed or defended, with the results under Comments.
- [ ] `break-ui` runs with the made-up shop's worst cases: the longest name, a Category with one Part and one with 400. `mobile-native` runs too. What they found is fixed or recorded under Comments.
- [ ] Shown once and then reverted, each failing its own test: a converted price drawn without "≈"; the search kept in the address but not sent to the API.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
