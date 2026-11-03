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
