# 13: The portal's details and the remaining screens

**Spec:** [the redesign spec](../spec.md)

**What to build:** The last screens of the dashboard take the new look, so that no screen is left in the old one: the portal's details screen and its contact details form, the plain messages for a Login with no Vendor and for a deactivated Vendor, the portal's and the Admin console's "not found" screens, and the screen shown when the login fails.

**Blocked by:** 11

**Status:** resolved

- [x] The details screen, the contact details form, the two plain messages, both "not found" screens and the failed login follow the new DESIGN.md and move as its Motion section says.
- [x] Each that can be reached logged in passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command; the portal's in Kurdish and in English.
- [x] Emil's `break-ui` is run on the details screen: a long address, every optional detail missing. What broke is fixed.
- [x] The portal's screens pass `checkInEveryLanguageOfTheVendorPortal`. `expectAccessible` passes on each screen in the accessibility tests' list, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [x] No screen of the dashboard is left in the old look: each route in both routers is listed under Comments with the ticket that rebuilt it.
- [x] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [x] The screens are shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building them taught something.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 22 October 2026: what was built

On branch `redesign/13-the-remaining-screens`, cut from `redesign/integration` at `c106b49` (ticket 07's merge), in four pieces, each gated on `pnpm check`'s exit status on exactly what it committed (the later pieces were set aside by copying, and each piece's version of a shared file written from the final one by a script that asserts each replacement):

1. `feat(dashboard)`, `b997ddb`: **both "not found" screens** are the dashboard's empty state, as DESIGN.md draws an Offer that no longer exists: centred between two Rule lines at the sheet's head, a signpost drawn plain at 32 pixels in Note Grey, the title "Screen not found" as the screen's `h1` in the Section type, one Note Grey sentence, and an outlined button-sized link to the surface's first screen (the Catalog, or the portal's Offers). They hold still as they open.
2. `feat`, `bb54e62`: **the failed login** has no frame, since nobody is known yet: the Sheet ground, with the empty state centred on it, a sign-in mark (mirrored in right to left), the message as its `h1`, and an outlined **Try again** with a circling arrow, which starts the login again from Keycloak (`startLoginAgain` in `shared/auth`, keycloak-js's `login()`), and Keycloak answers from its own session. It keeps the Vendor portal's rule for its language. New words: `LoginFailed.tryAgain`, in Kurdish and Arabic taken from the existing "try again" of `NotAnswered.unreachable`.
3. `feat`, `732b959`: **the portal's details screen** in DESIGN.md's three groups, each after its heading in the Section type: the Vendor (a new heading, `VendorDetails.vendor`, "Vendor", فرۆشیار, البائع), its contact details with Edit beside their heading, and its Login. While the Vendor is read, the title, the headings and each detail's name are drawn at once, each value sketched in Raised Stone, one line high and still, `aria-busy` on the groups and an `<output>` that says it is reading; a refusal is the refusal panel under the title, which stays. The shared detail rows (`entities/vendor`, `DetailList` and `Detail`) take Rule lines in place of Edge, and 14 pixels above and below, so a row of one line is 48 pixels, as a table's row is. A link in a value stays 44 pixels high and reaches into the row's padding, so its words stand level with the detail's name (found in the captures: the Instagram name sat 12 pixels below its name).
4. `feat`, `a211e28`: **the contact details form** is at most 40rem wide, as the Offer form is; from 40rem the two phone numbers share a row and every other detail has its own, so the Instagram name no longer stands beside an empty half (Taste's orphan cell); a label row with its Optional mark is as high as one without, so two details side by side start their controls on one line (a test found the WhatsApp field 0.75 pixels below the phone number's); Save is as wide as the form on a phone and says "Saving…" while the details are on their way (`ContactDetailsForm.saving`, the words of `OfferForm.savingChanges` in each language).

**Shared code touched.** `entities/vendor/ui/vendor-details.tsx` (`DetailList`, `Detail`) is shared with ticket 09's Vendor page in the Admin console, which takes the Rule lines and the 48-pixel rows with it, as DESIGN.md says both share them. The shared components in `shared/ui` were not changed. Ticket 11's frame (`app/layouts/vendor-portal-frame.tsx`) was not touched; see the plain messages below.

**Motion.** Emil's `emil-design-eng`, asked what moves on these screens: none of them performs an entrance (a route change holds still, Motion 9); the sketches give way to the values in one frame, with no fade, as the data holds still; "Saving…" replaces "Save" at once, the button keeping its place; the refusal panel arrives as Motion 6 says (the shared alert); Try again, Edit, Save and the not-found links take the press (Motion 1) through `buttonVariants`; Try again then leaves the page, so it needs no busy state of its own. Nothing new needed a reduced-motion variant.

### 22 October 2026: how each skill was run

- **`mattpocock-skills:tdd`**, loaded through the Skill tool. The owner was not answering while I ran, so I chose the seams, as tickets 01 and 07 did: the screens in a real browser, through Playwright. Red first, all eight for the right reason (`red-1`, 8 failed and 20 passed): both "not found" screens had no icon, the failed login no heading, the details screen two groups and no title while reading, Save 62 pixels wide on a phone and the form 720 pixels at a desk. Then green.
- **Taste** (`design-taste-frontend`, its app-screens chapter, inside the chosen sheet restored into `.taste-skill/direction.json` from `apps/dashboard/design/taste/`): the layout of the forms and states (§8, §11) and `inspect.mjs --app` through `pnpm dashboard:inspect`.
- **Emil**: `emil-design-eng` with the question above, and `break-ui` on the details screen (below).
- **Impeccable** (`impeccable`, `impeccable context --target apps/dashboard/src`, its `harden` and craft floor): the words are the portal's own, and DESIGN.md is corrected (below). No skill refused to load.

### 22 October 2026: Emil's break-ui on the details screen

The worst case entered at the API's boundary, as the skill asks: a test answers the Vendor's `GET` with the longest name the API takes (100 characters, "Made-up Computer, Laptop and Gaming Accessories Trading Company of the Fictional Bazaar in Erbil" and dots), the longest address (300 characters, two lines of street and a pasted Google Maps link with no space in it), and every optional detail left out (the map location, the WhatsApp number, the Instagram name, the opening hours). Limits from `entities/vendor/model/longest.ts`, which says the API's. Seen at 1440, 768 and 360 in both schemes, in English and Kurdish (`#s3` on the review page, with its Demo data / Worst case toggle).

| # | Severity | Field | Worst case | What happened | Fix |
|---|---|---|---|---|---|
| 1 | Ugly | a link in a value | the Instagram name, the map's link | The link, 44 pixels high for a thumb, pushed its words 12 pixels below the detail's name | It reaches into the row's padding, so its words stand level with the name and the row keeps its height |
| 2 | Ugly | the contact form's rows | the Instagram name | It stood alone beside an empty half from 40rem | A row of its own |

**Held up**: the 100-character name wraps in its column; the address's unbroken link breaks inside its column (`wrap-break-word` from the frame) and nothing scrolls sideways at 360 (the test checks it, with `expectAccessible`); each detail left out says "None" alike; Kurdish, left out or written in Arabic script with Arabic-Indic digits, keeps its own direction. The test stays as the regression test (`vendor-portal.spec.ts`).

### 22 October 2026: tests that changed, and why

No test lost an assertion.

- `vendor-portal.spec.ts`: the portal's "not found" test adds that the screen is the empty state (`expectTheEmptyState`, new in `empty-state.ts`: a plain icon above a centred title). New: the details' three groups, each after its heading; the details screen while the Vendor is read; break-ui's worst case with `expectAccessible`.
- `dashboard-languages.spec.ts`: the details screen's "its text differs" adds the groups' headings to what differs in each language; the failed login's test adds Try again, in the remembered language, and no sideways scroll; new, the portal's "not found" screen passes `checkInEveryLanguageOfTheVendorPortal` and its title and link differ in each language.
- `dashboard-login.spec.ts`: new, the failed login is the empty state with `expectAccessible`, and Try again starts the login again (a request to Keycloak's authorization endpoint), fails again while the token stays refused, and opens the Admin console once it is not.
- `vendor-contact-details.spec.ts`: new, Save as wide as the form on a phone, saying so and waiting while the details are on their way; at 1280 pixels the form at most 40rem, the phone numbers on one line, Save as wide as its words, `expectAccessible`.
- `admin-not-found.spec.ts`, new: the Admin console's "not found" at 360 and at 1280, the empty state, its sentence, no sideways scroll, `expectAccessible`, and its link to the Catalog. The screen had no test before.

### 22 October 2026: DESIGN.md corrected

With Impeccable's `document`, where building taught something: a Vendor's details are 48-pixel rows closed by Rule lines, a link in a value reaches into the row's padding, a detail left out says "None", the first group's heading is "Vendor", and the contact form's width, rows and busy Save; the details screen while the Vendor is read; and two new states, a screen not found and a login that could not be completed, which DESIGN.md did not draw (`c92bd0e`).

### 22 October 2026: the checks

- `pnpm check` passed before each of the four commits, on exactly what each committed.
- `pnpm platform:check` on `a211e28`, under the scratchpad's e2e lock: **179 passed**, none failed or flaky (5.6 minutes).
- **Taste's inspector**, `pnpm dashboard:inspect <address> --scheme light|dark --app --widths 1440,768,360` (run as `node apps/inspector/src/main.ts`), with the API and the dashboard started from this worktree under the lock and `apps/dashboard/design/taste/direction.json` restored into `.taste-skill/` (the direction's allowances: none). The portal's screens acting as the made-up shop's Vendor, `--language en` and `--language ckb`. Photographs in the owner's checkout at `.taste-skill/redesign-13/inspect/`.

| Screen | English, light / dark | Kurdish, light / dark |
|---|---|---|
| The details screen | 0 FAIL, 0 WARN / 0 FAIL, 0 WARN | 0 FAIL, 0 WARN / 0 FAIL, 0 WARN |
| The contact details form | 0 FAIL, 0 WARN / 0 FAIL, 0 WARN | 0 FAIL, 0 WARN / 0 FAIL, 0 WARN |
| The portal's "not found" | 0 FAIL, 2 WARN / 0 FAIL, 2 WARN | 0 FAIL, 2 WARN / 0 FAIL, 2 WARN |
| The Admin console's "not found" (English only) | 0 FAIL, 2 WARN / 0 FAIL, 2 WARN | |

  The WARNs, defended: on both "not found" screens `hero-void` at 1440 (the sheet below the empty state holds nothing, 60% and 73% of the first screen) and, in the Admin console, `panel-void` for the same band: a screen whose only content is that there is no screen at that address is empty by its nature, and the state sits where a screen's content starts, as DESIGN.md's empty state does; the alternative, the state centred in the window's height, is choice 1 for the owner. On the portal's at 360, `blank-gap`, 104 pixels between the old frame's rule and the state's own top Rule line, two lines that ticket 11's frame, with no rule under its bar, removes; to be inspected again after the merge.
- **Not reachable through the inspector**: the failed login and the two plain messages (the inspector logs in as the Admin, and acting as a Vendor never shows them). They are captured by a throwaway Playwright spec instead, in both schemes at the three widths (deleted after; it made one made-up Vendor through the e2e helpers, as every e2e run does), and `expectAccessible` passes on each in the end-to-end tests.
- 360 pixels first, logical classes only and Feature-Sliced Design's import rules: the dashboard's lint passes in `pnpm check`; the details page imports only `entities` and `shared`, the failed login only `shared`.
- Corrected on 1 November 2026, by the code review's fixes ([review-fixes.md](../review-fixes.md)): this said that nothing was written to the development database by the redesign's tooling. The inspector only reads, and the break-ui worst case was answered in the browser, but the capture of the failed login and the plain messages, a throwaway spec of this ticket's, made one made-up Vendor in the development database through the e2e helpers, against the spec's "Nothing is written to the development database". The end-to-end tests make their own made-up Vendors as every run does; the capture is the redesign's tooling, and should have answered its Vendor in the browser as the inspector does. The Vendor stays, as the e2e runs' leftovers do, since Vendors are never deleted.

### 22 October 2026: for the owner

**Waiting on ticket 11.** The plain messages for a Login with no Vendor and for a deactivated Vendor are drawn by the Vendor portal's frame (`PlainMessage` in `app/layouts/vendor-portal-frame.tsx`), which ticket 11 owns and is rebuilding in parallel; DESIGN.md gives them the frame's top bar with its switches and Log out and one plain sentence on the sheet. This branch has not touched that file. Once ticket 11 is merged into `redesign/integration`, this branch merges it, gives the sentence its place on the sheet if the frame leaves that to the screen, re-runs the inspector on the portal's screens in the new frame, finishes the table of routes below, and runs `pnpm platform:check` again. Until then the first, second, fourth and fifth boxes stay open.

The review page is `.taste-skill/redesign-13/index.html` in the owner's checkout (served from `.taste-skill` on port 4110), with switches for the width (1440, 768, 360) and the scheme: the details screen in English and Kurdish (`#s1`), while it is read (`#s2`), break-ui's worst case with its Demo data / Worst case toggle (`#s3`), the contact form and a refusal (`#s4`), the portal's "not found" (`#s5`), the Admin console's (`#s6`), the failed login (`#s7`), the plain messages still in the old frame (`#s8`), the inspector's results (`#s9`) and the choices (`#q`).

Choices to confirm or change, each as built and its alternative:

1. **Both "not found" screens as the empty state**, its title in the Section type, centred, at the sheet's head; or a plain screen with the 22-pixel title on the start side, as before; or the state centred in the window's height (the inspector's `hero-void`).
2. **Try again on the failed login**, which starts the login again; or the message alone, as before.
3. **The failed login on the Sheet with no frame** at every width; or the Stone Frame around a sheet from 64rem.
4. **"Vendor" as the heading of the details' first group** (فرۆشیار, البائع, drafts for the translations' review); or "Your shop"; or that group with no heading.
5. **The details screen drawn while it is read**, values sketched; or the one sentence "Reading your details…", as before.
6. **"None" for a detail left out**, in words; or a Note Grey dash, as Taste's chapter draws a missing value.
7. **The Instagram name on a row of its own** in the contact form from 40rem; or at half width beside an empty half, as before.

### 22 October 2026: the owner's answers

The owner saw `.taste-skill/redesign-13/index.html` in the built-in browser and answered the seven choices:

| Choice | The owner's word | Result |
|---|---|---|
| 1. Both "not found" screens as the empty state at the sheet's head | "Centred in window" | **Changed**, below |
| 2. Try again on the failed login | "Keep Try again" | Kept as built |
| 3. The failed login on the Sheet with no frame | "Plain screen" | Kept as built |
| 4. "Vendor" as the heading of the details' first group | "\"Vendor\" (as built)" | Kept as built |
| 5. The details screen drawn while it is read, values sketched | "Placeholder bars" | Kept as built, and its values now arrive without a jump, below |
| 6. "None" for a detail left out | "\"None\"" | Kept as built |
| 7. The Instagram name on a row of its own | "Own row" | Kept as built |

**Centred in the window**, test-first. A new check in `empty-state.ts`, `expectCentredInTheWindow` (the state's middle, from the top of its icon to the foot of its link, within 8 pixels of the window's middle, and the page not scrolling), added to the Admin console's "not found" test at 360 and 1280 and to the portal's at 360, failed first on all three (the state's middle at 183, 170 and 296 pixels against the window's 370, 400 and 370), then passed. The empty state stays on the sheet, inside its frame; a hook of `shared/lib`, `useCentredInTheWindow`, reaches it down to the window's foot, less what the frame keeps below it, and pads its foot by as much as the frame takes above it, so that its content stands at the window's middle in either frame, measured before the first paint and again when the page changes size (the frame's height can change with the language). As the whole screen, it lost its two Rule lines, which set an empty state apart from a screen's other parts. A first version measured inside the ResizeObserver's own turn and made Vite report "ResizeObserver loop completed with undelivered notifications"; it now measures in the next frame and sets only what changed. DESIGN.md's "A screen not found" says so.

**The owner on motion** (the brief's note of 22 October: no rigid snaps; watch every movement slowed; with reduced motion nothing jumps a layout in one frame), applied to what moves on these screens:

- **The placeholder bars giving way to the values.** The address and the opening hours take two lines where their bars took one, so the rows below jumped down in one frame. Each value that takes a bar's place now grows from the bar's height to its own while it fades in, 200 ms on the ease-out curve, with the Web Animations API (a height set by its content cannot be a CSS transition), and with reduced motion in 150 ms, still growing; a value read before the screen opened is there at once. Test-first: a new line for each motion setting, which records the page's animations and finds the address's, failed first ("the address arrives with a movement", none), then passed.
- **Save's words.** At a desk's width "Save" became "Saving…" and the button widened by 21 pixels in one frame. Both words now hold the button's width, the one not said hidden, so it keeps its width; a new line at 1280 pixels failed first (62 against 83 pixels), then passed.
- **Slowed four times.** A throwaway spec (deleted after) slowed the page's animations to a quarter through the DevTools protocol and recorded where the Login group's heading stood in each frame while the details arrived at 360 pixels, with the address, the map location and the opening hours each taller than its bar. With full motion it travelled its 112 pixels over 43 frames, at most 10 pixels in a frame, the first; with reduced motion over 32 frames, at most 13.3. Before this change the same 112 pixels were one frame. Eight frames of each, a tenth of a second apart, are in `.taste-skill/redesign-13/motion/` in the owner's checkout; looked at, the values fade in as their rows open, with nothing jumping.
- **Still, as before**: both "not found" screens and the failed login open still (a route change, Motion 9); the presses are the shared buttons'.
- **Found, not changed here**: a field's refusal in the contact form (`FieldError`) and the refusal panel above it appear in one frame and push what is below them down. Both are shared components of `shared/ui`, used by every form of tickets 08, 09 and 12, so the change belongs with them or with the coordinator, not this screen.

**Tests added for the answers**, none losing an assertion: `expectCentredInTheWindow` in the two "not found" tests; in `vendor-portal.spec.ts` the values' arrival, once with full and once with reduced motion; in `vendor-contact-details.spec.ts` Save keeping its width at 1280 pixels while it says it is saving, and both of Save's tests now compare its words as drawn (`useInnerText`), since the word not said is in the button, hidden.

**The checks after the answers**, on `1828a4e`: `pnpm check` before each of the two commits (`e1762f2`, the centring, and `1828a4e`, the movements); the four touched spec files and the language tests, 59 passed, then the "not found" and portal specs again after the ResizeObserver fix, 16 passed. Taste's inspector again on every screen, light and dark, English and Kurdish (in `.taste-skill/redesign-13/inspect-2/`): 0 FAIL throughout; the details screen and the contact form 0 WARN; both "not found" screens still 2 WARN, now `hero-void` at 1440 for the 40% of the first screen below the centred state (the band above it is the same size) with, in the Admin console, `panel-void` for it, and on the portal's at 360 `blank-gap` above the state under the old frame. The owner chose the centred state with that space around it; the space is the screen's, not a hole in it, so both stay as defended WARNs. The review page's captures of both "not found" screens were taken again.

**Still waiting on ticket 11**: as before, the plain messages, the inspector on the portal's screens in the new frame, the table of routes and `pnpm platform:check` after the merge. The first, second, fourth, fifth and seventh boxes stay open until then; the seventh because the plain messages have not yet been shown to the owner in their own look.

### Every route, and the ticket that rebuilt it

From `app/admin-console-router.tsx`, `app/vendor-portal-router.tsx` and `app/vendor-portal-screens.tsx` as they stand on this branch after merging `redesign/integration` at `4d03eb4`, and the one screen drawn outside both routers. "Merged" says whether the rebuilding ticket is on `redesign/integration`: brought up to date on 1 November 2026 by the code review's fixes, every one is, ticket 13 at `89a9970` and ticket 12 at `0757905`.

**The Admin console's router**

| Address | Screen | Rebuilt in | Merged |
|---|---|---|---|
| `/` (its frame) | The Admin console's frame: sidebar, top bar, menu sheet, scheme switch | 07 | yes |
| `/` (index) | Sends the Admin to `/catalog` | (no screen of its own) | |
| `/catalog` | The Catalog | 07 | yes |
| `/catalog/new` | Choosing a Category for a new Part | 08 | yes |
| `/catalog/new/:category` | The new Part's form | 08 | yes |
| `/catalog/parts/:partId` | A Part's page | 08 | yes |
| `/catalog/parts/:partId/edit` | A Part's edit form, and adding a photo | 08 | yes |
| `/vendors` | The Vendors | 09 | yes |
| `/vendors/new` | The new Vendor's form and the hand-over | 09 | yes |
| `/vendors/:vendorId` | A Vendor's page: its details, the reset, deactivating and reactivating | 09 | yes |
| `/vendors/:vendorId/edit` | A Vendor's edit form | 09 | yes |
| `/missing-specifications` | The Missing specifications | 10 | yes |
| `/missing-specifications/parts/:partId/edit` | A Part's edit form, beside the list it returns to | 08 (the form), 10 (the list) | yes |
| `/expiring-offers` | The Expiring Offers | 10 | yes |
| `*` | The Admin console's "not found" | 13 | yes |
| `/vendors/:vendorId/portal` (its frame) | The Vendor portal's frame with the band, the Admin acting as a Vendor | 11 | yes |
| `/vendors/:vendorId/portal/…` | The Vendor portal's screens, as below | as below | |

**The Vendor portal's screens** (`vendorPortalScreens`, under either frame)

| Address | Screen | Rebuilt in | Merged |
|---|---|---|---|
| (index) | The Offers, with their tabs, the expiry banner and Confirm all | 11 | yes |
| `add` | The catalog search and the note after an Offer is added | 12 | yes |
| `add/:partId` | The Offer form for a new Offer | 12 | yes |
| `offers/:offerId` | An Offer's own screen, its removal, an Offer that no longer exists | 12 | yes |
| `details` | The details screen | 13 | yes |
| `details/contact-details` | The contact details form | 13 | yes |
| `*` | The portal's "not found" | 13 | yes |

**The Vendor portal's router**

| Address | Screen | Rebuilt in | Merged |
|---|---|---|---|
| `/` (its frame) | The Vendor portal's frame for a Vendor's own Login | 11 | yes |
| `/` (its frame) | The plain message for a Login with no Vendor, and for a deactivated Vendor | 11 (the frame), 13 (the message) | yes |
| `/…` | The Vendor portal's screens, as above | as above | |

**Outside both routers**

| Where | Screen | Rebuilt in | Merged |
|---|---|---|---|
| `app/login-failed.tsx`, at any address | The login that could not be completed | 13 | yes |

Every route has a ticket that rebuilds it, and with 12 and 13 merged no screen is left in the old look.

### 28 October 2026: in ticket 11's frame, with tickets 08 and 09 merged

**The merges.**
- `6381ceb` merged `redesign/integration` at `b24caf9`, bringing tickets 10 and 11 in.
- `0f33e46` merged it at `4f1b9cf`, bringing ticket 09 in. It also brought Next.js 16.4.3 and `BusyLabel` and `AlertDialogRefusal`, and ticket 09's line direction and wrapping in the shared detail rows, which keep ticket 13's Rule lines and 48-pixel rows.
- `792c767` merged it at `4d03eb4`, bringing ticket 08 in, with `OpeningSpace`, `ScreenTitle` and the motion film.
- Each conflict was in DESIGN.md (Rows, States, Motion 6 and its reduced-motion row) or in `shared/lib/index.ts`, `vendor-portal.spec.ts` or `entities/vendor/ui/vendor-details.tsx`. Each was resolved by keeping both sides. `pnpm check` passed on each merge, and no migration came in.

**The plain messages** (`22b9a8e`), test-first.
- The tests failed first, for the right reason:
  - `expectTheEmptyState` and `expectCentredInTheWindow` were added to the "no Vendor" test of `vendor-portal.spec.ts` and to the deactivation test of `admin-deactivate-vendor.spec.ts`. Both failed first: no icon on the sheet.
  - `expectCentredInTheWindow` now takes a state with no link or button, measuring to its sentence.
- The fix:
  - In ticket 11's frame, both messages are the dashboard's empty state, centred in the window's height as the "not found" screens are. A crossed person marks no Vendor and a circled slash marks a deactivated Vendor, then comes the sentence in the Body type, with no heading and no action, as ticket 11's test asks.
  - The switches and Log out stay in the top bar on a desk and behind the menu on a phone, as the owner chose in ticket 11 ("Behind the menu").
- **A fault found on the way.**
  - The frame draws its desk and phone layouts anew when the window crosses 64rem, and the message's element with them, while the message itself stays mounted.
  - `useCentredInTheWindow` kept measuring the element that had gone, and left the new one at the sheet's head. The first captures showed it.
  - A line in the "no Vendor" test that crosses to a desk and back failed first: the message's middle was at 161 against the window's 400.
  - The hook now gives a callback ref, so each new element is measured as it enters the page.
  - A first try at that line in `admin-not-found.spec.ts` passed even before the fix, because there the whole screen remounts with the frame. It was dropped as not testing the fault.
- DESIGN.md's Navigation says how the messages are drawn.

**The contact form's refusal panel** (`c10c0a3`).
- With ticket 08 merged, every form's field refusals open their room in the shared `OpeningSpace`, so the contact form's own already did. Its refusal panel above the form did not, so it now lies in `OpeningSpace` as the Part's form does.
- A new test films the form slowed four times with ticket 08's `motion-film.ts`, as the platform fails to answer. It failed first: the address field stepped 120 pixels in one frame.
- This closes the "found, not changed here" note of 22 October.

**Tests that changed since**, none losing an assertion:
- `vendor-portal.spec.ts`: the "no Vendor" test adds the empty state, the centring, and the crossing to a desk and back.
- `admin-deactivate-vendor.spec.ts`: the deactivation test adds the empty state and the centring.
- `empty-state.ts`: the centring check takes a state with no control.
- `vendor-contact-details.spec.ts`: new, the refusal panel opening without a jump.

**The checks on `c10c0a3`.**
- `pnpm check` passed before each commit.
- `pnpm platform:check` under the e2e lock: **233 passed**, none failed or flaky (10.3 minutes).
  - An earlier run of the four touched specs (before `c10c0a3`) failed once in `admin-deactivate-vendor.spec.ts` at ticket 09's `expectAccessible` on the Admin's page ("Execution context was destroyed, most likely because of a navigation"), before any of ticket 13's lines. The file then passed alone, 5 of 5, and in both full runs. It is recorded as a flake of that line.
- **Taste's inspector**, on the portal's screens in ticket 11's frame acting as the made-up shop, English and Kurdish, light and dark, and on the Admin console's "not found", at 1440, 768 and 360 (in the owner's `.taste-skill/redesign-13/inspect-4/`):
  - **0 FAIL** throughout.
  - The details screen: 0 WARN.
  - Both "not found" screens: `hero-void` and `panel-void` at 1440 for the space around the centred state, which the owner chose ("Centred in window"). Defended as before.
  - The contact form: a new `hero-void` at 1440, the 540 pixels of the sheet beside the form, which is at most 40rem wide as the Offer form is. In the old portal frame, which was 48rem wide, the sheet ended near the form. It is put to the owner below.
  - The two plain messages cannot be reached logged in through the inspector (it logs in as the Admin). They were captured by a throwaway Playwright spec (deleted after; it made one made-up Vendor through the e2e helpers, as every e2e run does) in both schemes at the three widths, with `expectAccessible` passing on each in the end-to-end tests.
- The routes table below is finished: 07, 08, 09, 10 and 11 are merged; 12 is not yet.

### 28 October 2026: for the owner, the last look

The review page `.taste-skill/redesign-13/index.html` in the owner's checkout (port 4110) now shows every portal screen in ticket 11's frame, and the plain messages in their own look at `#s8`, with the menu sheet open over one. Box 7 stays open for that look, and the Status stays.

1. **The plain messages as the empty state, centred in the window**, a crossed person or a circled slash above the sentence, matching the "not found" screens. The alternative is the sentence alone at the sheet's head, as ticket 11 left it.
2. **The contact form at most 40rem wide** on a desk, as the Offer form is, leaving the sheet's end side empty at 1440 (the inspector's `hero-void`). The alternative is the form taking the sheet's width, with the two phone numbers still sharing a row.

The record is otherwise ready to close: when the owner has looked, record the answers, tick box 7, and set the Status to resolved in `docs: close redesign ticket 13`.

### 28 October 2026: the owner's last look, and closed

The owner saw `.taste-skill/redesign-13/index.html` in the built-in browser and answered the two choices:

| Choice | The owner's word | Result |
|---|---|---|
| 1. The plain messages as the empty state, centred in the window | "Centred state (Recommended)" | Kept as built |
| 2. The contact details form at most 40rem wide on a desk | "Full width" | **Changed**, below |

**Full width**, built test-first.
- The desk-width test of `vendor-contact-details.spec.ts` asked for a form at most 640 pixels wide. It now asks for:
  - a form wider than that;
  - the address beside the map location, the phone number beside the WhatsApp number, and the Instagram name beside the opening hours;
  - no detail wider than half the form;
  - Save as wide as its words.
- It failed first on the 640-pixel form, then passed.
- The form lost its 40rem cap and became a container. Its details follow the form's own width, by the rule the owner approved for the Part's and the Vendor's forms ("Follow width", tickets 08 and 09): one to a row under 40rem and two to a row from 40rem, with no detail spanning both columns. On a phone, Save stays as wide as the form.
- This replaces the owner's "Own row" of 22 October for the Instagram name: it now stands beside the opening hours, so it neither stretches across the sheet nor stands beside an empty half.
- DESIGN.md says so, and says that the Offer form keeps its own 40rem cap unless the owner says otherwise.
- Commit `6ce3761`. The test is listed under the tests changed: the owner's choice changed what it asks, and it lost no assertion (it gained four).

**Taste's inspector on `6ce3761`**, at 1440, 768 and 360, English and Kurdish, light and dark, in the owner's `.taste-skill/redesign-13/inspect-5/`:
- 0 FAIL throughout.
- The 40rem `hero-void` on the contact form is gone.
- In its place, `panel-void` at 1440: 120 pixels in English (89 in Kurdish) under the one-line Instagram name, beside the opening hours, which take a textarea's three lines. Defended: the two are top-aligned in their row, and the band closes at the row's foot.
- The details screen: 0 WARN.
- Both "not found" screens: the defended `hero-void` and `panel-void` of the centred state the owner chose.

**`pnpm platform:check` on `6ce3761`.**
- The first run under the lock had 231 passed and 2 failed, both in ticket 08's specs, which this ticket did not touch:
  - `admin-edit.spec.ts:162`: the Category icon still counted after a photo was added.
  - `admin-part.spec.ts:341`: a group of PCIe slots still counted after a list was made not known.
  - Both read a state that ticket 08's motion leaves in place for a moment.
- Re-run alone, both files passed (37 of 37).
- The second full run: **233 passed**, none failed or flaky (10.5 minutes). The two failures of the first run are recorded as flakes of ticket 08's timing.

Every box is ticked, and the ticket is resolved.
