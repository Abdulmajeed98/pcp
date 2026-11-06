# 15: The platform's figures

**Spec:** [the browse spec](../spec.md)

**What to build:** A Shopper can see what the platform holds: how many Vendors and Visible Offers it lists, the Platform Rate behind every Converted Price, and how many days an Offer stays listed without a Confirmation. The Shopper app's DESIGN.md, approved by the owner in ticket 08, prints these on the home page's card and facts row, and puts the rate on a Part's price slip. No public endpoint answered them, so on 6 November 2026 the owner chose to add one. This ticket adds it and teaches the stand-in API to answer it. Ticket 09 shows the figures on the home page, and ticket 12 shows the rate on the slip.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] **`GET v1/platform-figures`** is public, as the spec's other public endpoints are. It answers:
  - how many active Vendors the platform has;
  - how many Visible Offers it lists, by `visibleOffer(now)`;
  - the current Platform Rate, in whole dinars per dollar, or none until the Admin sets the first;
  - how many days an Offer stays current without a Confirmation (OFF-6), read from the API's own expiry rule, never from a second copy.

  The counts and the rate are read in one query, at one moment, so that one answer never mixes two moments.
- [x] **The rate's history stays the Admin's.** The answer holds the current rate's value alone, not when it was set or by whom. `v1/platform-rate` stays the Admin's alone, as `pricing` left it.
- [x] The OpenAPI document and the generated client are written again with `pnpm api-client:write`.
- [x] **The stand-in API** in `apps/inspector` answers the endpoint from the made-up shop, typed by `@pcp/api-client`: its Vendors, its Offers, its Platform Rate of 1,575 and the days. This lets `pnpm shopper:inspect` show the home page's figures. The stand-in judges no visibility, as the spec says.
- [x] `pnpm integration:check` passes, with these lines at the API seam:
  - With no Vendor, no Offer and no rate, it answers zero, zero, none and the days.
  - A deactivated Vendor and its Offers are not counted, and reactivating the Vendor counts them again.
  - An Expired Offer is not counted (moved with `moveTheClockTo`), and confirming it again counts it.
  - The rate is none until one is set, and then the latest rate set.
  - An Admin's or a Vendor's token changes nothing, and no token is needed.
- [x] Each new line is seen to fail once, by a deliberate fault that is then reverted, for example counting Expired Offers. Which test failed, and why, is recorded under Comments.
- [x] `pnpm check` passes, and the work is committed.

## Comments

### 6 November 2026: completed

**Commits.** `44cab98` adds `GET v1/platform-figures`, its tests, the client written again, and `PlatformFiguresResponse` among the types `@pcp/api-client` exports; it spans `api` and `api-client` and takes no scope. `b625ccd` teaches the stand-in API to answer it (`inspector`).

**Decisions this ticket left open.**

- **The answer** is `PlatformFiguresResponse`, four plain fields at the top, as ticket 09 needs a plain and stable shape: `activeVendorCount`, `visibleOfferCount`, `iqdPerUsd` (a whole number of dinars per dollar, or null until the Admin sets the first rate) and `daysAnOfferStaysCurrent`. The rate's value is named `iqdPerUsd`, as the Admin's `CurrentPlatformRateResponse` and `SetPlatformRateRequest` name it, so that the one figure has one name across the API; its description names the Platform Rate. The counts are named as `vendorCount` and `offerCount` already are. The client's function is `readPlatformFigures`, with no parameters.
- **Where it lives.** `visibleOffer(now)` is private to the Offer Store's module, so the read is the Offer Store's `readPlatformFigures(now)`, beside the other reads for Shoppers, "a Store method of their own" as the MVP spec has it; nothing of the rule is written again. `PlatformFigures` and `ReadPlatformFiguresQuery` are in `domain/offer`, and `PlatformFiguresController` (`platform-figures.controller.ts`) is in `OfferModule`, as ticket 04 put `VisibleVendorOffersController` there. It carries `@Public()` and `security: []`, as the other public endpoints do. `PlatformRateController`, `ReadPlatformRateQuery` and `PlatformRateStore` are unchanged: `v1/platform-rate` stays the Admin's, and the public answer holds no `setAt` and no `setBy`.
- **One statement.** Each count is a subquery of one row, since a count with no grouping always answers one: `active_vendors`, the Vendors with `active`, and `visible_offers`, the Offers joined to their Vendors and asked `visibleOffer(now)`. The two are cross-joined, with `currentPlatformRate(client)` left-joined once, as ticket 02's list joins it, so the two counts and the rate are of one snapshot; with no rate set, the left join still gives the counts their row, beside a null rate. The aliases (`active_vendor_count`, `visible_offer_count`, `active_vendors`, `visible_offers`, `current_rate`) are names no table in the statement has as a column, as ticket 02's note asks. Now is read once, by the Query, from the API's clock.
- **The days** are `PlatformFigures.getDaysAnOfferStaysCurrent()`, which answers `DAYS_AN_OFFER_STAYS_CURRENT` from `domain/offer/expiry.ts`, the constant `visibleOffer(now)` judges expiry by; the API writes no copy, and no figures can be built with other days.
- **What is counted.** Every Vendor with `active`, one with no Visible Offer among them, since a Vendor page answers such a Vendor (story 53) and the made-up shop holds one, "Imaginary Gaming Corner"; and every Visible Offer, in stock or out of stock.
- **A third named exception at seam 2.** `changeTheRateAndDeactivateAVendorWhileReading`, in `test-utils/database/test-database.ts`, adds a rate row and deactivates one Vendor in the database in one transaction, holding `vendor`, `offer` or `platform_rate` locked until the read waits, as `changeTheRateAndTheOffersWhileReading` does for a rate and the Offers' prices. The two share the lock and the wait, `changeWhileReading`, and the older helper behaves as before (its three files of tests pass unchanged). No endpoint can arrange it, for the same reasons. The Vendor's Login is left as it was, which no figure reads.
- **The stand-in** answers `GET v1/platform-figures` from the shop, typed by `PlatformFiguresResponse`: `shop.vendors.length` and `shop.offers.length`, every one counted, since the shop holds only Visible Offers of active Vendors and the stand-in judges no visibility; `theShopsPlatformRate`, 1,575, now written once in `made-up-offers.ts`, where the shop's prices were converted at it, and read there by the dashboard's shop too in place of its own 1575; and `daysAnOfferStaysCurrent`, 14, the inspector's one copy, in `made-up-shop.ts`, now exported. From the shop `pnpm shopper:inspect` builds it answers 21 Vendors and 852 Visible Offers.

