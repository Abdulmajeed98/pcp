# 05: Admin console: the Vendors list and a Vendor's page

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin opens the Vendors section of the Admin console on a phone and sees every Vendor, ordered by name, in pages, with the total. Each row shows the Vendor's name as written, its login phone number and whether it is deactivated. Opening one shows its page with every detail: its phone numbers in Iraq's own form, its Instagram name, and its map location as a link that opens Google Maps. The console's frame gains a menu of its two sections, the Catalog and the Vendors.

No Vendor is deactivated until ticket 12, but the list and the page already show the state the API gives.

**Blocked by:** 03

**Status:** resolved

- [x] Before anything is written, Google's documented Maps address that searches for a pair of coordinates is read, and recorded under Comments.
- [x] **The API.** `ListVendorsQuery` and its endpoint answer the Admin only, with one page of Vendors, active and deactivated, in `core`'s paging shape. They are ordered by name, with the identifier breaking ties. Each holds the identifier, the name, the login phone number in both forms, and whether the Vendor is active.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` passes with these tests: the list holds every Vendor once across its pages, in name order, with the total; a Vendor's token is answered 403; a call without a token is answered 401.
- [x] The city's name becomes a shared term in the three languages, by its key, with its English shown here. The Kurdish and the Arabic name are drafts awaiting review, and the word list gives them.
- [x] **The list.** It has an address of its own in the Admin console. It shows the Vendors in pages with the total, says so plainly when there are none, and shows a refusal from the API as one. The name is shown `AsWritten`, and the login phone number, in Iraq's own form, `AlwaysEnglish`.
- [x] **A Vendor's page.** It has an address of its own, and shows every detail:
  - the name, the address and the opening hours `AsWritten`;
  - the phone numbers, in Iraq's own form, and the Instagram name `AlwaysEnglish`;
  - the city's name in English;
  - the map location as a link to Google Maps' search for its coordinates;
  - whether the Vendor is deactivated.
- [x] The frame's top bar gains a menu of its two sections, the Catalog and the Vendors. The section the Admin is in is marked as current.
- [x] Its text is English, written where it is used, as `languages` decided for the Admin console. It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules. `pnpm boundaries:check` passes if the lint configuration or a layer folder changed.
- [x] `pnpm platform:check` gains these lines, and passes on every line. Each runs as the development Admin, in a window 360 pixels wide:
  - A made-up Vendor created over HTTP is found on the list, whichever page it is on, with its login phone number in Iraq's own form.
  - Its page shows every detail it was given, and its map link's address holds its coordinates.
  - The menu leads from the Vendors to the Catalog and back.
  - Neither screen scrolls sideways.
  - `expectAccessible` passes on the list and on a Vendor's page, in the light and in the dark scheme.
- [x] Shown once and then reverted, each failing on its own line: the list's order reversed; the `AlwaysEnglish` mark taken off a phone number; a link of the menu given no accessible name.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 18 October 2026: what was read before anything was written

Google's documented address for a search, from "Get started with Maps URLs" (developers.google.com/maps/documentation/urls/get-started, last updated 16 October 2026), read on 18 October 2026:

- **The form** is `https://www.google.com/maps/search/?api=1&query=…`. `api=1` is required in every request and its only valid value is 1, and `query` is required for every search.
- **Coordinates as the query.** A query may be a place's name, an address, or a latitude and a longitude separated by a comma, such as Google's own example `query=47.5951518%2C-122.3316393`. Coordinates alone put a pin on the map, with no place's details.
- **Encoding.** The address must be encoded: a comma is `%2C`, a space `%20` or `+`, and the whole address is at most 2,048 characters. `query_place_id` is optional, and is not used.
- **Where it opens.** On Android and iOS it opens the Google Maps app when it is installed, and the browser otherwise. On any other device it opens Google Maps in the browser.

So a Vendor's map link is `https://www.google.com/maps/search/?api=1&query=36.1911744%2C44.0094145`, the latitude first, written by `URLSearchParams`, which encodes the comma as `%2C`.

### 18 October 2026: completed

**What was built.**

