# 07: Expiring Offers for the Admin

**Spec:** [the offers spec](../spec.md)

**What to build:** The Admin console gains Expiring Offers, reached from the top bar's menu. It lists the active Vendors that have Expired Offers or Offers about to expire, most urgent first, with how many of each, so that the Admin can remind them personally (OFF-9). Each Vendor shows its phone number to call and its WhatsApp number to open a chat from the Admin's own WhatsApp, and leads to the Vendor's page. The platform sends nothing itself.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] **The endpoint.** `GET v1/offers/expiring`, for the `admin` role only, through `ListVendorsWithExpiringOffersQuery` and `core`'s `PagingRequest`. It answers one page of active Vendors that have at least one Expired Offer or Offer about to expire. Each Vendor has its identifier, its name, its phone number and WhatsApp number as `{ international, national }`, and the two counts. Vendors are ordered by the soonest expiry among their Offers, an Expired Offer counting as sooner than any other, then by name. Deactivated Vendors are left out.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] **The screen**, in English, in the top bar's menu beside the Catalog and the Vendors. Each row shows the Vendor's name `AsWritten` and the two counts written by `formatNumber`. Its phone number is a `tel:` link, and its WhatsApp number a `https://wa.me/<digits>` link that opens in a new tab, each in Iraq's own form and `AlwaysEnglish`. The row leads to the Vendor's page. An empty list says that no Vendor needs reminding.
- [x] Before building, the screen is shown to the owner in the built-in browser in two choices in the dashboard's look. The owner picks one, and the choice is recorded under Comments.
- [x] It follows DESIGN.md and the dashboard's own, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] `pnpm integration:check` gains these tests, which move only Jest's `Date`, and passes:
  - A Vendor with one Offer about to expire is listed with a count of one, and one with only current Offers is not.
  - A Vendor with an Expired Offer comes before one whose Offers are only about to expire.
  - A deactivated Vendor is left out.
  - After the Vendor confirms all, it leaves the list.
  - A Vendor's token is answered 403, and a call without a token 401.
- [x] `pnpm platform:check` gains these lines, and passes on every line, in a window 360 pixels wide:
  - The Admin reaches Expiring Offers from the menu.
  - Given an answer with a Vendor through Playwright's `page.route`, a row's links hold the Vendor's phone number and WhatsApp number, and the row leads to its page.
  - `expectAccessible` passes on the screen, in the light and in the dark scheme.
- [x] Shown once and then reverted, each failing its own test: the Admin-only rule removed; deactivated Vendors left in.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

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

### 20 October 2026: the owner's choices, and the screen

**The owner's decisions.** Shown the two decisions at 360 pixels (`decisions-07`, `#d1` and `#d2`), the owner kept both as recommended, and kept the order as built:

- **The rows** show the Vendor's name as it writes it, one line in Action Red after a circled exclamation mark, "1 Expired Offer · 4 about to expire", and then the phone number and the WhatsApp number as two underlined links, 44 pixels high, on one line, the WhatsApp one with the new-tab mark; a Vendor with no WhatsApp number says "No WhatsApp" in Note Grey. The two numbers as outlined button-sized links at the row's foot were not taken.
- **The empty list** says "No Vendor needs reminding", with a circled tick, and "Every active Vendor's Offers are current for at least 3 more days." The wording "Nobody to remind" was not taken.
- **The order** stays as the API answers it: the Vendors with an Expired Offer first, by name, then the Vendor whose Offer expires soonest, then by name.

**Commits.** `7d687a7` the merge of `offers/integration`, which brought ticket 06, `f5a8b6b` the screen, its menu entry, the client's index and DESIGN.md, `ff30578` the end-to-end lines, `6beb1f4` a fix to ticket 08's end-to-end line, and this record.

**Decisions this part left open.**

