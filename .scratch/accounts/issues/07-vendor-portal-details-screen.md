# 07: The Vendor portal's details screen

**Spec:** [the accounts spec](../spec.md)

**What to build:** A Vendor that logs in sees its own details on the Vendor portal's first real screen, in its language: its name, city, address, map location, phone number, WhatsApp number, Instagram name, opening hours and login phone number. A sentence says that the Admin changes its name, city and login phone number. The frame shows the Vendor's name and a log out button beside the language switch. A Login with the Vendor role and no Vendor behind it sees a plain message, the log out button and nothing else.

The API gains the rule for which Vendor a request acts for, written once for every Vendor portal endpoint of this module and of later ones. The Admin may act for any Vendor, and a Vendor's Login only for its own. Reading a Vendor now follows that rule, and the Caller's Vendor is a new endpoint. The Vendor portal gets its router. The details screen replaces the placeholder page and its sample, and the language tests move to it.

**Blocked by:** 04

**Status:** resolved

- [x] Before anything is written, these are read for the installed release of React Router, and the findings are recorded under Comments: how one set of pages is mounted under two routers, the Vendor portal's now and the Admin console's in ticket 09, and how a page learns the Vendor it shows.
- [x] `core` gains a structured error for a refused access, answered 403 with a code of its own, beside `NotFoundError` and `NotValidError`.
- [x] **The rule**, in the API's domain, handed the Caller's identifier and roles as plain values by the controller:
  - a Caller that holds the `admin` role may act for any Vendor;
  - a Caller that holds only the `vendor` role may act only for the Vendor whose Login it is;
  - a Vendor named that is not the Caller's own is answered 403, whether it exists or not.
- [x] Reading a Vendor follows the rule. The Caller's Vendor, `ReadCallersVendorQuery`, answers a Vendor's Login with its own Vendor, found by the Login's identifier. A Login with no Vendor behind it is answered 404 with `VENDOR_NOT_FOUND`.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` passes with these tests:
  - The Vendor's own Login reads its Vendor.
  - It is answered 403 for another Vendor, and 403 for one that does not exist, which the Admin is answered 404 for.
  - The Caller's Vendor answers the Vendor's own Login with its Vendor, and a Login that holds the `vendor` role and has no Vendor with 404 and `VENDOR_NOT_FOUND`.
  - Calls without a token are answered 401.
- [x] Shown once and then reverted, each failing its own test: the ownership check removed from the rule; the Caller's Vendor found by the Login's name instead of its identifier.
- [x] **Which half.** `halfFor` is extended, and no other rule is made: every Login without the `admin` role gets the Vendor portal, which first asks the API for the Caller's Vendor. Its comment says so.
- [x] **The router.** The Vendor portal gets React Router in data mode, declared in the App layer as the Admin console's is, and made after the login. The details screen is at its first address. An address that matches no screen shows a "not found" message in the portal's language.
- [x] **The frame** shows the Vendor's name, `AsWritten`, and a log out button beside the language switch.
- [x] **The details screen** shows:
  - the name, the address and the opening hours `AsWritten`;
  - the phone numbers, in Iraq's own form, and the Instagram name `AlwaysEnglish`;
  - the city's name from the shared terms;
  - the map location as a link to Google Maps' search for its coordinates;
  - the sentence that the Admin changes the name, the city and the login phone number.

  Its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review, with the words for new terms from the word list. The word list gains any it lacks.
- [x] **No Vendor behind the Login.** The frame shows a plain message in the portal's language, with the log out button and nothing else.
- [x] **The placeholder goes.** The Vendor portal's placeholder page, its sample and their messages are removed, and any widget only it used. The Shopper app's placeholder keeps its sample.
- [x] The Vendor portal's language tests move to the details screen. What the sample proved there is proved where the screen has the same kind of text: text as written, text always in English, and Western digits. The checks the sample made that the details screen cannot make, a sentence that counts and the Category names, are listed under Comments as waiting for `offers`.
- [x] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules. `pnpm boundaries:check` passes if the lint configuration or a layer folder changed.
- [x] `pnpm platform:check` gains these lines, and passes on every line. They use a made-up Vendor whose address is written in Arabic script with Arabic-Indic digits:
  - After its first login, the Vendor portal opens on the details screen, with the Vendor's name in the frame.
  - The details screen passes `checkInEveryLanguageOfTheVendorPortal` in all three languages.
  - The address is drawn exactly as written, Arabic-Indic digits and all. The phone numbers are in Western digits, kept apart from the text around them.
  - An address of the Admin console's Vendors section, and one of its Catalog, do not show them.
  - `expectAccessible` passes on the details screen, in the light and in the dark scheme.
