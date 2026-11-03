# 01: The WhatsApp chat address, Google Maps' address and the reading of digits, shared by both frontends

**Spec:** [the browse spec](../spec.md)

**What to build:** This ticket refactors before the Shopper pages need these rules. The dashboard holds three rules that the Shopper app needs too: WhatsApp's chat address for a phone number, Google Maps' search address for a map location, and the reading of Western, Arabic-Indic and Eastern Arabic-Indic digits, with a number's separators dropped. Each moves, unchanged, into a shared library that both frontends may import under the boundary rules. The dashboard then imports each one from there, so each rule is written once. Nothing changes for the Admin or for a Vendor, and the existing end-to-end tests prove it.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] **The home.** The three rules go into a library that the boundary rules already let both frontends import, chosen by what each library is for, as the MVP spec describes them. If no library fits, the owner is asked before a new one is added, and the answer is recorded under Comments.
- [ ] **Written once.** The dashboard's copies are gone, and every caller in the dashboard imports from the library. Their comments go with them, unchanged in what they say.
- [ ] **No change in behaviour.** The Admin's WhatsApp hand-over, Expiring Offers' WhatsApp link, a Vendor's map location and a price or a Platform Rate typed in Arabic-Indic digits all work as before.
- [ ] The import bans are written again with `pnpm boundaries:write` if the move needs it, and `pnpm boundaries:check` passes.
- [ ] `pnpm platform:check` passes on every line, with no test changed: in particular the hand-over's, Expiring Offers', the contact details', the Offer form's and the Platform Rate's.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The work is committed, leaving `pnpm check` passing.

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
