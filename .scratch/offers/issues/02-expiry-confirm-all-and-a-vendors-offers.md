# 02: Expiry, confirm-all and a Vendor's Offers

**Spec:** [the offers spec](../spec.md)

**What to build:** Through the API, a Vendor lists its own Offers a page at a time, searches them, and confirms them all with one call (OFF-5). Each Offer says how many days ago it was confirmed (OFF-7), whether it is an Expired Offer (OFF-6) and whether it is about to expire (OFF-8). The list also holds the Vendor's counts of Offers, Expired Offers and Offers about to expire, which the banner and Expiring Offers need later. The tests of the 14-day and the 3-day boundaries are written before the code, as the MVP spec's testing strategy asks.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] **The rules, once.** The 14 days and the 3 days are constants in the API's domain, the same for every Vendor. An Offer is an Expired Offer when now is more than 14 days of 24 hours after its last Confirmation; at exactly 14 days it is not yet. It is about to expire when it is not expired and its last Confirmation is more than 11 days ago. The days since Confirmation are the whole days of 24 hours elapsed, rounded down. The `Offer` entity answers all three, given now, and the Store's queries use the same constants, with now passed in from the API's clock.
- [ ] **The list.** `GET v1/vendors/{vendorId}/offers`, through `ListVendorsOffersQuery` and `core`'s `PagingRequest`, answers the Vendor's Offers, Expired Offers among them. Each has its Part's name, manufacturer, Category and photo, its prices, stock and warranty, the time of its Confirmation, the days since it, `expired` and `aboutToExpire`. It can be searched by the Part's name, manufacturer or part number, as the catalog search reads them. It is ordered by last Confirmation, oldest first, then by Part name. The answer also holds the three counts, for all the Vendor's Offers whatever the search.
- [ ] **Confirming all.** `POST v1/vendors/{vendorId}/offers/confirm`, through `ConfirmAllOffersCommand`, sets every Offer of the Vendor's last Confirmation to now in one statement, its Expired Offers among them, and answers 200 with how many. It adds no history row.
- [ ] Both endpoints use `VendorAccessRule`.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` passes with these tests, which move only Jest's `Date`, leaving every timer real, as the access tests do:
  - An Offer confirmed 14 days ago to the millisecond is not expired. One millisecond later it is, and is listed marked expired.
  - An Offer confirmed 11 days ago to the millisecond is not about to expire. One millisecond later it is.
  - The days since Confirmation are 0 just before 24 hours, 1 at 24 hours, and 14 at the boundary.
  - Confirming all answers how many, makes every Offer of the Vendor current, Expired Offers among them, leaves another Vendor's Offers as they were, and adds no history row.
  - The list holds the Vendor's Offers only, each once across the pages, oldest Confirmation first, and finds an Offer by its Part's name, manufacturer and part number.
  - The counts are right with Offers current, about to expire and expired, and do not change with the search.
  - Another Vendor's token is answered 403, a deactivated Vendor's own token 403 with `VENDOR_DEACTIVATED`, and a call without a token 401.
- [ ] Shown once and then reverted, each failing its own test: the expiry compared with "at least" instead of "more than" 14 days; the 3 days counted from the expiry the wrong way; confirm-all left without its Vendor in the statement.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
