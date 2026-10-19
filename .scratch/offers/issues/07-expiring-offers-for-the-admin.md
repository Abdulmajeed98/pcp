# 07: Expiring Offers for the Admin

**Spec:** [the offers spec](../spec.md)

**What to build:** The Admin console gains Expiring Offers, reached from the top bar's menu. It lists the active Vendors that have Expired Offers or Offers about to expire, most urgent first, with how many of each, so that the Admin can remind them personally (OFF-9). Each Vendor shows its phone number to call and its WhatsApp number to open a chat from the Admin's own WhatsApp, and leads to the Vendor's page. The platform sends nothing itself.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] **The endpoint.** `GET v1/offers/expiring`, for the `admin` role only, through `ListVendorsWithExpiringOffersQuery` and `core`'s `PagingRequest`. It answers one page of active Vendors that have at least one Expired Offer or Offer about to expire. Each Vendor has its identifier, its name, its phone number and WhatsApp number as `{ international, national }`, and the two counts. Vendors are ordered by the soonest expiry among their Offers, an Expired Offer counting as sooner than any other, then by name. Deactivated Vendors are left out.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] **The screen**, in English, in the top bar's menu beside the Catalog and the Vendors. Each row shows the Vendor's name `AsWritten` and the two counts written by `formatNumber`. Its phone number is a `tel:` link, and its WhatsApp number a `https://wa.me/<digits>` link that opens in a new tab, each in Iraq's own form and `AlwaysEnglish`. The row leads to the Vendor's page. An empty list says that no Vendor needs reminding.
- [ ] Before building, the screen is shown to the owner in the built-in browser in two choices in the dashboard's look. The owner picks one, and the choice is recorded under Comments.
- [ ] It follows DESIGN.md and the dashboard's own, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [ ] `pnpm integration:check` gains these tests, which move only Jest's `Date`, and passes:
  - A Vendor with one Offer about to expire is listed with a count of one, and one with only current Offers is not.
  - A Vendor with an Expired Offer comes before one whose Offers are only about to expire.
  - A deactivated Vendor is left out.
  - After the Vendor confirms all, it leaves the list.
  - A Vendor's token is answered 403, and a call without a token 401.
- [ ] `pnpm platform:check` gains these lines, and passes on every line, in a window 360 pixels wide:
  - The Admin reaches Expiring Offers from the menu.
  - Given an answer with a Vendor through Playwright's `page.route`, a row's links hold the Vendor's phone number and WhatsApp number, and the row leads to its page.
  - `expectAccessible` passes on the screen, in the light and in the dark scheme.
- [ ] Shown once and then reverted, each failing its own test: the Admin-only rule removed; deactivated Vendors left in.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
