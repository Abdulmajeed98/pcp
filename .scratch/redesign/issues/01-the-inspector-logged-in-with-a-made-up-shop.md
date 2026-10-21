# 01: The inspector logged in, with a made-up shop

**Spec:** [the redesign spec](../spec.md)

**What to build:** One command of the project's own, run from the repository root, points Taste's inspector at any dashboard screen and sees it as the development Admin sees it. It launches the inspector's Chrome, logs in once as the development Admin before the first tab, so that Keycloak's cookie carries to every width, and then runs `inspect.mjs` unchanged. The calls for Vendors and Offers are answered inside that Chrome from a fixture of one obviously fictional shop, so that every state of an Offer can be seen, which the API cannot produce since it stamps each Confirmation with the moment it is made. The Vendor portal's screens are reached by acting as the fixture's Vendor, so one Login serves both halves. When the login does not land back on the dashboard, the command fails loudly rather than judging Keycloak's login screen.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The command takes a dashboard address and passes the inspector's own options through (`--widths`, `--out`, `--app`). It uses only Taste's `Browser.launch`, `newPage`, `goto` and `eval`, and edits none of Taste's files, so `npx skills update -g` cannot undo it.
- [x] It logs in with `DEVELOPMENT_ADMIN_NAME` and `DEVELOPMENT_ADMIN_PASSWORD` from `.env`, and prints neither.
- [x] **The fixture** is one made-up Vendor, plainly fictional by its name and numbers, with about a dozen Offers: confirmed today, confirmed some days ago, about to expire, expired, out of stock, and with no warranty stated, at least one of each. Its Offers name real Parts of the catalog (ADR-0001); no Part is invented. It is typed by the generated API client's types, so that a change to the API's answers fails the type-check.
- [x] Only the calls for Vendors and Offers are answered from the fixture; Catalog Parts still come from the API. Nothing is written to the development database, which is checked by counting its Vendors and Offers before and after a run.
- [x] A run whose page, after the login, is still Keycloak's exits non-zero with a message that says so, and writes no findings. Shown once by giving it a wrong password.
- [x] **The proof:** the Catalog, logged in, photographed and judged at 1440, 768 and 360 pixels; and the portal's Offers screen, acting as the fixture's Vendor, showing one Offer in each state and the expiry banner, in English and in Kurdish (the language is in the address, ADR-0008).
- [x] If Keycloak's redirect back does not finish inside the inspector's wait after load, the work stops there, and goes back to the owner with snapshots of the screens as the fallback, recorded under Comments.
- [x] How to run the command is recorded under Comments, for the tickets after this one.
- [x] `pnpm check` passes, and the work is committed.

## Comments

### 21 October 2026: how to run the command

From the repository root, with the development services, the API (3001) and the dashboard (3002) running:

```bash
pnpm dashboard:inspect <dashboard address> [--language ckb|ar|en] [inspect.mjs's own options]

# The Catalog, logged in as the development Admin, at the three widths
pnpm dashboard:inspect http://localhost:3002/catalog --app --widths 1440,768,360 --out .taste-skill/<folder>

# The Vendor portal's Offers, as the Admin acting as the made-up shop's Vendor, in Kurdish
pnpm dashboard:inspect http://localhost:3002/vendors/00000000-0000-4000-8000-000000000001/portal --language ckb --app --widths 1440,768,360 --out .taste-skill/<folder>
```