- **The API.** `ListVendorsQuery`, with `VendorStore.list` and `GET v1/vendors`, answers the Admin only with one page of every Vendor, active and deactivated, in `core`'s paging shape, `ListVendorsRequest` extending `PagingRequest` and `VendorPageResponse` extending `PagingResponse`. `DatabaseVendorStore.list` orders by name and then by identifier, and reads the page and the total in one read-only snapshot, as the Parts' search does. Each row of the answer, `VendorSummaryResponse`, holds the identifier, the name, the login phone number in both forms and `active`. `pnpm api-client:write` was run, and `@pcp/api-client` now exports the Vendor types the dashboard reads.
- **The city's name.** The shared terms gain `City.erbil`: Erbil, هەولێر and أربيل, the Kurdish and the Arabic drafts awaiting review (LANG-7). The word list gains a table of the cities, by key, and the language files' README and `shared.ts` say that the shared terms hold the cities too.
- **The menu.** The frame's top bar holds a menu of the two sections. On a phone it is behind a 44-pixel button named "Sections", at the bar's start, which opens the two links as a column below the bar and is closed by choosing one. From 64rem the links sit in the bar after the console's name. The section the Admin is in is marked with `aria-current="page"`, weight 600 and a Shelf ground.
- **The list**, at `/vendors`, with its page in the address as `?page=2`. Its count is on the screen's one plate. Each row shows the name `AsWritten`, the login phone number in Iraq's own form `AlwaysEnglish`, and the "Deactivated" mark for a deactivated Vendor. It says "No Vendor yet" when there are none, shows a refusal from the API in the refusal panel, and sketches rows while the first answer is on its way. On a desk's screen a Vendor's page shows beside it, as a Part shows beside the Catalog.
- **A Vendor's page**, at `/vendors/:vendorId`: the name, the address and the opening hours `AsWritten`, the address and the opening hours as blocks on their own lines in their own direction; the phone numbers in Iraq's own form and the Instagram name `AlwaysEnglish`; the city's name in English from the shared term; the coordinates `AlwaysEnglish` and a link, "Open in Google Maps", to Google Maps' search for them, in a new tab; and the state, "Active" or the "Deactivated" mark. A detail left out reads "None". A Vendor that does not exist reads "Vendor not found".
- **Shared.** The Catalog's way to the other pages became `ListPages` in the Shared layer, and its page past the last one `PastTheLastPage`, used by both lists. The dashboard's DESIGN.md records the menu, a Vendor's row and the Vendors' plate.

**The new lines of `pnpm integration:check`**, in `vendor.controller.integration-spec.ts`:

| Line | How it is told |
|---|---|
| Every Vendor once across the pages, active and deactivated, in name order, with the totals | Five Vendors made out of order, one marked deactivated in the database since no endpoint does it yet (ticket 12); three pages of two read, every row and the paging fields compared |
| Vendors of the same name ordered by their identifiers | Three of one name, three pages of one, in the order of their identifiers |
| An empty first page when there is no Vendor | The whole answer compared |
| A page size over the largest refused, naming it | `NOT_VALID` naming `size` |
| A Vendor's own Login refused the list | A token whose subject is the made Vendor's Login, answered 403 |
| The list refused without a token | 401 |

**The new lines of `pnpm platform:check`**, in `apps/e2e/src/admin-vendors.spec.ts`, each as the development Admin in a window 360 pixels wide:

| Line | How it is told |
|---|---|
| A made-up Vendor created over HTTP is found on the list, whichever page it is on, with its login phone number in Iraq's own form, and its row opens its page | The list paged through with Next until the name is seen; the name shown as written and the number kept apart, left to right and `lang="en"`; the row's link leads to its page |
| The list is in name order | Two made-up Vendors, "… B" made before "… A", found across the pages in the order A, B |
| The list does not scroll sideways, and it and its menu meet WCAG 2.2 level AA in light and in dark | `expectNoSidewaysScroll`, then `expectAccessible` with the menu open |
| A Vendor's page shows every detail it was given, and its map link's address holds its coordinates | A Vendor with every detail, its address and opening hours in Sorani with Arabic-Indic digits on two lines; each detail read in its row; the link's address is `https://www.google.com/maps/search/` with exactly `api=1` and `query=36.1911744,44.0094145` |
| A Vendor's page does not scroll sideways, and meets WCAG 2.2 level AA in light and in dark | As for the list |
| The menu leads from the Vendors to the Catalog and back, and marks the section the Admin is in | The links chosen behind the menu button; the address and heading of each section; `aria-current` on the current link only |

Each was run before the screens existed, and all six failed waiting for the list's heading or the Vendor's heading. The API's list was run red too: its four first lines were answered 404. The access line was seen to fail by letting a Vendor's Login call the list (`PreAuthorize([Role.ADMIN, Role.VENDOR])`), answered 200; the line without a token checks the guard every endpoint already has.

