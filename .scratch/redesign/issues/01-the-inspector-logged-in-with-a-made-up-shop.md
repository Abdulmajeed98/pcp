# 01: The inspector logged in, with a made-up shop

**Spec:** [the redesign spec](../spec.md)

**What to build:** One command of the project's own, run from the repository root, points Taste's inspector at any dashboard screen and sees it as the development Admin sees it. It launches the inspector's Chrome, logs in once as the development Admin before the first tab, so that Keycloak's cookie carries to every width, and then runs `inspect.mjs` unchanged. The calls for Vendors and Offers are answered inside that Chrome from a fixture of one obviously fictional shop, so that every state of an Offer can be seen, which the API cannot produce since it stamps each Confirmation with the moment it is made. The Vendor portal's screens are reached by acting as the fixture's Vendor, so one Login serves both halves. When the login does not land back on the dashboard, the command fails loudly rather than judging Keycloak's login screen.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The command takes a dashboard address and passes the inspector's own options through (`--widths`, `--out`, `--app`). It uses only Taste's `Browser.launch`, `newPage`, `goto` and `eval`, and edits none of Taste's files, so `npx skills update -g` cannot undo it.
- [ ] It logs in with `DEVELOPMENT_ADMIN_NAME` and `DEVELOPMENT_ADMIN_PASSWORD` from `.env`, and prints neither.
- [ ] **The fixture** is one made-up Vendor, plainly fictional by its name and numbers, with about a dozen Offers: confirmed today, confirmed some days ago, about to expire, expired, out of stock, and with no warranty stated, at least one of each. Its Offers name real Parts of the catalog (ADR-0001); no Part is invented. It is typed by the generated API client's types, so that a change to the API's answers fails the type-check.
- [ ] Only the calls for Vendors and Offers are answered from the fixture; Catalog Parts still come from the API. Nothing is written to the development database, which is checked by counting its Vendors and Offers before and after a run.
- [ ] A run whose page, after the login, is still Keycloak's exits non-zero with a message that says so, and writes no findings. Shown once by giving it a wrong password.
- [ ] **The proof:** the Catalog, logged in, photographed and judged at 1440, 768 and 360 pixels; and the portal's Offers screen, acting as the fixture's Vendor, showing one Offer in each state and the expiry banner, in English and in Kurdish (the language is in the address, ADR-0008).
- [ ] If Keycloak's redirect back does not finish inside the inspector's wait after load, the work stops there, and goes back to the owner with snapshots of the screens as the fallback, recorded under Comments.
- [ ] How to run the command is recorded under Comments, for the tickets after this one.
- [ ] `pnpm check` passes, and the work is committed.