- [x] Shown once and then reverted, each failing on its own line: the `AlwaysEnglish` mark taken off a phone number; the address's digits turned into Western digits; the frame's name taken from the Login instead of the Vendor; a Vendor sent to the Admin console.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 18 October 2026: what was read before anything was written

The dashboard has React Router 8.4.0 installed. The package carries its own documentation, under `node_modules/react-router/docs`, and the comments of its type declarations, which are what was read, on 18 October 2026, rather than the website, which describes the newest release.

**How one set of pages is mounted under two routers.**

- In data mode the routes are plain objects given to `createBrowserRouter`: a `path`, a `Component` and `children` ("Routing", "Route Object"). Nothing ties an object to one router, so one array of route objects can be the `children` of a route in each of two routers.
- "The path of the parent is automatically included in the child", and the child is rendered through the parent's `<Outlet/>` ("Routing", Nested Routes). An index route "render[s] into their parent's Outlet at their parent's URL (like a default child route)" (Index Routes).
- So the Vendor portal's screens are one array of child routes, with paths relative to their parent. The Vendor portal's router gives them to its frame's route at `/`, where the details screen is the index route and so the first address. Ticket 09's Admin console router gives the same array to a route of its own under a Vendor's page, such as `vendors/:vendorId/portal`, with the frame and the band.
- A link between two of those screens has to be written relative to the route, with no leading slash, so that it leads to the same screen under either parent. That is `Link`'s default: `relative="route"` "resolves the link relative to the route pattern" (the comment on `relative` in the type declarations). The details screen has no such link yet; ticket 08's form may.

**How a page learns the Vendor it shows.**

- `useParams` "returns an object of key/value-pairs of the dynamic params from the current URL that were matched by the routes. Child routes inherit all params from their parent routes." Under the Admin console's address the Vendor is a parameter, `:vendorId`. The Vendor portal's first address is `/`, and holds no Vendor: the portal learns its Vendor by asking the API for the Caller's Vendor.
- `useOutletContext` "returns the parent route `<Outlet context>`", for "parent routes [that] manage state or other values you want shared with child routes", and the comment recommends that "the parent component provide a custom hook for accessing the context value", for its types.
- So each frame learns the Vendor in its own way, and hands its identifier to the screens through `<Outlet context>`: the Vendor portal's frame from the Caller's Vendor, and ticket 09's from `useParams`. A screen reads it with one hook, and reads the Vendor itself with the Vendor endpoint, which the rule lets the Admin call for any Vendor. The same page then serves both.
- Not chosen: a loader with `useRouteLoaderData`, which names the route that loaded the data by its identifier, so a page would need to know which of the two routers it is in; and the dashboard reads its data through TanStack Query, with no loader anywhere.

### 18 October 2026: completed

**What was built.**

