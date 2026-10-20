# 04: Add an Offer from the catalog search

**Spec:** [the offers spec](../spec.md)

**What to build:** From the Offers screen, a Vendor searches the whole catalog by name, manufacturer or part number, narrowed to a Category if it likes (OFF-3). Each result shows the Part with its photo or Category icon, and says when the Vendor already offers it, leading to that Offer. Picking a Part opens the Offer form. There the Vendor gives its prices, in USD, in IQD or both, its stock and its warranty, typed as its keyboard writes them. After saving, the Vendor is back at the search, still as it was, with a note that the Offer was added, ready to add the next.

**Blocked by:** 01, 03

**Status:** ready-for-agent

- [x] **The design.** Before building, the search's results and the Offer form are shown to the owner in the built-in browser, in two or three choices in the dashboard's look. The owner picks one, and the choice is recorded under Comments.
- [x] **The catalog search's answer.** `GET v1/parts` gains, for a Vendor's own Login, and for the Admin when a `vendorId` is given, the identifier of that Vendor's Offer for each Part when there is one. It never gives another Vendor's. `pnpm api-client:write` is run, and the description and the client are committed.
- [x] **The search screen** in the portal, below the Offers screen, with a field, a Category filter by the shared terms, and paged results. Each shows the Part's name, manufacturer and key part numbers `AlwaysEnglish`, its Category and its photo or `CategoryIcon`. A Part the Vendor offers is marked and leads to its Offer. When nothing matches, the screen says so. The Offers screen's add button and its empty message lead here.
- [x] **The Offer form**, built with React Hook Form, holds the Part at its head, the USD and IQD fields, the in-stock switch, which starts on, and the warranty field. Before sending, it turns Arabic-Indic and Eastern Arabic-Indic digits into Western digits and drops thousands separators, spaces and the Arabic thousands separator. Every reason the API gives has a message in the three languages, shown beside its field.
- [x] After a save, the Vendor returns to the search as it was, with a note that the Offer was added. The Offers list holds the new Offer.
- [x] Its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review.
- [x] It follows DESIGN.md and the dashboard's own, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] `pnpm integration:check` gains these tests, and passes: the search, asked for a Vendor, names its Offer for each Part it offers and no other Vendor's; the Admin with a `vendorId` sees that Vendor's.
- [x] `pnpm platform:check` gains these lines, and passes on every line, in a window 360 pixels wide:
  - A made-up Vendor searches by a made-up Part's number, picks it, adds an Offer quoted only in USD with a warranty, and sees it in the Offers list with "today".
  - The search now marks that Part as offered, and leads to the Offer.
  - A price typed in Arabic-Indic digits with separators is saved as its value.
  - An Offer with no price is refused beside the USD field, and the refusal's text differs between Kurdish and English.
  - The Admin acting as the Vendor adds an Offer under the band, and the Vendor, logged in, sees it.
  - The search and the form pass `checkInEveryLanguageOfTheVendorPortal`. The Category filter reads the shared terms in each language.
  - `expectAccessible` passes on the search with results and on the form with a refusal shown, in the light and in the dark scheme.
- [x] Shown once and then reverted, each failing on its own line or test: Arabic-Indic digits sent unconverted; a refusal shown away from its field; the search answering another Vendor's Offer.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 20 October 2026: built, the design awaiting the owner's choice

Everything but the look is built and tested. The screens are drawn as the recommended choice of decisions 2 to 4 below, and as choice A of decision 1, where C is recommended; the owner's choice is recorded here when made, and the screens and DESIGN.md follow it.

**Commits.** `5a1dfb8` the catalog search's Offer identifier in the API, its tests and the client written again, `c99a14e` shadcn/ui's switch, `735e183` the catalog search, the Offer form, the Offer's screen, the routes, the text in three languages and the platform's tests, `f6c83db` the offered Part's English lines on the start side.

**Decisions this ticket left open.**