**How it was built.** With `mattpocock-skills:tdd`, at seam 2 through the API's HTTP surface, and at the stand-in's own unit seam, `answerFromTheStandIn`, as ticket 06 chose it. Red first: the empty platform's answer, on 404 with no route; the rate, on null, while the first implementation answered none; and the stand-in's figures, on 404, as not one of its endpoints. The counts were written with the endpoint, through `visibleOffer(now)`, so the lines of deactivation, expiry, tokens and one answer passed when first run, and the faults below show that each can fail. 11 tests in `apps/api/src/test/infrastructure/offer/endpoints/platform-figures.controller.integration-spec.ts`, three of them one answer with each of the three tables locked, and 1 in `apps/inspector/src/test/stand-in-api.spec.ts`.

**The faults, each planted once by a script on the committed tree (`b625ccd`), run against the figures' integration file or the inspector's type check and tests, and taken out by the inverse edit; `git status` was clean after each.**

| Fault | Tests that failed | Why |
|---|---|---|
| No rate answered as 0 (`row.iqdPerUsd ?? 0`) | The empty platform's answer; the rate is none until one is set | `iqdPerUsd` was 0, not null |
| Every Vendor counted (`active_vendors` without its `active`) | A deactivated Vendor is not counted; no deactivated Vendor with an Admin's token or its own; one answer, all three | 2 active Vendors in place of 1 |
| A deactivated Vendor's Offers counted (the Offers asked a second copy of the rule, `confirmed_at` against `expiredIfConfirmedBefore(now)` alone) | The same five | 3 Visible Offers in place of 1, and 2 in place of 1 with the tokens |
| Expired Offers counted (a second copy asking only that the Vendor is active) | An Expired Offer is not counted | 2 Visible Offers 14 days and 1 ms after the first Confirmation, in place of 1 |
| The first rate taken for the current one (`current-platform-rate.ts` ordering by the oldest) | The rate is none until one is set, then the latest; one answer, all three | 1,575 in place of 1,600, and 1,500 in place of 2,000 |
| When the rate was set answered beside its value, as the Admin's answer has it (`rateSetAt`) | The empty platform's answer; the rate is its value alone; any token; one answer, all three | An extra key, and the time of the setting in the text, `2027-03-14T09:26:53.589Z` |
| `@Public()` left out | All 11 | 401 without a token; the three of one answer also on the helper's "No read waited for the locked table", since a refused request reads nothing |
| The rate read in a second query, before the counts | One answer, with `vendor` locked and with `offer` locked | 1,500, the rate before the change, beside the counts after it |
| The rate read in a second query, after the counts | One answer, with `platform_rate` locked | 2 Vendors and 3 Offers, the counts before the change, beside 2,000 |
| The stand-in's `daysAnOfferStaysCurrent` misspelt | `@pcp/inspector:typecheck`, with TS2561 ("Did you mean to write 'daysAnOfferStaysCurrent'?"), and the stand-in's figures | The answer is typed by the client's `PlatformFiguresResponse` |
| The stand-in counting only the Vendors with an Offer | The stand-in's figures | 20 in place of 21: Imaginary Gaming Corner has no Offer |

**The stand-in over HTTP.** `startTheStandIn`, on port 3115 with the shop built on the tests' stand-in for the catalog, answered `GET /v1/platform-figures` 200 with `{"activeVendorCount":21,"visibleOfferCount":852,"iqdPerUsd":1575,"daysAnOfferStaysCurrent":14}`, held against `apps/api/openapi.json` (every required property, none the description lacks, each of its type and nullability), the same with a query, which it ignores; `POST` was refused with 405 and logged. Nothing listened on the port after.

**Checks.** `44cab98` was gated on `pnpm check --skip-nx-cache` and `pnpm integration:check`, 529 tests in 20 files, 11 of them new, with every `*.tsbuildinfo` deleted first and the inspector's changes set aside; `b625ccd` on `pnpm check --skip-nx-cache`, the API unchanged. `pnpm check --skip-nx-cache` passes on both, checked out in the worktree with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`; Docker itself was left running for the owner's services. `pnpm platform:check` passes on `b625ccd`, 290 tests in 10.6 minutes, run under the lock, as the brief asks after a change to the API. `browse/integration` stayed at `acc965d`, this branch's base, so there was nothing to merge. This ticket adds no end-to-end line: no page reads the figures until ticket 09.