- **`core`** gains `ForbiddenError`, of the error type `FORBIDDEN`, which the filter answers with 403 and the error's own code, beside `NotFoundError` and `NotValidError`. The type's name is the workplace backend's.
- **The rule**, `VendorAccessRule` in the API's domain. `vendorActedFor(callerId, callerRoles, vendorId)` reads any Vendor for a Caller with the `admin` role, answering 404 with `VENDOR_NOT_FOUND` when there is none. Any other Caller, which an endpoint lets in by its `vendor` role, gets only the Vendor whose Login it is, found by the Login's identifier, and is answered 403 with `VENDOR_ACCESS_DENIED` for any other identifier, whether a Vendor has it or not. `ownVendorOf(callerId)` is that lookup, `VendorStore.readByLoginId`. The controller hands both plain values from the Caller.
- **Reading a Vendor**, `GET v1/vendors/{vendorId}`, is open to `admin` and `vendor` and follows the rule. **The Caller's Vendor**, `ReadCallersVendorQuery` at `GET v1/caller/vendor`, is open to `vendor` and answers a Login with no Vendor behind it 404 with `VENDOR_NOT_FOUND`. `pnpm api-client:write` was run: the client has `readCallersVendor`.
- **Which half.** `halfFor`'s comment says that every Login without `admin` gets the Vendor portal, which first asks the API for the Caller's own Vendor. Its rule did not change.
- **The router.** `vendor-portal-router.tsx` makes React Router's data router after the login, as `admin-console-router.tsx` does, from `vendorPortalScreens` in `vendor-portal-screens.tsx`: the details screen as the index route, and `*` for a "not found" screen in the portal's language, `pages/portal-not-found`, whose link, `..`, leads to the portal's first address under either parent. `App` gives each half its router; an address of the Admin console's matches no screen of the portal.
- **The frame** asks for the Caller's Vendor, `useCallersVendor`. Its top bar, closed by a Rule Sand rule, shows the Vendor's name, `AsWritten`, on the start side, then Log out and the language switch, the switch last, on the end side; on a phone the name shares its row with Log out and the switch has the row below. It gives the screen the Vendor's identifier through `<Outlet context>`, read with `useVendorShown` from the Vendor entity. While it asks, it says so, and a refusal or an API that cannot be reached is said in the portal's language, `WhyNotAnsweredInThePortal`.
- **No Vendor behind the Login.** The frame shows one sentence in the portal's language and Log out, and nothing else: no top bar, no switch.
- **The details screen**, `pages/vendor-details`, reads the Vendor with `useVendor`, so through the rule. Under its heading, "Your details", the sentence that the Admin changes the name, the city and the login phone number; then the name and the city; under "Contact details" the address, the map location, the phone number, the WhatsApp number, the Instagram name and the opening hours; under "Login" the login phone number. The name, the address and the opening hours are `AsWritten`, the address and the opening hours on their lines; the phone numbers, in Iraq's own form, the coordinates and the Instagram name, with an @ and linked to its profile as on the Admin's page, are `AlwaysEnglish`; the city is the shared term; the map location links to Google Maps' search for its coordinates, in a new tab. A detail left out reads "None".
- **Shared with the Admin's Vendor page**: the rows, their list, text written on lines and a phone number moved to the Vendor entity, and the link that opens a new tab to `shared/ui`; each takes its words from the screen.
- **Text.** `VendorPortalFrame`, `NotAnswered`, `VendorDetails` and `PortalNotFound` in `i18n`'s dashboard set, in the three languages, drafted for review. The login phone number is labelled with the word list's ژمارەی تەلەفۆن and رقم الهاتف under the "Login" heading, which keeps it apart from the Vendor's own phone number. The word list gains "Contact details", زانیاریی پەیوەندی and معلومات الاتصال, and moves "Caller" to the words no Vendor reads.
- **The placeholder went**: its page, its sample, `widgets/caller`, which only it used, and the messages `VendorPortalPlaceholder` and `Caller`. The `widgets` layer folder is empty and gone, and `pnpm boundaries:check` passes. The Shopper app's placeholder keeps its sample.
- **DESIGN.md** records the Vendor portal's top bar and a Vendor's detail rows. The MVP spec records the portal's router, `useVendorShown`, the Western-digits check's exception below, and the details screen among the screens that call `expectAccessible`.

