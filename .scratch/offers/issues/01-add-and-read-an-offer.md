# 01: Add and read an Offer

**Spec:** [the offers spec](../spec.md)

**What to build:** Through the API, a Vendor's own Login, or the Admin acting for it, adds an Offer for any Part in the catalog and reads it back. The Offer holds a Quoted Price in USD, in IQD or in both, whether the Part is in stock, an optional warranty in months, and the time of its Confirmation (OFF-2). A Vendor has at most one Offer for a Part (OFF-1). Adding an Offer is a Confirmation, whose time the API's clock gives (OFF-5). It is the first row of the Offer history, with the Caller who made it (OFF-10). No screen shows it yet. The integration tests are the proof.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] **The tables.** `offer`, with the Vendor and the Part as a unique pair, the USD price as whole cents and the IQD price as whole dinars, each nullable, with a check that at least one is present, in stock, the warranty, the time of the last Confirmation and the time of creation. `offer_history`, keyed by Vendor and Part, which neither references the Offer nor is removed with it. Both are made by a migration generated with `pnpm db:generate`, and the migration is committed.
- [x] **The checks.** `OfferDetails.check`, in the domain, is written once. USD is positive, with at most two decimal places, and at most 100,000.00. IQD is a positive whole number, at most 150,000,000. The warranty is optional, a whole number of months from 1 to 120. In stock is required. Each refusal is `NOT_VALID` with its `field` and one of the reasons `missing` (no price at all, on `usdPrice`), `notANumber`, `notPositive`, `tooManyDecimals`, `tooLarge` and `notWholeMonths`. The first detail that does not fit is named, in the order USD, IQD, in stock, warranty.
- [x] **The API as the source of time.** The time of a Confirmation and of a history row comes from the API's clock, never from the database's `now()`.
- [x] **The endpoints.** `POST v1/vendors/{vendorId}/offers` answers 201 with the Offer. `GET v1/vendors/{vendorId}/offers/{offerId}` answers one Offer with its Part's name, manufacturer, Category and photo. The USD price is answered as a decimal string, "349.99", and the IQD price as a whole number. Both endpoints use `VendorAccessRule`, which `VendorModule` now exports. An Offer that is another Vendor's, or does not exist, is answered 404 with `OFFER_NOT_FOUND`. A Part that does not exist is answered 404 with `PART_NOT_FOUND`. A second Offer for the same Part is answered `NOT_VALID`, `field: 'partId'`, `reason: 'taken'`, also when two requests arrive at once.
- [x] **The use cases.** `CreateOfferCommand` and `ReadOfferQuery`, with their own Input and Output classes, the `Offer` entity and the `OfferStore` port with its database implementation. A Store method finds a Vendor's Offer by Part, for `sheet` and `part-requests` to use later.
- [x] **The history.** Creating an Offer writes one row in the same transaction, holding the time, the Vendor, the Part, both prices and in stock as created, and the Caller's Login identifier.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` passes with these tests:
  - A Vendor adds an Offer quoted only in USD, one only in IQD and one in both, and reads each back as entered, "349.99" kept with its cents.
  - No price, a price of zero, a negative price, three decimal places in USD, a fraction of a dinar, each price over its limit, and a warranty of 0, of 121 or of 1.5 months are each refused, naming the field and the reason.
  - A second Offer for the same Part is refused as taken. Two requests at once leave one Offer.
  - An Offer for a Part that does not exist is answered 404.
  - The Admin adds an Offer for any Vendor, a deactivated one among them.
  - A Vendor's token at another Vendor's Offers is answered 403 with `VENDOR_ACCESS_DENIED`, whether that Vendor exists or not. Reading another Vendor's Offer through one's own address is answered 404 with `OFFER_NOT_FOUND`.
  - A deactivated Vendor's own token, not run out, is answered 403 with `VENDOR_DEACTIVATED`.
  - A call without a token is answered 401.
  - Creating an Offer writes one history row, with the time of the moved clock and the Caller's Login identifier. The Admin acting is recorded as the Admin.
- [x] Shown once and then reverted, each failing its own test: the unique pair removed; the database's clock used for the Confirmation's time; the ownership check left out of reading an Offer by its identifier.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 20 October 2026: completed

**Commits.** `dcd7efa` the two tables and their migration, `b3c8479` the reading of a Part's row moved where the Offer Store can use it, `0235a9c` `OfferDetails.check`, `c7a199f` the use cases, the Store, the two endpoints, the tests and the client written again.

**Decisions this ticket left open.**

