# 03: A Part's visible Offers in the chosen currency, ordered by price

**Spec:** [the pricing spec](../spec.md)

**What to build:** The public answer of a Part's visible Offers is given in the currency its caller asks for. Each visible Offer has a Shown Price: its Quoted Price in that currency if the Vendor quoted one, else its Converted Price at the current Platform Rate, rounded to the nearest 250 IQD or whole dollar and never below one step, and marked as converted (PRC-3). The Offers are ordered in stock first, then by Shown Price, lowest first, as the figures are shown (OFF-11, PRC-4). The conversion is written once, in the API, and computed in the database, so that `browse` can later order and page a Category by the same expression. No Shopper page shows it yet. The integration tests are the proof.

**Blocked by:** 01

**Status:** resolved

- [x] **The word.** "Shown Price" is added to CONTEXT.md, under Prices, before any code uses it: the price an Offer shows in the chosen currency, its Quoted Price in that currency if there is one, else its Converted Price. The words to avoid are recorded with it.
- [x] **The rule.** Written once, in the API's domain: the IQD step, 250, and the USD step, one whole dollar. IQD from USD is the price in cents × the rate ÷ 100, rounded to the nearest 250, half up. USD from IQD is the price ÷ the rate, rounded to the nearest whole dollar, half up. A result that rounds to 0 is one step, as the owner decided on 2 November 2026. The arithmetic is on whole numbers throughout.
- [x] **Its SQL form.** One function at the Offer Store's module level, the expression for a Shown Price in a currency at a rate, read from the rule, as `expiredAt(now)` and `visibleOffer(now)` are. No frontend converts a price or holds the steps.
- [x] **The parameter.** `GET v1/parts/{partId}/offers` takes `currency`, `USD` or `IQD`, and it is required. A missing or other value is refused 400 with `NOT_VALID`, `field: 'currency'`.
- [x] **The answer.** Each visible Offer keeps both Quoted Prices as entered and gains `shownPrice`: `{ currency, amount, converted }`, or null. `amount` is decimal text: USD with two decimals ("349.99", and "350.00" for a converted 350), IQD in whole dinars ("1575000"). A Quoted Price in the chosen currency is shown as entered, cents kept and dinars not rounded. An Offer quoted in both is never converted. `shownPrice` is null only when the Offer has no Quoted Price in the chosen currency and there is no Platform Rate.
- [x] **The order.** In stock first. Then by Shown Price, lowest first, compared as answered, after rounding, with Offers whose Shown Price is null after the others in their stock group. Then the most recent Confirmation, then the Vendor's name, then the Offer's identifier. The comment that the order waits for `pricing` goes.
- [x] **One snapshot.** The Shown Prices and the order are computed in the same query that reads the visible Offers, with the current Platform Rate read in that query, so that one answer never mixes two rates. The visible-Offer rule is still read through `visibleOffer(now)`.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` gains these tests, written before the code, and passes:
  - An Offer quoted only in USD shows its Quoted Price with its cents in USD, `converted: false`, and in IQD the conversion rounded to 250, `converted: true`.
  - An Offer quoted only in IQD shows its dinars as entered in IQD, not a multiple of 250, `converted: false`, and whole dollars in USD, `converted: true`.
  - An Offer quoted in both shows its own Quoted Price in each currency, never converted, even where the rate would give another figure.
  - Exactly half a step rounds up and just below rounds down, both ways: at 1,500, 0.25 $ is 500 IQD and 0.24 $ is 250 IQD; 2,250 IQD is 2 $ and 2,249 IQD is 1 $.
  - A conversion that would round to 0 is one step, in each direction.
  - A price at the top of the Offers' limits converts exactly.
  - A new rate changes every Converted Price on the next read, and no Quoted Price.
  - With no rate, an Offer not quoted in the chosen currency answers `shownPrice: null` and keeps both Quoted Prices.
  - A missing `currency`, and one that is neither `USD` nor `IQD`, are refused, naming `currency`.
  - In-stock Offers come before out-of-stock ones, whatever their prices.
  - Within a stock group, lowest Shown Price first, compared after rounding.
  - An Offer quoted at 100 $ and 160,000 IQD comes before one quoted only at 101 $ when asked in USD, and after it when asked in IQD at 1,575.
  - Equal Shown Prices fall back to the most recent Confirmation, then the Vendor's name, then the identifier.
  - Offers with a null Shown Price come after the others in their stock group.
  - With a rate set, an Expired Offer and a deactivated Vendor's Offer are still left out.
  - The existing test of the order by Confirmation is rewritten for the order by price.
- [x] Shown once and then reverted, each failing its own test: the one-step floor removed; rounding down in place of half up; the order by the Quoted Price in place of the Shown Price; the rate read in a second query instead of the Offers' own.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 2 November 2026: completed

**Commits.** `04013a5` "Shown Price" in CONTEXT.md, under Prices, with the words to avoid (display price, final price, effective price), before any code uses it; `9a8874b` the `currency` parameter, the rule, its SQL form, `shownPrice`, their tests and the client written again; `e830271` the order by Shown Price, its tests and the client written again. The two API commits span `api` and `api-client` and take no scope.

**Decisions this ticket left open.**

- **The rule** is in `domain/offer/shown-price.ts`: `currencies` and `Currency`, `centsInADollar`, `convertedPriceStep` (`IQD: 250`, `USD: 100`, in each currency's unit, cents or whole dinars) and `convertedPriceIn(numbers, currency, quotedInTheOther, iqdPerUsd)`. It is written once over `WholeNumbers<N>`, an arithmetic of positive whole numbers (`of`, `plus`, `times`, `over` rounding down, `greatest`), so that the database's form is built from the rule itself and no second copy exists, in TypeScript or SQL. A Converted Price before rounding is a fraction n ÷ d in the target's unit (IQD: cents × rate ÷ 100; USD in cents: dinars × 100 ÷ rate); the nearest multiple of the step s, half up, is ⌊(2n + ds) ÷ 2ds⌋ steps, and `greatest(…, s)` is the one-step floor. Nothing in TypeScript converts a price at run time.
- **Its SQL form** is at the Offer Store's module level: `inTheDatabase`, the arithmetic in `bigint` (100,000.00 $ at 5,000 is 5 × 10¹⁰ before division, past `integer`), and `shownPriceIn(currency, iqdPerUsd)`, which gives `amount`, the Shown Price in the currency's unit, and `converted`, whether the Offer has no Quoted Price in it. `amount` is `coalesce(quoted, case when rate is not null and other is not null then converted end)`: the guard is needed because Postgres's `greatest` ignores a null and would answer one step with no rate. `browse` orders and pages by `shownPriceIn(...).amount`, whose unit makes the comparison the one a Shopper sees.
- **The current rate** is a `current_rate` subquery of `platform_rate` (newest `set_at`, then highest `id`, limit 1), left-joined `on true`, so that the Offers' one statement reads it. With no rate the join gives a null.
- **The answer.** `ShownPriceResponse` is `{ currency, amount, converted }`, `amount` from `dollarsTextOf(cents)` for USD (split out of `usdPriceTextOf`, which keeps its null) or the whole dinars as text for IQD. `VisibleOffer` gains `getShownPrice()`, a `ShownPrice` or null.
- **The parameter.** `ListVisibleOffersOfPartRequest` declares `currency` with `@IsIn(currencies)` and no `@IsOptional`, so missing, empty, `EUR` and `usd` are each `NOT_VALID` on `currency`. The refusal comes before the Part is looked up, so an unknown Part with no currency answers 400, not 404.
- **The order** is `in_stock desc, amount asc nulls last, confirmed_at desc, vendor.name asc, offer.id asc`, in the same statement.
- **One snapshot, tested.** `changeTheRateAndTheOffersWhileReading` in `test-utils/database/test-database.ts` begins a transaction, locks `offer` or `platform_rate` in `ACCESS EXCLUSIVE` mode, adds a rate row and changes every Offer's USD price, starts the read, waits until a query waits on a lock (`pg_locks` not granted), and commits. A read in one statement takes its snapshot after the lock and sees both changes; a read that takes the rate in a query before the Offers' sees the old rate with the new Offers (locked `offer`), and one that takes it after sees the new rate with the old Offers (locked `platform_rate`). It writes to the database directly, a second exception to seeing the platform from outside, since no endpoint changes a rate and an Offer at once.
- **The ListVisibleOffersOfPartQuery** still reads `now` once and passes the currency through; the comments that the order waited for `pricing` are gone.

**How it was built.** With `mattpocock-skills:tdd`, at seam 2 alone, one slice at a time: the refusal of `currency` (red on 200); the Shown Price of an Offer quoted only in USD, both ways (red on `shownPrice` undefined); then the order (four of five red on the order by Confirmation, after a first run that failed on making Vendors with the clock moved, fixed in the test). The other Shown Price tests, the two snapshot tests and the test of the fallback on equal prices passed when first run, since the rule and the fallback were already whole; the faults below show they can fail. The existing test of the order by Confirmation became the test that stock comes first whatever the prices; the tests of an Expired Offer and a deactivated Vendor's Offer now set a rate first. 27 tests in `test/infrastructure/offer/endpoints/part-offers.controller.integration-spec.ts`.

**The faults, each planted once by a script on the committed tree (`e830271`), run against that file, and reverted by the inverse edit; `git status` was clean after each.**

| Fault | Tests that failed | Why |
|---|---|---|
| The one-step floor removed (`greatest` dropped) | Never below one step | 0.08 $ at 1,500 was answered `"0"`, not `"250"` |
| Rounding down in place of half up (the `+ ds` dropped) | USD only, IQD only, half a step, the top of the limits, the lowest Shown Price first | 349.99 $ at 1,575 was 551,000, not 551,250; 0.25 $ at 1,500 was 250, not 500; 99,999.99 $ at 4,999 was 499,899,750, not 499,900,000 |
| The order by the Quoted Price in the chosen currency in place of the Shown Price | In stock first, lowest Shown Price first, 100 $ and 160,000 IQD against 101 $, the fallback on equal prices | Converted Prices went to the end of their stock group as if they had none |
| The rate read in a second query, before the Offers' | One answer, with `offer` locked | Both Offers answered 30,000 IQD, 20 $ at the old 1,500, not 40,000 |

The variant with `platform_rate` locked catches a rate read after the Offers' query; that fault was not planted.

**Checks.** `pnpm integration:check` passes with 404 tests in 14 files on `e830271`; each API commit was gated on it and on `pnpm check`, and `04013a5` on `pnpm check`. `pnpm check --skip-nx-cache` passes on all three commits in a fresh clone, with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`. Docker itself was left running for the owner's services.