**The language tests moved.** `dashboard-languages.spec.ts` makes its made-up Vendor with every detail: an address in Sorani on two lines, with Arabic-Indic digits, `شەقامی ٦٠ مەتری، نزیک بازاڕی ١٠٠` and `هەولێر`, opening hours in the same script and digits, a WhatsApp number, an Instagram name and a map location, with its Latin-script name. What the sample proved is proved on the details screen where it has the same kind of text: text as written (the name, the address, the opening hours, in both directions), text always in English (the three phone numbers and the Instagram name) and Western digits (the helper's check on every screen). The tests that read the placeholder's notice read the screen's heading, and those that waited for the caller's name wait for the Vendor's.

The helper's check that a screen shows no Arabic-Indic digit now leaves out text marked as written, the elements whose direction comes from their text: a Vendor's address is shown with its own digits (LANG-4). The details screen's own test checks that text as written, character for character.

**Waiting for `offers`.** Two checks the sample made have no text on the details screen to make them on: a sentence that counts, in every plural form, and the Category names in each language. Until `offers` adds a Vendor portal screen with them, `pnpm check`'s comparison of the language files is the only check of the dashboard's plural forms, and the Category names are checked in the Shopper app's tests only.

**The API's tests**, in `vendor.controller.integration-spec.ts`, against a real PostgreSQL and a real Keycloak. A Vendor's own token has the Login's identifier as its subject and the login phone number as its name, as Keycloak issues it:

- The Vendor's own Login reads its Vendor.
- It is answered 403 with `VENDOR_ACCESS_DENIED` for another Vendor, for an identifier no Vendor has and for a text that is no identifier, where the Admin is answered 404.
- A Login with the `vendor` role and no Vendor is answered 403 for every Vendor.
- The Caller's Vendor answers the own Login with its Vendor; answers by the Login's identifier, whatever name the token carries; and answers a Login with no Vendor, whose token carries a Vendor's login phone number as its name, 404 with `VENDOR_NOT_FOUND`. The Admin is answered 403, and a call without a token 401.

Each was run before the code existed and failed on the guard's `ACCESS_DENIED` or on the missing endpoint's 404.

**The new lines of `pnpm platform:check`**:

| Line | File |
|---|---|
| After its first login, the portal opens on the details screen at its first address, with the Vendor's name in the frame, and the screen shows its name and login phone number | `vendor-portal.spec.ts` |
| Addresses of the Admin console's Vendors section, its Catalog and a Vendor's page show the portal and not them | `vendor-portal.spec.ts`, the Catalog's line moved from `admin-catalog.spec.ts` |
| An address that matches no screen shows a "not found" message, different in Kurdish and English, whose link leads to the details screen | `vendor-portal.spec.ts` |
| `expectAccessible` on the details screen, in light and dark, at 360 pixels | `vendor-portal.spec.ts` |
| With no Vendor behind the Login, the frame shows one sentence in each of the three languages, different in each, with Log out and no other button, link, heading or name; `expectAccessible` on it in Kurdish | `vendor-portal.spec.ts`, with the API's 404 given to the page by `page.route`, since the tests make no Login by hand in the development Keycloak |
| The details screen passes `checkInEveryLanguageOfTheVendorPortal` | `dashboard-languages.spec.ts` |
| Its labels, its sentence and the city's name differ in each language | `dashboard-languages.spec.ts` |
| The address, the opening hours and the name, on the screen and in the frame, are drawn exactly as written, each starting on its own side and kept apart, the same in all three languages | `dashboard-languages.spec.ts` |
| The phone numbers in Iraq's own form and the Instagram name are drawn left to right and kept apart, in all three languages | `dashboard-languages.spec.ts` |
| The map location links to Google Maps' search for its coordinates | `dashboard-languages.spec.ts` |

The seven lines of `vendor-portal.spec.ts` were run before the screen existed and failed waiting for the Vendor's name in the frame, or for the message. The language lines first failed on the top bar, with Log out at its end, where the switch must be; Log out now stands before it.

**Fault checks**, each planted after the work was committed by a script that refused a tree differing from `HEAD` but for `.claude/`, made exact edits, ran the one test file, wrote the files back and printed `git status`, which showed only `.claude/` after each:

| Fault | Failed |
|---|---|
| The ownership check removed from the rule: a `vendor` Caller read any Vendor by its identifier, as the Admin does | Four API tests: another Vendor read with 200; an identifier no Vendor has and a text that is none answered 404 instead of 403; a Login with no Vendor read a Vendor with 200. 77 passed. |
| The Caller's Vendor found by the Login's name, the token's name read as a login phone number, instead of its identifier | Two API tests: the token naming another Vendor's number was answered that Vendor; the Login with no Vendor, whose token named a Vendor's number, was answered 200 instead of 404. 79 passed. |
| The `AlwaysEnglish` mark taken off a phone number | The phone numbers' line alone, which found no element kept apart around the number. 21 passed. |
| The address's Arabic-Indic digits turned into Western digits | The as-written line alone, on the address's text. 21 passed. |
| The frame's name taken from the Login, its login phone number, instead of the Vendor | The first-login line, `+9647594367304` for the Vendor's name, and every line that opens the portal as a made-up Vendor, which waits for that name. The line with no Vendor passed. |
| A Vendor sent to the Admin console, `halfFor` giving it to every Login | The first-login line, which never found the portal's frame, and the line of the Vendors section's address, whose made-up Vendor's first login, made before it for the group, failed the same way; Playwright then ran none of the group's other lines. |

**Results.** `pnpm platform:check` passes 105 tests against the owner's services with no reset; `pnpm integration:check`, `pnpm check` and `pnpm boundaries:check` pass. No password or secret from `.env` appears in the runs' output.

### 18 October 2026: the code review

Two reviewers read the change, one against the repository's standards and one against this ticket and the spec. Corrected:

- A Login with no Vendor was answered with `vendorNotFound` given a sentence as a Vendor's identifier. It has `callersVendorNotFound` of its own, with the same code.
- An `Option` matched by hand in two places reads `Either.fromOption`.
- The rule's comment said that a Caller with only the `vendor` role is held to its own Vendor; the code holds every Caller without `admin` to it, and the comment now says so.
- `vendor-portal-screens.tsx` said that the Admin console mounts the screens; that is ticket 09's, and it says so.
- The link that opens a new tab is not about Vendors, and moved to `shared/ui`.

Kept as they are: the frame's refusal and the screen's are two alerts with titles of their own. `vendorAccessDenied` carries no additional information, since the Vendor's identifier is the caller's own and the log has it. `VendorAccessRule` is not exported from `VendorModule`; `offers` exports it when its first endpoint needs it. ADR-0009 says that every Vendor portal endpoint names its Vendor in its address; the Caller's Vendor is the one that cannot, as the spec's table of endpoints has it, and ticket 13 may record that when it records the conventions.

**For ticket 09.** The screens and `useVendorShown` are ready to mount under a Vendor's page, but `VendorPortalFrame` learns its Vendor from `useCallersVendor` itself. The Admin's acting frame needs the same top bar with the Vendor from `useParams`, so ticket 09 splits where the frame gets its Vendor from what it draws.

**For ticket 12.** The active check belongs in `ownVendorOf`, which both the rule's Vendor branch and the Caller's Vendor go through, and the Admin's branch does not. The frame shows its plain message for `VENDOR_NOT_FOUND` only; `VENDOR_DEACTIVATED` needs its own, and today would get the screen's ordinary refusal under the top bar.

**Left open, as the spec lists them.** By hand in the owner's browser: the details screen matching DESIGN.md. On a phone, once the platform is hosted, now listed in the MVP spec's "Checks on a phone wait for hosting": the details screen and its top bar used with a thumb, in Kurdish and in English.

**Results after the review**, against the owner's services with no reset: `pnpm platform:check` passes 105 tests, and `pnpm integration:check`, `pnpm check` and `pnpm boundaries:check` pass. Each of the seven commits passed `pnpm check --skip-nx-cache` in a fresh clone in the scratchpad, installed offline, with `DOCKER_HOST` pointed at a socket that does not exist and no browser installed.

### 18 October 2026: decisions left open, for the owner

Each was taken the way the ticket or DESIGN.md pointed, and none blocks the module.

- **No language switch with no Vendor behind the Login.** The ticket says "the log out button and nothing else", so the message has no switch; it follows the portal's language rule, the remembered choice first. **My recommendation:** keep it. Only a Login made by hand in Keycloak's console meets it.
- **The details in three groups**, the Vendor, "Contact details" and "Login", as the Admin's form groups them. It keeps the login phone number, labelled "Phone number" in Kurdish and Arabic as the word list says, apart from the Vendor's own phone number. **My recommendation:** keep it; ticket 08's form then edits exactly the second group.
- **The "not found" screen has a way back**, "Open your details", which the ticket did not ask for. **My recommendation:** keep it.
- **The top bar on a phone** puts the name and Log out on one row and the switch on the row below, at the end, rather than Log out on a row of its own. **My recommendation:** keep it.
