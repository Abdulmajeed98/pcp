# 01: The WhatsApp chat address, Google Maps' address and the reading of digits, shared by both frontends

**Spec:** [the browse spec](../spec.md)

**What to build:** This ticket refactors before the Shopper pages need these rules. The dashboard holds three rules that the Shopper app needs too: WhatsApp's chat address for a phone number, Google Maps' search address for a map location, and the reading of Western, Arabic-Indic and Eastern Arabic-Indic digits, with a number's separators dropped. Each moves, unchanged, into a shared library that both frontends may import under the boundary rules. The dashboard then imports each one from there, so each rule is written once. Nothing changes for the Admin or for a Vendor, and the existing end-to-end tests prove it.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] **The home.** The three rules go into a library that the boundary rules already let both frontends import, chosen by what each library is for, as the MVP spec describes them. If no library fits, the owner is asked before a new one is added, and the answer is recorded under Comments.
- [x] **Written once.** The dashboard's copies are gone, and every caller in the dashboard imports from the library. Their comments go with them, unchanged in what they say.
- [x] **No change in behaviour.** The Admin's WhatsApp hand-over, Expiring Offers' WhatsApp link, a Vendor's map location and a price or a Platform Rate typed in Arabic-Indic digits all work as before.
- [x] The import bans are written again with `pnpm boundaries:write` if the move needs it, and `pnpm boundaries:check` passes.
- [x] `pnpm platform:check` passes on every line, with no test changed: in particular the hand-over's, Expiring Offers', the contact details', the Offer form's and the Platform Rate's.
- [x] `pnpm check` passes with Docker stopped.
- [x] The work is committed, leaving `pnpm check` passing.

## Comments

### 3 November 2026: the reading of digits, moved

The reading of digits has a home by the MVP spec's own description: `@pcp/i18n`, beside `formatNumber`, which writes every number in Western digits (LANG-5). `westernDigitsIn` and `westernNumberIn` read back what a Kurdish or an Arabic keyboard types, so they are the same rule's other half. `apps/dashboard/src/shared/lib/western-digits.ts` moved to `libs/i18n/src/western-digits.ts` as a pure rename (100% similar), with its comments, and `i18n`'s index exports both. The Shared layer's index no longer does. The Offer form's values, the Platform Rate's reading and the map location field import them from `@pcp/i18n`.

Test first, at seam 1: the three callers were pointed at `@pcp/i18n` before it exported anything, and the dashboard's type check failed on exactly those three imports (TS2305, "has no exported member"). After the move `pnpm check` passed. Committed as `c848f3c`. `pnpm platform:check` has not run yet: it runs once, after both moves.

### 3 November 2026: for the owner

**AWAITING OWNER REVIEW.** WhatsApp's chat address (`whatsAppChatWith`) and Google Maps' search address (`googleMapsSearchFor`) fit none of the libraries both frontends may import, by what the MVP spec says each is for: `api-client` is the API's generated client, `ui` the components that carry no look and the themes, `i18n` the text and the writing of numbers, `compatibility` the Compatibility Rules, `opendb` OpenDB's details. The review page is `.taste-skill/browse-01/index.html`, the choice under `#d1`.

