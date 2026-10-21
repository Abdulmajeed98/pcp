# 11: The Vendor portal's frame and the Offers screen

**Spec:** [the redesign spec](../spec.md)

**What to build:** The Vendor portal takes the new look, with its first screen rebuilt from end to end: the frame's top bar with the Vendor's name, Log out and the language switch, the portal's sections, the band shown while the Admin acts as a Vendor, and the Offers screen with its expiry banner and confirm-all. It is laid out for a phone behind the counter first, in Kurdish, Arabic and English, in both directions.

**Blocked by:** 07

**Status:** ready-for-agent

- [x] The portal's frame, its sections, the language switch and the band of the Admin acting as a Vendor follow the new DESIGN.md, and the frame has the scheme switch of ticket 03 beside the language switch, as the Admin console has.
- [x] The Offers screen, an Offer's row, the expiry banner, confirm-all and its result, the search and the empty screen follow it, and move as its Motion section says, mirrored in right-to-left, with reduced motion respected.
- [x] The Offers screen passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command, acting as the fixture's Vendor, in Kurdish and in English, with every state of an Offer on it.
- [ ] Emil's `break-ui` and `mobile-native` are run on the Offers screen: long Part names, a price in the millions of dinars, a dozen expired Offers, none at all; and how it takes a thumb at 360 pixels. What broke is fixed.
- [x] It passes `checkInEveryLanguageOfTheVendorPortal`; prices and Part names are still drawn left to right with no Arabic-Indic digit.
- [x] `expectAccessible` passes on the screen with the banner, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [x] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [ ] The screen is shown to the owner in the built-in browser before the ticket closes, in Kurdish and in English, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building it taught something.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 21 October 2026: a note from ticket 06

