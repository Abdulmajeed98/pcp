# 12: Adding and changing an Offer

**Spec:** [the redesign spec](../spec.md)

**What to build:** The Vendor's way from a Part to an Offer is rebuilt to the new DESIGN.md: the portal's catalog search with the note after an Offer is added, the Offer form, an Offer's own screen with the same form filled in, and removing an Offer through its dialog. It is laid out for a phone first, in the three languages and both directions.

**Blocked by:** 11

**Status:** ready-for-agent

- [ ] The catalog search, the Offer form, an Offer's screen, the removal's dialog and an Offer that no longer exists follow the new DESIGN.md and move as its Motion section says, mirrored in right-to-left.
- [ ] Each passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command, in Kurdish and in English.
- [ ] Emil's `break-ui` and `mobile-native` are run on the search and the form: a long Part name, nothing found, every field refused; typing a price with a thumb at 360 pixels. What broke is fixed.
- [ ] Each passes `checkInEveryLanguageOfTheVendorPortal`. `expectAccessible` passes on each screen in the accessibility tests' list, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [ ] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [ ] The screens are shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building them taught something.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
