# 07: The Vendor portal's details screen

**Spec:** [the accounts spec](../spec.md)

**What to build:** A Vendor that logs in sees its own details on the Vendor portal's first real screen, in its language: its name, city, address, map location, phone number, WhatsApp number, Instagram name, opening hours and login phone number. A sentence says that the Admin changes its name, city and login phone number. The frame shows the Vendor's name and a log out button beside the language switch. A Login with the Vendor role and no Vendor behind it sees a plain message, the log out button and nothing else.

The API gains the rule for which Vendor a request acts for, written once for every Vendor portal endpoint of this module and of later ones. The Admin may act for any Vendor, and a Vendor's Login only for its own. Reading a Vendor now follows that rule, and the Caller's Vendor is a new endpoint. The Vendor portal gets its router. The details screen replaces the placeholder page and its sample, and the language tests move to it.

**Blocked by:** 04

**Status:** ready-for-agent

- [x] Before anything is written, these are read for the installed release of React Router, and the findings are recorded under Comments: how one set of pages is mounted under two routers, the Vendor portal's now and the Admin console's in ticket 09, and how a page learns the Vendor it shows.
- [ ] `core` gains a structured error for a refused access, answered 403 with a code of its own, beside `NotFoundError` and `NotValidError`.
- [ ] **The rule**, in the API's domain, handed the Caller's identifier and roles as plain values by the controller:
  - a Caller that holds the `admin` role may act for any Vendor;
  - a Caller that holds only the `vendor` role may act only for the Vendor whose Login it is;
  - a Vendor named that is not the Caller's own is answered 403, whether it exists or not.
- [ ] Reading a Vendor follows the rule. The Caller's Vendor, `ReadCallersVendorQuery`, answers a Vendor's Login with its own Vendor, found by the Login's identifier. A Login with no Vendor behind it is answered 404 with `VENDOR_NOT_FOUND`.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` passes with these tests:
  - The Vendor's own Login reads its Vendor.
  - It is answered 403 for another Vendor, and 403 for one that does not exist, which the Admin is answered 404 for.
  - The Caller's Vendor answers the Vendor's own Login with its Vendor, and a Login that holds the `vendor` role and has no Vendor with 404 and `VENDOR_NOT_FOUND`.
  - Calls without a token are answered 401.
- [ ] Shown once and then reverted, each failing its own test: the ownership check removed from the rule; the Caller's Vendor found by the Login's name instead of its identifier.
- [ ] **Which half.** `halfFor` is extended, and no other rule is made: every Login without the `admin` role gets the Vendor portal, which first asks the API for the Caller's Vendor. Its comment says so.
- [ ] **The router.** The Vendor portal gets React Router in data mode, declared in the App layer as the Admin console's is, and made after the login. The details screen is at its first address. An address that matches no screen shows a "not found" message in the portal's language.
- [ ] **The frame** shows the Vendor's name, `AsWritten`, and a log out button beside the language switch.
- [ ] **The details screen** shows:
  - the name, the address and the opening hours `AsWritten`;
  - the phone numbers, in Iraq's own form, and the Instagram name `AlwaysEnglish`;
  - the city's name from the shared terms;
  - the map location as a link to Google Maps' search for its coordinates;
  - the sentence that the Admin changes the name, the city and the login phone number.

  Its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review, with the words for new terms from the word list. The word list gains any it lacks.
- [ ] **No Vendor behind the Login.** The frame shows a plain message in the portal's language, with the log out button and nothing else.
- [ ] **The placeholder goes.** The Vendor portal's placeholder page, its sample and their messages are removed, and any widget only it used. The Shopper app's placeholder keeps its sample.
- [ ] The Vendor portal's language tests move to the details screen. What the sample proved there is proved where the screen has the same kind of text: text as written, text always in English, and Western digits. The checks the sample made that the details screen cannot make, a sentence that counts and the Category names, are listed under Comments as waiting for `offers`.
- [ ] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules. `pnpm boundaries:check` passes if the lint configuration or a layer folder changed.
- [ ] `pnpm platform:check` gains these lines, and passes on every line. They use a made-up Vendor whose address is written in Arabic script with Arabic-Indic digits:
  - After its first login, the Vendor portal opens on the details screen, with the Vendor's name in the frame.
  - The details screen passes `checkInEveryLanguageOfTheVendorPortal` in all three languages.
  - The address is drawn exactly as written, Arabic-Indic digits and all. The phone numbers are in Western digits, kept apart from the text around them.
  - An address of the Admin console's Vendors section, and one of its Catalog, do not show them.
  - `expectAccessible` passes on the details screen, in the light and in the dark scheme.
- [ ] Shown once and then reverted, each failing on its own line: the `AlwaysEnglish` mark taken off a phone number; the address's digits turned into Western digits; the frame's name taken from the Login instead of the Vendor; a Vendor sent to the Admin console.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

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
