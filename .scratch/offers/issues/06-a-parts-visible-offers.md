# 06: A Part's visible Offers

**Spec:** [the offers spec](../spec.md)

**What to build:** Anyone, with no token, can ask the API for a Part's visible Offers: those that are not Expired Offers and whose Vendor is active (CAT-7, OFF-6, ACC-7). Each comes with the Vendor's name, both Quoted Prices as entered, the stock, the warranty and how many days ago it was confirmed (OFF-7), with in-stock Offers first (OFF-11). The rule for a visible Offer is written once, here, so that `pricing`, `browse`, `builder` and `sharing` all use it. No Shopper page shows the Offers yet; `browse` will.

**Blocked by:** 02

**Status:** resolved

- [x] **The rule, once.** A visible Offer is not an Expired Offer and its Vendor is active. It is written in the API's domain, with its query in the Offer Store, using ticket 02's constants and now from the API's clock.
- [x] **The endpoint.** `GET v1/parts/{partId}/offers`, public, through `ListVisibleOffersOfPartQuery`. It adds `security: []` to its `@ApiOperation`. Each Offer has the Vendor's identifier and name, the USD price as a decimal string and the IQD price as a whole number, each as entered or null, the stock, the warranty, the time of Confirmation and the days since it. In-stock Offers come first, then out-of-stock ones, and within each group the most recent Confirmation comes first, until `pricing` orders them by price. A Part that does not exist is answered 404 with `PART_NOT_FOUND`. A Part with no visible Offer is answered with an empty list.
- [x] The answer holds nothing a Shopper may not see: no Login identifier, no login phone number and no Expired Offer.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` gains these tests, which move only Jest's `Date`, and passes:
  - An Offer confirmed 14 days ago to the millisecond is in the answer. One millisecond later it is not. Confirming all, or saving it, brings it back at once.
  - A deactivated Vendor's Offers are left out, and come back when the Vendor is reactivated.
  - In-stock Offers come before out-of-stock ones.
  - The answer is given without a token, and with any token.
  - A removed Offer is not in it.
  - A Part that does not exist is answered 404, and one with no visible Offer with an empty list.
- [x] Shown once and then reverted, each failing its own test: the active check left out of the rule; the expiry check left out of the rule; the endpoint's public mark removed.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 20 October 2026: completed

**Commits.** `9d66e8f` the index for a Part's visible Offers and its migration, `1f75892` the rule, the Query, the Store's query, the endpoint, the tests and the client written again.

**Decisions this ticket left open.**

- **The rule, once.** `domain/offer/visibility.ts` states the rule and gives its one moment, `visibleIfConfirmedFrom(now)`, which is ticket 02's `expiredIfConfirmedBefore(now)`: an Offer confirmed at that moment or after is not an Expired Offer, so at exactly 14 days it is visible and one millisecond later it is not, by the same comparison the `Offer` entity makes. Its query is one function in the Offer Store, `visibleOffer(now)`, the SQL form of both conditions, `vendor.active` and `confirmed_at >= visibleIfConfirmedFrom(now)`, with now passed in from the API's clock. `OfferStore.listVisibleByPart(partId, now)` uses it; `pricing`, `browse`, `builder` and `sharing` are to read visible Offers through this function too, by a Store method of their own or this one, and no query for Shoppers reads `offer` another way.
- **What a visible Offer holds.** `VisibleOffer` in the domain is the `Offer` with its Vendor's name and nothing else of the Vendor, so no Login identifier and no login phone number can reach the answer. The answer is a plain list of `VisibleOfferResponse`, as `GET v1/categories` answers its list, not `core`'s paged answer: a Part has one Offer at most per Vendor, and a Shopper's Part page shows them all. Each holds `vendor: { id, name }`, `usdPrice` (the decimal string, or null), `iqdPrice` (whole dinars, or null), `inStock`, `warrantyMonths`, `confirmedAt` and `daysSinceConfirmation`. It holds neither the Offer's identifier nor the Part, which the address names; `browse` can add either if its page needs it.
- **The order** is in stock first, then the most recent Confirmation, then the Vendor's name, then the Offer's identifier, so that the order is the same at every read.
- **One now.** `ListVisibleOffersOfPartQuery` reads the API's clock once, and the same moment decides which Offers are visible and counts each one's days since Confirmation.
- **A Part that does not exist** is asked of `PartStore.readById` first, as `CreateOfferCommand` does, and answered 404 with `PART_NOT_FOUND`; an address that is not an identifier is answered the same.
- **Public.** `@Public()` on the endpoint and `security: []` in its `@ApiOperation`, as `GET v1/status` and the photos have. It is in a controller of its own, `PartOffersController`, beside `OfferController` in the Offer module, since its callers are Shoppers rather than a Vendor or the Admin.
- **The index for a Part's visible Offers**, which ticket 02 left here: `offer_part_confirmed_index` on `(part_id, confirmed_at)`, made by the migration `0011_index-offers-by-part-and-confirmation`.
- **Saving, and a removed Offer.** Ticket 05's edit and removal do not exist yet. "Saving it brings it back" is proved here for confirm-all only, and "a removed Offer is not in it" waits too: both lines are left to ticket 05, under its Comments.

**How it was built.** Test-first at seam 2, in a new file, `part-offers.controller.integration-spec.ts`, each slice seen red for its own reason before its code: the answer's shape, another Part's Offers, `PART_NOT_FOUND` and the empty list (404, no route yet); the 14-day boundary and confirm-all bringing an Offer back (the Expired Offer still answered); a deactivated Vendor left out and back on reactivation (its Offer still answered); in-stock first (the most recent Confirmation first, whatever the stock). The lines on tokens and on what the answer holds passed at once, since the endpoint was public from its first slice and its answer built only from the Vendor's name; the faults below show they can fail. The tests move only Jest's `Date`; the deactivation and the reactivation run with the clock running, since they call Keycloak.

**The faults, each planted once by a script on a clean tree, run against the visible Offers' tests, and reverted by restoring the file's text; the tree was clean after each.**

| Fault | Tests that failed | Why |
|---|---|---|
| The active check left out of the rule, in `visibleOffer` | A deactivated Vendor's Offers left out and back on reactivation | The deactivated Vendor's Offer was answered beside the other |
| The expiry check left out of the rule, in `visibleOffer` | Visible at 14 days to the millisecond and left out one millisecond later; visible again at once after confirm-all | The Expired Offer was still answered, so the list was never empty before confirm-all |
| The endpoint's public mark, `@Public()`, removed | All ten, the line on tokens among them | Every read without a token was answered 401 |
| Also tried: in stock left out of the order | In-stock Offers before out-of-stock ones | The most recent Confirmation came first, out of stock or not |

**Checks.** `pnpm integration:check` passes with 321 tests in 10 files on the final tree. `pnpm check` passes on both commits, and `pnpm integration:check` on `9d66e8f`, in a fresh clone with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`. Docker itself was left running for the other implementers.
