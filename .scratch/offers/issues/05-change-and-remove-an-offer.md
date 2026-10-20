# 05: Change and remove an Offer

**Spec:** [the offers spec](../spec.md)

**What to build:** A Vendor opens one of its Offers and changes its prices, stock and warranty, or removes it after confirming (OFF-4). Saving, whether or not anything changed, confirms the Offer, so an Expired Offer comes back at once (OFF-5). Every change to a price or to the stock is added to the Offer history with its time and its Caller, and so is a removal. The history outlives the Offer, and a Vendor can offer the Part again later (OFF-10). The Admin acting as a Vendor does all of this from the Vendor's portal on the spot (ACC-6), and the history records the Admin.

**Blocked by:** 04

**Status:** ready-for-agent

- [x] **The API.** `PUT v1/vendors/{vendorId}/offers/{offerId}`, through `EditOfferCommand`, replaces the prices, the stock and the warranty, checks them with `OfferDetails.check`, clears what it leaves out, and sets the Confirmation to now. `DELETE v1/vendors/{vendorId}/offers/{offerId}`, through `RemoveOfferCommand`, removes the Offer and answers 204. Both use `VendorAccessRule` and answer an Offer that is another Vendor's, or does not exist, with 404 and `OFFER_NOT_FOUND`.
- [x] **The history.** An edit that changes the USD price, the IQD price or the stock adds one row, in the same transaction, with the values after the change, the time of the API's clock and the Caller's Login identifier. An edit that changes neither, or changes the warranty alone, adds none. A removal adds a row marking it. The rows stay when the Offer is removed.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] **The form** of ticket 04 changes an Offer too, opened from a row of the Offers screen or from the search, with the Offer's values. Remove asks first, in shadcn/ui's alert dialog, which says a refusal and stays open until the removal is done. An Offer that no longer exists, opened by an old link, says so in the portal's language.
- [x] Its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review.
- [x] It follows DESIGN.md and the dashboard's own, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] `pnpm integration:check` gains these tests, and passes:
  - An edit replaces the prices, the stock and the warranty, clears a warranty left out, and confirms the Offer. An Expired Offer saved unchanged is current again.
  - A change to a price, and a change to the stock, each add one history row with the time of the moved clock and the Caller. The Admin is recorded as the Admin.
  - Saving unchanged, and changing the warranty alone, add none.
  - A removal makes the Offer 404 for its Vendor, adds a row, and leaves the earlier rows. The same Part can be offered again, and its next row follows them.
  - Another Vendor's Offer is answered 404 at both endpoints. A deactivated Vendor's own token is answered 403 with `VENDOR_DEACTIVATED`, and a call without a token 401.
- [x] `pnpm platform:check` gains these lines, and passes on every line, in a window 360 pixels wide:
  - A made-up Vendor changes an Offer to quote IQD too and to be out of stock, and the list shows both prices and the stock.
  - It removes the Offer after confirming, and the list no longer holds it.
  - The Admin acting as the Vendor changes an Offer under the band.
  - The form, with the dialog open, passes `checkInEveryLanguageOfTheVendorPortal`, and `expectAccessible` passes on the dialog, in the light and in the dark scheme.
- [x] Shown once and then reverted, each failing its own test: a history row written for an edit that changes nothing; the history removed with the Offer; the removal made without the dialog.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 20 October 2026: left here by ticket 06

Ticket 06 built a Part's visible Offers, `GET v1/parts/{partId}/offers`, before the edit and the removal existed, so two of its lines wait for this ticket. Add them to `part-offers.controller.integration-spec.ts`, beside its confirm-all line:

- An Expired Offer saved through `PUT v1/vendors/{vendorId}/offers/{offerId}`, changed or not, is in the Part's visible Offers again at once, with the time of the moved clock as its Confirmation and 0 days since it. Ticket 06 proved it for confirm-all only.
- A removed Offer is not in the Part's visible Offers, and is there again once the Vendor adds it again.

Both should pass once the edit sets `confirmed_at` from the API's clock and the removal deletes the row, since the rule reads nothing else.

### 20 October 2026: completed

**Commits.** `bee811a` the two endpoints, their use cases and Store methods, the tests at seam 2 and the client written again; `a9396ac` the Offer form changing an Offer, its removal in the alert dialog, the screen of an Offer that no longer exists, an Offer's row as a link, the text in three languages, DESIGN.md and the platform's tests; and the commit of this record.

**Decisions this ticket left open.**