The new DESIGN.md gives the Offers screen underline tabs for the list's states, All, Need confirming and Out of stock, each with its count, kept in the screen's address as the search and the page are. Ticket 06 did not check whether the API's list of a Vendor's Offers (`GET` of a Vendor's Offers, with its `counts`) can filter by state, nor whether it counts the out-of-stock Offers. Check it before building the tabs; if the API lacks either, that is API work to agree with the owner first, as the MVP spec's boundaries ask.

### 22 October 2026: the API's list by state, checked and built

Ticket 06's note asked whether the API's list of a Vendor's Offers could filter by state and count the Offers out of stock. It could do neither: `GET /v1/vendors/{vendorId}/offers` took a search and a page, and its `counts` held `offers`, `expired` and `aboutToExpire`. The owner was not answering while I ran, and the orchestrator asked for the smallest honest way, recorded for the owner. Built (commit 1), as the smallest change that lets the tabs be real rather than counted or filtered in the browser over one page:

- `state` in the list's query, `all` (the default), `needs-confirming` (Expired Offers and those about to expire, confirmed before the moment an Offer starts to be about to expire, by `expiry.ts`) or `out-of-stock`; the search works within it, the order is unchanged, any other value is refused 400 `NOT_VALID` on `state`.
- `outOfStock` among the counts, which stay of all the Vendor's Offers whatever the search and the state; the same counts class serves Expiring Offers, which now carries it too.
- Nothing is stored differently and no migration was needed, so it is not among the MVP spec's "Ask the owner first". It is listed for the owner below all the same, since ticket 06 asked for it to be agreed.
- Tests: five new lines in `offer.controller.integration-spec.ts` (each state, the search within one, the counts whatever the search and the state, an unknown state refused), written first and failing on 400 (the unknown query field) and on the missing count; the eleven existing `toEqual`s on counts in both offer integration specs gain `outOfStock: 0`. The inspector's made-up shop answers the state and the count as the API does, with a new line in its spec. `pnpm integration:check` passed before the commit (13 files, 373 tests), and `pnpm check`.

### 22 October 2026: what was built

On branch `redesign/11-the-portals-frame-and-the-offers-screen`, in four commits after the API's and a record, each gated on `pnpm check`'s exit status on exactly what was committed (the later pieces were set aside by copying):

2. `feat(dashboard)`: **the portal's frame** (`vendor-portal-frame.tsx`), the Admin console's from ticket 07 in the portal's three languages. From 64rem the Stone Frame's sidebar, its head the Vendor's name as it writes it with "Vendor portal" in Note Grey, then the sections Offers (a package mark) and Details (a shop mark); the top bar with the screen's search in its centre, the language switch, the scheme switch in the portal's language and a ghost Log out; the sheet inset 8 pixels from the end side, mirrored in Kurdish and Arabic. Below 64rem one 56-pixel bar with the menu button, the Vendor's name and the screen's one action, and the menu sheet with the sections, both switches and Log out. **The language switch** is segmented, as the scheme switch is. **The band** of the Admin acting as a Vendor runs across the whole window above the frame, on Active Stone with an Edge line. **The plain messages** for a Login with no Vendor and a deactivated Vendor sit on the frame's sheet with no sections (ticket 13 lays them out).
3. `feat`: **the Offers screen** (below), with `shared/ui`'s new `Leaving` and `ScreenAction` (the phone bar's one action, as `ScreenSearch` is the top bar's search), `shared/lib`'s `useWithTheLeaving`, `entities/offer`'s `OfferPlate`, a `muted` prop on the shared `Plate`, and the theme's `settles` and `leaves` (Motion 7 and 8). All additive; `Plate`, `MenuSheet` and the theme are shared, and only gained a prop, a class and two utilities.
4. `fix(dashboard)`: Emil's `mobile-native` (below).
5. `fix(e2e)`: a deactivated Vendor's Log out read in the menu sheet (below), found by `pnpm platform:check`.

**The Offers screen**, as DESIGN.md's Vendor portal, Tabs, Rows, Plates and States say: the title row with Add an Offer (outlined from 64rem; on a phone a plus named "Add an Offer" on the bar's end side, the surface brief's first viewport); the expiry banner (a Sheet panel with an Action Red edge, 8-pixel corners, its counts at weight 650, Confirm all on its end side from 64rem and as wide as the panel on a phone); Confirm all's result line, arriving; the tabs All, Need confirming and Out of stock with their counts, in the address as `tab`; the search in the top bar from 64rem and below the tabs on a phone, searching on Enter in the tab the Vendor is in; the count in words on the filter bar's end side, "Searching…" beside it; a table from 64rem (Part two fifths, Price end-aligned, Last confirmed, Stock, Warranty, a Note Grey dash named "No warranty stated") and two-line rows on a phone (the name, its manufacturer and Category, the plate on a line of its own, then the Confirmation, the stock and a stated warranty); one plate per Offer with both prices, the dollars first, units a quiet Geist suffix, the comma in Geist, named as one image in the portal's language, muted when out of stock with the Part's name in Note Grey; a tab with nothing says so in one Note Grey line; a Vendor with no Offer gets the empty state in place of the tabs, the search and the list; rows sketched still while the first answer comes.

**Found while building:** `state` cannot be the tab's name in the address. keycloak-js reads an address holding `state` as OAuth's answer, and a reload of `/?state=out-of-stock` ended on Keycloak's "Invalid parameter: redirect_uri". The tab is `?tab=`, and DESIGN.md and the code say why.

**Motion**, as DESIGN.md's Motion section says: the press and the colour under the pointer from ticket 07's base; the menu sheet from the start side; after Confirm all, each changed row's Confirmation is drawn again at its new state and fades in from `@starting-style`, 200 ms, 30 ms after the row above, the first ten rows that stay; the banner fades in 150 ms and then closes its space and the gap below it in 200 ms (`grid-template-rows`), inert and clipped only while it leaves; a row the same list drops (the Need confirming tab after Confirm all) leaves the same way, each table cell's content with its padding; another tab, search or page replaces the rows at once. With reduced motion every row settles at once and a space closes at once after its fade (in 1 ms, so that its end is still heard). The plates, the tabs' line, the language and the scheme are still.

### 22 October 2026: how each skill was run

- **`mattpocock-skills:tdd`**, loaded through the Skill tool. The owner was not answering, so I chose the seams, as tickets 01 and 07 did: the API's HTTP surface against a real PostgreSQL (`offer.controller.integration-spec.ts`), the inspector's made-up shop (`made-up-shop.spec.ts`), and the portal in a real browser through Playwright. Red first, each for the right reason: the API's on 400 and the missing count; the shop's on its missing filter; the frame's three on the missing scheme switch in the top bar and the missing menu sheet (its band line passed on the old band, so it gained a check of the band's Active Stone and of the sidebar beside the sheet); the Offers screen's four on the missing tabs, the missing table and nothing settling.
- **Taste** (`design-taste-frontend`, its app-screens chapter: tabs on a full-width rule, rows, the phone) inside the chosen sheet, restored into `.taste-skill/direction.json`; `inspect.mjs --app` through `pnpm dashboard:inspect` (below).
- **Emil**: `emil-design-eng` with the concrete question of building Motion 7 and 8 in CSS alone so that they retarget, mirror and respect reduced motion; `break-ui` and `mobile-native` (below).
- **Impeccable**: `impeccable context --target apps/dashboard/src` once, then its `document` for DESIGN.md (below) and its `harden` for right to left and the three languages, which found the two right-to-left faults in break-ui's table. Its directive to probe the owner once with a question tool could not be followed: no such tool reaches the owner from here, and the brief says the owner is not answering, so the choices are on the review page instead. It also reports that `.impeccable/config.json` records no `buildPath`, which matters only for Persuade and Experience surfaces with image generation; nothing was written. No skill refused to load.

