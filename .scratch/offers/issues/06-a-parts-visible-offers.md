# 06: A Part's visible Offers

**Spec:** [the offers spec](../spec.md)

**What to build:** Anyone, with no token, can ask the API for a Part's visible Offers: those that are not Expired Offers and whose Vendor is active (CAT-7, OFF-6, ACC-7). Each comes with the Vendor's name, both Quoted Prices as entered, the stock, the warranty and how many days ago it was confirmed (OFF-7), with in-stock Offers first (OFF-11). The rule for a visible Offer is written once, here, so that `pricing`, `browse`, `builder` and `sharing` all use it. No Shopper page shows the Offers yet; `browse` will.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] **The rule, once.** A visible Offer is not an Expired Offer and its Vendor is active. It is written in the API's domain, with its query in the Offer Store, using ticket 02's constants and now from the API's clock.
- [ ] **The endpoint.** `GET v1/parts/{partId}/offers`, public, through `ListVisibleOffersOfPartQuery`. It adds `security: []` to its `@ApiOperation`. Each Offer has the Vendor's identifier and name, the USD price as a decimal string and the IQD price as a whole number, each as entered or null, the stock, the warranty, the time of Confirmation and the days since it. In-stock Offers come first, then out-of-stock ones, and within each group the most recent Confirmation comes first, until `pricing` orders them by price. A Part that does not exist is answered 404 with `PART_NOT_FOUND`. A Part with no visible Offer is answered with an empty list.
- [ ] The answer holds nothing a Shopper may not see: no Login identifier, no login phone number and no Expired Offer.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` gains these tests, which move only Jest's `Date`, and passes:
  - An Offer confirmed 14 days ago to the millisecond is in the answer. One millisecond later it is not. Confirming all, or saving it, brings it back at once.
  - A deactivated Vendor's Offers are left out, and come back when the Vendor is reactivated.
  - In-stock Offers come before out-of-stock ones.
  - The answer is given without a token, and with any token.
  - A removed Offer is not in it.
  - A Part that does not exist is answered 404, and one with no visible Offer with an empty list.
- [ ] Shown once and then reverted, each failing its own test: the active check left out of the rule; the expiry check left out of the rule; the endpoint's public mark removed.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