- **The request.** `PUT v1/vendors/{vendorId}/offers/{offerId}` takes `EditOfferRequest`: `usdPrice`, `iqdPrice`, `inStock` and `warrantyMonths`, as ticket 01's request takes them, each checked by `OfferDetails.check` with the same reasons. Its four details are written once, in `OfferDetailsRequest`, which `CreateOfferRequest` now extends with `partId`; the generated `CreateOfferRequest` lists `partId` last. A request that names `partId` is refused with 400 by the request's own check, as a detail it does not declare, so an Offer stays the Offer for its Part. The order of checks is the access rule, the details, then the Offer's existence.
- **The answer.** The PUT answers 200 with the Offer as `GET` answers it, `OfferResponse`; the DELETE answers 204 with no body. A detail left out is cleared: a price left out is no longer quoted, so long as the other stays, and a warranty left out is not stated.
- **When the history records a change.** The Store holds the Offer's row `FOR UPDATE` in the edit's transaction, and compares its prices and stock with the new ones by `OfferDetails.changePricesOrStockOf`, in the domain, so that two edits at once each add the row their own change needs. A price compares in whole cents, so "0349.99" for 349.99 is no change. The row is `change: 'changed'`, with the values after the change.
- **The removal's row** is `change: 'removed'`, with the prices and stock the Offer had when it was removed, since `in_stock` is not null and no migration was needed; its Part comes from the deleted row, in the same transaction as the deletion. A removal of an Offer that is not there, removed already or another Vendor's, adds none.
- **The edit screen.** The Offer's own screen at `offers/<offerId>` is now the Offer form of ticket 04, with the title "Your Offer" kept and a Note Grey sentence that saving confirms the Offer, even when nothing changed. The form takes `values` and `purpose`; for a change its button says "Save the Offer" and its refusal above the form "Your Offer was not saved.". Each price starts as the portal shows it without its currency, "1,250.50" and "1,875,000" (`usdAmountWritten` and `iqdAmountWritten` in the `offer` entity, which `usdPriceShown` and `iqdPriceShown` now use), and the form's own reading of digits takes the separators out again before sending.
- **After a save or a removal** the screen returns to the Offers, `..`, under either frame, with no note: the row then says "Confirmed today", or is gone. Before leaving, every query under the Vendor's Offers' key is asked again, inactive ones too (`refetchType: 'all'`), so that the list never shows the Offer as it was, even for a moment. A removal leaves the removed Offer's own query out of that, since it would be answered 404 while its screen is still open, and drops it once the screen is left.
- **Remove** is the feature `remove-offer`, which the page `offer` puts below the form, so that the form stays the one ticket 04 built: an outlined "Remove the Offer" with a bin mark, as wide as the form on a phone, opening the alert dialog. The dialog names the Part in English, says that Shoppers no longer see the Offer and that it can be added again from the catalog search; Remove is in Action Red after Cancel, as Deactivate is. While the removal is on its way, neither button nor Escape closes the dialog; a refusal says "Your Offer was not removed." and why, and the dialog stays open to try again.
- **An Offer that no longer exists**, answered 404 with `OFFER_NOT_FOUND`, shows the portal's empty state in the form's place, "This Offer no longer exists", one sentence that it was removed and the outlined link "Open your Offers". Any other refusal is still the refusal panel.
- **An Offer's row** on the Offers screen is now the link to its screen, the whole row with a Shelf ground on hover and the link named by the Part's name alone, as a Part the catalog search found is.
- **The language line with the dialog open.** The alert dialog hides the language switch and keeps it from a tap while it is open, so `readInEveryLanguageOfTheVendorPortal` takes an optional `openOver`: it closes the dialog before each tap on the switch, checks the switch, then opens it again, so that the digits, the width and what the test reads are checked with the dialog open in each language.
- **The text.** `OfferForm.saveChanges`, `savingChanges` and `notSavedChanges`, `OfferScreen.intro`, `gone`, `goneDescription` and `openOffers`, and a section `RemoveOffer`, in the three languages. The Kurdish and Arabic are drafts like the rest of the files, using Offer and Shopper from `words.md`; nothing counts.

**How it was built.** Test-first at seam 2: the seven lines of changing an Offer and of its history were written first and run red, each on the missing route (404), once the first had its token made after the clock was moved. The edit was then built; the removal endpoint was written with it, so its three lines and the new access lines passed when first run, and the faults below show that they can fail. Ticket 06's two lines were added to `part-offers.controller.integration-spec.ts` and passed at once, as it foresaw. At seam 3 the six lines of `vendor-change-offer.spec.ts` were written first and run red, each on a missing element (the row's link, the form at the Offer's address, Remove, the empty state); the language line was written with them. The first green run failed two lines for reasons of the tests' own: the language switch is hidden while the dialog is open, which made the `openOver` order above, and `page.unroute` was given a new predicate rather than the one routed. Ticket 04's line that follows an offered Part from the search now finds the form filled in, not the read-only screen. A throwaway capture at 360 pixels, deleted, showed the form and the dialog in Kurdish and the empty state in English, none wider than the window.

**The faults, each planted once by a script on a clean tree, run, and reverted by the inverse edit; the tree was clean after each.**

| Fault | What failed | Why |
|---|---|---|
| A history row written for an edit that changes nothing, `changePricesOrStockOf(before) \|\| true` in the Store | Saving unchanged, changing the warranty alone or a refused save records nothing | Four `changed` rows were recorded, one for each save, with the values unchanged |
| The history removed with the Offer, the Vendor's rows for the Part deleted before the removal's row | The removal recorded after the earlier rows, which stay, and the Part offered again; the Admin's removal of a deactivated Vendor's Offer | The `created` and `changed` rows were gone, leaving only the removal and what came after it |
| The removal made without the dialog, Remove calling the API at once | Removing after confirming, cancelling first; the dialog's refusal; the form's accessibility with the dialog open | No `remove-confirmation` dialog appeared after the tap on Remove |

The part-offers file passed under both API faults, as expected, since neither changes what is visible.

**Checks.** `pnpm integration:check` passes with 367 tests in 13 files, 13 of them new. `pnpm platform:check` passes with 163 tests, seven of them new, on `a9396ac`. `pnpm check` passes on each commit in a fresh clone with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`, and `pnpm integration:check` passes on `bee811a` in the worktree. The development database had every migration; this ticket adds none.

**Checks on a phone** are the Offer form's, already open from ticket 04 (the form used with a thumb, in Kurdish and in English; a price typed on a Kurdish and on an Arabic keyboard), and this ticket adds none of its own.