- Every argument except `--language` goes to Taste's `inspect.mjs` as it is (`--widths`, `--out`, `--app`, `--allow`, `--json`, `--film`). The exit status is the inspector's own (0 with no FAIL, 1 with some), or 3 when the command could not start, before anything is inspected or written.
- **The portal's language is not in its address.** The ticket says it is (ADR-0008), but that ADR gives the Shopper app a language in each address and says the Vendor portal has none: it shows the language chosen with its switch, which it keeps in the browser's storage. `--language` writes that choice in the inspector's Chrome right after the login, so every tab opens the portal in it. The Admin console is in English whatever it is given (LANG-1).
- The shop's Vendor is `00000000-0000-4000-8000-000000000001`. The portal's other screens are under `/vendors/00000000-0000-4000-8000-000000000001/portal/`: `offers/<offer id>` (the Offers are `00000000-0000-4000-8000-000000000101` to `…113`), `details`, `add`, `add/<part id>`. The Vendors list, a Vendor's page and the Expiring Offers show the shop alone.
- Taste is found at `~/.claude/skills/design-taste-frontend`, or at `TASTE_SKILL_DIR`. The API's address is `http://localhost:3001` unless `VITE_API_URL` says otherwise.
- Taste's inspector has no height for 360 pixels and makes it 225 (0.625 of the width), so the mobile fold at 360 is a short strip; its page sheets show the whole screen. That is Taste's behaviour, left as it is.

### 21 October 2026: what was built

- **The command** is `apps/inspector`, a project of its own (`@pcp/inspector`, tags `scope:web`, `type:app`), so that the shop is type-checked against `@pcp/api-client` and tested with Jest. Node runs its TypeScript as it is, stripping the types (`allowImportingTsExtensions`, `erasableSyntaxOnly`); `pnpm dashboard:inspect` is `node apps/inspector/src/main.ts`.
- **How it wraps the inspector.** It imports Taste's own `scripts/lib/cdp.mjs`, launches Chrome with `Browser.launch`, logs in in a tab of its own, reads the shop's Parts from the catalog, and then replaces `Browser.launch` on that class with one that hands back this Chrome, and `newPage` on this browser with one that answers from the shop in each new tab. Then it imports `inspect.mjs` with the inspector's command line. A module is loaded once for each address, so the inspector's `import { Browser } from './lib/cdp.mjs'` gets the same class. None of Taste's files is edited.
- **The login** opens the dashboard, waits for Keycloak's form (`#kc-form-login`), sets the name and password in the page and presses the button, and waits up to 20 seconds for the dashboard's address to be back and its root drawn. Neither the name nor the password is printed, nor put in an address.
- **The shop** (`apps/inspector/src/made-up-shop.ts`) is "Made-up PC Parts", 1 Made-up Street, Fictional Bazaar, Erbil, phones `0750 000 0001` to `0003`, Instagram `made.up.pc.parts`, identifiers of zeros, with 13 Offers: two confirmed today, five confirmed 1 to 6 days ago, one 8 days ago, three about to expire (in 2 days, in 1 day, today), two expired (20 and 45 days), three out of stock and three with no warranty stated, in USD, IQD or both. Its Offers name real Parts by Category and exact name (a Ryzen 7 7800X3D, a Ryzen 5 7600X, an MSI B650 Tomahawk, two RTX 4070 SUPERs, an RX 7800 XT, Corsair memory, a case and a power supply, two coolers and two SSDs). The Parts' own identifiers differ from one database to the next, so the command reads them from the API's catalog search at the start, with the Authorization header the dashboard's own first call carried after the login; a name the catalog does not hold exactly once stops the command and says which.
- **What is answered from the shop**: every call whose path starts with `/v1/vendors`, `/v1/offers` or `/v1/caller/vendor`, through the DevTools protocol's Fetch domain, before the request leaves Chrome. The list of Vendors, a Vendor, the Caller's Vendor, a Vendor's Offers (searched, paged, oldest Confirmation first, counted whatever the search, with the API's rules of 14 days and 3 of warning applied at the moment of each call), one Offer, and the Expiring Offers. Any other Vendor or Offer is "not found". Every change (POST, PUT, DELETE) is refused with 405 and never reaches the API. Parts, Categories, the Caller and photos still come from the API. `/v1/parts/{partId}/offers`, the Shopper's visible Offers, is not called by the dashboard and is left to the API.
- **Seams tested** (chosen by me, as the owner was not answering while I ran): `answerFromTheMadeUpShop`, the shop's answer to one call (23 tests), and `partsOfTheCatalog`, the shop's Parts from a search of the catalog (4 tests). The Chrome side, the login and the interception, is proved by the runs below rather than by tests.