1. **A new library, `@pcp/links`** (the name is the owner's), for the addresses both frontends link out to: plain TypeScript importing nothing, tagged `scope:web` and `type:lib`, so the constraints as they stand let both frontends import it. Recommended: every library keeps to what it is for, as `opendb` was added rather than stretch another.
2. **Into `@pcp/ui`**, with its description in the MVP spec and ADR-0007 widened to "and the addresses their links open". No new project, but it blurs what `ui` is for.
3. **All three in one new library**, `c848f3c` undone.

Under every choice `googleMapsSearchFor` takes a latitude and a longitude by shape instead of `api-client`'s `MapLocationResponse`, since a library may import no other library.

### 4 November 2026: the owner's answer

The owner chose the first: "New @pcp/links (Recommended)".

### 4 November 2026: the addresses, moved into `@pcp/links`

- **The library.** `libs/links`, named `@pcp/links`: plain TypeScript that imports nothing, set up as `opendb` is (`package.json`, `tsconfig.json`, `tsconfig.lib.json`), tagged `scope:web` and `type:lib`, so the constraints as they stood let both frontends import it, and no constraint changed. Its `tsconfig.lib.json` adds the DOM's types, as `ui`'s does, for `URLSearchParams`. Its entry exports `googleMapsSearchFor` and `whatsAppChatWith`. The root `tsconfig.json`, the dashboard's and the Shopper app's manifests and type-check references list it, and the lockfile links it. The Shopper app imports nothing from it yet; its Vendor page will (ticket 13).
- **Written once.** `apps/dashboard/src/shared/lib/whatsapp.ts` moved to `libs/links/src/whatsapp.ts` as a pure rename (100% similar). `googleMapsSearchFor` and its comment moved word for word from the Vendor entity's `model/map-location.ts` to `libs/links/src/google-maps.ts`; `coordinatesOf` and `mapLocationIn` stay in the entity, the second reading digits through `@pcp/i18n`. The one change is its parameter's type, a latitude and a longitude by shape instead of `api-client`'s `MapLocationResponse`, since a library may import no other library; every caller passes a `MapLocationResponse`, which has that shape. Neither the Shared layer's index nor the entity's exports them now. The hand-over, Expiring Offers' row, the Admin's Vendor page and the portal's details screen import them from `@pcp/links`.
- **Test first, at seam 1.** The four callers were pointed at `@pcp/links` before it existed, and the dashboard's type check failed on exactly those four imports (TS2307, "Cannot find module '@pcp/links'"). With the library in place `pnpm check` passed, for 12 projects. Committed as `87e7444`.
- **The boundary check.** The dashboard's imports prove on every lint that it may import the library. A new case in `tools/check-boundaries.mjs` proves the Shopper app's half: "The Shopper app: an import of @pcp/links is allowed". `pnpm boundaries:check` passed all 115 lines (114 before). Committed as `faba34d`. No ban needed writing again: no layer or segment was added.

### 4 November 2026: the fault

Planted by a script that refused a dirty tree, made one exact edit to the committed tree, ran `pnpm boundaries:check` and undid the edit; `git status` was clean afterwards.

| Fault | Failed |
|---|---|
| `@pcp/links` tagged `scope:api` instead of `scope:web` | `pnpm boundaries:check`, two lines: "The Shopper app: an import of @pcp/links is allowed", lint refusing it with Nx's "A project tagged with "scope:web" can only depend on libs tagged with "scope:web", "scope:shared""; and "@pcp/dashboard: lint reports nothing that was not planted", the same refusal on the four real imports |

### 4 November 2026: checks

On `faba34d`, `browse/integration` still at `4375afb`, so there was nothing to merge.

| Check | Outcome |
|---|---|
| `pnpm check` | Passed before each commit |
| `pnpm check --skip-nx-cache`, with `DOCKER_HOST` pointed at a socket that does not exist and `PLAYWRIGHT_BROWSERS_PATH` at an empty folder | Passed, 30 tasks for the 12 projects |
| `pnpm boundaries:check` | Passed all 115 lines |
| `pnpm platform:check`, under the e2e lock (`01`), no app on ports 3000 to 3002 before it | Passed all 288 lines in 10.7 minutes, with no test changed (`git diff 4375afb -- apps/e2e` is empty) |

Among the 288, the lines on the moved rules: the hand-over's link opening a WhatsApp chat with the login phone number and its message; Expiring Offers' row links and its table's links that still call and chat; the Admin's Vendor page, whose map link holds its coordinates; the details screen's map location linking to Google Maps' search, in the language tests; the location button filling the coordinates and the contact details sent as written; prices typed in Arabic-Indic and Eastern Arabic-Indic digits with separators, saved as their values; and a Platform Rate typed in Arabic-Indic digits with a separator, saved as its value.

`pnpm integration:check` was not needed: the API did not change.

### 4 November 2026: after merging `browse/integration`

`browse/integration` had moved to `e74ead9`, with ticket 02's endpoint and client, and merged without a conflict as `f7ee616`. On it `pnpm check` passed, `pnpm integration:check` passed (15 suites, 430 tests), and `pnpm platform:check`, under the e2e lock again, passed all 288 lines.
