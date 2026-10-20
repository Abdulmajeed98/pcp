# 03: The Offers screen

**Spec:** [the offers spec](../spec.md)

**What to build:** The Vendor portal opens on the Vendor's Offers. Each Offer shows its Part, its prices, stock and warranty, and says when it was last confirmed: "today", a number of days ago, "expired", or the days left before it expires. A banner appears when any Offer is expired or about to expire (OFF-8). It gives both counts and holds the button that confirms all the Offers (OFF-5). The Vendor can search its own Offers. A Vendor with none is told so. The details screen moves to a section of its own in the top bar. All of it is in Kurdish, Arabic and English, in both directions, laid out for a phone first.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] **The design.** Before building, the Offers screen's layout, the row of an Offer and the banner are shown to the owner in the built-in browser. Two or three choices are drawn in the dashboard's look, Rate Board, and the owner picks one. The choice is recorded under Comments.
- [x] **The portal's screens.** The Offers screen is the portal's first screen. The details screen moves to `details`, with the contact details form below it. The top bar gains the two sections, Offers and Details. Every link between screens stays relative to the route, so the portal's own router and the acting frame both serve them unchanged.
- [x] **The list.** Each row shows the Part's name and manufacturer `AlwaysEnglish`, its Category as the shared term, its photo or `CategoryIcon`, the prices written by `formatNumber` with "$" or "IQD" and marked `AlwaysEnglish`, both when both were quoted, the stock, the warranty in months, and the Confirmation's state. The list is paged, shows how many Offers there are, and can be searched.
- [x] **The banner** shows only when an Offer is expired or about to expire. It gives both counts, and its button confirms all the Offers and then says how many it confirmed. It leaves once nothing is expired or about to expire.
- [x] **The empty screen** says that the Vendor has no Offers yet. Its link to the catalog search waits for ticket 04, and until then nothing is shown in its place.
- [x] Every query about a Vendor's Offers is under one key, so the list, the counts and the banner are asked again after any change and after confirm-all.
- [x] **Text.** "Confirmed today", the days ago, "expired", the days left, the banner's counts and the result of confirm-all are sentences that count. Each has every plural form of its language, with the count written by `formatNumber`. Offer, Confirmation and Expired Offer get their Kurdish and Arabic words in `words.md` if they lack them. All the text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review (LANG-7).
- [x] It follows DESIGN.md and the dashboard's own, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] `pnpm platform:check` gains these lines, and passes on every line, in a window 360 pixels wide:
  - A made-up Vendor that has logged in opens the portal on the Offers screen, with the message for a Vendor with none.
  - An Offer the test adds over HTTP shows in the list with "today", its price and its Category.
  - Given an answer with Offers about to expire and expired, through Playwright's `page.route` as `answerAsForALoginWithNoVendor` does, the banner shows both counts. Confirm-all asks the real API and says how many it confirmed.
  - The details screen is reached by its section in the top bar, and the contact details form still saves.
  - The Admin acting as the Vendor sees the same Offers screen under the band.
  - The screen passes `checkInEveryLanguageOfTheVendorPortal`. `readInEveryLanguageOfTheVendorPortal` reads a counting sentence and a Category name, each differing between the languages. The Part's name and the price are drawn left to right in Kurdish and Arabic, with no Arabic-Indic digit.
  - `expectAccessible` passes on the screen with the banner, in the light and in the dark scheme.
- [x] Shown once and then reverted, each failing on its own line: a counting sentence missing its Arabic `few` form (failing `pnpm check`); the price written by the browser's own number formatting; the banner's button given no accessible name.
- [x] `accounts` ticket 07's checks that waited for `offers`, a sentence that counts and the Category names on a Vendor portal screen, are made here, and that is noted under Comments.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.


## Comments

### 20 October 2026: built, the design awaiting the owner's choice

Everything but the look is built and tested. The screen is drawn as the recommended choice of each decision below; the owner's choice is recorded here when made, and the screen and DESIGN.md follow it.

**Commits.** `cf98124` a paged list that takes the portal's own words, `16ed05f` the client's types of a Vendor's list of Offers exported, `5829cfd` the Offers screen, the banner and confirm-all, the details screen moved to `details`, the top bar's sections, the text in three languages and the platform's tests.

