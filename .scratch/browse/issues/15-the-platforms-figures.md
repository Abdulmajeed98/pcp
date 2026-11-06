# 15: The platform's figures

**Spec:** [the browse spec](../spec.md)

**What to build:** A Shopper can see what the platform holds: how many Vendors and Visible Offers it lists, the Platform Rate behind every Converted Price, and how many days an Offer stays listed without a Confirmation. The Shopper app's DESIGN.md, approved by the owner in ticket 08, prints these on the home page's card and facts row, and puts the rate on a Part's price slip. No public endpoint answered them, so on 6 November 2026 the owner chose to add one. This ticket adds it and teaches the stand-in API to answer it. Ticket 09 shows the figures on the home page, and ticket 12 shows the rate on the slip.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] **`GET v1/platform-figures`** is public, as the spec's other public endpoints are. It answers:
  - how many active Vendors the platform has;
  - how many Visible Offers it lists, by `visibleOffer(now)`;
  - the current Platform Rate, in whole dinars per dollar, or none until the Admin sets the first;
  - how many days an Offer stays current without a Confirmation (OFF-6), read from the API's own expiry rule, never from a second copy.

  The counts and the rate are read in one query, at one moment, so that one answer never mixes two moments.
- [ ] **The rate's history stays the Admin's.** The answer holds the current rate's value alone, not when it was set or by whom. `v1/platform-rate` stays the Admin's alone, as `pricing` left it.
- [ ] The OpenAPI document and the generated client are written again with `pnpm api-client:write`.
- [ ] **The stand-in API** in `apps/inspector` answers the endpoint from the made-up shop, typed by `@pcp/api-client`: its Vendors, its Offers, its Platform Rate of 1,575 and the days. This lets `pnpm shopper:inspect` show the home page's figures. The stand-in judges no visibility, as the spec says.
- [ ] `pnpm integration:check` passes, with these lines at the API seam:
  - With no Vendor, no Offer and no rate, it answers zero, zero, none and the days.
  - A deactivated Vendor and its Offers are not counted, and reactivating the Vendor counts them again.
  - An Expired Offer is not counted (moved with `moveTheClockTo`), and confirming it again counts it.
  - The rate is none until one is set, and then the latest rate set.
  - An Admin's or a Vendor's token changes nothing, and no token is needed.
- [ ] Each new line is seen to fail once, by a deliberate fault that is then reverted, for example counting Expired Offers. Which test failed, and why, is recorded under Comments.
- [ ] `pnpm check` passes, and the work is committed.