- **The address** is `/expiring-offers`, its page in the address as the Vendors' is (`?page=2`), with `usePageInTheAddress`. The list has no pane beside it: a row leads to the Vendor's page at `/vendors/{vendorId}`, under the Vendors, which shows it beside their list from 64rem and has its own way back. Making the Vendor's page a child of the Expiring Offers would have needed its links, its edit form and its portal under a second address. The list keeps a column at most 42rem wide on a wide screen.
- **The menu** names the fourth section "Expiring Offers", after the Missing specifications, as the spec orders them.
- **The query** is under the Vendors' key, `[...vendorsKey, 'expiring-offers', { page }]`, so that deactivating a Vendor, or editing its numbers, asks for the list again. The Offers' own key arrives with ticket 03; a Vendor's Offers confirmed in its portal show on the list the next time it is opened, as every query is asked again then.
- **The two links.** The phone number is `tel:` with its international form, and the WhatsApp number `https://wa.me/` with the international form's digits and no `+`, as the hand-over's link writes it, with no message, which the Admin writes in the chat. Both are in `pages/expiring-offers/model/links.ts`. Each is drawn above the link that covers the row, so that a tap on a number calls or chats, and a tap anywhere else opens the Vendor's page. A screen reader hears "Call 066 223 4567" and "Chat in WhatsApp with 0770 123 4567, in a new tab"; each number is `AlwaysEnglish`, and the name `AsWritten`.
- **Why the Vendor is listed** is one line, the two counts written by `formatNumber`, "1 Expired Offer" or "2 Expired Offers", then "3 about to expire", a count of none left out. The total of Offers in the answer is not shown.
- **The plate** is the count of Vendors to remind, the screen's one plate, as the Vendors and the Missing specifications have theirs.
- **The client's index** now exports `VendorsOfferCountsResponse`, `VendorsWithExpiringOffersPageResponse` and `VendorWithExpiringOffersResponse`.

**How it was built.** The screen after the owner's choice, then `admin-expiring-offers.spec.ts`, whose four lines passed when first run; the faults below show that the menu's line and the links' line can fail. The development database's Offers are whatever earlier runs left, and no Offer can be made old through the API, so the lines that read rows give the page the list's answer with `page.route`, for a made-up Vendor that exists, so that its row leads to a real page. The first line reads the real answer, and accepts rows or the empty list.

**The end-to-end lines**, at 360 pixels: the top bar's menu leads to the Expiring Offers, which ask the API for the list and are answered 200; a row's links hold `tel:+964662234567` and `https://wa.me/9647701234567` in a new tab, each number marked English and the name marked as written, the count and the counts' line are right, the list does not scroll sideways, and the row leads to the Vendor's page; a Vendor with no WhatsApp number says so and has no chat link, and an empty answer says "No Vendor needs reminding"; `expectAccessible` passes on the list with two rows, in the light and the dark scheme.

**Faults in the screen**, each planted once by a script on a clean tree while holding the e2e lock, run against the four lines, and reverted by restoring the file's text; the tree was clean after each.

| Fault | Lines that failed | Why |
|---|---|---|
| The WhatsApp link keeps the `+` | A row's links hold the numbers | The link was `https://wa.me/+9647701234567` |
| The menu's entry removed | The menu leads to the Expiring Offers | No link named "Expiring Offers" in the sections |

**The merge.** Ticket 06 added its own Query, a visible Offer and its import of `desc` to the Offer Store, its module and the Store's imports, beside this ticket's; both were kept, and the description and the client were written again with `pnpm api-client:write`. Its migration `0011_index-offers-by-part-and-confirmation` was not yet in the development database, which `pnpm platform:check` refused at first; `pnpm db:migrate` applied it.

**Ticket 08's line, fixed.** The first full `pnpm platform:check` failed one line of ticket 08's, not of this ticket: after saving a Part opened from the Missing specifications, it expected the list's bare address. The development database now holds more than a page of Parts missing specifications from earlier runs, so the made-up Part was on page 2, and saving returned, as it should, to `/missing-specifications?page=2`. The line now takes the address with its page (`6beb1f4`), and the next run passed whole.

**Open, waiting for hosting.** The WhatsApp link opening the WhatsApp app on the Admin's phone in a chat with the Vendor, the phone link opening the dialler, and the screen used with a thumb, as the spec's Testing Decisions list. They are in the MVP spec's list under "Checks on a phone wait for hosting".

**Checks.** On `6beb1f4`, the tip before this record, and on the merge `7d687a7`, `pnpm integration:check` passes with 346 tests in 12 files, and `pnpm platform:check` passes on all 138 lines, the four new ones among them, on `6beb1f4`. `pnpm check --skip-nx-cache` passes on `1d27c96`, `f5caa75`, `7d687a7`, `f5a8b6b`, `ff30578` and `6beb1f4` in a fresh clone with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`; `d71b57a` and this record change only the ticket's file and the MVP spec. Every commit was gated on both `pnpm integration:check` and `pnpm check` before it was made.
