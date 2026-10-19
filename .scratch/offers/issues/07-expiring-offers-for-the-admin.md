# 07: Expiring Offers for the Admin

**Spec:** [the offers spec](../spec.md)

**What to build:** The Admin console gains Expiring Offers, reached from the top bar's menu. It lists the active Vendors that have Expired Offers or Offers about to expire, most urgent first, with how many of each, so that the Admin can remind them personally (OFF-9). Each Vendor shows its phone number to call and its WhatsApp number to open a chat from the Admin's own WhatsApp, and leads to the Vendor's page. The platform sends nothing itself.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] **The endpoint.** `GET v1/offers/expiring`, for the `admin` role only, through `ListVendorsWithExpiringOffersQuery` and `core`'s `PagingRequest`. It answers one page of active Vendors that have at least one Expired Offer or Offer about to expire. Each Vendor has its identifier, its name, its phone number and WhatsApp number as `{ international, national }`, and the two counts. Vendors are ordered by the soonest expiry among their Offers, an Expired Offer counting as sooner than any other, then by name. Deactivated Vendors are left out.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] **The screen**, in English, in the top bar's menu beside the Catalog and the Vendors. Each row shows the Vendor's name `AsWritten` and the two counts written by `formatNumber`. Its phone number is a `tel:` link, and its WhatsApp number a `https://wa.me/<digits>` link that opens in a new tab, each in Iraq's own form and `AlwaysEnglish`. The row leads to the Vendor's page. An empty list says that no Vendor needs reminding.
- [ ] Before building, the screen is shown to the owner in the built-in browser in two choices in the dashboard's look. The owner picks one, and the choice is recorded under Comments.
- [ ] It follows DESIGN.md and the dashboard's own, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] `pnpm integration:check` gains these tests, which move only Jest's `Date`, and passes:
  - A Vendor with one Offer about to expire is listed with a count of one, and one with only current Offers is not.
  - A Vendor with an Expired Offer comes before one whose Offers are only about to expire.
  - A deactivated Vendor is left out.
  - After the Vendor confirms all, it leaves the list.
  - A Vendor's token is answered 403, and a call without a token 401.
- [ ] `pnpm platform:check` gains these lines, and passes on every line, in a window 360 pixels wide:
  - The Admin reaches Expiring Offers from the menu.
  - Given an answer with a Vendor through Playwright's `page.route`, a row's links hold the Vendor's phone number and WhatsApp number, and the row leads to its page.
  - `expectAccessible` passes on the screen, in the light and in the dark scheme.
- [x] Shown once and then reverted, each failing its own test: the Admin-only rule removed; deactivated Vendors left in.
- [ ] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 20 October 2026: the API, waiting for the owner's choice of the screen

**Commits so far.** `1d27c96` the endpoint, its tests and the client written again, `f5caa75` the merge of `offers/integration`, which brought ticket 08.

**Decisions this ticket left open.**

- **Where it lives.** `GET v1/offers/expiring` is in the Offer controller, and its query is `OfferStore.listVendorsWithExpiringOffers`, since it counts Offers by the rules in `expiry.ts`, as a Vendor's own counts are counted. It joins the Vendor's row for its name, its numbers and whether it is active. `ListVendorsWithExpiringOffersQuery` is in `domain/offer`, reads the API's clock once and passes that moment to the Store, so that every Vendor on a page is judged at the same moment.
- **The answer.** One page in `core`'s paged answer, each Vendor with `id`, `name`, `phoneNumber` and `whatsAppNumber` as `{ international, national }`, the WhatsApp number null when the Vendor has none, and `counts`, ticket 02's `{ offers, expired, aboutToExpire }`, of all the Vendor's Offers. Ticket 02 made those counts for the banner and Expiring Offers both, so the same answer serves here, and the total of Offers is there for a row that wants it.
- **Which Vendors.** An active Vendor with at least one Offer confirmed more than 11 days ago, which is an Expired Offer or one about to expire, by the same two moments as the `Offer` entity and ticket 02's counts. A deactivated Vendor is left out, its Offers whatever they are.
- **The order.** The spec orders by the soonest expiry among a Vendor's Offers, "an Expired Offer counting as sooner than any other, then by name". It is read here as: an Expired Offer's expiry counts as the same for every Vendor that has one, so all those Vendors come first, among themselves by name; then the Vendors whose Offers are only about to expire, the one whose Offer was confirmed longest ago first; then by name, then by identifier, so that moving between pages never skips or repeats one. Ordering the Vendors with Expired Offers by how long ago they expired was the other reading; it would have left "then by name" to decide almost nothing, and a Vendor whose Offers expired long ago is no more urgent to remind than one whose expired yesterday, since neither's are shown to Shoppers. One SQL expression does it, `case when <expired> > 0 then null else min(confirmed_at) end`, nulls first.
- **The page and its total** are read in one read-only snapshot, as the Vendor's list is.
- **No new index.** The list reads every Offer confirmed more than 11 days ago, across Vendors. The `(vendor_id, confirmed_at)` index of ticket 02 serves it per Vendor; an index on `confirmed_at` alone is left until the number of Offers asks for one.
- **The Admin-only rule** is `@PreAuthorize([Role.ADMIN])` on the endpoint, as the other Admin-only endpoints have it, so a Vendor's token is answered 403 with `ACCESS_DENIED` before the Query runs.

**How it was built.** The first test (a Vendor with one Offer about to expire is listed with a count of one, one with only current Offers is not) was run red first: 404, no route yet. Then the Query, the Store's query, the endpoint and the client, and the other eleven tests in `offer.controller.expiring.integration-spec.ts`, which passed when first run; the faults below show that each group can fail. The tests add each Offer as the Admin with the clock moved to its Confirmation, make Vendors and deactivate them with the clock running, and read the list with the clock moved to one moment, as ticket 02's do.

**The faults, each planted once by a script on a clean tree, run against the Expiring Offers tests, and reverted by restoring the file's text; the tree was clean after each.**

| Fault | Tests that failed | Why |
|---|---|---|
| The Admin-only rule removed (`@PreAuthorize([Role.ADMIN, Role.VENDOR])`) | Refuses a Vendor's token with 403 | The Vendor's token was answered 200 |
| Deactivated Vendors left in (the `active` condition removed) | Leaves out a deactivated Vendor | The deactivated Vendor was listed after the active one |
| Also tried: Vendors with an Expired Offer ordered by how long ago it expired (`min(confirmed_at)` alone) | The Vendors with an Expired Offer in name order | The Vendor whose Offer expired 40 days ago came before the one 15 days ago, against their names |
| Also tried: the Vendors ordered by name alone | An Expired Offer before one about to expire; the soonest expiry first | The Vendor about to expire came first by its name, both times |
| Also tried: only Vendors with an Expired Offer listed (`having` on the expired count) | The Vendor with one Offer about to expire is listed; both lines of the order that list one about to expire | Those Vendors were missing |

**Checks so far.** `pnpm integration:check` passes with 336 tests in 11 files on `f5caa75`, and with 323 in 10 on `1d27c96`. `pnpm check --skip-nx-cache` passes on both in a fresh clone, with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`.

**The screen waits for the owner's choice.** Two decisions are captured at 360 pixels in the Admin console's real frame, for three made-up Vendors named in English, Kurdish and Arabic: the rows (the numbers as two underlined links on one line of the row, or as two outlined button-sized links at its foot), and the empty list's words ("No Vendor needs reminding", or "Nobody to remind"). The screen, its end-to-end lines and their accessibility checks are built after the choice.