### 22 October 2026: Emil's break-ui on the Offers screen

The worst case entered at the API's boundary, as the skill asks: a throwaway capture spec answered the Vendor's list inside the browser with five datasets (Demo; Worst case: the Corsair H100i's 230-character name at the API's largest prices, 100,000.00 $ and 150,000,000 IQD, out of stock and expired 45 days, a DeepCool name of 180 characters by "Thermaltake Technology Co., Ltd.", a Part called "Jo" by "X" at 1,000 IQD with a month's warranty, a 120-month warranty, no warranty; Empty; One; a dozen expired Offers), at 1440, 768, 360 and 320, in English and Kurdish, light and dark, and the captures were deleted with the spec. The API's limits are in `OfferDetails.ts`; a Part's name has none (ticket 07). The toggle is on the review page (Demo data, Worst case, Empty, One, Dozen expired, before and after the fixes); none was added to the app.

| # | Severity | Field | Worst case | What happened | Fix |
|---|---|---|---|---|---|
| 1 | Ugly | a Part's name, in Kurdish and Arabic | the H100i's name | An English name that wraps took the portal's right-to-left alignment line by line, so its lines started at different places | The name is a box of its own, left to right, as wide as its text, on the screen's start side (`offer-rows.tsx`) |
| 2 | Ugly | the Vendor's name in the phone's bar, in Kurdish | "Made-up test Vendor 1792…" | Cut at its start, "… Vendor 1792…", in the portal's direction | Cut at its own end, in its own direction (`vendor-portal-frame.tsx`) |
| 3 | Fragile | a plate at the API's largest prices | 100,000.00 $ and 150,000,000 IQD | Fitted 360 by a few pixels; 320 would scroll sideways | Below 64rem the dinars take a second line on the same plate (`offer-plate.tsx`). At 64rem the first try let the table squeeze every plate onto two lines, which the inspector's photographs showed; the wrap is a phone's only |
| 4 | Ugly | Stock and Warranty from 64rem | beside the widest plate | "Out of / stock", "12 months / warranty" | Each keeps one line (`offer-rows.tsx`) |
| 5 | Ugly | the Vendor's name at the head of the sidebar and the menu sheet, in Kurdish | a Latin name | It stood on the left, as a flex item in its own direction | It keeps its direction inside a line of the portal's (`vendor-portal-frame.tsx`) |

**What held up:** a dozen expired Offers (the banner counts 12, every row in Action Red with its days, Need confirming 12); no Offer (the empty state with Add your first Offer, no tabs, no search); one Offer ("1 Offer", "1 month warranty", "Confirmed 1 day ago"); a one-letter manufacturer; every count grouped in Western digits; nothing scrolls sideways at 1440, 768, 360 or 320 in either language (measured on every capture).

### 22 October 2026: Emil's mobile-native at 360 pixels

From the code and the emulated phone; the skill's own rule is that none of it is proved until a real phone, which waits for hosting (below).

- **Fixed** (commit 4): the tap highlight (`-webkit-tap-highlight-color: transparent`, every control has its press, Motion 1); the tap delay (`touch-action: manipulation` on links and buttons); a button's words selected or a callout under a resting thumb (`user-select: none`, `-webkit-touch-callout: none` on buttons only, so a Part's name can still be copied); font inflation (`text-size-adjust: 100%`); the browser's bar (`theme-color` per scheme, the Stone Frame's two colours; the scheme switch's own choice does not reach it, as the meta follows the device); the menu sheet scrolling the screen behind it (`overscroll-contain`).
- **Already right:** inputs at 16 pixels and more, so no zoom; `enterkeyhint="search"`; hover only where a pointer can hover (Tailwind v4); `min-h-dvh` for the frame; the tabs scroll in their own row with `overscroll-x-contain`; every control 44 pixels on a touchscreen.
- **Left as it is:** pull-to-refresh, which a Vendor may use to read the Offers again; the safe areas of a notch, since `viewport-fit=cover` would draw the Admin console's frame under it too (the page stays letterboxed inside them, losing nothing).