**Decisions this ticket left open.**

- **The routes.** The Offers screen is the index of the portal's screens. `details` is a route of its own with two children, the details screen as its index and `contact-details`, so that the form's way back and its way after a save, both `..`, lead to the details screen under either frame. The "not found" screen's link, `..`, now leads to the Offers screen, and says "Open your Offers".
- **The sections.** The frame's top bar gains a row of its own below the Vendor's name, Log out and the switch: two links, Offers (`.`, matched exactly) and Details (`details`), relative to the frame's route, the current one marked with `aria-current` by React Router's `NavLink`. The plain messages for a Login with no Vendor and for a deactivated Vendor have no sections, as they have no screens.
- **The query key.** Every query about a Vendor's Offers is under `['offers', vendorId]` (`vendorsOffersKey` in the `offer` entity), apart from the Vendors' key, so that an edit of the Vendor does not ask its Offers again. Confirm-all asks the whole key again on success. A page of another Vendor's list is never kept as the placeholder of this one's, as when the Admin acts as one Vendor after another.
- **The counts and the banner** come with the list, from the API's `counts`, which are of all the Vendor's Offers whatever the search. The banner shows each count's sentence only when that count is not 0, and leaves when both are 0.
- **Confirm-all's result** is an `<output>` below the banner, which stays after the banner has left, until the screen is left, so that "how many it confirmed" can still be read once nothing needs confirming. A refusal is said below the button in the portal's language. The button waits while the API is asked.
- **The days left.** The API answers the days since the Confirmation and whether an Offer is expired or about to expire, but not the days left. The dashboard counts them as 14 less the days since, with the 14 written once in `entities/offer/model/confirmation.ts` beside a note that it is the API's constant, so that they follow the API's count and not the browser's clock: an Offer confirmed 11 days ago and a little more expires in 3 days, one at 13 in 1 day, one at exactly 14, not yet expired, "today".
- **What counts.** "Confirmed today" and "Expires today" are messages of their own, since a count of 0 has no form of its own in English or Kurdish. "Confirmed n days ago", "Expires in n days", "Expired, confirmed n days ago", the warranty's months, the count of Offers (and of Offers found, while a search is shown), the banner's two counts and confirm-all's result are sentences that count, each with every plural form of its language and the count written by `formatNumber`. The count of Offers is put on the screen's one plate, inside its sentence.
- **Prices.** "349.99 $", "1,250.50 $" and "1,875,000 IQD": the dollars and the dinars are written by `formatNumber`, and the cents are the answer's own two digits, kept when they are not "00", so that a price with cents keeps both its digits; a whole-dollar price is shown without them, "350 $". Each is `AlwaysEnglish`.
- **A warranty that is not stated** is left out of the row, rather than said.
- **The search** is in the screen's address, `?search=…&page=…`, as the Catalog's is, so that it can be reloaded and the back button returns to the one before; the query is passed to the API only when it holds words. A Vendor with no Offer at all is told so in place of the search and the list; a search that finds nothing says so with the words, `AlwaysEnglish`.
- **The words.** Offer, Confirmation and Expired Offer were already in `words.md`, and the Kurdish and Arabic drafts use them. `ListPages` and `PastTheLastPage` keep their English for the Admin console and take the portal's words as an optional prop.
- **The client's index** exports `ListedOfferResponse`, `VendorsOfferCountsResponse`, `VendorsOffersPageResponse` and `ConfirmedOffersResponse`, which the screen and the confirm-all hook name.
- **The tests' answer.** `answerTheOffersAsExpiring` in `apps/e2e/src/offers.ts` answers the list with one Expired Offer, one about to expire and the counts the test gives, until the page asks the API to confirm all, after which every list reaches the real API. So the banner line also shows that confirm-all asks the list again, and that the banner leaves once nothing is expired or about to expire.
- **Tests that moved.** The existing tests that opened the details screen first now open it at `/details` or by its section, and look for the form's link at `/details/contact-details`.