- **The request.** `POST v1/vendors/{vendorId}/offers` takes `partId`, `usdPrice`, `iqdPrice`, `inStock` and `warrantyMonths`. The USD price is sent as it is answered, the text of a decimal number, `"349.99"`, so that its cents arrive as typed and are read digit by digit into whole cents. The IQD price and the warranty are JSON numbers, and in stock a boolean. A detail of the wrong JSON kind, or a missing `partId`, is refused by the request's own check, naming the field with no reason, as `accounts` does. `notANumber` is therefore the USD price's alone: a thousands separator, Arabic-Indic digits or words. An empty USD price is taken as not given.
- **The reasons by field.** No price at all is `missing` on `usdPrice`. A price of zero or less, and a warranty under 1, are `notPositive`. Three decimal places in USD and a fraction of a dinar are `tooManyDecimals`. A price over its limit and a warranty over 120 are `tooLarge`. A warranty that is not whole is `notWholeMonths`, checked before its range. No in stock is `missing` on `inStock`. A USD price of `"350"` is answered `"350.00"`.
- **The answer.** An Offer is answered with `id`, `part` (the catalog search's `PartSummaryResponse`: identifier, Category, name, manufacturer, part numbers and photo's path), `usdPrice`, `iqdPrice`, `inStock`, `warrantyMonths`, `confirmedAt` and `createdAt`. The POST answers the same.
- **The tables.** `offer` holds `usd_price_cents` and `iqd_price`, both `integer`, with the check `offer_has_a_price` and the unique pair `offer_vendor_part_unique`. Both of its times come from the API's clock and have no default. It references the Vendor and the Part, neither of which is ever deleted. `offer_history` references the Vendor and the Part, not the Offer, and holds a `change` column, an enum of `created`, `changed` and `removed`, so that ticket 05 can mark an edit and a removal without changing the enum. The Caller's Login identifier is `changed_by`, as `text`, since the Caller's identifier is a string. An index on Vendor, Part and time serves a later read of one Offer's history. The indexes for a Vendor's list and a Part's visible Offers are left to tickets 02 and 06, which make those queries; the unique pair already leads with the Vendor.
- **The time of creation** is the time of the first Confirmation, from the same reading of the API's clock.
- **A second Offer for a Part** is refused by the unique pair alone. The Store tells its refusal by PostgreSQL's code and the rule's name, through `brokeUniqueRule`, and answers `NOT_VALID` on `partId` with `taken`. The order of checks is the access rule, the details, the Part's existence, then the unique pair.
- **`OfferStore.readByPart`** is in the port and the database Store, for `sheet` and `part-requests`, and nothing calls it yet. A first version had `CreateOfferCommand` read it before creating, but the fault checks showed that this read refused every one of five requests sent at once, so neither the unique pair nor its refusal as taken was ever tested. The Command no longer reads it, and the method has no test until a caller arrives.
- **Moving the clock.** `test-utils/clock.ts` has `moveTheClockTo(moment)`, which fakes `Date` alone with Jest's fake timers and holds it there, and `letTheClockRun()`. A token is judged by the same clock, so a test makes its tokens after moving it. The history is read from the database by `offerHistoryRows()` in `test-utils/database/test-database.ts`.

**How it was built.** The tables first, then the domain and the Store, then the 42 tests at seam 2 in `offer.controller.integration-spec.ts`, which passed when first run. The faults below show that each group can fail.

**The faults, each planted once by a script on a clean tree, run against the Offer tests, and reverted by restoring the file's text; `git status` was clean after each.**

| Fault | Tests that failed | Why |
|---|---|---|
| The unique pair removed from the migration | A second Offer refused as taken; several requests at once leave one Offer; nothing recorded for a refused Offer | The second request and the requests at once were answered 201 |
| The database's `now()` for the time of Confirmation | Confirmed and created at the time of the API's clock; one of the reads back as entered | `confirmedAt` was the container's time, 2026-10-19T21:45:43.728Z, not the moved 2027-03-14T09:26:53.589Z, and no longer equal to `createdAt` |
| The ownership check left out of reading an Offer by its identifier | `OFFER_NOT_FOUND` for another Vendor's Offer through one's own address | Answered 200 with the other Vendor's Offer |
| Also tried: the unique pair's refusal not turned into `taken` | The same three as the unique pair | The requests at once were answered 500 |

The first run of the faults, with the read before creating, failed nothing for the unique pair and nothing for its refusal: that is how the read was found to hide them.

**Checks.** `pnpm integration:check` passes with 299 tests in 9 files on the final tree. `pnpm check` passes on every commit in a fresh clone with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`, and `pnpm integration:check` passes on `b3c8479` there too (`0235a9c` adds only domain code that nothing calls yet). Docker itself was left running for the owner's other work.

### 20 October 2026: the owner's decisions

The owner went through the decisions above one at a time and kept each as built:

- `OfferStore.readByPart` stays in the port and the Store, untested until `sheet` or `part-requests` calls it.
- The request takes the USD price as a decimal string and the IQD price and the warranty as JSON numbers, as the answer gives them.
- The history's `change` column keeps its three values, `created`, `changed` and `removed`, for ticket 05.
- The commit that also writes the generated client keeps no scope, as the commit convention says, rather than the `api` scope the brief named.