### 22 October 2026: tests that changed, and why

No test lost an assertion.

- `development-logins.ts`: the helper that opens the menu sheet on a phone moved to the new `menu-sheet.ts`, and finds the menu button by what it opens (`aria-haspopup="dialog"`), in either half and any language, since the portal now has one too; `logOutOfTheDashboard` uses it for both halves.
- `languages.ts`: on a phone the portal's language switch is in the menu sheet (DESIGN.md's Layout, the owner's "Accept" in ticket 06), so `readInEveryLanguageOfTheVendorPortal` opens the sheet before each tap and closes it after the switch is checked. The check that the switch is "on the end side of the frame" is replaced, for the portal on a phone, by the check that it is in the menu sheet; the Shopper app's and a wide portal's keep the end-side check. Every other check of the switch stands. `chooseInThePortal` is new, and also checks that the page took the language.
- `buttonFor(…).click()` became `chooseInThePortal(…)` in `admin-acting-as-vendor`, `admin-deactivate-vendor`, `vendor-add-offer`, `dashboard-languages`, `vendor-portal` and `vendor-contact-details` (fifteen taps), each now also checking the page's language.
- `offers.ts`: `goToTheSection` and `expectTheCurrentSection` open the menu sheet on a phone, where the sections are; `theTab` and `noOfferInTheState` are new; the counts a test gives default `outOfStock` to 0, since the screen reads it.
- `vendor-portal.spec.ts`: the plain message for a Login with no Vendor keeps every check (Log out visible, the three languages, no link, no heading, no Vendor's name, no sideways scroll, `expectAccessible`); its count of buttons is now the bar's one (the menu) and the menu sheet's seven (Log out, three languages, three schemes), with no section in it. Two checks that the language switch is shown read it with the sheet open.
- `dashboard-languages.spec.ts`: the switch's three buttons are counted with the sheet open.
- `admin-deactivate-vendor.spec.ts`: the plain message for a deactivated Vendor keeps Log out in the menu sheet on a phone, so the line opens the sheet to find it there, and checks that the sheet holds no link either, beside the page's no-link check.
- `vendor-add-offer.spec.ts`: on a phone Add an Offer is in the frame's bar, no longer inside the Offers screen, so it is clicked there, after a check that the screen is shown.
- New: `vendor-portal-frame.spec.ts` (four lines: the sidebar and top bar at 36 pixels with `expectAccessible`; the frame mirrored in Kurdish with the sheet inset 8 pixels from the left; the band across the window above the frame on Active Stone, with `expectAccessible`; the menu sheet on a phone at 44 pixels, closing back to its button), and in `vendor-offers.spec.ts` the tabs (counts, Out of stock in the address across a reload, Need confirming's line), the table at 1280 with the search in the top bar and a muted plate and `expectAccessible`, and Motion 7 and 8 with and without reduced motion.
- The API's and the inspector's tests are under the first heading above.

### 22 October 2026: DESIGN.md corrected

With Impeccable's `document`, where building taught something: Add an Offer as the phone bar's one action; the tabs' counts of all the Offers whatever the search, and the API's list by state; the tab in the address as `tab`, not `state`, and why; the table's Part two fifths and Price end-aligned; the plate named in the portal's language, its figures hidden from a reader; the language switch drawn in place with no address of its own, in the top bar and the menu sheet; the sections' marks and the sidebar's and menu sheet's head; the plain messages on a phone; Motion 7 counted among the rows that stay and drawn again at its new state; Motion 8's gap, clipping, inertness and cells; reduced motion's 1 ms; and a Do for a phone's tap. The MVP spec's list of checks on a phone that wait for hosting has this ticket's.

### 22 October 2026: the checks

- `pnpm check` passed before each commit, on exactly what was committed. `pnpm integration:check` passed before the API's commit.
- **Taste's inspector**, `pnpm dashboard:inspect http://localhost:3002/vendors/00000000-0000-4000-8000-000000000001/portal --language en|ckb --scheme light|dark --app --widths 1440,768,360`, acting as the made-up shop's Vendor (thirteen Offers in every state, the band, the banner), with the API and the dashboard started from the worktree under the e2e lock and stopped after, and the direction of ticket 05 restored with no allowances: **0 FAIL and 0 WARN in all four runs** on the final code. On the way, one run had 1 WARN, `heavy-borders` at 1440 in Kurdish and dark (the banner's Action Red edge and the plates' lit edge, both as DESIGN.md asks); it did not come back. Its photographs found the plates squeezed onto two lines in the table (break-ui's row 3).
- The end-to-end lines of the frame, the Offers screen, adding an Offer and the languages: 47 passed on the final code under the lock.
- `pnpm platform:check` on the code's tip, `1ab882b`, under the scratchpad's e2e lock: **178 passed**, none failed or flaky (6.4 minutes). The run before it, on `fb3ac35`, had 173 passed and 1 failed, `admin-deactivate-vendor.spec.ts`'s deactivation line, which looked for Log out on a deactivated Vendor's plain message outside the menu sheet; fixed in commit 5. `checkInEveryLanguageOfTheVendorPortal` passes on the Offers screen (Part names and prices drawn left to right, kept apart, in Western digits) and on every other portal screen, and `expectAccessible` on the Offers screen with the banner in light and dark, on a phone and at 1280 pixels, and on the frame.
- Nothing was written to the development database by the redesign's tooling: the inspector's shop answers in the browser and refuses every change, and the capture answered in the browser. The end-to-end tests made their own made-up Vendors and Parts, as they always do.

### 22 October 2026: for the owner

**AWAITING OWNER REVIEW.** The review page is `.taste-skill/redesign-11/index.html` in the owner's checkout (to be served from `.taste-skill` on port 4110): the Offers screen at 1440 in English (`#r1`) and Kurdish (`#r2`), light and dark; 768 (`#r3`); 360 with the menu sheet (`#r4`); break-ui's toggle, Demo data / Worst case / Empty / One / Dozen expired, at 1440, 768, 360 and 320, in both languages and schemes, before and after the fixes (`#r5`); the inspector's results (`#r6`); the motion (`#r7`); and the choices (`#q`, `#q1` to `#q8`). Every picture is the running app.

Choices to confirm or change:

1. **The API lists a Vendor's Offers by state and counts those out of stock** (built, as above), which ticket 06 asked to be agreed first. Or take it out and give the screen no tabs.
2. **The tabs count all the Vendor's Offers, whatever the search**, as the banner does. Or counts that follow the search, as the Catalog's do (ticket 07), which needs the API to count each state under the search.
3. **On a phone the language switch is in the menu sheet**, as DESIGN.md has it. Or the three languages kept on the screen itself on a phone.
4. **On a phone Add an Offer is a named plus on the bar's end side**, and the title row holds the title alone. Or the outlined button with its words on the title row at every width.
5. **A plate too wide for a phone puts its dinars on a second line** of the same plate. Or a smaller figure on that plate.
6. **The plain messages** sit in the new frame with no sections, the switches and Log out behind the menu button on a phone (ticket 13 lays them out). Or the switches and Log out on the sheet itself on a phone.
7. **The banner's Action Red edge and the plates' lit edge in the dark** stay as DESIGN.md asks, though the inspector warned of them once. Or a quieter edge on either.
8. **Left for hosting**: the thumb on a real phone, the notch's safe areas (the page stays letterboxed), pull-to-refresh left on. Recorded in the MVP spec's list.

The boxes for break-ui and mobile-native (its by-hand check on a phone waits for hosting), for showing the screen to the owner, and the Status, stay as they are until the owner has looked and answered.
