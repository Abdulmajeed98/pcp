# 04: Add an Offer from the catalog search

**Spec:** [the offers spec](../spec.md)

**What to build:** From the Offers screen, a Vendor searches the whole catalog by name, manufacturer or part number, narrowed to a Category if it likes (OFF-3). Each result shows the Part with its photo or Category icon, and says when the Vendor already offers it, leading to that Offer. Picking a Part opens the Offer form. There the Vendor gives its prices, in USD, in IQD or both, its stock and its warranty, typed as its keyboard writes them. After saving, the Vendor is back at the search, still as it was, with a note that the Offer was added, ready to add the next.

**Blocked by:** 01, 03

**Status:** ready-for-agent

- [ ] **The design.** Before building, the search's results and the Offer form are shown to the owner in the built-in browser, in two or three choices in the dashboard's look. The owner picks one, and the choice is recorded under Comments.
- [ ] **The catalog search's answer.** `GET v1/parts` gains, for a Vendor's own Login, and for the Admin when a `vendorId` is given, the identifier of that Vendor's Offer for each Part when there is one. It never gives another Vendor's. `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] **The search screen** in the portal, below the Offers screen, with a field, a Category filter by the shared terms, and paged results. Each shows the Part's name, manufacturer and key part numbers `AlwaysEnglish`, its Category and its photo or `CategoryIcon`. A Part the Vendor offers is marked and leads to its Offer. When nothing matches, the screen says so. The Offers screen's add button and its empty message lead here.
- [ ] **The Offer form**, built with React Hook Form, holds the Part at its head, the USD and IQD fields, the in-stock switch, which starts on, and the warranty field. Before sending, it turns Arabic-Indic and Eastern Arabic-Indic digits into Western digits and drops thousands separators, spaces and the Arabic thousands separator. Every reason the API gives has a message in the three languages, shown beside its field.
- [ ] After a save, the Vendor returns to the search as it was, with a note that the Offer was added. The Offers list holds the new Offer.
- [ ] Its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review.
- [ ] It follows DESIGN.md and the dashboard's own, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [ ] `pnpm integration:check` gains these tests, and passes: the search, asked for a Vendor, names its Offer for each Part it offers and no other Vendor's; the Admin with a `vendorId` sees that Vendor's.
- [ ] `pnpm platform:check` gains these lines, and passes on every line, in a window 360 pixels wide:
  - A made-up Vendor searches by a made-up Part's number, picks it, adds an Offer quoted only in USD with a warranty, and sees it in the Offers list with "today".
  - The search now marks that Part as offered, and leads to the Offer.
  - A price typed in Arabic-Indic digits with separators is saved as its value.
  - An Offer with no price is refused beside the USD field, and the refusal's text differs between Kurdish and English.
  - The Admin acting as the Vendor adds an Offer under the band, and the Vendor, logged in, sees it.
  - The search and the form pass `checkInEveryLanguageOfTheVendorPortal`. The Category filter reads the shared terms in each language.
  - `expectAccessible` passes on the search with results and on the form with a refusal shown, in the light and in the dark scheme.
- [ ] Shown once and then reverted, each failing on its own line or test: Arabic-Indic digits sent unconverted; a refusal shown away from its field; the search answering another Vendor's Offer.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
