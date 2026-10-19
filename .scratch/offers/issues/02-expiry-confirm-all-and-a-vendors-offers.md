# 02: Expiry, confirm-all and a Vendor's Offers

**Spec:** [the offers spec](../spec.md)

**What to build:** Through the API, a Vendor lists its own Offers a page at a time, searches them, and confirms them all with one call (OFF-5). Each Offer says how many days ago it was confirmed (OFF-7), whether it is an Expired Offer (OFF-6) and whether it is about to expire (OFF-8). The list also holds the Vendor's counts of Offers, Expired Offers and Offers about to expire, which the banner and Expiring Offers need later. The tests of the 14-day and the 3-day boundaries are written before the code, as the MVP spec's testing strategy asks.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] **The rules, once.** The 14 days and the 3 days are constants in the API's domain, the same for every Vendor. An Offer is an Expired Offer when now is more than 14 days of 24 hours after its last Confirmation; at exactly 14 days it is not yet. It is about to expire when it is not expired and its last Confirmation is more than 11 days ago. The days since Confirmation are the whole days of 24 hours elapsed, rounded down. The `Offer` entity answers all three, given now, and the Store's queries use the same constants, with now passed in from the API's clock.
- [x] **The list.** `GET v1/vendors/{vendorId}/offers`, through `ListVendorsOffersQuery` and `core`'s `PagingRequest`, answers the Vendor's Offers, Expired Offers among them. Each has its Part's name, manufacturer, Category and photo, its prices, stock and warranty, the time of its Confirmation, the days since it, `expired` and `aboutToExpire`. It can be searched by the Part's name, manufacturer or part number, as the catalog search reads them. It is ordered by last Confirmation, oldest first, then by Part name. The answer also holds the three counts, for all the Vendor's Offers whatever the search.
- [x] **Confirming all.** `POST v1/vendors/{vendorId}/offers/confirm`, through `ConfirmAllOffersCommand`, sets every Offer of the Vendor's last Confirmation to now in one statement, its Expired Offers among them, and answers 200 with how many. It adds no history row.
- [x] Both endpoints use `VendorAccessRule`.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` passes with these tests, which move only Jest's `Date`, leaving every timer real, as the access tests do:
  - An Offer confirmed 14 days ago to the millisecond is not expired. One millisecond later it is, and is listed marked expired.
  - An Offer confirmed 11 days ago to the millisecond is not about to expire. One millisecond later it is.
  - The days since Confirmation are 0 just before 24 hours, 1 at 24 hours, and 14 at the boundary.
  - Confirming all answers how many, makes every Offer of the Vendor current, Expired Offers among them, leaves another Vendor's Offers as they were, and adds no history row.
  - The list holds the Vendor's Offers only, each once across the pages, oldest Confirmation first, and finds an Offer by its Part's name, manufacturer and part number.
  - The counts are right with Offers current, about to expire and expired, and do not change with the search.
  - Another Vendor's token is answered 403, a deactivated Vendor's own token 403 with `VENDOR_DEACTIVATED`, and a call without a token 401.
- [x] Shown once and then reverted, each failing its own test: the expiry compared with "at least" instead of "more than" 14 days; the 3 days counted from the expiry the wrong way; confirm-all left without its Vendor in the statement.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 20 October 2026: completed

**Commits.** `0f9c8cd` the reading of a search of Parts moved where the Offer Store can use it, `94e33e2` the expiry rules in the domain and the `Offer` entity, `c7c8e04` the index for a Vendor's list and its migration, `1eeaa3f` the Query, the Command, the Store, the two endpoints, the tests and the client written again.

**Decisions this ticket left open.**

- **The rules, written once.** `domain/offer/expiry.ts` holds `A_DAY` (24 hours in milliseconds), `DAYS_AN_OFFER_STAYS_CURRENT` (14) and `DAYS_OF_WARNING` (3), and turns now into two moments: `expiredIfConfirmedBefore(now)`, 14 days earlier, and `aboutToExpireIfConfirmedBefore(now)`, 11 days earlier. The `Offer` entity's `isExpired(now)`, `isAboutToExpire(now)` and `getDaysSinceConfirmation(now)` compare its Confirmation with them, and the Store's counts compare `confirmed_at` with the same two moments, passed to PostgreSQL as parameters. An Offer is expired when its Confirmation is strictly before the first moment, and about to expire when it is not and is strictly before the second. Days are counted by elapsed time, not by the calendar, so an Offer confirmed at 23:00 is still at 0 days at 08:00 the next morning.
- **One now for a whole list.** `ListVendorsOffersQuery` reads the API's clock once and passes the same moment to the Store's counts and, through its Output, to each listed Offer's expiry, so that a list read across a boundary cannot mark an Offer one way and count it another.
- **The answer.** `GET v1/vendors/{vendorId}/offers` answers `core`'s paged answer, whose `content` holds each Offer as ticket 01 answers one (`id`, `part`, `usdPrice`, `iqdPrice`, `inStock`, `warrantyMonths`, `confirmedAt`, `createdAt`) and adds `daysSinceConfirmation`, `expired` and `aboutToExpire`, with `counts: { offers, expired, aboutToExpire }` beside the page. The three expiry fields are on the list's items only, `ListedOfferResponse`, which extends `OfferResponse`: the spec gives them to the list and to a Part's visible Offers, not to the read of one Offer. Ticket 05 can add them to the read if its screen needs them.
- **The search** is the `search` query parameter, as the catalog search names it, read by the same two functions, now shared: the term split into words at spaces (`domain/part/search-words.ts`), and each word found anywhere in the Part's search text, regardless of case (`infrastructure/part/search-text.ts`). An empty or blank search finds every Offer.
- **The order** is last Confirmation, oldest first, then Part name, then the Offer's identifier, so that Offers confirmed at the same moment for Parts of the same name still page without skipping or repeating.
- **The counts** are of all the Vendor's Offers, whatever the search and the page, read in the same read-only snapshot as the page and its total.
- **Confirming all** answers 200 with `{ confirmed: n }`, as `reset-password` answers 200, and sets `confirmed_at` of every Offer of the Vendor in one `UPDATE`, whose row count is the answer. It adds no history row. A Vendor with no Offers is answered `{ confirmed: 0 }`. The Admin confirms a deactivated Vendor's Offers, as the access rule lets it manage them.
- **An index for the Vendor's list.** Ticket 01 left it here: `offer_vendor_confirmed_index` on `(vendor_id, confirmed_at)`, made by the migration `0010_index-offers-by-vendor-and-confirmation`, serves the list's order and the counts' comparisons. The index for a Part's visible Offers stays with ticket 06.
- **The tests' clock.** The tests add each Offer as the Admin with the clock moved to the moment of its Confirmation, then move the clock to the moment the list is read and make every token after that move. A deactivation is made with the clock running, since it calls Keycloak.

**How it was built.** Test-first, in slices at seam 2, each seen red for its own reason before its code: the list (404, no route yet), its search (every Offer of the Vendor found, the search ignored), the 14-day, 11-day and days-since boundaries (all three red against an entity that answered 0 days and never expired), the counts (no `counts` in the answer), and confirm-all (404, no route yet). The access lines were added to ticket 01's three access tests, now under "who may add, read, list and confirm Offers", and passed at once, since both endpoints ask `VendorAccessRule` first. The Offer tests are now 54, in the same file.

**The faults, each planted once by a script on a clean tree, run against the Offer tests, and reverted by restoring the file's text; the tree was clean after each.**

| Fault | Tests that failed | Why |
|---|---|---|
| The expiry compared with "at least" (`<=`) instead of "more than" 14 days, in the `Offer` entity | Not expired at 14 days to the millisecond, expired one millisecond later; the counts, whatever the search | At exactly 14 days the Offer was listed `expired: true`, `aboutToExpire: false`, and the Offer confirmed exactly 14 days before was listed expired |
| The 3 days counted from the expiry the wrong way, 14 + 3 days instead of 14 − 3, in `expiry.ts` | Both boundary tests; the counts, whatever the search; the move from about to expire to expired | No Offer was ever about to expire: `aboutToExpire` was false at 11 days and a millisecond and at 14 days, and the count 0 instead of 2 |
| Confirm-all left without its Vendor in the statement | Confirming every Offer of the Vendor and leaving another Vendor's as they were | Answered `{ confirmed: 4 }`, the other Vendor's Offer among them, instead of 3 |
| Also tried: the counts' expiry compared with "at least" (`lte`) in the Store | The counts, whatever the search; the move from about to expire to expired | 4 Expired Offers counted instead of 3, and 1 at exactly 14 days instead of 0 |

The entity's fault and the Store's fault each fail lines of their own, so a list that marks an Offer one way and counts it another is caught from either side.

**Checks.** `pnpm integration:check` passes with 311 tests in 9 files on the final tree. `pnpm check` passes on every commit in a fresh clone with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`, and `pnpm integration:check` passes on `c7c8e04` there too, with its migration (`94e33e2` adds only domain code that nothing calls yet). Docker itself was left running for the other implementers.
