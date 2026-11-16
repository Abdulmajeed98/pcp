# 03: Both price views through the API

**Spec:** [the builder spec](../spec.md)

**What to build:** Reading a Build now answers both price views in the chosen currency.

- **The first** gives each Part its Lowest Price and the Vendor it comes from, and the Build's total across Vendors (BLD-7, PRC-5).
- **The second** lists each Vendor that has any of the Build's Parts in stock, with its own total, the Parts it has and the Parts it lacks, fewest lacked first (BLD-8).

An Unstocked Part is answered as such and left out of every total (BLD-9). Everything is read at one Platform Rate, through the rules `browse` wrote once. The Shopper app will add, convert and compare nothing. A Shopper page will show the views in ticket 08. For now the integration tests prove them, written before the code, as the MVP spec's testing strategy asks of both price views.

**Blocked by:** 01

**Status:** resolved

- [x] **Each Part's Lowest Price**, with the identifier and name of the Vendor whose Offer it comes from, or none when it is an Unstocked Part. It is read through the visible-Offer rule, the Shown Price, the Lowest Price and OFF-11's order of a Part's Offers as `browse` wrote them, never a second copy. So of equal prices it is the Offer the Part page lists first.
- [x] **The first view's total**: each Part's Lowest Price times its quantity, added up as answered, after rounding (PRC-5). It is marked converted when any of them is a Converted Price. It leaves out Unstocked Parts, and is none when no Part has a Lowest Price.
- [x] **No Shown Price yet.** A Part whose first in-stock Offer has no Shown Price has no Lowest Price. This happens only before the first Platform Rate, with an Offer quoted only in the other currency. Such a Part is left out of the total, and the answer says that a price could not be shown.
- [x] **The second view**: each active Vendor with an in-stock Visible Offer for at least one of the Build's Parts. Each has its identifier and name, the Parts it has in stock with each Shown Price, its total (each Shown Price times its quantity, marked converted when any is converted), and the Parts it lacks.
  - The Parts it lacks are the Build's Parts that other Vendors stock and it does not. An Unstocked Part is in no Vendor's list.
  - The Vendors are ordered by how many Parts they lack, fewest first, then by their total, lowest first, then by name, then by identifier.
  - The totals and this order are new, and are written once in the API's domain.
