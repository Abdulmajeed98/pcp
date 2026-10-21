# 13: The portal's details and the remaining screens

**Spec:** [the redesign spec](../spec.md)

**What to build:** The last screens of the dashboard take the new look, so that no screen is left in the old one: the portal's details screen and its contact details form, the plain messages for a Login with no Vendor and for a deactivated Vendor, the portal's and the Admin console's "not found" screens, and the screen shown when the login fails.

**Blocked by:** 11

**Status:** ready-for-agent

- [ ] The details screen, the contact details form, the two plain messages, both "not found" screens and the failed login follow the new DESIGN.md and move as its Motion section says.
- [ ] Each that can be reached logged in passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command; the portal's in Kurdish and in English.
- [x] Emil's `break-ui` is run on the details screen: a long address, every optional detail missing. What broke is fixed.
- [ ] The portal's screens pass `checkInEveryLanguageOfTheVendorPortal`. `expectAccessible` passes on each screen in the accessibility tests' list, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [ ] No screen of the dashboard is left in the old look: each route in both routers is listed under Comments with the ticket that rebuilt it.
- [x] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [ ] The screens are shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building them taught something.
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
- Nothing was written to the development database by the redesign's tooling: the inspector only reads, and the break-ui worst case was answered in the browser. The end-to-end tests and the capture made their own made-up Vendors, as e2e runs always do.

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

### Every route, and the ticket that rebuilt it

From `app/admin-console-router.tsx`, `app/vendor-portal-router.tsx` and `app/vendor-portal-screens.tsx`, and the one screen drawn outside both routers. A draft until ticket 11's frame is merged: the frames' rows name 11 as their owner.

**The Admin console's router**

| Address | Screen | Rebuilt in |
|---|---|---|
| `/` (its frame) | The Admin console's frame: sidebar, top bar, menu sheet, scheme switch | 07 |
| `/` (index) | Sends the Admin to `/catalog` | (no screen) |
| `/catalog` | The Catalog | 07 |
| `/catalog/new` | Choosing a Category for a new Part | 08 |
| `/catalog/new/:category` | The new Part's form | 08 |
| `/catalog/parts/:partId` | A Part's page | 08 |
| `/catalog/parts/:partId/edit` | A Part's edit form, and adding a photo | 08 |
| `/vendors` | The Vendors | 09 |
| `/vendors/new` | The new Vendor's form and the hand-over | 09 |
| `/vendors/:vendorId` | A Vendor's page, the reset, deactivating and reactivating | 09 |
| `/vendors/:vendorId/edit` | A Vendor's edit form | 09 |
| `/missing-specifications` | The Missing specifications | 10 |
| `/missing-specifications/parts/:partId/edit` | A Part's edit form, returning to the list | 08 (the form), 10 (the list beside it) |
| `/expiring-offers` | The Expiring Offers | 10 |
| `*` | The Admin console's "not found" | 13 |
| `/vendors/:vendorId/portal` (its frame) | The Vendor portal's frame with the band, the Admin acting as a Vendor | 11 |
| `/vendors/:vendorId/portal/…` | The Vendor portal's screens, as below | as below |

**The Vendor portal's screens** (`vendorPortalScreens`, under either frame)

| Address | Screen | Rebuilt in |
|---|---|---|
| (index) | The Offers, the expiry banner and Confirm all | 11 |
| `add` | The catalog search and the note after an Offer is added | 12 |
| `add/:partId` | The Offer form for a new Offer | 12 |
| `offers/:offerId` | An Offer's own screen, its removal, an Offer that no longer exists | 12 |
| `details` | The details screen | 13 |
| `details/contact-details` | The contact details form | 13 |
| `*` | The portal's "not found" | 13 |

**The Vendor portal's router**

| Address | Screen | Rebuilt in |
|---|---|---|
| `/` (its frame) | The Vendor portal's frame for a Vendor's own Login | 11 |
| `/` (its frame) | The plain message for a Login with no Vendor, and for a deactivated Vendor | 11 (the frame), 13 (the message) |
| `/…` | The Vendor portal's screens, as above | as above |

**Outside both routers**

| Where | Screen | Rebuilt in |
|---|---|---|
| `app/login-failed.tsx`, at any address | The login that could not be completed | 13 |