- **The search's answer.** `GET v1/parts` takes an optional `vendorId`, decided by `VendorAccessRule`, and each Part found carries `offerId`, that Vendor's Offer for it or null. A Vendor's own Login that names no Vendor gets its own Offers named; the Admin naming none gets none, so the Admin console's Catalog is unchanged but for `offerId: null`. A Login with no Vendor behind it gets none, and naming a Vendor is refused for it with `VENDOR_ACCESS_DENIED`. A deactivated Vendor's own Login is now refused at the search with `VENDOR_DEACTIVATED`, as at every Vendor portal endpoint; before this ticket it could still search. The Admin naming a Vendor that does not exist is answered 404 with `VENDOR_NOT_FOUND`. The portal always sends its Vendor's identifier, so the same screen serves the Admin acting as a Vendor.
- **Where it is decided.** `SearchPartsQuery` asks `VendorAccessRule` for the Vendor, so `PartModule` now imports `VendorModule`; the Part Store joins the one Offer of the unique pair of Vendor and Part (`offer_vendor_part_unique` serves the join), as its list of Parts missing specifications already joins `offer`. Each Part is found once, also when several Vendors offer it. The answer's type is `FoundPartResponse`, `PartSummaryResponse` with `offerId`, so an Offer's own `part` does not gain the field.
- **The routes.** The catalog search is `add`, below the Offers screen, with the form for a new Offer at `add/<partId>`, which keeps the search's query; the form's way back and its way after a save are `..` with the query, so both reach the search as it was under either frame. An offered Part leads to `offers/<offerId>`, a screen of the Offer itself, the Part at its head and its prices, stock and warranty, read with `GET v1/vendors/{vendorId}/offers/{offerId}`. Ticket 05 makes that address the form that changes the Offer, so the link from the search stays. The Offers screen's add button (outlined, beside its title) and its empty message's link lead to `add`. The portal's Offers section is marked current on the Offers screen alone, as ticket 03 left it, not on the screens below it.
- **The note after a save** is carried in the address's state, the Part's name, so it shows on the search the form returns to and is gone at the next search or a reload. It is an `<output>`, announced when it appears.
- **The query key.** The portal's search is under the Vendor's Offers' key, `['offers', vendorId, 'catalog', …]`, since what it answers depends on them: adding an Offer asks it, the list and the counts again, and the Part just offered is marked at once. One Offer is under the same key.
- **The digits.** `westernNumberOf` turns Arabic-Indic and Eastern Arabic-Indic digits into Western ones and the Arabic decimal separator `٫` into a point, and drops commas, the Arabic thousands separator `٬`, the Arabic comma `،` and every kind of space. The USD price is then sent as its text, for the API to read and refuse with its own reasons; the IQD price and the warranty as numbers. Since the API takes those two as numbers, the form refuses one that is not a number itself, as `notANumber`, beside its field; a fraction of a dinar, a negative price or a warranty of half a month is sent as it is, for the API to refuse naming why. No price at all is sent too, so the API's `missing` on `usdPrice` is what the Vendor sees.
- **The refusals.** Every reason ticket 01 lists has a message under `OfferForm.refused`, by field, and a reason the form does not know says `other` beside its field. A refusal of the Part as taken names no field of the form and is said above it, in words of its own that send the Vendor back to the search, where the Part is marked. A refusal that says a limit names it, written by `formatNumber`; the limits are written once in `features/offer-form/model/limits.ts`, beside a note that they are the API's.
- **The switch.** shadcn/ui's, added with `pnpm dlx shadcn@4.21.5 add switch` from the dashboard's folder, and held to the root DESIGN.md: a track 24 by 44 pixels that takes a tap 44 pixels high, Control Edge when off, Ink when on. It is labelled by a `<label>` around it, as Base UI's documentation shows, and named by its sentence below.
- **Where the code lives.** The form and the Part's head, `OfferedPart`, are the feature `offer-form`, which ticket 05 extends to change an Offer; the search is the page `catalog-search` (the Admin console's is `catalog`), the form's screen `new-offer`, the Offer's screen `offer`. `AddedOffer`, the state the form leaves for the search, is in the `offer` entity, so neither page imports the other.
- **The text.** `OffersScreen.add` and `addFirst`, and the sections `CatalogSearch`, `NewOffer`, `OfferForm` and `OfferScreen`, in the three languages. "Parts found" counts, with every plural form of each language. The Kurdish and Arabic drafts take Offer, Part and Category from `words.md`, which lacked no word.