### 21 October 2026: the runs

All with the API and the dashboard started from this worktree, and the development services from the owner's checkout. The captures are kept in the owner's checkout at `.taste-skill/redesign-01/` (`catalog`, `portal-offers-en`, `portal-offers-ckb`).

- **Keycloak's redirect finished inside the inspector's wait.** Each width's tab is a fresh load: the dashboard sends it to Keycloak, which answers from its cookie at once, and the dashboard comes back and draws. The fold of every width shows the logged-in screen, not Keycloak's, so the fallback of snapshots was not needed.
- **The Catalog** at 1440, 768 and 360, with `--app`: 0 FAIL, 4 WARN (`palette-cream`, `hero-void` and `unused-canvas` at 1440, `icon-tiles` at all three). The top bar names `development-admin`, 27,399 Parts found.
- **The portal's Offers, acting as the shop**, in English and in Kurdish, at 1440, 768 and 360, with `--app`: 0 FAIL, 2 WARN each (`palette-cream`, `icon-tiles`). The band says "You are acting as Made-up PC Parts", the expiry banner says 2 Offers have expired and 3 are about to expire, and the list shows "Expired, confirmed 45 days ago", "Expired, confirmed 20 days ago", "Expires today", "Expires in 1 day", "Expires in 2 days", "Confirmed 8 days ago" down to "Confirmed today", out of stock and no warranty. The Kurdish run is right to left, with the Kurdish text throughout.
- **The development database**: Vendors 1,657, Offers 193 and Offer history 233 before the first run, and the same after the four runs.
- **A wrong password** (planted once in `main.ts`, `password + '-wrong'`, after the work was committed, and undone by the inverse edit): exit 3, after 20 seconds, with "After the login the page is still Keycloak's login screen, at http://localhost:8080/realms/pcp/login-actions/authenticate, which says "Invalid phone number, name or password.". The login did not land back on the dashboard, so nothing was inspected and no findings were written." Its `--out` folder was never made.
- **Faults planted and undone**: renaming `OfferResponse.warrantyMonths` in the generated client's types failed `nx run @pcp/inspector:typecheck` with two errors in `made-up-shop.ts`; letting a change through to the API (`return undefined` for a method other than GET) failed the nine refusal tests; counting an Offer at exactly 11 days as about to expire (`<=` for `<`) failed the test of the expiry rules.
- `pnpm check` passed before the commit.

### 21 October 2026: for the owner

The first box is left open. The ticket asks that the command use only Taste's `Browser.launch`, `newPage`, `goto` and `eval`. Those four log in, but they cannot answer the dashboard's calls inside Chrome: an answer must be in place before the page's own scripts run, and `eval` only reaches a page once it is loaded, and is gone at its next load. So the command also uses three more methods of the same two classes of Taste's `cdp.mjs`: `page.send` (for the DevTools protocol's `Fetch.enable`, `Fetch.fulfillRequest` and `Fetch.continueRequest`; `inspect.mjs` itself calls `page.send`), `browser.on` (to hear each paused request) and `page.close` (to close the login's tab). None of Taste's files is edited, so `npx skills update -g` still cannot undo it; a release of Taste that renamed one of the seven would stop the command, and `apps/inspector/src/taste.ts` lists them in one place. The alternative that keeps to the four is a proxy outside Chrome, given to it through `Browser.launch`'s Chrome arguments, which answers outside the browser rather than inside it. Accept the seven, or ask for the proxy.

Also open for ticket 02: the portal's "Add an Offer" search asks the API for Parts with `vendorId` set to the shop's made-up identifier, which the API does not know. It was not part of this ticket's proof, and ticket 02's capture of the Offer form will show how the API answers it.