- [x] **One statement, one moment.** Every Shown Price in the answer, both views and the visibility of every Offer are read at one Platform Rate, taken once in the statement that reads them, as every public read that answers a price does.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` gains these tests, written before the code, and passes:
  - A Part's Lowest Price ignores out-of-stock Offers, Expired Offers and a deactivated Vendor's Offers, and names its Vendor. With two equal prices it is the Offer the Part page lists first.
  - The total is each Lowest Price times its quantity, added up. It is marked converted when any is converted, and answered in each currency.
  - A Part made unstocked by putting its Offer out of stock, by letting it expire past 14 days, and by deactivating its only Vendor is answered as an Unstocked Part and left out of the total. Confirming the Offer again, or reactivating the Vendor, brings it back.
  - With no Platform Rate, a Part offered only in the other currency is left out of the total, and the answer says so.
  - Only active Vendors with an in-stock Visible Offer for a Build's Part are listed in the second view.
  - Each Vendor's total is its Shown Prices times their quantities, marked converted when any is. It lists the Parts it has and the Parts it lacks, and never an Unstocked Part.
  - The order is fewest Parts lacked first, then the lowest total, then the name, then the identifier, proved on Vendors that tie on each key in turn. It can differ between the two currencies.
  - A Platform Rate changed while a Build is read never mixes two rates in one answer, proved with `changeWhileReading`, as `browse` proved its figures.
- [x] Each of these faults is planted once and then reverted, and each fails its own test:
  - an out-of-stock Offer counted in a Vendor's total;
  - a quantity left out of the first view's total;
  - an Unstocked Part listed as lacking under every Vendor;
  - the Vendors ordered by total before what they lack;
  - the Platform Rate read in a second query.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 8 November 2026: both price views, their totals, the Vendors' order and the fault checks

**The answer.** `GET v1/build` (the client's `readBuild`) gains, beside ticket 01's fields:

- On each Part, `unstocked`, whether it is an Unstocked Part, visible or not; `priceNotShown`, whether some Vendor has it in stock but the first of its in-stock Visible Offers has no Shown Price, which happens only before the first Platform Rate; and `lowestPrice`, null in both of those cases, else `{ shownPrice, timesQuantity, vendor: { id, name } }`: the Lowest Price of one, that price times the Part's quantity as the total adds it up, and the Vendor whose Offer it comes from.
- `totalAcrossVendors`, the first view's total, a `ShownPriceResponse` that the Shopper's `ShownPrice` can draw with its "≈", or null when no Part has a Lowest Price.
- `vendors`, the second view, each `{ id, name, total, partsInStock: [{ partId, shownPrice, timesQuantity }], partsLacked: [partId] }`. Parts are named by their identifiers among the Build's Parts, in the Build's order, as the outcomes of ticket 02 name them.

`currency`'s description now says what it is to this endpoint (ticket 01's follow-up), and the operation's summary names both views.

**One statement, one moment.** `DatabaseBuildStore.readParts(partIds, currency, now)` reads, in one statement that joins `currentPlatformRate` once, each Part's row and photo, whether it is a Visible Part (`visiblePart(now)`), its Lowest Price with the Vendor of the Offer it comes from, and its in-stock Visible Offers, each Vendor's with its Shown Price. Visibility and prices are no longer read apart (ticket 01's other follow-up). Nothing in it is a second copy:

- The Lowest Price is `whatTheirOffersSay`'s. It moved unchanged from the Visible Part Store into `infrastructure/offer/what-their-offers-say.ts` (`fc1fee6`), then gained the identifier and name of the Vendor of the first in-stock Visible Offer in `inTheOrderOfAPartsOffers`, which a Category's list leaves unread. So of equal prices it is the Offer the Part page lists first.
- The in-stock Offers are a second lateral subquery, `stocked`, through `visibleOffer(now)` and `shownPriceIn` at the same `current_rate`, given as one JSON list beside the Part.
- An Unstocked Part is one with none in that list, and a Part whose price cannot be shown is one with some but no Lowest Price.

**The totals and the order, written once in the domain.** `domain/build/totals.ts` holds PRC-5's arithmetic, `timesQuantity` and `totalOf`: whole numbers of the currency's unit added up, marked converted when any price in the sum is. `domain/build/price-views.ts` holds `PriceViews.of(build)`, which gives the first view's total and the second view's Vendors (`BuildVendor.among`) in their order, `inTheSecondViewsOrder`: fewest Parts lacked, then the lowest total, then the name, then the identifier. `ReadBuildQuery`'s Output carries them beside the completeness. `BuildReading.read` now takes the currency, which ticket 04's picker will pass too.

**Decisions where the ticket leaves room**, each following the nearest written rule:

- **A Vendor's Part with no Shown Price.** The ticket says what the first view does before the first Platform Rate, and not what the second does. A Vendor with a Part in stock quoted only in the other currency still has it, with `shownPrice` null. Its total leaves the Part out, as the first view's does, and is null when none of its Parts has a Shown Price. In the order a Vendor with no total comes after those with one, as OFF-11 puts an Offer with no Shown Price after the others in its stock group. A test proves it. It concerns only a platform with no Platform Rate.
- **Names are compared** with `Intl.Collator('en')`, English collation, as near as JavaScript comes to the database's `en_US.utf8`, by which a Part page orders its Vendors' names; identifiers as their lower-case text, which is their byte order.
- **`timesQuantity`**, on each Part's Lowest Price and on each Part a Vendor has, which the ticket does not ask for, so that the Build page's "Lowest Price times its quantity" is answered by the API and not multiplied in the Shopper app.

**The tests**, 18 in `apps/api/src/test/infrastructure/build/endpoints/build.controller.prices.integration-spec.ts`, a file of their own so that ticket 02's tests of the same endpoint merge beside them. Ticket 01's file gained the new fields in its two exact answers: an empty Build answers `totalAcrossVendors: null` and `vendors: []`, and a Part with no Offer is unstocked. Each test was written before its code and run one slice at a time, with the reason each failed read, but for the four of the last row, as it says:

| Test | First run |
|---|---|
| A Part's Lowest Price leaves out an out-of-stock Offer, an Expired Offer and a deactivated Vendor's Offer, and names its Vendor | Red: no `lowestPrice` in the answer |
| Of two equal prices, the Offer the Part page lists first: the one confirmed last, and of two confirmed at once the one whose Vendor comes first by name, checked against `GET v1/parts/{id}/offers` | 400 at first, the test's own fault: it gave two CPUs, which a Build refuses. With a motherboard for the second Part it passed, the Lowest Price being `whatTheirOffersSay`'s |
| The total is each Lowest Price times its quantity, added up, whichever Vendor each comes from | Red: no `totalAcrossVendors` (each Part's `timesQuantity` already right) |
| The total is marked converted when any Lowest Price is, and is answered in each currency | Red: no `totalAcrossVendors` |
| A Part made unstocked by putting its Offer out of stock; by letting it expire past 14 days, still in stock at exactly 14; by deactivating its only Vendor, with a Build of it alone having no total; each back after a Confirmation or a reactivation | Red: no `unstocked` |
| With no Platform Rate, a Part in stock only in the other currency is left out of the total and said to have no price shown, in each currency, and shown once a rate is set | Red: no `priceNotShown` (the total already left the Part out) |
| One answer: the rate and every Offer's price changed while the Build is read, `offer` or `platform_rate` locked; the rate changed and a Vendor deactivated, `vendor`, `offer` or `platform_rate` locked (five tests, with `changeTheRateAndTheOffersWhileReading` and `changeTheRateAndDeactivateAVendorWhileReading`, both on `changeWhileReading`) | Passed on the one statement as written: they are seen red under the fault below |
| The second view lists only active Vendors with an in-stock Visible Offer for a Build's Part | Red: no `vendors` |
| Each Vendor's total, Parts in stock and Parts lacked, never an Unstocked Part; the order on Vendors tied on each key in turn; the order differing between currencies; a Vendor's Part with no Shown Price | Passed at their first run. Their texts were drafted before the code, but they ran only after the step that turned the line above green, in which the second view was written whole. Three of them are seen red under the faults below |

The five one-answer tests then also checked the second view's Vendors, and passed.

**The fault checks**, each planted by one exact edit on `f648690` by a script that refused a dirty tree, ran the test file and reverted by the inverse edit. The last, beyond the ticket, deleted a line, which the script could not find again, so it was put back by the inverse edit by hand. `git status` was clean after each.

| Fault | Edit | Failed |
|---|---|---|
| An out-of-stock Offer counted in a Vendor's total | `eq(offer.inStock, true)` taken out of `stocked`'s condition in `DatabaseBuildStore.ts` | `lists only the active Vendors …`: "Made-up Out of Stock Shop" listed; `gives each Vendor its total …`: the Computer Shop's out-of-stock GPU among its Parts, so the Computer Store lacks it and comes second; `made so by putting its only Offer out of stock …`: not unstocked |
| A quantity left out of the first view's total | `part.getLowestPriceTimesQuantity()` read as `part.getLowestPrice()?.getShownPrice()` in `PriceViews.of` | `is each Part's Lowest Price times its quantity …`: 670,000 for 900,000; and the seven other tests whose totals add two of a kit |
| An Unstocked Part listed as lacking under every Vendor | `BuildVendor.among` given every Part of the Build rather than those some Vendor has in stock | `gives each Vendor its total …`: the GPU and the case among both Vendors' Parts lacked; the three `judges every Offer …` tests: the kit, unstocked once its only Vendor is deactivated, among the remaining Vendor's Parts lacked |
| The Vendors ordered by total before what they lack | The first two keys of `inTheSecondViewsOrder` swapped | `orders the Vendors by how many Parts they lack …`: "Made-up Whole Shop", which lacks none at 1,200,000, last |
| The Platform Rate read in a second query | `current_rate` joined as a constant that a query of its own read first | `gives every price … while offer is locked`: 30,000 IQD, 20 $ at the old rate, for 40,000; `judges every Offer … while vendor is locked` and `… while offer is locked`: 18,000 for 24,000. While `platform_rate` is locked the rate's own query waits too, and both read after the change, as `browse`'s tests found |
| Beyond the ticket: the names left out of the order | The `byName` key taken out of `inTheSecondViewsOrder` | `orders the Vendors …`: Bravo and Charlie, tied on what they lack and on their total, ordered by identifier |

**The pieces.** Each commit was gated on `pnpm integration:check` and on `pnpm check --skip-nx-cache` after deleting every `*.tsbuildinfo`; `pnpm check` ran 32 tasks each time:

- `fc1fee6` refactor(api): read what a Part's Visible Offers say in one module (21 suites, 578 tests)
- `861917d` feat: answer a Build's first price view through GET v1/build (22 suites, 591 tests)
- `f648690` feat: answer a Build's second price view through GET v1/build (22 suites, 596 tests)
- this record, with a comment in `price-views.ts` corrected

**With Docker stopped.** Each of the three commits passed `pnpm check --skip-nx-cache` in a fresh clone in the scratchpad, after `pnpm install --frozen-lockfile --offline`, with `DOCKER_HOST` pointed at a socket that does not exist and `PLAYWRIGHT_BROWSERS_PATH` at an empty folder: 32 tasks succeeded each time. The owner's services stayed up, so Docker itself was not stopped, as in ticket 01.
