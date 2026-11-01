# 03: A Part's visible Offers in the chosen currency, ordered by price

**Spec:** [the pricing spec](../spec.md)

**What to build:** The public answer of a Part's visible Offers is given in the currency its caller asks for. Each visible Offer has a Shown Price: its Quoted Price in that currency if the Vendor quoted one, else its Converted Price at the current Platform Rate, rounded to the nearest 250 IQD or whole dollar and never below one step, and marked as converted (PRC-3). The Offers are ordered in stock first, then by Shown Price, lowest first, as the figures are shown (OFF-11, PRC-4). The conversion is written once, in the API, and computed in the database, so that `browse` can later order and page a Category by the same expression. No Shopper page shows it yet. The integration tests are the proof.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] **The word.** "Shown Price" is added to CONTEXT.md, under Prices, before any code uses it: the price an Offer shows in the chosen currency, its Quoted Price in that currency if there is one, else its Converted Price. The words to avoid are recorded with it.
- [ ] **The rule.** Written once, in the API's domain: the IQD step, 250, and the USD step, one whole dollar. IQD from USD is the price in cents × the rate ÷ 100, rounded to the nearest 250, half up. USD from IQD is the price ÷ the rate, rounded to the nearest whole dollar, half up. A result that rounds to 0 is one step, as the owner decided on 2 November 2026. The arithmetic is on whole numbers throughout.
- [ ] **Its SQL form.** One function at the Offer Store's module level, the expression for a Shown Price in a currency at a rate, read from the rule, as `expiredAt(now)` and `visibleOffer(now)` are. No frontend converts a price or holds the steps.
- [ ] **The parameter.** `GET v1/parts/{partId}/offers` takes `currency`, `USD` or `IQD`, and it is required. A missing or other value is refused 400 with `NOT_VALID`, `field: 'currency'`.
- [ ] **The answer.** Each visible Offer keeps both Quoted Prices as entered and gains `shownPrice`: `{ currency, amount, converted }`, or null. `amount` is decimal text: USD with two decimals ("349.99", and "350.00" for a converted 350), IQD in whole dinars ("1575000"). A Quoted Price in the chosen currency is shown as entered, cents kept and dinars not rounded. An Offer quoted in both is never converted. `shownPrice` is null only when the Offer has no Quoted Price in the chosen currency and there is no Platform Rate.
- [ ] **The order.** In stock first. Then by Shown Price, lowest first, compared as answered, after rounding, with Offers whose Shown Price is null after the others in their stock group. Then the most recent Confirmation, then the Vendor's name, then the Offer's identifier. The comment that the order waits for `pricing` goes.
- [ ] **One snapshot.** The Shown Prices and the order are computed in the same query that reads the visible Offers, with the current Platform Rate read in that query, so that one answer never mixes two rates. The visible-Offer rule is still read through `visibleOffer(now)`.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` gains these tests, written before the code, and passes:
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
- [ ] Shown once and then reverted, each failing its own test: the one-step floor removed; rounding down in place of half up; the order by the Quoted Price in place of the Shown Price; the rate read in a second query instead of the Offers' own.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
