# 05: Change and remove an Offer

**Spec:** [the offers spec](../spec.md)

**What to build:** A Vendor opens one of its Offers and changes its prices, stock and warranty, or removes it after confirming (OFF-4). Saving, whether or not anything changed, confirms the Offer, so an Expired Offer comes back at once (OFF-5). Every change to a price or to the stock is added to the Offer history with its time and its Caller, and so is a removal. The history outlives the Offer, and a Vendor can offer the Part again later (OFF-10). The Admin acting as a Vendor does all of this from the Vendor's portal on the spot (ACC-6), and the history records the Admin.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] **The API.** `PUT v1/vendors/{vendorId}/offers/{offerId}`, through `EditOfferCommand`, replaces the prices, the stock and the warranty, checks them with `OfferDetails.check`, clears what it leaves out, and sets the Confirmation to now. `DELETE v1/vendors/{vendorId}/offers/{offerId}`, through `RemoveOfferCommand`, removes the Offer and answers 204. Both use `VendorAccessRule` and answer an Offer that is another Vendor's, or does not exist, with 404 and `OFFER_NOT_FOUND`.
- [ ] **The history.** An edit that changes the USD price, the IQD price or the stock adds one row, in the same transaction, with the values after the change, the time of the API's clock and the Caller's Login identifier. An edit that changes neither, or changes the warranty alone, adds none. A removal adds a row marking it. The rows stay when the Offer is removed.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] **The form** of ticket 04 changes an Offer too, opened from a row of the Offers screen or from the search, with the Offer's values. Remove asks first, in shadcn/ui's alert dialog, which says a refusal and stays open until the removal is done. An Offer that no longer exists, opened by an old link, says so in the portal's language.
- [ ] Its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review.
- [ ] It follows DESIGN.md and the dashboard's own, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [ ] `pnpm integration:check` gains these tests, and passes:
  - An edit replaces the prices, the stock and the warranty, clears a warranty left out, and confirms the Offer. An Expired Offer saved unchanged is current again.
  - A change to a price, and a change to the stock, each add one history row with the time of the moved clock and the Caller. The Admin is recorded as the Admin.
  - Saving unchanged, and changing the warranty alone, add none.
  - A removal makes the Offer 404 for its Vendor, adds a row, and leaves the earlier rows. The same Part can be offered again, and its next row follows them.
  - Another Vendor's Offer is answered 404 at both endpoints. A deactivated Vendor's own token is answered 403 with `VENDOR_DEACTIVATED`, and a call without a token 401.
- [ ] `pnpm platform:check` gains these lines, and passes on every line, in a window 360 pixels wide:
  - A made-up Vendor changes an Offer to quote IQD too and to be out of stock, and the list shows both prices and the stock.
  - It removes the Offer after confirming, and the list no longer holds it.
  - The Admin acting as the Vendor changes an Offer under the band.
  - The form, with the dialog open, passes `checkInEveryLanguageOfTheVendorPortal`, and `expectAccessible` passes on the dialog, in the light and in the dark scheme.
- [ ] Shown once and then reverted, each failing its own test: a history row written for an edit that changes nothing; the history removed with the Offer; the removal made without the dialog.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 20 October 2026: left here by ticket 06

Ticket 06 built a Part's visible Offers, `GET v1/parts/{partId}/offers`, before the edit and the removal existed, so two of its lines wait for this ticket. Add them to `part-offers.controller.integration-spec.ts`, beside its confirm-all line:

- An Expired Offer saved through `PUT v1/vendors/{vendorId}/offers/{offerId}`, changed or not, is in the Part's visible Offers again at once, with the time of the moved clock as its Confirmation and 0 days since it. Ticket 06 proved it for confirm-all only.
- A removed Offer is not in the Part's visible Offers, and is there again once the Vendor adds it again.

Both should pass once the edit sets `confirmed_at` from the API's clock and the removal deletes the row, since the rule reads nothing else.