**Fault checks**, each planted after the work was committed by a script that refused a target file differing from `HEAD`, made the edit, ran `src/admin-vendors.spec.ts` alone, wrote the file back and printed `git status`, which was clean after each:

| Fault | Failed |
|---|---|
| The list's order reversed, `desc` for the name and the identifier in `DatabaseVendorStore.list` | The name-order line, and nothing else: the two were found B before A. 5 passed. The integration file, run with the same fault, failed its two order lines, and 70 passed. |
| The `AlwaysEnglish` mark taken off the login phone number in the list's row | The found-on-the-list line, and nothing else: the number's element was not kept apart, `keptApart: false`. 5 passed. |
| A link of the menu given no accessible name, its text inside `aria-hidden` | The menu line, which found no link named Catalog, and the list's accessibility line, by axe's `link-name`. 4 passed. |

**Results.**

- `pnpm integration:check` passes 174 tests.
- `pnpm platform:check` passes 93, 6 of them new tests, against the owner's services, with no reset.
- `pnpm check` passes, and `pnpm boundaries:check` passes, though no layer folder and no lint configuration changed: the new slices are in existing layers.
- Each commit passed `pnpm check --skip-nx-cache` in a fresh clone in the scratchpad, installed offline, with `DOCKER_HOST` pointed at a socket that does not exist and no browser installed. The API's commit was gated on `pnpm integration:check` and `pnpm check` in the working tree before it was made.
- No password or secret from `.env` was found in the runs' output.

### 18 October 2026: the code review

Two reviewers read the change, one against the repository's standards and one against this ticket and the spec. Neither found a hard violation or a missing requirement. Corrected:

- **The list's row was never followed.** The spec's seam 3 says "The list finds the new Vendor, and its page shows every detail", and the page line opened the page by its address. The found-on-the-list line now also opens the Vendor's page from its row's link.
- **The 403 line used a token of no Login.** It now calls with a token whose subject is the made Vendor's own Login, read from Keycloak, as seam 2 describes the tokens.
- **The menu button pointed at nothing while closed.** Its `aria-controls` names the menu only while the menu is drawn.
- **The page past the last one was copied** from the Catalog's results into the Vendors list. It is now `PastTheLastPage` in the Shared layer.
- **The MVP spec's list of the Admin console's screens, and of the tests that call `expectAccessible`,** now name the Vendors list and a Vendor's page. The module's conventions are still ticket 13's to record there.
- **The end-to-end tests' `VendorDetails`** shared its name with the dashboard's component, and is now `MadeUpVendorDetails`.

Kept as they are: the list and the page share the Catalog's shape, list beside detail, its page in the address and its sketched rows, with two cases of each, and the "Deactivated" mark draws the "Needed" mark's classes, which the Feature-Sliced Design's rules keep apart. Each is a candidate for the Shared layer at a third use. `ListPages` and `PastTheLastPage` hold the Admin console's English in the Shared layer, which the Vendor portal could import; their comments say so, and a Vendor portal list would need its own words. No end-to-end line runs at a desk's width: the ticket asks for 360 pixels, and the screenshots taken by hand at 1,280 showed the list beside the page and the sections in the bar.

**For ticket 09.** The router declares a Vendor's page as the child of the Vendors list, inside the Admin console's frame and beside the list on a wide screen. Ticket 09 mounts the Vendor portal's pages under that page's address in the Vendor portal's own frame, so it will declare that route outside the Vendors list's children.

**Results after the review**, against the owner's services with no reset:

- `pnpm integration:check` passes 174 tests.
- `pnpm platform:check` passes 93 tests.
- `pnpm check` passes in the working tree, and each of the seven commits passed `pnpm check --skip-nx-cache` in a fresh clone, installed offline, with `DOCKER_HOST` unreachable and no browser installed.

### 18 October 2026: decisions left open, for the owner

Each was taken the way the ticket or DESIGN.md pointed, and none blocks the module.

- **The sections on a desk's screen are in the top bar, not in a side bar.** DESIGN.md had said that on a wider screen "the sections move to a side bar"; the ticket says that the top bar gains the menu. With two sections the bar holds them after the console's name, and DESIGN.md now says so. **My recommendation:** keep the top bar until a section is added that it cannot hold.
- **The map link opens Google Maps in a new tab.** The dashboard keeps its tokens in memory only, so leaving the tab would mean a new trip through Keycloak on the way back. The link says so to a screen reader. **My recommendation:** keep it.
- **The Instagram name is shown bare, as stored**, `made_up.shop`, without an @ before it. **My recommendation:** keep it; `browse` decides how a Shopper reads it.
