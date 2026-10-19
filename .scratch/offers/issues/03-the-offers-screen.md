# 03: The Offers screen

**Spec:** [the offers spec](../spec.md)

**What to build:** The Vendor portal opens on the Vendor's Offers. Each Offer shows its Part, its prices, stock and warranty, and says when it was last confirmed: "today", a number of days ago, "expired", or the days left before it expires. A banner appears when any Offer is expired or about to expire (OFF-8). It gives both counts and holds the button that confirms all the Offers (OFF-5). The Vendor can search its own Offers. A Vendor with none is told so. The details screen moves to a section of its own in the top bar. All of it is in Kurdish, Arabic and English, in both directions, laid out for a phone first.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] **The design.** Before building, the Offers screen's layout, the row of an Offer and the banner are shown to the owner in the built-in browser. Two or three choices are drawn in the dashboard's look, Rate Board, and the owner picks one. The choice is recorded under Comments.
- [ ] **The portal's screens.** The Offers screen is the portal's first screen. The details screen moves to `details`, with the contact details form below it. The top bar gains the two sections, Offers and Details. Every link between screens stays relative to the route, so the portal's own router and the acting frame both serve them unchanged.
- [ ] **The list.** Each row shows the Part's name and manufacturer `AlwaysEnglish`, its Category as the shared term, its photo or `CategoryIcon`, the prices written by `formatNumber` with "$" or "IQD" and marked `AlwaysEnglish`, both when both were quoted, the stock, the warranty in months, and the Confirmation's state. The list is paged, shows how many Offers there are, and can be searched.
- [ ] **The banner** shows only when an Offer is expired or about to expire. It gives both counts, and its button confirms all the Offers and then says how many it confirmed. It leaves once nothing is expired or about to expire.
- [ ] **The empty screen** says that the Vendor has no Offers yet. Its link to the catalog search waits for ticket 04, and until then nothing is shown in its place.
- [ ] Every query about a Vendor's Offers is under one key, so the list, the counts and the banner are asked again after any change and after confirm-all.
- [ ] **Text.** "Confirmed today", the days ago, "expired", the days left, the banner's counts and the result of confirm-all are sentences that count. Each has every plural form of its language, with the count written by `formatNumber`. Offer, Confirmation and Expired Offer get their Kurdish and Arabic words in `words.md` if they lack them. All the text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review (LANG-7).
- [ ] It follows DESIGN.md and the dashboard's own, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [ ] `pnpm platform:check` gains these lines, and passes on every line, in a window 360 pixels wide:
  - A made-up Vendor that has logged in opens the portal on the Offers screen, with the message for a Vendor with none.
  - An Offer the test adds over HTTP shows in the list with "today", its price and its Category.
  - Given an answer with Offers about to expire and expired, through Playwright's `page.route` as `answerAsForALoginWithNoVendor` does, the banner shows both counts. Confirm-all asks the real API and says how many it confirmed.
  - The details screen is reached by its section in the top bar, and the contact details form still saves.
  - The Admin acting as the Vendor sees the same Offers screen under the band.
  - The screen passes `checkInEveryLanguageOfTheVendorPortal`. `readInEveryLanguageOfTheVendorPortal` reads a counting sentence and a Category name, each differing between the languages. The Part's name and the price are drawn left to right in Kurdish and Arabic, with no Arabic-Indic digit.
  - `expectAccessible` passes on the screen with the banner, in the light and in the dark scheme.
- [ ] Shown once and then reverted, each failing on its own line: a counting sentence missing its Arabic `few` form (failing `pnpm check`); the price written by the browser's own number formatting; the banner's button given no accessible name.
- [ ] `accounts` ticket 07's checks that waited for `offers`, a sentence that counts and the Category names on a Vendor portal screen, are made here, and that is noted under Comments.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
