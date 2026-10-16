# 05: Admin console: the Vendors list and a Vendor's page

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin opens the Vendors section of the Admin console on a phone and sees every Vendor, ordered by name, in pages, with the total. Each row shows the Vendor's name as written, its login phone number and whether it is deactivated. Opening one shows its page with every detail: its phone numbers in Iraq's own form, its Instagram name, and its map location as a link that opens Google Maps. The console's frame gains a menu of its two sections, the Catalog and the Vendors.

No Vendor is deactivated until ticket 12, but the list and the page already show the state the API gives.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Before anything is written, Google's documented Maps address that searches for a pair of coordinates is read, and recorded under Comments.
- [ ] **The API.** `ListVendorsQuery` and its endpoint answer the Admin only, with one page of Vendors, active and deactivated, in `core`'s paging shape. They are ordered by name, with the identifier breaking ties. Each holds the identifier, the name, the login phone number in both forms, and whether the Vendor is active.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` passes with these tests: the list holds every Vendor once across its pages, in name order, with the total; a Vendor's token is answered 403; a call without a token is answered 401.
- [ ] The city's name becomes a shared term in the three languages, by its key, with its English shown here. The Kurdish and the Arabic name are drafts awaiting review, and the word list gives them.
- [ ] **The list.** It has an address of its own in the Admin console. It shows the Vendors in pages with the total, says so plainly when there are none, and shows a refusal from the API as one. The name is shown `AsWritten`, and the login phone number, in Iraq's own form, `AlwaysEnglish`.
- [ ] **A Vendor's page.** It has an address of its own, and shows every detail:
  - the name, the address and the opening hours `AsWritten`;
  - the phone numbers, in Iraq's own form, and the Instagram name `AlwaysEnglish`;
  - the city's name in English;
  - the map location as a link to Google Maps' search for its coordinates;
  - whether the Vendor is deactivated.
- [ ] The frame's top bar gains a menu of its two sections, the Catalog and the Vendors. The section the Admin is in is marked as current.
- [ ] Its text is English, written where it is used, as `languages` decided for the Admin console. It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules. `pnpm boundaries:check` passes if the lint configuration or a layer folder changed.
- [ ] `pnpm platform:check` gains these lines, and passes on every line. Each runs as the development Admin, in a window 360 pixels wide:
  - A made-up Vendor created over HTTP is found on the list, whichever page it is on, with its login phone number in Iraq's own form.
  - Its page shows every detail it was given, and its map link's address holds its coordinates.
  - The menu leads from the Vendors to the Catalog and back.
  - Neither screen scrolls sideways.
  - `expectAccessible` passes on the list and on a Vendor's page, in the light and in the dark scheme.
- [ ] Shown once and then reverted, each failing on its own line: the list's order reversed; the `AlwaysEnglish` mark taken off a phone number; a link of the menu given no accessible name.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