**How it was built.** The API first: the eight tests of `part.controller.search.offers.integration-spec.ts` were written before the code and run red: six failed, on `offerId` being absent or on `vendorId` refused as a detail the request does not declare. The two that passed, each Part named once and a `vendorId` given twice refused, held before as they hold now. Then the domain, the Store and the request, after which the search's existing test expected `offerId: null` for the Admin. The screens were built next and their platform lines written after them, so those lines were not seen red before the code; the faults below show that each line can fail. The capture of the design choices found a fault no test had: at the head of the form, the Part's name and part numbers were blocks of their own, left to right, and sat on the left in Kurdish and Arabic while the line between them sat on the right. `f6c83db` made them inline, as a row's are.

**The faults, each planted once by a script on a clean tree, run, and reverted by the inverse edit; the tree was clean after each.**

| Fault | What failed | Why |
|---|---|---|
| The search's join of the Offer without its Vendor, `eq(offer.vendorId, vendorId)` replaced by a condition always true | Three of the search tests: the Vendor's own Offers named and no other's; each Part named once; the Admin's `vendorId` | Another Vendor's Offer was named, and a Part both offer was found twice |
| The digit conversion left out of `westernNumberOf` | The line of prices in Arabic-Indic digits | The form refused the IQD price and the warranty as not numbers, so the Offer was never sent |
| The USD price sent as typed, unconverted | The same line | The request held `"usdPrice": "١٬٢٥٠٫٥٠"` where `"1250.50"` was expected |
| Every refusal set beside the warranty field | The no-price line (no refusal in the USD field), and the two lines that wait for that refusal, the form's accessibility and its language line | The refusal was shown away from its field |

**Checks.** `pnpm integration:check` passes with 354 tests in 13 files on the final tree. `pnpm platform:check` passes with 156 tests on `f6c83db`, nine of them new. `pnpm check` passes on the final tree, and on `c99a14e` alone, unpacked from its commit, with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`. The development database had every migration; `pnpm db:migrate` changed nothing.

**Checks on a phone wait for hosting**, and are open: the catalog search and the Offer form used with a thumb, in Kurdish and in English; a price typed on a Kurdish and on an Arabic keyboard. The spec lists them, and they are added to the MVP spec's list under Testing strategy.

**The design, for the owner.** Four decisions, drawn in Rate Board at 360 pixels in Kurdish and Arabic by a throwaway capture test (deleted), laid out on one page with `#d1` to `#d4`:

1. **A Part the search found:** A, the Catalog's row, part numbers on the secondary line (built); B, an outlined Add or Open at the row's end; C, as A with the part numbers on a line of their own (recommended: at 360 pixels a long part number breaks inside the secondary line, which is hard to read right to left, and the form's head shows it on its own line).
2. **The Offer form:** A, the Part on a Sheet panel, each price on its own row, the switch, the warranty, a full-width button (built, recommended); B, the two prices side by side with the currency inside the field; C, the Part between rules and the button pinned to the bottom.
3. **The note after a save:** A, one Confirmed Green line with a tick (built, recommended); B, a panel with a Confirmed Green edge, a title and a link to the Offers.
4. **Where an offered Part leads:** A, a screen of the Offer, which ticket 05 makes the form (built, recommended); B, the Offers screen searched for the Part's number.

### 20 October 2026: the owner's design choices

The owner went through the four decisions on the page of choices:

- **A Part the search found (#d1): C**, the part numbers on a line of their own, as recommended, over the Catalog's one secondary line as built and over an outlined Add or Open at the row's end.
- **The Offer form (#d2): A**, as built and recommended: the Part on a Sheet panel, each price on its own row, the switch, the warranty and a full-width button, over the prices side by side with the currency inside the field and over the button pinned to the bottom of the screen.
- **The note after a save (#d3): B**, a Sheet panel with a Confirmed Green edge, its title "Offer added", the sentence that names the Part and a link to the Offers, **against the recommendation** of one Confirmed Green line with a tick.
- **Where an offered Part leads (#d4): A**, the Offer's own screen, as built and recommended, over the Offers screen searched for the Part's number.

The row and the note were changed to the choices; the note's title and its link, "See your Offers", are new text in the three languages, drafted and marked for review. The platform's line that adds an Offer now leaves the search by the note's link, and the accessibility line of the search now checks it with the note shown, the Part just offered marked. The dashboard's DESIGN.md records the portal's catalog search and its layout, a Part it found, the Offer form, the switch, the note after an Offer is added, an Offer's screen and where their plates are.