**How it was built.** The new lines of `vendor-offers.spec.ts` were written first and run red: all seven failed on the missing Offers screen (`offers-screen`, `offer` and `expiry-banner` not found), and the Offers the test added over HTTP were accepted. Then the entity, the feature, the page, the routes, the sections and the text; the first green run of the six affected files failed two lines on the Category's locator, which also matched the Category icon's `data-category`, and the row's Category got a test id of its own. The language lines in `dashboard-languages.spec.ts` read the count of Offers, a Category name and the warranty in each language, and check the Part's name and both prices drawn left to right with no Arabic-Indic digit; a second line checks the banner and confirm-all's result in each language.

**`accounts` ticket 07's waiting checks** are made here: the Offers screen's counting sentences (the count of Offers, the warranty's months, the banner's counts and confirm-all's result) and its Category names are read in each language by `readInEveryLanguageOfTheVendorPortal`, which also passes the screen through `checkInEveryLanguageOfTheVendorPortal`'s checks.

**The faults, each planted once by a script on a clean tree, run, and reverted by the inverse edit; the tree was clean after each.**

| Fault | What failed | Why |
|---|---|---|
| `counted_few` removed from the Arabic file | `pnpm check`, at the comparison of the language files | `"OffersScreen.counted": lacks the plural form few, which Arabic has.` |
| The dollars written by the browser's own number formatting, `Number(dollars).toLocaleString()` | The Offers screen's language line, and three other language lines that open the same Vendor's Offers screen first (the switch, the banner, and the Admin acting as the Vendor) | In the `ar-IQ` browser the page showed ١, ٢, ٥ and ٠; the English window of `vendor-offers.spec.ts` passed, as expected |
| The banner's button given no text, so no accessible name | The banner's accessibility line only | axe's `button-name` |

**Checks.** `pnpm platform:check` passes with 141 tests on `5829cfd`. `pnpm check` passes on every commit in a fresh clone with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`. No API code changed, so `pnpm integration:check` was not needed for these commits. The development database lacked ticket 02's migration `0010_index-offers-by-vendor-and-confirmation`, which `pnpm db:migrate` applied.

**The design, for the owner.** Four decisions, drawn in Rate Board at 360 pixels in Kurdish and Arabic by a throwaway capture test (deleted), are laid out on one page with `#d1` to `#d4`: the screen's layout (where the banner sits), the row of an Offer (prices on plates or not), the banner, and the top bar's two sections. Recommended and built: A in each.

### 20 October 2026: the owner's design choices

The owner went through the four decisions on the page of choices and took A in each, the screen as built and recommended:

- **The screen's layout (#d1):** the banner under the title, then the search and the list, over a banner pinned to the bottom of the screen and over the search first.
- **The row of an Offer (#d2):** each price on its own plate, on a line under the Part, over prices in plain Geist Mono at the end side and over smaller plates stacked there.
- **The banner (#d3):** the Sheet panel with an Action Red edge, its title, the two counts in bold, its explanation and the full-width button, over the counts on plates and over a compact Shelf panel without a title.
- **The top bar's sections (#d4):** two links under the bar, the current one on a Shelf ground, over two tabs sharing the width.

The dashboard's DESIGN.md records an Offer's row, the expiry banner, the Offers screen's layout, the prices on plates and the portal's sections.

### 20 October 2026: merged with `offers/integration`

`0c4d31e` merged the integration branch's tip, which then held tickets 06 and 08 (`d7ec2dc`, `3df9515`). The one conflict was the dashboard's DESIGN.md, where ticket 08's Missing specifications and this ticket's Offers screen each added lines beside the same ones; both are kept. The first `pnpm platform:check` after it failed one line of ticket 08's, which expected the bare `/missing-specifications` after a save while the list returned to `?page=2`: the development database's made-up Parts with gaps, which this ticket's tests give Offers, now fill more than a page. `80a3c8b` let that line accept the list's page.

Ticket 07 then landed (`2ace4a8`), with the same fix of that line (`6beb1f4`), and `f9e3464` merged the tip again: DESIGN.md kept the lines of tickets 07, 08 and 03, the client's index kept the types of all three, and the e2e line took the integration branch's wording of the same fix. On the merged tree `pnpm integration:check` passes with 346 tests in 12 files, `pnpm check` passes, and `pnpm platform:check` passes with 147 tests.
